// src/components/dashboard/TeacherTodayTimetableCard.tsx
// การ์ดตารางสอนวันนี้ (รวมเข้าแถวเช้า คาบ 0 + คาบ 1-5) ตามภาพต้นแบบ Mockup Image 1 & Image 2

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronRight,
  UserCheck,
  Star,
  MapPin,
  Users,
  Sun,
  Check,
  Eye,
} from 'lucide-react';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';
import {
  bellScheduleService,
  BELL_SCHEDULE_UPDATED_EVENT,
  type SchoolBellScheduleConfig,
} from '../../services/bellScheduleService';
import type { AuthUser } from '../../services/authService';

export interface TodayPeriodItem {
  periodNumber: number;
  timeRange: string;
  iconType: 'hiragana' | 'nihon' | 'torii' | 'activity' | 'morning';
  iconBgColor: string;
  subjectTitle: string;
  courseCode?: string;
  credits?: string;
  totalPeriods?: string;
  subType?: string;
  classroom: string;
  isMorningAssembly?: boolean;
  hasGradingButton?: boolean;
  isCompleted?: boolean;
}

export const TODAY_PERIODS_MOCK: TodayPeriodItem[] = [
  {
    periodNumber: 0,
    timeRange: '07:45 - 08:15',
    iconType: 'morning',
    iconBgColor: 'bg-sky-500',
    subjectTitle: 'เช็คแถวเช้า & โฮมรูม (ม.3/1)',
    courseCode: 'โฮมรูม',
    classroom: 'ห้อง ม.3/1 (ห้องประจำชั้น)',
    isMorningAssembly: true,
    hasGradingButton: false,
  },
  {
    periodNumber: 1,
    timeRange: '07:45 - 08:30',
    iconType: 'hiragana',
    iconBgColor: 'bg-[#EF4444]',
    subjectTitle: 'ภาษาญี่ปุ่น ม.3/1',
    courseCode: 'ญ31201',
    credits: '0.5 หน่วยกิต',
    totalPeriods: '20 คาบ',
    classroom: 'ห้อง ม.3/1',
    hasGradingButton: true,
  },
  {
    periodNumber: 2,
    timeRange: '09:20 - 10:10',
    iconType: 'hiragana',
    iconBgColor: 'bg-[#EF4444]',
    subjectTitle: 'ภาษาญี่ปุ่น ม.3/1',
    courseCode: 'ญ31201',
    credits: '0.5 หน่วยกิต',
    totalPeriods: '20 คาบ',
    classroom: 'ห้อง ม.3/1',
    hasGradingButton: true,
  },
  {
    periodNumber: 3,
    timeRange: '11:10 - 12:00',
    iconType: 'nihon',
    iconBgColor: 'bg-[#9333EA]',
    subjectTitle: 'ภาษาญี่ปุ่น ม.3/2',
    courseCode: 'ญ33201',
    credits: '1.0 หน่วยกิต',
    totalPeriods: '40 คาบ',
    classroom: 'ห้อง ม.3/2',
    hasGradingButton: true,
  },
  {
    periodNumber: 4,
    timeRange: '14:00 - 15:30',
    iconType: 'torii',
    iconBgColor: 'bg-[#3B82F6]',
    subjectTitle: 'ภาษาญี่ปุ่น ม.3/1',
    courseCode: 'ญ21202',
    credits: '0.5 หน่วยกิต',
    totalPeriods: '20 คาบ',
    classroom: 'ห้อง ม.3/1',
    hasGradingButton: true,
  },
  {
    periodNumber: 5,
    timeRange: '15:30 - 16:30',
    iconType: 'activity',
    iconBgColor: 'bg-[#10B981]',
    subjectTitle: 'กิจกรรมพัฒนาผู้เรียน ม.3',
    subType: 'กิจกรรมแนะแนว',
    classroom: 'ห้อง ม.3/1',
    hasGradingButton: false,
  },
];

interface TeacherTodayTimetableCardProps {
  onNavigateToFullTimetable?: () => void;
  onCheckAttendance?: (period: TodayPeriodItem) => void;
  onGradeScores?: (period: TodayPeriodItem) => void;
  onViewPeriodDetail?: (period: TodayPeriodItem) => void;
  onDeepNavigate?: (payload: CrossViewNavigationPayload) => void;
  currentUser?: AuthUser | null;
}

