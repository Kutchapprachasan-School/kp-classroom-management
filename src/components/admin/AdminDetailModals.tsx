import React from 'react';
import { X, Clock, Wrench } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BaseModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">{children}</div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export const FinancialDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="รายละเอียดงบประมาณ & การจัดซื้อจัดจ้าง 2568">
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-emerald-800 font-semibold">รายรับรวม (ปีงบ 2568)</span>
            <div className="text-xl font-black text-slate-900 mt-1">8,450,000 บาท</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">+12% เมื่อเทียบกับปีที่แล้ว</div>
          </div>
          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
            <span className="text-rose-800 font-semibold">รายจ่ายรวมทั้งหมด</span>
            <div className="text-xl font-black text-slate-900 mt-1">5,320,000 บาท</div>
            <div className="text-[10px] text-rose-600 font-bold mt-0.5">+8% เมื่อเทียบกับปีที่แล้ว</div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-800 mb-2">รายการจัดซื้อจัดจ้างล่าสุด (8 รายการ)</h4>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {[
              { item: 'จัดซื้อเครื่องคอมพิวเตอร์ห้องปฏิบัติการ 30 เครื่อง', cost: '650,000 บาท', status: 'รอส่งมอบงาน', color: 'text-amber-600 bg-amber-50' },
              { item: 'ปรับปรุงระบบไฟฟ้าอาคารเรียน 2', cost: '180,000 บาท', status: 'เสร็จสิ้น', color: 'text-emerald-600 bg-emerald-50' },
              { item: 'อุปกรณ์ห้องปฏิบัติการวิทยาศาสตร์ ม.ปลาย', cost: '125,000 บาท', status: 'กำลังดำเนินการ', color: 'text-blue-600 bg-blue-50' },
              { item: 'หนังสือเรียนและสื่อเสริมการเรียนรู้ ปพ.', cost: '340,000 บาท', status: 'เสร็จสิ้น', color: 'text-emerald-600 bg-emerald-50' },
            ].map((p, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{p.item}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">วงเงินงบประมาณ: {p.cost}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${p.color}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export const RepairsDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="งานแจ้งซ่อม & อาคารสถานที่ (5 รายการ)">
      <div className="space-y-3 text-xs">
        {[
          { loc: 'อาคาร 2 ชั้น 3 ห้อง 304', issue: 'เครื่องปรับอากาศมีน้ำหยด', status: 'กำลังดำเนินการ', date: 'วันนี้ 09:30 น.', staff: 'นายสมบัติ ช่างอาคาร' },
          { loc: 'อาคารวิทยาศาสตร์ ห้องปฏิบัติการเคมี', issue: 'ก๊อกน้ำอ่างล้างสารเคมีรั่วซึม', status: 'กำลังดำเนินการ', date: 'วันนี้ 08:15 น.', staff: 'นายประสิทธิ์ สุขใจ' },
          { loc: 'โรงอาหารกลาง เสาต้นที่ 4', issue: 'พัดลมเพดานไม่หมุน', status: 'กำลังดำเนินการ', date: 'เมื่อวานนี้', staff: 'นายสมบัติ ช่างอาคาร' },
          { loc: 'ห้องสมุดประชาชน อาคาร 1', issue: 'หลอดไฟ LED กะพริบ 2 จุด', status: 'เสร็จสิ้น', date: '2 วันที่แล้ว', staff: 'เสร็จสมบูรณ์' },
          { loc: 'ห้องประชุมอินทนิล', issue: 'ระบบโปรเจกเตอร์สีเพี้ยน', status: 'เสร็จสิ้น', date: '3 วันที่แล้ว', staff: 'เสร็จสมบูรณ์' },
        ].map((r, idx) => (
          <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">{r.loc}</div>
                <div className="text-slate-600 mt-0.5">{r.issue}</div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {r.date} • ผู้รับผิดชอบ: {r.staff}
                </div>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                r.status === 'เสร็จสิ้น'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </BaseModal>
  );
};
