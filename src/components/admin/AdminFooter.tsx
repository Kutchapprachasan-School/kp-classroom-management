import React from 'react';

interface AdminFooterProps {
  schoolName?: string;
  version?: string;
  yearTh?: string;
}

export const AdminFooter: React.FC<AdminFooterProps> = ({
  schoolName = 'โรงเรียนศึกษาวิทยา',
  version = 'v1.0.0',
  yearTh = '2568',
}) => {
  return (
    <footer
      className="mt-8 pt-4 pb-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 select-none font-['Prompt',sans-serif]"
      style={{ fontFamily: "'Prompt', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-500">School Management System</span>
        <span>{version}</span>
        <span>|</span>
        <span className="text-slate-600 font-medium">{schoolName}</span>
      </div>

      <div className="text-[11px] text-slate-400">
        © {yearTh} {schoolName} สงวนลิขสิทธิ์
      </div>
    </footer>
  );
};
