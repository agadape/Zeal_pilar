import { useState, useEffect } from 'react';
import { Person, Group, WeeklyStat, UpcomingMilestone, MinistryEvent } from '@/lib/types';
import { fetchUpcomingMilestones, updateUserPassword } from '@/lib/supabase';
import FormPanel from './FormPanel';
import { 
  IconUsers, 
  IconUsersGroup, 
  IconBook, 
  IconHeartHandshake, 
  IconCalendarEvent,
  IconClipboardCheck,
  IconCake,
  IconArrowRight,
  IconSettings,
  IconSparkles,
  IconFlame
} from '@tabler/icons-react';
import Image from 'next/image';

interface DashboardViewProps {
  people: Person[];
  groups: Group[];
  stats: WeeklyStat[];
  events?: MinistryEvent[];
  currentUser?: Person | null;
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ people, groups, stats, events = [], currentUser, onNavigate }: DashboardViewProps) {
  const [milestones, setMilestones] = useState<UpcomingMilestone[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchUpcomingMilestones().then(data => setMilestones(data));
  }, [people]);

  const weakPeople = people.filter(p => p.status === 'WEAK' || p.status === 'INACTIVE');
  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);

  const totalPeople = people.length;
  const totalBibleStudies = people.filter(p => p.status === 'BIBLE_STUDY').length;
  const isReportCompleted = stats.length > 0 && (new Date().getTime() - new Date(stats[0].week_date).getTime() < 7 * 24 * 60 * 60 * 1000);

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Leaders';

  return (
    <div className="space-y-6 pb-24">
      
      {/* HERO SECTION - Immersive and not rigid! */}
      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/20 group">
        {/* Absolute Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image 
            src="/login-bg-v2.webp" 
            alt="Hero Background" 
            fill 
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-6">
              <IconSparkles className="w-4 h-4 text-amber-300" />
              <span>Zeal Tugu Ministry</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 leading-tight">
              Let's make <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400">an impact</span> today, {firstName}! 🚀
            </h1>
            <p className="text-white/80 text-lg font-medium max-w-lg">
              "Love God, love people, love life." Saatnya melayani dengan semangat baru.
            </p>
          </div>

          {currentUser && (
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold flex items-center gap-2 transition-all shrink-0 self-start md:self-auto"
            >
              <IconSettings className="w-5 h-5" />
              Settings
            </button>
          )}
        </div>
      </div>

      {/* STATS - Playful and colorful */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
          <IconUsers className="w-8 h-8 mb-4 opacity-80" />
          <h3 className="text-4xl font-black">{totalPeople}</h3>
          <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mt-1">Total Disciples</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
          <IconUsersGroup className="w-8 h-8 mb-4 opacity-80" />
          <h3 className="text-4xl font-black">{groups.length}</h3>
          <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs mt-1">Grup PDG</p>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
          <IconBook className="w-8 h-8 mb-4 opacity-80" />
          <h3 className="text-4xl font-black">{totalBibleStudies}</h3>
          <p className="text-amber-100 font-bold uppercase tracking-widest text-xs mt-1">B.A. Aktif</p>
        </div>

        <div className="bg-white rounded-3xl p-6 text-slate-800 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center">
              <IconFlame className="w-5 h-5" />
            </div>
            <span className="text-3xl font-black text-rose-500">{weakPeople.length}</span>
          </div>
          <div className="mt-4">
            <h4 className="font-bold">Needs Follow-up!</h4>
            <button onClick={() => onNavigate('people')} className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest mt-1 transition-colors">Lihat siapa aja &rarr;</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <IconCalendarEvent className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">What's Next?</h2>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((e, idx) => (
                  <div key={e.id} className="flex gap-4 items-center group cursor-pointer hover:bg-slate-50 p-4 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-800 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                      <span className="text-xs font-bold uppercase">{new Date(e.event_date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                      <span className="text-xl font-black">{new Date(e.event_date).toLocaleDateString('id-ID', { day: 'numeric' })}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-purple-700 transition-colors">{e.title}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        {new Date(e.event_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} 
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span> 
                        <span className="font-bold text-xs uppercase tracking-wider">{e.type.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                <p className="text-slate-500 font-medium text-lg">Belum ada agenda dalam waktu dekat. Waktunya istirahat! ☕</p>
              </div>
            )}
            
            <button onClick={() => onNavigate('events')} className="mt-6 w-full py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center gap-2 transition-colors">
              Lihat Kalender Lengkap <IconArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          
          {/* WEEKLY REPORT HERO-CARD */}
          <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-900/30">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                  <IconClipboardCheck className="w-6 h-6 text-indigo-300" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Laporan Mingguan</h2>
                <p className="text-slate-400 text-sm">
                  {isReportCompleted 
                    ? "Wow! Kamu sudah menyelesaikan laporan minggu ini. Awesome job!" 
                    : "Belum ngisi laporan kehadiran dan PDG? Yuk isi sekarang biar datanya update."}
                </p>
              </div>

              <button 
                onClick={() => onNavigate('statistika')}
                className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
                  isReportCompleted 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-indigo-500/50'
                }`}
              >
                {isReportCompleted ? 'Lihat Laporan' : 'Gass Isi Laporan!'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-100 text-pink-500 rounded-xl">
                <IconCake className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Ulang Tahun 🎉</h2>
            </div>
            
            {milestones.length > 0 ? (
              <div className="space-y-4">
                {milestones.slice(0, 4).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold text-sm">
                        {m.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700">{m.full_name}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${m.days_until === 0 ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/40' : 'bg-slate-100 text-slate-500'}`}>
                      {m.days_until === 0 ? 'HARI INI' : `${m.days_until} H`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-2xl">Lagi gak ada yang ultah.</p>
            )}
          </div>

        </div>

      </div>

      <FormPanel
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordError('');
        }}
        title="Settings"
        submitLabel="Update Password"
        isSubmitDisabled={passwordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
        onSubmit={async (e) => {
          e.preventDefault();
          if (newPassword.length < 6) {
            setPasswordError('Password minimal 6 karakter.');
            return;
          }
          if (newPassword !== confirmPassword) {
            setPasswordError('Konfirmasi password tidak cocok.');
            return;
          }
          setPasswordLoading(true);
          setPasswordError('');
          const { error } = await updateUserPassword(newPassword);
          setPasswordLoading(false);
          if (error) {
            setPasswordError(error.message);
          } else {
            alert('Password berhasil diubah!');
            setIsPasswordModalOpen(false);
            setNewPassword('');
            setConfirmPassword('');
          }
        }}
      >
        <div className="space-y-4 pt-4">
          {passwordError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
              {passwordError}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password Baru</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Konfirmasi Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </FormPanel>

    </div>
  );
}