export const TeacherTodayTimetableCard: React.FC<TeacherTodayTimetableCardProps> = ({
  onNavigateToFullTimetable,
  onCheckAttendance,
  onGradeScores,
  onViewPeriodDetail,
  onDeepNavigate,
  currentUser,
}) => {
  const [bellConfig, setBellConfig] = useState<SchoolBellScheduleConfig>(() =>
    bellScheduleService.getConfig()
  );

  useEffect(() => {
    const handleBellUpdate = (e: Event) => {
      const custom = e as CustomEvent<SchoolBellScheduleConfig>;
      if (custom.detail) {
        setBellConfig(custom.detail);
      }
    };
    window.addEventListener(BELL_SCHEDULE_UPDATED_EVENT, handleBellUpdate);
    return () => {
      window.removeEventListener(BELL_SCHEDULE_UPDATED_EVENT, handleBellUpdate);
    };
  }, []);

  const periodsList = useMemo(() => {
    return TODAY_PERIODS_MOCK.map((item) => {
      let subjectTitle = item.subjectTitle;
      let courseCode = item.courseCode;

      // If a real teacher is logged in with a defined subject group (e.g. Science, Thai, etc.)
      if (currentUser?.subjectGroup && !currentUser.subjectGroup.includes('ญี่ปุ่น')) {
        if (item.periodNumber === 0) {
          subjectTitle = `เช็คแถวเช้า & โฮมรูม (${currentUser.classroomId || 'ม.3/1'})`;
        } else if (item.periodNumber === 5) {
          subjectTitle = 'กิจกรรมพัฒนาผู้เรียน';
        } else {
          subjectTitle = `${currentUser.subjectGroup} (${currentUser.classroomId || `ม.3/${item.periodNumber}`})`;
          courseCode = currentUser.subjectGroup.slice(0, 6);
        }
      }

      if (item.periodNumber === 0) {
        return {
          ...item,
          subjectTitle,
          courseCode,
          timeRange: `${bellConfig.morningAssemblyStart} - ${bellConfig.morningAssemblyEnd}`,
        };
      }
      return {
        ...item,
        subjectTitle,
        courseCode,
      };
    });
  }, [bellConfig, currentUser]);

  // ติดตามคาบที่ดำเนินการเช็คชื่อเรียบร้อยแล้ว (mock ค่าเริ่มต้น: คาบ 0 เช็คแถวเช้าเสร็จแล้ว)
  const [completedPeriods, setCompletedPeriods] = useState<number[]>([0]);

  // ตั้งค่าเริ่มต้น: ซ่อนคาบที่เสร็จแล้วเป็นค่าเริ่มต้น และบันทึกสถานะลง localStorage
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('kp_hide_completed_periods');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true; // default เป็นซ่อนคาบที่เสร็จแล้วตามคำสั่งผู้ใช้
  });

  const handleToggleHideCompleted = () => {
    setHideCompleted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('kp_hide_completed_periods', String(next));
      }
      return next;
    });
  };

  // ค้นหาคาบถัดไปที่ต้องทำ (คาบแรกที่ยังไม่ได้เช็คชื่อ)
  const nextActionPeriodNumber = periodsList.find(
    (p) => !(p.isCompleted || completedPeriods.includes(p.periodNumber))
  )?.periodNumber ?? null;

  const toggleComplete = (periodNumber: number) => {
    setCompletedPeriods((prev) =>
      prev.includes(periodNumber)
        ? prev.filter((p) => p !== periodNumber)
        : [...prev, periodNumber]
    );
  };

  const handleCheckIn = (period: TodayPeriodItem) => {
    // บันทึกสถานะว่าเช็คชื่อแล้ว
    if (!completedPeriods.includes(period.periodNumber)) {
      setCompletedPeriods((prev) => [...prev, period.periodNumber]);
    }

    if (onCheckAttendance) {
      onCheckAttendance(period);
      return;
    }

    // หากเป็นคาบ 0 (เช็คแถวเช้า) ให้นำทางไปยัง morning-assembly
    if (period.isMorningAssembly || period.periodNumber === 0) {
      onDeepNavigate?.({
        view: 'morning-assembly',
        highlightBanner: 'เช็คแถวเช้า & โฮมรูม (ม.3/1)',
      });
      return;
    }

    // สำหรับคาบวิชาเรียนปกติ (คาบ 1 ขึ้นไป) ให้นำทางไปยัง classroom-attendance
    onDeepNavigate?.({
      view: 'classroom-attendance',
      classSubTab: 'attendance',
      highlightBanner: `เช็คชื่อคาบที่ ${period.periodNumber}: ${period.subjectTitle}`,
    });
  };

  const handleScore = (period: TodayPeriodItem) => {
    if (onGradeScores) {
      onGradeScores(period);
      return;
    }
    onDeepNavigate?.({
      view: 'class-overview',
      classSubTab: 'assignments',
      highlightBanner: `บันทึกคะแนน: ${period.subjectTitle}`,
    });
  };

  const handleDetail = (period: TodayPeriodItem) => {
    if (onViewPeriodDetail) {
      onViewPeriodDetail(period);
      return;
    }
    onDeepNavigate?.({
      view: 'timetable',
      highlightBanner: `ตารางสอน: ${period.subjectTitle}`,
    });
  };

  // กรองคาบเรียนตามปุ่มสลับ ซ่อนคาบที่เสร็จแล้ว
  const displayedPeriods = periodsList.filter((period) => {
    const isCompleted = period.isCompleted || completedPeriods.includes(period.periodNumber);
    if (hideCompleted && isCompleted) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs overflow-hidden select-none">
      {/* Card Header matching Image 1 & Image 2 */}
      <div className="p-4 sm:p-5 pb-3 sm:pb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight hidden sm:block">
                ตารางสอนวันนี้
              </h2>
              <h2 className="font-extrabold text-slate-800 text-sm leading-tight sm:hidden">
                วันนี้ - 2 ตุลาคม 2569
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              พฤหัสบดีที่ 2 ตุลาคม 2569
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toggle Button: ซ่อนคาบที่เสร็จแล้ว / แสดงทุกคาบ (Persisted in LocalStorage) */}
          <button
            type="button"
            onClick={handleToggleHideCompleted}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hideCompleted
                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/70'
            }`}
            title={hideCompleted ? 'แสดงทุกคาบ' : 'ซ่อนคาบที่เสร็จแล้ว'}
          >
            {hideCompleted ? (
              <>
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>👁️ แสดงทุกคาบ</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>✓ ซ่อนคาบที่เสร็จแล้ว</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onNavigateToFullTimetable}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span>ดูตารางสอนทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Period Rows matching Image 1 & Design Specs */}
      <div className="divide-y divide-slate-50 p-2 sm:p-4 space-y-2.5 sm:space-y-3">
        {displayedPeriods.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
              เช็คชื่อครบทุกคาบแล้ววันนี้
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              ซ่อนคาบที่เสร็จสิ้นแล้วทั้งหมดตามการตั้งค่าของคุณครู
            </p>
            <button
              type="button"
              onClick={() => setHideCompleted(false)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>👁️ แสดงทุกคาบ ({TODAY_PERIODS_MOCK.length} คาบ)</span>
            </button>
          </div>
        ) : (
          displayedPeriods.map((period) => {
            const isCompleted = period.isCompleted || completedPeriods.includes(period.periodNumber);
            const isNextAction = period.periodNumber === nextActionPeriodNumber;

            let rowStyle = 'border border-slate-100 bg-white hover:bg-slate-50/80 shadow-2xs';
            if (isNextAction) {
              rowStyle = 'border-2 border-blue-500 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white shadow-md shadow-blue-500/10 ring-2 ring-blue-400/20';
            } else if (isCompleted) {
              rowStyle = 'border border-slate-100 bg-slate-50/50 opacity-80 hover:opacity-100 transition-opacity';
            }

            return (
              <div
                key={period.periodNumber}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-2xl transition-all gap-3 ${rowStyle}`}
              >
                {/* Left: Circle checkmark in front + Time Badge + Icon + Subject Info */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  {/* Status Circle in front of time block matching Image 2 */}
                  <div
                    className="shrink-0 flex items-center justify-center cursor-pointer"
                    onClick={() => toggleComplete(period.periodNumber)}
                    title={isCompleted ? 'เช็คแล้ว (คลิกเพื่อสลับ)' : 'ยังไม่ได้เช็ค (คลิกเพื่อทำเครื่องหมาย)'}
                  >
                    {isCompleted ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-slate-300 bg-white hover:border-blue-400 transition-colors" />
                    )}
                  </div>

                  {/* Time Block matching Image 1 & 2 */}
                  <div
                    className={`w-24 sm:w-28 py-1.5 px-2 rounded-xl text-center shrink-0 flex flex-col justify-center ${
                      isNextAction
                        ? 'bg-blue-100/90 border border-blue-300'
                        : 'bg-slate-50 border border-slate-200/80'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-800 leading-tight">
                      {period.timeRange}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {period.periodNumber === 0 ? 'เข้าแถวเช้า' : `คาบที่ ${period.periodNumber}`}
                    </span>
                  </div>

                  {/* Morning / Japanese / Activity Circular Icon */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${period.iconBgColor} text-white flex items-center justify-center shrink-0 shadow-2xs font-extrabold select-none`}
                  >
                    {period.iconType === 'morning' && (
                      <Sun className="w-5 h-5 text-amber-100 fill-amber-100" />
                    )}
                    {period.iconType === 'hiragana' && (
                      <span className="text-base sm:text-lg leading-none font-bold">あ</span>
                    )}
                    {period.iconType === 'nihon' && (
                      <span className="text-xs leading-none font-black tracking-tighter">日本</span>
                    )}
                    {period.iconType === 'torii' && (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M2 5h20v2H2V5zm2 3h16v1.5H4V8zm2 2.5h2v9.5H6v-9.5zm10 0h2v9.5h-2v-9.5z" />
                      </svg>
                    )}
                    {period.iconType === 'activity' && <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </div>

                  {/* Subject Title & Details */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug truncate">
                        {period.subjectTitle}
                      </h3>
                      {isNextAction && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shrink-0 shadow-2xs animate-pulse">
                          📌 กำลังเรียน / คาบถัดไป
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5 font-medium">
                      {period.courseCode && (
                        <span>รหัสวิชา {period.courseCode}</span>
                      )}
                      {period.credits && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{period.credits}</span>
                        </>
                      )}
                      {period.totalPeriods && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{period.totalPeriods}</span>
                        </>
                      )}
                      {period.subType && <span>{period.subType}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{period.classroom}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons ([เช็คชื่อ] ตามภาพที่ 1 - สีเขียวเด่น 10% Pop, [ให้คะแนน], [รายละเอียด >]) */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-1 sm:pt-0 flex-wrap pl-[100px] sm:pl-0">
                  {/* ปุ่มเช็คชื่อเข้มขึ้นดังภาพที่ 1 ให้ชัดเจนว่าเป็น 10% Accent Pop */}
                  <button
                    type="button"
                    onClick={() => handleCheckIn(period)}
                    className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-md ${
                      isNextAction
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/30 scale-102'
                        : isCompleted
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                    title={period.isMorningAssembly || period.periodNumber === 0 ? 'เช็คแถวเช้า & โฮมรูม' : 'เช็คชื่อเข้าเรียน'}
                  >
                    <UserCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>{period.isMorningAssembly || period.periodNumber === 0 ? 'เช็คแถว' : 'เช็คชื่อ'}</span>
                  </button>

                  {/* Grade button if applicable */}
                  {period.hasGradingButton && (
                    <button
                      type="button"
                      onClick={() => handleScore(period)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      title="บันทึกคะแนน"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>ให้คะแนน</span>
                    </button>
                  )}

                  {/* Details link */}
                  <button
                    type="button"
                    onClick={() => handleDetail(period)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 transition-colors cursor-pointer flex items-center gap-0.5"
                  >
                    <span>รายละเอียด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
