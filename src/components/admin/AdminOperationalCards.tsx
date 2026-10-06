import React from 'react';
import {
  ChevronRight,
  TrendingUp,
  Inbox,
  Send,
  FileCheck,
  Megaphone,
  MessageCircle,
  Bell,
  Mail,
  Wallet,
  FileText,
  Wrench,
} from 'lucide-react';

interface AdminOperationalCardsProps {
  onOpenSection?: (sectionKey: string) => void;
}

export const AdminOperationalCards: React.FC<AdminOperationalCardsProps> = ({
  onOpenSection,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* ========================================================
          1. การเงิน & พัสดุ
          ======================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">การเงิน & พัสดุ</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenSection?.('finance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Top 2 Boxes: Income & Expense */}
          <div className="grid grid-cols-2 gap-2 my-3">
            {/* รายรับรวม */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="text-[10px] text-emerald-800 font-medium">
                รายรับรวม (ปีงบประมาณ 2568)
              </div>
              <div className="font-black text-slate-900 text-xs sm:text-[13px] mt-0.5 leading-tight">
                8,450,000 <span className="text-[9.5px] font-normal text-slate-500">บาท</span>
              </div>
              <div className="text-[9.5px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12% จากปีก่อน</span>
              </div>
            </div>

            {/* รายจ่ายรวม */}
            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
              <div className="text-[10px] text-rose-800 font-medium">
                รายจ่ายรวม
              </div>
              <div className="font-black text-slate-900 text-xs sm:text-[13px] mt-0.5 leading-tight">
                5,320,000 <span className="text-[9.5px] font-normal text-slate-500">บาท</span>
              </div>
              <div className="text-[9.5px] font-bold text-rose-600 flex items-center gap-0.5 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+8% จากปีก่อน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-stats bottom row */}
        <div className="pt-2 border-t border-slate-50 grid grid-cols-3 gap-1 text-center text-[10px]">
          <div>
            <div className="text-slate-400">เบิกจ่ายสำเร็จ</div>
            <div className="font-bold text-slate-800 text-xs mt-0.5">126 รายการ</div>
          </div>
          <div>
            <div className="text-slate-400">จัดซื้อจัดจ้าง</div>
            <div className="font-bold text-slate-800 text-xs mt-0.5">8 รายการ</div>
          </div>
          <div>
            <div className="text-slate-400">รอส่งมอบงาน</div>
            <div className="font-bold text-slate-800 text-xs mt-0.5">5 รายการ</div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. งานเอกสาร & ธุรการ
          ======================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">งานเอกสาร & ธุรการ</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenSection?.('documents')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Icon metric tiles */}
          <div className="grid grid-cols-2 gap-2.5 my-3">
            {/* หนังสือเข้า */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">หนังสือเข้า</div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900">
                  12 <span className="text-[9.5px] font-normal text-slate-400">รายการ</span>
                </div>
              </div>
            </div>

            {/* หนังสือออก */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">หนังสือออก</div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900">
                  8 <span className="text-[9.5px] font-normal text-slate-400">รายการ</span>
                </div>
              </div>
            </div>

            {/* คำสั่ง */}
            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">คำสั่ง</div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900">
                  5 <span className="text-[9.5px] font-normal text-slate-400">รายการ</span>
                </div>
              </div>
            </div>

            {/* ประกาศ */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">ประกาศ</div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900">
                  7 <span className="text-[9.5px] font-normal text-slate-400">รายการ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-400 text-center font-medium">
          ระบบสารบรรณอิเล็กทรอนิกส์ (E-Document) พร้อมใช้งาน
        </div>
      </div>

      {/* ========================================================
          3. งานซ่อม & อาคารสถานที่
          ======================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">งานซ่อม & อาคารสถานที่</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenSection?.('repairs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Left metrics & Right photo */}
          <div className="flex items-center justify-between gap-3 my-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-slate-600">แจ้งซ่อมทั้งหมด</span>
                <span className="font-bold text-slate-900 ml-auto">5 รายการ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-600">กำลังดำเนินการ</span>
                <span className="font-bold text-slate-900 ml-auto">3 รายการ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">เสร็จสิ้น</span>
                <span className="font-bold text-slate-900 ml-auto">2 รายการ</span>
              </div>
            </div>

            {/* Thumbnail Photo of Building */}
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0 shadow-2xs">
              <img
                src="/images/admin/maintenance_thumb.png"
                alt="อาคารสถานที่"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/admin/hero_building.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <button
          type="button"
          onClick={() => onOpenSection?.('repairs')}
          className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          ดูรายละเอียด
        </button>
      </div>

      {/* ========================================================
          4. สื่อสารโรงเรียน
          ======================================================== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">สื่อสารโรงเรียน</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenSection?.('communication')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>ดูทั้งหมด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List of communication channels */}
          <div className="my-2.5 space-y-2 text-xs">
            {/* ประกาศ / ข่าวสาร */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-700 font-medium">ประกาศ / ข่าวสาร</span>
              </div>
              <span className="font-bold text-slate-900">12 เรื่อง</span>
            </div>

            {/* LINE OA */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-700 font-medium">LINE OA</span>
              </div>
              <span className="font-bold text-slate-900">8,420 คน</span>
            </div>

            {/* แจ้งเตือนผู้ปกครอง */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-pink-50 text-pink-500 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-700 font-medium">แจ้งเตือนผู้ปกครอง</span>
              </div>
              <span className="font-bold text-slate-900">342 ครั้ง</span>
            </div>

            {/* อีเมล / SMS */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-500 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-700 font-medium">อีเมล / SMS</span>
              </div>
              <span className="font-bold text-slate-900">1,256 ข้อความ</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-400 text-center font-medium">
          เชื่อมต่อ LINE Messaging API & SMS Gateway สำเร็จ
        </div>
      </div>
    </div>
  );
};
