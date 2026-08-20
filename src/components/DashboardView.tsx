import { useState, useEffect } from 'react';
import { Person, Group, WeeklyStat, UpcomingMilestone, MinistryEvent } from '@/lib/types';
import { fetchUpcomingMilestones, updateUserPassword } from '@/lib/supabase';
import FormPanel from './FormPanel';
import { 
  IconUsers, 
  IconUsersGroup, 
  IconBook, 
  IconHeartHandshake, 
  IconAlertCircle,
  IconCalendarEvent,
  IconClipboardCheck,
  IconCake,
  IconArrowRight,
  IconCheck,
  IconKey
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
    .slice(0, 2);

  // Community Stats
  const totalPeople = people.length;
  const totalBibleStudies = people.filter(p => p.status === 'BIBLE_STUDY').length;
  
  // Weekly Report check (assuming this week starts on Monday, or just check if any report was submitted in the last 6 days)
  const isReportCompleted = stats.length > 0 && (new Date().getTime() - new Date(stats[0].week_date).getTime() < 7 * 24 * 60 * 60 * 1000);

  // Setup greeting
  const firstName = currentUser?.full_name?.split(' ')[0] || 'Pemimpin';
  const roleDisplay = currentUser?.role === 'SUPER_ADMIN' 
    ? 'Super Admin' 
    : currentUser?.role === 'GROUP_LEADER' 
      ? 'Group Leader' 
      : 'Member';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-3">
              <span>Halo, {firstName}! 👋</span>
              {currentUser && (
                <span className="text-xs sm:text-sm font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  {roleDisplay}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Berikut adalah ringkasan aktivitas dan prioritas pelayanan Anda hari ini.
            </p>
          </div>
          {currentUser && (
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="btn-tactile px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center space-x-2 transition-all shadow-sm shrink-0 self-start sm:self-auto"
            >
              <span>Ubah Password</span>
            </button>
          )}
        </div>

      {/* NEEDS ATTENTION */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <IconAlertCircle className="w-4 h-4" />
          Perlu Perhatian
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* WEAK/FOLLOW UP */}
          <div className="tugu-card p-5 rounded-2xl border border-rose-200/60 bg-rose-50/30 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-rose-900">Follow-up Disciple</h3>
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">{weakPeople.length} Orang</span>
              </div>
              {weakPeople.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {weakPeople.slice(0, 3).map(p => (
                    <div key={p.id} className="text-sm text-rose-800 bg-white/60 p-2 rounded-lg border border-rose-100 flex justify-between items-center">
                      <span className="font-semibold">{p.full_name}</span>
                      <span className="text-xs">{p.campus || p.status}</span>
                    </div>
                  ))}
                  {weakPeople.length > 3 && (
                    <p className="text-xs text-rose-600 font-medium">+ {weakPeople.length - 3} lainnya...</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-rose-600/80 mb-4">Semua disciple dalam kondisi aktif dan baik.</p>
              )}
            </div>
            <button 
              onClick={() => onNavigate('people')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 transition-colors mt-2"
            >
              Lihat Data Disciple <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* UPCOMING MILESTONES */}
          <div className="tugu-card p-5 rounded-2xl border border-amber-200/60 bg-amber-50/30 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-amber-900">Milestone Terdekat</h3>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{milestones.length} Acara</span>
              </div>
              {milestones.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {milestones.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="text-sm text-amber-900 bg-white/60 p-2 rounded-lg border border-amber-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {m.milestone_type === 'BIRTHDAY' ? <IconCake className="w-4 h-4 text-pink-500" /> : <IconCake className="w-4 h-4 text-amber-600" />}
                        <span className="font-semibold">{m.full_name}</span>
                      </div>
                      <span className="text-xs font-bold">{m.days_until === 0 ? 'HARI INI' : `${m.days_until} Hari`}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-700/80 mb-4">Belum ada ulang tahun dalam waktu dekat.</p>
              )}
            </div>
            <button 
              onClick={() => onNavigate('people')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors mt-2"
            >
              Lihat Data Disciple <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* THIS WEEK */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <IconCalendarEvent className="w-4 h-4" />
          Minggu Ini
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* WEEKLY REPORT STATUS */}
          <div className="tugu-card p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-900">Status Laporan Mingguan</h3>
                {isReportCompleted ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 border border-emerald-200">
                    <IconCheck className="w-3 h-3" /> Selesai
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200">
                    Belum Dibuat
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-4">
                {isReportCompleted 
                  ? "Laporan minggu ini sudah diisi. Anda dapat menyalin laporannya ke WhatsApp dari menu Laporan Mingguan." 
                  : "Jangan lupa untuk mengisi kehadiran, progress BA, dan statistik grup PDG untuk minggu ini."}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('statistika')}
              className={`text-sm font-bold flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                isReportCompleted 
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                  : 'bg-[#b5852e] text-white hover:bg-amber-700 shadow-sm'
              }`}
            >
              <IconClipboardCheck className="w-4 h-4" />
              {isReportCompleted ? 'Lihat Laporan' : 'Isi Laporan Sekarang'}
            </button>
          </div>

          {/* UPCOMING EVENTS */}
          <div className="tugu-card p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Jadwal Terdekat</h3>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {upcomingEvents.map(e => (
                    <div key={e.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-slate-900">{e.title}</span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase">
                          {e.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {new Date(e.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-4 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  Tidak ada jadwal pelayanan atau acara terdekat minggu ini.
                </p>
              )}
            </div>
            <button 
              onClick={() => onNavigate('events')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors mt-2"
            >
              Lihat Jadwal Lengkap <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* COMMUNITY STATS */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <IconUsers className="w-4 h-4" />
          Komunitas
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="text-slate-500 mb-2"><IconUsers className="w-5 h-5" /></div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{totalPeople}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Total Disciple</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="text-emerald-500 mb-2"><IconUsersGroup className="w-5 h-5" /></div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{groups.length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Grup PDG</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="text-amber-500 mb-2"><IconBook className="w-5 h-5" /></div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{totalBibleStudies}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Belajar Alkitab</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="text-cyan-500 mb-2"><IconHeartHandshake className="w-5 h-5" /></div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{people.filter(p => p.status === 'VISITOR' || p.status === 'WEAK' || p.status === 'INACTIVE').length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Reachout / Tamu</p>
          </div>

        </div>
      </section>

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
        title="Ubah Password"
        submitLabel="Ubah Password"
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
        <div className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {passwordError}
            </div>
          )}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Password Baru</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
            />
          </div>
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Konfirmasi Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
            />
          </div>
        </div>
      </FormPanel>

    </div>
  );
}
