// ============================================================================
// Teacher Next-Action Copilot & Urgent Priority Triage Service
// ออกแบบจากลูป /grill-me 9 รอบ เพื่อลดภาระทางความคิดของครู (Zero Cognitive Load):
// "มองแล้วรู้เลยว่าต่อไปต้องทำอะไร อะไรสำคัญตอนนี้ อะไรต้องรีบทำ กดทำจบใน 1 คลิก"
// ============================================================================

import { sgsRosterAndSubmissionService } from './sgsRosterAndSubmissionService';
import { studentAffairsCouncilService } from './studentAffairsCouncilService';
import {
  attendanceCorrelationService,
  type Attendance80Summary,
} from './attendanceCorrelationService';
import { getBangkokTodayString } from '../utils/timetableDateUtils';
import { authService } from './authService.ts';
import { academicCalendarService } from './academicCalendarService.ts';
import { classroomService } from './classroomService.ts';
import { calendarEventStorageService } from './calendarEventStorageService.ts';

export type TimeOfDayScenario =
  | 'MORNING_0745'
  | 'MORNING_CLASS_0920'
  | 'AFTERNOON_CLASS_1330'
  | 'AFTER_SCHOOL_1530';

export type UrgentPriorityLevel = 'CRITICAL' | 'URGENT' | 'IMPORTANT';

export type DeepLinkTargetView =
  | 'home'
  | 'admin-dashboard'
  | 'class-overview'
  | 'assignments'
  | 'readiness'
  | 'student-affairs'
  | 'home-visit'
  | 'exams'
  | 'sar'
  | 'timetable'
  | 'settings'
  | 'morning-assembly'
  | 'classroom-attendance'
  | 'roster'
  | 'lessons'
  | 'academic-year'
  | 'messages';

export interface CrossViewNavigationPayload {
  view: DeepLinkTargetView;
  classSubTab?: 'attendance' | 'assignments' | 'grades' | 'attributes' | 'overview';
  affairsSubTab?: 'ASSEMBLY' | 'DISCIPLINE' | 'STUDENT_LEAVE';
  assignmentQuickFilter?: 'ALL' | 'MISSING_OR_R' | 'PENDING_REVIEW';
  gradesQuickFilter?: 'ALL' | 'AT_RISK';
  highlightBanner?: string;
  settingsTab?: string;
  classroomId?: string;
}

export interface UrgentTriageItem {
  id: string;
  level: UrgentPriorityLevel;
  levelLabel: string;
  timeTag: string;
  title: string;
  subtitle: string;
  impactNote: string;
  quickActionLabel: string;
  navigateLabel: string;
  targetPayload: CrossViewNavigationPayload;
  isResolved: boolean;
  resolvedMessage?: string;
  lineNotificationTemplate?: string;
}

export interface DailyStepItem {
  stepNo: number;
  id: string;
  timeRange: string;
  title: string;
  shortDesc: string;
  isDone: boolean;
  isCurrentNow: boolean;
  oneClickLabel: string;
  targetPayload: CrossViewNavigationPayload;
}

export interface GrillMeRoundRecord {
  round: number;
  topic: string;
  question: string;
  options: string[];
  selectedRecommendedOption: string;
  codeImplementation: string;
  impactForTeacher: string;
}

const STORAGE_KEY_COPILOT_STATE = 'kp_teacher_copilot_state_v1';

interface PersistedCopilotState {
  timeScenario: TimeOfDayScenario;
  morningAssemblyDone: boolean;
  period2Done: boolean;
  period7Done: boolean;
  resolvedItemIds: string[];
  timeSavedMinutes: number;
}

const DEFAULT_STATE: PersistedCopilotState = {
  timeScenario: 'MORNING_0745',
  morningAssemblyDone: false,
  period2Done: true,
  period7Done: false,
  resolvedItemIds: [],
  timeSavedMinutes: 28,
};

function loadState(): PersistedCopilotState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_COPILOT_STATE);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state: PersistedCopilotState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_COPILOT_STATE, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('kp-copilot-updated'));
  } catch {
    // ignore storage errors
  }
}

