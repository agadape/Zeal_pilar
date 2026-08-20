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
    navItems.push({ id: 'admin', label: 'Admin', icon: IconShieldLock });
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BRAND & ACTION ROW */}
        <div className="flex items-center justify-between py-3 sm:py-0 sm:h-20 gap-2">
          
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-white shadow-md shadow-slate-200/50 flex items-center justify-center shrink-0 border border-slate-100">
              <Image 
                src="/logo.jpg" 
                alt="ZEAL Logo" 
                width={48} 
                height={48}
                className="object-contain p-1.5" 
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 whitespace-nowrap">GKDI TUGU</span>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold tracking-widest uppercase shadow-sm border border-blue-100/50 whitespace-nowrap">
                  ZEAL
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">Youth & Campus Ministry</p>
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
              title="Refresh Data"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold flex items-center space-x-1.5 transition-all shadow-sm hidden sm:flex hover:shadow-md"
            >
              <IconRefresh className="w-4 h-4 text-slate-500 shrink-0" stroke={2} />
              <span className="text-xs hidden lg:inline-block font-bold">Refresh</span>
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
              className="px-3 py-2 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold flex items-center space-x-1.5 transition-all shadow-sm hover:shadow-md"
            >
              <IconLogout className="w-4 h-4 shrink-0" stroke={2} />
              <span className="text-xs hidden sm:inline-block">Logout</span>
            </button>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex space-x-2 overflow-x-auto pb-3 pt-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 -translate-y-0.5'
                    : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 hover:-translate-y-0.5'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} stroke={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
