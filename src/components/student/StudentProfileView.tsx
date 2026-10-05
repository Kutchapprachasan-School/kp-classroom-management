// src/components/student/StudentProfileView.tsx
// หน้าข้อมูลส่วนตัวของนักเรียน (ด.ช. ทัศธน คำปั้น)

import React from 'react';
import { User } from 'lucide-react';
import { KUTCHAP_SCHOOL_INFO } from '../../config/schoolRoles';

interface StudentProfileViewProps {
  onBack: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ onBack }) => {
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
              src="/images/banners/student-avatar.png"
              alt="ด.ช. ทัศธน คำปั้น"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">ด.ช. ทัศธน คำปั้น</h3>
            <p className="text-xs text-slate-400 mt-0.5">รหัสนักเรียน: 54321 · เลขที่ 12</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              ชั้นมัธยมศึกษาปีที่ 4/1
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1.5 text-left">
            <div><strong>โรงเรียน:</strong> {KUTCHAP_SCHOOL_INFO.nameTh}</div>
            <div><strong>แผนการเรียน:</strong> ภาษาญี่ปุ่น - เทคโนโลยี AI</div>
            <div><strong>ครูที่ปรึกษา:</strong> ครูพัสกร ปัญญา</div>
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
                <div className="text-lg font-bold text-blue-700 mt-0.5">3.82</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] text-slate-500">คะแนนความประพฤติ</span>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">100 / 100</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-[11px] text-slate-500">แต้มการเรียนรู้ (XP)</span>
                <div className="text-lg font-bold text-amber-700 mt-0.5">670 XP</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              คู่หูบัดดี้ประจำตัว
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
                    LEGENDARY
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  สกิล: เพลิงมุ่งมั่นดวงดาว · เลเวล 2 (650/1000 XP)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
