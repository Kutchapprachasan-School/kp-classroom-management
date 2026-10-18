import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Layers,
  FileText,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ClipboardList,
  History,
  BookOpen,
  X,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { trashService, TRASH_SYNC_EVENT } from '../services/trashService';
import {
  activityAuditLogService,
  AUDIT_LOG_SYNC_EVENT,
  type AuditLogEntry,
  type AuditEntityType,
} from '../services/activityAuditLogService';
import type { SoftDeletedItem } from '../types/viewModels';

type MainViewMode = 'TRASH' | 'AUDIT_LOG';
type TrashCategoryTab = 'ALL' | 'CLASSROOM' | 'ASSIGNMENT' | 'STUDENT' | 'EXAM';
type AuditActionFilter = 'ALL' | 'DELETE' | 'UPDATE' | 'BATCH';

export const TrashManagementView: React.FC = () => {
  const [viewMode, setViewMode] = useState<MainViewMode>('TRASH');
  const [items, setItems] = useState<SoftDeletedItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TrashCategoryTab>('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState<AuditActionFilter>('ALL');
  const [auditEntityFilter, setAuditEntityFilter] = useState<AuditEntityType | 'ALL'>('ALL');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<AuditLogEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadTrash = async () => {
    setIsLoading(true);
    try {
      const data = await trashService.getAll();
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = () => {
    setAuditLogs(activityAuditLogService.getLogs());
  };

  useEffect(() => {
    loadTrash();
    loadAuditLogs();

    const handleTrashSync = () => {
      loadTrash();
    };
    const handleAuditSync = () => {
      loadAuditLogs();
    };

    window.addEventListener(TRASH_SYNC_EVENT, handleTrashSync);
    window.addEventListener('kps-data-sync-event', handleTrashSync);
    window.addEventListener(AUDIT_LOG_SYNC_EVENT, handleAuditSync);

    return () => {
      window.removeEventListener(TRASH_SYNC_EVENT, handleTrashSync);
      window.removeEventListener('kps-data-sync-event', handleTrashSync);
      window.removeEventListener(AUDIT_LOG_SYNC_EVENT, handleAuditSync);
    };
  }, []);

  const showToast = (type: 'success' | 'danger', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      await trashService.restore(id);
      await loadTrash();
      loadAuditLogs();
      showToast('success', `กู้คืน "${name}" เรียบร้อยแล้ว (สถานะเปลี่ยนเป็นใช้งานปกติ)`);
    } catch {
      showToast('danger', `ไม่สามารถกู้คืน "${name}" ได้ โปรดลองอีกครั้ง`);
    }
  };

  const handleHardDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบถาวร "${name}"?\n\nข้อมูลจะถูกลบออกจากระบบอย่างเด็ดขาดและไม่สามารถกู้คืนได้อีก`
      )
    ) {
      try {
        await trashService.permanentDelete(id);
        await loadTrash();
        loadAuditLogs();
        showToast('danger', `ลบถาวร "${name}" ออกจากระบบแล้ว`);
      } catch {
        showToast('danger', `ไม่สามารถลบ "${name}" ได้`);
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (
      window.confirm(
        '⚠️ คุณต้องการล้างถังขยะทั้งหมดอย่างถาวรใช่หรือไม่?\n\nรายการทั้งหมดในถังขยะจะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้'
      )
    ) {
      try {
        await trashService.emptyTrash();
        await loadTrash();
        loadAuditLogs();
        showToast('danger', 'ล้างถังขยะทั้งหมดเรียบร้อยแล้ว');
      } catch {
        showToast('danger', 'เกิดข้อผิดพลาดในการล้างถังขยะ');
      }
    }
  };

  const handleClearAuditLogs = () => {
    if (
      window.confirm(
        'คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการบันทึกทั้งหมด?\n\nประวัติการแก้ไขและลบข้อมูลที่ผ่านมาจะถูกรีเซ็ต'
      )
    ) {
      activityAuditLogService.clearLogs();
      loadAuditLogs();
      showToast('success', 'ล้างประวัติบันทึกการแก้ไขและลบข้อมูลเรียบร้อยแล้ว');
    }
  };

  // Counts by category for Trash
  const trashCounts = useMemo(() => {
    const classroomCount = items.filter((i) => i.entityType === 'ชั้นเรียน').length;
    const assignmentCount = items.filter((i) => i.entityType === 'งาน/การบ้าน').length;
    const studentCount = items.filter((i) => i.entityType === 'นักเรียน').length;
    const examCount = items.filter((i) => i.entityType === 'ชุดข้อสอบ').length;
    return {
      all: items.length,
      classroom: classroomCount,
      assignment: assignmentCount,
      student: studentCount,
      exam: examCount,
    };
  }, [items]);

  // Counts for Audit Logs
  const auditStats = useMemo(() => {
    const total = auditLogs.length;
    const deletes = auditLogs.filter(
      (l) => l.actionType === 'DELETE' || l.actionType === 'BATCH_DELETE'
    ).length;
    const updates = auditLogs.filter(
      (l) => l.actionType === 'UPDATE' || l.actionType === 'BATCH_UPDATE'
    ).length;
    const batches = auditLogs.filter(
      (l) => l.actionType.startsWith('BATCH_') || l.itemCount > 1
    ).length;
    return { total, deletes, updates, batches };
  }, [auditLogs]);

  // Filtered trash items
  const filteredTrashItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === 'CLASSROOM' && item.entityType !== 'ชั้นเรียน') return false;
      if (activeTab === 'ASSIGNMENT' && item.entityType !== 'งาน/การบ้าน') return false;
      if (activeTab === 'STUDENT' && item.entityType !== 'นักเรียน') return false;
      if (activeTab === 'EXAM' && item.entityType !== 'ชุดข้อสอบ') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchType = item.entityType.toLowerCase().includes(query);
        const matchBy = item.deletedBy.toLowerCase().includes(query);
        return matchName || matchType || matchBy;
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditActionFilter !== 'ALL') {
        if (
          auditActionFilter === 'DELETE' &&
          !(log.actionType === 'DELETE' || log.actionType === 'BATCH_DELETE')
        )
          return false;
        if (
          auditActionFilter === 'UPDATE' &&
          !(log.actionType === 'UPDATE' || log.actionType === 'BATCH_UPDATE')
        )
          return false;
        if (
          auditActionFilter === 'BATCH' &&
          !(log.actionType.startsWith('BATCH_') || log.itemCount > 1)
        )
          return false;
      }

      if (auditEntityFilter !== 'ALL' && log.entityType !== auditEntityFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          log.title.toLowerCase().includes(q) ||
          log.summary.toLowerCase().includes(q) ||
          log.actor.toLowerCase().includes(q) ||
          (log.targetScope && log.targetScope.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditLogs, auditActionFilter, auditEntityFilter, searchQuery]);

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case 'ชั้นเรียน':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full font-bold text-[11px]">
            <Layers className="w-3 h-3" />
            <span>ชั้นเรียน</span>
          </span>
        );
      case 'งาน/การบ้าน':
      case 'คะแนน/การบ้าน':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full font-bold text-[11px]">
            <FileText className="w-3 h-3" />
            <span>งาน/การบ้าน</span>
          </span>
        );
      case 'นักเรียน':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full font-bold text-[11px]">
            <Users className="w-3 h-3" />
            <span>นักเรียน</span>
          </span>
        );
      case 'หลักสูตร/วิชา':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full font-bold text-[11px]">
            <BookOpen className="w-3 h-3" />
            <span>หลักสูตร/วิชา</span>
          </span>
        );
      case 'ชุดข้อสอบ':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-full font-bold text-[11px]">
            <ClipboardList className="w-3 h-3" />
            <span>ชุดข้อสอบ</span>
          </span>
        );
      case 'ระบบ SMS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-full font-bold text-[11px]">
            <MessageSquare className="w-3 h-3" />
            <span>ระบบ SMS</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[11px]">
            {entityType}
          </span>
        );
    }
  };

  const getActionBadge = (log: AuditLogEntry) => {
    const isBatch = log.actionType.startsWith('BATCH_') || log.itemCount > 1;

    if (log.actionType === 'DELETE' || log.actionType === 'BATCH_DELETE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.8 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[11px]">
          <Trash2 className="w-3 h-3" />
          <span>{isBatch ? `ลบกลุ่ม (${log.itemCount})` : 'ลบรายการ'}</span>
        </span>
      );
    }
    if (log.actionType === 'RESTORE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.8 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px]">
          <RotateCcw className="w-3 h-3" />
          <span>กู้คืน</span>
        </span>
      );
    }
    if (isBatch) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.8 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-bold text-[11px]">
          <Sparkles className="w-3 h-3" />
          <span>แก้ไขกลุ่ม ({log.itemCount} รายการ)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.8 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[11px]">
        <span>แก้ไข</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in font-sans text-slate-800 select-none">
      {/* Toast Notice */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold transition-all duration-300 animate-slide-up ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top View Mode Switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('TRASH')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'TRASH'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>ถังขยะกู้คืนข้อมูล ({items.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('AUDIT_LOG')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'AUDIT_LOG'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการแก้ไขและลบ ({auditLogs.length})</span>
          </button>
        </div>

        {viewMode === 'AUDIT_LOG' && auditLogs.length > 0 && (
          <button
            type="button"
            onClick={handleClearAuditLogs}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer shadow-2xs hover:border-rose-200 active:scale-95"
          >
            ล้างประวัติทั้งหมด
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW MODE 1: TRASH MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'TRASH' && (
        <>
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 sm:p-7 text-white shadow-card">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ถังขยะ & วงจรชีวิตข้อมูล (Soft-delete Lifecycle)</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  จัดการรายการที่ถูกลบ (Trash Management)
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-2xl leading-relaxed">
                  กู้คืนห้องเรียน งาน การบ้าน หรือข้อมูลที่ลบโดยไม่ได้ตั้งใจกลับสู่ระบบได้ทันที
                  (ระบบเก็บสำรองข้อมูลไว้ 30 วันก่อนล้างถาวร)
                </p>
              </div>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-rose-500/80 text-white rounded-xl text-xs font-bold transition-all border border-white/20 shadow-xs cursor-pointer active:scale-95 self-start sm:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ล้างถังขยะทั้งหมด</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">ทั้งหมดในถังขยะ</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Trash2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{trashCounts.all}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">รายการที่ถูกลบชั่วคราว</p>
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600">ชั้นเรียน / ห้อง</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-blue-900">{trashCounts.classroom}</div>
              <p className="text-[11px] text-blue-400 mt-0.5">ห้องเรียนที่ถูกลบ</p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600">งาน / การบ้าน</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-amber-900">{trashCounts.assignment}</div>
              <p className="text-[11px] text-amber-400 mt-0.5">ภาระงานที่ถูกลบ</p>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600">นักเรียน</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-900">{trashCounts.student}</div>
              <p className="text-[11px] text-emerald-400 mt-0.5">รายชื่อที่ถูกลบ</p>
            </div>
          </div>

          {/* Main Card: Category Tabs & List */}
          <div className="bg-white rounded-[20px] border border-slate-200/90 shadow-card overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  ทั้งหมด ({trashCounts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('CLASSROOM')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'CLASSROOM'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  ชั้นเรียน ({trashCounts.classroom})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ASSIGNMENT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'ASSIGNMENT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  งาน/การบ้าน ({trashCounts.assignment})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('STUDENT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'STUDENT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  นักเรียน ({trashCounts.student})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px] sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อรายการ, ผู้ลบ..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Content Body */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">กำลังโหลดรายการในถังขยะ...</p>
              </div>
            ) : filteredTrashItems.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-3 shadow-2xs">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">ไม่มีรายการในถังขยะ</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `ไม่พบข้อมูลที่ตรงกับคำค้นหา "${searchQuery}"`
                    : 'ข้อมูลของท่านปลอดภัย และยังไม่มีรายการใดถูกลบ'}
                </p>
              </div>
            ) : (
              <div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">ประเภท</th>
                        <th className="py-3.5 px-4">ชื่อรายการ / ข้อมูลที่ลบ</th>
                        <th className="py-3.5 px-4">วันที่ลบ</th>
                        <th className="py-3.5 px-4">ผู้ดำเนินการ</th>
                        <th className="py-3.5 px-4">ระยะเวลาคงเหลือ</th>
                        <th className="py-3.5 px-4 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTrashItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          <td className="py-3 px-4">{getEntityBadge(item.entityType)}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {item.name}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium flex items-center gap-1.5 pt-4">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.deletedAt}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {item.deletedBy}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full font-bold text-[11px]">
                              <Clock className="w-3 h-3" />
                              <span>เหลือ {item.daysRemaining} วัน</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRestore(item.id, item.name)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                                title="กู้คืนรายการนี้กลับสู่ระบบ"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>กู้คืน</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleHardDelete(item.id, item.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                                title="ลบถาวรโดยไม่สามารถกู้คืนได้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบถาวร</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Cards View (Strict Master Design Rule 9) */}
                <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                  {filteredTrashItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {getEntityBadge(item.entityType)}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full font-bold text-[10px]">
                          <Clock className="w-2.5 h-2.5" />
                          <span>เหลือ {item.daysRemaining} วัน</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {item.deletedAt} • โดย {item.deletedBy}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                        <button
                          type="button"
                          onClick={() => handleRestore(item.id, item.name)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs cursor-pointer active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>กู้คืน</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHardDelete(item.id, item.name)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Note */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
              💡 รายการที่อยู่ในถังขยะจะถูกเก็บไว้เป็นเวลา 30 วัน หากไม่ดำเนินการกู้คืน ระบบจะลบอย่างถาวรโดยอัตโนมัติ
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW MODE 2: ACTIVITY & AUDIT LOGS (WITH AGGREGATED DIGEST)   */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'AUDIT_LOG' && (
        <>
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 sm:p-7 text-white shadow-card">
            <div className="relative z-10 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold tracking-wide">
                <History className="w-3.5 h-3.5" />
                <span>บันทึกความปลอดภัยและการเปลี่ยนแปลงข้อมูล (Unified Audit Log)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                บันทึกประวัติการแก้ไขและลบข้อมูล
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-2xl leading-relaxed">
                รายงานผลสรุปของการกระทำ (Aggregated Action Digest) รวมทั้งการปรับปรุงเลขที่นักเรียนตามไฟล์ SGS
                การจัดเรียง และการลบห้องเรียน เพื่อตรวจสอบย้อนหลังได้อย่างแม่นยำ
              </p>
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">บันทึกทั้งหมด</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <History className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{auditStats.total}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">รายการที่มีการบันทึก</p>
            </div>

            <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600">การลบข้อมูล</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-rose-900">{auditStats.deletes}</div>
              <p className="text-[11px] text-rose-400 mt-0.5">ลบห้อง / นักเรียน / วิชา</p>
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600">การแก้ไขข้อมูล</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-blue-900">{auditStats.updates}</div>
              <p className="text-[11px] text-blue-400 mt-0.5">แก้ไขรายละเอียด</p>
            </div>

            <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-600">กระทำแบบกลุ่ม (Batch)</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-purple-900">{auditStats.batches}</div>
              <p className="text-[11px] text-purple-400 mt-0.5">รวมหลาย Action เป็น 1 Log</p>
            </div>
          </div>

          {/* Main Card: Controls & List */}
          <div className="bg-white rounded-[20px] border border-slate-200/90 shadow-card overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50">
              {/* Action Filter Chips & Entity Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAuditActionFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      auditActionFilter === 'ALL'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditActionFilter('DELETE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      auditActionFilter === 'DELETE'
                        ? 'bg-white text-rose-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    การลบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditActionFilter('UPDATE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      auditActionFilter === 'UPDATE'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    การแก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditActionFilter('BATCH')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      auditActionFilter === 'BATCH'
                        ? 'bg-white text-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    แบบกลุ่ม (Batch)
                  </button>
                </div>

                {/* Entity Dropdown */}
                <select
                  value={auditEntityFilter}
                  onChange={(e) => setAuditEntityFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-hidden focus:border-blue-400"
                >
                  <option value="ALL">ทุกหมวดหมู่</option>
                  <option value="ชั้นเรียน">ชั้นเรียน</option>
                  <option value="นักเรียน">นักเรียน</option>
                  <option value="หลักสูตร/วิชา">หลักสูตร/วิชา</option>
                  <option value="ระบบ SMS">ระบบ SMS</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px] sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาหัวข้อ, รายงานผลสรุป, ผู้กระทำ..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* List Body */}
            {filteredAuditLogs.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-3 shadow-2xs">
                  <History className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">ยังไม่มีบันทึกประวัติการกระทำ</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `ไม่พบบันทึกที่ตรงกับคำค้นหา "${searchQuery}"`
                    : 'เมื่อมีการลบห้องเรียน แก้ไขวิชา หรือปรับเลขที่นักเรียนตามไฟล์ SGS ระบบจะรวบรวมรายงานสรุปไว้ที่นี่อัตโนมัติ'}
                </p>
              </div>
            ) : (
              <div>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">วันและเวลา</th>
                        <th className="py-3.5 px-4">การกระทำ</th>
                        <th className="py-3.5 px-4">หมวดหมู่</th>
                        <th className="py-3.5 px-4">หัวข้อ & รายงานผลสรุป (Aggregated Digest)</th>
                        <th className="py-3.5 px-4">ผู้ดำเนินการ</th>
                        <th className="py-3.5 px-4 text-right">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAuditLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedLogForDetails(log)}
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.formattedDate}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">{getActionBadge(log)}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getEntityBadge(log.entityType)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              <span>{log.title}</span>
                              {log.itemCount > 1 && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                                  {log.itemCount} รายการ
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">
                              {log.summary}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                            {log.actor}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLogForDetails(log);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <span>เปิดดู</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Cards (Rule 9) */}
                <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                  {filteredAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLogForDetails(log)}
                      className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-2xs space-y-2 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {getActionBadge(log)}
                          {getEntityBadge(log.entityType)}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {log.formattedDate}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{log.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {log.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px] text-slate-500 font-medium">
                        <span>โดย {log.actor}</span>
                        <span className="text-blue-600 font-bold flex items-center gap-0.5">
                          ดูรายละเอียด <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Note */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
              💡 บันทึกประวัติการกระทำแบบรวมศูนย์ช่วยให้ตรวจสอบการเปลี่ยนแปลงข้อมูลย้อนหลัง และส่งการแจ้งเตือนไปยังเครื่องโทรศัพท์เมื่อมีการปรับปรุงสำคัญ
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* AUDIT LOG DETAILS MODAL                                        */}
      {/* ------------------------------------------------------------- */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[22px] border border-slate-200 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#163A66]">
                    รายละเอียดบันทึกการกระทำ
                  </h3>
                  <p className="text-[11px] text-[#6B7C93] font-medium">
                    {selectedLogForDetails.formattedDate} • โดย {selectedLogForDetails.actor}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForDetails(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                {getActionBadge(selectedLogForDetails)}
                {getEntityBadge(selectedLogForDetails.entityType)}
                {selectedLogForDetails.targetScope && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                    {selectedLogForDetails.targetScope}
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedLogForDetails.title}
                </h4>
                <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedLogForDetails.summary}
                </p>
              </div>

              {/* Changes list if present */}
              {selectedLogForDetails.changes && selectedLogForDetails.changes.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                    รายการเปลี่ยนแปลง ({selectedLogForDetails.changes.length} รายการ):
                  </h5>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {selectedLogForDetails.changes.map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          {ch.studentName && (
                            <span className="font-bold text-slate-800 block truncate">
                              {ch.studentName}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">
                            {ch.label || ch.field}:
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold">
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md line-through">
                            {ch.from !== undefined ? String(ch.from) : '-'}
                          </span>
                          <span className="text-slate-400">➔</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                            {ch.to !== undefined ? String(ch.to) : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForDetails(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
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