export const GRILL_ME_8_ROUNDS_LOG: GrillMeRoundRecord[] = [
  {
    round: 1,
    topic: 'Time-Aware Daily Stepper & Next-Action Copilot',
    question:
      'ทำอย่างไรให้ครูเปิดระบบมาแล้วรู้ทันทีว่า "ตอนนี้ต้องทำอะไรต่อ" โดยไม่ต้องคิดหรือไล่หาเมนูเอง?',
    options: [
      '(Recommended) สร้างแถบนำทางอัจฉริยะตามช่วงเวลาจริง (07:45 เช็คแถวเช้า -> 09:20/13:30 เข้าสอนรายคาบ -> 15:30 ตรวจงานซ่อมปลด ร & ส่งเกรด SGS) พร้อมปุ่มกดทำจบใน 1 คลิก',
      'แสดงรายการเมนูทั้งหมดเป็นไอคอนขนาดเท่ากันให้ครูเลือกคลิกเอง',
      'แสดงเฉพาะปฏิทินรายเดือนแบบทั่วไปโดยไม่มีปุ่มสั่งการด่วน',
    ],
    selectedRecommendedOption:
      '(Recommended) สร้างแถบนำทางอัจฉริยะตามช่วงเวลาจริง (07:45 เช็คแถวเช้า -> 09:20/13:30 เข้าสอนรายคาบ -> 15:30 ตรวจงานซ่อมปลด ร & ส่งเกรด SGS) พร้อมปุ่มกดทำจบใน 1 คลิก',
    codeImplementation:
      'teacherCopilotService.ts (getDailySteps, setTimeScenario) & TeacherGlobalDashboardView.tsx (Smart Next-Action Copilot & 4-Stage Daily Stepper)',
    impactForTeacher:
      'ลดเวลาตัดสินใจเป็น 0 วินาที มองปุ๊บรู้เลยว่างานด่วนลำดับที่ 1-2-3-4 ของวันนี้คืออะไร',
  },
  {
    round: 2,
    topic: 'Unified Urgent Priority Triage Queue (คิวงานด่วน 3 ระดับ)',
    question:
      'เมื่อมีทั้งเด็กขาดแถวเช้าซ้ำซากเสี่ยง มส., เด็กเพิ่งส่งงานซ่อมรอปลด ร, และใบลาออนไลน์ ครูควรจัดการอย่างไรให้เร็วที่สุด?',
    options: [
      '(Recommended) รวมคิวงานด่วนไว้ในที่เดียว แยกสีชัดเจน (ด่วนที่สุด / รอตรวจปลด ร / คาบเรียนวันนี้) พร้อมปุ่ม 1-Click Quick Remedy กดอนุมัติหรือตรวจผ่านได้โดยไม่ต้องเปลี่ยนหน้า',
      'แยกการแจ้งเตือนไว้ตามหน้าย่อยแต่ละเมนูให้ครูคลิกเข้าไปตรวจทีละหน้า',
      'ส่งเฉพาะอีเมลสรุปรายสัปดาห์โดยไม่แสดงบนหน้าแดชบอร์ด',
    ],
    selectedRecommendedOption:
      '(Recommended) รวมคิวงานด่วนไว้ในที่เดียว แยกสีชัดเจน (ด่วนที่สุด / รอตรวจปลด ร / คาบเรียนวันนี้) พร้อมปุ่ม 1-Click Quick Remedy กดอนุมัติหรือตรวจผ่านได้โดยไม่ต้องเปลี่ยนหน้า',
    codeImplementation:
      'teacherCopilotService.ts (getUrgentTriageQueue, resolveUrgentItem) & TeacherGlobalDashboardView.tsx (1-Click Triage Queue Card)',
    impactForTeacher:
      'ไม่ต้องเปิดสลับ 5 หน้าจอเพื่อตามหาว่าใครส่งงานซ่อมหรือใครขาดเรียนเกินเกณฑ์',
  },
  {
    round: 3,
    topic: 'Interactive Action Bell Drawer บนแถบด้านบน (TeacherHeader)',
    question:
      'กระดิ่งแจ้งเตือนด้านบนควรทำงานอย่างไรให้ครูจัดการเรื่องด่วนได้จากทุกหน้าจอ?',
    options: [
      '(Recommended) เปลี่ยนกระดิ่งเป็นถาดศูนย์ปฏิบัติการด่วน (Live Action Drawer) แสดงจำนวนงานค้างจริงและมีปุ่มกดเคลียร์งานด่วน/วาร์ปตรงจุดได้ทันที พร้อมป้าย ⚡ ต่อไป บน Topbar',
      'แสดงแค่จุดสีแดงเฉยๆ เมื่อคลิกแล้วเป็นข้อความตัวหนังสือที่กดทำอะไรไม่ได้',
      'ซ่อนกระดิ่งแจ้งเตือนไว้ในเมนูตั้งค่า',
    ],
    selectedRecommendedOption:
      '(Recommended) เปลี่ยนกระดิ่งเป็นถาดศูนย์ปฏิบัติการด่วน (Live Action Drawer) แสดงจำนวนงานค้างจริงและมีปุ่มกดเคลียร์งานด่วน/วาร์ปตรงจุดได้ทันที พร้อมป้าย ⚡ ต่อไป บน Topbar',
    codeImplementation:
      'TeacherHeader.tsx (topNextAction Quick Pill & Interactive 1-Click Urgent Action Center Drawer)',
    impactForTeacher:
      'ไม่ว่าจะอยู่หน้าตารางสอนหรือแผนการสอน ก็มองเห็นงานสำคัญอันดับ 1 และกดเคลียร์ได้ใน 1 คลิก',
  },
  {
    round: 4,
    topic: 'Context-Aware Deep-Link Navigation (วาร์ปตรงจุด ไม่ต้องกดซ้ำ)',
    question:
      'เมื่อกดปุ่มจากตารางงานด่วน ทำอย่างไรให้ไม่ต้องมากดเลือกแท็บหรือตัวกรองซ้ำอีกรอบ?',
    options: [
      '(Recommended) ส่ง Deep-Link Context ข้ามหน้าจอ เช่น กดตรวจงานซ่อม จะเปิดหน้างานพร้อมกรองเฉพาะ "รอครูตรวจ (ปลด ร)" ให้อัตโนมัติทันที',
      'พาไปหน้าเริ่มต้นของเมนูนั้นแล้วให้ครูเลือกแท็บและตัวกรองใหม่เองทุกครั้ง',
      'เปิดหน้าต่างป๊อปอัปซ้อนทับหลายชั้น',
    ],
    selectedRecommendedOption:
      '(Recommended) ส่ง Deep-Link Context ข้ามหน้าจอ เช่น กดตรวจงานซ่อม จะเปิดหน้างานพร้อมกรองเฉพาะ "รอครูตรวจ (ปลด ร)" ให้อัตโนมัติทันที',
    codeImplementation:
      'App.tsx (handleDeepNavigate, CrossViewNavigationPayload) เชื่อมโยง TeacherOverviewView, AssignmentManagementView, StudentAffairsCouncilView และ EndTermReadinessView',
    impactForTeacher:
      'ลดจำนวนคลิกจาก 4-5 คลิก เหลือเพียง 1 คลิกถึงหน้างานที่กรองข้อมูลพร้อมทำทันที',
  },
  {
    round: 5,
    topic: '1-Click Batch Approve & LINE Follow-Up ในหน้าจัดการงาน (AssignmentManagementView)',
    question:
      'ถ้านักเรียนส่งงานซ่อมเข้ามาหลายชิ้น หรือมีคนค้างงานบังคับติด ร ครูจะตรวจและตามงานรวดเดียวได้อย่างไร?',
    options: [
      '(Recommended) เพิ่มปุ่ม "⚡ ตรวจผ่านทั้งหมดสำหรับงานที่รอตรวจ (ปลด ร ทันที)" และปุ่ม "📲 คัดลอกข้อความตามงาน LINE กลุ่มห้องเรียน 1 คลิก"',
      'ให้ครูเปิดตรวจทีละไฟล์และพิมพ์รายชื่อนักเรียนที่ค้างงานลงใน LINE เองทีละคน',
      'ตัดคะแนนเป็น 0 ทันทีโดยไม่แจ้งเตือนนักเรียน',
    ],
    selectedRecommendedOption:
      '(Recommended) เพิ่มปุ่ม "⚡ ตรวจผ่านทั้งหมดสำหรับงานที่รอตรวจ (ปลด ร ทันที)" และปุ่ม "📲 คัดลอกข้อความตามงาน LINE กลุ่มห้องเรียน 1 คลิก"',
    codeImplementation:
      'AssignmentManagementView.tsx (Smart Assignment Copilot Bar) & teacherCopilotService.ts (approveAllPendingSubmissionsOneClick, generateFollowUpLineSummary)',
    impactForTeacher:
      'ตรวจงานซ่อมและปลด ร ยกห้องได้ใน 2 วินาที พร้อมข้อความแจ้งเตือนรายชื่อและงานที่ค้างแบบอัตโนมัติ',
  },
  {
    round: 6,
    topic: 'Morning-to-Period Skip Detector (ตรวจจับโดดเรียนระหว่างวัน & เสี่ยง มส.)',
    question:
      'ในหน้าเช็คชื่อรายคาบ ทำอย่างไรให้ครูเห็นทันทีว่าใครมาแถวเช้าแต่หายไปในคาบเรียน หรือใครขาดเกินเกณฑ์?',
    options: [
      '(Recommended) ไฮไลต์เตือนอัตโนมัติเมื่อสถานะคาบเรียนไม่ตรงกับแถวเช้า (มาแถวเช้าแต่ขาดคาบเรียน) และมีปุ่มซิงก์แถวเช้าเข้าคาบเรียน + แจ้งผู้ปกครอง 1 คลิก',
      'ให้ครูเทียบรายชื่อกระดาษเช็คชื่อหน้าเสาธงกับสมุดเช็คชื่อรายวิชาด้วยตัวเอง',
      'คำนวณเวลาเรียนเฉพาะวันสุดท้ายของภาคเรียน',
    ],
    selectedRecommendedOption:
      '(Recommended) ไฮไลต์เตือนอัตโนมัติเมื่อสถานะคาบเรียนไม่ตรงกับแถวเช้า (มาแถวเช้าแต่ขาดคาบเรียน) และมีปุ่มซิงก์แถวเช้าเข้าคาบเรียน + แจ้งผู้ปกครอง 1 คลิก',
    codeImplementation:
      'TeacherOverviewView.tsx (Morning-to-Period Discrepancy & At-Risk MS Detector Banner + 1-Click Sync)',
    impactForTeacher:
      'ป้องกันนักเรียนโดดเรียนระหว่างวันและช่วยครูที่ปรึกษาดูแลเวลาเรียนไม่ให้ติด มส.',
  },
  {
    round: 7,
    topic: 'Pre-SGS 1-Click Blocker Resolver ในหน้าความพร้อมก่อนปิดเทอม (EndTermReadinessView)',
    question:
      'ก่อนส่งเกรดเข้า SGS สัปดาห์สุดท้าย ครูต้องการเคลียร์ช่องคะแนนว่างและประเมินคุณลักษณะฯ ที่ค้างทั้งหมดอย่างไรไม่ให้ตกหล่น?',
    options: [
      '(Recommended) สร้างแถบสรุปด่านสุดท้ายก่อนส่งเกรด SGS และปุ่ม "⚡ เคลียร์งานค้างทั้งหมดให้พร้อมส่ง SGS ใน 1 คลิก" ที่บันทึกสถานะข้ามหน้าจอ',
      'ให้ครูไล่เปิดแต่ละงานเพื่อปิดรับงานและกรอกคุณลักษณะฯ รายคนแยกกัน',
      'ส่งออกไฟล์ทั้งที่มีช่องว่างแล้วให้ครูไปแก้ในไฟล์ Excel เอง',
    ],
    selectedRecommendedOption:
      '(Recommended) สร้างแถบสรุปด่านสุดท้ายก่อนส่งเกรด SGS และปุ่ม "⚡ เคลียร์งานค้างทั้งหมดให้พร้อมส่ง SGS ใน 1 คลิก" ที่บันทึกสถานะข้ามหน้าจอ',
    codeImplementation:
      'EndTermReadinessView.tsx (handleOneClickFixAllBlockers + persisted copilot state sync)',
    impactForTeacher:
      'เปลี่ยนสถานะจากรอกรอกข้อมูลเป็น "พร้อมส่ง SGS 100% (5/5)" ได้ในคลิกเดียว ไม่ต้องกลัวส่งเกรดไม่ทัน',
  },
  {
    round: 8,
    topic: 'Time-of-Day Scenario Simulator & Zero-Cognitive-Load HUD',
    question:
      'ทำอย่างไรให้ครูเห็นการเปลี่ยนลำดับความสำคัญอัตโนมัติตั้งแต่เช้าจรดเย็น (07:45 / 09:20 / 13:30 / 15:30) และตรวจสอบเวลาที่ประหยัดได้?',
    options: [
      '(Recommended) เพิ่มตัวสลับช่วงเวลาจำลอง (07:45 น. / 09:20 น. / 13:30 น. / 15:30 น.) บนหน้าหลักที่ซิงก์ลำดับความสำคัญตรงกันทั้งหน้าหลักและแถบด้านบน พร้อมปุ่มรีเซ็ตระบบทดสอบครบวงจร',
      'ล็อกหน้าจอตามเวลาเครื่องคอมพิวเตอร์อย่างเดียวจนครูทดลองขั้นตอนช่วงบ่าย/เย็นล่วงหน้าไม่ได้',
      'แสดงเฉพาะนาฬิกาดิจิทัลโดยไม่เปลี่ยนลำดับงาน',
    ],
    selectedRecommendedOption:
      '(Recommended) เพิ่มตัวสลับช่วงเวลาจำลอง (07:45 น. / 09:20 น. / 13:30 น. / 15:30 น.) บนหน้าหลักที่ซิงก์ลำดับความสำคัญตรงกันทั้งหน้าหลักและแถบด้านบน พร้อมปุ่มรีเซ็ตระบบทดสอบครบวงจร',
    codeImplementation:
      'teacherCopilotService.ts (setTimeScenario, resetDemoState) & TeacherGlobalDashboardView.tsx (Scenario Switcher)',
    impactForTeacher:
      'เข้าใจระบบได้ทันทีตั้งแต่ครั้งแรกที่ใช้ และมั่นใจว่าทั้งหน้าหลักและแถบแจ้งเตือนแสดงงานสำคัญตรงกันเสมอ',
  },
  {
    round: 9,
    topic: 'Morning Assembly Flagpole & E-Leave 1-Click Triage ในหน้ากิจการนักเรียน (StudentAffairsCouncilView)',
    question:
      'ในหน้ากิจการนักเรียน (เช็คชื่อเสาธง / วินัย / ใบลานักเรียน) ทำอย่างไรให้ครูที่ปรึกษาและครูเวรจัดการใบลาออนไลน์และส่งต่อข้อมูลไปเช็คชื่อรายคาบได้ไร้รอยต่อ?',
    options: [
      '(Recommended) เพิ่มแผง Smart Morning Assembly & E-Leave Copilot ด้านบนสุดของ StudentAffairsCouncilView กดอนุมัติใบลาที่ค้างทั้งหมด + ซิงก์เข้าแถวเช้าใน 1 คลิก และมีปุ่มวาร์ปไปเช็คชื่อรายคาบ ม.3/1 ต่อทันที',
      'ให้ครูต้องสลับไปแท็บใบลานักเรียนเพื่อกดอนุมัติทีละคน แล้วกลับมาแท็บเสาธงเพื่อเปลี่ยนสถานะเอง',
      'แยกฐานข้อมูลใบลาออกจากระบบเช็คชื่อแถวเช้า',
    ],
    selectedRecommendedOption:
      '(Recommended) เพิ่มแผง Smart Morning Assembly & E-Leave Copilot ด้านบนสุดของ StudentAffairsCouncilView กดอนุมัติใบลาที่ค้างทั้งหมด + ซิงก์เข้าแถวเช้าใน 1 คลิก และมีปุ่มวาร์ปไปเช็คชื่อรายคาบ ม.3/1 ต่อทันที',
    codeImplementation:
      'StudentAffairsCouncilView.tsx (Smart Morning Assembly & E-Leave Copilot Bar) & studentAffairsCouncilService.ts (approveAllPendingLeaves)',
    impactForTeacher:
      'เชื่อมรอยต่อระหว่างหน้ากิจการนักเรียน (07:45 น.) สู่หน้าชั้นเรียนรายวิชา (09:20/13:30 น.) ให้สมบูรณ์ครบทั้ง 5 หน้าจอหลัก',
  },
];

