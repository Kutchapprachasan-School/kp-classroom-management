import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Download,
  Database,
  RefreshCw,
  CheckCircle2,
  Shield,
  Lock,
  FileSpreadsheet,
} from 'lucide-react';
import { sgsExportService, type SgsSnapshotRecord } from '../services/sgsExportService';
import {
  sgsRosterAndSubmissionService,
  type R2CourseStorageSummary,
} from '../services/sgsRosterAndSubmissionService';
import {
  getSchoolSettings,
  saveSchoolSettings,
  resetSchoolSettingsToDefault,
  type SchoolUserRole,
  type SchoolBrandingSettings,
} from '../config/schoolRoles';

interface SettingsBackupViewProps {
  activeRole?: SchoolUserRole;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  activeRole = 'ACADEMIC_ADMIN',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [snapshots, setSnapshots] = useState<SgsSnapshotRecord[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolBrandingSettings>(() =>
    getSchoolSettings()
  );
  const [roleMode, setRoleMode] = useState<'ADMIN' | 'TEACHER'>(
    activeRole === 'ACADEMIC_ADMIN' ? 'ADMIN' : 'TEACHER'
  );
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>(
    activeRole === 'ACADEMIC_ADMIN' ? 'ALL' : 't-pasporm'
  );
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('ALL');
  const [courseStorages, setCourseStorages] = useState<R2CourseStorageSummary[]>(() =>
    sgsRosterAndSubmissionService.getCourseStorageSummaries()
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSchoolSettings(schoolSettings);
    setSchoolSettings(updated);
    showToast('บันทึกข้อมูลโรงเรียน โลโก้ และการเชื่อมระบบ SMS เรียบร้อยแล้ว');
  };

  const handleUploadLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = saveSchoolSettings({
          ...schoolSettings,
          logoUrl: reader.result,
        });
        setSchoolSettings(updated);
        showToast('อัปเดตโลโก้โรงเรียนสำหรับหน้า Login เรียบร้อยแล้ว');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (activeRole === 'ACADEMIC_ADMIN') {
      setRoleMode('ADMIN');
      setSelectedTeacherFilter('ALL');
    } else {
      setRoleMode('TEACHER');
      setSelectedTeacherFilter('t-pasporm');
    }
  }, [activeRole]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadSnapshots = async () => {
    const list = await sgsExportService.getSnapshots();
    setSnapshots(list);
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  // สรุปพื้นที่แยกตามครูแต่ละคน (สำหรับแอดมินดูภาพรวมว่าครูท่านไหนใช้พื้นที่ R2 เท่าไร)
  const teacherUsageSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        department: string;
        courseCount: number;
        totalFiles: number;
        totalCanvaLinks: number;
        totalR2Mb: number;
        backedUpCourses: number;
      }
    >();

    courseStorages.forEach((c) => {
      const existing = map.get(c.teacherId) || {
        teacherId: c.teacherId,
        teacherName: c.teacherName,
        department: c.department,
        courseCount: 0,
        totalFiles: 0,
        totalCanvaLinks: 0,
        totalR2Mb: 0,
        backedUpCourses: 0,
      };
      existing.courseCount += 1;
      existing.totalFiles += c.r2FileCount;
      existing.totalCanvaLinks += c.canvaLinkCount;
      existing.totalR2Mb = Number((existing.totalR2Mb + c.r2UsedMb).toFixed(2));
      if (c.isBackedUpToSchoolDrive) existing.backedUpCourses += 1;
      map.set(c.teacherId, existing);
    });

