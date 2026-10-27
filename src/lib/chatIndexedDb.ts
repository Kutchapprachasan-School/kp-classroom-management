// src/lib/chatIndexedDb.ts

export type ChatRoomType = 'HOMEROOM' | 'COURSE' | 'OFFICIAL' | 'DEPARTMENT';
export type ChatMessageType = 'TEXT' | 'TASK' | 'ANNOUNCEMENT' | 'TRANSFER' | 'SYSTEM';
export type ChatDeliveryStatus = 'SENDING' | 'SENT' | 'PENDING_SYNC' | 'FAILED';

export interface ChatAttachmentMeta {
  r2Key?: string;
  url?: string;
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
  fileSizeKb?: number;
  expiresAt?: string; // ISO string (7 วันนับจากอัปโหลด)
  isExpired?: boolean;
}

export interface ChatActionPayload {
  // สำหรับการ์ดงานมอบหมาย (TASK)
  taskId?: string;
  dueDate?: string;
  maxScore?: number;
  courseCode?: string;
  // สำหรับการโอนย้ายนักเรียน (TRANSFER)
  studentId?: string;
  studentName?: string;
  fromClassroomId?: string;
  toClassroomId?: string;
  transferStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ChatRoomSummary {
  id: string;
  type: ChatRoomType;
  name: string;
  description: string | null;
  classroomId: string | null;
  courseCode: string | null;
  isReadOnly: boolean;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageSender: string | null;
  updatedAt: string;
  myRole: string;
  isMuted: boolean;
  lastReadAt: string | null;
  hasUnread: boolean;
}

export interface ChatMessageItem {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  messageType: ChatMessageType;
  content: string;
  idempotencyKey: string | null;
  attachmentMeta: ChatAttachmentMeta | null;
  actionPayload: ChatActionPayload | null;
  createdAt: string;
  deliveryStatus?: ChatDeliveryStatus;
}

export interface OutboxEntry {
  idempotencyKey: string;
  roomId: string;
  content: string;
  messageType: ChatMessageType;
  attachmentMeta: ChatAttachmentMeta | null;
  actionPayload: ChatActionPayload | null;
  createdAt: string;
  retryCount: number;
}

const DB_NAME = 'kp_classroom_chat_db';
const DB_VERSION = 1;
const LEGACY_LOCALSTORAGE_KEY = 'kp_chat_groups_v4';

class ChatIndexedDbAdapter {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private getDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }

    if (!this.dbPromise) {
      // ล้างข้อมูล Monolithic JSON เก่าใน localStorage ทิ้งทันทีเพื่อคืนพื้นที่เบราว์เซอร์
      try {
        localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
      } catch {
        // Ignore storage errors
      }

      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains('rooms')) {
              db.createObjectStore('rooms', { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains('messages')) {
              const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
              msgStore.createIndex('by_room', 'roomId', { unique: false });
            }

            if (!db.objectStoreNames.contains('outbox')) {
              const outboxStore = db.createObjectStore('outbox', { keyPath: 'idempotencyKey' });
              outboxStore.createIndex('by_created', 'createdAt', { unique: false });
            }
          };

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } catch {
          resolve(null);
        }
      });
    }

    return this.dbPromise;
  }

  // ==================== ROOMS ====================
  async getAllRooms(): Promise<ChatRoomSummary[]> {
    const db = await this.getDb();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction('rooms', 'readonly');
      const req = tx.objectStore('rooms').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async upsertRooms(rooms: ChatRoomSummary[]): Promise<void> {
    if (rooms.length === 0) return;
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('rooms', 'readwrite');
      const store = tx.objectStore('rooms');
      for (const room of rooms) {
        store.put(room);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== MESSAGES ====================
  async getMessagesByRoom(roomId: string): Promise<ChatMessageItem[]> {
    const db = await this.getDb();
    if (!db || typeof IDBKeyRange === 'undefined') return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readonly');
      const index = tx.objectStore('messages').index('by_room');
      const req = index.getAll(IDBKeyRange.only(roomId));
      req.onsuccess = () => {
        const list: ChatMessageItem[] = req.result || [];
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async upsertMessages(messages: ChatMessageItem[]): Promise<void> {
    if (messages.length === 0) return;
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');
      for (const msg of messages) {
        store.put(msg);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readwrite');
      tx.objectStore('messages').delete(messageId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== OUTBOX QUEUE ====================
  async enqueueOutbox(entry: OutboxEntry): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      tx.objectStore('outbox').put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async removeOutbox(idempotencyKey: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      tx.objectStore('outbox').delete(idempotencyKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllOutbox(): Promise<OutboxEntry[]> {
    const db = await this.getDb();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readonly');
      const req = tx.objectStore('outbox').getAll();
      req.onsuccess = () => {
        const items: OutboxEntry[] = req.result || [];
        items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export const chatIdbAdapter = new ChatIndexedDbAdapter();
