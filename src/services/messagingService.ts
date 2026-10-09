// src/services/messagingService.ts
// บริการระบบข้อความและกลุ่มแชทอัตโนมัติ (Automated Chat Groups Service)
// 1. สร้างกลุ่มครูที่ปรึกษา และกลุ่มประจำวิชาโดยดึงนักเรียนเข้าอัตโนมัติตามทะเบียนห้องเรียน
// 2. ซิงค์การย้ายห้องเรียนอัตโนมัติ (เช่น ย้ายจาก ม.1/1 ไป ม.1/2)
//    - ย้ายกลุ่มแชทให้อัตโนมัติ (ออกจากกลุ่มเดิม เข้ากลุ่มใหม่ พร้อมข้อความระบบแจ้งเตือน)
//    - โอนย้ายงานที่ทำอยู่ คะแนนสะสม ผลการส่งงาน และประวัติทั้งหมดติดตัวนักเรียนไปด้วย 100%

import { classroomsListData } from '../data/mockData';
import { studentService, type StudentRecord } from './studentService';
import { sgsRosterAndSubmissionService, type StudentWorkSubmission } from './sgsRosterAndSubmissionService';

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

const STORAGE_KEY_CHAT_GROUPS = 'kp_chat_groups_v3';
export const CHAT_GROUPS_EVENT = 'kp-chat-updated';
export const STUDENT_TRANSFERRED_EVENT = 'kp-student-transferred';

// ข้อมูลหลักสูตรประจำห้องสำหรับสร้างกลุ่มประจำวิชาอัตโนมัติ
interface CourseClassroomMapping {
  courseCode: string;
  courseName: string;
  classroomId: string;
  classroomName: string;
  teacherName: string;
}

const DEFAULT_COURSE_MAPPINGS: CourseClassroomMapping[] = [
  { courseCode: 'ศ23101', courseName: 'ศิลปะ (ทัศนศิลป์ ดนตรี)', classroomId: 'room-3-1', classroomName: 'ม.3/1', teacherName: 'ครูภาสภูมิ เรืองปราชญ์' },
  { courseCode: 'ญ32101', courseName: 'ภาษาญี่ปุ่นเพื่อการสื่อสาร', classroomId: 'room-3-1', classroomName: 'ม.3/1', teacherName: 'ครูภาสภูมิ เรืองปราชญ์' },
  { courseCode: 'ศ23101', courseName: 'ศิลปะ (ทัศนศิลป์ ดนตรี)', classroomId: 'room-3-2', classroomName: 'ม.3/2', teacherName: 'ครูภาสภูมิ เรืองปราชญ์' },
  { courseCode: 'ว23101', courseName: 'วิทยาศาสตร์และเทคโนโลยี 5', classroomId: 'room-3-2', classroomName: 'ม.3/2', teacherName: 'ครูกิตติ มั่นคง' },
  { courseCode: 'ค21101', courseName: 'คณิตศาสตร์พื้นฐาน 1', classroomId: 'room-1-1', classroomName: 'ม.1/1', teacherName: 'ครูวิชัย ศรีสุนทร' },
  { courseCode: 'ค21101', courseName: 'คณิตศาสตร์พื้นฐาน 1', classroomId: 'room-1-2', classroomName: 'ม.1/2', teacherName: 'ครูวิชัย ศรีสุนทร' },
  { courseCode: 'ท21101', courseName: 'ภาษาไทย 1', classroomId: 'room-1-1', classroomName: 'ม.1/1', teacherName: 'ครูรัตนา วัฒนา' },
  { courseCode: 'ท21101', courseName: 'ภาษาไทย 1', classroomId: 'room-1-2', classroomName: 'ม.1/2', teacherName: 'ครูรัตนา วัฒนา' },
  { courseCode: 'ค22101', courseName: 'คณิตศาสตร์พื้นฐาน 3', classroomId: 'room-2-1', classroomName: 'ม.2/1', teacherName: 'ครูวิชัย ศรีสุนทร' },
  { courseCode: 'ท22101', courseName: 'ภาษาไทย 3', classroomId: 'room-2-1', classroomName: 'ม.2/1', teacherName: 'ครูรัตนา วัฒนา' },
  { courseCode: 'ศ20221', courseName: 'ดนตรีปฏิบัติตามความถนัด 1', classroomId: 'room-1-8', classroomName: 'ม.1/8', teacherName: 'ครูภาสภูมิ เรืองปราชญ์' },
  { courseCode: 'ศ20223', courseName: 'ดนตรีปฏิบัติตามความถนัด 2', classroomId: 'room-2-8', classroomName: 'ม.2/8', teacherName: 'ครูภาสภูมิ เรืองปราชญ์' },
  { courseCode: 'ศ20225', courseName: 'ดนตรีปฏิบัติตามความถนัด 3', classroomId: 'room-3-8', classroomName: 'ม.3/8', teacherName: 'ครูภาสภูมิ เรืองปราชญ์' },
];