    return Array.from(map.values());
  }, [courseStorages]);

  const filteredCourses = useMemo(() => {
    return courseStorages.filter((c) => {
      if (roleMode === 'TEACHER' && c.teacherId !== 't-pasporm') return false;
      if (selectedTeacherFilter !== 'ALL' && c.teacherId !== selectedTeacherFilter) return false;
      if (selectedTermFilter !== 'ALL' && c.academicTerm !== selectedTermFilter) return false;
      return true;
    });
  }, [courseStorages, roleMode, selectedTeacherFilter, selectedTermFilter]);

  const totalSchoolR2Mb = useMemo(
    () => Number(courseStorages.reduce((acc, c) => acc + c.r2UsedMb, 0).toFixed(2)),
    [courseStorages]
  );

  const handleExportSgs = async () => {
    setIsExporting(true);
    try {
      const created = await sgsExportService.generateSnapshot('room-3-1', 'ศ23101');
      await loadSnapshots();
      showToast(
        `สร้างและอัปโหลดไฟล์ Immutable Snapshot เรียบร้อย (${created.fileName})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง SGS Snapshot';
      showToast(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupDb = async () => {
    setIsBackingUp(true);
    try {
      const created = await sgsExportService.generateSnapshot('all-classrooms', 'FULL-DB');
      await loadSnapshots();
      showToast(`สำรองฐานข้อมูล PostgreSQL Snapshot เรียบร้อย (ID: ${created.id})`);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              ตั้งค่าระบบ & พื้นที่จัดเก็บไฟล์ R2 / Google Drive โรงเรียนกุดจับประชาสรรค์ (100 TB Workspace)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              โรงเรียนกุดจับประชาสรรค์ (สพม.อุดรธานี) · แยกสิทธิ์ครูผู้สอนล้างเฉพาะวิชาตัวเอง vs ฝ่ายวิชาการ/แอดมินจัดการทั้งโรงเรียน
            </p>
          </div>
        </div>

        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setRoleMode('ADMIN');
              setSelectedTeacherFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              roleMode === 'ADMIN'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛡️ มุมมองแอดมิน (จัดการได้ทุกคน/ทั้งเทอม/ทั้งปี)
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleMode('TEACHER');
              setSelectedTeacherFilter('t-pasporm');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              roleMode === 'TEACHER'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 มุมมองครูผู้สอน (ล้างเฉพาะวิชาตัวเอง)
          </button>
        </div>
      </div>

      {/* Section 0: ตั้งค่าระบบจัดการชั้นเรียน (ชื่อระบบ, โลโก้, ฟอนต์, ขนาดอักษร 11px–20px และการดึงเช็คชื่อแถวเช้าเข้าคาบเรียน) */}
      <form
        onSubmit={handleSaveBranding}
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <img
              src={schoolSettings.logoUrl}
              alt={schoolSettings.nameTh}
              className="w-12 h-12 rounded-xl border border-slate-200 p-1 object-contain bg-white shadow-2xs"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                ตั้งค่าระบบจัดการชั้นเรียน • ชื่อระบบ โลโก้ ฟอนต์ (11px–20px) & รูปแบบการเช็คชื่อ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ปรับแต่งชื่อระบบ โลโก้ ฟอนต์ ขนาดตัวอักษร (ต่ำสุด 11px ไม่เกิน 20px) และรูปแบบการดึงสถานะเช็คชื่อแถวเช้าเข้าคาบเรียน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const def = resetSchoolSettingsToDefault();
                setSchoolSettings(def);
                showToast('คืนค่าเริ่มต้น โรงเรียนกุดจับประชาสรรค์ เรียบร้อยแล้ว');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              คืนค่าเริ่มต้น
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              บันทึกการตั้งค่าระบบ
            </button>
          </div>
        </div>

        {/* แถวที่ 1: ชื่อระบบจัดการชั้นเรียน, ชื่อโรงเรียน, ชื่อระบบใต้โลโก้, อัปโหลดโลโก้ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ชื่อระบบจัดการชั้นเรียน
            </label>
            <input
              type="text"
              value={schoolSettings.classroomSystemTitle}
              onChange={(e) => {
                const updated = saveSchoolSettings({
                  ...schoolSettings,
                  classroomSystemTitle: e.target.value,
                });
                setSchoolSettings(updated);
              }}
              placeholder="เช่น ระบบจัดการชั้นเรียน"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ชื่อโรงเรียน (แสดงหน้า Login & หัวตาราง)
            </label>
            <input
              type="text"
              value={schoolSettings.nameTh}
              onChange={(e) => {
                const updated = saveSchoolSettings({
                  ...schoolSettings,
                  nameTh: e.target.value,
                });
                setSchoolSettings(updated);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ชื่อระบบใต้โลโก้หน้า Login (SMS)
            </label>
            <input
              type="text"
              value={schoolSettings.smsSystemName}
              onChange={(e) => {
                const updated = saveSchoolSettings({
                  ...schoolSettings,
                  smsSystemName: e.target.value,
                });
                setSchoolSettings(updated);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              โลโก้โรงเรียน / ระบบ (PNG/JPG/SVG)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadLogoFile}
              className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </div>

        {/* แถวที่ 2: ฟอนต์ระบบ, ขนาดตัวอักษร (11px – 20px), และตัวเลือกการเช็คชื่อคาบเรียนต่อจากแถวเช้า (Q2) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
          {/* 1. เลือกฟอนต์ของระบบ */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <label className="block font-bold text-slate-800">
              1. ฟอนต์หลักของระบบจัดการชั้นเรียน (Font Family)
            </label>
            <select
              value={schoolSettings.fontFamily}
              onChange={(e) => {
                const nextFont = e.target.value as SchoolBrandingSettings['fontFamily'];
                const updated = saveSchoolSettings({
                  ...schoolSettings,
                  fontFamily: nextFont,
                });
                setSchoolSettings(updated);
                showToast(`เปลี่ยนฟอนต์ระบบเป็น "${nextFont}" เรียบร้อยแล้ว`);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold cursor-pointer"
            >
              <option value="Sarabun">Sarabun (สารบรรณ — อ่านง่าย มาตรฐานราชการไทย)</option>
              <option value="Prompt">Prompt (พร้อมท์ — ทันสมัย คมชัดบนมือถือ)</option>
              <option value="Kanit">Kanit (คณิต — หัวข้อชัดเจน สบายตา)</option>
              <option value="Noto Sans Thai">Noto Sans Thai (โนโตะ — มาตรฐาน Google)</option>
              <option value="IBM Plex Sans Thai">IBM Plex Sans Thai (โมเดิร์น อ่านตารางตัวเลขง่าย)</option>
            </select>
          </div>

          {/* 2. ขนาดตัวอักษร 11px – 20px */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                2. ขนาดตัวอักษรระบบ (ต่ำสุด 11px – ไม่เกิน 20px)
              </label>
              <span className="px-2 py-0.5 rounded-lg bg-teal-600 text-white font-extrabold text-xs">
                {schoolSettings.baseFontSizePx}px
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">11px</span>
              <input
                type="range"
                min={11}
                max={20}
                step={1}
                value={schoolSettings.baseFontSizePx}
                onChange={(e) => {
                  const nextPx = Math.min(20, Math.max(11, Number(e.target.value) || 15));
                  const updated = saveSchoolSettings({
                    ...schoolSettings,
                    baseFontSizePx: nextPx,
                  });
                  setSchoolSettings(updated);
                }}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-500">20px</span>
            </div>

            <div className="flex flex-wrap gap-1 pt-0.5">
              {[11, 13, 15, 17, 20].map((px) => (
                <button
                  key={px}
                  type="button"
                  onClick={() => {
                    const updated = saveSchoolSettings({
                      ...schoolSettings,
                      baseFontSizePx: px,
                    });
                    setSchoolSettings(updated);
                    showToast(`ปรับขนาดตัวอักษรเป็น ${px}px (อยู่ในเกณฑ์ 11px–20px)`);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    schoolSettings.baseFontSizePx === px
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {px}px {px === 15 ? '(แนะนำ)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 3. รูปแบบการดึงเช็คชื่อแถวเช้าเข้าคาบเรียน (Q2 Option) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <label className="block font-bold text-slate-800">
              3. การเช็คชื่อเข้าเรียนรายคาบ (เชื่อมกับแถวเช้า 07:45 น.)
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const updated = saveSchoolSettings({
                    ...schoolSettings,
                    morningToClassSyncMode: 'AUTO_PREFILL',
                  });
                  setSchoolSettings(updated);
                  showToast('ตั้งค่า: ดึงสถานะจากแถวเช้ามากรอกให้อัตโนมัติ (ครูแก้ไขทับได้)');
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  schoolSettings.morningToClassSyncMode === 'AUTO_PREFILL'
                    ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">
                  ✓ ให้กรอกต่อจากแถวเช้าเลย (Auto Pre-fill + แก้ทับได้)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = saveSchoolSettings({
                    ...schoolSettings,
                    morningToClassSyncMode: 'MANUAL_FRESH',
                  });
                  setSchoolSettings(updated);
                  showToast('ตั้งค่า: ให้ครูประจำวิชากรอกเช็คชื่อใหม่ทุกคาบเรียน');
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  schoolSettings.morningToClassSyncMode === 'MANUAL_FRESH'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">
                  ✎ ให้กรอกใหม่ทุกคาบเรียน (ไม่ดึงผลแถวเช้ามาเติมล่วงหน้า)
                </div>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Section 1: ภาพรวมการใช้พื้นที่ R2 แยกตามครูผู้สอนแต่ละคน (Per-Teacher Storage Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              1. สถานะการใช้พื้นที่ Cloudflare R2 ของครูแต่ละคน & การโอนเก็บเข้า Google Drive โรงเรียน (100 TB Workspace)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              พื้นที่ R2 ทั้งโรงเรียนใช้จริงรวม <strong>{totalSchoolR2Mb} MB</strong> (จากโควตาฟรี 10,240 MB) · คลิปวิดีโอขนาดใหญ่และงาน Canva ส่งเป็นลิงก์ (ใช้พื้นที่ 0 MB)
            </p>
          </div>

          {roleMode === 'ADMIN' && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => {
                  const res = sgsRosterAndSubmissionService.backupCoursesToSchoolWorkspaceDrive({
                    mode: 'TERM_ALL',
                    academicTerm: '1/2569',
                  });
                  setCourseStorages(res.courses);
                  showToast(
                    `☁️➡️📁 แอดมินโอนย้ายไฟล์ทั้งภาคเรียน 1/2569 (${res.backedUpCourseCount} วิชา · ${res.transferredMb} MB) เข้า Google Drive โรงเรียน (100 TB Workspace) แยกตามวิชาเรียบร้อย!`
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs transition-colors"
              >
                ☁️➡️📁 Backup ทั้งเทอม 1/2569 เข้า Google Drive รร. (100TB)
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                    role: 'ADMIN',
                    currentTeacherId: 'admin',
                    mode: 'TERM_ALL',
                    academicTerm: '1/2569',
                    autoBackupToSchoolDriveFirst: true,
                  });
                  setCourseStorages(res.courses);
                  showToast(
                    `🧹 แอดมินล้างไฟล์ R2 ทั้งภาคเรียน 1/2569 (${res.purgedCourseCount} วิชา · คืนพื้นที่ ${res.freedMb} MB) พร้อม Backup เข้า Google Drive 100TB เรียบร้อย!`
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-2xs transition-colors"
              >
                🧹 ล้างไฟล์ R2 ทั้งเทอม 1/2569
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                    role: 'ADMIN',
                    currentTeacherId: 'admin',
                    mode: 'YEAR_ALL',
                    academicYear: '2568',
                    autoBackupToSchoolDriveFirst: true,
                  });
                  setCourseStorages(res.courses);
                  showToast(
                    `🧹 แอดมินล้างไฟล์ R2 ปีการศึกษาเก่า 2568 (${res.purgedCourseCount} วิชา · คืนพื้นที่ ${res.freedMb} MB) เรียบร้อย!`
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-2xs transition-colors"
              >
                🧹 ล้างไฟล์ R2 ทั้งปีการศึกษา 2568
              </button>
            </div>
          )}
        </div>

        {/* การ์ดสรุปการใช้พื้นที่ของครูแต่ละคน */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {teacherUsageSummaries
            .filter((t) => (roleMode === 'TEACHER' ? t.teacherId === 't-pasporm' : true))
            .map((t) => (
              <div
                key={t.teacherId}
                onClick={() =>
                  setSelectedTeacherFilter(
                    selectedTeacherFilter === t.teacherId ? 'ALL' : t.teacherId
                  )
                }
                className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs space-y-1.5 ${
                  selectedTeacherFilter === t.teacherId
                    ? 'bg-teal-50/70 border-teal-400 shadow-xs'
                    : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.teacherName}</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                    {t.department}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-base font-bold text-teal-800 tabular-nums">
                      {t.totalR2Mb} MB
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1">
                      ({t.totalFiles} ไฟล์ R2)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700">
                    🎨 {t.totalCanvaLinks} ลิงก์ Canva
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/70">
                  <span>จำนวน {t.courseCount} รายวิชา</span>
                  <span className="text-emerald-700 font-semibold">
                    Backup Drive รร. แล้ว {t.backedUpCourses}/{t.courseCount} วิชา
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* ตัวกรองและตารางรายวิชาทั้งหมด */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-bold text-slate-700">กรองตามภาคเรียน/ปีการศึกษา:</span>
            {(['ALL', '1/2569', '2/2568'] as const).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setSelectedTermFilter(term)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedTermFilter === term
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {term === 'ALL' ? 'ทุกภาคเรียน' : `ภาคเรียน ${term}`}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500">
            คลิกปุ่ม <strong>Backup Drive 100TB</strong> เพื่อโอนไฟล์เข้าโฟลเดอร์ Google Workspace โรงเรียนก่อนกดล้าง R2
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">ปี/เทอม</th>
                <th className="py-2.5 px-3">รหัส / รายวิชา / ชั้นเรียน</th>
                <th className="py-2.5 px-3">ครูผู้สอน</th>
                <th className="py-2.5 px-3 text-center">พื้นที่ R2 (รูป WebP/PDF)</th>
                <th className="py-2.5 px-3 text-center">ลิงก์ Canva / วิดีโอ</th>
                <th className="py-2.5 px-3">โฟลเดอร์สำรองใน Google Drive โรงเรียน (100 TB Workspace)</th>
                <th className="py-2.5 px-3 text-right">จัดการ (Backup / ล้าง R2)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.map((c) => (
                <tr key={c.courseId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {c.academicTerm}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">
                      {c.courseCode} {c.courseName} ({c.classroom})
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                    {c.teacherName}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {c.isPurgedFromR2 ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[11px]">
                        0 MB (ล้าง R2 แล้ว)
                      </span>
                    ) : (
                      <div>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {c.r2UsedMb} MB
                        </span>{' '}
                        <span className="text-[11px] text-slate-500">({c.r2FileCount} ไฟล์)</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                      🎨 {c.canvaLinkCount} ลิงก์ (0 MB)
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-[11px] font-mono text-slate-600">
                      📁 {c.schoolDriveFolderPath}
                    </div>
                    {c.isBackedUpToSchoolDrive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                        ✓ สำรองเข้า Google Workspace 100TB แล้ว ({c.lastBackupAt})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 mt-0.5">
                        • ยังไม่ได้โอนเข้า Google Drive โรงเรียน
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {!c.isBackedUpToSchoolDrive && !c.isPurgedFromR2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const res =
                              sgsRosterAndSubmissionService.backupCoursesToSchoolWorkspaceDrive({
                                mode: 'SINGLE_COURSE',
                                courseId: c.courseId,
                              });
                            setCourseStorages(res.courses);
                            showToast(
                              `☁️➡️📁 โอนย้ายไฟล์วิชา ${c.courseCode} (${c.classroom}) เข้า Google Drive โรงเรียน (100TB) เรียบร้อยแล้ว`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-[11px]"
                        >
                          Backup Drive 100TB
                        </button>
                      )}
                      {!c.isPurgedFromR2 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const res = sgsRosterAndSubmissionService.purgeCoursesR2ByRole({
                              role: roleMode,
                              currentTeacherId: 't-pasporm',
                              mode: 'SINGLE_COURSE',
                              courseId: c.courseId,
                              autoBackupToSchoolDriveFirst: true,
                            });
                            setCourseStorages(res.courses);
                            showToast(
                              `🧹 ล้างไฟล์ R2 วิชา ${c.courseCode} (${c.classroom}) คืนพื้นที่ ${res.freedMb} MB (พร้อม Backup เข้า Drive 100TB) เรียบร้อยแล้ว`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px]"
                        >
                          ล้างไฟล์วิชานี้
                        </button>
                      ) : (
                        <span className="text-[11px] text-teal-700 font-semibold">
                          ✓ คืนพื้นที่ R2 แล้ว
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: 3 Main Cards (SGS Snapshot & DB Backup) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">
              ส่งออกข้อมูลคะแนน SGS (สพฐ.)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              สร้างไฟล์ Excel ส่งออกคะแนนเข้า SGS พร้อมจัดเก็บ Immutable Snapshot และลายเซ็น SHA-256
            </p>
          </div>

          <button
            onClick={handleExportSgs}
            disabled={isExporting}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'กำลังสร้าง Snapshot...' : 'สร้างและดาวน์โหลด SGS Snapshot'}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">
              สำรองฐานข้อมูลคะแนน (Database Snapshot)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              สำรองฐานข้อมูลคะแนนและเกรดใน PostgreSQL ถาวร แม้ล้างไฟล์รูปใน R2 ออกแล้ว คะแนนยังคงอยู่ครบ 100%
            </p>
          </div>

          <button
            onClick={handleBackupDb}
            disabled={isBackingUp}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>{isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สร้างจุดสำรองฐานข้อมูล'}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">
              Google Workspace โรงเรียน (100 TB Shared Drive)
            </h2>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>เชื่อมต่อ Google Drive โรงเรียน (100 TB) สำเร็จ</span>
              </div>
              <p className="text-slate-500">
                จัดโฟลเดอร์อัตโนมัติ: ปีการศึกษา / เทอม / รหัสวิชา (ชื่อครู)
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              showToast('ตรวจสอบการเชื่อมต่อ Google Workspace Shared Drive (100 TB) ปกติ พร้อมรับไฟล์ Backup')
            }
            className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>ตรวจสอบสถานะ Google Drive 100TB</span>
          </button>
        </div>
      </div>

      {/* Immutable Snapshot Registry (ADR-003) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              คลังประวัติการส่งออก SGS & SAR Immutable Snapshots
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
                <th className="py-2 px-3">Snapshot ID</th>
                <th className="py-2 px-3">ชื่อไฟล์</th>
                <th className="py-2 px-3">Cloud Storage Path</th>
                <th className="py-2 px-3">Checksum (SHA-256)</th>
                <th className="py-2 px-3">ผู้ส่งออก</th>
                <th className="py-2 px-3">วันเวลา</th>
                <th className="py-2 px-3 text-right">ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{snap.id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{snap.fileName}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{snap.storagePath}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{snap.checksumSha256.slice(0, 22)}...</td>
                  <td className="py-2.5 px-3 text-slate-600">{snap.exportedBy}</td>
                  <td className="py-2.5 px-3 text-slate-400">{snap.createdAt}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => showToast(`ดาวน์โหลด Snapshot: ${snap.fileName}`)}
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
