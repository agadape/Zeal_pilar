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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BRAND & ACTION ROW */}
        <div className="flex items-center justify-between py-3 sm:py-0 sm:h-20 gap-2">
          
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
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
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">GKDI TUGU</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-mono font-bold tracking-widest uppercase border border-slate-200 whitespace-nowrap">
                  ZEAL JOGJA
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Youth & Campus Ministry Portal</p>
            </div>
          </div>

          <div className="flex items-center shrink-0 ml-2 space-x-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              title="Reset Cache / Refresh"
              className="px-2.5 sm:px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1 sm:space-x-1.5 transition-colors hidden sm:flex"
            >
              <IconRefresh className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" stroke={1.5} />
              <span className="text-[10px] sm:text-xs hidden min-[360px]:inline-block whitespace-nowrap uppercase tracking-wider">Muat Ulang</span>
            </button>

            <button
              onClick={async () => {
                if (typeof window !== 'undefined') {
                  const { supabase } = await import('@/lib/supabase');
                  if (supabase) await supabase.auth.signOut();
                  window.location.href = '/login';
                }
              }}
              title="Logout"
              className="px-2.5 sm:px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-rose-600 font-semibold flex items-center space-x-1 sm:space-x-1.5 transition-colors"
            >
              <IconLogout className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" stroke={1.5} />
              <span className="text-[10px] sm:text-xs min-[360px]:inline-block whitespace-nowrap uppercase tracking-wider">Keluar</span>
            </button>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex space-x-1 overflow-x-auto pb-3 pt-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} stroke={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
