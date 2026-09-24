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
} from 'lucide-react';

export type StudentTabKey =
  | 'home'
  | 'missions'
  | 'arena'
  | 'gradebook'
  | 'trophy'
  | 'home-visit'
  | 'council-affairs';

interface StudentSidebarProps {
  activeTab: StudentTabKey;
  onSelectTab: (tab: StudentTabKey) => void;
  onLogout: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
}) => {
  return (
    <aside className="w-60 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-screen text-[13px] text-slate-600 font-sans select-none">
      {/* Brand */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-sm shadow-sm">
          C
        </div>
        <div>
          <div className="font-semibold text-slate-800 text-xs">
            Classroom Manager
          </div>
          <div className="text-[11px] text-slate-400">ห้องเรียนผจญภัย</div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <div className="px-3 pb-2 text-[11px] font-medium text-slate-400">
            พื้นที่เรียนรู้ & กิจกรรมนักเรียน
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectTab('home')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'home'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>พื้นที่ของฉัน</span>
            </button>

            <button
              onClick={() => onSelectTab('missions')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'missions'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className={`w-4 h-4 ${activeTab === 'missions' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>ภารกิจ / การบ้าน</span>
            </button>

            <button
              onClick={() => onSelectTab('arena')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'arena'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap className={`w-4 h-4 ${activeTab === 'arena' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>สนามท้าทาย</span>
            </button>

            <button
              onClick={() => onSelectTab('gradebook')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'gradebook'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart2 className={`w-4 h-4 ${activeTab === 'gradebook' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>สถิติและคะแนน</span>
            </button>

            <button
              onClick={() => onSelectTab('trophy')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'trophy'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Award className={`w-4 h-4 ${activeTab === 'trophy' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>ตู้รางวัล</span>
            </button>

            <button
              onClick={() => onSelectTab('home-visit')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'home-visit'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <MapPin className={`w-4 h-4 ${activeTab === 'home-visit' ? 'text-blue-600' : 'text-emerald-600'}`} />
                <span>เยี่ยมบ้าน นร.01 / SDQ</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                GPS
              </span>
            </button>

            <button
              onClick={() => onSelectTab('council-affairs')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                activeTab === 'council-affairs'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Vote className={`w-4 h-4 ${activeTab === 'council-affairs' ? 'text-blue-600' : 'text-indigo-600'}`} />
                <span>สภานักเรียน & ใบลา</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Vote
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Student Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="px-2 mb-2">
          <div className="text-xs font-semibold text-slate-800">
            ด.ช. จิรายุ เดชปันคำ
          </div>
          <div className="text-[11px] text-slate-400">ม.3/8 · เลขที่ 1</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};
