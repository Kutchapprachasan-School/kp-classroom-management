import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  ClipboardCopy,
  Check,
  Download,
  Sparkles
} from 'lucide-react';
import {
  generateSgsScoreExportRows,
  formatScoreColumnForClipboard,
  generateSgsCsvContent
} from '../../services/sgsImportExportService';

interface SgsScoreExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseCode: string;
  courseName: string;
  classroom: string;
  roster: Array<{
    sgsRowIndex?: number;
    sgsSeatNo?: number;
    studentCode: string;
    studentName: string;
    unit1Score?: number;
    unit2Score?: number;
    midtermScore?: number;
    finalScore?: number;
    totalScore?: number;
    grade?: string;
  }>;
}

export const SgsScoreExportModal: React.FC<SgsScoreExportModalProps> = ({
  isOpen,
  onClose,
  courseCode,
  courseName,
  classroom,
  roster
}) => {
  const [copiedColumn, setCopiedColumn] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportRows = generateSgsScoreExportRows(roster);

  const handleCopyColumn = (col: 'unit1' | 'unit2' | 'midterm' | 'final' | 'total', label: string) => {
    const text = formatScoreColumnForClipboard(exportRows, col);
    navigator.clipboard.writeText(text);
    setCopiedColumn(label);
    setTimeout(() => {
      setCopiedColumn(null);
    }, 2000);
  };

  const handleDownloadCsv = () => {
    const csvContent = generateSgsCsvContent(exportRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SGS_Score_${courseCode}_${classroom}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-prompt">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                ส่งออกคะแนนไปยัง SGS (Reverse Sync)
              </h3>
              <p className="text-xs text-slate-500">
                {courseCode} {courseName} • ห้อง {classroom} (รวม {exportRows.length} คน)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Method 1: 1-Click Clipboard Copy */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                วิธีที่ 1: คัดลอกคะแนนเพื่อวางในเว็บ SGS (1-Click Paste)
              </div>
              {copiedColumn && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-fadeIn">
                  <Check className="w-3.5 h-3.5" /> คัดลอก {copiedColumn} แล้ว!
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              คลิกปุ่มด้านล่างเพื่อคัดลอกคะแนนเฉพาะคอลัมน์ จากนั้นเปิดหน้าเว็บ SGS แล้วคลิกที่ช่องแรกของคอลัมน์นั้น แล้วกด <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono">Ctrl+V</kbd> เพื่อวางคะแนนทั้งหมดทันที
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleCopyColumn('unit1', 'คะแนนเก็บ 1')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 shadow-2xs transition-all cursor-pointer"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-blue-600" />
                คัดลอกคะแนนเก็บ 1
              </button>

              <button
                type="button"
                onClick={() => handleCopyColumn('unit2', 'คะแนนเก็บ 2')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 shadow-2xs transition-all cursor-pointer"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-blue-600" />
                คัดลอกคะแนนเก็บ 2
              </button>

              <button
                type="button"
                onClick={() => handleCopyColumn('midterm', 'คะแนนกลางภาค')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 shadow-2xs transition-all cursor-pointer"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-blue-600" />
                คัดลอกกลางภาค
              </button>

              <button
                type="button"
                onClick={() => handleCopyColumn('final', 'คะแนนปลายภาค')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 shadow-2xs transition-all cursor-pointer"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-blue-600" />
                คัดลอกปลายภาค
              </button>
            </div>
          </div>

          {/* Method 2: Download File */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                วิธีที่ 2: ดาวน์โหลดไฟล์ Excel / CSV รูปแบบ SGS
              </div>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลด CSV (UTF-8)
              </button>
            </div>
            <p className="text-xs text-slate-500">
              ไฟล์ที่ดาวน์โหลดจะคงลำดับแถว (Row Index) และเลขที่เดิมตามระบบ SGS 100% พร้อมรองรับการเปิดใน Excel ภาษาไทย
            </p>
          </div>

          {/* Alignment Preview Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700">
              ตัวอย่างลำดับแถวคะแนนที่จะส่งออก ({exportRows.length} รายการ):
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3 text-center w-14">แถว SGS</th>
                    <th className="py-2 px-3 text-center w-14">เลขที่</th>
                    <th className="py-2 px-3 w-24">รหัส</th>
                    <th className="py-2 px-3">ชื่อ-สกุล</th>
                    <th className="py-2 px-2 text-center">เก็บ 1</th>
                    <th className="py-2 px-2 text-center">เก็บ 2</th>
                    <th className="py-2 px-2 text-center">กลางภาค</th>
                    <th className="py-2 px-2 text-center">ปลายภาค</th>
                    <th className="py-2 px-2 text-center font-bold text-blue-700">รวม</th>
                    <th className="py-2 px-2 text-center">เกรด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exportRows.slice(0, 10).map((r) => (
                    <tr key={r.sgsRowIndex} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 text-center font-mono text-slate-400">#{r.sgsRowIndex}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700">{r.sgsSeatNo}</td>
                      <td className="py-1.5 px-3 font-mono text-blue-700">{r.studentCode}</td>
                      <td className="py-1.5 px-3 text-slate-800 font-medium">{r.studentName}</td>
                      <td className="py-1.5 px-2 text-center text-slate-600">{r.unit1Score}</td>
                      <td className="py-1.5 px-2 text-center text-slate-600">{r.unit2Score}</td>
                      <td className="py-1.5 px-2 text-center text-slate-600">{r.midtermScore}</td>
                      <td className="py-1.5 px-2 text-center text-slate-600">{r.finalScore}</td>
                      <td className="py-1.5 px-2 text-center font-bold text-blue-700">{r.totalScore}</td>
                      <td className="py-1.5 px-2 text-center font-bold text-emerald-600">{r.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {exportRows.length > 10 && (
              <p className="text-[11px] text-slate-400 text-center">
                ... แสดงตัวอย่าง 10 คนแรกจากทั้งหมด {exportRows.length} คน ...
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
