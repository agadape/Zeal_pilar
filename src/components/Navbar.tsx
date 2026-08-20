'use client';

import Image from 'next/image';
import { Person } from '@/lib/types';
import { 
  IconLayoutDashboard, 
  IconUsers,
  IconUsersGroup, 
  IconClipboardCheck, 
  IconRefresh,
  IconLogout,
  IconSpeakerphone,
  IconShieldLock
} from '@tabler/icons-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: Person | null;
}

export default function Navbar({ activeTab, setActiveTab, currentUser }: NavbarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
    { id: 'people', label: 'Data Disciple', icon: IconUsers },
    { id: 'groups', label: 'Grup PDG', icon: IconUsersGroup },
    { id: 'statistika', label: 'Statistik Grup', icon: IconClipboardCheck },
    { id: 'announcements', label: 'Pengumuman', icon: IconSpeakerphone },
  ];

  if (currentUser?.role === 'SUPER_ADMIN') {
    navItems.push({ id: 'admin', label: 'Akun Admin', icon: IconShieldLock });
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BRAND & ACTION ROW */}
        <div className="flex items-center justify-between py-3 sm:py-0 sm:h-20 gap-2">
          
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white flex items-center justify-center shrink-0">
              <Image 
                src="/logo.jpg" 
                alt="ZEAL Logo" 
                width={44} 
                height={44}
                className="object-contain p-1" 
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap sm:flex-nowrap">
                <span className="font-black text-base sm:text-xl tracking-tight text-slate-900 whitespace-nowrap">GKDI TUGU</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold tracking-wider uppercase border border-amber-200 whitespace-nowrap">
                  ZEAL JOGJA
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Youth & Campus Ministry Portal</p>
            </div>
          </div>

          <div className="flex items-center shrink-0 ml-2 space-x-2">
            <button
              onClick={async () => {
                if (typeof window !== 'undefined') {
                  const { supabase } = await import('@/lib/supabase');
                  if (supabase) await supabase.auth.signOut();
                  window.location.href = '/login';
                }
              }}
              title="Logout"
              className="btn-tactile px-2.5 sm:px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold flex items-center space-x-1 sm:space-x-1.5 transition-colors"
            >
              <IconLogout className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" stroke={2} />
              <span className="text-[10px] sm:text-xs min-[360px]:inline-block whitespace-nowrap">Logout</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              title="Reset Cache / Refresh"
              className="btn-tactile px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1 sm:space-x-1.5 transition-colors hidden sm:flex"
            >
              <IconRefresh className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" stroke={2} />
              <span className="text-[10px] sm:text-xs hidden min-[360px]:inline-block whitespace-nowrap">Reset</span>
            </button>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex space-x-1.5 overflow-x-auto pb-3 pt-2 no-scrollbar border-t border-slate-100">
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
