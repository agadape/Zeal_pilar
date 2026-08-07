'use client';

import Image from 'next/image';
import { 
  IconLayoutDashboard, 
  IconUserPlus, 
  IconUsersGroup, 
  IconClipboardCheck, 
  IconCalendarEvent, 
  IconSpeakerphone,
  IconRefresh
} from '@tabler/icons-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
    { id: 'people', label: 'Tambah Orang', icon: IconUserPlus },
    { id: 'groups', label: 'Groups & Leaders', icon: IconUsersGroup },
    { id: 'statistika', label: 'Statistika Minggu', icon: IconClipboardCheck },
    { id: 'events', label: 'Events & Duty Roster', icon: IconCalendarEvent },
    { id: 'announcements', label: 'Visi & Pengumuman', icon: IconSpeakerphone },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BRAND & ACTION ROW */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          <div className="flex items-center space-x-3.5">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white flex items-center justify-center shrink-0">
              <Image 
                src="/logo.jpg" 
                alt="ZEAL Logo" 
                width={44} 
                height={44}
                className="object-contain p-1" 
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900">GKDI TUGU</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold tracking-wider uppercase border border-amber-200">
                  ZEAL JOGJA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Youth & Campus Ministry Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              title="Reset Cache / Refresh"
              className="btn-tactile text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <IconRefresh className="w-3.5 h-3.5 text-slate-500" stroke={2} />
              <span>Reset Cache</span>
            </button>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex space-x-1.5 overflow-x-auto pb-3 pt-1 no-scrollbar border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`btn-tactile flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#b5852e] text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} stroke={1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
