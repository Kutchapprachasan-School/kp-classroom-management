import React, { useState } from 'react';
import { Calendar, Plus, CheckCircle2, Archive } from 'lucide-react';

export const AcademicTermsView: React.FC = () => {
  const [terms] = useState([
    { id: 't-2569-1', year: 2569, term: 'ภาคเรียนที่ 1', isActive: true, studentCount: 525, classCount: 12, startDate: '15 พ.ค. 2569', endDate: '2 ต.ค. 2569' },
    { id: 't-2568-2', year: 2568, term: 'ภาคเรียนที่ 2', isActive: false, studentCount: 518, classCount: 12, startDate: '1 พ.ย. 2568', endDate: '15 มี.ค. 2569' },
    { id: 't-2568-1', year: 2568, term: 'ภาคเรียนที่ 1', isActive: false, studentCount: 520, classCount: 12, startDate: '15 พ.ค. 2568', endDate: '30 ก.ย. 2568' },
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                ปีการศึกษาและภาคเรียน (Academic Terms)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                จัดการปี พ.ศ. ภาคเรียนที่เปิดสอน สลับภาคเรียนปัจจุบัน และจัดเก็บประวัติ (Archival)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => alert('เปิดหน้าต่างสร้างภาคเรียนใหม่')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ สร้างปีการศึกษา/ภาคเรียนใหม่</span>
        </button>
      </div>

      {/* Terms List Cards */}
      <div className="space-y-3">
        {terms.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.isActive ? 'border-l-4 border-l-emerald-500 border-slate-200' : 'border-slate-200/80'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-base">
                  {item.term} / {item.year}
                </span>
                {item.isActive ? (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ภาคเรียนปัจจุบัน (Active)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium flex items-center gap-1">
                    <Archive className="w-3 h-3 text-slate-400" />
                    จัดเก็บประวัติแล้ว
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                ช่วงเวลา: {item.startDate} – {item.endDate} • นักเรียน {item.studentCount} คน • {item.classCount} ห้องเรียน
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
              {!item.isActive && (
                <button
                  onClick={() => alert(`สลับเป็นภาคเรียน ${item.term}/${item.year}`)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  สลับใช้งาน
                </button>
              )}
              <button
                onClick={() => alert(`ดูข้อมูลสรุปภาคเรียน ${item.term}/${item.year}`)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold transition-colors"
              >
                ดูข้อมูลประวัติ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
