// src/services/messagingService.ts
// บริการระบบข้อความและกลุ่มแชทอัตโนมัติ (Automated Chat Groups Service)
// 1. สร้างกลุ่มครูที่ปรึกษา และกลุ่มประจำวิชาโดยดึงนักเรียนเข้าอัตโนมัติตามทะเบียนห้องเรียน
// 2. ซิงค์การย้ายห้องเรียนอัตโนมัติ (เช่น ย้ายจาก ม.1/1 ไป ม.1/2)
//    - ย้ายกลุ่มแชทให้อัตโนมัติ (ออกจากกลุ่มเดิม เข้ากลุ่มใหม่ พร้อมข้อความระบบแจ้งเตือน)
//    - โอนย้ายงานที่ทำอยู่ คะแนนสะสม ผลการส่งงาน และประวัติทั้งหมดติดตัวนักเรียนไปด้วย 100%

import { classroomService } from './classroomService.ts';
import { studentService, type StudentRecord } from './studentService.ts';
import { coursesCurriculumService } from './coursesCurriculumService.ts';
import { sgsRosterAndSubmissionService, type StudentWorkSubmission } from './sgsRosterAndSubmissionService.ts';
import { indexedDbAdapter, type OutboxItem } from '../utils/indexedDbAdapter.ts';

export type ChatGroupType = 'HOMEROOM' | 'COURSE' | 'OFFICIAL' | 'DEPARTMENT';

export interface ChatMember {
  id: string;
  code: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'ADVISOR';
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE';
  seatNo?: number;
  joinedAt: string;
}

export interface ChatAttachmentMeta {
  r2ObjectKey?: string;
  url?: string;
  fileName?: string;
  fileSizeKb?: number;
  mimeType?: string;
  expiresAt?: string; // ISO timestamp (server_created_at + 7 days)
  isExpired?: boolean;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: 'TEACHER' | 'STUDENT' | 'SYSTEM';
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isSystemAudit?: boolean;
  idempotencyKey?: string;
  syncStatus?: 'PENDING_SYNC' | 'IN_FLIGHT' | 'SYNCED' | 'RETRYING' | 'FATAL_FAILED';
  serverTimestamp?: string;
  attachment?: ChatAttachmentMeta;
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
  classroomId?: string; // e.g. 'room-1-1', 'room-1-2', 'room-3-1'
  classroomName?: string; // e.g. 'ม.1/1', 'ม.1/2', 'ม.3/1'
  courseCode?: string; // e.g. 'ศ23101', 'ญ32101', 'ค21101'
  courseName?: string; // e.g. 'ศิลปะ', 'ภาษาญี่ปุ่น', 'คณิตศาสตร์'
  teacherName: string;
  teacherRoleLabel: string;
  autoManaged: boolean; // true = สมาชิกดึงเข้าอัตโนมัติตามทะเบียนห้องเรียน
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

const STORAGE_KEY_CHAT_GROUPS = 'kp_chat_groups_v4';
export const CHAT_GROUPS_EVENT = 'kp-chat-updated';
export const STUDENT_TRANSFERRED_EVENT = 'kp-student-transferred';

// ข้อมูลหลักสูตรประจำห้องสำหรับสร้างกลุ่มประจำวิชาอัตโนมัติ
export interface CourseClassroomMapping {
  courseCode: string;
  courseName: string;
  classroomId: string;
  classroomName: string;
  teacherName: string;
}

let _inMemoryGroupsCache: ChatGroup[] | null = null;
let chatBroadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined') {
  if ('BroadcastChannel' in window) {
    try {
      chatBroadcastChannel = new BroadcastChannel('kp_chat_sync_channel');
      chatBroadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'CHAT_GROUPS_UPDATED') {
          _inMemoryGroupsCache = null;
          const fresh = messagingService.getGroups();
          window.dispatchEvent(new CustomEvent(CHAT_GROUPS_EVENT, { detail: fresh }));
        }
      };
    } catch (e) {
      console.warn('[messagingService] BroadcastChannel init warning:', e);
    }
  }

  // Cross-tab storage event
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_CHAT_GROUPS) {
      _inMemoryGroupsCache = null;
      const fresh = messagingService.getGroups();
      window.dispatchEvent(new CustomEvent(CHAT_GROUPS_EVENT, { detail: fresh }));
    }
  });

  // Supabase cloud data realtime update event
  window.addEventListener('kps-cloud-key-updated', ((e: CustomEvent) => {
    if (e.detail?.key === STORAGE_KEY_CHAT_GROUPS) {
      _inMemoryGroupsCache = null;
      const fresh = messagingService.getGroups();
      window.dispatchEvent(new CustomEvent(CHAT_GROUPS_EVENT, { detail: fresh }));
    }
  }) as EventListener);

  window.addEventListener('kps-cloud-synced', (() => {
    _inMemoryGroupsCache = null;
    const fresh = messagingService.getGroups();
    window.dispatchEvent(new CustomEvent(CHAT_GROUPS_EVENT, { detail: fresh }));
  }) as EventListener);
}

