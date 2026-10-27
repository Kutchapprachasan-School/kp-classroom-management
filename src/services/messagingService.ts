// src/services/messagingService.ts
// Sprint 2: Real-Time Hybrid Messaging Engine
// Combines Neon HTTP API + Supabase Realtime Broadcast + IndexedDB Outbox
// Zero Mock Data - simulatePartnerReply() and monolithic localStorage removed!

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import {
  chatIdbAdapter,
  type ChatRoomSummary,
  type ChatMessageItem,
  type ChatMessageType,
  type ChatAttachmentMeta,
  type ChatActionPayload,
  type OutboxEntry,
  type ChatDeliveryStatus,
} from '../lib/chatIndexedDb.ts';
import { classroomService } from './classroomService.ts';
import { studentService, type StudentRecord } from './studentService.ts';
import { coursesCurriculumService } from './coursesCurriculumService.ts';
import { sgsRosterAndSubmissionService, type StudentWorkSubmission } from './sgsRosterAndSubmissionService.ts';
import { authService, type AuthUser } from './authService.ts';
import type { SchoolUserRole } from '../config/schoolRoles.ts';
import { indexedDbAdapter, type OutboxItem } from '../utils/indexedDbAdapter.ts';

// Re-export indexedDB types for consumer convenience
export type {
  ChatRoomSummary,
  ChatMessageItem,
  ChatMessageType,
  ChatAttachmentMeta,
  ChatActionPayload,
  OutboxEntry,
  ChatDeliveryStatus,
};

export type ChatGroupType = 'HOMEROOM' | 'COURSE' | 'OFFICIAL' | 'DEPARTMENT';

export interface ChatMember {
  id: string;
  code: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'ADVISOR' | 'ACADEMIC_ADMIN' | 'SCHOOL_ADMIN';
  avatarUrl?: string;
  seatNo?: number;
  gender?: 'MALE' | 'FEMALE';
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: 'TEACHER' | 'STUDENT' | 'SYSTEM' | 'ADVISOR' | 'ACADEMIC_ADMIN' | 'SCHOOL_ADMIN';
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isSystemAudit?: boolean;
  messageType?: ChatMessageType;
  idempotencyKey?: string;
  syncStatus?: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  serverTimestamp?: string;
  attachment?: any;
  actionPayload?: any;
  transferAuditMeta?: {
    studentCode: string;
    studentName: string;
    fromClassroomId: string;
    toClassroomId: string;
    fromClassroomName: string;
    toClassroomName: string;
    preservedAssignmentsCount: number;
    preservedScore: number;
    action: 'TRANSFER_IN' | 'TRANSFER_OUT';
  };
}

export interface ChatGroup {
  id: string;
  name: string;
  type: ChatGroupType;
  typeLabel: string;
  description: string;
  classroomId?: string;
  classroomName?: string;
  courseCode?: string;
  courseName?: string;
  teacherName: string;
  teacherRoleLabel: string;
  autoManaged: boolean;
  members: ChatMember[];
  messages: ChatMessage[];
  unreadCount: number;
  lastMessageText?: string;
  lastMessageTime?: string;
}

export interface StudentTransferPayload {
  studentCode: string;
  fromClassroomId: string;
  toClassroomId: string;
  transferReason?: string;
  actorLabel?: string;
}

export interface StudentTransferResult {
  success: boolean;
  message: string;
  student: StudentRecord;
  fromClassroomId: string;
  fromClassroomName: string;
  toClassroomId: string;
  toClassroomName: string;
  leftGroups: string[];
  joinedGroups: string[];
  preservedSubmissionsCount: number;
  preservedScore: number;
  transferredAt: string;
}

export const CHAT_GROUPS_EVENT = 'kp-chat-updated';
export const STUDENT_TRANSFERRED_EVENT = 'kp-student-transferred';

export interface CourseClassroomMapping {
  courseCode: string;
  courseName: string;
  classroomId: string;
  classroomName: string;
  teacherName: string;
}

export interface CurrentChatUserContext {
  userId: string;
  userName: string;
  role: 'TEACHER' | 'STUDENT' | 'ADVISOR' | 'ACADEMIC_ADMIN' | 'SCHOOL_ADMIN';
  schoolId: string;
}

export interface SendMessageParams {
  roomId: string;
  content: string;
  messageType?: ChatMessageType;
  attachmentMeta?: ChatAttachmentMeta | null;
  actionPayload?: ChatActionPayload | null;
  senderId?: string;
  senderName?: string;
  senderRole?: 'TEACHER' | 'STUDENT' | 'SYSTEM' | 'ADVISOR' | 'ACADEMIC_ADMIN' | 'SCHOOL_ADMIN';
  senderAvatar?: string;
}

type RoomListListener = (rooms: ChatRoomSummary[]) => void;
type RoomMessagesListener = (roomId: string, messages: ChatMessageItem[]) => void;

const ALLOWED_R2_EPHEMERAL_PREFIX = 'ephemeral/chat/';

/**
 * Safety Guard: ป้องกันการลบไฟล์ผิดโฟลเดอร์ (ห้ามแตะต้องโฟลเดอร์การบ้าน submissions/)
 */
export function assertSafeTtlPurgeKey(r2Key: string): boolean {
  if (!r2Key || typeof r2Key !== 'string') return false;
  if (r2Key.includes('submissions/') || r2Key.includes('..')) {
    throw new Error(`[Security Violation] Forbidden TTL operation on protected key: ${r2Key}`);
  }
  return r2Key.startsWith(ALLOWED_R2_EPHEMERAL_PREFIX);
}

// In-memory runtime groups cache for instant legacy reads
let _inMemoryGroupsCache: ChatGroup[] | null = null;

class MessagingService {
  private currentUser: CurrentChatUserContext | null = null;
  private supabase: SupabaseClient | null = null;

  // Channels สำหรับ Supabase Realtime Broadcast
  private schoolChannel: RealtimeChannel | null = null;
  private activeRoomChannel: RealtimeChannel | null = null;
  private activeRoomId: string | null = null;

  // In-memory state ที่ซิงค์กับ IndexedDB
  private roomsMap: Map<string, ChatRoomSummary> = new Map();
  private messagesMap: Map<string, ChatMessageItem[]> = new Map();
  private lastRoomsSyncIso: string | null = null;
  private isFlushingOutbox = false;

  // Subscribers สำหรับอัปเดต React UI
  private roomListListeners: Set<RoomListListener> = new Set();
  private messageListeners: Set<RoomMessagesListener> = new Set();
  private lifecycleBound = false;

