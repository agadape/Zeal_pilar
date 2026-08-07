'use client';

import Image from 'next/image';
import { isSupabaseConfigured } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  ClipboardList, 
  CalendarDays, 
  Megaphone,
  Database,
  Laptop
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'people', label: 'Tambah Orang', icon: UserPlus },
    { id: 'groups', label: 'Groups & Leaders', icon: Users },
    { id: 'statistika', label: 'Statistika Minggu', icon: ClipboardList },
    { id: 'events', label: 'Events & Duty Roster', icon: CalendarDays },
    { id: 'announcements', label: 'Visi & Pengumuman', icon: Megaphone },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LOGO & TITLE */}
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black flex items-center justify-center">
              <Image 
                src="/logo.jpg" 
                alt="ZEAL Logo" 
                width={48} 
                height={48}
                className="object-contain p-1 invert-0 filter brightness-110 contrast-125" 
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-wider text-white">TUGU</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-slate-300 font-medium tracking-widest uppercase">
                  ZEAL JOGJA
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light">Leaders & Small Group Portal</p>
            </div>
          </div>

          {/* SYSTEM STATUS BADGE */}
          <div className="hidden md:flex items-center space-x-3">
            <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border ${
              isSupabaseConfigured 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {isSupabaseConfigured ? <Database className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
              <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Demo Mode (Ready for Supabase)'}</span>
            </div>
          </div>

        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-3 pt-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-md shadow-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
