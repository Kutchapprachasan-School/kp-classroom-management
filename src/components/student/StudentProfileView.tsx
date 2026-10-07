// src/components/student/StudentProfileView.tsx
// หน้าข้อมูลส่วนตัวของนักเรียน เชื่อมโยงข้อมูลผู้ใช้จริงจากระบบ

import React from 'react';
import { User } from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import type { SchoolSettingsConfig } from '../../config/schoolSettings';
import { getSchoolSettings } from '../../config/schoolSettings';
import { classroomsListData } from '../../data/mockData';
import { cleanSlateService } from '../../services/cleanSlateService';

interface StudentProfileViewProps {
  onBack: () => void;
  currentUser?: AuthUser | null;
  schoolSettings?: SchoolSettingsConfig;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  onBack,
  currentUser,
  schoolSettings,
}) => {
  const settings = schoolSettings || getSchoolSettings();
  const studentName = currentUser?.name || 'นักเรียน';
  const studentCode = currentUser?.studentCode || 'STD-001';
  const classroomId = currentUser?.classroomId || 'ม.3/1';

  // Find classroom details and advisor
  const matchedRoom = classroomsListData.find(
    (c) => c.id === classroomId || c.roomNumber === classroomId || c.name.includes(classroomId)
  );
  const roomName = matchedRoom ? `ชั้น${matchedRoom.roomNumber}` : `ชั้น ${classroomId}`;
  const adviserName = matchedRoom?.adviser || 'ครูที่ปรึกษาประจำชั้น';

  const isClean = cleanSlateService.isCleanSlateActive();

  return (
    <div className="font-['Prompt',sans-serif] space-y-5 animate-fade-in select-none">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold mb-1 flex items-center gap-1 cursor-pointer"
        >
          ← กลับหน้าหลัก
        </button>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>ข้อมูลส่วนตัวนักเรียน</span>
        </h2>
        <p className="text-xs text-slate-500">
          ข้อมูลทะเบียนประวัติและผลการเรียนสะสม
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 text-center">
          <div className="w-24 h-24 mx-auto rounded-full border-4 border-sky-100 overflow-hidden shadow-sm bg-sky-50 flex items-center justify-center">
            <img
              src={currentUser?.avatarUrl || "/images/banners/student-avatar.png"}
              alt={studentName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(studentName)
                );
              }}
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{studentName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">รหัสนักเรียน: {studentCode}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {roomName}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1.5 text-left">
            <div><strong>โรงเรียน:</strong> {settings.nameTh}</div>
            <div><strong>แผนการเรียน:</strong> แผนการเรียนทั่วไปตามหลักสูตรสถานศึกษา</div>
            <div><strong>ครูที่ปรึกษา:</strong> {adviserName}</div>
          </div>
        </div>

        {/* Stats & Academics */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              สรุปข้อมูลการศึกษาและคะแนนสะสม
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-[11px] text-slate-500">เกรดเฉลี่ยสะสม (GPAX)</span>
                <div className="text-lg font-bold text-blue-700 mt-0.5">
                  {isClean ? '-' : '3.82'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isClean ? 'รอประมวลผลสิ้นภาคเรียน' : 'ภาคเรียนล่าสุด'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] text-slate-500">คะแนนความประพฤติ</span>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">100 / 100</div>
                <div className="text-[10px] text-emerald-600 font-medium">ระดับดีเยี่ยม</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-[11px] text-slate-500">แต้มการเรียนรู้ (XP)</span>
                <div className="text-lg font-bold text-amber-700 mt-0.5">
                  {isClean ? '0 XP' : '670 XP'}
                </div>
                <div className="text-[10px] text-amber-600 font-medium">
                  {isClean ? 'เริ่มต้นสะสมแต้ม' : 'ระดับผู้เริ่มต้น'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              คู่หูบัดดี้ประจำตัว (Companion)
            </h4>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0">
                <img
                  src="/images/buddies/buddy-l1.png"
                  alt="โมจิ"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">โมจิ</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                    STARTER
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  คู่หูพร้อมร่วมเดินทางและให้กำลังใจในการเรียนรู้ทุกๆ วัน ✨
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
