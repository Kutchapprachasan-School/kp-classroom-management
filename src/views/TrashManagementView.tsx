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
} from 'lucide-react';
import { trashService, TRASH_SYNC_EVENT } from '../services/trashService';
import type { SoftDeletedItem } from '../types/viewModels';

type TrashCategoryTab = 'ALL' | 'CLASSROOM' | 'ASSIGNMENT' | 'STUDENT' | 'EXAM';

export const TrashManagementView: React.FC = () => {
  const [items, setItems] = useState<SoftDeletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TrashCategoryTab>('ALL');
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

  useEffect(() => {
    loadTrash();
    const handleSync = () => {
      loadTrash();
    };
    window.addEventListener(TRASH_SYNC_EVENT, handleSync);
    window.addEventListener('kps-data-sync-event', handleSync);
    return () => {
      window.removeEventListener(TRASH_SYNC_EVENT, handleSync);
      window.removeEventListener('kps-data-sync-event', handleSync);
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
        showToast('danger', 'ล้างถังขยะทั้งหมดเรียบร้อยแล้ว');
      } catch {
        showToast('danger', 'เกิดข้อผิดพลาดในการล้างถังขยะ');
      }
    }
  };

  // Counts by category
  const counts = useMemo(() => {
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

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === 'CLASSROOM' && item.entityType !== 'ชั้นเรียน') return false;
      if (activeTab === 'ASSIGNMENT' && item.entityType !== 'งาน/การบ้าน') return false;
      if (activeTab === 'STUDENT' && item.entityType !== 'นักเรียน') return false;
      if (activeTab === 'EXAM' && item.entityType !== 'ชุดข้อสอบ') return false;

      // Search filter
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
      case 'ชุดข้อสอบ':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-full font-bold text-[11px]">
            <ClipboardList className="w-3 h-3" />
            <span>ชุดข้อสอบ</span>
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
          <div className="mt-2 text-2xl font-black text-slate-900">{counts.all}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">รายการที่ถูกลบชั่วคราว</p>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600">ชั้นเรียน / ห้อง</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-900">{counts.classroom}</div>
          <p className="text-[11px] text-blue-400 mt-0.5">ห้องเรียนที่ถูกลบ</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600">งาน / การบ้าน</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900">{counts.assignment}</div>
          <p className="text-[11px] text-amber-400 mt-0.5">ภาระงานที่ถูกลบ</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600">นักเรียน & สอบ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-900">
            {counts.student + counts.exam}
          </div>
          <p className="text-[11px] text-emerald-400 mt-0.5">รายชื่อ & ชุดข้อสอบ</p>
        </div>
      </div>

      {/* Main Content Card: Tabs, Search, and Items */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-card overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          {/* Category Tabs */}
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
              ทั้งหมด ({counts.all})
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
              ชั้นเรียน ({counts.classroom})
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
              งาน/การบ้าน ({counts.assignment})
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
              นักเรียน ({counts.student})
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
        ) : filteredItems.length === 0 ? (
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
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold">
                    <th className="py-3 px-4 w-32">ประเภท</th>
                    <th className="py-3 px-4">ชื่อรายการ</th>
                    <th className="py-3 px-4 w-44">เวลาที่ลบ</th>
                    <th className="py-3 px-4 w-36">ผู้ลบ</th>
                    <th className="py-3 px-4 w-36 text-center">คงเหลือในถังขยะ</th>
                    <th className="py-3 px-4 w-44 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4">{getEntityBadge(item.entityType)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {item.name}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">ID: {item.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.deletedAt}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{item.deletedBy}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full font-bold text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>เหลืออีก {item.daysRemaining} วัน</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl font-bold text-xs transition-all cursor-pointer"
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
              {filteredItems.map((item) => (
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
                      <span>{item.deletedAt} • โดย {item.deletedBy}</span>
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
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs cursor-pointer"
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
    </div>
  );
};
