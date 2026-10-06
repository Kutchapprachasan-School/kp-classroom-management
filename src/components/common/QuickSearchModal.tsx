import React, { useState, useEffect } from 'react';
import Search2Regular from '@mingcute/react/core-regular/search-2';
import CloseRegular from '@mingcute/react/core-regular/close';
import Book2Regular from '@mingcute/react/core-regular/book-2';
import User3Regular from '@mingcute/react/core-regular/user-3';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import ArrowRightRegular from '@mingcute/react/core-regular/arrow-right';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (view: 'overview' | 'student' | 'sar' | 'student-portal') => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    {
      title: 'ศ23101 ศิลปะ — ม.3/1',
      subtitle: 'ภาพรวมชั้นเรียน และนักเรียนที่ต้องดูแล',
      icon: Book2Regular,
      action: () => onSelectAction('overview'),
    },
    {
      title: 'ด.ช. ทัตธน คำฝั้น (เลขที่ 15)',
      subtitle: 'วิเคราะห์รายบุคคล & Radar Chart 5 มิติ',
      icon: User3Regular,
      action: () => onSelectAction('student'),
    },
    {
      title: 'เทียบผลข้ามห้อง (SAR / PA)',
      subtitle: 'รายงานสรุปผลการสอน และการกระจายเกรด',
      icon: SparklesRegular,
      action: () => onSelectAction('sar'),
    },
    {
      title: 'ห้องเรียนผจญภัย (มุมมองนักเรียน)',
      subtitle: 'พอร์ทัลเกมมิฟิเคชัน สัตว์เลี้ยงโมจิ และภารกิจ',
      icon: ArrowRightRegular,
      action: () => onSelectAction('student-portal'),
    },
  ];

  const filteredLinks = quickLinks.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search2Regular className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหานักเรียน, รายวิชา, ห้องเรียน, หรือรายงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <CloseRegular className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 max-h-80 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
            คำแนะนำด่วน
          </div>
          {filteredLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors group"
              >
                <div className="p-2 bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 rounded-lg">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
          <span>กด Esc เพื่อปิด</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
              ↓
            </kbd>
            เพื่อเลือก
          </span>
        </div>
      </div>
    </div>
  );
};