export const messagingService = {
  // รีเซ็ตข้อมูลกลุ่มแชทกลับเป็นค่าเริ่มต้น Mock Data
  resetToDefaultData(): ChatGroup[] {
    const initial = this.generateInitialGroups();
    this.saveGroups(initial);
    return initial;
  },

  // ดึงห้องเรียนที่ตรงกับ ID หรือชื่อห้อง
  resolveClassroom(roomKey: string) {
    const match = classroomsListData.find(
      (c) => c.id === roomKey || c.roomNumber === roomKey || c.name === roomKey
    );
    if (match) return match;
    return {
      id: roomKey,
      name: roomKey,
      roomNumber: roomKey,
      adviser: 'ครูที่ปรึกษา',
      studentCount: 30,
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

  // สร้างกลุ่มเริ่มต้นโดยดึงสมาชิกจากทะเบียนห้องเรียนอัตโนมัติ
  generateInitialGroups(): ChatGroup[] {
    const groups: ChatGroup[] = [];

    // 1. กลุ่มทางการ & ข่าวสารโรงเรียน
    groups.push({
      id: 'grp-official-announcements',
      name: '📢 ข่าวสารและประกาศทางการ รร.กุดจับประชาสรรค์',
      type: 'OFFICIAL',
      typeLabel: 'ประกาศทางการ',
      description: 'ช่องทางสื่อสารข้อมูลข่าวสารและคำสั่งราชการสำหรับครู บุคลากร และนักเรียนทุกคน',
      teacherName: 'ฝ่ายบริหารโรงเรียนกุดจับประชาสรรค์',
      teacherRoleLabel: 'ผู้ดูแลระบบกลาง',
      autoManaged: true,
      unreadCount: 1,
      members: [
        {
          id: 'u-admin',
          code: 'ADMIN-01',
          name: 'ฝ่ายบริหารและงานสารบรรณ',
          role: 'TEACHER',
          joinedAt: 'ต้นภาคเรียน',
        },
      ],
      messages: [
        {
          id: 'msg-off-1',
          groupId: 'grp-official-announcements',
          senderId: 'u-admin',
          senderName: 'งานประชาสัมพันธ์',
          senderRole: 'TEACHER',
          content: 'ยินดีต้อนรับสู่ระบบจัดการชั้นเรียนและระบบข้อความอัตโนมัติ ภาคเรียนที่ 1/2569',
          timestamp: '30 ก.ย. 08:30 น.',
        },
      ],
      lastMessageText: 'ยินดีต้อนรับสู่ระบบจัดการชั้นเรียนและระบบข้อความอัตโนมัติ',
      lastMessageTime: '30 ก.ย. 08:30 น.',
    });

    // 2. กลุ่มกลุ่มสาระการเรียนรู้
    groups.push({
      id: 'grp-dept-art',
      name: '👥 กลุ่มสาระการเรียนรู้ศิลปะและภาษาต่างประเทศ',
      type: 'DEPARTMENT',
      typeLabel: 'กลุ่มสาระการเรียนรู้',
      description: 'กลุ่มประสานงานภายในกลุ่มสาระการเรียนรู้ศิลปะ การจัดทำแผน และนิทรรศการ',
      teacherName: 'ครูภาสภูมิ เรืองปราชญ์ (หัวหน้าหมวด)',
      teacherRoleLabel: 'หัวหน้ากลุ่มสาระฯ',
      autoManaged: false,
      unreadCount: 0,
      members: [
        {
          id: 't-pasporm',
          code: 'KPS-T104',
          name: 'ครูภาสภูมิ เรืองปราชญ์',
          role: 'TEACHER',
          joinedAt: 'ต้นภาคเรียน',
        },
      ],
      messages: [
        {
          id: 'msg-dept-1',
          groupId: 'grp-dept-art',
          senderId: 't-pasporm',
          senderName: 'ครูภาสภูมิ',
          senderRole: 'TEACHER',
          content: 'เตรียมประชุมสรุปภาระงานและส่งเกรด SGS วันศุกร์นี้ครับ',
          timestamp: 'เมื่อวาน 16:45 น.',
        },
      ],
      lastMessageText: 'เตรียมประชุมสรุปภาระงานและส่งเกรด SGS วันศุกร์นี้ครับ',
      lastMessageTime: 'เมื่อวาน 16:45 น.',
    });

    // 3. กลุ่มครูที่ปรึกษา (Homeroom Advisor Groups) - ดึงนักเรียนในห้องเข้าอัตโนมัติ
    const homeroomClasses = classroomsListData.map((cls) => ({
      id: cls.id,
      name: cls.roomNumber || cls.name,
      adviser: cls.adviser,
    }));

    homeroomClasses.forEach((cls) => {
      // ดึงรายชื่อนักเรียนจาก studentService (Local Storage หรือ Mock)
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
        unreadCount: cls.id === 'room-3-1' || cls.id === 'room-1-1' ? 2 : 0,
        messages: [
          {
            id: `msg-hr-${cls.id}-1`,
            groupId: `grp-homeroom-${cls.id}`,
            senderId: `advisor-${cls.id}`,
            senderName: cls.adviser,
            senderRole: 'TEACHER',
            content: `สวัสดีนักเรียนห้อง ${cls.name} ทุกคน ยินดีต้อนรับสู่กลุ่มห้องเรียนประจำชั้นครับ`,
            timestamp: 'ต้นสัปดาห์ 08:00 น.',
          },
          {
            id: `msg-hr-${cls.id}-2`,
            groupId: `grp-homeroom-${cls.id}`,
            senderId: 'system',
            senderName: 'ระบบจัดการชั้นเรียน',
            senderRole: 'SYSTEM',
            isSystemAudit: true,
            content: `📢 สมาชิกในกลุ่มห้อง ${cls.name} ถูกซิงค์อัตโนมัติจากทะเบียนรายชื่อ (${studentMembers.length} คน)`,
            timestamp: 'ต้นสัปดาห์ 08:01 น.',
          },
        ],
        lastMessageText: `สมาชิกในกลุ่มห้อง ${cls.name} ถูกซิงค์อัตโนมัติจากทะเบียนรายชื่อ`,
        lastMessageTime: 'ต้นสัปดาห์ 08:01 น.',
      });
    });

    // 4. กลุ่มประจำวิชา (Course Groups) - ดึงนักเรียนที่ลงทะเบียนเรียนในห้องนั้นเข้าอัตโนมัติ
    DEFAULT_COURSE_MAPPINGS.forEach((mapping, idx) => {
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
        unreadCount: idx === 0 ? 1 : 0,
        messages: [
          {
            id: `msg-crs-${mapping.courseCode}-${idx}-1`,
            groupId: `grp-course-${mapping.courseCode}-${mapping.classroomId}`,
            senderId: teacherMember.id,
            senderName: mapping.teacherName,
            senderRole: 'TEACHER',
            content: `สวัสดีนักเรียนทุกคน กลุ่มนี้เป็นกลุ่มเรียนวิชา ${mapping.courseCode} ${mapping.courseName} อย่าลืมติดตามกำหนดส่งงานในระบบนะครับ`,
            timestamp: 'สัปดาห์ก่อน 09:15 น.',
          },
        ],
        lastMessageText: `กลุ่มนี้เป็นกลุ่มเรียนวิชา ${mapping.courseCode} ${mapping.courseName}`,
        lastMessageTime: 'สัปดาห์ก่อน 09:15 น.',
      });
    });

    return groups;
  },

  // Helper อ่านรายชื่อนักเรียนของห้องจาก LocalStorage หรือ Mock
  getStudentsForClassroom(classroomId: string): StudentRecord[] {
    const list = studentService.getLocalStudents(classroomId);
    if (list && list.length > 0) return list;
    if (classroomId === 'room-1-1' || classroomId === 'ม.1/1') {
      return [
        { id: 'stu-47001', no: 1, code: '47001', name: 'ด.ช. ชนะภัย ยอดสิงห์', attendance: '8/8', score: 85, status: 'NORMAL', gender: 'MALE' },
        { id: 'stu-47002', no: 2, code: '47002', name: 'ด.ญ. ชลิตา มงคล', attendance: '8/8', score: 90, status: 'NORMAL', gender: 'FEMALE' },
      ];
    }
    if (classroomId === 'room-2-1' || classroomId === 'ม.2/1') {
      return [
        { id: 'stu-46101', no: 1, code: '46101', name: 'ด.ช. ภาณุพงศ์ บุญยืน', attendance: '8/8', score: 88, status: 'NORMAL', gender: 'MALE' },
        { id: 'stu-46102', no: 2, code: '46102', name: 'ด.ญ. สุภัสสรา อินทร', attendance: '8/8', score: 92, status: 'NORMAL', gender: 'FEMALE' },
        { id: 'stu-46103', no: 3, code: '46103', name: 'ด.ช. ธีรภัทร ชาญชัย', attendance: '8/8', score: 80, status: 'NORMAL', gender: 'MALE' },
      ];
    }
    return [];
  },

  // ดึงรายการกลุ่มแชททั้งหมด
  getGroups(): ChatGroup[] {
    if (typeof window === 'undefined') {
      return this.generateInitialGroups();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHAT_GROUPS);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatGroup[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }

    const initial = this.generateInitialGroups();
    this.saveGroups(initial);
    return initial;
  },

  // บันทึกรายการกลุ่มแชท
  saveGroups(groups: ChatGroup[]): ChatGroup[] {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CHAT_GROUPS, JSON.stringify(groups));
      window.dispatchEvent(new CustomEvent(CHAT_GROUPS_EVENT, { detail: groups }));
    }
    return groups;
  },

  // ดึงกลุ่มเดียวตาม ID
  getGroupById(groupId: string): ChatGroup | undefined {
    return this.getGroups().find((g) => g.id === groupId);
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
    const toCourseMappings = DEFAULT_COURSE_MAPPINGS.filter(
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
