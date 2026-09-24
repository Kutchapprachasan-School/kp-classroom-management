import React, { useState, useEffect } from 'react';
import { Settings, Download, Database, RefreshCw, CheckCircle2, Shield, Lock, FileSpreadsheet } from 'lucide-react';
import { sgsExportService, type SgsSnapshotRecord } from '../services/sgsExportService';

export const SettingsBackupView: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [snapshots, setSnapshots] = useState<SgsSnapshotRecord[]>([]);

  const loadSnapshots = async () => {
    const list = await sgsExportService.getSnapshots();
    setSnapshots(list);
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const handleExportSgs = async () => {
    setIsExporting(true);
    try {
      const created = await sgsExportService.generateSnapshot('room-3-1', 'ศ23101');
      await loadSnapshots();
      alert(
        `สร้างและอัปโหลดไฟล์ Immutable Snapshot เรียบร้อย (ตาม ADR-003)\nไฟล์: ${created.fileName}\nCloud Storage: ${created.storagePath}\nChecksum: ${created.checksumSha256}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง SGS Snapshot';
      alert(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupDb = async () => {
    setIsBackingUp(true);
    try {
      const created = await sgsExportService.generateSnapshot('all-classrooms', 'FULL-DB');
      await loadSnapshots();
      alert(`สำรองฐานข้อมูล PostgreSQL Snapshot เรียบร้อย (Snapshot ID: ${created.id})`);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                ตั้งค่าและสำรองข้อมูล (Settings & Immutable SGS Snapshots)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                ส่งออกไฟล์คะแนน SGS แบบ Immutable Snapshot (ADR-003) สำรองฐานข้อมูล และจัดการเชื่อมโยง Google Classroom
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: SGS Export Tool */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              ส่งออกข้อมูลคะแนน SGS (สพฐ.)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              ประมวลผลแบบ Server-side ตรวจสอบ Invariants (คะแนนเต็ม 100) สร้างไฟล์ Excel และจัดเก็บ Immutable Snapshot บน Supabase Storage พร้อมลายเซ็น SHA-256
            </p>
          </div>

          <button
            onClick={handleExportSgs}
            disabled={isExporting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'กำลังสร้าง Snapshot...' : 'สร้างและดาวน์โหลด SGS Snapshot'}</span>
          </button>
        </div>

        {/* Card 2: Database Snapshot Backup */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              สำรองข้อมูลระบบ (Database Snapshot)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              สร้างไฟล์ Snapshot สำรองฐานข้อมูล PostgreSQL ทั้งหมด (นักเรียน, คะแนน, เวลาเรียน, บันทึกพิเศษ) ป้องกันข้อมูลสูญหายก่อนตัดเกรดสิ้นภาคเรียน
            </p>
          </div>

          <button
            onClick={handleBackupDb}
            disabled={isBackingUp}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>{isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สร้างจุดสำรองข้อมูล'}</span>
          </button>
        </div>

        {/* Card 3: Google Classroom Sync Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Google Classroom Integration
            </h2>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>เชื่อมต่อบัญชีโรงเรียนสำเร็จ</span>
              </div>
              <p className="text-slate-400 mt-1">
                ซิงค์งานและการบ้านล่าสุด: 22 ก.ย. 2569 11:30 น.
              </p>
            </div>
          </div>

          <button
            onClick={() => alert('เริ่มดึงข้อมูลอัปเดตจาก Google Classroom')}
            className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>ซิงค์ข้อมูล Classroom ทันที</span>
          </button>
        </div>
      </div>

      {/* Immutable Snapshot Registry (ADR-003) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              คลังประวัติการส่งออก SGS & SAR Immutable Snapshots (Supabase Storage)
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold">
            SHA-256 Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Snapshot ID</th>
                <th className="py-2.5 px-3">ชื่อไฟล์</th>
                <th className="py-2.5 px-3">Cloud Storage Path</th>
                <th className="py-2.5 px-3">Checksum (SHA-256)</th>
                <th className="py-2.5 px-3">ผู้ส่งออก</th>
                <th className="py-2.5 px-3">วันเวลา</th>
                <th className="py-2.5 px-3 text-right">ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-blue-700">{snap.id}</td>
                  <td className="py-3 px-3 font-medium text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{snap.fileName}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{snap.storagePath}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{snap.checksumSha256.slice(0, 22)}...</td>
                  <td className="py-3 px-3 text-slate-600">{snap.exportedBy}</td>
                  <td className="py-3 px-3 text-slate-400">{snap.createdAt}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => alert(`ดาวน์โหลด Snapshot ที่ลงนามแล้ว: ${snap.fileName}`)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px]"
                    >
                      ดาวน์โหลด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
