import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';

interface TeacherMobileGradingSummaryScreenProps {
  onBack?: () => void;
  onNavigate: (view: TeacherViewKey) => void;
}

export const TeacherMobileGradingSummaryScreen: React.FC<
  TeacherMobileGradingSummaryScreenProps
> = ({ onBack, onNavigate }) => {
  const [periodTab, setPeriodTab] = useState<'WEEK' | 'MONTH'>('WEEK');

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-24 font-sans select-none text-slate-800">
      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('mobile-grading-list');
          }}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="ย้อนกลับ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-black text-slate-900">
          สรุปการตรวจงาน
        </h1>
      </div>

      {/* 2. Period Tabs: [สัปดาห์นี้], [เดือนนี้] matching Screen 7 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPeriodTab('WEEK')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            periodTab === 'WEEK'
              ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          สัปดาห์นี้
        </button>

        <button
          type="button"
          onClick={() => setPeriodTab('MONTH')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            periodTab === 'MONTH'
              ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          เดือนนี้
        </button>
      </div>

      {/* 3. Donut Progress Card matching Screen 7 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
        {/* SVG Donut Ring showing 68% */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              strokeWidth="3.8"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-emerald-500"
              strokeDasharray="68, 100"
              strokeWidth="3.8"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-black text-slate-900 leading-none">
              68%
            </span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mb-2">
            ตรวจงานแล้ว <span className="text-emerald-600">27</span> / 40 รายการ
          </h3>

          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>ตรวจแล้ว</span>
            </div>
            <span className="font-extrabold text-slate-900">27</span>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>ยังไม่ตรวจ</span>
            </div>
            <span className="font-extrabold text-slate-900">12</span>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>ขาดส่ง</span>
            </div>
            <span className="font-extrabold text-slate-900">1</span>
          </div>
        </div>
      </div>

      {/* 4. Section: รายวิชาที่ต้องตรวจมากที่สุด matching Screen 7 */}
      <div className="space-y-2.5">
        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 px-1">
          รายวิชาที่ต้องตรวจมากที่สุด
        </h3>

        {/* Item 1: ญ31201 ภาษาญี่ปุ่น */}
        <div
          onClick={() => onNavigate('mobile-class-submissions')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              ญ31201 ภาษาญี่ปุ่น
            </h4>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
              <span>8/12</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: '66.7%' }}
            />
          </div>
        </div>

        {/* Item 2: ญ33201 ภาษาญี่ปุ่น */}
        <div
          onClick={() => onNavigate('mobile-class-submissions')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              ญ33201 ภาษาญี่ปุ่น
            </h4>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
              <span>6/10</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all"
              style={{ width: '60%' }}
            />
          </div>
        </div>

        {/* Item 3: ญ21202 ภาษาญี่ปุ่นพื้นฐาน */}
        <div
          onClick={() => onNavigate('mobile-class-submissions')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              ญ21202 ภาษาญี่ปุ่นพื้นฐาน
            </h4>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
              <span>4/8</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: '50%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
