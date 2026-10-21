import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Send,
  FileText,
  BookOpen,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';
import { getLocalClassrooms } from '../../services/classroomService';
import {
  sgsRosterAndSubmissionService,
  type FourScorePart,
} from '../../services/sgsRosterAndSubmissionService';
import {
  getDynamicTeachingSubjects,
  type TeachingSubjectInfo,
} from '../../services/teacherCourseAssignmentService';
import { getBangkokTodayString } from '../../utils/timetableDateUtils';

interface TeacherMobileCreateAssignmentScreenProps {
  onBack?: () => void;
  onNavigate: (view: TeacherViewKey) => void;
}

export const TeacherMobileCreateAssignmentScreen: React.FC<
  TeacherMobileCreateAssignmentScreenProps
> = ({ onBack, onNavigate }) => {
  const subjects = useMemo<TeachingSubjectInfo[]>(() => {
    return getDynamicTeachingSubjects();
  }, []);

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    subjects[0]?.code || ''
  );

  useEffect(() => {
    if (!selectedSubjectCode && subjects.length > 0) {
      setSelectedSubjectCode(subjects[0].code);
    }
  }, [subjects, selectedSubjectCode]);

  const currentSubject = useMemo(() => {
    return (
      subjects.find((s) => s.code === selectedSubjectCode) || subjects[0] || null
    );
  }, [subjects, selectedSubjectCode]);

  const availableClassrooms = useMemo(() => {
    try {
      if (currentSubject?.classrooms && currentSubject.classrooms.length > 0) {
        return currentSubject.classrooms;
      }
      const list = getLocalClassrooms();
      return list.map((c) => c.name || c.roomNumber).filter(Boolean);
    } catch {
      return [];
    }
  }, [currentSubject]);

  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');

  useEffect(() => {
    setSelectedRoom('ALL');
  }, [selectedSubjectCode]);

  const [scorePart, setScorePart] = useState<FourScorePart>('PRE_MIDTERM');
  const [assignmentType, setAssignmentType] = useState<'WORKSHEET' | 'HOMEWORK' | 'QUIZ'>('WORKSHEET');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState('10');
  const [dueDate, setDueDate] = useState(() => getBangkokTodayString());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partToUnitMap: Record<FourScorePart, 'U1' | 'U2' | 'U3' | 'MIDTERM' | 'FINAL'> = {
    PRE_MIDTERM: 'U1',
    MIDTERM: 'MIDTERM',
    POST_MIDTERM: 'U2',
    FINAL: 'FINAL',
  };

  const handleAssign = async () => {
    if (!title.trim()) {
      alert('กรุณาระบุหัวข้องาน');
      return;
    }
    if (!currentSubject) {
      alert('กรุณาเลือกรายวิชาที่สอน');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetRooms =
        selectedRoom === 'ALL'
          ? availableClassrooms.length > 0
            ? availableClassrooms
            : ['ALL']
          : [selectedRoom];

      const typePrefix =
        assignmentType === 'QUIZ'
          ? 'แบบทดสอบ'
          : assignmentType === 'HOMEWORK'
          ? 'การบ้าน'
          : 'ใบงาน';

      const finalTitle = title.trim().startsWith(typePrefix)
        ? title.trim()
        : `${typePrefix}: ${title.trim()}`;

      sgsRosterAndSubmissionService.addTermAssignment({
        title: finalTitle,
        description: description.trim() || undefined,
        unitKey: partToUnitMap[scorePart],
        scorePart: scorePart,
        maxScore: Math.max(1, Number(maxScore) || 10),
        dueDate: dueDate || getBangkokTodayString(),
        courseCode: currentSubject.code || currentSubject.courseCode,
        courseName: currentSubject.name || currentSubject.courseName,
        targetClassrooms: targetRooms,
      });

      setToastMsg(`✓ มอบหมายงาน "${finalTitle}" เรียบร้อยแล้ว!`);
      setTimeout(() => {
        onNavigate('grading-queue');
      }, 1000);
    } catch (err) {
      console.error('Failed to create assignment:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกงาน กรุณาลองใหม่อีกครั้ง');
      setIsSubmitting(false);
    }
  };

  if (subjects.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 pb-28 font-sans select-none text-slate-800 p-4">
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
              else onNavigate('home');
            }}
            className="p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-black text-slate-900">
            มอบหมายงานใหม่
          </h1>
        </div>

        <div className="bg-white rounded-3xl p-6 text-center border border-slate-200/80 shadow-2xs space-y-3 mt-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">ยังไม่มีรายวิชาที่สอนในระบบ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            ไม่พบรายวิชาที่ได้รับมอบหมายในหลักสูตร กรุณาเพิ่มรายวิชาในเมนูจัดการหลักสูตรก่อนสั่งงาน
          </p>
          <button
            type="button"
            onClick={() => onNavigate('courses')}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            ไปหน้าจัดการหลักสูตร / รายวิชา
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-28 font-sans select-none text-slate-800">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('home');
          }}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="ย้อนกลับ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900">
            มอบหมายงานใหม่
          </h1>
          <p className="text-[11px] text-slate-500">
            บันทึกลงระบบ ปพ.5 และห้องเรียนแบบ Real-time
          </p>
        </div>
      </div>

      {/* 2. Form Container */}
      <div className="space-y-3.5 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
        {/* Field 1: รายวิชา */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 mb-1 block">
            รายวิชา <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} {sub.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Field 2: สัดส่วนคะแนน (ปพ.5) */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 mb-1 block">
            ช่วงคะแนน ปพ.5 <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'PRE_MIDTERM' as FourScorePart, label: 'ก่อนกลางภาค' },
              { id: 'MIDTERM' as FourScorePart, label: 'กลางภาค' },
              { id: 'POST_MIDTERM' as FourScorePart, label: 'หลังกลางภาค' },
              { id: 'FINAL' as FourScorePart, label: 'ปลายภาค' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setScorePart(p.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                  scorePart === p.id
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-extrabold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Field 3: ประเภทงาน */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
            ประเภทงาน
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAssignmentType('WORKSHEET')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                assignmentType === 'WORKSHEET'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ใบงาน</span>
            </button>

            <button
              type="button"
              onClick={() => setAssignmentType('HOMEWORK')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                assignmentType === 'HOMEWORK'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>การบ้าน</span>
            </button>

            <button
              type="button"
              onClick={() => setAssignmentType('QUIZ')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                assignmentType === 'QUIZ'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>แบบทดสอบ</span>
            </button>
          </div>
        </div>

        {/* Field 4: หัวข้องาน */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 mb-1 block">
            หัวข้อชิ้นงาน <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ใบงานที่ 1: การแนะนำตัวและการสนทนา"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all mb-2"
          />
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="คำอธิบายรายละเอียดงานเพิ่มเติม (ไม่บังคับ)..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Field 5: คะแนนเต็ม & กำหนดส่ง */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1 block">
              คะแนนเต็ม
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1 block">
              กำหนดส่ง
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Field 6: ห้องเรียนเป้าหมาย */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 mb-1 block">
            ห้องเรียนเป้าหมาย
          </label>
          <div className="relative">
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">
                {availableClassrooms.length > 0
                  ? `ทุกห้องที่สอน (${availableClassrooms.join(', ')})`
                  : 'ทุกห้องเรียน'}
              </option>
              {availableClassrooms.map((room) => (
                <option key={room} value={room}>
                  ห้อง {room}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Action Button */}
      <div className="fixed bottom-14 left-0 right-0 p-3 bg-gradient-to-t from-white via-white/95 to-transparent z-30">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleAssign}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 text-white" />
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'มอบหมายงาน'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
