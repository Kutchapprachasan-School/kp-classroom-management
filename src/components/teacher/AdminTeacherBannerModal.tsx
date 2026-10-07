// src/components/teacher/AdminTeacherBannerModal.tsx
// หน้าต่างปรับแต่งและอัปโหลดแบนเนอร์หน้าครู 3 ส่วน (เฉพาะผู้ดูแลระบบฝ่ายวิชาการ / Admin เท่านั้น)
// รองรับการปรับความโปร่งแสง, เลื่อนตำแหน่ง Pan X/Y, ปรับขนาด Zoom, และ Live Preview ทั้ง PC และ Mobile

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
  Sliders,
  Move,
  ZoomIn,
  Eye,
  Monitor,
  Smartphone,
  Save,
  RotateCcw,
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

  // Positioning & Display Sliders
  const [opacityDraft, setOpacityDraft] = useState<number>(100);
  const [posXDraft, setPosXDraft] = useState<number>(0);
  const [posYDraft, setPosYDraft] = useState<number>(0);
  const [scaleDraft, setScaleDraft] = useState<number>(100);
  const [showQuoteDraft, setShowQuoteDraft] = useState<boolean>(true);

  // Dual Live Preview Mode: 'pc' | 'mobile'
  const [previewDevice, setPreviewDevice] = useState<'pc' | 'mobile'>('pc');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = teacherBannerService.canManageBanners(activeRole);

  const syncFormFromItem = (item?: TeacherBannerItem) => {
    if (!item) return;
    setQuoteDraft(item.quoteText || '');
    setSubTextDraft(item.subText || '');
    setOpacityDraft(item.opacity ?? 100);
    setPosXDraft(item.positionX ?? 0);
    setPosYDraft(item.positionY ?? 0);
    setScaleDraft(item.scale ?? 100);
    setShowQuoteDraft(item.showQuote !== false);
  };

  useEffect(() => {
    if (isOpen) {
      const current = teacherBannerService.getBanners();
      setBanners(current);
      setSelectedKey(initialBannerKey);
      syncFormFromItem(current[initialBannerKey]);
      setStatusMessage(null);
    }
  }, [isOpen, initialBannerKey]);

  useEffect(() => {
    const item = banners[selectedKey];
    syncFormFromItem(item);
  }, [selectedKey, banners]);

  if (!isOpen) return null;

  const currentItem = banners[selectedKey];
  const effectiveUrl = currentItem.customUrl || currentItem.defaultUrl;

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
      let maxHeight = 300;

      if (selectedKey === 'sidebar') {
        maxWidth = 600;
        maxHeight = 450;
      } else if (selectedKey === 'bottom') {
        maxWidth = 1200;
        maxHeight = 220;
      }

      const compressedBase64 = await teacherBannerService.compressImage(
        file,
        maxWidth,
        maxHeight,
        0.88
      );

      const res = teacherBannerService.updateBanner(
        selectedKey,
        {
          customUrl: compressedBase64,
          quoteText: quoteDraft,
          subText: subTextDraft,
          opacity: opacityDraft,
          positionX: posXDraft,
          positionY: posYDraft,
          scale: scaleDraft,
          showQuote: showQuoteDraft,
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

  const handleSaveAllAdjustments = () => {
    if (!canManage) {
      setStatusMessage({
        type: 'error',
        text: 'ปฏิเสธการเข้าถึง: เฉพาะแอดมินฝ่ายวิชาการเท่านั้นที่สามารถแก้ไขได้',
      });
      return;
    }

    const res = teacherBannerService.updateBanner(
      selectedKey,
      {
        quoteText: quoteDraft,
        subText: subTextDraft,
        opacity: opacityDraft,
        positionX: posXDraft,
        positionY: posYDraft,
        scale: scaleDraft,
        showQuote: showQuoteDraft,
      },
      activeRole,
      'ผู้ดูแลระบบฝ่ายวิชาการ'
    );

    if (res.success) {
      setBanners(teacherBannerService.getBanners());
      setStatusMessage({
        type: 'success',
        text: `บันทึกการปรับแต่งตำแหน่งและภาพของ ${currentItem.name} เรียบร้อยแล้ว`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleResetAlignment = () => {
    setOpacityDraft(100);
    setPosXDraft(0);
    setPosYDraft(0);
    setScaleDraft(100);
    setShowQuoteDraft(true);
    setStatusMessage({
      type: 'success',
      text: 'คืนค่าตำแหน่งตรงกลาง สัดส่วน 100% และความโปร่งแสงเต็ม 100% เรียบร้อย (กดบันทึกเพื่อใช้งานจริง)',
    });
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
      syncFormFromItem(refreshed[selectedKey]);
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
      syncFormFromItem(refreshed[selectedKey]);
      setStatusMessage({ type: 'success', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-xs border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  จัดการและปรับแต่งภาพแบนเนอร์ (Admin Banner Studio)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-900 text-[10px] font-extrabold shadow-xs">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                กำหนดขนาดภาพ ขยับให้ตรงเฟรม ปรับความโปร่งแสง และ Preview ทั้งหน้าจอ PC และ Mobile
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
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2 shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>แจ้งเตือนความปลอดภัย:</strong> บทบาทปัจจุบันของคุณไม่ใช่ แอดมินฝ่ายวิชาการ
              (ACADEMIC_ADMIN) จึงสามารถดูตัวอย่างได้เท่านั้น ไม่สามารถอัปโหลดหรือแก้ไขได้
            </span>
          </div>
        )}

        {/* Tab Selection: 3 Banners */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2 overflow-x-auto shrink-0">
          {[
            { key: 'hero' as TeacherBannerKey, label: '1. แบนเนอร์หลักด้านบน (Hero Banner)' },
            { key: 'sidebar' as TeacherBannerKey, label: '2. แบนเนอร์เมนูข้าง (Sidebar Mascot)' },
            { key: 'bottom' as TeacherBannerKey, label: '3. แบนเนอร์ล่าง (Bottom Banner)' },
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

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
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

          {/* Dimension Guide Bar (ระบบจะ fix ขนาดให้ว่าเท่าไร) */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                📐
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900">
                  {currentItem.name} • {currentItem.locationLabel}
                </div>
                <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                  ขนาดมาตรฐานที่ระบบแนะนำ: <span className="font-extrabold underline">{currentItem.dimensionGuide}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 bg-white/80 border border-blue-200 px-2.5 py-1 rounded-xl">
                {currentItem.customUrl ? '🟢 กำลังใช้ภาพที่คุณอัปโหลด' : '⚪ กำลังใช้ภาพเริ่มต้นจากระบบ'}
              </span>
            </div>
          </div>

          {/* ========================================================
              LIVE PREVIEW WITH DUAL DEVICE SWITCHER (PC vs MOBILE)
              ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>ตัวอย่างการแสดงผลจริง (Dual Live Preview):</span>
              </div>

              {/* Device Selector Pills */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('pc')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    previewDevice === 'pc'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>💻 คอมพิวเตอร์ (PC Desktop)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>📱 มือถือ (Mobile View)</span>
                </button>
              </div>
            </div>

            {/* Desktop Preview Frame */}
            {previewDevice === 'pc' ? (
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
                <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                  <span>🖥️ หน้าจอ PC ขนาด 1200px (ความกว้างเต็มหน้าจอ)</span>
                  <span>ความโปร่งแสง: {opacityDraft}% • ซูม: {scaleDraft}%</span>
                </div>
                <div className="relative w-full rounded-2xl border border-[#E6EEF7] bg-white shadow-xs overflow-hidden min-h-[125px] flex items-center">
                  {/* Background Graphic */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img
                      src={effectiveUrl}
                      alt="Banner Preview"
                      style={{
                        opacity: opacityDraft / 100,
                        transform: `translate(${posXDraft}%, ${posYDraft}%) scale(${scaleDraft / 100})`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full object-cover object-right md:object-center transition-all duration-150"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent sm:to-white/10" />
                  </div>

                  {/* Foreground Content */}
                  <div className="relative z-10 px-6 py-5 flex items-center justify-between w-full">
                    <div className="flex items-center gap-3.5 max-w-lg">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
                        📅
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-slate-900 leading-tight">
                            ตารางสอน
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                            ม.3/1
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {subTextDraft || currentItem.subText || 'จัดสรรเวลาและคาบสอนเพื่อให้นักเรียนทุกคนพัฒนาได้อย่างเต็มที่'}
                        </p>
                      </div>
                    </div>

                    {showQuoteDraft && (
                      <div className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-xs border border-pink-100 shadow-2xs text-[#163A66] text-xs font-bold">
                        <span className="text-pink-500">🌸</span>
                        <span className="italic">
                          {quoteDraft || currentItem.quoteText || '“การตั้งใจทำทุกครั้ง ช่วยให้เราก้าวหน้าได้ขึ้น นะคะ ♡”'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Mobile Preview Frame */
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-100 p-4 flex flex-col items-center justify-center shadow-inner">
                <div className="text-[11px] font-semibold text-slate-500 mb-2">
                  📱 หน้าจอมือถือขนาด 375px (Mobile Portrait Frame)
                </div>
                {/* Smartphone Silhouette */}
                <div className="w-full max-w-[375px] rounded-[32px] border-[5px] border-slate-800 bg-white shadow-xl overflow-hidden p-3 relative">
                  {/* Phone Notch/Speaker */}
                  <div className="w-24 h-3.5 bg-slate-800 rounded-b-xl mx-auto mb-2 flex items-center justify-center">
                    <div className="w-8 h-1 bg-slate-600 rounded-full" />
                  </div>

                  {/* Mobile Banner View */}
                  <div className="relative w-full rounded-2xl border border-[#E6EEF7] bg-white shadow-xs overflow-hidden min-h-[96px] flex flex-col justify-center">
                    {/* Background Graphic */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <img
                        src={effectiveUrl}
                        alt="Mobile Banner Preview"
                        style={{
                          opacity: opacityDraft / 100,
                          transform: `translate(${posXDraft}%, ${posYDraft}%) scale(${scaleDraft / 100})`,
                          transformOrigin: 'center center',
                        }}
                        className="w-full h-full object-cover object-right transition-all duration-150"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
                    </div>

                    {/* Mobile Foreground Content */}
                    <div className="relative z-10 p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                          📅
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 leading-tight">
                            ตารางสอน
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium line-clamp-1">
                            {subTextDraft || currentItem.subText || 'จัดสรรเวลาและคาบสอน...'}
                          </div>
                        </div>
                      </div>
                      {showQuoteDraft && (
                        <div className="text-[10px] italic font-semibold text-pink-700 bg-pink-50/80 px-2 py-0.5 rounded-lg border border-pink-200/80 line-clamp-1 inline-block">
                          🌸 {quoteDraft || currentItem.quoteText || 'การตั้งใจทำทุกครั้ง ช่วยให้เราก้าวหน้าได้ขึ้น'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Bottom Mock Indicator */}
                  <div className="w-16 h-1 bg-slate-300 rounded-full mx-auto mt-3" />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================
              SLIDERS & ADJUSTMENT TOOLBAR (ขยับภาพ, โปร่งแสง, ซูม)
              ======================================================== */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>ปรับแต่งตำแหน่ง ความโปร่งแสง และสเกล (Fine-Tuning Controls):</span>
              </div>
              <button
                type="button"
                onClick={handleResetAlignment}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                title="คืนค่าตรงกลาง 0%, ซูม 100%, โปร่งแสง 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตตำแหน่ง & ซูม</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Slider 1: Opacity (โปร่งแสงไหม) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>ความโปร่งแสง</span>
                  </span>
                  <span className="text-blue-600">{opacityDraft}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={opacityDraft}
                  onChange={(e) => setOpacityDraft(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>20% (โปร่งมาก)</span>
                  <span>100% (ชัดเจน)</span>
                </div>
              </div>

              {/* Slider 2: Pan X (ขยับแนวนอน) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ขยับแนวนอน (X)</span>
                  </span>
                  <span className="text-emerald-600">{posXDraft > 0 ? `+${posXDraft}%` : `${posXDraft}%`}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="2"
                  value={posXDraft}
                  onChange={(e) => setPosXDraft(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>← ซ้าย (-50%)</span>
                  <span>ขวา (+50%) →</span>
                </div>
              </div>

              {/* Slider 3: Pan Y (ขยับแนวตั้ง) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-purple-600 rotate-90" />
                    <span>ขยับแนวตั้ง (Y)</span>
                  </span>
                  <span className="text-purple-600">{posYDraft > 0 ? `+${posYDraft}%` : `${posYDraft}%`}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="2"
                  value={posYDraft}
                  onChange={(e) => setPosYDraft(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>↑ บน (-50%)</span>
                  <span>ล่าง (+50%) ↓</span>
                </div>
              </div>

              {/* Slider 4: Scale / Zoom (ขยายภาพ) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-amber-600" />
                    <span>สเกล / ซูม (Zoom)</span>
                  </span>
                  <span className="text-amber-600">{scaleDraft}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="5"
                  value={scaleDraft}
                  onChange={(e) => setScaleDraft(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>80% (ย่อ)</span>
                  <span>150% (ขยาย)</span>
                </div>
              </div>
            </div>

            {/* Toggle Show Quote Bubble */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showQuoteDraft}
                  onChange={(e) => setShowQuoteDraft(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  แสดงบอลลูนคำคมและกำลังใจจากน้องอนิเมะ (🌸 Quote Bubble)
                </span>
              </label>

              <button
                type="button"
                onClick={handleSaveAllAdjustments}
                disabled={!canManage}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  canManage
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการปรับตำแหน่ง & สเกล</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              UPLOAD IMAGE & TEXT EDITORS
              ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Image Upload Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>อัปโหลดภาพแบนเนอร์ใหม่</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                รองรับไฟล์ PNG, JPG, WebP ขนาดแนะนำ {currentItem.dimensionGuide} ระบบจะบีบอัดอัตโนมัติเพื่อให้โหลดเร็ว
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

              <div className="flex items-center gap-2 pt-1">
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
                  <span>{isUploading ? 'กำลังประมวลผล...' : 'เลือกไฟล์ภาพเพื่ออัปโหลด'}</span>
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
                  title="คืนค่าเป็นรูปภาพมาตรฐานจากระบบ"
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
                <span>ข้อความคำคมและสโลแกนประจำแบนเนอร์</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ข้อความคำคม / บอลลูนอนิเมะ (Quote):
                </label>
                <input
                  type="text"
                  value={quoteDraft}
                  onChange={(e) => setQuoteDraft(e.target.value)}
                  disabled={!canManage}
                  placeholder="เช่น “การตั้งใจทำทุกครั้ง ช่วยให้เราก้าวหน้าได้ขึ้น นะคะ ♡”"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ข้อความรอง / คำอธิบาย (Subtitle):
                </label>
                <input
                  type="text"
                  value={subTextDraft}
                  onChange={(e) => setSubTextDraft(e.target.value)}
                  disabled={!canManage}
                  placeholder="เช่น จัดสรรเวลาและคาบสอนเพื่อให้นักเรียนทุกคนพัฒนาได้อย่างเต็มที่"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveAllAdjustments}
                  disabled={!canManage}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    canManage
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  บันทึกข้อความ & การตั้งค่า
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetAll}
            disabled={!canManage}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold transition-colors cursor-pointer"
          >
            คืนค่าเริ่มต้นแบนเนอร์ทั้งหมด 3 ส่วน
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAllAdjustments}
              disabled={!canManage}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer ${
                canManage
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              💾 บันทึกทั้งหมด
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
    </div>
  );
};
