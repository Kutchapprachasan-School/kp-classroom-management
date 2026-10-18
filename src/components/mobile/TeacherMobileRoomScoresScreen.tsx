import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Calendar,
  BarChart2,
  X,
  Users,
} from 'lucide-react';
import type { TeacherViewKey } from '../layout/TeacherSidebar';
import { getLocalClassrooms } from '../../services/classroomService';
import { academicCalendarService } from '../../services/academicCalendarService';

interface SubjectRoomScore {
  code: string;
  name: string;
  percentage: number;
  averageScore: number;
  maxScore: number;
  passCount: number;
  failCount: number;
  totalStudents: number;
  highestScore: number;
  lowestScore: number;
}

interface TeacherMobileRoomScoresScreenProps {
  onNavigate: (view: TeacherViewKey) => void;
  onBack?: () => void;
}

const DEFAULT_ROOM_OPTIONS = ['ม.3/1', 'ม.3/2', 'ม.1/1', 'ม.6/1'];
const DEFAULT_TERM_OPTIONS = ['ภาคเรียนที่ 1/2569', 'ภาคเรียนที่ 2/2568'];

export const TeacherMobileRoomScoresScreen: React.FC<TeacherMobileRoomScoresScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('ม.3/1');
  const [selectedTerm, setSelectedTerm] = useState<string>('ภาคเรียนที่ 1/2569');
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [isTermDropdownOpen, setIsTermDropdownOpen] = useState(false);
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<SubjectRoomScore | null>(null);

  const availableRooms = useMemo(() => {
    try {
      const loaded = getLocalClassrooms();
      const names = loaded.map((r) => r.name || r.roomNumber).filter(Boolean);
      return Array.from(new Set([...DEFAULT_ROOM_OPTIONS, ...names]));
    } catch {
      return DEFAULT_ROOM_OPTIONS;
    }
  }, []);

  const availableTerms = useMemo(() => {
    try {
      const loaded = academicCalendarService.getTerms();
      const names = loaded.map((t) => `${t.termName}/${t.year}`).filter(Boolean);
      return Array.from(new Set([...DEFAULT_TERM_OPTIONS, ...names]));
    } catch {
      return DEFAULT_TERM_OPTIONS;
    }
  }, []);

  const subjectScores: SubjectRoomScore[] = [
    {
      code: 'ญ31201',
      name: 'ภาษาญี่ปุ่น',
      percentage: 82,
      averageScore: 16.4,
      maxScore: 20,
      passCount: 18,
      failCount: 2,
      totalStudents: 20,
      highestScore: 20,
      lowestScore: 11,
    },
    {
      code: 'ญ33201',
      name: 'ภาษาญี่ปุ่น',
      percentage: 76,
      averageScore: 15.2,
      maxScore: 20,
      passCount: 16,
      failCount: 4,
      totalStudents: 20,
      highestScore: 19.5,
      lowestScore: 9,
    },
    {
      code: 'ญ21202',
      name: 'ภาษาญี่ปุ่นพื้นฐาน',
      percentage: 90,
      averageScore: 18.0,
      maxScore: 20,
      passCount: 20,
      failCount: 0,
      totalStudents: 20,
      highestScore: 20,
      lowestScore: 14,
    },
  ];

  // Helper to render SVG circular progress gauge
  const renderCircularProgress = (percentage: number) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Pick stroke color based on percentage
    let strokeColor = '#06b6d4'; // cyan-500
    if (percentage >= 85) strokeColor = '#10b981'; // emerald-500
    else if (percentage >= 75) strokeColor = '#0ea5e9'; // sky-500
    else strokeColor = '#f59e0b'; // amber-500

    return (
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke={strokeColor}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-xs font-black text-slate-800 tracking-tight">
          {percentage}%
        </span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-24 font-sans select-none text-slate-800">
      {/* 1. TOP HEADER */}
      <div className="flex items-center gap-3 pt-1 pb-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else onNavigate('home');
          }}
          className="w-8 h-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          aria-label="ย้อนกลับ"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          คะแนนรายห้องเรียน
        </h1>
      </div>

      {/* 2. FILTER DROPDOWNS ROW */}
      <div className="flex items-center justify-between gap-2 relative z-20">
        {/* Left: Room Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsRoomDropdownOpen((prev) => !prev);
              setIsTermDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>{selectedRoom}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isRoomDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-36 bg-white border border-slate-100 rounded-xl shadow-lg p-1 space-y-0.5 z-30 animate-in fade-in zoom-in-95">
              {availableRooms.map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => {
                    setSelectedRoom(room);
                    setIsRoomDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedRoom === room
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ห้อง {room}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Term Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsTermDropdownOpen((prev) => !prev);
              setIsRoomDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{selectedTerm}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isTermDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-100 rounded-xl shadow-lg p-1 space-y-0.5 z-30 animate-in fade-in zoom-in-95">
              {availableTerms.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSelectedTerm(term);
                    setIsTermDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedTerm === term
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. SUBJECT CARDS LIST */}
      <div className="space-y-3">
        {subjectScores.map((item) => (
          <div
            key={item.code}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm transition-all"
          >
            {/* Subject Code & Name */}
            <h2 className="text-sm font-extrabold text-slate-900 mb-3 tracking-tight">
              {item.code} {item.name}
            </h2>

            {/* Content Row: Circular Gauge + Middle Stats + Action Button */}
            <div className="flex items-center justify-between gap-3">
              {/* Left: Circular Gauge */}
              {renderCircularProgress(item.percentage)}

              {/* Middle: Average Score & Pass/Fail Counts */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-slate-500 font-medium">เฉลี่ย</span>
                  <span className="text-sm font-extrabold text-blue-600">
                    {item.averageScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    / {item.maxScore}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  ผ่าน {item.passCount} คน | ไม่ผ่าน {item.failCount} คน
                </p>
              </div>

              {/* Right: Detail Action Button */}
              <button
                type="button"
                onClick={() => setSelectedSubjectDetail(item)}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>ดูรายละเอียด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. DETAIL MODAL */}
      {selectedSubjectDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {selectedSubjectDetail.code} {selectedSubjectDetail.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubjectDetail(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/70">
                <span className="text-slate-500 font-medium">คะแนนเฉลี่ย</span>
                <p className="text-base font-extrabold text-blue-700 mt-0.5">
                  {selectedSubjectDetail.averageScore} / {selectedSubjectDetail.maxScore}
                </p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/70">
                <span className="text-slate-500 font-medium">ผ่านเกณฑ์</span>
                <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                  {selectedSubjectDetail.passCount} / {selectedSubjectDetail.totalStudents} คน
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">คะแนนสูงสุด</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {selectedSubjectDetail.highestScore} คะแนน
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">คะแนนต่ำสุด</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {selectedSubjectDetail.lowestScore} คะแนน
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedSubjectDetail(null);
                onNavigate('mobile-class-submissions');
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>ตรวจงานและดูรายชื่อห้อง {selectedRoom}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
