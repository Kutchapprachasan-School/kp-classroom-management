// src/components/timetable/AssignWaitingSlotModal.tsx
// หน้าต่างเลือกคาบว่างเพื่อลงตารางสอนจาก Waiting Pool (Assign Waiting Slot Modal)
// สอดคล้องกับมาตรฐาน Pastel Anime Education Dashboard (Prompt typography, #1D75D8, #10B981)

import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { TimetableMatrixSlot } from '../../utils/timetableDateUtils';
import { getSubjectIcon, renderSubjectIconBadge } from '../../config/subjectIcons';

export interface AssignWaitingSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  waitingSlot: TimetableMatrixSlot | null;
  matrixSlots: TimetableMatrixSlot[];
  onAssignSlot: (slot: TimetableMatrixSlot, targetDay: string, targetPeriod: number) => void;
  dayOptions?: string[];
  maxPeriods?: number;
}

const DEFAULT_DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

const PERIOD_TIMES: Record<number, string> = {
  1: '08:30 - 09:20',
  2: '09:20 - 10:10',
  3: '10:10 - 11:00',
  4: '11:00 - 11:50',
  5: '11:50 - 12:40 (พักกลางวัน)',
  6: '12:40 - 13:30',
  7: '13:30 - 14:20',
  8: '14:20 - 15:10',
};

export const AssignWaitingSlotModal: React.FC<AssignWaitingSlotModalProps> = ({
  isOpen,
  onClose,
  waitingSlot,
  matrixSlots,
  onAssignSlot,
  dayOptions = DEFAULT_DAYS,
  maxPeriods = 6,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('จันทร์');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);

  // คำนวณสถานะของแต่ละคาบในวันที่เลือก
  const periodSlotsStatus = useMemo(() => {
    const list: Array<{
      period: number;
      timeRange: string;
      isFree: boolean;
      isLunch: boolean;
      currentSubject?: string;
    }> = [];

    for (let p = 1; p <= maxPeriods; p++) {
      const isLunch = p === 5;
      const existing = matrixSlots.find((s) => s.day === selectedDay && s.period === p);
      const isFree = !existing || Boolean(existing.isFreePeriod) || !existing.subjectCode;

      list.push({
        period: p,
        timeRange: PERIOD_TIMES[p] || `คาบที่ ${p}`,
        isFree: isFree && !isLunch,
        isLunch,
        currentSubject: existing && !existing.isFreePeriod && existing.subjectCode ? existing.subjectCode : undefined,
      });
    }

    return list;
  }, [selectedDay, matrixSlots, maxPeriods]);

  // ตั้งค่าคาบเริ่มต้นให้อยู่ในคาบที่ว่าง
  React.useEffect(() => {
    if (isOpen) {
      const firstFree = periodSlotsStatus.find((p) => p.isFree);
      if (firstFree) {
        setSelectedPeriod(firstFree.period);
      }
    }
  }, [selectedDay, isOpen, periodSlotsStatus]);

  if (!isOpen || !waitingSlot) return null;

  const currentIcon = getSubjectIcon(waitingSlot.subjectCode, waitingSlot.subjectName);
  const selectedPeriodStatus = periodSlotsStatus.find((p) => p.period === selectedPeriod);
  const isSelectedPeriodFree = Boolean(selectedPeriodStatus?.isFree);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSelectedPeriodFree) {
      alert(`คาบที่ ${selectedPeriod} ในวัน${selectedDay} ไม่ว่าง กรุณาเลือกคาบว่างอื่น`);
      return;
    }
    onAssignSlot(waitingSlot, selectedDay, selectedPeriod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-sans select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-linear-to-r from-blue-50/70 via-white to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="shrink-0 scale-95">
              {renderSubjectIconBadge(currentIcon, 'md')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-600 text-white shadow-2xs">
                  {waitingSlot.subjectCode}
                </span>
                <span className="text-xs font-bold text-blue-900">
                  {waitingSlot.room}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                ลงตารางสอนจาก Waiting Pool
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Slot Metadata Card */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="text-blue-950 font-black">{waitingSlot.subjectName || waitingSlot.subjectCode}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200 shadow-2xs">
                {waitingSlot.totalPeriods || `${waitingSlot.credits} หน่วยกิต`}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              วิชานี้มีโควตาตามหลักสูตรที่เลือกใช้ สามารถเลือกวันและคาบว่างที่ต้องการลงในตารางสอนได้ทันที
            </p>
          </div>

          {/* Select Day */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>เลือกวันสอน</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {dayOptions.map((d) => {
                const isSelected = d === selectedDay;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Period */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>เลือกคาบเรียน (วัน{selectedDay})</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                สีเขียว = คาบว่างที่สามารถลงได้
              </span>
            </label>

            <div className="space-y-1.5">
              {periodSlotsStatus.map((p) => {
                const isSelected = selectedPeriod === p.period;

                if (p.isLunch) {
                  return (
                    <div
                      key={p.period}
                      className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between text-xs text-amber-900 opacity-80"
                    >
                      <span className="font-bold">คาบที่ {p.period} ({p.timeRange})</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-amber-300">
                        🍴 พักกลางวัน
                      </span>
                    </div>
                  );
                }

                if (!p.isFree) {
                  return (
                    <div
                      key={p.period}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 opacity-70"
                    >
                      <span className="font-medium">
                        คาบที่ {p.period} ({p.timeRange})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        ไม่ว่าง ({p.currentSubject})
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={p.period}
                    type="button"
                    onClick={() => setSelectedPeriod(p.period)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-2xs'
                        : 'bg-emerald-50/40 border-emerald-200 text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-emerald-500'}`} />
                      <span>คาบที่ {p.period} ({p.timeRange})</span>
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isSelected ? '✓ เลือกคาบนี้' : '+ คาบว่าง'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation summary */}
          {!isSelectedPeriodFree && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>กรุณาคลิกเลือกคาบว่าง (สีเขียว) เพื่อลงตารางสอน</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!isSelectedPeriodFree}
              className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 ${
                isSelectedPeriodFree
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>ยืนยันการลงตารางสอน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
