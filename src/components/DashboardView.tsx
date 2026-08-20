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
  IconSettings
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
  
  // Weekly Report check (assuming this week starts on Monday)
  const isReportCompleted = stats.length > 0 && (new Date().getTime() - new Date(stats[0].week_date).getTime() < 7 * 24 * 60 * 60 * 1000);

  // Setup greeting
  const firstName = currentUser?.full_name?.split(' ')[0] || 'Pemimpin';
  const roleDisplay = currentUser?.role === 'SUPER_ADMIN' 
    ? 'Super Admin' 
    : currentUser?.role === 'GROUP_LEADER' 
      ? 'Group Leader' 
      : 'Member';

  return (
    <div className="space-y-12 animate-fade-in pb-24 max-w-6xl mx-auto">
      
      {/* HEADER - Minimalist Editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">
              {roleDisplay}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 font-serif">
            Halo, {firstName}.
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Berikut adalah ringkasan aktivitas pelayanan Anda hari ini.
          </p>
        </div>
        {currentUser && (
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all shrink-0"
          >
            <IconSettings className="w-4 h-4" />
            Pengaturan Akun
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: URGENT & TASKS (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Minggu Ini</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* WEEKLY REPORT STATUS */}
            <div className="bg-white border border-slate-200 p-6 rounded flex flex-col justify-between group hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-50 rounded text-slate-700">
                    <IconClipboardCheck className="w-5 h-5" stroke={1.5} />
                  </div>
                  {isReportCompleted ? (
                    <span className="bg-[#EDF3EC] text-[#346538] text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Terkirim
                    </span>
                  ) : (
                    <span className="bg-[#FDEBEC] text-[#9F2F2D] text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Pending
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Laporan Mingguan</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {isReportCompleted 
                    ? "Laporan kehadiran dan statistik PDG minggu ini sudah Anda lengkapi." 
                    : "Anda belum mengisi kehadiran, progress BA, dan statistik grup PDG minggu ini."}
                </p>
              </div>
              <button 
                onClick={() => onNavigate('statistika')}
                className={`text-xs font-bold uppercase tracking-wider w-full py-3 rounded transition-all ${
                  isReportCompleted 
                    ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200' 
                    : 'bg-[#111] text-white hover:bg-black'
                }`}
              >
                {isReportCompleted ? 'Lihat Arsip' : 'Isi Sekarang'}
              </button>
            </div>

            {/* UPCOMING EVENTS */}
            <div className="bg-white border border-slate-200 p-6 rounded flex flex-col justify-between group hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-50 rounded text-slate-700">
                    <IconCalendarEvent className="w-5 h-5" stroke={1.5} />
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-4">Agenda Terdekat</h3>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {upcomingEvents.map(e => (
                      <div key={e.id} className="border-l-2 border-slate-200 pl-3 py-1">
                        <p className="font-bold text-sm text-slate-900 leading-tight mb-1">{e.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(e.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-6 py-4">Tidak ada agenda khusus dalam waktu dekat.</p>
                )}
              </div>
              <button 
                onClick={() => onNavigate('events')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 uppercase tracking-wider transition-colors pt-2"
              >
                Semua Agenda <IconArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#9F2F2D] rounded-full"></div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Perhatian Khusus</h2>
          </div>

          {/* WEAK/FOLLOW UP - Minimalist Horizontal list */}
          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-sm text-slate-900">Follow-up Disciple ({weakPeople.length})</h3>
              <button onClick={() => onNavigate('people')} className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider">
                Lihat Semua
              </button>
            </div>
            <div className="p-0">
              {weakPeople.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {weakPeople.slice(0, 4).map(p => (
                    <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{p.full_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.campus || 'Tidak ada info kampus'}</p>
                      </div>
                      <span className="bg-[#FDEBEC] text-[#9F2F2D] text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500">Semua anggota dalam kondisi aktif.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STATS & MILESTONES (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Metrik Komunitas</h2>
          </div>

          {/* METRICS BENTO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded flex flex-col justify-between aspect-square shadow-sm">
              <IconUsers className="w-5 h-5 text-slate-400 mb-2" stroke={1.5} />
              <div>
                <p className="text-3xl font-light tracking-tight text-slate-900">{totalPeople}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Disciple</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded flex flex-col justify-between aspect-square shadow-sm">
              <IconUsersGroup className="w-5 h-5 text-slate-400 mb-2" stroke={1.5} />
              <div>
                <p className="text-3xl font-light tracking-tight text-slate-900">{groups.length}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Grup PDG</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded flex flex-col justify-between aspect-square shadow-sm">
              <IconBook className="w-5 h-5 text-slate-400 mb-2" stroke={1.5} />
              <div>
                <p className="text-3xl font-light tracking-tight text-slate-900">{totalBibleStudies}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">B.A. Aktif</p>
              </div>
            </div>
            <div className="bg-[#111] p-5 rounded flex flex-col justify-between aspect-square shadow-sm">
              <IconHeartHandshake className="w-5 h-5 text-white/50 mb-2" stroke={1.5} />
              <div>
                <p className="text-3xl font-light tracking-tight text-white">{people.filter(p => p.status === 'VISITOR' || p.status === 'WEAK' || p.status === 'INACTIVE').length}</p>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Reachout</p>
              </div>
            </div>
          </div>

          {/* UPCOMING MILESTONES */}
          <div className="bg-white border border-slate-200 rounded shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <IconCake className="w-4 h-4 text-slate-400" stroke={1.5} />
              <h3 className="font-semibold text-sm text-slate-900">Ulang Tahun</h3>
            </div>
            <div className="p-0">
              {milestones.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {milestones.slice(0, 5).map((m, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <span className="font-bold text-sm text-slate-900">{m.full_name}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {m.days_until === 0 ? 'HARI INI' : `${m.days_until} Hari`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">Belum ada yang ulang tahun dalam waktu dekat.</p>
              )}
            </div>
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
        submitLabel="Simpan Perubahan"
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
        <div className="space-y-6 pt-2">
          {passwordError && (
            <div className="p-3 rounded bg-[#FDEBEC] border border-[#FDEBEC] text-[#9F2F2D] text-xs font-medium">
              {passwordError}
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Ubah Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </FormPanel>

    </div>
  );
}
