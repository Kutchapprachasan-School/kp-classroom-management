import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  School,
  FileEdit,
  X,
  Check,
  Upload,
  RefreshCw,
  Link2,
  MapPin,
  Building2,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';
import {
  getSchoolSettings,
  saveSchoolSettings,
  saveSchoolSettingsAsync,
  DEFAULT_KUTCHAP_LOGO_SVG,
} from '../../config/schoolRoles';
import { compressSchoolLogoImage } from '../../utils/imageCompressor';

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
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('บันทึกข้อมูลโรงเรียนสำเร็จแล้ว');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editFormData, setEditFormData] = useState({
    nameTh: schoolSettings.nameTh || 'โรงเรียนคำยางพิทยา',
    shortName: schoolSettings.shortName || schoolSettings.shortCode || 'คำยางพิทยา',
    districtProvince: schoolSettings.districtProvince || 'ต.ผาสุก อ.วังสามหมอ จ.อุดรธานี',
    affiliation: schoolSettings.affiliation || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต 1',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleSave = async () => {
    const updated = {
      ...schoolSettings,
      nameTh: editFormData.nameTh,
      shortName: editFormData.shortName,
      shortCode: editFormData.shortName,
      districtProvince: editFormData.districtProvince,
      affiliation: editFormData.affiliation,
    };
    saveSchoolSettings(updated);
    await saveSchoolSettingsAsync(updated);
    setSchoolSettings(getSchoolSettings());
    setIsEditModalOpen(false);
    showToast('✓ บันทึกข้อมูลโรงเรียนสำเร็จแล้ว');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('⏳ กำลังประมวลผลและบันทึกตราสัญลักษณ์...');
      let finalDataUrl = '';
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
      if (isSvg) {
        finalDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ SVG ได้'));
          reader.readAsDataURL(file);
        });
      } else {
        const compressed = await compressSchoolLogoImage(file);
        finalDataUrl = compressed.dataUrl;
      }

      if (finalDataUrl) {
        const updated = { ...schoolSettings, logoUrl: finalDataUrl };
        saveSchoolSettings(updated);
        await saveSchoolSettingsAsync({ logoUrl: finalDataUrl });
        setSchoolSettings(getSchoolSettings());
        showToast('✓ บันทึกตราโรงเรียนสำเร็จแล้ว');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      showToast('❌ ไม่สามารถอัปโหลดตราโรงเรียนได้');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleResetLogo = async () => {
    const updated = { ...schoolSettings, logoUrl: DEFAULT_KUTCHAP_LOGO_SVG };
    saveSchoolSettings(updated);
    await saveSchoolSettingsAsync({ logoUrl: DEFAULT_KUTCHAP_LOGO_SVG });
    setSchoolSettings(getSchoolSettings());
    showToast('🔄 คืนค่าตราโรงเรียนมาตรฐานเรียบร้อย');
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-28 font-sans select-none text-slate-800">
      {/* 1. TOP NAVIGATION BACK LINK (ตรงตามรูป Mockup ด้านขวา: <- กลับไปหน้ารวมการตั้งค่า) */}
      <button
        type="button"
        onClick={() => {
          if (onBack) onBack();
          else onNavigate('settings');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer py-1 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>กลับไปหน้ารวมการตั้งค่า</span>
      </button>

      {/* 2. SECTION HEADER & SUPABASE BADGE */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 p-2.5 shadow-2xs">
          <School className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-[#163A66] tracking-tight">
              ข้อมูลโรงเรียนและอัตลักษณ์
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
              <Link2 className="w-3 h-3" />
              <span>Supabase Linked</span>
            </span>
          </div>
          <p className="text-xs text-[#6B7C93] font-medium mt-1 leading-snug">
            จัดการข้อมูลโรงเรียน ตราสัญลักษณ์ และข้อมูลพื้นฐานทางการศึกษา
          </p>
        </div>
      </div>

      {/* 3. CARD 1: ตราสัญลักษณ์โรงเรียน (ตรงตามรูป Mockup) */}
      <div className="space-y-2 pt-1">
        <h2 className="text-base font-black text-[#163A66]">
          ตราสัญลักษณ์โรงเรียน
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <div className="border border-blue-100 bg-blue-50/20 rounded-2xl p-3.5 flex items-center gap-3.5">
            {/* Preview Box */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white border border-slate-200/80 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src={schoolSettings.logoUrl || DEFAULT_KUTCHAP_LOGO_SVG}
                alt="ตัวอย่างตราโรงเรียน"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_KUTCHAP_LOGO_SVG;
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  ตัวอย่างตราโรงเรียน
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-tight whitespace-pre-line mt-1">
                  ไฟล์ที่แนะนำ: PNG (พื้นหลังโปร่งใส){'\n'}
                  ขนาดไม่เกิน 2 MB
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>อัปโหลดตราโรงเรียน</span>
              </button>

              <button
                type="button"
                onClick={handleResetLogo}
                className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-blue-50/50 active:scale-98 text-blue-700 border border-blue-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>คืนค่าตราโรงเรียนมาตรฐาน</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium pl-1">
            รองรับไฟล์: PNG, JPG, JPEG, WebP
          </p>
        </div>
      </div>

      {/* 4. CARD 2: ข้อมูลโรงเรียน (ตรงตามรูป Mockup) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#163A66]">
            ข้อมูลโรงเรียน
          </h2>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>แก้ไขข้อมูลโรงเรียน</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-2">
          {/* Row 1: ชื่อโรงเรียน */}
          <div
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/40 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <School className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-slate-400 font-medium block">
                ชื่อโรงเรียน
              </span>
              <span className="text-sm font-bold text-slate-800 truncate block">
                {schoolSettings.nameTh || 'โรงเรียนคำยางพิทยา'}
              </span>
            </div>
          </div>

          {/* Row 2: ชื่อย่อโรงเรียน */}
          <div
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/40 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-black text-sm">
              Abc
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-slate-400 font-medium block">
                ชื่อย่อโรงเรียน
              </span>
              <span className="text-sm font-bold text-slate-800 truncate block">
                {schoolSettings.shortName || schoolSettings.shortCode || 'คำยางพิทยา'}
              </span>
            </div>
          </div>

          {/* Row 3: อำเภอ / จังหวัด */}
          <div
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/40 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-slate-400 font-medium block">
                อำเภอ / จังหวัด
              </span>
              <span className="text-sm font-bold text-slate-800 truncate block">
                {schoolSettings.districtProvince || 'ต.ผาสุก อ.วังสามหมอ จ.อุดรธานี'}
              </span>
            </div>
          </div>

          {/* Row 4: สังกัดสำนักงานเขตพื้นที่การศึกษา */}
          <div
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/40 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-slate-400 font-medium block">
                สังกัดสำนักงานเขตพื้นที่การศึกษา
              </span>
              <span className="text-sm font-bold text-slate-800 truncate block">
                {schoolSettings.affiliation || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต 1'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SUCCESS TOAST */}
      {showSavedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
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
                  ชื่อย่อโรงเรียน
                </label>
                <input
                  type="text"
                  value={editFormData.shortName}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, shortName: e.target.value }))
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  สังกัดสำนักงานเขตพื้นที่การศึกษา
                </label>
                <input
                  type="text"
                  value={editFormData.affiliation}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      affiliation: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-blue-500"
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
