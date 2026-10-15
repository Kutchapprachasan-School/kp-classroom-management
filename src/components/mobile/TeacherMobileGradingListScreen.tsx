import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  X,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';
import { cleanSlateService } from '../../services/cleanSlateService';

export interface MobileGradingAssignmentItem {
  id: string;
  classroom: string;
  subjectCode: string;
  subjectName: string;
  unitTitle: string;
  status: 'PENDING' | 'DONE' | 'AWAITING_GRADE';
  statusLabel: string;
  statusClass: string;
  submittedCount: number;
  totalCount: number;
  iconBgClass: string;
  iconSymbol: string;
}

interface TeacherMobileGradingListScreenProps {
  onBack?: () => void;
  onNavigate: (view: TeacherViewKey) => void;
  onSelectAssignment?: (assignment: MobileGradingAssignmentItem) => void;
}

export const INITIAL_MOBILE_ASSIGNMENTS: MobileGradingAssignmentItem[] = [
  {
    id: 'asg-m31',
    classroom: 'ม.3/1',
    subjectCode: 'ญ31201',
    subjectName: 'ภาษาญี่ปุ่น',
    unitTitle: 'หน่วยที่ 5: ศิลปะร่วมสมัยไทย (กิจกรรมสีฟ้า)',
    status: 'PENDING',
    statusLabel: 'ยังไม่ตรวจ',
    statusClass: 'text-rose-500 bg-rose-50 border-rose-200',
    submittedCount: 8,
    totalCount: 20,
    iconBgClass: 'bg-blue-100 text-blue-700',
    iconSymbol: 'あ',
  },
  {
    id: 'asg-m32',
    classroom: 'ม.3/2',
    subjectCode: 'ญ33201',
    subjectName: 'ภาษาญี่ปุ่น',
    unitTitle: 'หน่วยที่ 2: อาหารญี่ปุ่น',
    status: 'PENDING',
    statusLabel: 'ยังไม่ตรวจ',
    statusClass: 'text-rose-500 bg-rose-50 border-rose-200',
    submittedCount: 14,
    totalCount: 20,
    iconBgClass: 'bg-purple-100 text-purple-700',
    iconSymbol: 'あ',
  },
  {
    id: 'asg-m61',
    classroom: 'ม.6/1',
    subjectCode: 'ญ21202',
    subjectName: 'ภาษาญี่ปุ่นพื้นฐาน',
    unitTitle: 'บทที่ 1: การแนะนำตัวเอง',
    status: 'DONE',
    statusLabel: 'ตรวจแล้ว',
    statusClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    submittedCount: 20,
    totalCount: 20,
    iconBgClass: 'bg-emerald-100 text-emerald-700',
    iconSymbol: 'あ',
  },
  {
    id: 'asg-m11',
    classroom: 'ม.1/1',
    subjectCode: 'ญ22201',
    subjectName: 'ภาษาญี่ปุ่นพื้นฐาน',
    unitTitle: 'บทที่ 3: ตัวเลข 0-100',
    status: 'AWAITING_GRADE',
    statusLabel: 'รอส่งคะแนน',
    statusClass: 'text-amber-600 bg-amber-50 border-amber-200',
    submittedCount: 18,
    totalCount: 22,
    iconBgClass: 'bg-amber-100 text-amber-700',
    iconSymbol: 'あ',
  },
];

export const TeacherMobileGradingListScreen: React.FC<
  TeacherMobileGradingListScreenProps
> = ({ onBack, onNavigate, onSelectAssignment }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');

  const dynamicItems: MobileGradingAssignmentItem[] = useMemo(() => {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem('cls_assignments_data');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((a: any) => ({
        id: a.id,
        classroom: a.classroomId || 'ม.3/1',
        subjectCode: a.subjectCode || 'ญ31201',
        subjectName: a.subjectName || 'ภาษาญี่ปุ่น',
        unitTitle: a.title || 'ใบงานใหม่',
        status: 'PENDING' as const,
        statusLabel: 'ยังไม่ตรวจ',
        statusClass: 'text-rose-500 bg-rose-50 border-rose-200',
        submittedCount: a.submittedCount ?? 0,
        totalCount: a.totalStudents ?? 20,
        iconBgClass: 'bg-blue-100 text-blue-700',
        iconSymbol: 'あ',
      }));
    } catch {
      return [];
    }
  }, []);

  const sourceItems = useMemo(() => {
    if (cleanSlateService.isCleanSlateActive()) return [];
    const map = new Map<string, MobileGradingAssignmentItem>();
    INITIAL_MOBILE_ASSIGNMENTS.forEach((item) => map.set(item.id, item));
    dynamicItems.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [dynamicItems]);

  const filteredItems = sourceItems.filter((item: MobileGradingAssignmentItem) => {
    const matchesFilter =
      filterTab === 'ALL' ||
      (filterTab === 'PENDING' && item.status === 'PENDING') ||
      (filterTab === 'DONE' && item.status === 'DONE');

    if (!matchesFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      item.classroom.toLowerCase().includes(q) ||
      item.subjectCode.toLowerCase().includes(q) ||
      item.subjectName.toLowerCase().includes(q) ||
      item.unitTitle.toLowerCase().includes(q)
    );
  });

  const handleCardClick = (item: MobileGradingAssignmentItem) => {
    if (onSelectAssignment) {
      onSelectAssignment(item);
    }
    onNavigate('mobile-class-submissions');
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3.5 pb-24 font-sans select-none text-slate-800">
      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-2.5 pt-1 pb-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('home');
          }}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="ย้อนกลับ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-black text-slate-900">
          ตรวจงานนักเรียน
        </h1>
      </div>

      {/* 2. Search Input matching Screen 2 */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาชื่อเรื่อง / รายวิชา / ห้องเรียน..."
          className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Filter Tabs (ทั้งหมด 12, ยังไม่ตรวจ 8, ตรวจแล้ว 4) */}
      <div className="flex items-center gap-2 pt-0.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          ทั้งหมด 12
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('PENDING')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            filterTab === 'PENDING'
              ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
              : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
          }`}
        >
          ยังไม่ตรวจ 8
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('DONE')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            filterTab === 'DONE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          ตรวจแล้ว 4
        </button>
      </div>

      {/* 4. Assignment Cards List matching Screen 2 */}
      <div className="space-y-2.5 pt-1">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 font-medium text-xs">
            ยังไม่มีรายการตรวจงานในขณะนี้
          </div>
        ) : (
          filteredItems.map((item: MobileGradingAssignmentItem) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {/* Subject Character Badge */}
                <div
                  className={`w-10 h-10 rounded-xl ${item.iconBgClass} font-black text-sm flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                >
                  {item.iconSymbol}
                </div>

                {/* Title & Unit details */}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-500">
                    {item.classroom}
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug truncate">
                    {item.subjectCode} {item.subjectName}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                    {item.unitTitle}
                  </p>

                  {/* Status and count */}
                  <div className="flex items-center gap-2.5 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.statusClass}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{item.statusLabel}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.submittedCount}/{item.totalCount} คน
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
