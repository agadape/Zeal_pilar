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
  IconFlame,
  IconTarget
} from '@tabler/icons-react';

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

  // Derived metrics
  const weakPeople = people.filter(p => p.status === 'WEAK' || p.status === 'INACTIVE');
  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);

  // Community Stats
  const totalPeople = people.length;
  const totalBibleStudies = people.filter(p => p.status === 'BIBLE_STUDY').length;
  
  const isReportCompleted = stats.length > 0 && (new Date().getTime() - new Date(stats[0].week_date).getTime() < 7 * 24 * 60 * 60 * 1000);

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Pemimpin';
  const roleDisplay = currentUser?.role === 'SUPER_ADMIN' 
    ? 'Super Admin' 
    : currentUser?.role === 'GROUP_LEADER' 
      ? 'Group Leader' 
      : 'Member';

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto relative">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl shadow-slate-200/40">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md shadow-orange-500/20">
              {roleDisplay}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Halo, {firstName}! 👋
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm sm:text-base">
            Semangat melayani hari ini! Berikut ringkasan datamu.
          </p>
        </div>
        {currentUser && (
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl flex items-center gap-2 transition-all shadow-sm shrink-0"
          >
            <IconSettings className="w-4 h-4 text-slate-500" />
            Pengaturan
          </button>
        )}
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/30 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <IconUsers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{totalPeople}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Disciple</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/30 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <IconUsersGroup className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{groups.length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Grup PDG</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/30 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <IconBook className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{totalBibleStudies}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">B.A. Aktif</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-900/20 border border-slate-700 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
            <IconHeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{people.filter(p => p.status === 'VISITOR' || p.status === 'WEAK' || p.status === 'INACTIVE').length}</p>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Reachout / Tamu</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* MAIN COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* TASKS */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <IconTarget className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fokus Pelayanan</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border ${isReportCompleted ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-100'} flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${isReportCompleted ? 'bg-white text-slate-400' : 'bg-white text-rose-500 shadow-sm'}`}>
                      <IconClipboardCheck className="w-5 h-5" />
                    </div>
                    {isReportCompleted ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase">Selesai</span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-full uppercase">Pending</span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">Laporan Mingguan</h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {isReportCompleted ? "Laporan kehadiran dan PDG sudah Anda lengkapi minggu ini." : "Segera isi kehadiran, progress BA, dan statistik PDG."}
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('statistika')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isReportCompleted 
                      ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' 
                      : 'bg-rose-500 text-white shadow-md shadow-rose-500/30 hover:bg-rose-600'
                  }`}
                >
                  {isReportCompleted ? 'Lihat Laporan' : 'Isi Sekarang'}
                </button>
              </div>

              <div className="p-5 rounded-2xl border bg-amber-50 border-amber-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-lg bg-white text-amber-500 shadow-sm">
                      <IconFlame className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-200/50 px-2 py-1 rounded-full uppercase">Perhatian</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">Follow-up Disciple</h3>
                  <p className="text-xs text-slate-500 mb-4">Ada <span className="font-bold text-amber-600">{weakPeople.length} orang</span> yang perlu di-follow up atau reachout.</p>
                </div>
                <button 
                  onClick={() => onNavigate('people')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all"
                >
                  Lihat Daftar
                </button>
              </div>
            </div>
          </div>

          {/* AGENDA */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <IconCalendarEvent className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Agenda Terdekat</h2>
              </div>
              <button onClick={() => onNavigate('events')} className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                Semua <IconArrowRight className="w-4 h-4" />
              </button>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(e => (
                  <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{e.title}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(e.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="self-start sm:self-auto text-[10px] font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {e.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <p className="text-slate-500 font-medium">Belum ada agenda terdekat.</p>
              </div>
            )}
          </div>

        </div>

        {/* SIDEBAR COLUMN (1/3) */}
        <div className="lg:col-span-1 space-y-6 sm:space-y-8">
          
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center">
                <IconCake className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ulang Tahun</h2>
            </div>
            
            {milestones.length > 0 ? (
              <div className="space-y-4">
                {milestones.slice(0, 5).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {m.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-sm text-slate-800">{m.full_name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${m.days_until === 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                      {m.days_until === 0 ? 'HARI INI' : `${m.days_until} Hari`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada yang ulang tahun.</p>
            )}
          </div>

        </div>

      </div>

      {/* Change Password Modal */}
      <FormPanel
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordError('');
        }}
        title="Pengaturan Akun"
        submitLabel="Simpan Password"
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
        <div className="space-y-4 pt-2">
          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {passwordError}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password Baru</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Konfirmasi Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </FormPanel>

    </div>
  );
}
