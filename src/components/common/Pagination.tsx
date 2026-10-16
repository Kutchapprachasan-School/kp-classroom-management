// src/components/common/Pagination.tsx
// คอมโพเนนต์การแบ่งหน้า (Pagination) ตามมาตรฐาน Master Design System: Pastel Anime Education Dashboard
// รองรับ: ตัวเลือกขนาดต่อหน้า (10, 20, 30, 50, ทั้งหมด), Smart Ellipsis (...), ปุ่มเลื่อนหน้าแรก-หน้าสุดท้าย, และการแสดงผล Responsive มือถือ

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export type PageSizeOption = number | 'ALL';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: PageSizeOption;
  pageSizeOptions?: PageSizeOption[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: PageSizeOption) => void;
  itemUnit?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 30, 50, 'ALL'],
  onPageChange,
  onPageSizeChange,
  itemUnit = 'คน',
  className = '',
}) => {
  const isAll = pageSize === 'ALL';
  const effectivePageSize = isAll ? totalItems || 1 : (pageSize as number);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const startItem = totalItems === 0 ? 0 : isAll ? 1 : (currentPage - 1) * effectivePageSize + 1;
  const endItem = isAll ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);

  // คำนวณช่วงหมายเลขหน้าแบบ Smart Ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* ซ้าย: แสดงช่วงรายการ + Dropdown ขนาดต่อหน้า */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
        <p className="text-slate-600 font-medium">
          แสดง <strong className="text-slate-900 font-bold">{startItem}</strong> -{' '}
          <strong className="text-slate-900 font-bold">{endItem}</strong> จากทั้งหมด{' '}
          <strong className="text-blue-700 font-bold">{totalItems}</strong> {itemUnit}
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span>| แสดงต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                onPageSizeChange(val as PageSizeOption);
                onPageChange(1); // รีเซ็ตไปหน้า 1 เสมอเมื่อเปลี่ยนขนาด
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'ALL' ? 'ทั้งหมด' : `${opt} ${itemUnit}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ขวา: แผงปุ่มเปลี่ยนหน้า */}
      {totalPages > 1 && !isAll && (
        <div className="flex items-center gap-1">
          {/* ปุ่มไปหน้าแรกสุด */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            className="w-8 h-8 rounded-xl border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="หน้าแรกสุด"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* ปุ่มหน้าก่อนหน้า */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="w-8 h-8 rounded-xl border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* ปุ่มหมายเลขหน้า & จุดไข่ปลา */}
          <div className="flex items-center gap-1 px-0.5">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-6 text-center text-slate-400 font-bold select-none text-xs"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = currentPage === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-8 h-8 px-2 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : 'border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* ปุ่มหน้าถัดไป */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="w-8 h-8 rounded-xl border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="หน้าถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* ปุ่มไปหน้าสุดท้าย */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="w-8 h-8 rounded-xl border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="หน้าสุดท้าย"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
