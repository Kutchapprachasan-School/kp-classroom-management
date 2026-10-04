import React from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Clock,
  Briefcase,
  Users,
  FileText,
  ChevronRight,
  Play,
  Check,
  Download,
} from 'lucide-react';
import type { DailyTodoItem } from '../../services/teacherCalendarTodoService';
import type { CrossViewNavigationPayload } from '../../services/teacherCopilotService';

interface TeacherTaskDetailModalProps {
  task: DailyTodoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onActionClick: (payload: CrossViewNavigationPayload) => void;
}

export const TeacherTaskDetailModal: React.FC<TeacherTaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onActionClick,
}) => {
  if (!isOpen || !task) return null;

  const isGrading = task.periodLabel === 'ตรวจงาน';
  const isAssembly = task.periodLabel === 'แถวเช้า';
  const isDone = task.status === 'COMPLETED';

  const startTime = task.time.split('-')[0]?.trim() || '';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md md:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top App Bar matching Screen 2 in Mockup */}
        <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="text-sm font-bold text-slate-800">รายละเอียดงาน</span>

          <button
            type="button"
            className="p-2 -mr-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="เมนูเพิ่มเติม"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Cover Illustration Banner matching Mockup */}
          <div className="relative h-36 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-tr from-teal-800 via-teal-600 to-emerald-400 p-4 flex flex-col justify-between text-white shadow-inner">
            {/* Background SVG Motif */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                <path d="M0 120 Q100 80 200 110 T400 90 L400 160 L0 160 Z" fill="#ffffff" />
                <circle cx="320" cy="50" r="30" fill="#ffffff" />
              </svg>
            </div>

            {/* Room Tag Top Left */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white/90 text-[#0C6D5B] text-xs font-black shadow-xs">
                ห้อง {task.classroom}
              </span>
              {isDone && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>บันทึกแล้ว</span>
                </span>
              )}
            </div>

            {/* Bottom Tag inside Cover */}
            <div className="relative z-10">
              <div className="text-[11px] font-medium text-teal-100">
                กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ / ศิลปะ
              </div>
              <div className="text-base font-extrabold text-white truncate">
                {task.subjectName || task.title}
              </div>
            </div>
          </div>

          {/* Time & Title Section */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-[#0C6D5B]" />
              <span>{task.time}</span>
              <span className="text-slate-300">•</span>
              <span>{task.periodLabel}</span>
            </div>

            <h2 className="text-lg font-black text-slate-900 leading-snug">
              {task.title}
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              {task.summaryText || (isGrading
                ? 'ตรวจชิ้นงานที่ 2 ออกแบบโปสเตอร์ดิจิทัลผ่าน Canva พร้อมประเมินตามเกณฑ์ Rubric'
                : isAssembly
                ? 'เช็คชื่อแถวหน้าเสาธง ตรวจเครื่องแต่งกาย บันทึกข้อมูลใบลาป่วย/ลากิจ'
                : 'จัดกิจกรรมการแลกเปลี่ยนเรียนรู้ ด้วยสื่อการสอนโดยใช้ปัญหาเป็นฐาน (PBL)')}
            </p>
          </div>

          {/* Key Info Metadata Rows */}
          <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2.5 border border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-teal-100/60 text-[#0C6D5B] flex items-center justify-center shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">ห้องเรียน: </span>
                <span className="font-bold text-slate-800">ห้อง {task.classroom}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-teal-100/60 text-[#0C6D5B] flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">เวลาดำเนินงาน: </span>
                <span className="font-bold text-slate-800">
                  {isDone ? 'ดำเนินการเรียบร้อยแล้ว' : isAssembly ? 'เช็คชื่อภายใน 08:20' : `เริ่มสอน ${startTime}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-teal-100/60 text-[#0C6D5B] flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">ผู้เรียน: </span>
                <span className="font-bold text-slate-800">ผู้เรียน 38 คน</span>
              </div>
            </div>
          </div>

          {/* Attachment Card matching Mockup */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-700">ไฟล์ / สื่อการสอน</span>

            <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate group-hover:text-[#0C6D5B]">
                    {isGrading
                      ? 'Rubric_เกณฑ์การให้คะแนน_โปสเตอร์.pdf'
                      : isAssembly
                      ? 'สรุปรายชื่อนักเรียน_ม3-1_แถวเช้า.pdf'
                      : 'PBL_แผนการสอน_ม3-1.pdf'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">2.4 MB</div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-700">
                <Download className="w-4 h-4" />
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Action Button */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              onActionClick(task.targetPayload);
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#0C6D5B] hover:bg-[#095748] active:bg-[#074237] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all duration-150"
          >
            {isDone ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>เปิดดูรายละเอียดที่บันทึกไว้</span>
              </>
            ) : isGrading ? (
              <>
                <FileText className="w-4 h-4" />
                <span>เริ่มตรวจงาน</span>
              </>
            ) : isAssembly ? (
              <>
                <Users className="w-4 h-4" />
                <span>เช็คแถวเช้าทันที</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>เริ่มสอน</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
