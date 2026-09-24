import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { trashService } from '../services/trashService';
import type { SoftDeletedItem } from '../types/viewModels';

export const TrashManagementView: React.FC = () => {
  const [items, setItems] = useState<SoftDeletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const handleRestore = async (id: string, name: string) => {
    await trashService.restore(id);
    await loadTrash();
    alert(`กู้คืน "${name}" เรียบร้อยแล้ว (สถานะเปลี่ยนเป็น ACTIVE)`);
  };

  const handleHardDelete = async (id: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบถาวร "${name}"? ข้อมูลจะถูกลบออกจากฐานข้อมูลอย่างเด็ดขาดและไม่สามารถกู้คืนได้อีก`)) {
      await trashService.permanentDelete(id);
      await loadTrash();
      alert(`ลบถาวร "${name}" เรียบร้อยแล้ว`);
    }
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                ถังขยะ (Trash & Soft-delete Lifecycle)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                ตรวจสอบรายการที่ถูกลบชั่วคราว กู้คืนข้อมูล หรือลบถาวร (ระบบจะล้างอัตโนมัติเมื่อครบ 30 วัน)
              </p>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={async () => {
              if (confirm('คุณต้องการล้างถังขยะทั้งหมดอย่างถาวรหรือไม่?')) {
                await trashService.emptyTrash();
                await loadTrash();
                alert('ล้างถังขยะเรียบร้อยแล้ว');
              }
            }}
            className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            ล้างถังขยะทั้งหมด
          </button>
        )}
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">นโยบายความปลอดภัยของข้อมูล (Soft Delete Policy):</span> รายการที่ถูกลบจะถูกบันทึก <code>status = DELETED</code> และเก็บไว้ 30 วันเพื่อให้สามารถกู้คืนได้กรณีที่ครูลบโดยไม่ได้ตั้งใจ
        </div>
      </div>

      {/* Deleted Items List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <span>กำลังโหลดรายการในถังขยะ...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Trash2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <span>ถังขยะว่างเปล่า ไม่มีรายการที่ถูกลบ</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">ประเภท</th>
                  <th className="py-2.5 px-3">ชื่อรายการ</th>
                  <th className="py-2.5 px-3">เวลาที่ลบ</th>
                  <th className="py-2.5 px-3">ผู้ลบ</th>
                  <th className="py-2.5 px-3 text-center">คงเหลือในถังขยะ</th>
                  <th className="py-2.5 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {item.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-3 text-slate-400">{item.deletedAt}</td>
                    <td className="py-3 px-3 text-slate-600">{item.deletedBy}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-[11px]">
                        เหลืออีก {item.daysRemaining} วัน
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(item.id, item.name)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>กู้คืน</span>
                        </button>
                        <button
                          onClick={() => handleHardDelete(item.id, item.name)}
                          className="px-3 py-1 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-lg font-semibold text-xs transition-colors"
                        >
                          ลบถาวร
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
