// src/components/teacher/AdminTeacherBannerModal.tsx
// หน้าต่างปรับแต่งและอัปโหลดแบนเนอร์หน้าครู 3 ส่วน (เฉพาะผู้ดูแลระบบฝ่ายวิชาการ / Admin เท่านั้น)

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  teacherBannerService,
  type TeacherBannerKey,
  type TeacherBannerItem,
} from '../../services/teacherBannerService';
import type { SchoolUserRole } from '../../config/schoolRoles';

interface AdminTeacherBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole?: SchoolUserRole;
  initialBannerKey?: TeacherBannerKey;
}

export const AdminTeacherBannerModal: React.FC<AdminTeacherBannerModalProps> = ({
  isOpen,
  onClose,
  activeRole = 'ACADEMIC_ADMIN',
  initialBannerKey = 'hero',
}) => {
  const [selectedKey, setSelectedKey] = useState<TeacherBannerKey>(initialBannerKey);
  const [banners, setBanners] = useState<Record<TeacherBannerKey, TeacherBannerItem>>(() =>
    teacherBannerService.getBanners()
  );
  const [isUploading, setIsUploading] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState('');
  const [subTextDraft, setSubTextDraft] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = teacherBannerService.canManageBanners(activeRole);

  useEffect(() => {
    if (isOpen) {
      const current = teacherBannerService.getBanners();
      setBanners(current);
      setSelectedKey(initialBannerKey);
      setQuoteDraft(current[initialBannerKey]?.quoteText || '');
      setSubTextDraft(current[initialBannerKey]?.subText || '');
      setStatusMessage(null);
    }
  }, [isOpen, initialBannerKey]);

  useEffect(() => {
    const item = banners[selectedKey];
    if (item) {
      setQuoteDraft(item.quoteText || '');
      setSubTextDraft(item.subText || '');
    }
  }, [selectedKey, banners]);

  if (!isOpen) return null;

  const currentItem = banners[selectedKey];

  const handleSelectTab = (key: TeacherBannerKey) => {
    setSelectedKey(key);
    setStatusMessage(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canManage) {
      setStatusMessage({
        type: 'error',
        text: 'ปฏิเสธการเข้าถึง: เฉพาะแอดมินฝ่ายวิชาการเท่านั้นที่สามารถอัปโหลดได้',
      });
      return;
    }

    // ขนาดไฟล์สูงสุด 6MB ก่อนบีบอัด
    if (file.size > 6 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'ขนาดไฟล์ภาพเกินขีดจำกัด 6MB กรุณาเลือกภาพขนาดเล็กลง',
      });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      let maxWidth = 1200;
      let maxHeight = 400;

      if (selectedKey === 'sidebar') {
        maxWidth = 600;
        maxHeight = 450;
      } else if (selectedKey === 'bottom') {
        maxWidth = 1200;
        maxHeight = 250;
      }

      const compressedBase64 = await teacherBannerService.compressImage(
        file,
        maxWidth,
        maxHeight,
        0.86
      );

      const res = teacherBannerService.updateBanner(
        selectedKey,
        {
          customUrl: compressedBase64,
          quoteText: quoteDraft,
          subText: subTextDraft,
        },
        activeRole,
        'ผู้ดูแลระบบฝ่ายวิชาการ'
      );

      if (res.success) {
        setBanners(teacherBannerService.getBanners());
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err) {
      console.error('Error uploading banner:', err);
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการอ่านและบีบอัดรูปภาพ' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveTextChanges = () => {
    if (!canManage) {
      setStatusMessage({
        type: 'error',
        text: 'ปฏิเสธการเข้าถึง: เฉพาะแอดมินฝ่ายวิชาการเท่านั้นที่สามารถแก้ไขข้อความได้',
      });
      return;
    }

    const res = teacherBannerService.updateBanner(
      selectedKey,
      {
        quoteText: quoteDraft,
        subText: subTextDraft,
      },
      activeRole,
      'ผู้ดูแลระบบฝ่ายวิชาการ'
    );

    if (res.success) {
      setBanners(teacherBannerService.getBanners());
      setStatusMessage({ type: 'success', text: `บันทึกข้อความของ ${currentItem.name} เรียบร้อยแล้ว` });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleResetCurrent = () => {
    if (!canManage) {
      setStatusMessage({
        type: 'error',
        text: 'ปฏิเสธการเข้าถึง: เฉพาะแอดมินฝ่ายวิชาการเท่านั้น',
      });
      return;
    }

    if (!window.confirm(`ต้องการคืนค่าเริ่มต้นสำหรับ ${currentItem.name} หรือไม่?`)) {
      return;
    }

    const res = teacherBannerService.resetBanner(selectedKey, activeRole);
    if (res.success) {
      const refreshed = teacherBannerService.getBanners();
      setBanners(refreshed);
      setQuoteDraft(refreshed[selectedKey]?.quoteText || '');
      setSubTextDraft(refreshed[selectedKey]?.subText || '');
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleResetAll = () => {
    if (!canManage) return;

    if (!window.confirm('ต้องการคืนค่าเริ่มต้นแบนเนอร์ทั้ง 3 จุดกลับสู่แบบมาตรฐานทั้งหมดหรือไม่?')) {
      return;
    }

    const res = teacherBannerService.resetAllBanners(activeRole);
    if (res.success) {
      const refreshed = teacherBannerService.getBanners();
      setBanners(refreshed);
      setQuoteDraft(refreshed[selectedKey]?.quoteText || '');
      setSubTextDraft(refreshed[selectedKey]?.subText || '');
      setStatusMessage({ type: 'success', text: res.message });
    }
  };

  const effectiveUrl = currentItem.customUrl || currentItem.defaultUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  จัดการแบนเนอร์หน้าครู 3 ส่วน
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-900 text-[10px] font-extrabold shadow-xs">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                อนุญาตเฉพาะแอดมินฝ่ายวิชาการ (ACADEMIC_ADMIN) เป็นผู้อัปโหลดและปรับแต่ง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Warning if not admin */}
        {!canManage && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>แจ้งเตือนความปลอดภัย:</strong> บทบาทปัจจุบันของคุณไม่ใช่ แอดมินฝ่ายวิชาการ
              (ACADEMIC_ADMIN) จึงสามารถดูตัวอย่างได้เท่านั้น ไม่สามารถอัปโหลดหรือแก้ไขได้
            </span>
          </div>
        )}

        {/* Tab Selection: 3 Banners */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2 overflow-x-auto">
          {[
            { key: 'hero' as TeacherBannerKey, label: '1. แบนเนอร์หลัก (Hero)' },
            { key: 'sidebar' as TeacherBannerKey, label: '2. แบนเนอร์เมนูข้าง (Sidebar)' },
            { key: 'bottom' as TeacherBannerKey, label: '3. แบนเนอร์ล่าง (Bottom)' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelectTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedKey === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Status feedback message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Banner Meta Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-extrabold text-slate-900 text-sm">{currentItem.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>ตำแหน่ง: {currentItem.locationLabel}</span>
              </div>
            </div>
            <div className="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              {currentItem.dimensionGuide}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>ตัวอย่างแบนเนอร์ปัจจุบัน (Live Preview):</span>
              {currentItem.customUrl ? (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  ● ใช้งานภาพที่คุณอัปโหลด
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  ● ใช้งานภาพเริ่มต้นจากระบบ
                </span>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 max-h-56 flex items-center justify-center">
              <img
                src={effectiveUrl}
                alt={currentItem.name}
                className="w-full h-auto object-cover max-h-56"
              />
              {/* Overlay with Quote and Subtext if applicable */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 text-white pointer-events-none">
                <div className="font-extrabold text-sm sm:text-base drop-shadow-md">
                  {quoteDraft || currentItem.quoteText}
                </div>
                {(subTextDraft || currentItem.subText) && (
                  <div className="text-xs sm:text-sm text-slate-200 drop-shadow-sm mt-0.5">
                    {subTextDraft || currentItem.subText}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload and Text Customization Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left: Image Upload Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>อัปโหลดรูปภาพใหม่</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                รองรับไฟล์ PNG, JPG, WebP ระบบจะปรับความละเอียดและบีบอัดอัตโนมัติให้พอดีกับหน้าจอ
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={!canManage || isUploading}
                className="hidden"
                id="teacher-banner-file-input"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canManage || isUploading}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    canManage && !isUploading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'กำลังประมวลผล...' : 'เลือกไฟล์ภาพ'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCurrent}
                  disabled={!canManage || !currentItem.customUrl}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                    currentItem.customUrl && canManage
                      ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  title="คืนค่าเป็นรูปภาพมาตรฐาน"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>คืนค่ารูปเดิม</span>
                </button>
              </div>
            </div>

            {/* Right: Text / Quote Customization Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>ข้อความคำคม / สโลแกน</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ข้อความหลัก (Title / Quote):
                </label>
                <input
                  type="text"
                  value={quoteDraft}
                  onChange={(e) => setQuoteDraft(e.target.value)}
                  disabled={!canManage}
                  placeholder="เช่น “การศึกษาคือการลงทุน ที่คุ้มค่าที่สุดในชีวิต”"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ข้อความรอง (Subtitle):
                </label>
                <input
                  type="text"
                  value={subTextDraft}
                  onChange={(e) => setSubTextDraft(e.target.value)}
                  disabled={!canManage}
                  placeholder="เช่น ร่วมสร้างอนาคตที่ดีกว่าไปด้วยกัน"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveTextChanges}
                  disabled={!canManage}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    canManage
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  บันทึกข้อความ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetAll}
            disabled={!canManage}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold transition-colors cursor-pointer"
          >
            คืนค่าเริ่มต้นแบนเนอร์ทั้งหมด 3 ส่วน
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
