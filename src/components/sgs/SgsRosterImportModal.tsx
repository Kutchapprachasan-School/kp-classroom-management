import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardPaste,
  FileSpreadsheet,
  Globe,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Download,
  RotateCcw,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  parseSgsClipboardText,
  evaluateSgsImportDryRun,
  type SgsParsedRow,
  type SgsImportDryRunSummary,
  type ExistingStudentLookup
} from '../../services/sgsImportExportService';

interface SgsRosterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClassroom: string;
  existingStudents: ExistingStudentLookup[];
  onImportComplete: (confirmedRows: SgsParsedRow[]) => void;
}

export const SgsRosterImportModal: React.FC<SgsRosterImportModalProps> = ({
  isOpen,
  onClose,
  targetClassroom,
  existingStudents,
  onImportComplete
}) => {
  const [activeTab, setActiveTab] = useState<'clipboard' | 'file' | 'extension'>('clipboard');
  const [rawText, setRawText] = useState('');
  const [dryRunSummary, setDryRunSummary] = useState<SgsImportDryRunSummary | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'EXISTS' | 'CONFLICT' | 'INVALID'>('ALL');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [importMode, setImportMode] = useState<'MULTI_ROOM' | 'TARGET_ONLY'>('MULTI_ROOM');

  const handleReset = () => {
    setRawText('');
    setDryRunSummary(null);
    setSearchFilter('');
    setStatusFilter('ALL');
    setSelectedRoomFilter('ALL');
    setImportMode('MULTI_ROOM');
    setActiveTab('clipboard');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Reset all states whenever the modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleParseClipboard = () => {
    if (!rawText.trim()) return;
    const parsed = parseSgsClipboardText(rawText, targetClassroom);
    const summary = evaluateSgsImportDryRun(parsed, targetClassroom, existingStudents);
    setDryRunSummary(summary);
    if (summary.isMultiRoomFile) {
      setImportMode('MULTI_ROOM');
    } else {
      setImportMode('TARGET_ONLY');
    }
  };

  const handleLoadSample = () => {
    const sample = `เลขที่\tรหัสนักเรียน\tชื่อ-สกุล\tชั้น/ห้อง
1\t08451\tด.ช. ภัทรพล เจริญผล\t${targetClassroom}
2\t08452\tด.ช. ศุภชัย วิมลชาติ\t${targetClassroom}
4\t08454\tด.ญ. กัญญารัตน์ ศรีสุข\t${targetClassroom}
5\t08455\tด.ช. ชลธี ภาคภูมิ\t${targetClassroom}
6\t08456\tด.ญ. ณัฐริกา วงศ์สมบูรณ์\t${targetClassroom}`;
    setRawText(sample);
  };

  const handleActionChange = (rowIndex: number, action: 'IMPORT' | 'SKIP' | 'TRANSFER_ROOM') => {
    if (!dryRunSummary) return;
    const updatedRows = dryRunSummary.rows.map(r => {
      if (r.rowIndex === rowIndex) {
        return { ...r, selectedAction: action };
      }
      return r;
    });

    setDryRunSummary({
      ...dryRunSummary,
      rows: updatedRows
    });
  };

  const handleConfirmImport = () => {
    if (!dryRunSummary) return;
    const confirmed = dryRunSummary.rows
      .filter(r => r.selectedAction === 'IMPORT' || r.selectedAction === 'TRANSFER_ROOM')
      .map(r => {
        if (importMode === 'TARGET_ONLY') {
          return { ...r, classroom: targetClassroom };
        }
        return r;
      });
    onImportComplete(confirmed);
    handleClose();
  };

  const availableRooms = Array.from(
    new Set(dryRunSummary?.rows.map(r => r.classroom).filter(Boolean) as string[])
  ).sort();

  const filteredRows = dryRunSummary?.rows.filter(r => {
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchRoom = selectedRoomFilter === 'ALL' || r.classroom === selectedRoomFilter;
    const matchSearch =
      !searchFilter ||
      r.studentCode.includes(searchFilter) ||
      r.fullName.includes(searchFilter) ||
      (r.rawSeatNo && r.rawSeatNo.includes(searchFilter));
    return matchStatus && matchRoom && matchSearch;
  }) || [];

  const importableCount = dryRunSummary?.rows.filter(
    r => r.selectedAction === 'IMPORT' || r.selectedAction === 'TRANSFER_ROOM'
  ).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-prompt">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                นำเข้ารายชื่อนักเรียนจาก SGS / Excel
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  ห้อง {targetClassroom}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ระบบรักษาลำดับแถว (Row-Order Fidelity) 100% ป้องกันคะแนนสลับคนอย่างเด็ดขาด
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('clipboard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'clipboard'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            คัดลอกและวางข้อความ (Clipboard Paste)
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            อัปโหลดไฟล์ Excel / CSV
          </button>
          <button
            onClick={() => setActiveTab('extension')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'extension'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            ส่วนขยาย / Extension
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 1: CLIPBOARD PASTE */}
          {activeTab === 'clipboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  วางข้อความตารางที่คัดลอกมาจากหน้าเว็บ SGS หรือ Excel
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  โหลดข้อความตัวอย่าง
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={5}
                placeholder="วางข้อความที่นี่ (ระบบรองรับทั้ง Tab-delimited จากตาราง SGS, CSV, และข้อความเว้นวรรค โดยจะแยกเลขที่ รหัส คำนำหน้า และชื่อ-สกุลให้อัตโนมัติ)..."
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
              />
              <div className="flex items-center justify-between">
                <div>
                  {dryRunSummary && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      title="ล้างข้อมูลและเริ่มต้นใหม่"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>ล้างข้อมูล / เริ่มใหม่</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleParseClipboard}
                  disabled={!rawText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  ประมวลผลและแยกวิเคราะห์ข้อมูล
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-300 transition-all">
              <FileSpreadsheet className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">
                อัปโหลดไฟล์ Excel (.xlsx, .xls) หรือ CSV
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                รองรับไฟล์สมุดคะแนนและรายชื่อนักเรียนจากระบบ SGS โดยตรง (ทั้งไฟล์ .xls และ .xlsx) ระบบจะแปลงข้อมูลแบบ Binary ป้องกันตัวอักษรเพี้ยน 100%
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                id="sgs-file-input"
                disabled={isParsingFile}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setIsParsingFile(true);
                  try {
                    const fileName = file.name.toLowerCase();
                    let tsvText = '';

                    if (fileName.endsWith('.csv')) {
                      tsvText = await file.text();
                    } else {
                      // Binary Excel parsing via SheetJS (xlsx)
                      const arrayBuffer = await file.arrayBuffer();
                      const wb = XLSX.read(arrayBuffer, { type: 'array' });
                      if (!wb.SheetNames || wb.SheetNames.length === 0) {
                        throw new Error('ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel นี้');
                      }
                      const sheet = wb.Sheets[wb.SheetNames[0]];
                      tsvText = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
                    }

                    if (!tsvText.trim()) {
                      throw new Error('ไฟล์ว่างเปล่า ไม่มีข้อมูลนักเรียน');
                    }

                    setRawText(tsvText);
                    const parsed = parseSgsClipboardText(tsvText, targetClassroom);
                    const summary = evaluateSgsImportDryRun(parsed, targetClassroom, existingStudents);
                    setDryRunSummary(summary);
                    if (summary.isMultiRoomFile) {
                      setImportMode('MULTI_ROOM');
                    } else {
                      setImportMode('TARGET_ONLY');
                    }
                    setActiveTab('clipboard');
                  } catch (err: any) {
                    console.error('File parsing error:', err);
                    alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (err.message || 'โปรดตรวจสอบรูปแบบไฟล์'));
                  } finally {
                    setIsParsingFile(false);
                    e.target.value = '';
                  }
                }}
              />
              <div className="mt-4 flex items-center justify-center gap-2">
                <label
                  htmlFor="sgs-file-input"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer ${
                    isParsingFile ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {isParsingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังประมวลผลไฟล์ Excel...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>เลือกไฟล์ Excel/SGS จากเครื่อง</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: EXTENSION */}
          {activeTab === 'extension' && (
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-xs sm:text-sm">
                <Globe className="w-4 h-4" />
                เชื่อมต่อผ่าน SGS Helper Script / Extension
              </div>
              <p className="text-xs text-sky-700 leading-relaxed">
                ครูสามารถเปิดหน้าตารางคะแนนในระบบ SGS แล้วคลิก Bookmarklet หรือส่วนขยายเบราว์เซอร์ เพื่อส่งข้อมูลมายังหน้านี้ได้โดยไม่ต้องดาวน์โหลดไฟล์
              </p>
            </div>
          )}

          {/* DRY-RUN SUMMARY KPI CARDS */}
          {dryRunSummary && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
              {/* MULTI-ROOM / GRADE DETECTION BANNER */}
              {(dryRunSummary.isMultiRoomFile || dryRunSummary.targetClassroomMismatch) && (
                <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/40 border border-blue-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {dryRunSummary.isMultiRoomFile
                              ? `ตรวจพบไฟล์ SGS รวม ${dryRunSummary.detectedRooms.length} ห้องเรียน (${dryRunSummary.detectedRooms.join(', ')})`
                              : `ตรวจพบข้อมูลนักเรียน ${dryRunSummary.detectedRooms[0] || 'ห้องอื่น'}`}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            รวม {dryRunSummary.totalRows} คน
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {dryRunSummary.targetClassroomMismatch
                            ? `คุณกำลังดูห้อง ${targetClassroom} แต่ไฟล์นี้เป็นของ ${dryRunSummary.detectedGrade || 'ระดับชั้นอื่น'} (${dryRunSummary.detectedRooms.join(', ')})`
                            : `ระบบแยกแยะห้องเรียนและลำดับเลขที่ของแต่ละห้องให้อัตโนมัติ 100%`}
                        </p>
                      </div>
                    </div>

                    {/* Quick Room Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedRoomFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedRoomFilter === 'ALL'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        ทุกห้อง ({dryRunSummary.totalRows})
                      </button>
                      {dryRunSummary.detectedRooms.map((rm) => (
                        <button
                          key={rm}
                          type="button"
                          onClick={() => setSelectedRoomFilter(selectedRoomFilter === rm ? 'ALL' : rm)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedRoomFilter === rm
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50/60'
                          }`}
                        >
                          {rm} <span className="opacity-80">({dryRunSummary.roomStudentCounts[rm]} คน)</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <label
                      onClick={() => setImportMode('MULTI_ROOM')}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        importMode === 'MULTI_ROOM'
                          ? 'bg-white border-blue-500 ring-2 ring-blue-400/30 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'MULTI_ROOM'}
                        onChange={() => setImportMode('MULTI_ROOM')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>⚡ โหมดนำเข้าแยกห้องอัตโนมัติ (แนะนำ)</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {dryRunSummary.detectedRooms.length} ห้อง
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          จัดสรรนักเรียนเข้าห้องตามเอกสาร SGS โดยอัตโนมัติ (ห้องใดที่ยังไม่มีในระบบ จะถูกสร้างให้อัตโนมัติ)
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setImportMode('TARGET_ONLY')}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        importMode === 'TARGET_ONLY'
                          ? 'bg-white border-blue-500 ring-2 ring-blue-400/30 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'TARGET_ONLY'}
                        onChange={() => setImportMode('TARGET_ONLY')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          นำเข้าเฉพาะห้องปัจจุบัน ({targetClassroom})
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          บังคับนำเข้าข้อมูลทั้งหมดเข้าสู่ห้อง {targetClassroom} เพียงห้องเดียว
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setStatusFilter(statusFilter === 'NEW' ? 'ALL' : 'NEW')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'NEW'
                      ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-400'
                      : 'bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                    <span>นักเรียนใหม่</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-emerald-900 mt-1">
                    {dryRunSummary.newCount} <span className="text-xs font-normal">คน</span>
                  </div>
                </div>

                <div
                  onClick={() => setStatusFilter(statusFilter === 'EXISTS' ? 'ALL' : 'EXISTS')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'EXISTS'
                      ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400'
                      : 'bg-blue-50/60 border-blue-100 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
                    <span>มีในห้องนี้แล้ว</span>
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    {dryRunSummary.existsCount} <span className="text-xs font-normal">คน (ข้าม)</span>
                  </div>
                </div>

                <div
                  onClick={() => setStatusFilter(statusFilter === 'CONFLICT' ? 'ALL' : 'CONFLICT')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'CONFLICT'
                      ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400'
                      : 'bg-amber-50/60 border-amber-100 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
                    <span>ขัดแย้ง/ย้ายห้อง</span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-bold text-amber-900 mt-1">
                    {dryRunSummary.conflictCount} <span className="text-xs font-normal">คน</span>
                  </div>
                </div>

                <div
                  onClick={() => setStatusFilter(statusFilter === 'INVALID' ? 'ALL' : 'INVALID')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'INVALID'
                      ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-400'
                      : 'bg-rose-50/60 border-rose-100 hover:bg-rose-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
                    <span>ไม่สมบูรณ์</span>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-xl font-bold text-rose-900 mt-1">
                    {dryRunSummary.invalidCount} <span className="text-xs font-normal">คน</span>
                  </div>
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="ค้นหารหัส หรือชื่อ-สกุล..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white w-52 outline-hidden focus:border-blue-500"
                  />
                  {availableRooms.length > 1 && (
                    <select
                      value={selectedRoomFilter}
                      onChange={(e) => setSelectedRoomFilter(e.target.value)}
                      className="px-2.5 py-1.5 border border-blue-200 rounded-lg bg-blue-50/70 text-blue-800 font-semibold text-xs outline-hidden focus:border-blue-500 cursor-pointer"
                    >
                      <option value="ALL">ทุกห้องเรียน ({availableRooms.length} ห้อง)</option>
                      {availableRooms.map((room) => (
                        <option key={room} value={room}>
                          ห้อง {room}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">
                    แสดง {filteredRows.length} จาก {dryRunSummary.totalRows} รายการ
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200 text-[11px] font-bold"
                    title="ล้างข้อมูลการประมวลผลและนำเข้าใหม่"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ล้างข้อมูล</span>
                  </button>
                </div>
              </div>

              {/* PREVIEW TABLE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-16 text-center">แถว SGS</th>
                        <th className="py-2.5 px-3 w-16 text-center">เลขที่</th>
                        <th className="py-2.5 px-3 w-28">รหัสนักเรียน</th>
                        <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                        <th className="py-2.5 px-3 w-20 text-center">เพศ</th>
                        <th className="py-2.5 px-3 w-36">สถานะตรวจสอบ</th>
                        <th className="py-2.5 px-3 w-36 text-center">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            row.status === 'CONFLICT' ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center font-mono text-slate-500">
                            #{row.rowIndex}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-700">
                            {row.parsedSeatNo ?? '-'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">
                            {row.studentCode}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {row.fullName}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.gender === 'MALE'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {row.gender === 'MALE' ? 'ชาย' : 'หญิง'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {row.status === 'NEW' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✨ รายชื่อใหม่
                              </span>
                            )}
                            {row.status === 'EXISTS' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                ✓ มีในห้องแล้ว
                              </span>
                            )}
                            {row.status === 'CONFLICT' && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"
                                title={row.conflictReason}
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                {row.conflictReason || 'พบในห้องอื่น'}
                              </span>
                            )}
                            {row.status === 'INVALID' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                ❌ ข้อมูลไม่ครบ
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.status === 'CONFLICT' ? (
                              <select
                                value={row.selectedAction}
                                onChange={(e) =>
                                  handleActionChange(row.rowIndex, e.target.value as any)
                                }
                                className="px-2 py-1 text-[11px] font-semibold border border-amber-300 bg-white rounded-lg text-amber-900"
                              >
                                <option value="TRANSFER_ROOM">โอนย้ายห้อง</option>
                                <option value="SKIP">ข้าม</option>
                              </select>
                            ) : row.status === 'EXISTS' ? (
                              <span className="text-[11px] text-slate-400 font-medium">ข้ามอัตโนมัติ</span>
                            ) : row.status === 'INVALID' ? (
                              <span className="text-[11px] text-rose-500 font-medium">ไม่นำเข้า</span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-bold">นำเข้า</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="text-xs text-slate-500 font-medium">
            {dryRunSummary && (
              <span>
                พร้อมนำเข้า <b className="text-blue-600">{importableCount}</b> คน (ข้าม{' '}
                {dryRunSummary.existsCount + dryRunSummary.invalidCount} คน)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!dryRunSummary || importableCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {importMode === 'MULTI_ROOM' && dryRunSummary?.isMultiRoomFile
                ? `⚡ นำเข้าแยก ${dryRunSummary.detectedRooms.length} ห้อง (${importableCount} คน)`
                : `ยืนยันนำเข้าห้อง ${targetClassroom} (${importableCount} คน)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
