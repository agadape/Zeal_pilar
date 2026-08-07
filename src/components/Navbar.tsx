'use client';

import Image from 'next/image';
import { 
  IconLayoutDashboard, 
  IconUserPlus, 
  IconUsersGroup, 
  IconClipboardCheck, 
  IconCalendarEvent, 
  IconSpeakerphone
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
    <header className="sticky top-0 z-50 tugu-card border-b border-white/10 bg-zinc-950/90 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BRAND & STATUS ROW */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          <div className="flex items-center space-x-3.5">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-white/20 shadow-md bg-black flex items-center justify-center shrink-0">
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
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">TUGU</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 border border-white/15 text-slate-300 font-mono font-medium tracking-widest uppercase">
                  ZEAL JOGJA
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">Youth & Campus Ministry Portal</p>
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
              title="Reset Cache / Force Re-sync"
              className="btn-tactile text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
            >
              Reset Cache
            </button>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex space-x-1 overflow-x-auto pb-3 pt-1 no-scrollbar border-t border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`btn-tactile flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} stroke={1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
