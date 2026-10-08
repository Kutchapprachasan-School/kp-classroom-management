import React, { useEffect } from 'react';
import { ArrowLeft, Check, Sparkles, Database } from 'lucide-react';

export interface SettingsSubModalProps {
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
  supabaseTable?: string;
  categoryPath?: string;
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
  supabaseTable,
  categoryPath = 'การตั้งค่าระบบ',
}) => {
  // ESC to return to overview
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
    <div className="w-full space-y-4 animate-fade-in font-sans">
      {/* Top Breadcrumb & Navigation Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer border border-blue-200/80 shadow-2xs group"
            title="กลับไปหน้ารวมการตั้งค่า"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>กลับไปหน้ารวมการตั้งค่า</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Breadcrumb Path */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-hidden">
            <span className="text-slate-400">ตั้งค่าระบบ</span>
            <span>/</span>
            <span className="text-slate-500">{categoryPath}</span>
            <span>/</span>
            <span className="font-bold text-[#163A66] truncate">{title}</span>
          </nav>
        </div>

        {/* Action Button & Supabase Indicator */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {supabaseTable && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Table: {supabaseTable}</span>
            </span>
          )}

          {showSaveButton && onSave && (
            <button
              type="button"
              onClick={onSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{saveButtonText}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main In-Page Card Container */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/90 overflow-hidden">
        {/* Banner Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/60 border-b border-slate-200/90 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${iconBgClass} ${iconColorClass}`}
            >
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#163A66]">{title}</h2>
                {supabaseTable && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    🟢 Supabase Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7C93] font-medium mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-7 bg-[#F8FAFC]">
          {children}
        </div>

        {/* Sticky Bottom Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>การตั้งค่าเชื่อมโยงสดกับระบบและฐานข้อมูล Supabase</span>
            {supabaseTable && (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200">
                {supabaseTable}
              </code>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
            >
              ← กลับไปหน้ารวม
            </button>
            {showSaveButton && onSave && (
              <button
                type="button"
                onClick={onSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
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
