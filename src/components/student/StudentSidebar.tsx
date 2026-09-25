import React from 'react';
import {
  Home,
  CheckSquare,
  Zap,
  BarChart2,
  Award,
  LogOut,
  MapPin,
  Vote,
  FileCheck2,
  X,
} from 'lucide-react';

export type StudentTabKey =
  | 'home'
  | 'missions'
  | 'arena'
  | 'gradebook'
  | 'trophy'
  | 'home-visit'
  | 'student-leave'
  | 'student-council'
  | 'council-affairs';

interface StudentSidebarProps {
  activeTab: StudentTabKey;
  onSelectTab: (tab: StudentTabKey) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  isOpen = false,
  onClose,
}) => {
  const handleTabClick = (tab: StudentTabKey) => {
    onSelectTab(tab);
    onClose?.();
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
            นร.
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 text-xs truncate">
              พอร์ทัลนักเรียน
            </div>
            <div className="text-[11px] text-slate-400 truncate">ห้องเรียนผจญภัย</div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="ปิดเมนู"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
        <div>
          <div className="px-2.5 pb-1.5 text-[11px] font-bold text-slate-400">
            เมนูนักเรียน
          </div>
          <div className="space-y-1 text-xs">
            <button
              onClick={() => handleTabClick('home')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'home'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Home className={`w-4 h-4 shrink-0 ${activeTab === 'home' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">หน้าแรกของฉัน</span>
            </button>

            <button
              onClick={() => handleTabClick('missions')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'missions'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className={`w-4 h-4 shrink-0 ${activeTab === 'missions' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">ภารกิจ / การบ้าน</span>
            </button>

            <button
              onClick={() => handleTabClick('arena')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'arena'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap className={`w-4 h-4 shrink-0 ${activeTab === 'arena' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">สนามท้าทาย</span>
            </button>

            <button
              onClick={() => handleTabClick('gradebook')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'gradebook'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart2 className={`w-4 h-4 shrink-0 ${activeTab === 'gradebook' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">สถิติและคะแนน</span>
            </button>

            <button
              onClick={() => handleTabClick('trophy')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'trophy'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Award className={`w-4 h-4 shrink-0 ${activeTab === 'trophy' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">ตู้รางวัล</span>
            </button>

            <button
              onClick={() => handleTabClick('home-visit')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'home-visit'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className={`w-4 h-4 shrink-0 ${activeTab === 'home-visit' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">เยี่ยมบ้าน นร.01</span>
            </button>

            <button
              onClick={() => handleTabClick('student-leave')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'student-leave'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileCheck2 className={`w-4 h-4 shrink-0 ${activeTab === 'student-leave' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">ยื่นใบลา & ความประพฤติ</span>
            </button>

            <button
              onClick={() => handleTabClick('student-council')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'student-council' || activeTab === 'council-affairs'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Vote className={`w-4 h-4 shrink-0 ${activeTab === 'student-council' || activeTab === 'council-affairs' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate">สภานักเรียน (เลือกตั้ง)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Student Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="px-2 mb-2">
          <div className="text-xs font-semibold text-slate-800 truncate">
            ด.ช. ทัตธน คำฝั้น
          </div>
          <div className="text-[11px] text-slate-400">ม.3/1 · รหัส 45102</div>
        </div>
        <button
          onClick={() => {
            onLogout();
            onClose?.();
          }}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-52 bg-white border-r border-slate-200/80 flex-col shrink-0 min-h-screen text-xs text-slate-600 font-sans select-none">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-60 max-w-[82vw] bg-white h-full shadow-2xl flex flex-col text-xs text-slate-600 font-sans select-none animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
