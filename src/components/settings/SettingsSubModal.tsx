import React, { useEffect } from 'react';
import { X, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface SettingsSubModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  children: React.ReactNode;
  onSave?: () => void;
  saveButtonText?: string;
  showSaveButton?: boolean;
}

export const SettingsSubModal: React.FC<SettingsSubModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconBgClass,
  iconColorClass,
  children,
  onSave,
  saveButtonText = '💾 บันทึกการตั้งค่า',
  showSaveButton = true,
}) => {
  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Top Header with Breadcrumbs */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/60 border-b border-slate-200/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="กลับไปหน้าตั้งค่ารวม"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">กลับ</span>
            </button>

            {/* Icon & Title */}
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${iconBgClass} ${iconColorClass}`}
            >
              {icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[#163A66]">
                  {title}
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Settings
                </span>
              </div>
              <p className="text-xs text-[#6B7C93] font-medium">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC]">
          {children}
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>การตั้งค่าจะถูกบันทึกลงระบบทันทีเพื่อความปลอดภัย</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              ปิด
            </button>

            {showSaveButton && onSave && (
              <button
                type="button"
                onClick={onSave}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{saveButtonText}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
