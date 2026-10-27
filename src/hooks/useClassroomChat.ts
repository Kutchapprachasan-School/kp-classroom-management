// src/hooks/useClassroomChat.ts
import { useEffect, useState, useCallback } from 'react';
import {
  messagingService,
  type CurrentChatUserContext,
  type SendMessageParams,
} from '../services/messagingService.ts';
import type { ChatRoomSummary, ChatMessageItem } from '../lib/chatIndexedDb.ts';

export function useClassroomChat(currentUser: CurrentChatUserContext | null) {
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);

  // 1. เริ่มต้นระบบแชทและ Subscribe รายการห้อง
  useEffect(() => {
    if (!currentUser) return;

    void messagingService.initialize(currentUser);

    const unsubscribeRooms = messagingService.subscribeRooms((updatedRooms) => {
      setRooms(updatedRooms);
    });

    const unsubscribeMessages = messagingService.subscribeRoomMessages((roomId, roomMessages) => {
      if (roomId === activeRoomId) {
        setMessages([...roomMessages]);
      }
    });

    return () => {
      unsubscribeRooms();
      unsubscribeMessages();
    };
  }, [currentUser, activeRoomId]);

  // 2. ฟังก์ชันสลับห้องสนทนา
  const selectRoom = useCallback(async (roomId: string) => {
    setActiveRoomId(roomId);
    setIsLoadingRoom(true);
    try {
      const initialMsgs = await messagingService.openRoom(roomId);
      setMessages([...initialMsgs]);
    } finally {
      setIsLoadingRoom(false);
    }
  }, []);

  // 3. ฟังก์ชันส่งข้อความ (รองรับทั้งข้อความปกติ, การ์ดสั่งงาน TASK, และการโอนย้ายนักเรียน)
  const sendMessage = useCallback(async (params: Omit<SendMessageParams, 'roomId'>) => {
    if (!activeRoomId) return;
    await messagingService.sendMessage({
      ...params,
      roomId: activeRoomId,
    });
  }, [activeRoomId]);

  return {
    rooms,
    activeRoomId,
    messages,
    isLoadingRoom,
    selectRoom,
    sendMessage,
    flushOutbox: () => messagingService.flushOutboxQueue(),
  };
}
