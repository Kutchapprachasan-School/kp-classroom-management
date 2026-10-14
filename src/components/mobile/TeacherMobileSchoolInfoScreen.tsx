import React, { useState } from 'react';
import {
  ArrowLeft,
  School,
  FileEdit,
  X,
  Check,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';
import { getSchoolSettings, saveSchoolSettings } from '../../config/schoolRoles';

interface TeacherMobileSchoolInfoScreenProps {
  onNavigate: (view: TeacherViewKey) => void;
  onBack?: () => void;
}

export const TeacherMobileSchoolInfoScreen: React.FC<TeacherMobileSchoolInfoScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const [schoolSettings, setSchoolSettings] = useState(() => getSchoolSettings());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nameTh: schoolSettings.nameTh || 'โรงเรียนคำยางพิทยา',
    districtProvince: schoolSettings.districtProvince || 'ต.ผาสุก อ.วังสามหมอ จ.อุดรธานี',
    size: 'ขนาดกลาง',
    studentCount: '190',
    staffCount: '17',
    locationDetail: 'ใกล้จุดชายแดน จ.กาฬสินธุ์ และ จ.สกลนคร',
    communityContext: 'ปัญหายาเสพติดในชุมชน (อดีตและปัจจุบัน)',
  });
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = () => {
    saveSchoolSettings({
      ...schoolSettings,
      nameTh: editFormData.nameTh,
      districtProvince: editFormData.districtProvince,
    });
    setSchoolSettings(getSchoolSettings());
    setIsEditModalOpen(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-24 font-sans select-none text-slate-800">
      {/* 1. TOP HEADER */}
      <div className="flex items-center gap-3 pt-1 pb-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('mobile-more');
          }}
          className="w-8 h-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          aria-label="ย้อนกลับ"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          ข้อมูลโรงเรียน
        </h1>
      </div>

      {/* 2. SCHOOL EMBLEM & IDENTITY HERO */}
      <div className="flex flex-col items-center text-center pt-2 pb-1 space-y-2">
        <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200/80 p-2 shadow-sm flex items-center justify-center">
          <img
            src={schoolSettings.logoUrl || '/images/teacher/school_logo.png'}
            alt="ตราสัญลักษณ์โรงเรียน"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/teacher/school_logo.png';
            }}
          />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {editFormData.nameTh}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {editFormData.districtProvince}
          </p>
        </div>
      </div>

      {/* 3. INFO TABLE / METRICS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100 text-xs">
          {/* Row 1: ขนาดโรงเรียน */}
          <div className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors">
            <span className="font-semibold text-slate-500">ขนาดโรงเรียน</span>
            <span className="font-bold text-slate-900">{editFormData.size}</span>
          </div>

          {/* Row 2: จำนวนนักเรียน */}
          <div className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors">
            <span className="font-semibold text-slate-500">จำนวนนักเรียน</span>
            <span className="font-bold text-slate-900">{editFormData.studentCount} คน</span>
          </div>

          {/* Row 3: จำนวนครูและบุคลากร */}
          <div className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors">
            <span className="font-semibold text-slate-500">จำนวนครูและบุคลากร</span>
            <span className="font-bold text-slate-900">{editFormData.staffCount} คน</span>
          </div>

          {/* Row 4: ที่ตั้ง */}
          <div className="flex items-start justify-between p-3.5 gap-4 hover:bg-slate-50/50 transition-colors">
            <span className="font-semibold text-slate-500 shrink-0">ที่ตั้ง</span>
            <span className="font-bold text-slate-900 text-right">
              {editFormData.locationDetail}
            </span>
          </div>

          {/* Row 5: บริบท */}
          <div className="flex items-start justify-between p-3.5 gap-4 hover:bg-slate-50/50 transition-colors">
            <span className="font-semibold text-slate-500 shrink-0">บริบท</span>
            <span className="font-bold text-slate-900 text-right">
              {editFormData.communityContext}
            </span>
          </div>
        </div>
      </div>

      {/* 4. EDIT BUTTON */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <FileEdit className="w-4 h-4" />
          <span>แก้ไขข้อมูลโรงเรียน</span>
        </button>
      </div>

      {/* 5. SUCCESS TOAST */}
      {showSavedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>บันทึกข้อมูลโรงเรียนสำเร็จแล้ว</span>
        </div>
      )}

      {/* 6. EDIT SCHOOL INFO MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  แก้ไขข้อมูลโรงเรียน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อโรงเรียน
                </label>
                <input
                  type="text"
                  value={editFormData.nameTh}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, nameTh: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ตำบล อำเภอ จังหวัด
                </label>
                <input
                  type="text"
                  value={editFormData.districtProvince}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      districtProvince: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    จำนวนนักเรียน
                  </label>
                  <input
                    type="text"
                    value={editFormData.studentCount}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        studentCount: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    จำนวนครูและบุคลากร
                  </label>
                  <input
                    type="text"
                    value={editFormData.staffCount}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        staffCount: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ที่ตั้ง / รายละเอียด
                </label>
                <input
                  type="text"
                  value={editFormData.locationDetail}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      locationDetail: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  บริบทชุมชน
                </label>
                <textarea
                  rows={2}
                  value={editFormData.communityContext}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      communityContext: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
