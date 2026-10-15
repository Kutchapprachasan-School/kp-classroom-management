// src/components/student/StudentAnnouncementsView.tsx
// หน้ารวมกิจกรรมและประกาศจริงของโรงเรียน ดึงข้อมูลจาก calendarEventStorageService และ academicCalendarService
// ออกแบบตามระบบ Pastel Anime Education Dashboard (Prompt Font, Primary #3B82F6)

import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  Search,
  ChevronRight,
} from 'lucide-react';
import { getSchoolSettings } from '../../config/schoolSettings';
import {
  calendarEventStorageService,
  type CalendarEventItem,
} from '../../services/calendarEventStorageService';
import {
  academicCalendarService,
  type SpecialHolidayRecord,
  type AcademicTermRecord,
  ACADEMIC_CALENDAR_EVENT,
} from '../../services/academicCalendarService';

interface StudentAnnouncementsViewProps {
  onBack: () => void;
}

type FilterCategory = 'ALL' | 'STUDENT' | 'ACADEMIC' | 'HOLIDAY' | 'MEETING';

export const StudentAnnouncementsView: React.FC<StudentAnnouncementsViewProps> = ({ onBack }) => {
  const settings = getSchoolSettings();
  const [events, setEvents] = useState<CalendarEventItem[]>(() =>
    calendarEventStorageService.loadAllEvents()
  );
  const [holidays, setHolidays] = useState<SpecialHolidayRecord[]>(() =>
    academicCalendarService.getHolidays()
  );
  const [terms, setTerms] = useState<AcademicTermRecord[]>(() =>
    academicCalendarService.getTerms()
  );
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Sync with real school calendar and academic settings
  useEffect(() => {
    const handleEventsUpdate = () => {
      setEvents(calendarEventStorageService.loadAllEvents());
    };
    const handleCalendarUpdate = () => {
      setHolidays(academicCalendarService.getHolidays());
      setTerms(academicCalendarService.getTerms());
    };

    window.addEventListener('kp_school_calendar_events_updated', handleEventsUpdate);
    window.addEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarUpdate);
    return () => {
      window.removeEventListener('kp_school_calendar_events_updated', handleEventsUpdate);
      window.removeEventListener(ACADEMIC_CALENDAR_EVENT, handleCalendarUpdate);
    };
  }, []);

  const activeTerm = terms.find((t) => t.isActive) || terms[0];

  // Map Real Calendar Events & Holidays to Unified Student Announcements
  const allStudentAnnouncements = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      category: string;
      categoryType: FilterCategory;
      categoryColor: string;
      dateLabel: string;
      timeLabel?: string;
      location?: string;
      summary: string;
      source: 'CALENDAR' | 'HOLIDAY' | 'TERM';
      highlight?: boolean;
    }> = [];

    // 1. Calendar Events (Student or All)
    events
      .filter((ev) => ev.targetRole === 'STUDENT' || ev.targetRole === 'ALL')
      .forEach((ev) => {
        let catLabel = 'กิจกรรมโรงเรียน';
        let catType: FilterCategory = 'STUDENT';
        let catColor = 'bg-rose-50 text-rose-700 border-rose-200';

        if (ev.category === 'ACADEMIC' || ev.category === 'EXAM') {
          catLabel = 'วิชาการ & การสอบ';
          catType = 'ACADEMIC';
          catColor = 'bg-blue-50 text-blue-700 border-blue-200';
        } else if (ev.category === 'SUBMISSION') {
          catLabel = 'กำหนดส่งงาน';
          catType = 'ACADEMIC';
          catColor = 'bg-amber-50 text-amber-700 border-amber-200';
        } else if (ev.category === 'MEETING') {
          catLabel = 'การประชุม / อบรม';
          catType = 'MEETING';
          catColor = 'bg-purple-50 text-purple-700 border-purple-200';
        }

        list.push({
          id: ev.id,
          title: ev.title,
          category: catLabel,
          categoryType: catType,
          categoryColor: catColor,
          dateLabel: ev.fullDateLabel || `${ev.day}/${ev.month}/${ev.year}`,
          timeLabel: ev.time ? `${ev.time} น.` : 'ตลอดวัน',
          location: ev.location || 'โรงเรียนกุดจับประชาสรรค์',
          summary: ev.description || 'กิจกรรมสำคัญตามปฏิทินการศึกษาของโรงเรียน',
          source: 'CALENDAR',
          highlight: ev.day === 2 && ev.month === 10,
        });
      });

    // 2. Real Special Holidays
    holidays
      .filter((h) => h.isActive)
      .forEach((h) => {
        list.push({
          id: `h-${h.id}`,
          title: `วันหยุด: ${h.name}`,
          category: 'วันหยุดพิเศษ',
          categoryType: 'HOLIDAY',
          categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dateLabel: h.date,
          timeLabel: 'หยุดเรียนทั้งวัน',
          location: 'โรงเรียนปิดทำการ',
          summary: h.note || `วันหยุดราชการ/วันหยุดกรณีพิเศษ ${h.typeLabel}`,
          source: 'HOLIDAY',
        });
      });

    return list;
  }, [events, holidays]);

  // Filtered List
  const filteredAnnouncements = useMemo(() => {
    return allStudentAnnouncements.filter((item) => {
      if (selectedCategory !== 'ALL' && item.categoryType !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allStudentAnnouncements, selectedCategory, searchQuery]);

  return (
    <div className="font-['Prompt',sans-serif] space-y-5 animate-fade-in select-none max-w-5xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold mb-1.5 flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← กลับหน้าหลักนักเรียน
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#163A66]">
                กิจกรรม & ประกาศโรงเรียน (ข้อมูลจริง)
              </h1>
              <p className="text-xs text-[#6B7C93]">
                {settings.nameTh} · {activeTerm ? `${activeTerm.termName}/${activeTerm.year}` : 'ภาคเรียนปัจจุบัน'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="ค้นหาชื่อกิจกรรม หรือประกาศ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        {[
          { key: 'ALL' as FilterCategory, label: 'ทั้งหมด' },
          { key: 'STUDENT' as FilterCategory, label: 'กิจกรรมนักเรียน' },
          { key: 'ACADEMIC' as FilterCategory, label: 'วิชาการ & การสอบ' },
          { key: 'HOLIDAY' as FilterCategory, label: 'วันหยุดโรงเรียน' },
          { key: 'MEETING' as FilterCategory, label: 'อบรม / กิจกรรมรวม' },
        ].map((tab) => {
          const isActive = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">ไม่มีกิจกรรมหรือประกาศในหมวดนี้</h3>
            <p className="text-xs text-slate-400">
              เมื่อโรงเรียนเพิ่มกิจกรรมในปฏิทิน ข้อมูลจะอัปเดตอัตโนมัติทันที
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedEvent(item)}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all space-y-3 cursor-pointer group ${
                item.highlight
                  ? 'border-blue-300 ring-2 ring-blue-100 bg-blue-50/20'
                  : 'border-[#E6EEF7]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.categoryColor}`}
                    >
                      {item.category}
                    </span>
                    {item.highlight && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        ⚡ กิจกรรมเด่น
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[#163A66] text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
                  <span className="text-xs font-semibold hidden sm:inline">ดูรายละเอียด</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-[#6B7C93] leading-relaxed line-clamp-2">
                {item.summary}
              </p>

              <div className="flex items-center gap-4 text-[11px] text-[#6B7C93] pt-1 border-t border-slate-100 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>{item.dateLabel}</span>
                </span>
                {item.timeLabel && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{item.timeLabel}</span>
                  </span>
                )}
                {item.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{item.location}</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Announcement Detail */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedEvent.categoryColor}`}
                >
                  {selectedEvent.category}
                </span>
                <h3 className="font-bold text-[#163A66] text-base sm:text-lg mt-1">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">วันที่:</span>
                  <span>{selectedEvent.dateLabel}</span>
                </div>
                {selectedEvent.timeLabel && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold">เวลา:</span>
                    <span>{selectedEvent.timeLabel}</span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">สถานที่:</span>
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-[#163A66] mb-1">รายละเอียดกิจกรรม / ประกาศ:</h4>
                <p className="text-[#6B7C93] leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-100">
                  {selectedEvent.summary}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