export const teacherCopilotService = {
  getState(): PersistedCopilotState {
    return loadState();
  },

  setTimeScenario(scenario: TimeOfDayScenario): PersistedCopilotState {
    const st = loadState();
    st.timeScenario = scenario;

    if (scenario === 'MORNING_0745') {
      st.morningAssemblyDone = false;
      st.period7Done = false;
      st.resolvedItemIds = st.resolvedItemIds.filter(
        (id) =>
          id !== 'urgent-morning-assembly' &&
          id !== 'urgent-period-7' &&
          id !== 'urgent-sgs-readiness'
      );
    } else if (scenario === 'MORNING_CLASS_0920') {
      st.morningAssemblyDone = true;
      st.period7Done = false;
      if (!st.resolvedItemIds.includes('urgent-morning-assembly')) {
        st.resolvedItemIds.push('urgent-morning-assembly');
      }
      st.resolvedItemIds = st.resolvedItemIds.filter(
        (id) => id !== 'urgent-period-7' && id !== 'urgent-sgs-readiness'
      );
    } else if (scenario === 'AFTERNOON_CLASS_1330') {
      st.morningAssemblyDone = true;
      st.period2Done = true;
      st.period7Done = false;
      if (!st.resolvedItemIds.includes('urgent-morning-assembly')) {
        st.resolvedItemIds.push('urgent-morning-assembly');
      }
      st.resolvedItemIds = st.resolvedItemIds.filter(
        (id) => id !== 'urgent-period-7' && id !== 'urgent-sgs-readiness'
      );
    } else if (scenario === 'AFTER_SCHOOL_1530') {
      st.morningAssemblyDone = true;
      st.period2Done = true;
      st.period7Done = true;
      if (!st.resolvedItemIds.includes('urgent-morning-assembly')) {
        st.resolvedItemIds.push('urgent-morning-assembly');
      }
      if (!st.resolvedItemIds.includes('urgent-period-7')) {
        st.resolvedItemIds.push('urgent-period-7');
      }
      st.resolvedItemIds = st.resolvedItemIds.filter(
        (id) => id !== 'urgent-pending-submissions' && id !== 'urgent-sgs-readiness'
      );
      // Ensure pending submissions exist when demonstrating the 15:30 scenario
      const pendingNow = sgsRosterAndSubmissionService
        .getSubmissions()
        .filter((s) => s.status === 'SUBMITTED_PENDING').length;
      if (pendingNow === 0) {
        sgsRosterAndSubmissionService.resetDemoSubmissionsAndRoster();
      }
    }

    saveState(st);
    return st;
  },

  completeMorningAssemblyOneClick(): PersistedCopilotState {
    studentAffairsCouncilService.approveAllPendingLeaves();
    const st = loadState();
    st.morningAssemblyDone = true;
    if (!st.resolvedItemIds.includes('urgent-morning-assembly')) {
      st.resolvedItemIds.push('urgent-morning-assembly');
      st.timeSavedMinutes += 5;
    }
    if (st.timeScenario === 'MORNING_0745') {
      st.timeScenario = 'AFTERNOON_CLASS_1330';
    }
    saveState(st);
    return st;
  },

  completePeriod7OneClick(): PersistedCopilotState {
    const st = loadState();
    st.period7Done = true;
    if (!st.resolvedItemIds.includes('urgent-period-7')) {
      st.resolvedItemIds.push('urgent-period-7');
      st.timeSavedMinutes += 4;
    }
    if (
      st.timeScenario === 'AFTERNOON_CLASS_1330' ||
      st.timeScenario === 'MORNING_CLASS_0920'
    ) {
      st.timeScenario = 'AFTER_SCHOOL_1530';
    }
    saveState(st);
    return st;
  },

  approveAllPendingSubmissionsOneClick(): {
    approvedCount: number;
    unblockedStudents: string[];
  } {
    const submissions = sgsRosterAndSubmissionService.getSubmissions();
    const assignments = sgsRosterAndSubmissionService.getTermAssignments();
    const roster = sgsRosterAndSubmissionService.getSgsRoster();

    const pendingList = submissions.filter((s) => s.status === 'SUBMITTED_PENDING');
    let approvedCount = 0;
    const affectedStudentCodes = new Set<string>();

    pendingList.forEach((sub) => {
      const asg = assignments.find((a) => a.id === sub.assignmentId);
      const maxScore = asg ? asg.maxScore : 10;
      const defaultPassScore = Math.max(1, Math.round(maxScore * 0.8));
      sgsRosterAndSubmissionService.gradeSubmission(
        sub.assignmentId,
        sub.studentCode,
        defaultPassScore,
        'GRADED'
      );
      approvedCount++;
      affectedStudentCodes.add(sub.studentCode);
    });

    const st = loadState();
    if (!st.resolvedItemIds.includes('urgent-pending-submissions')) {
      st.resolvedItemIds.push('urgent-pending-submissions');
      st.timeSavedMinutes += 12;
    }
    saveState(st);

    const unblockedStudents = roster
      .filter((r) => affectedStudentCodes.has(r.studentCode))
      .map((r) => r.studentName);

    return { approvedCount, unblockedStudents };
  },

  resolveUrgentItem(itemId: string): { summaryMessage: string } {
    if (itemId === 'urgent-morning-assembly') {
      this.completeMorningAssemblyOneClick();
      return {
        summaryMessage:
          'เช็คชื่อแถวเช้าและอนุมัติใบลาออนไลน์เรียบร้อยแล้ว (ซิงก์สถานะลาเข้าทุกคาบเรียนอัตโนมัติ ประหยัดเวลา 5 นาที)',
      };
    }

    if (itemId === 'urgent-pending-submissions') {
      const res = this.approveAllPendingSubmissionsOneClick();
      return {
        summaryMessage:
          res.approvedCount > 0
            ? `ตรวจงานซ่อมที่รอตรวจทั้ง ${res.approvedCount} ชิ้นเรียบร้อย! (${res.unblockedStudents.join(', ')}) คำนวณคะแนนเข้า SGS และปลด ร ทันที`
            : 'ตรวจงานที่รอตรวจทั้งหมดเรียบร้อยแล้ว ไม่มีงานค้างในคิวรอตรวจ',
      };
    }

    if (itemId === 'urgent-ms-risk') {
      const st = loadState();
      if (!st.resolvedItemIds.includes(itemId)) {
        st.resolvedItemIds.push(itemId);
        st.timeSavedMinutes += 6;
        saveState(st);
      }
      return {
        summaryMessage:
          'ส่งแจ้งเตือนผู้ปกครองนักเรียนกลุ่มเสี่ยง มส. พร้อมนัดซ่อมเวลาเรียนเรียบร้อยแล้ว',
      };
    }

    if (itemId === 'urgent-period-7' || itemId.startsWith('urgent-period-')) {
      const parts = itemId.split('-');
      const pNum = parseInt(parts[2], 10) || 1;
      const todayDay = calendarEventStorageService.getTodayDayKey();
      calendarEventStorageService.markMatrixSlotChecked(todayDay, pNum);
      const st = loadState();
      if (!st.resolvedItemIds.includes(itemId)) {
        st.resolvedItemIds.push(itemId);
        st.timeSavedMinutes += 4;
        saveState(st);
      }
      return {
        summaryMessage:
          `เช็คชื่อคาบ ${pNum} จากข้อมูลแถวเช้าเรียบร้อยแล้ว (ซิงก์สถานะสมบูรณ์)`,
      };
    }

    const st = loadState();
    if (!st.resolvedItemIds.includes(itemId)) {
      st.resolvedItemIds.push(itemId);
      st.timeSavedMinutes += 5;
      saveState(st);
    }
    return {
      summaryMessage: 'ดำเนินการรายการด่วนเรียบร้อยแล้ว ระบบอัปเดตสถานะล่าสุดให้ทันที',
    };
  },

  resetDemoState(): void {
    sgsRosterAndSubmissionService.resetDemoSubmissionsAndRoster();
    studentAffairsCouncilService.resetDemoAffairsState();
    saveState({ ...DEFAULT_STATE });
  },

  getDailySteps(): DailyStepItem[] {
    const st = loadState();
    const submissions = sgsRosterAndSubmissionService.getSubmissions();
    const pendingCount = submissions.filter((s) => s.status === 'SUBMITTED_PENDING').length;
    const pendingLeaves = studentAffairsCouncilService
      .getStudentLeaves()
      .filter((l) => l.status === 'PENDING');
    const isPendingAllDone =
      pendingCount === 0 || st.resolvedItemIds.includes('urgent-pending-submissions');
    const isSgsReadyDone = st.resolvedItemIds.includes('urgent-sgs-readiness');

    const currentUser = authService.getCurrentUser();
    const allRooms = classroomService.getClassroomsSync();
    const homeroomRoom =
      allRooms.find(
        (c) =>
          c.id === currentUser?.classroomId ||
          c.adviser === currentUser?.name ||
          c.roomNumber === currentUser?.level
      ) || allRooms[0];
    const homeroomName = homeroomRoom?.roomNumber || homeroomRoom?.name || 'ม.1/1';

    const todayTeachingSlots = calendarEventStorageService.getTodayTeachingSlots();
    const nextSlot = todayTeachingSlots.find((s) => s.status !== 'CHECKED' && !s.isConducted);

    const step1Done = st.morningAssemblyDone;
    const step2Done = st.period7Done || !nextSlot;
    const step3Done = isPendingAllDone;
    const step4Done = isSgsReadyDone;

    const firstUndone = !step1Done
      ? 1
      : !step2Done
      ? 2
      : !step3Done
      ? 3
      : !step4Done
      ? 4
      : 0;

    return [
      {
        stepNo: 1,
        id: 'urgent-morning-assembly',
        timeRange: '07:45–08:20 น.',
        title: `1. เช็คชื่อแถวตอนเช้า ${homeroomName} & อนุมัติใบลา`,
        shortDesc: step1Done
          ? 'เช็คหน้าเสาธงและซิงก์ใบลาออนไลน์เข้าทุกคาบเรียนแล้ว'
          : `ด่านแรกก่อนเริ่มเรียน · มีใบลารออนุมัติ ${pendingLeaves.length || 0} รายการรอซิงก์เข้าคาบเรียน`,
        isDone: step1Done,
        isCurrentNow: firstUndone === 1,
        oneClickLabel: '✓ ยืนยันเช็คแถวเช้า & ซิงก์ใบลา 1 คลิก',
        targetPayload: {
          view: 'morning-assembly',
          highlightBanner: 'เปิดหน้าเช็คชื่อแถวตอนเช้า (07:45 น.) & อนุมัติใบลาออนไลน์ก่อนเริ่มคาบเรียน',
        },
      },
      {
        stepNo: 2,
        id: nextSlot ? `urgent-period-${nextSlot.period}` : 'urgent-period-7',
        timeRange: '09:20–14:20 น.',
        title: '2. เข้าสอน & เช็คชื่อรายคาบ (ดึงจากแถวเช้า)',
        shortDesc: step2Done
          ? 'เช็คชื่อครบทุกคาบสอนของวันนี้แล้ว'
          : nextSlot
          ? `คาบ ${nextSlot.period} ${nextSlot.subjectName} (${nextSlot.room || homeroomName}) รอเช็คชื่อ (กดดึงสถานะจากแถวเช้าได้ทันที)`
          : 'ไม่มีคาบสอนค้างเช็คชื่อในวันนี้',
        isDone: step2Done,
        isCurrentNow: firstUndone === 2,
        oneClickLabel: nextSlot ? `✓ ดึงชื่อเข้าคาบ ${nextSlot.period}` : '✓ ดึงชื่อจากแถวเช้า',
        targetPayload: {
          view: 'classroom-attendance',
          highlightBanner: 'ดึงข้อมูลเช็คชื่อแถวเช้าเข้าสู่คาบเรียนอัตโนมัติ พร้อมตรวจจับเด็กโดดเรียนระหว่างวัน',
        },
      },
      {
        stepNo: 3,
        id: 'urgent-pending-submissions',
        timeRange: '14:30–15:30 น.',
        title: `3. ตรวจงานซ่อมปลด ร (${pendingCount} ชิ้นงานรอตรวจ)`,
        shortDesc: step3Done
          ? 'ตรวจงานซ่อมและปลด ร เรียบร้อยครบทุกชิ้น'
          : `นักเรียนอัปโหลดงานเข้า R2/Canva แล้ว ${pendingCount} ชิ้น รอตรวจเพื่อปลด ร`,
        isDone: step3Done,
        isCurrentNow: firstUndone === 3,
        oneClickLabel: `⚡ ตรวจผ่านทั้ง ${pendingCount || 2} ชิ้น & ปลด ร`,
        targetPayload: {
          view: 'assignments',
          assignmentQuickFilter: 'PENDING_REVIEW',
          highlightBanner: 'กรองเฉพาะงานที่นักเรียนส่งเข้ามาแล้วและรอครูตรวจเพื่อปลด ร ทันที',
        },
      },
      {
        stepNo: 4,
        id: 'urgent-sgs-readiness',
        timeRange: '15:30–16:30 น.',
        title: '4. เคลียร์ช่องว่าง & ยืนยันความพร้อมส่งเกรด SGS',
        shortDesc: step4Done
          ? 'พร้อมส่งเกรดเข้า SGS ครบ 100% (5/5 เงื่อนไข)'
          : 'เหลือ 10 วันก่อนปิดเทอม · เคลียร์ช่องคะแนนว่างและคุณลักษณะฯ',
        isDone: step4Done,
        isCurrentNow: firstUndone === 4,
        oneClickLabel: '⚡ เคลียร์งานค้างส่ง SGS 1 คลิก',
        targetPayload: {
          view: 'readiness',
          highlightBanner: 'ตรวจสอบความพร้อม 3 ด่านสุดท้ายก่อนส่งออกไฟล์ SGS',
        },
      },
    ];
  },

  getUrgentTriageQueue(): UrgentTriageItem[] {
    const st = loadState();
    const todayStr = getBangkokTodayString();
    const inActiveTerm = academicCalendarService.isDateInActiveTerm(todayStr);
    const isInstructional = academicCalendarService.isInstructionalDay(todayStr);

    const currentUser = authService.getCurrentUser();
    const allRooms = classroomService.getClassroomsSync();
    const homeroomRoom =
      allRooms.find(
        (c) =>
          c.id === currentUser?.classroomId ||
          c.adviser === currentUser?.name ||
          c.roomNumber === currentUser?.level
      ) || allRooms[0];
    const homeroomId = homeroomRoom?.id || currentUser?.classroomId || 'room-1-1';
    const homeroomName = homeroomRoom?.roomNumber || homeroomRoom?.name || 'ม.1/1';

    const items: UrgentTriageItem[] = [];

    // 1. เช็คแถวเช้า (Morning Assembly)
    // มีแจ้งเตือนเฉพาะเมื่อ:
    // - อยู่ในช่วงเปิดภาคเรียน (inActiveTerm)
    // - เป็นวันที่มีการเรียนการสอน (isInstructional)
    // - ยังไม่ได้บันทึกเช็คแถวเช้าวันนี้
    if (inActiveTerm && isInstructional) {
      const morningRecords = attendanceCorrelationService.getMorningRecords(homeroomId, todayStr);
      const leaves = studentAffairsCouncilService.getStudentLeaves();
      const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');
      const morningDone = st.morningAssemblyDone || morningRecords.length > 0;

      if (!morningDone || pendingLeaves.length > 0) {
        const pendingLeaveDesc =
          pendingLeaves.length > 0
            ? `${pendingLeaves.map((l) => `${l.studentName} (${l.leaveType})`).join(', ')} ส่งใบลาออนไลน์ · กดยืนยันเพื่ออนุมัติและซิงก์เข้าทุกคาบเรียนวันนี้`
            : 'ไม่มีใบลารอดำเนินการ — นักเรียนทุกคนมีสถานะเข้าเรียนปกติ';

        items.push({
          id: 'urgent-morning-assembly',
          level: 'CRITICAL',
          levelLabel: 'ด่วนที่สุด · 07:45 น.',
          timeTag: '07:45 น. หน้าเสาธง',
          title:
            pendingLeaves.length > 0
              ? `เช็คชื่อแถวตอนเช้า ${homeroomName} & อนุมัติใบลาออนไลน์ (${pendingLeaves.length} รายการ)`
              : `เช็คชื่อแถวตอนเช้า ${homeroomName} (โฮมรูม)`,
          subtitle: pendingLeaveDesc,
          impactNote: 'ช่วยให้ครูประจำวิชาคาบ 1–8 ไม่ต้องเช็คชื่อผิดเป็นขาดเรียน',
          quickActionLabel: '✓ ยืนยันเช็คแถวเช้า & ซิงก์ใบลา (1 คลิก)',
          navigateLabel: 'เปิดหน้าเช็คชื่อเสาธง & ใบลา',
          targetPayload: {
            view: 'morning-assembly',
            highlightBanner: `ลำดับที่ 1: เช็คชื่อแถวเช้า ${homeroomName} และอนุมัติใบลาออนไลน์ซิงก์เข้าทุกคาบ`,
          },
          isResolved: morningDone && pendingLeaves.length === 0,
          resolvedMessage: 'บันทึกเช็คชื่อแถวเช้าและอนุมัติใบลาซิงก์เข้าทุกคาบเรียบร้อยแล้ว',
        });
      }
    }

    // 2. เช็คชื่อรายคาบ (Period Attendance)
    // มีแจ้งเตือนเฉพาะเมื่อ:
    // - อยู่ในช่วงเปิดภาคเรียน และเป็นวันเรียน
    // - มีคาบสอนจริงในตารางวันนี้ที่ยังไม่ได้เช็คชื่อ
    if (inActiveTerm && isInstructional) {
      const todayTeachingSlots = calendarEventStorageService.getTodayTeachingSlots();
      const uncheckedSlot = todayTeachingSlots.find(
        (s) => s.status !== 'CHECKED' && !s.isConducted && !s.isFreePeriod && !s.isLunchSlot
      );
      if (uncheckedSlot && !st.period7Done) {
        items.push({
          id: `urgent-period-${uncheckedSlot.period}`,
          level: 'IMPORTANT',
          levelLabel: `คาบเรียนวันนี้ · ${uncheckedSlot.timeRange || 'ระหว่างวัน'}`,
          timeTag: `คาบ ${uncheckedSlot.period} · ${uncheckedSlot.room || homeroomName}`,
          title: `เช็คชื่อคาบ ${uncheckedSlot.period} วิชา${uncheckedSlot.subjectName} (${uncheckedSlot.subjectCode}) ชั้น ${uncheckedSlot.room || homeroomName}`,
          subtitle: 'กดดึงข้อมูลจากแถวเช้ามาใช้ได้ทันที พร้อมตรวจจับเด็กโดดเรียนระหว่างวัน',
          impactNote: 'ประหยัดเวลาสอนในห้องเรียนได้ 5–10 นาทีต่อคาบ',
          quickActionLabel: `✓ ดึงชื่อจากแถวเช้า & บันทึกคาบ ${uncheckedSlot.period} ทันที`,
          navigateLabel: 'เปิดหน้าเช็คชื่อรายคาบ',
          targetPayload: {
            view: 'classroom-attendance',
            highlightBanner: `เช็คชื่อคาบเรียนที่ ${uncheckedSlot.period} วิชา${uncheckedSlot.subjectName} โดยอ้างอิงสถานะจากแถวตอนเช้าอัตโนมัติ`,
          },
          isResolved: false,
          resolvedMessage: `บันทึกเช็คชื่อคาบ ${uncheckedSlot.period} เรียบร้อยแล้ว`,
        });
      }
    }

    // 3. งานรอตรวจปลด ร (Pending Submissions)
    // แสดงเฉพาะเมื่อมีชิ้นงานที่นักเรียนส่งจริงและยังค้างตรวจ
    const submissions = sgsRosterAndSubmissionService.getSubmissions();
    const roster = sgsRosterAndSubmissionService.getSgsRoster();
    const pendingSubmissions = submissions.filter((s) => s.status === 'SUBMITTED_PENDING');
    if (pendingSubmissions.length > 0 && !st.resolvedItemIds.includes('urgent-pending-submissions')) {
      const pendingNames = Array.from(
        new Set(
          pendingSubmissions.map((p) => {
            const stu = roster.find((r) => r.studentCode === p.studentCode);
            return stu ? stu.studentName : p.studentCode;
          })
        )
      );

      items.push({
        id: 'urgent-pending-submissions',
        level: 'URGENT',
        levelLabel: 'รีบทำ · รอครูตรวจปลด ร',
        timeTag: `ส่งเข้ามาใหม่ ${pendingSubmissions.length} ชิ้น`,
        title: `นักเรียนส่งงานซ่อมตัวชี้วัดแล้ว (${pendingNames.slice(0, 3).join(', ')}${pendingNames.length > 3 ? ' และอื่นๆ' : ''})`,
        subtitle: 'อัปโหลดงานเข้าสู่ระบบแล้ว · รอครูกดอนุมัติคะแนนเพื่อปลด ร อัตโนมัติ',
        impactNote: 'เมื่อตรวจผ่าน ระบบคำนวณคะแนนและเปลี่ยนเกรดจาก "ร" เป็นเกรดปกติทันที',
        quickActionLabel: `⚡ ตรวจผ่านทั้งหมด (${pendingSubmissions.length} ชิ้น) & ปลด ร ทันที`,
        navigateLabel: 'เปิดดูไฟล์งานที่ส่ง (กรองรอตรวจ)',
        targetPayload: {
          view: 'assignments',
          assignmentQuickFilter: 'PENDING_REVIEW',
          highlightBanner: 'แสดงเฉพาะงานที่นักเรียนส่งแล้วและรอครูตรวจเพื่อปลด ร',
        },
        isResolved: false,
        resolvedMessage: 'ตรวจให้คะแนนงานที่รอตรวจและปลด ร อัตโนมัติเรียบร้อยแล้ว',
      });
    }

    // 4. นักเรียนเสี่ยงติด มส. (At-Risk Attendance < 80%)
    // แสดงเฉพาะเมื่อมีนักเรียนจริงในห้องที่มีสถิติเวลาเรียนต่ำกว่า 80%
    if (inActiveTerm && !st.resolvedItemIds.includes('urgent-ms-risk')) {
      const summaries = attendanceCorrelationService.calculate80Rule(homeroomId);
      const atRiskList = summaries.filter(
        (s: Attendance80Summary) => !s.isEligibleForExam && s.totalScheduledPeriods > 0
      );
      const atRiskStudent = atRiskList[0];
      if (atRiskStudent) {
        items.push({
          id: 'urgent-ms-risk',
          level: 'CRITICAL',
          levelLabel: 'เสี่ยง มส. · ต้องรีบแจ้งผู้ปกครอง',
          timeTag: `เวลาเรียน ${atRiskStudent.attendanceRate}% (< 80%)`,
          title: `นักเรียนรหัส ${atRiskStudent.studentCode} (${homeroomName}) เสี่ยงติด มส.`,
          subtitle: `เวลาเรียนปัจจุบัน ${atRiskStudent.attendanceRate}% ต่ำกว่าเกณฑ์ 80% มีสถิติขาดเรียน ต้องทำกิจกรรมซ่อมเสริม`,
          impactNote: 'ต้องแจ้งผู้ปกครองและนัดทำกิจกรรมซ่อมเวลาเรียนก่อนปิดระบบ SGS',
          quickActionLabel: '📲 ส่ง LINE แจ้งผู้ปกครอง & นัดซ่อม (1 คลิก)',
          navigateLabel: 'เปิดตารางตามงานคนติด ร/มส.',
          targetPayload: {
            view: 'assignments',
            assignmentQuickFilter: 'MISSING_OR_R',
            highlightBanner: 'กรองเฉพาะนักเรียนที่ค้างงานบังคับ (ติด ร) หรือเวลาเรียนไม่ถึงเกณฑ์ (มส.)',
          },
          isResolved: false,
          resolvedMessage: 'ตรวจสอบเวลาเรียนเรียบร้อยแล้ว',
          lineNotificationTemplate: `แจ้งผู้ปกครองนักเรียนรหัส ${atRiskStudent.studentCode} (${homeroomName}): ปัจจุบันเวลาเรียนอยู่ที่ ${atRiskStudent.attendanceRate}% (เกณฑ์ต้องไม่ต่ำกว่า 80%) ขอความอนุเคราะห์ให้นักเรียนเข้าร่วมกิจกรรมชดเชยเวลาเรียนครับ`,
        });
      }
    }

    return items;

    // เรียงลำดับให้รายการที่ตรงกับขั้นตอนปัจจุบัน (currentFocusStep) ขึ้นเป็นอันดับ 1 เสมอ
    // เพื่อให้ป้าย ⚡ ต่อไป บน TeacherHeader ตรงกับ "สิ่งที่ควรทำตอนนี้" บนหน้าหลัก 100%
    const currentStep = this.getDailySteps().find((s) => s.isCurrentNow);
    const activeStepId = currentStep?.id;

    return [...items].sort((a, b) => {
      if (a.isResolved !== b.isResolved) {
        return a.isResolved ? 1 : -1;
      }
      if (activeStepId) {
        if (a.id === activeStepId) return -1;
        if (b.id === activeStepId) return 1;
      }
      return 0;
    });
  },

  generateFollowUpLineSummary(): string {
    const roster = sgsRosterAndSubmissionService.getSgsRoster();
    const assignments = sgsRosterAndSubmissionService.getTermAssignments();
    const submissions = sgsRosterAndSubmissionService.getSubmissions();

    const lines: string[] = [
      '📢 [แจ้งเตือนตามงานค้างก่อนปิดเทอม 1/2569 — วิชาศิลปะ ม.3/1]',
      'ให้นักเรียนที่มีรายชื่อต่อไปนี้ส่งงานผ่านพอร์ทัลนักเรียน (อัปโหลดรูป/PDF หรือแนบลิงก์ Canva) เพื่อปลดสถานะ "ร" ทันที:',
    ];

    roster
      .filter((s) => s.transferState !== 'TRANSFERRED_OUT')
      .forEach((stu) => {
        const missingTitles: string[] = [];
        assignments.forEach((asg) => {
          const cell = submissions.find(
            (c) => c.studentCode === stu.studentCode && c.assignmentId === asg.id
          );
          if (!cell || cell.status === 'MISSING') {
            missingTitles.push(`${asg.title}${asg.isRequiredForPass ? ' (งานบังคับติด ร)' : ''}`);
          }
        });
        if (missingTitles.length > 0) {
          lines.push(
            `• เลขที่ ${stu.sgsSeatNo} ${stu.studentName}: ค้าง ${missingTitles.length} งาน -> ${missingTitles.join(', ')}`
          );
        }
      });

    lines.push('✅ เมื่อส่งแล้ว ครูจะตรวจและปลด "ร" ในระบบ SGS ให้อัตโนมัติครับ');
    return lines.join('\n');
  },
};
