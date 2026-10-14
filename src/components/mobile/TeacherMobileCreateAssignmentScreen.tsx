import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Send,
  Calendar,
  FileText,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

interface TeacherMobileCreateAssignmentScreenProps {
  onBack?: () => void;
  onNavigate: (view: TeacherViewKey) => void;
}

export const TeacherMobileCreateAssignmentScreen: React.FC<
  TeacherMobileCreateAssignmentScreenProps
> = ({ onBack, onNavigate }) => {
  const [selectedSubject, setSelectedSubject] = useState('ญ31201 ภาษาญี่ปุ่น');
  const [selectedUnit, setSelectedUnit] = useState('หน่วยที่ 5: ศิลปะร่วมสมัยไทย');
  const [assignmentType, setAssignmentType] = useState<'WORKSHEET' | 'HOMEWORK' | 'QUIZ'>('WORKSHEET');
  const [title, setTitle] = useState('ใบงานที่ 5: ศิลปะร่วมสมัยไทย (กิจกรรมสีฟ้า)');
  const [description, setDescription] = useState(
    'ให้นักเรียนค้นหาข้อมูลและจัดทำสรุปเป็นผลงานไฟล์ PDF หรือรูปภาพ'
  );
  const [dueDate, setDueDate] = useState('24 ก.ย. 2569 15:30');
  const [selectedRoom, setSelectedRoom] = useState('ม.3/1');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleAssign = () => {
    if (!title.trim()) {
      alert('กรุณาระบุหัวข้องาน');
      return;
    }
    setToastMsg('✓ มอบหมายงานใหม่เรียบร้อยแล้ว!');
    setTimeout(() => {
      onNavigate('mobile-grading-list');
    }, 1200);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-28 font-sans select-none text-slate-800">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xl border border-slate-700 animate-slide-down">
          {toastMsg}
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
        <h1 className="text-base sm:text-lg font-black text-slate-900">
          มอบหมายงานใหม่
        </h1>
      </div>

      {/* 2. Form Container matching Screen 5 */}
      <div className="space-y-3.5">
        {/* Field 1: รายวิชา */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 mb-1 block">
            รายวิชา
          </label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ญ31201 ภาษาญี่ปุ่น">ญ31201 ภาษาญี่ปุ่น</option>
              <option value="ญ33201 ภาษาญี่ปุ่น">ญ33201 ภาษาญี่ปุ่น</option>
              <option value="ญ21202 ภาษาญี่ปุ่นพื้นฐาน">ญ21202 ภาษาญี่ปุ่นพื้นฐาน</option>
              <option value="ญ22201 ภาษาญี่ปุ่นพื้นฐาน">ญ22201 ภาษาญี่ปุ่นพื้นฐาน</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Field 2: หน่วยการเรียนรู้ */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 mb-1 block">
            หน่วยการเรียนรู้
          </label>
          <div className="relative">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="หน่วยที่ 5: ศิลปะร่วมสมัยไทย">หน่วยที่ 5: ศิลปะร่วมสมัยไทย</option>
              <option value="หน่วยที่ 1: การทักทายประจำวัน">หน่วยที่ 1: การทักทายประจำวัน</option>
              <option value="หน่วยที่ 2: ครอบครัวและเพื่อน">หน่วยที่ 2: ครอบครัวและเพื่อน</option>
              <option value="หน่วยที่ 3: ชีวิตในโรงเรียน">หน่วยที่ 3: ชีวิตในโรงเรียน</option>
              <option value="หน่วยที่ 4: อาหารและเครื่องดื่ม">หน่วยที่ 4: อาหารและเครื่องดื่ม</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Field 3: ประเภทงาน (3 Buttons) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">
            ประเภทงาน
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAssignmentType('WORKSHEET')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                assignmentType === 'WORKSHEET'
                  ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ใบงาน</span>
            </button>

            <button
              type="button"
              onClick={() => setAssignmentType('HOMEWORK')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                assignmentType === 'HOMEWORK'
                  ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>การบ้าน</span>
            </button>

            <button
              type="button"
              onClick={() => setAssignmentType('QUIZ')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                assignmentType === 'QUIZ'
                  ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>แบบทดสอบ</span>
            </button>
          </div>
        </div>

        {/* Field 4: หัวข้อ/รายละเอียดงาน */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 mb-1 block">
            หัวข้อ/รายละเอียดงาน
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ระบุหัวข้องาน..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all mb-2"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="คำอธิบายรายละเอียดงานเพิ่มเติม..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Field 5: กำหนดส่ง */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 mb-1 block">
            กำหนดส่ง
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="เช่น 24 ก.ย. 2569 15:30"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Field 6: ห้องเรียน */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 mb-1 block">
            ห้องเรียน
          </label>
          <div className="relative">
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ม.3/1">ม.3/1</option>
              <option value="ม.3/2">ม.3/2</option>
              <option value="ม.6/1">ม.6/1</option>
              <option value="ม.1/1">ม.1/1</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Action Button matching Screen 5 */}
      <div className="fixed bottom-14 left-0 right-0 p-3 bg-gradient-to-t from-white via-white/95 to-transparent z-30">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleAssign}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 text-white" />
            <span>มอบหมายงาน</span>
          </button>
        </div>
      </div>
    </div>
  );
};