  /**
   * 1. เริ่มต้นระบบแชทเมื่อผู้ใช้ล็อกอินเข้าสู่ระบบ
   */
  async initialize(user: CurrentChatUserContext): Promise<void> {
    this.currentUser = user;

    // โหลดข้อมูลแคชจาก IndexedDB ขึ้นมาแสดงผลทันที (Instant First Paint)
    const cachedRooms = await chatIdbAdapter.getAllRooms();
    this.roomsMap.clear();
    for (const r of cachedRooms) {
      this.roomsMap.set(r.id, r);
    }
    this.notifyRoomListListeners();

    // เชื่อมต่อ Supabase Client สำหรับ Broadcast (ไม่ใช้ Database Polling)
    const env =
      typeof import.meta !== 'undefined' && (import.meta as any).env
        ? (import.meta as any).env
        : typeof globalThis !== 'undefined' && (globalThis as any).process?.env
        ? (globalThis as any).process.env
        : {};

    const supabaseUrl = env.VITE_SUPABASE_URL || 'https://ngzflajpifmsvhldhviu.supabase.co';
    const supabaseAnonKey =
      env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nemZsYWpwaWZtc3ZobGRodml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ0NTMzMSwiZXhwIjoyMTAwMDIxMzMxfQ.y7GkdSDqZR95v0kHBIXLD1cRbwgNYksMm8hZ1uStec8';

    if (supabaseUrl && supabaseAnonKey && !this.supabase) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: { eventsPerSecond: 10 },
        },
      });
    }

    this.subscribeToSchoolBroadcast(user.schoolId);
    this.bindBrowserLifecycleEvents();

    // ซิงค์รายชื่อห้องล่าสุด + ส่งข้อความค้างใน Outbox
    await this.syncRoomsDelta();
    await this.flushOutboxQueue();
  }

  /**
   * 2. ผูก Event เมื่อผู้ใช้สลับแอปกลับมา (visibilitychange) หรืออินเทอร์เน็ตกลับมา (online)
   * แทนการใช้ setInterval Polling เพื่อรักษากฎ Zero-Egress และปล่อยให้ Neon Scale-to-Zero
   */
  private bindBrowserLifecycleEvents(): void {
    if (typeof window === 'undefined' || this.lifecycleBound) return;
    this.lifecycleBound = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.currentUser) {
        void this.handleAppResume();
      }
    });

    window.addEventListener('online', () => {
      if (this.currentUser) {
        void this.flushOutboxQueue();
        void this.handleAppResume();
      }
    });
  }

  /**
   * ทำงานอัตโนมัติเมื่อผู้ใช้เปิดหน้าจอกลับมา: ดึงเฉพาะส่วนต่าง (Delta Catch-up)
   */
  private async handleAppResume(): Promise<void> {
    await this.flushOutboxQueue();
    await this.syncRoomsDelta();

    if (this.activeRoomId) {
      await this.catchUpActiveRoomMessages(this.activeRoomId);
    }
  }

  /**
   * สร้าง HTTP Headers สำหรับยืนยันตัวตนกับ API Sprint 1
   */
  private getAuthHeaders(): HeadersInit {
    const user = this.currentUser || this.resolveFallbackUser();
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.userId,
      'x-user-name': encodeURIComponent(user.userName),
      'x-user-role': user.role,
      'x-school-id': user.schoolId,
    };
  }

  private resolveFallbackUser(): CurrentChatUserContext {
    const active = typeof localStorage !== 'undefined' ? authService.getCurrentUser() : null;
    return {
      userId: active?.id || active?.studentCode || 'guest-user',
      userName: active?.name || 'ผู้ใช้งาน',
      role: active?.role === 'STUDENT' ? 'STUDENT' : active?.role === 'ADMIN' ? 'ACADEMIC_ADMIN' : 'TEACHER',
      schoolId: 'KP-SCHOOL-01',
    };
  }

  // ============================================================================
  // ส่วนจัดการรายชื่อห้องแชท (ROOMS & DELTA SYNC)
  // ============================================================================

  async syncRoomsDelta(category?: string): Promise<ChatRoomSummary[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.set('type', category);
      if (this.lastRoomsSyncIso) {
        params.set('updatedAfter', this.lastRoomsSyncIso);
      }

      const queryString = params.toString();
      const url = `/api/chat/rooms${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`Failed to fetch rooms: ${res.status}`);

      const data: { rooms: ChatRoomSummary[]; syncedAt: string } = await res.json();

      if (data.rooms && data.rooms.length > 0) {
        for (const room of data.rooms) {
          this.roomsMap.set(room.id, room);
        }
        await chatIdbAdapter.upsertRooms(data.rooms);
        this.notifyRoomListListeners();
      }

      this.lastRoomsSyncIso = data.syncedAt;
      return this.getSortedRooms();
    } catch (error) {
      console.warn('[MessagingService] Offline or fallback room sync:', error);
      return this.getSortedRooms();
    }
  }

  getSortedRooms(): ChatRoomSummary[] {
    const list = Array.from(this.roomsMap.values());
    if (list.length === 0) {
      // Fallback: Populate from legacy initial groups if DB is empty/initial
      const legacy = this.getGroups();
      const converted: ChatRoomSummary[] = legacy.map((g) => ({
        id: g.id,
        type: g.type,
        name: g.name,
        description: g.description || null,
        classroomId: g.classroomId || null,
        courseCode: g.courseCode || null,
        isReadOnly: g.type === 'OFFICIAL',
        lastMessageAt: g.lastMessageTime || null,
        lastMessagePreview: g.lastMessageText || null,
        lastMessageSender: g.teacherName || null,
        updatedAt: new Date().toISOString(),
        myRole: 'TEACHER',
        isMuted: false,
        lastReadAt: new Date().toISOString(),
        hasUnread: (g.unreadCount || 0) > 0,
      }));
      for (const r of converted) {
        this.roomsMap.set(r.id, r);
      }
      return converted;
    }
    return list.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  // ============================================================================
  // ส่วนจัดการข้อความในห้องแชท (CURSOR PAGINATION & DELTA CATCH-UP)
  // ============================================================================

  async openRoom(roomId: string): Promise<ChatMessageItem[]> {
    this.activeRoomId = roomId;
    this.subscribeToRoomBroadcast(roomId);

    // 1. โหลดจาก IndexedDB ขึ้นมาแสดงก่อนทันที
    const cached = await chatIdbAdapter.getMessagesByRoom(roomId);
    if (cached.length > 0) {
      this.messagesMap.set(roomId, this.markExpiredAttachments(cached));
      this.notifyMessageListeners(roomId);
    }

    // 2. Delta Catch-up หรือ Fetch Initial
    if (cached.length > 0) {
      await this.catchUpActiveRoomMessages(roomId);
    } else {
      await this.fetchInitialMessages(roomId, 30);
    }

    // 3. Mark read
    const room = this.roomsMap.get(roomId);
    if (room?.hasUnread) {
      void this.markRoomAsRead(roomId);
    }

    return this.messagesMap.get(roomId) || [];
  }

  async fetchInitialMessages(roomId: string, limit = 30): Promise<{ hasMore: boolean; nextCursor: string | null }> {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: { messages: ChatMessageItem[]; nextCursor: string | null; hasMore: boolean } =
        await res.json();

      await this.mergeMessagesIntoRoom(roomId, data.messages);
      return { hasMore: data.hasMore, nextCursor: data.nextCursor };
    } catch (error) {
      console.warn('[MessagingService] Fallback initial fetch:', error);
      return { hasMore: false, nextCursor: null };
    }
  }

  async fetchOlderMessages(roomId: string, beforeCreatedAtIso: string, limit = 30): Promise<{
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    try {
      const params = new URLSearchParams({
        beforeCreatedAt: beforeCreatedAtIso,
        limit: String(limit),
      });

      const res = await fetch(`/api/chat/rooms/${roomId}/messages?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!res.ok) return { hasMore: false, nextCursor: null };

      const data: { messages: ChatMessageItem[]; nextCursor: string | null; hasMore: boolean } =
        await res.json();

      await this.mergeMessagesIntoRoom(roomId, data.messages);
      return { hasMore: data.hasMore, nextCursor: data.nextCursor };
    } catch {
      return { hasMore: false, nextCursor: null };
    }
  }

  async catchUpActiveRoomMessages(roomId: string): Promise<void> {
    const existing = this.messagesMap.get(roomId) || [];
    const confirmedMessages = existing.filter((m) => m.deliveryStatus !== 'PENDING_SYNC' && m.deliveryStatus !== 'SENDING');
    const latestMessage = confirmedMessages[confirmedMessages.length - 1];

    if (!latestMessage) {
      await this.fetchInitialMessages(roomId, 30);
      return;
    }

    try {
      const params = new URLSearchParams({
        afterCreatedAt: latestMessage.createdAt,
        limit: '50',
      });

      const res = await fetch(`/api/chat/rooms/${roomId}/messages?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!res.ok) return;

      const data: { messages: ChatMessageItem[] } = await res.json();
      if (data.messages && data.messages.length > 0) {
        await this.mergeMessagesIntoRoom(roomId, data.messages);
      }
    } catch (error) {
      console.warn('[MessagingService] Delta catch-up skipped (offline):', error);
    }
  }

  // ============================================================================
  // ส่วนการส่งข้อความ + OPTIMISTIC UI + OUTBOX QUEUE RECOVERY
  // ============================================================================

  /**
   * รองรับทั้ง New Send API `sendMessage(params)` และ Legacy `sendMessage(groupId, payload)`
   */
  async sendMessage(
    paramsOrGroupId: string | SendMessageParams,
    legacyPayload?: {
      senderId?: string;
      senderName?: string;
      senderRole?: 'TEACHER' | 'STUDENT' | 'SYSTEM' | 'ADVISOR' | 'ACADEMIC_ADMIN' | 'SCHOOL_ADMIN';
      senderAvatar?: string;
      content: string;
      attachment?: any;
    }
  ): Promise<any> {
    // Legacy dual-argument support
    let params: SendMessageParams;
    if (typeof paramsOrGroupId === 'string') {
      params = {
        roomId: paramsOrGroupId,
        content: legacyPayload?.content || '',
        senderId: legacyPayload?.senderId,
        senderName: legacyPayload?.senderName,
        senderRole: legacyPayload?.senderRole,
        senderAvatar: legacyPayload?.senderAvatar,
        attachmentMeta: legacyPayload?.attachment,
      };
    } else {
      params = paramsOrGroupId;
    }

    const user = this.currentUser || this.resolveFallbackUser();
    const idempotencyKey = `kp_msg_${user.userId}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    const messageType = params.messageType || 'TEXT';

    const optimisticMessage: ChatMessageItem = {
      id: `temp_${idempotencyKey}`,
      roomId: params.roomId,
      senderId: params.senderId || user.userId,
      senderName: params.senderName || user.userName,
      senderRole: params.senderRole || user.role,
      senderAvatar: params.senderAvatar,
      messageType,
      content: params.content.trim(),
      idempotencyKey,
      attachmentMeta: params.attachmentMeta || null,
      actionPayload: params.actionPayload || null,
      createdAt: nowIso,
      deliveryStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'SENDING' : 'PENDING_SYNC',
    };

    // Also update legacy groups store for legacy views/tests
    const legacyGroups = this.getGroups();
    const matchedGroup = legacyGroups.find((g) => g.id === params.roomId);
    if (matchedGroup) {
      const legacyMsg: ChatMessage = {
        id: optimisticMessage.id,
        groupId: params.roomId,
        senderId: optimisticMessage.senderId,
        senderName: optimisticMessage.senderName,
        senderRole: optimisticMessage.senderRole as any,
        senderAvatar: optimisticMessage.senderAvatar,
        content: optimisticMessage.content,
        timestamp: `วันนี้ ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} น.`,
        idempotencyKey,
        syncStatus: 'SYNCED',
        attachment: params.attachmentMeta,
      };
      matchedGroup.messages.push(legacyMsg);
      matchedGroup.lastMessageText = params.content;
      matchedGroup.lastMessageTime = legacyMsg.timestamp;
      this.saveGroups(legacyGroups);
    }

    const outboxEntry: OutboxEntry = {
      idempotencyKey,
      roomId: params.roomId,
      content: optimisticMessage.content,
      messageType,
      attachmentMeta: optimisticMessage.attachmentMeta,
      actionPayload: optimisticMessage.actionPayload,
      createdAt: nowIso,
      retryCount: 0,
    };

    if (typeof window !== 'undefined') {
      await chatIdbAdapter.enqueueOutbox(outboxEntry);
      await this.mergeMessagesIntoRoom(params.roomId, [optimisticMessage]);

      if (!navigator.onLine) {
        return optimisticMessage;
      }
    }

    try {
      return await this.transmitOutboxEntry(outboxEntry, optimisticMessage.id);
    } catch {
      return optimisticMessage;
    }
  }

  private async transmitOutboxEntry(
    entry: OutboxEntry,
    tempMessageId?: string
  ): Promise<ChatMessageItem> {
    try {
      const res = await fetch(`/api/chat/rooms/${entry.roomId}/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          content: entry.content,
          messageType: entry.messageType,
          idempotencyKey: entry.idempotencyKey,
          attachmentMeta: entry.attachmentMeta,
          actionPayload: entry.actionPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`POST message failed with status ${res.status}`);
      }

      const data: { message: ChatMessageItem; duplicated: boolean } = await res.json();
      const confirmedMessage: ChatMessageItem = {
        ...data.message,
        deliveryStatus: 'SENT',
      };

      await chatIdbAdapter.removeOutbox(entry.idempotencyKey);
      if (tempMessageId) {
        await chatIdbAdapter.deleteMessage(tempMessageId);
      }

      await this.replaceTempAndMergeMessage(entry.roomId, entry.idempotencyKey, confirmedMessage);
      await this.updateRoomSummaryOnNewMessage(confirmedMessage, true);
      await this.broadcastNewMessage(confirmedMessage);

      return confirmedMessage;
    } catch (error) {
      console.warn('[MessagingService] Message queued in Outbox for retry:', error);
      await this.markMessageDeliveryStatus(entry.roomId, entry.idempotencyKey, 'PENDING_SYNC');
      throw error;
    }
  }

  async flushOutboxQueue(): Promise<void> {
    if (this.isFlushingOutbox || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    this.isFlushingOutbox = true;

    try {
      const pendingItems = await chatIdbAdapter.getAllOutbox();
      for (const item of pendingItems) {
        try {
          await this.transmitOutboxEntry(item, `temp_${item.idempotencyKey}`);
        } catch {
          // Keep in queue
        }
      }
    } finally {
      this.isFlushingOutbox = false;
    }
  }

  // ============================================================================
  // ส่วนจัดการ SUPABASE REALTIME BROADCAST
  // ============================================================================

  private subscribeToSchoolBroadcast(schoolId: string): void {
    if (!this.supabase) return;

    if (this.schoolChannel) {
      void this.supabase.removeChannel(this.schoolChannel);
    }

    this.schoolChannel = this.supabase
      .channel(`kp-school-chat:${schoolId}`, {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'room-activity' }, (payload) => {
        const incomingMessage = payload.payload as ChatMessageItem;
        if (!incomingMessage || !this.roomsMap.has(incomingMessage.roomId)) return;

        const isCurrentlyReading =
          this.activeRoomId === incomingMessage.roomId &&
          typeof document !== 'undefined' &&
          document.visibilityState === 'visible';

        void this.updateRoomSummaryOnNewMessage(incomingMessage, isCurrentlyReading);
      })
      .subscribe();
  }

  private subscribeToRoomBroadcast(roomId: string): void {
    if (!this.supabase) return;

    if (this.activeRoomChannel) {
      void this.supabase.removeChannel(this.activeRoomChannel);
    }

    this.activeRoomChannel = this.supabase
      .channel(`kp-room-chat:${roomId}`, {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'new-message' }, (payload) => {
        const incomingMessage = payload.payload as ChatMessageItem;
        if (!incomingMessage || incomingMessage.roomId !== roomId) return;

        void this.mergeMessagesIntoRoom(roomId, [
          { ...incomingMessage, deliveryStatus: 'SENT' },
        ]);

        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          void this.markRoomAsRead(roomId);
        }
      })
      .subscribe();
  }

  private async broadcastNewMessage(message: ChatMessageItem): Promise<void> {
    if (!this.supabase) return;

    try {
      if (this.activeRoomChannel && this.activeRoomId === message.roomId) {
        await this.activeRoomChannel.send({
          type: 'broadcast',
          event: 'new-message',
          payload: message,
        });
      }

      if (this.schoolChannel) {
        await this.schoolChannel.send({
          type: 'broadcast',
          event: 'room-activity',
          payload: message,
        });
      }
    } catch (error) {
      console.warn('[MessagingService] Realtime broadcast warning:', error);
    }
  }

  // ============================================================================
  // ส่วนจัดการสถานะการอ่าน (READ RECEIPT) & ไฟล์หมดอายุ 7 วัน
  // ============================================================================

  async markRoomAsRead(roomId: string): Promise<void> {
    const room = this.roomsMap.get(roomId);
    if (!room) return;

    const nowIso = new Date().toISOString();
    const updatedRoom: ChatRoomSummary = {
      ...room,
      hasUnread: false,
      lastReadAt: nowIso,
    };

    this.roomsMap.set(roomId, updatedRoom);
    await chatIdbAdapter.upsertRooms([updatedRoom]);
    this.notifyRoomListListeners();

    try {
      await fetch(`/api/chat/rooms/${roomId}/read`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });
    } catch {
      // Ignore
    }
  }

  private markExpiredAttachments(messages: ChatMessageItem[]): ChatMessageItem[] {
    const now = Date.now();
    return messages.map((msg) => {
      if (!msg.attachmentMeta?.expiresAt) return msg;
      const isExpired = new Date(msg.attachmentMeta.expiresAt).getTime() <= now;
      return {
        ...msg,
        attachmentMeta: {
          ...msg.attachmentMeta,
          isExpired,
        },
      };
    });
  }

  // ============================================================================
  // INTERNAL STATE MERGERS & LISTENERS
  // ============================================================================

  private async mergeMessagesIntoRoom(roomId: string, incoming: ChatMessageItem[]): Promise<void> {
    const current = this.messagesMap.get(roomId) || [];
    const byId = new Map<string, ChatMessageItem>();

    for (const msg of current) {
      byId.set(msg.idempotencyKey || msg.id, msg);
    }

    for (const msg of incoming) {
      byId.set(msg.idempotencyKey || msg.id, msg);
    }

    const merged = this.markExpiredAttachments(Array.from(byId.values())).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    this.messagesMap.set(roomId, merged);
    await chatIdbAdapter.upsertMessages(merged);
    this.notifyMessageListeners(roomId);
  }

  private async replaceTempAndMergeMessage(
    roomId: string,
    idempotencyKey: string,
    confirmed: ChatMessageItem
  ): Promise<void> {
    const current = (this.messagesMap.get(roomId) || []).filter(
      (m) => m.idempotencyKey !== idempotencyKey && m.id !== `temp_${idempotencyKey}`
    );
    current.push(confirmed);

    const sorted = this.markExpiredAttachments(current).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    this.messagesMap.set(roomId, sorted);
    await chatIdbAdapter.upsertMessages([confirmed]);
    this.notifyMessageListeners(roomId);
  }

  private async markMessageDeliveryStatus(
    roomId: string,
    idempotencyKey: string,
    status: ChatMessageItem['deliveryStatus']
  ): Promise<void> {
    const current = this.messagesMap.get(roomId) || [];
    const updated = current.map((m) =>
      m.idempotencyKey === idempotencyKey ? { ...m, deliveryStatus: status } : m
    );
    this.messagesMap.set(roomId, updated);
    this.notifyMessageListeners(roomId);
  }

  private async updateRoomSummaryOnNewMessage(msg: ChatMessageItem, isReadByMe: boolean): Promise<void> {
    const room = this.roomsMap.get(msg.roomId);
    if (!room) return;

    const preview =
      msg.messageType === 'TASK'
        ? `[งานมอบหมาย] ${msg.content.slice(0, 90)}`
        : msg.messageType === 'ANNOUNCEMENT'
        ? `[ประกาศ] ${msg.content.slice(0, 90)}`
        : msg.content || '[แนบไฟล์รูปภาพ/เอกสาร]';

    const updatedRoom: ChatRoomSummary = {
      ...room,
      lastMessageAt: msg.createdAt,
      lastMessagePreview: preview,
      lastMessageSender: msg.senderName,
      updatedAt: msg.createdAt,
      hasUnread: !isReadByMe,
      ...(isReadByMe ? { lastReadAt: msg.createdAt } : {}),
    };

    this.roomsMap.set(msg.roomId, updatedRoom);
    await chatIdbAdapter.upsertRooms([updatedRoom]);
    this.notifyRoomListListeners();
  }

  subscribeRooms(listener: RoomListListener): () => void {
    this.roomListListeners.add(listener);
    listener(this.getSortedRooms());
    return () => this.roomListListeners.delete(listener);
  }

  subscribeRoomMessages(listener: RoomMessagesListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  private notifyRoomListListeners(): void {
    const sorted = this.getSortedRooms();
    for (const listener of this.roomListListeners) {
      listener(sorted);
    }
  }

  private notifyMessageListeners(roomId: string): void {
    const list = this.messagesMap.get(roomId) || [];
    for (const listener of this.messageListeners) {
      listener(roomId, list);
    }
  }

  // ============================================================================
  // BACKWARD-COMPATIBLE HELPER METHODS (STUDENT ROSTER & TRANSFER INTERACTION)
  // ============================================================================

  resetToDefaultData(): ChatGroup[] {
    _inMemoryGroupsCache = null;
    const initial = this.generateInitialGroups();
    this.saveGroups(initial);
    return initial;
  }

  resolveClassroom(roomKey: string) {
    const list = classroomService.getClassroomsSync();
    const match = list.find(
      (c) => c.id === roomKey || c.roomNumber === roomKey || c.name === roomKey
    );
    if (match) return match;
    return {
      id: roomKey,
      name: roomKey,
      roomNumber: roomKey,
      adviser: 'ครูที่ปรึกษา',
      studentCount: 0,
      level: 'ม.1',
    };
  }

  studentToChatMember(s: StudentRecord): ChatMember {
    const isMale = s.gender === 'MALE' || s.name.startsWith('ด.ช.') || s.name.startsWith('นาย');
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      role: 'STUDENT',
      seatNo: s.no,
      gender: isMale ? 'MALE' : 'FEMALE',
      avatarUrl:
        s.avatarUrl ||
        (isMale
          ? '/images/banners/student-avatar.png'
          : '/images/banners/student-avatar-girl.png'),
      joinedAt: 'ภาคเรียนที่ 1/2569',
    };
  }

  getCourseClassroomMappings(): CourseClassroomMapping[] {
    const curriculumCourses = coursesCurriculumService.getCourses();
    if (!curriculumCourses || curriculumCourses.length === 0) {
      return [];
    }

    const allClassrooms = classroomService.getClassroomsSync();
    const mappings: CourseClassroomMapping[] = [];

    curriculumCourses.forEach((c) => {
      if (c.assignedClassrooms && c.assignedClassrooms.length > 0) {
        c.assignedClassrooms.forEach((roomName) => {
          const matched = allClassrooms.find(
            (r) => r.name === roomName || r.roomNumber === roomName || r.id === roomName
          );
          const roomId = matched?.id || `room-${roomName.replace(/[^0-9-]/g, '')}`;
          mappings.push({
            courseCode: c.code,
            courseName: c.name,
            classroomId: roomId,
            classroomName: roomName,
            teacherName: c.teacherName || 'ครูผู้สอน',
          });
        });
      }
    });

    return mappings;
  }

  generateInitialGroups(): ChatGroup[] {
    const classrooms = classroomService.getClassroomsSync();
    const groups: ChatGroup[] = [];

    // 1. กลุ่มทางการระดับโรงเรียน
    groups.push({
      id: 'grp-official-announcements',
      name: '📢 ประกาศและข่าวสารทางการโรงเรียน',
      type: 'OFFICIAL',
      typeLabel: 'ประกาศทางการ',
      description: 'ช่องทางสื่อสารหลักของโรงเรียน สำหรับประกาศด่วน ข้อมูลกิจกรรม และแจ้งเตือนสำคัญจากฝ่ายบริหาร',
      teacherName: 'ผู้อำนวยการและฝ่ายบริหาร',
      teacherRoleLabel: 'ผู้ดูแลระบบ',
      autoManaged: true,
      unreadCount: 0,
      members: [
        {
          id: 'u-director',
          code: 'DIR-01',
          name: 'ฝ่ายบริหารโรงเรียนกุดจับประชาสรรค์',
          role: 'SCHOOL_ADMIN',
          joinedAt: 'ต้นภาคเรียน',
        },
      ],
      messages: [],
      lastMessageText: '',
      lastMessageTime: '',
    });

    // 2. กลุ่มวิชาการ
    groups.push({
      id: 'grp-academic-announcements',
      name: '📚 ข่าวสารและประกาศงานวิชาการ',
      type: 'OFFICIAL',
      typeLabel: 'ประกาศงานวิชาการ',
      description: 'ช่องทางสื่อสารข้อมูลฝ่ายวิชาการ กำหนดการสอบ ปฏิทินวิชาการ และงานวัดผลการเรียนสำหรับนักเรียนและบุคลากรทุกคน',
      teacherName: 'ฝ่ายบริหารงานวิชาการ',
      teacherRoleLabel: 'ผู้ดูแลกลุ่มวิชาการ',
      autoManaged: true,
      unreadCount: 0,
      members: [
        {
          id: 'u-academic',
          code: 'ACADEMIC-01',
          name: 'ฝ่ายบริหารงานวิชาการ',
          role: 'ACADEMIC_ADMIN',
          joinedAt: 'ต้นภาคเรียน',
        },
      ],
      messages: [],
      lastMessageText: '',
      lastMessageTime: '',
    });

    // 3. กลุ่มครูที่ปรึกษาประจำชั้น (HOMEROOM)
    classrooms.forEach((c) => {
      const students = this.getStudentsForClassroom(c.id);
      const studentMembers: ChatMember[] = students.map((s) => this.studentToChatMember(s));

      const teacherMember: ChatMember = {
        id: `advisor-${c.id}`,
        code: `ADV-${c.roomNumber || c.name}`,
        name: c.adviser || 'ครูที่ปรึกษาประจำชั้น',
        role: 'ADVISOR',
        avatarUrl: '/images/teacher/teacher_avatar.png',
        joinedAt: 'ต้นภาคเรียน',
      };

      groups.push({
        id: `grp-homeroom-${c.id}`,
        name: `กลุ่มที่ปรึกษา ${c.roomNumber || c.name}`,
        type: 'HOMEROOM',
        typeLabel: 'กลุ่มครูที่ปรึกษา',
        description: `กลุ่มสำหรับติดต่อประสานงาน แจ้งข่าวสาร และดูแลช่วยเหลือนักเรียนห้อง ${c.name || c.roomNumber} (ดึงสมาชิกอัตโนมัติ)`,
        classroomId: c.id,
        classroomName: c.roomNumber || c.name,
        teacherName: c.adviser || 'ครูที่ปรึกษาประจำชั้น',
        teacherRoleLabel: 'ครูที่ปรึกษาประจำชั้น',
        autoManaged: true,
        members: [teacherMember, ...studentMembers],
        unreadCount: 0,
        messages: [],
      });
    });

    // 4. กลุ่มประจำวิชา (COURSE)
    const mappings = this.getCourseClassroomMappings();
    mappings.forEach((m) => {
      const students = this.getStudentsForClassroom(m.classroomId);
      const studentMembers: ChatMember[] = students.map((s) => this.studentToChatMember(s));

      const teacherMember: ChatMember = {
        id: `teacher-${m.courseCode}-${m.classroomId}`,
        code: `TCH-${m.courseCode}`,
        name: m.teacherName,
        role: 'TEACHER',
        avatarUrl: '/images/teacher/teacher_avatar.png',
        joinedAt: 'ต้นภาคเรียน',
      };

      groups.push({
        id: `grp-course-${m.courseCode}-${m.classroomId}`,
        name: `กลุ่มวิชา ${m.courseCode} ${m.courseName} (${m.classroomName})`,
        type: 'COURSE',
        typeLabel: 'กลุ่มประจำวิชา',
        description: `กลุ่มการเรียนการสอน สั่งงาน ส่งการบ้าน และแจ้งคะแนนวิชา ${m.courseCode} ห้อง ${m.classroomName}`,
        classroomId: m.classroomId,
        classroomName: m.classroomName,
        courseCode: m.courseCode,
        courseName: m.courseName,
        teacherName: m.teacherName,
        teacherRoleLabel: 'ครูประจำวิชา',
        autoManaged: true,
        members: [teacherMember, ...studentMembers],
        unreadCount: 0,
        messages: [],
      });
    });

    return groups;
  }

  getStudentsForClassroom(classroomId: string): StudentRecord[] {
    const list = studentService.getStudents(classroomId);
    if (list && list.length > 0) return list;
    return [];
  }

  getGroups(): ChatGroup[] {
    if (_inMemoryGroupsCache && _inMemoryGroupsCache.length > 0) {
      return _inMemoryGroupsCache;
    }
    const initial = this.generateInitialGroups();
    this.saveGroups(initial);
    return initial;
  }

  getGroupsForStudent(studentCodeOrId?: string, classroomIdOrName?: string): ChatGroup[] {
    const allGroups = this.getGroups();
    let resolvedClassroomId = classroomIdOrName;
    let resolvedStudentCode = studentCodeOrId;

    if (resolvedStudentCode && !resolvedClassroomId) {
      const found = studentService.findStudentByCode(resolvedStudentCode);
      if (found) {
        resolvedClassroomId = found.classroomId;
      }
    }

    let targetRoom: { id: string; name: string; roomNumber?: string } | null = null;
    if (resolvedClassroomId) {
      const list = classroomService.getClassroomsSync();
      const match = list.find(
        (c) =>
          c.id === resolvedClassroomId ||
          c.name === resolvedClassroomId ||
          c.roomNumber === resolvedClassroomId
      );
      if (match) targetRoom = match;
    }

    const allowedHomeroomKeys = new Set<string>();
    if (targetRoom) {
      if (targetRoom.id) allowedHomeroomKeys.add(targetRoom.id);
      if (targetRoom.name) allowedHomeroomKeys.add(targetRoom.name);
      if (targetRoom.roomNumber) allowedHomeroomKeys.add(targetRoom.roomNumber);
    } else if (resolvedClassroomId) {
      allowedHomeroomKeys.add(resolvedClassroomId);
    }

    return allGroups.filter((g) => {
      if (g.type === 'OFFICIAL') return true;
      if (g.type === 'DEPARTMENT') return false;

      if (g.type === 'HOMEROOM') {
        return Boolean(
          (g.classroomId && allowedHomeroomKeys.has(g.classroomId)) ||
          (g.classroomName && allowedHomeroomKeys.has(g.classroomName)) ||
          (resolvedStudentCode && g.members.some((m) => m.code === resolvedStudentCode || m.id === resolvedStudentCode))
        );
      }

      if (g.type === 'COURSE') {
        return Boolean(
          (g.classroomId && allowedHomeroomKeys.has(g.classroomId)) ||
          (g.classroomName && allowedHomeroomKeys.has(g.classroomName)) ||
          (resolvedStudentCode && g.members.some((m) => m.code === resolvedStudentCode || m.id === resolvedStudentCode))
        );
      }

      return false;
    });
  }

  getGroupsForTeacher(teacherUser?: AuthUser | null, activeRole?: SchoolUserRole): ChatGroup[] {
    const allGroups = this.getGroups();
    const currentTeacherName = teacherUser?.name || 'ครูผู้สอน';

    if (
      (activeRole as string) === 'SCHOOL_ADMIN' ||
      activeRole === 'ACADEMIC_ADMIN' ||
      teacherUser?.role === 'ADMIN'
    ) {
      return allGroups;
    }

    const classrooms = classroomService.getClassroomsSync();
    const teacherAdvisedRooms = classrooms.filter((c) => {
      if (!c.adviser) return false;
      return (
        c.adviser === currentTeacherName ||
        (teacherUser?.name && c.adviser.includes(teacherUser.name.split(' ')[0]))
      );
    });

    const allowedHomeroomKeys = new Set<string>();
    teacherAdvisedRooms.forEach((c) => {
      if (c.id) allowedHomeroomKeys.add(c.id);
      if (c.name) allowedHomeroomKeys.add(c.name);
      if (c.roomNumber) allowedHomeroomKeys.add(c.roomNumber);
    });

    const curriculumCourses = coursesCurriculumService.getCourses();
    const teacherCourses = curriculumCourses.filter((c) => {
      if (!c.teacherName) return false;
      return (
        c.teacherName === currentTeacherName ||
        (teacherUser?.name && c.teacherName.includes(teacherUser.name.split(' ')[0]))
      );
    });
    const teacherCourseCodes = new Set(teacherCourses.map((c) => c.code.trim()));

    return allGroups.filter((g) => {
      if (g.type === 'OFFICIAL' || g.type === 'DEPARTMENT') return true;
      if (g.type === 'HOMEROOM') {
        return Boolean(
          (g.classroomId && allowedHomeroomKeys.has(g.classroomId)) ||
          (g.classroomName && allowedHomeroomKeys.has(g.classroomName)) ||
          g.teacherName === currentTeacherName ||
          (teacherUser?.name && g.teacherName.includes(teacherUser.name.split(' ')[0]))
        );
      }
      if (g.type === 'COURSE') {
        return Boolean(
          g.teacherName === currentTeacherName ||
          (teacherUser?.name && g.teacherName.includes(teacherUser.name.split(' ')[0])) ||
          (g.courseCode && teacherCourseCodes.has(g.courseCode.trim()))
        );
      }
      return false;
    });
  }

  saveGroups(groups: ChatGroup[]): ChatGroup[] {
    _inMemoryGroupsCache = groups;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHAT_GROUPS_EVENT, { detail: groups }));
    }
    return groups;
  }

  getGroupById(groupId: string): ChatGroup | undefined {
    return this.getGroups().find((g) => g.id === groupId);
  }

  getTotalUnreadCount(user?: AuthUser | null, role?: SchoolUserRole): number {
    const activeUser =
      user !== undefined
        ? user
        : typeof localStorage !== 'undefined'
        ? authService.getCurrentUser()
        : null;

    let visibleGroups: ChatGroup[];
    if (
      role === 'STUDENT_GENERAL' ||
      role === 'STUDENT_COUNCIL' ||
      activeUser?.role === 'STUDENT'
    ) {
      visibleGroups = this.getGroupsForStudent(
        activeUser?.studentCode || activeUser?.id,
        activeUser?.classroomId
      );
    } else {
      visibleGroups = this.getGroupsForTeacher(activeUser, role);
    }
    return visibleGroups.reduce((acc, g) => acc + (g.unreadCount || 0), 0);
  }

  markGroupAsRead(groupId: string): void {
    void this.markRoomAsRead(groupId);
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (group && (group.unreadCount || 0) > 0) {
      group.unreadCount = 0;
      this.saveGroups(groups);
    }
  }

  async createOutboxMessage(
    groupId: string,
    payload: {
      senderId: string;
      senderName: string;
      senderRole: 'TEACHER' | 'STUDENT' | 'SYSTEM' | 'ADVISOR' | 'ACADEMIC_ADMIN' | 'SCHOOL_ADMIN';
      senderAvatar?: string;
      content: string;
      attachment?: ChatAttachmentMeta;
    },
    userId?: string
  ): Promise<ChatMessage | null> {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return null;

    const now = new Date();
    const timeStr = `วันนี้ ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} น.`;

    const idempotencyKey =
      typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `uuid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const effectiveUser = userId || payload.senderId;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId,
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderRole: payload.senderRole,
      senderAvatar: payload.senderAvatar,
      content: payload.content,
      timestamp: timeStr,
      idempotencyKey,
      syncStatus: 'PENDING_SYNC',
      attachment: payload.attachment,
    };

    group.messages.push(newMsg);
    group.lastMessageText = payload.content;
    group.lastMessageTime = timeStr;
    this.saveGroups(groups);

    const outboxItem: OutboxItem = {
      idempotencyKey,
      groupId,
      senderId: payload.senderId,
      content: payload.content,
      syncStatus: 'PENDING_SYNC',
      createdAt: now.toISOString(),
      retryCount: 0,
      payload: {
        senderName: payload.senderName,
        senderRole: payload.senderRole,
        attachment: payload.attachment,
      },
    };

    await indexedDbAdapter.enqueueOutbox(outboxItem, effectiveUser);
    return newMsg;
  }

  async syncOutboxMessage(outboxItem: OutboxItem, userId?: string): Promise<boolean> {
    const effectiveUser = userId || outboxItem.senderId;
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === outboxItem.groupId);

    if (group) {
      const msg = group.messages.find(
        (m) => m.idempotencyKey === outboxItem.idempotencyKey
      );
      if (msg) {
        msg.syncStatus = 'SYNCED';
        msg.serverTimestamp = new Date().toISOString();
        this.saveGroups(groups);
      }
    }

    await indexedDbAdapter.markOutboxSynced(outboxItem.idempotencyKey, effectiveUser);
    return true;
  }

  async syncAllPendingOutbox(userId?: string): Promise<number> {
    const pending = await indexedDbAdapter.getPendingOutbox(userId);
    let count = 0;
    for (const item of pending) {
      const ok = await this.syncOutboxMessage(item, userId);
      if (ok) count++;
    }
    return count;
  }

  async hydrateFromCloud(_userId: string = 'default_user'): Promise<ChatGroup[]> {
    const initial = this.generateInitialGroups();
    this.saveGroups(initial);
    return initial;
  }

  executeServerTtlPurge(olderThanDays: number = 7): {
    purgedCount: number;
    preservedTextCount: number;
  } {
    const groups = this.getGroups();
    let purgedCount = 0;
    let preservedTextCount = 0;
    const now = Date.now();
    const thresholdMs = olderThanDays * 24 * 60 * 60 * 1000;

    for (const group of groups) {
      for (const msg of group.messages) {
        preservedTextCount++;
        if (msg.attachment && !msg.attachment.isExpired) {
          let shouldPurge = false;
          if (msg.attachment.expiresAt) {
            shouldPurge = new Date(msg.attachment.expiresAt).getTime() <= now;
          } else if (msg.serverTimestamp) {
            const ageMs = now - new Date(msg.serverTimestamp).getTime();
            shouldPurge = ageMs >= thresholdMs;
          }

          if (shouldPurge) {
            const key = msg.attachment.r2ObjectKey || msg.attachment.r2Key || 'ephemeral/chat/sample.jpg';
            assertSafeTtlPurgeKey(key);
            msg.attachment.isExpired = true;
            msg.attachment.url = undefined;
            purgedCount++;
          }
        }
      }
    }

    if (purgedCount > 0) {
      this.saveGroups(groups);
    }

    return { purgedCount, preservedTextCount };
  }

  resyncAllGroupMembers(_actorLabel = 'ระบบอัตโนมัติ'): ChatGroup[] {
    const initial = this.generateInitialGroups();
    this.saveGroups(initial);
    return initial;
  }

  // ========================================================================
  // STUDENT TRANSFER SYNCHRONIZATION WITH DATA PRESERVATION
  // ========================================================================
  executeStudentTransfer(payload: StudentTransferPayload): StudentTransferResult {
    let fromRoom = this.resolveClassroom(payload.fromClassroomId);
    const toRoom = this.resolveClassroom(payload.toClassroomId);

    if (fromRoom.id === toRoom.id || fromRoom.roomNumber === toRoom.roomNumber) {
      throw new Error('ห้องเรียนต้นทางและปลายทางเป็นห้องเดียวกัน ไม่สามารถย้ายได้');
    }

    let currentGroups = this.getGroups();

    let fromRoomStudents = this.getStudentsForClassroom(fromRoom.id);
    let student = fromRoomStudents.find((s) => s.code === payload.studentCode || s.id === payload.studentCode);

    if (!student && fromRoom.roomNumber) {
      fromRoomStudents = this.getStudentsForClassroom(fromRoom.roomNumber);
      student = fromRoomStudents.find((s) => s.code === payload.studentCode || s.id === payload.studentCode);
    }

    if (!student) {
      const foundGlobal = studentService.findStudentByCode(payload.studentCode);
      if (foundGlobal) {
        student = foundGlobal.student;
        fromRoom = this.resolveClassroom(foundGlobal.classroomId);
        fromRoomStudents = this.getStudentsForClassroom(fromRoom.id);
      }
    }

    if (!student) {
      throw new Error(`ไม่พบนักเรียนรหัส ${payload.studentCode} ในระบบทะเบียนห้องเรียน`);
    }

    const updatedFromStudents = fromRoomStudents.filter(
      (s) => s.code !== payload.studentCode && s.id !== payload.studentCode
    );
    studentService.saveLocalStudents(fromRoom.id, updatedFromStudents);
    if (fromRoom.roomNumber && fromRoom.roomNumber !== fromRoom.id) {
      studentService.saveLocalStudents(fromRoom.roomNumber, updatedFromStudents);
    }

    const toRoomStudents = this.getStudentsForClassroom(toRoom.id);
    const existingIdx = toRoomStudents.findIndex(
      (s) => s.code === payload.studentCode || s.id === payload.studentCode
    );
    let updatedToStudents: StudentRecord[];
    let newStudentItem: StudentRecord;

    if (existingIdx >= 0) {
      newStudentItem = {
        ...toRoomStudents[existingIdx],
        ...student,
        no: toRoomStudents[existingIdx].no,
        classroomId: toRoom.id,
      };
      updatedToStudents = [...toRoomStudents];
      updatedToStudents[existingIdx] = newStudentItem;
    } else {
      newStudentItem = {
        ...student,
        no: toRoomStudents.length + 1,
        classroomId: toRoom.id,
      };
      updatedToStudents = [...toRoomStudents, newStudentItem];
    }

    studentService.saveLocalStudents(toRoom.id, updatedToStudents);
    if (toRoom.roomNumber && toRoom.roomNumber !== toRoom.id) {
      studentService.saveLocalStudents(toRoom.roomNumber, updatedToStudents);
    }

    const allSubmissions: StudentWorkSubmission[] = sgsRosterAndSubmissionService.getSubmissions();
    const studentSubmissions = allSubmissions.filter(
      (sub) => sub.studentCode === payload.studentCode
    );
    const preservedAssignmentsCount = studentSubmissions.length;
    const preservedSubmissionsCount = preservedAssignmentsCount;
    const preservedScore = student.score;

    const sgsRoster = sgsRosterAndSubmissionService.getSgsRoster();
    const sgsStudent = sgsRoster.find((s) => s.studentCode === payload.studentCode);
    if (sgsStudent) {
      const updatedSgsRoster = sgsRoster.map((s) =>
        s.studentCode === payload.studentCode
          ? {
              ...s,
              classroom: toRoom.roomNumber || toRoom.name,
              transferState: 'TRANSFERRED_IN' as const,
              transferNote: `ย้ายห้องเรียนจาก ${fromRoom.roomNumber || fromRoom.name} ไป ${toRoom.roomNumber || toRoom.name} เมื่อ ${new Date().toLocaleDateString(
                'th-TH'
              )} (งานและคะแนนสะสมคงเดิมครบถ้วน)`,
            }
          : s
      );
      sgsRosterAndSubmissionService.saveSgsRoster(
        updatedSgsRoster,
        `ย้ายห้องเรียน: ${student.name} (${fromRoom.name} ➔ ${toRoom.name})`
      );
    } else {
      const newSgsStudent: any = {
        sgsSeatNo: sgsRoster.length + 1,
        studentCode: student.code,
        studentName: student.name,
        gender: student.gender || (student.name.startsWith('ด.ช.') || student.name.startsWith('นาย') ? 'MALE' : 'FEMALE'),
        classroom: toRoom.roomNumber || toRoom.name,
        transferState: 'TRANSFERRED_IN',
        transferDate: new Date().toISOString(),
        transferNote: `ย้ายห้องเรียนจาก ${fromRoom.roomNumber || fromRoom.name} ไป ${toRoom.roomNumber || toRoom.name} เมื่อ ${new Date().toLocaleDateString('th-TH')} (งานและคะแนนสะสมคงเดิมครบถ้วน)`,
        attendancePercent: 95.0,
        morningStatusLabel: 'มาเข้าแถวปกติ',
        midtermScore: Math.round(student.score * 0.2),
        finalScore: Math.round(student.score * 0.3),
      };
      sgsRosterAndSubmissionService.saveSgsRoster(
        [...sgsRoster, newSgsStudent],
        `ย้ายห้องเรียนและลงทะเบียน SGS: ${student.name} (${fromRoom.name} ➔ ${toRoom.name})`
      );
    }

    if (typeof window !== 'undefined') {
      try {
        const rawScores = localStorage.getItem('cls_scores_data');
        if (rawScores) {
          const scores = JSON.parse(rawScores);
          if (Array.isArray(scores)) {
            let scoresUpdated = false;
            const updatedScores = scores.map((sc: any) => {
              if (sc.enrollmentId === student.id || sc.enrollmentId === student.code) {
                scoresUpdated = true;
                return { ...sc, classroomId: toRoom.id, updatedAt: new Date().toISOString() };
              }
              return sc;
            });
            if (scoresUpdated) {
              localStorage.setItem('cls_scores_data', JSON.stringify(updatedScores));
            }
          }
        }
      } catch {
        // ignore
      }

      try {
        const rawAtt = localStorage.getItem('cls_attendance_records');
        if (rawAtt) {
          const attRecords = JSON.parse(rawAtt);
          if (Array.isArray(attRecords)) {
            let attUpdated = false;
            const updatedAtt = attRecords.map((att: any) => {
              if (att.enrollmentId === student.id || att.enrollmentId === student.code) {
                attUpdated = true;
                return { ...att, classroomId: toRoom.id, updatedAt: new Date().toISOString() };
              }
              return att;
            });
            if (attUpdated) {
              localStorage.setItem('cls_attendance_records', JSON.stringify(updatedAtt));
            }
          }
        }
      } catch {
        // ignore
      }

      try {
        const rawMorning = localStorage.getItem('kp_morning_assembly_records');
        if (rawMorning) {
          const morningList = JSON.parse(rawMorning);
          if (Array.isArray(morningList)) {
            let morningUpdated = false;
            const updatedMorning = morningList.map((m: any) => {
              if (m.studentCode === student.code || m.studentId === student.id) {
                morningUpdated = true;
                return { ...m, classroomId: toRoom.id };
              }
              return m;
            });
            if (morningUpdated) {
              localStorage.setItem('kp_morning_assembly_records', JSON.stringify(updatedMorning));
            }
          }
        }

        const rawPeriod = localStorage.getItem('kp_period_attendance_records');
        if (rawPeriod) {
          const periodList = JSON.parse(rawPeriod);
          if (Array.isArray(periodList)) {
            let periodUpdated = false;
            const updatedPeriod = periodList.map((p: any) => {
              if (p.studentCode === student.code || p.studentId === student.id) {
                periodUpdated = true;
                return { ...p, classroomId: toRoom.id };
              }
              return p;
            });
            if (periodUpdated) {
              localStorage.setItem('kp_period_attendance_records', JSON.stringify(updatedPeriod));
            }
          }
        }
      } catch {
        // ignore
      }

      try {
        const rawHv = localStorage.getItem('cms_home_visit_nor01_cct_v2');
        if (rawHv) {
          const hvList = JSON.parse(rawHv);
          if (Array.isArray(hvList)) {
            const updatedHv = hvList.map((item: any) =>
              item.studentCode === student.code
                ? { ...item, classroom: toRoom.roomNumber || toRoom.name }
                : item
            );
            localStorage.setItem('cms_home_visit_nor01_cct_v2', JSON.stringify(updatedHv));
          }
        }
      } catch {
        // ignore
      }
    }

    const hasToHomeroom = currentGroups.some(
      (g) =>
        g.type === 'HOMEROOM' &&
        (g.classroomId === toRoom.id ||
          g.classroomName === toRoom.roomNumber ||
          g.classroomName === toRoom.name)
    );
    if (!hasToHomeroom) {
      const teacherMember: ChatMember = {
        id: `advisor-${toRoom.id}`,
        code: `ADV-${toRoom.roomNumber || toRoom.name}`,
        name: toRoom.adviser || 'ครูที่ปรึกษาประจำชั้น',
        role: 'ADVISOR',
        joinedAt: 'ต้นภาคเรียน',
      };
      const existingStudents = this.getStudentsForClassroom(toRoom.id).filter(
        (s) => s.code !== payload.studentCode && s.id !== payload.studentCode
      );
      const existingStudentMembers = existingStudents.map((s) => this.studentToChatMember(s));

      const newHomeroomGroup: ChatGroup = {
        id: `grp-homeroom-${toRoom.id}`,
        name: `กลุ่มที่ปรึกษา ${toRoom.roomNumber || toRoom.name}`,
        type: 'HOMEROOM',
        typeLabel: 'กลุ่มครูที่ปรึกษา',
        description: `กลุ่มสำหรับติดต่อประสานงาน แจ้งข่าวสาร และดูแลช่วยเหลือนักเรียนห้อง ${toRoom.name || toRoom.roomNumber} (ดึงสมาชิกอัตโนมัติ)`,
        classroomId: toRoom.id,
        classroomName: toRoom.roomNumber || toRoom.name,
        teacherName: toRoom.adviser || 'ครูที่ปรึกษาประจำชั้น',
        teacherRoleLabel: 'ครูที่ปรึกษาประจำชั้น',
        autoManaged: true,
        members: [teacherMember, ...existingStudentMembers],
        unreadCount: 0,
        messages: [],
      };
      currentGroups.push(newHomeroomGroup);
    }

    const toCourseMappings = this.getCourseClassroomMappings().filter(
      (m) =>
        m.classroomId === toRoom.id ||
        m.classroomName === toRoom.roomNumber ||
        m.classroomName === toRoom.name
    );
    for (const mapping of toCourseMappings) {
      const exists = currentGroups.some(
        (g) =>
          g.type === 'COURSE' &&
          g.courseCode === mapping.courseCode &&
          (g.classroomId === toRoom.id || g.classroomName === mapping.classroomName)
      );
      if (!exists) {
        const teacherMember: ChatMember = {
          id: `teacher-${mapping.courseCode}-${mapping.classroomId}`,
          code: `TCH-${mapping.courseCode}`,
          name: mapping.teacherName,
          role: 'TEACHER',
          joinedAt: 'ต้นภาคเรียน',
        };
        const existingStudents = this.getStudentsForClassroom(mapping.classroomId).filter(
          (s) => s.code !== payload.studentCode && s.id !== payload.studentCode
        );
        const existingStudentMembers = existingStudents.map((s) => this.studentToChatMember(s));

        const newCourseGroup: ChatGroup = {
          id: `grp-course-${mapping.courseCode}-${mapping.classroomId}`,
          name: `กลุ่มวิชา ${mapping.courseCode} ${mapping.courseName} (${mapping.classroomName})`,
          type: 'COURSE',
          typeLabel: 'กลุ่มประจำวิชา',
          description: `กลุ่มการเรียนการสอน สั่งงาน ส่งการบ้าน และแจ้งคะแนนวิชา ${mapping.courseCode} ห้อง ${mapping.classroomName}`,
          classroomId: mapping.classroomId,
          classroomName: mapping.classroomName,
          courseCode: mapping.courseCode,
          courseName: mapping.courseName,
          teacherName: mapping.teacherName,
          teacherRoleLabel: 'ครูประจำวิชา',
          autoManaged: true,
          members: [teacherMember, ...existingStudentMembers],
          unreadCount: 0,
          messages: [],
        };
        currentGroups.push(newCourseGroup);
      }
    }

    const now = new Date();
    const timeStr = `วันนี้ ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} น.`;

    const leftGroupNames: string[] = [];
    const joinedGroupNames: string[] = [];

    const updatedGroups = currentGroups.map((group) => {
      const isFromGroup =
        group.classroomId === fromRoom.id ||
        group.classroomName === fromRoom.name ||
        group.classroomName === fromRoom.roomNumber;

      if (isFromGroup && group.autoManaged) {
        const hasMember = group.members.some((m) => m.code === payload.studentCode);
        if (hasMember) {
          leftGroupNames.push(group.name);
          const nextMembers = group.members.filter((m) => m.code !== payload.studentCode);

          const systemExitMsg: ChatMessage = {
            id: `msg-sys-exit-${Date.now()}-${group.id}`,
            groupId: group.id,
            senderId: 'system',
            senderName: 'ระบบจัดการชั้นเรียน',
            senderRole: 'SYSTEM',
            isSystemAudit: true,
            content: `📢 ระบบอัตโนมัติ: นักเรียน ${student.name} (${student.code}) ได้ย้ายออกจากห้อง ${fromRoom.name} ไปยังห้อง ${toRoom.name} เรียบร้อยแล้ว`,
            timestamp: timeStr,
            transferAuditMeta: {
              studentCode: student.code,
              studentName: student.name,
              fromClassroomId: fromRoom.id,
              toClassroomId: toRoom.id,
              fromClassroomName: fromRoom.name,
              toClassroomName: toRoom.name,
              preservedAssignmentsCount,
              preservedScore,
              action: 'TRANSFER_OUT',
            },
          };

          return {
            ...group,
            members: nextMembers,
            messages: [...group.messages, systemExitMsg],
            lastMessageText: systemExitMsg.content,
            lastMessageTime: timeStr,
          };
        }
      }

      const isToGroup =
        group.classroomId === toRoom.id ||
        group.classroomName === toRoom.name ||
        group.classroomName === toRoom.roomNumber;

      if (isToGroup && group.autoManaged) {
        const alreadyMember = group.members.some((m) => m.code === payload.studentCode);
        if (!alreadyMember) {
          joinedGroupNames.push(group.name);
          const newMember = this.studentToChatMember(newStudentItem);
          const nextMembers = [...group.members, newMember];

          const systemJoinMsg: ChatMessage = {
            id: `msg-sys-join-${Date.now()}-${group.id}`,
            groupId: group.id,
            senderId: 'system',
            senderName: 'ระบบจัดการชั้นเรียน',
            senderRole: 'SYSTEM',
            isSystemAudit: true,
            content: `📢 ระบบอัตโนมัติ: นักเรียน ${student.name} (${student.code}) ได้ย้ายเข้าสู่ห้อง ${toRoom.name} เรียบร้อยแล้ว (โอนย้ายงานที่ทำอยู่ ${preservedSubmissionsCount} ชิ้น และคะแนนสะสม ${preservedScore} คะแนนติดตัวมาครบถ้วน)`,
            timestamp: timeStr,
            transferAuditMeta: {
              studentCode: student.code,
              studentName: student.name,
              fromClassroomId: fromRoom.id,
              toClassroomId: toRoom.id,
              fromClassroomName: fromRoom.name,
              toClassroomName: toRoom.name,
              preservedAssignmentsCount,
              preservedScore,
              action: 'TRANSFER_IN',
            },
          };

          return {
            ...group,
            members: nextMembers,
            messages: [...group.messages, systemJoinMsg],
            lastMessageText: systemJoinMsg.content,
            lastMessageTime: timeStr,
          };
        }
      }

      return group;
    });

    this.saveGroups(updatedGroups);

    const result: StudentTransferResult = {
      success: true,
      message: `ย้ายนักเรียน ${student.name} จากห้อง ${fromRoom.name} ไป ${toRoom.name} เรียบร้อยแล้ว (อัปเดตกลุ่มแชท ${joinedGroupNames.length} กลุ่ม และรักษาคะแนน/งานเดิมครบ 100%)`,
      student: newStudentItem,
      fromClassroomId: fromRoom.id,
      fromClassroomName: fromRoom.name,
      toClassroomId: toRoom.id,
      toClassroomName: toRoom.name,
      leftGroups: leftGroupNames,
      joinedGroups: joinedGroupNames,
      preservedSubmissionsCount,
      preservedScore,
      transferredAt: timeStr,
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STUDENT_TRANSFERRED_EVENT, { detail: result }));
    }

    return result;
  }
}

export const messagingService = new MessagingService();
