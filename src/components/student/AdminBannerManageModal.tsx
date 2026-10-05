// src/components/student/AdminBannerManageModal.tsx
// หน้าต่าง Modal ให้แอดมิน (ACADEMIC_ADMIN) จัดการอัปโหลดแบนเนอร์ทั้ง 3 ส่วน

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  studentBannerService,
  type StudentBannerKey,
  type StudentBannerItem,
} from '../../services/studentBannerService';
import type { SchoolUserRole } from '../../config/schoolRoles';

interface AdminBannerManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: SchoolUserRole | string;
  onBannerUpdated?: () => void;
}

export const AdminBannerManageModal: React.FC<AdminBannerManageModalProps> = ({
  isOpen,
  onClose,
  userRole = 'ACADEMIC_ADMIN',
  onBannerUpdated,
}) => {
  const [banners, setBanners] = useState<Record<StudentBannerKey, StudentBannerItem>>(() =>
    studentBannerService.getBanners()
  );
  const [activeTab, setActiveTab] = useState<StudentBannerKey>('hero');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const isAdmin = studentBannerService.canManageBanners(userRole);

  useEffect(() => {
    if (isOpen) {
      setBanners(studentBannerService.getBanners());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentItem = banners[activeTab];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      setStatusMessage({
        type: 'error',
        text: 'เฉพาะผู้ดูแลระบบฝ่ายวิชาการ (Admin) เท่านั้นที่สามารถอัปโหลดแบนเนอร์ได้',
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      // ปรับขนาดความกว้างตามประเภทแบนเนอร์
      const maxWidth = activeTab === 'hero' ? 1200 : activeTab === 'sidebar' ? 600 : 800;
      const maxHeight = activeTab === 'hero' ? 400 : activeTab === 'sidebar' ? 600 : 250;
      const compressedDataUrl = await studentBannerService.compressImage(file, maxWidth, maxHeight, 0.85);

      const res = studentBannerService.updateBanner(
        activeTab,
        { customUrl: compressedDataUrl },
        userRole,
        'แอดมินฝ่ายวิชาการ'
      );

      if (res.success) {
        setBanners(studentBannerService.getBanners());
        setStatusMessage({ type: 'success', text: `อัปโหลด ${currentItem.name} สำเร็จแล้ว!` });
        onBannerUpdated?.();
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ' });
    } finally {
      setIsProcessing(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleResetBanner = (key: StudentBannerKey) => {
    if (!isAdmin) return;
    const res = studentBannerService.resetBanner(key, userRole);
    if (res.success) {
      setBanners(studentBannerService.getBanners());
      setStatusMessage({ type: 'success', text: res.message });
      onBannerUpdated?.();
    }
  };

  const handleResetAll = () => {
    if (!isAdmin) return;
    if (window.confirm('คุณต้องการรีเซ็ตแบนเนอร์ทั้ง 3 ส่วนกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      const res = studentBannerService.resetAllBanners(userRole);
      if (res.success) {
        setBanners(studentBannerService.getBanners());
        setStatusMessage({ type: 'success', text: res.message });
        onBannerUpdated?.();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Prompt',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>จัดการแบนเนอร์หน้านักเรียน (3 ส่วน)</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  Admin Only
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                เฉพาะแอดมินฝ่ายวิชาการเท่านั้นที่สามารถอัปโหลดและปรับเปลี่ยนแบนเนอร์ทั้ง 3 จุดได้
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning if non-admin */}
        {!isAdmin && (
          <div className="p-4 mx-6 mt-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="font-bold">ไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้</div>
              <div>บทบาทของคุณปัจจุบันไม่ใช่ Admin ฝ่ายวิชาการ จึงไม่สามารถอัปโหลดหรือแก้ไขแบนเนอร์ได้</div>
            </div>
          </div>
        )}

        {/* Status Toast Message */}
        {statusMessage && (
          <div
            className={`mx-6 mt-3 p-3 rounded-2xl flex items-center gap-2 text-xs font-medium transition-all ${
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

        {/* Tabs for 3 Banners */}
        <div className="px-6 pt-4 border-b border-slate-100 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'hero'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>1. แบนเนอร์หลักกึ่งกลาง (Hero)</span>
            {banners.hero.customUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sidebar')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'sidebar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>2. แบนเนอร์เมนูข้าง (Sidebar)</span>
            {banners.sidebar.customUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bottom')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'bottom'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>3. แบนเนอร์ล่างขวา (Motivational)</span>
            {banners.bottom.customUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{currentItem.name}</h3>
                <p className="text-xs text-slate-500">{currentItem.locationLabel}</p>
              </div>
              <div className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                📐 {currentItem.dimensionGuide}
              </div>
            </div>

            {/* Current Banner Preview Card */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ภาพตัวอย่างที่กำลังแสดงผล (Live Preview):</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {currentItem.customUrl ? 'รูปภาพที่ Admin อัปโหลดเอง' : 'รูปภาพมาตรฐานของระบบ'}
                </span>
              </label>

              <div
                className={`relative rounded-2xl overflow-hidden border-2 bg-slate-100 flex items-center justify-center p-2 shadow-2xs ${
                  currentItem.customUrl ? 'border-emerald-300' : 'border-slate-200'
                }`}
              >
                <img
                  src={studentBannerService.getEffectiveBannerUrl(activeTab)}
                  alt={currentItem.name}
                  className="max-h-52 w-auto object-contain rounded-xl shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>🕒 {currentItem.updatedAt}</span>
                <span>👤 โดย: {currentItem.updatedBy || 'ระบบ'}</span>
              </div>
            </div>

            {/* Upload & Actions */}
            {isAdmin && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                  <Upload className="w-4 h-4" />
                  <span>{isProcessing ? 'กำลังประมวลผล...' : 'อัปโหลดภาพแบนเนอร์ใหม่'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isProcessing}
                    onChange={handleFileUpload}
                  />
                </label>

                {currentItem.customUrl && (
                  <button
                    type="button"
                    onClick={() => handleResetBanner(activeTab)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>รีเซ็ตกลับเป็นภาพเริ่มต้น</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Banner Details Overview Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              สถานะแบนเนอร์ทั้ง 3 จุดในระบบ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['hero', 'sidebar', 'bottom'] as StudentBannerKey[]).map((key) => {
                const b = banners[key];
                return (
                  <div
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                      activeTab === key
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {key === 'hero' ? '1. แบนเนอร์หลัก' : key === 'sidebar' ? '2. แบนเนอร์ข้าง' : '3. แบนเนอร์ล่างขวา'}
                      </span>
                      {b.customUrl ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">
                          คัสตอม
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.2 rounded">
                          เริ่มต้น
                        </span>
                      )}
                    </div>
                    <div className="h-16 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/60">
                      <img
                        src={studentBannerService.getEffectiveBannerUrl(key)}
                        alt={b.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          {isAdmin ? (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              รีเซ็ตแบนเนอร์ทั้ง 3 ส่วนเป็นค่าเริ่มต้น
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
