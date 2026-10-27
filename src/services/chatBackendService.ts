// src/services/chatBackendService.ts
// Client Service Layer for KP Classroom Messaging & Chat
// Communicates with Zero-Egress Backend API Endpoints (/api/chat/*)
// Designed for Sprint 1 Production Architecture

import { authService, type AuthUser } from './authService.ts';

export type ChatRoomType = 'HOMEROOM' | 'COURSE' | 'OFFICIAL' | 'DEPARTMENT';
export type ChatMessageType = 'TEXT' | 'TASK' | 'ANNOUNCEMENT' | 'TRANSFER' | 'SYSTEM';

export interface ChatRoomSummary {
  id: string;
  type: ChatRoomType;
  name: string;
  description?: string | null;
  classroomId?: string | null;
  courseCode?: string | null;
  isReadOnly: boolean;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  lastMessageSender?: string | null;
  updatedAt: string;
  myRole: string;
  isMuted: boolean;
  lastReadAt?: string | null;
  hasUnread: boolean;
}

export interface ChatAttachmentMeta {
  url?: string;
  r2ObjectKey?: string;
  fileName: string;
  fileSizeKb?: number;
  mimeType: string;
  expiresAt?: string;
  isExpired?: boolean;
}

export interface ChatMessageRecord {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  messageType: ChatMessageType;
  content: string;
  idempotencyKey?: string | null;
  attachmentMeta?: ChatAttachmentMeta | null;
  actionPayload?: Record<string, any> | null;
  createdAt: string;
}

export interface FetchMessagesResponse {
  messages: ChatMessageRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SendMessagePayload {
  content: string;
  messageType?: ChatMessageType;
  idempotencyKey?: string;
  attachmentMeta?: ChatAttachmentMeta;
  actionPayload?: Record<string, any>;
}

// Runtime API base URL (configurable via Vite env or fallback to relative path)
const getApiBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  return '';
};

// Build standard authentication headers based on active session
function getAuthHeaders(user?: AuthUser | null): HeadersInit {
  const activeUser = user || authService.getCurrentUser();
  const userId = activeUser?.id || activeUser?.studentCode || 'guest';
  const userName = encodeURIComponent(activeUser?.name || 'ผู้ใช้งาน');
  const role =
    activeUser?.role === 'STUDENT'
      ? 'STUDENT'
      : activeUser?.role === 'ADMIN'
      ? 'ACADEMIC_ADMIN'
      : 'TEACHER';
  const schoolId = 'KP-SCHOOL-01';

  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-user-name': userName,
    'x-user-role': role,
    'x-school-id': schoolId,
  };
}

export const chatBackendService = {
  /**
   * 1. ดึงรายชื่อห้องแชทพร้อมสถานะ hasUnread (Zero-Egress Projection)
   */
  async getRooms(options?: {
    type?: ChatRoomType;
    updatedAfter?: string;
    currentUser?: AuthUser | null;
  }): Promise<{ rooms: ChatRoomSummary[]; syncedAt: string }> {
    const base = getApiBaseUrl();
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.updatedAfter) params.set('updatedAfter', options.updatedAfter);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${base}/api/chat/rooms${qs}`, {
      method: 'GET',
      headers: getAuthHeaders(options?.currentUser),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch chat rooms: HTTP ${res.status}`);
    }

    return res.json();
  },

  /**
   * 2. ดึงข้อความในห้องแชทด้วย Cursor Pagination หรือ Delta Catch-up
   */
  async getMessages(
    roomId: string,
    options?: {
      limit?: number;
      beforeCreatedAt?: string;
      afterCreatedAt?: string;
      currentUser?: AuthUser | null;
    }
  ): Promise<FetchMessagesResponse> {
    const base = getApiBaseUrl();
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.beforeCreatedAt) params.set('beforeCreatedAt', options.beforeCreatedAt);
    if (options?.afterCreatedAt) params.set('afterCreatedAt', options.afterCreatedAt);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${base}/api/chat/rooms/${encodeURIComponent(roomId)}/messages${qs}`, {
      method: 'GET',
      headers: getAuthHeaders(options?.currentUser),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch messages for room ${roomId}: HTTP ${res.status}`);
    }

    return res.json();
  },

  /**
   * 3. ส่งข้อความใหม่ใน Transaction เดียว (Atomic Insert + Room Update)
   */
  async sendMessage(
    roomId: string,
    payload: SendMessagePayload,
    currentUser?: AuthUser | null
  ): Promise<{ message: ChatMessageRecord; duplicated: boolean }> {
    const base = getApiBaseUrl();

    // Auto-generate UUID v4 idempotencyKey if not provided
    const idempotencyKey =
      payload.idempotencyKey ||
      (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

    const res = await fetch(`${base}/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({
        ...payload,
        idempotencyKey,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to send message: HTTP ${res.status}`);
    }

    return res.json();
  },

  /**
   * 4. อัปเดตสถานะการอ่านข้อความ (PATCH /api/chat/rooms/:roomId/read)
   */
  async markRoomAsRead(roomId: string, currentUser?: AuthUser | null): Promise<{ roomId: string; lastReadAt: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/chat/rooms/${encodeURIComponent(roomId)}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(currentUser),
    });

    if (!res.ok) {
      throw new Error(`Failed to mark room as read: HTTP ${res.status}`);
    }

    return res.json();
  },

  /**
   * 5. สั่งสร้างห้องแชทอัตโนมัติ (POST /api/chat/provision)
   */
  async provisionSchoolChatRooms(payload: Record<string, any>, currentUser?: AuthUser | null): Promise<any> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/chat/provision`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({
        action: 'PROVISION',
        ...payload,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to provision chat rooms: HTTP ${res.status}`);
    }

    return res.json();
  },

  /**
   * 6. ซิงค์การย้ายห้องเรียนของนักเรียน (POST /api/chat/provision { action: 'TRANSFER' })
   */
  async syncStudentTransfer(params: Record<string, any>, currentUser?: AuthUser | null): Promise<any> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/chat/provision`, {
      method: 'POST',
      headers: getAuthHeaders(currentUser),
      body: JSON.stringify({
        action: 'TRANSFER',
        ...params,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to sync student transfer: HTTP ${res.status}`);
    }

    return res.json();
  },

  /**
   * 7. ดึงรายชื่อห้องแชทที่ถูกสร้างทั้งหมดในระบบ (GET /api/chat/provision)
   */
  async getProvisionedRooms(academicYear = 2569, currentUser?: AuthUser | null): Promise<any> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/chat/provision?academicYear=${encodeURIComponent(academicYear)}`, {
      method: 'GET',
      headers: getAuthHeaders(currentUser),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to get provisioned rooms: HTTP ${res.status}`);
    }

    return res.json();
  },
};