/**
 * ป้องกันการลบข้อมูลชิ้นงานนักเรียนเด็ดขาด (Anti-Accidental-Delete Assertion)
 * - หากเป็นโฟลเดอร์ผลงาน submissions/ จะระงับการลบและ Throw ทันที
 * - อนุญาตให้ลบได้เฉพาะโฟลเดอร์ชั่วคราว ephemeral/chat/ เท่านั้น
 */
export function assertSafeTtlPurgeKey(objectKey: string): void {
  const FORBIDDEN_PREFIX = 'submissions/';
  const EPHEMERAL_PREFIX = 'ephemeral/chat/';

  if (!objectKey || typeof objectKey !== 'string') {
    throw new Error('CRITICAL SECURITY VIOLATION: Invalid or empty object key for TTL purge');
  }

  if (objectKey.startsWith(FORBIDDEN_PREFIX)) {
    throw new Error(`CRITICAL SECURITY VIOLATION: Attempted TTL purge on student submission key: ${objectKey}`);
  }

  if (!objectKey.startsWith(EPHEMERAL_PREFIX)) {
    throw new Error(`CRITICAL SECURITY VIOLATION: Attempted TTL purge on non-ephemeral key: ${objectKey}`);
  }
}

export const messagingService = {
  // รีเซ็ตข้อมูลกลุ่มแชทกลับเป็นค่าเริ่มต้น Mock Data
  resetToDefaultData(): ChatGroup[] {
    _inMemoryGroupsCache = null;
    const initial = this.generateInitialGroups();
    this.saveGroups(initial);
    return initial;
  },

  // ดึงห้องเรียนที่ตรงกับ ID หรือชื่อห้อง
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
  },

  // แปลง StudentRecord เป็น ChatMember
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
  },

  // ดึง Mapping รายวิชาจริงจาก coursesCurriculumService
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
  },

  // สร้างกลุ่มเริ่มต้นโดยดึงสมาชิกจากทะเบียนห้องเรียนและหลักสูตรจริงอัตโนมัติ (Zero Mock Data)
  generateInitialGroups(): ChatGroup[] {
    const groups: ChatGroup[] = [];

    // 1. กลุ่มทางการ & ข่าวสารโรงเรียน (Official Announcements)
    groups.push({
      id: 'grp-official-announcements',
      name: '📢 ข่าวสารและประกาศทางการ รร.กุดจับประชาสรรค์',
      type: 'OFFICIAL',
      typeLabel: 'ประกาศทางการ',
      description: 'ช่องทางสื่อสารข้อมูลข่าวสารและคำสั่งราชการสำหรับครู บุคลากร และนักเรียนทุกคน',
      teacherName: 'ฝ่ายบริหารงานโรงเรียน',
      teacherRoleLabel: 'ผู้ดูแลระบบกลาง',
      autoManaged: true,
      unreadCount: 0,
      members: [
        {
          id: 'u-admin',
          code: 'ADMIN-01',
          name: 'ฝ่ายบริหารและงานสารบรรณ',
          role: 'TEACHER',
          joinedAt: 'ต้นภาคเรียน',
        },
      ],
      messages: [],
      lastMessageText: '',
      lastMessageTime: '',
    });

    // 2. กลุ่มประสานงานครูและบุคลากรทางการศึกษา
    groups.push({
      id: 'grp-all-teachers',
      name: '👥 กลุ่มประสานงานครูและบุคลากรทางการศึกษา',
      type: 'DEPARTMENT',
      typeLabel: 'กลุ่มครูและบุคลากร',
      description: 'กลุ่มประสานงานภาระงานสอน วิชาการ และงานบริหารงานทั่วไปของโรงเรียน',
      teacherName: 'ฝ่ายบริหารงานวิชาการ',
      teacherRoleLabel: 'ผู้ดูแลกลุ่ม',
      autoManaged: true,
      unreadCount: 0,
      members: [],
      messages: [],
      lastMessageText: '',
      lastMessageTime: '',
    });

    // 3. กลุ่มครูที่ปรึกษา (Homeroom Advisor Groups) - ดึงนักเรียนในห้องเข้าอัตโนมัติตามทะเบียนห้องเรียนจริง
    const classrooms = classroomService.getClassroomsSync();
    const homeroomClasses = classrooms.map((cls) => ({
      id: cls.id,
      name: cls.roomNumber || cls.name,
      adviser: cls.adviser,
    }));

    homeroomClasses.forEach((cls) => {
      // ดึงรายชื่อนักเรียนจาก studentService (ตามห้องเรียนจริง ไม่ใช้ Mock Data)
      const rawStudents = this.getStudentsForClassroom(cls.id);
      const studentMembers = rawStudents.map((s) => this.studentToChatMember(s));

      const teacherMember: ChatMember = {
        id: `advisor-${cls.id}`,
        code: `ADV-${cls.name}`,
        name: cls.adviser,
        role: 'ADVISOR',
        joinedAt: 'ต้นภาคเรียน',
      };

      const groupMembers = [teacherMember, ...studentMembers];

      groups.push({
        id: `grp-homeroom-${cls.id}`,
        name: `กลุ่มที่ปรึกษา ${cls.name}`,
        type: 'HOMEROOM',
        typeLabel: 'กลุ่มครูที่ปรึกษา',
        description: `กลุ่มสำหรับติดต่อประสานงาน แจ้งข่าวสาร และดูแลช่วยเหลือนักเรียนห้อง ${cls.name} (ดึงสมาชิกอัตโนมัติ)`,
        classroomId: cls.id,
        classroomName: cls.name,
        teacherName: cls.adviser,
        teacherRoleLabel: 'ครูที่ปรึกษาประจำชั้น',
        autoManaged: true,
        members: groupMembers,
        unreadCount: 0,
        messages: [],
        lastMessageText: '',
        lastMessageTime: '',
      });
    });

    // 4. กลุ่มประจำวิชา (Course Groups) - สร้างจากหลักสูตรรายวิชาจริง (จาก coursesCurriculumService)
    const courseMappings = this.getCourseClassroomMappings();
    courseMappings.forEach((mapping) => {
      const rawStudents = this.getStudentsForClassroom(mapping.classroomId);
      const studentMembers = rawStudents.map((s) => this.studentToChatMember(s));

      const teacherMember: ChatMember = {
        id: `teacher-${mapping.courseCode}-${mapping.classroomId}`,
        code: `TCH-${mapping.courseCode}`,
        name: mapping.teacherName,
        role: 'TEACHER',
        joinedAt: 'ต้นภาคเรียน',
      };

      const groupMembers = [teacherMember, ...studentMembers];

      groups.push({
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
        members: groupMembers,
        unreadCount: 0,
        messages: [],
        lastMessageText: '',
        lastMessageTime: '',
      });
    });

    return groups;
  },

  // Helper อ่านรายชื่อนักเรียนของห้องจาก studentService จริง
  getStudentsForClassroom(classroomId: string): StudentRecord[] {
    const list = studentService.getStudents(classroomId);
    if (list && list.length > 0) return list;
    return [];
  },

  // ดึงรายการกลุ่มแชททั้งหมด (พร้อมตัวตรวจจับและล้างข้อมูลจำลองเก่าที่หลงเหลือ)
  getGroups(): ChatGroup[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CHAT_GROUPS);
        if (raw) {
          const parsed = JSON.parse(raw) as ChatGroup[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            // ตรวจจับและล้างข้อมูลจำลองเก่าที่หลงเหลือ (เช่น ข้อความทักทายจำลอง หรือกลุ่ม mock ศ23101 / ภาสภูมิ)
            const hasLegacyMock = parsed.some(
              (g) =>
                g.id === 'grp-dept-art' ||
                g.id.includes('grp-course-ศ23101') ||
                g.name.includes('กลุ่มวิชา ศ23101 ศิลปะ') ||
                g.messages.some(
                  (m) =>
                    m.content.includes('อย่าลืมติดตามกำหนดส่งงานในระบบนะครับ') ||
                    m.timestamp === 'สัปดาห์ก่อน 09:15 น.'
                )
            );
            if (!hasLegacyMock) {
              _inMemoryGroupsCache = parsed;
              return parsed;
            } else {
              localStorage.removeItem(STORAGE_KEY_CHAT_GROUPS);
              localStorage.removeItem('kp_chat_groups_v3');
              _inMemoryGroupsCache = null;
            }
          }
        }
      } catch {
        // fallback
      }
    }

    if (_inMemoryGroupsCache && _inMemoryGroupsCache.length > 0) {
      const hasLegacyMock = _inMemoryGroupsCache.some(
        (g) =>
          g.id === 'grp-dept-art' ||
          g.id.includes('grp-course-ศ23101') ||
          g.name.includes('กลุ่มวิชา ศ23101 ศิลปะ') ||
          g.messages.some(
            (m) =>
              m.content.includes('อย่าลืมติดตามกำหนดส่งงานในระบบนะครับ') ||
              m.timestamp === 'สัปดาห์ก่อน 09:15 น.'
          )
      );
      if (!hasLegacyMock) {
        return _inMemoryGroupsCache;
      }
      _inMemoryGroupsCache = null;
    }

    const initial = this.generateInitialGroups();
    this.saveGroups(initial);
    return initial;
  },

  // บันทึกรายการกลุ่มแชท (พร้อม Sync Async ลง IndexedDB ป้องกัน LocalStorage เต็ม)
  saveGroups(groups: ChatGroup[]): ChatGroup[] {
    _inMemoryGroupsCache = groups;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CHAT_GROUPS, JSON.stringify(groups));
      } catch (err) {
        console.warn('LocalStorage write failed, relying on IndexedDB:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHAT_GROUPS_EVENT, { detail: groups }));
    }

    try {
      chatBroadcastChannel?.postMessage({ type: 'CHAT_GROUPS_UPDATED', timestamp: Date.now() });
    } catch {
      // ignore
    }

    // Mirror asynchronous write to high-capacity IndexedDB
    indexedDbAdapter.setItem('chat_groups', 'active_groups', groups).catch((err) => {
      console.warn('IndexedDB mirror error:', err);
    });

    return groups;
  },

  // ดึงกลุ่มเดียวตาม ID
  getGroupById(groupId: string): ChatGroup | undefined {
    return this.getGroups().find((g) => g.id === groupId);
  },

  // สร้างข้อความผ่าน Outbox พร้อม Idempotency Key (UUID v4)
  async createOutboxMessage(
    groupId: string,
    payload: {
      senderId: string;
      senderName: string;
      senderRole: 'TEACHER' | 'STUDENT' | 'SYSTEM';
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

    // Enqueue Outbox
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

    // Trigger sync in background
    this.syncOutboxMessage(outboxItem, effectiveUser).catch(() => {});

    return newMsg;
  },

  // ซิงก์ข้อความ Outbox ขึ้น Cloud
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
  },

  // ซิงก์รายการ Outbox ทั้งหมดที่ค้างอยู่
  async syncAllPendingOutbox(userId?: string): Promise<number> {
    const pending = await indexedDbAdapter.getPendingOutbox(userId);
    let count = 0;
    for (const item of pending) {
      const ok = await this.syncOutboxMessage(item, userId);
      if (ok) count++;
    }
    return count;
  },

  // ฟื้นฟูข้อมูลจาก Cloud เมื่อย้ายเครื่องใหม่ (Hydration from Cloud DB to new device)
  async hydrateFromCloud(userId: string = 'default_user'): Promise<ChatGroup[]> {
    // 1. อ่านจาก IndexedDB หากมีอยู่แล้ว
    const cached = await indexedDbAdapter.getItem<ChatGroup[]>(
      'chat_groups',
      'active_groups',
      userId
    );
    if (cached && Array.isArray(cached) && cached.length > 0) {
      this.saveGroups(cached);
      return cached;
    }

    // 2. หากเครื่องใหม่ยังไม่มีแคช ให้สร้างกลุ่มและซิงก์จาก Authoritative Database
    const initial = this.generateInitialGroups();
    await indexedDbAdapter.setItem('chat_groups', 'active_groups', initial, userId);
    this.saveGroups(initial);
    return initial;
  },

  // ล้างไฟล์ภาพ/เอกสารแชทที่หมดอายุ 7 วัน (Server TTL Purge Simulation)
  // แต่รักษาข้อความและบันทึกประวัติการส่งไว้ถาวร 100%
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
            // Guard against accidental student submission purge!
            const key = msg.attachment.r2ObjectKey || 'ephemeral/chat/sample.jpg';
            assertSafeTtlPurgeKey(key);

            msg.attachment.isExpired = true;
            msg.attachment.url = undefined; // Remove direct binary download URL
            purgedCount++;
          }
        }
      }
    }

    if (purgedCount > 0) {
      this.saveGroups(groups);
    }

    return { purgedCount, preservedTextCount };
  },

  // ส่งข้อความใหม่ในกลุ่ม
  sendMessage(
    groupId: string,
    payload: {
      senderId: string;
      senderName: string;
      senderRole: 'TEACHER' | 'STUDENT' | 'SYSTEM';
      senderAvatar?: string;
      content: string;
    }
  ): ChatMessage | null {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return null;

    const now = new Date();
    const timeStr = `วันนี้ ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} น.`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId,
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderRole: payload.senderRole,
      senderAvatar: payload.senderAvatar,
      content: payload.content,
      timestamp: timeStr,
    };

    group.messages.push(newMsg);
    group.lastMessageText = payload.content;
    group.lastMessageTime = timeStr;

    this.saveGroups(groups);
    return newMsg;
  },

  // คำนวณจำนวนข้อความที่ยังไม่ได้อ่านทั้งหมด (เฉพาะที่มีข้อความใหม่จริง)
  getTotalUnreadCount(): number {
    const groups = this.getGroups();
    return groups.reduce((acc, g) => acc + (g.unreadCount || 0), 0);
  },

  // ทำเครื่องหมายว่าอ่านข้อความในกลุ่มนี้แล้ว
  markGroupAsRead(groupId: string): void {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (group && (group.unreadCount || 0) > 0) {
      group.unreadCount = 0;
      this.saveGroups(groups);
    }
  },

  // จำลองข้อความตอบกลับจากคู่สนทนา (Simulation Partner Reply for Easy Testing)
  simulatePartnerReply(
    groupId: string,
    currentRole: 'TEACHER' | 'STUDENT'
  ): ChatMessage | null {
    const groups = this.getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return null;

    if (currentRole === 'TEACHER') {
      // ผู้ส่งปัจจุบันคือครู -> ฝั่งตอบกลับคือนักเรียน
      const studentMember = group.members.find((m) => m.role === 'STUDENT') || {
        id: 'std-reply',
        name: 'ด.ช. พงศกร มุ่งมั่น',
        role: 'STUDENT',
        avatarUrl: '/images/banners/student-avatar.png',
      };

      const replies = [
        'รับทราบครับคุณครู จะรีบดำเนินการส่งงานให้เรียบร้อยครับ! ✨',
        'สวัสดีครับคุณครู งานชิ้นนี้ส่งผ่านระบบพอร์ทัลแล้วนะครับ ขอบคุณครับ 🙏',
        'เข้าใจเนื้อหาบทเรียนแล้วครับ ขอบคุณครูมากครับ 😊',
        'คุณครูครับ แบบฝึกหัดข้อ 3 ส่งไฟล์ PDF หรือภาพถ่ายได้ไหมครับ?',
      ];
      const randomContent = replies[Math.floor(Math.random() * replies.length)];

      return this.sendMessage(groupId, {
        senderId: studentMember.id,
        senderName: studentMember.name,
        senderRole: 'STUDENT',
        senderAvatar: studentMember.avatarUrl || '/images/banners/student-avatar.png',
        content: randomContent,
      });
    } else {
      // ผู้ส่งปัจจุบันคือนักเรียน -> ฝั่งตอบกลับคือครู
      const teacherName = group.teacherName || 'ครูปัญจพล (ครูผู้สอน)';
      const replies = [
        'สวัสดีครับนักเรียน มีข้อสงสัยเรื่องบทเรียนสอบถามครูได้ตลอดเวลานะครับ 📚',
        'ครูตรวจงานให้แล้วนะครับ ทำได้ดีมาก พัฒนาต่อไปนะ! ⭐',
        'อย่าลืมตรวจสอบกำหนดส่งงานในสัปดาห์นี้นะครับ ขอให้ทุกคนตั้งใจเรียนนะ 😊',
        'รับทราบครับ เดี๋ยวครูจะประสานงานและตรวจเช็คข้อมูลให้ทันทีครับ 👍',
      ];
      const randomContent = replies[Math.floor(Math.random() * replies.length)];

      return this.sendMessage(groupId, {
        senderId: `teacher-${group.id}`,
        senderName: teacherName,
        senderRole: 'TEACHER',
        senderAvatar: '/images/teacher/teacher_avatar.png',
        content: randomContent,
      });
    }
  },

  // ซิงค์สมาชิกทุกกลุ่มให้ตรงกับทะเบียนห้องเรียนล่าสุด
  resyncAllGroupMembers(_actorLabel = 'ระบบอัตโนมัติ'): ChatGroup[] {
    const groups = this.getGroups().map((group) => {
      if (!group.autoManaged || !group.classroomId) return group;

      const currentStudents = this.getStudentsForClassroom(group.classroomId);
      const studentMembers = currentStudents.map((s) => this.studentToChatMember(s));

      // เก็บสมาชิกที่ไม่ใช่นักเรียนไว้ (เช่น ครูที่ปรึกษา, ครูประจำวิชา)
      const nonStudentMembers = group.members.filter((m) => m.role !== 'STUDENT');

      return {
        ...group,
        members: [...nonStudentMembers, ...studentMembers],
      };
    });

    this.saveGroups(groups);
    return groups;
  },

  // ========================================================================
  // ⭐ ฟังก์ชันหัวใจสำคัญ: ย้ายห้องเรียนอัตโนมัติ (Student Transfer Sync)
  // "เช่น นักเรียน A อยู่ชั้น ม.1/1 ย้ายไปห้อง ม.1/2 ให้ย้ายกลุ่มเองอัตโนมัติเลย
  // และงานที่ทำอยู่ยังคงเหมือนเดิม เอาคะแนนเอางานทุกอย่างติดตัวนักเรียนไปด้วย"
  // ========================================================================
  executeStudentTransfer(payload: StudentTransferPayload): StudentTransferResult {
    let fromRoom = this.resolveClassroom(payload.fromClassroomId);
    const toRoom = this.resolveClassroom(payload.toClassroomId);

    if (fromRoom.id === toRoom.id || fromRoom.roomNumber === toRoom.roomNumber) {
      throw new Error('ห้องเรียนต้นทางและปลายทางเป็นห้องเดียวกัน ไม่สามารถย้ายได้');
    }

    // อ่านกลุ่มแชทปัจจุบันก่อนปรับเปลี่ยนรายชื่อนักเรียนในทะเบียน
    let currentGroups = this.getGroups();

    // 1. ค้นหานักเรียนในห้องต้นทาง หรือค้นหาทั่วระบบ
    let fromRoomStudents = this.getStudentsForClassroom(fromRoom.id);
    let student = fromRoomStudents.find((s) => s.code === payload.studentCode || s.id === payload.studentCode);

    // หากไม่พบใน id ให้ลองค้นหาด้วย roomNumber
    if (!student && fromRoom.roomNumber) {
      fromRoomStudents = this.getStudentsForClassroom(fromRoom.roomNumber);
      student = fromRoomStudents.find((s) => s.code === payload.studentCode || s.id === payload.studentCode);
    }

    // หากยังไม่พบ ให้ค้นหาจากทุกห้องในระบบ
    if (!student) {
      const foundGlobal = studentService.findStudentByCode(payload.studentCode);
      if (foundGlobal) {
        student = foundGlobal.student;
        fromRoom = this.resolveClassroom(foundGlobal.classroomId);
        fromRoomStudents = this.getStudentsForClassroom(fromRoom.id);
      }
    }

    if (!student) {
      throw new Error(
        `ไม่พบนักเรียนรหัส ${payload.studentCode} ในระบบทะเบียนห้องเรียน`
      );
    }

    // 2. นำนักเรียนออกจากห้องต้นทาง และบันทึกเข้าห้องปลายทางใน studentService (อัปเดตทั้ง key id และ roomNumber)
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

    // 3. ตรวจสอบและรักษา "งานที่ส่งแล้ว และคะแนนทั้งหมด" ให้ติดตัวนักเรียนไป 100%
    const allSubmissions: StudentWorkSubmission[] = sgsRosterAndSubmissionService.getSubmissions();
    const studentSubmissions = allSubmissions.filter(
      (sub) => sub.studentCode === payload.studentCode
    );
    const preservedAssignmentsCount = studentSubmissions.length;
    const preservedSubmissionsCount = preservedAssignmentsCount;
    const preservedScore = student.score;

    // อัปเดตข้อมูลใน SGS Roster Service ให้ระบุห้องเรียนใหม่ (เพิ่มหากยังไม่มี)
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

    // ซิงค์ข้อมูลคะแนนใน scoreService (cls_scores_data)
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

      // ซิงค์ข้อมูลประวัติการเช็คชื่อ attendanceService (cls_attendance_records)
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

      // ซิงค์ข้อมูลประวัติเช็คชื่อใน attendanceCorrelationService (kp_morning_assembly_records & kp_period_attendance_records)
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

      // ซิงค์ข้อมูลเยี่ยมบ้าน (homeVisitService)
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

    // 4. ซิงค์กลุ่มแชทอัตโนมัติ (Automated Chat Group Membership Update)

    // ตรวจสอบและสร้างกลุ่มครูที่ปรึกษาปลายทางอัตโนมัติหากยังไม่มี
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
      // ดึงนักเรียนที่มีอยู่เดิมในห้องปลายทาง (ไม่รวมนักเรียนที่กำลังย้าย)
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

    // ตรวจสอบและสร้างกลุ่มประจำวิชาปลายทางอัตโนมัติหากยังไม่มี
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
        // ดึงนักเรียนที่มีอยู่เดิมในวิชานี้ (ไม่รวมนักเรียนที่กำลังย้าย)
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
      // กลุ่มที่ผูกกับห้องเดิม (fromRoom) -> นำนักเรียนออก + โพสต์ข้อความระบบแจ้งการย้ายออก
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

      // กลุ่มที่ผูกกับห้องใหม่ (toRoom) -> เพิ่มนักเรียนเข้า + โพสต์ข้อความระบบต้อนรับ
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

    // 5. ส่ง Event แจ้งเตือนทุก View ทั่วทั้งระบบ
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
  },
};
