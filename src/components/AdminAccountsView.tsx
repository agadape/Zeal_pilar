'use client';

import { useState } from 'react';
import { Person } from '@/lib/types';
import { createLeaderAccount, resetLeaderPassword } from '@/app/actions';
import { 
  IconShieldLock, 
  IconUserPlus, 
  IconCheck, 
  IconAlertCircle,
  IconKey,
  IconRefresh
} from '@tabler/icons-react';
import FormPanel from './FormPanel';

interface AdminAccountsViewProps {
  currentUser: Person | null;
  people: Person[];
  onRefreshData: () => Promise<void>;
}

export default function AdminAccountsView({ currentUser, people, onRefreshData }: AdminAccountsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  // Only allow SUPER_ADMIN to see this
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="py-24 text-center bg-white/50 rounded-[2rem] border-2 border-red-100 border-dashed backdrop-blur-sm max-w-2xl mx-auto mt-10">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200/50">
          <IconShieldLock className="w-10 h-10 text-red-500" stroke={1.5} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Akses Ditolak 🛑</h2>
        <p className="text-sm text-slate-500 font-medium">Hanya Super Admin yang dapat mengakses halaman manajemen akun.</p>
      </div>
    );
  }

  const unlinkedLeaders = people.filter(p => p.status === 'LEADER' && !p.auth_id);
  const linkedAccounts = people.filter(p => p.auth_id);

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedPersonId) return;
    
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('person_id', selectedPersonId);

    const result = await createLeaderAccount(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setSubmitting(false);
    } else {
      setSuccessMsg('Akun berhasil dibuat dan disambungkan!');
      await onRefreshData();
      setTimeout(() => {
        setIsModalOpen(false);
        setEmail('');
        setPassword('');
        setSelectedPersonId('');
        setSuccessMsg('');
        setSubmitting(false);
      }, 1500);
    }
  };

  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !selectedPersonId) return;
    
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const targetPerson = people.find(p => p.id === selectedPersonId);
    if (!targetPerson?.auth_id) {
      setErrorMsg('User tidak memiliki auth_id yang valid.');
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('auth_id', targetPerson.auth_id);
    formData.append('password', password);

    const result = await resetLeaderPassword(formData);

    if (result?.error) {
      setErrorMsg(result.error);
      setSubmitting(false);
    } else {
      setSuccessMsg('Password berhasil direset!');
      setTimeout(() => {
        setIsResetModalOpen(false);
        setPassword('');
        setSelectedPersonId('');
        setSuccessMsg('');
        setSubmitting(false);
      }, 1500);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-4xl mx-auto">
      
      {/* HEADER - Playful & Modern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/40">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Manajemen Akun 🔐
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Buat dan kelola akses login untuk para Leader.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setSuccessMsg('');
            setIsModalOpen(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 flex items-center space-x-2 transition-transform hover:-translate-y-0.5 shrink-0"
        >
          <IconUserPlus className="w-5 h-5" stroke={2} />
          <span>Buat Akun Leader</span>
        </button>
      </div>

      <div className="bg-amber-100/50 border-2 border-amber-200 p-5 rounded-3xl flex items-start space-x-4 shadow-sm">
        <IconAlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" stroke={2} />
        <div className="text-sm text-amber-900 font-medium leading-relaxed">
          <strong>Perhatian:</strong> Fitur pembuatan akun dan reset password membutuhkan <code className="bg-amber-200 px-2 py-0.5 rounded-lg text-amber-800 font-bold">SUPABASE_SERVICE_ROLE_KEY</code> yang diatur di Environment Variables Vercel kamu.
        </div>
      </div>

      {/* LINKED ACCOUNTS LIST */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <IconKey className="w-5 h-5 text-emerald-500" stroke={2} />
            <span>Akses Login Aktif ({linkedAccounts.length})</span>
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {linkedAccounts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm font-bold">Belum ada akun yang terdaftar selain milikmu.</div>
          ) : (
            linkedAccounts.map(person => (
              <div key={person.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {person.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-base">{person.full_name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Role: {person.role || 'MEMBER'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                    TERHUBUNG
                  </span>
                  <button
                    onClick={() => {
                      setErrorMsg('');
                      setSuccessMsg('');
                      setSelectedPersonId(person.id);
                      setPassword('');
                      setIsResetModalOpen(true);
                    }}
                    className="p-2 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 rounded-xl text-slate-400 transition-all shadow-sm"
                    title="Reset Password"
                  >
                    <IconRefresh className="w-4 h-4" stroke={2} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE ACCOUNT MODAL */}
      <FormPanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Akun Login Leader"
        onSubmit={handleSubmitCreate}
        submitLabel="Buat Akun"
        isSubmitDisabled={submitting || !email || !password || !selectedPersonId}
      >
        <div className="space-y-5">
          {errorMsg && (
            <div className="p-4 bg-red-50 border-2 border-red-100 text-red-700 text-sm font-bold rounded-2xl flex items-start space-x-3">
              <IconAlertCircle className="w-5 h-5 shrink-0" stroke={2} />
              <span>{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 text-sm font-bold rounded-2xl flex items-start space-x-3">
              <IconCheck className="w-5 h-5 shrink-0" stroke={2} />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Leader (Tanpa Akun)</label>
            <select
              value={selectedPersonId}
              onChange={e => setSelectedPersonId(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
              required
            >
              <option value="">-- Pilih Nama Leader --</option>
              {unlinkedLeaders.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
            {unlinkedLeaders.length === 0 && (
              <p className="text-[10px] text-amber-600 font-bold mt-2 bg-amber-50 p-2 rounded-lg">Semua Leader di tabel People sudah punya akun, atau belum ada yang berstatus LEADER.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Login</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contoh: budi.leader@gmail.com"
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password Sementara</label>
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>
      </FormPanel>

      {/* RESET PASSWORD MODAL */}
      <FormPanel
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Password Leader"
        onSubmit={handleSubmitReset}
        submitLabel="Reset Password"
        isSubmitDisabled={submitting || !password || !selectedPersonId}
      >
        <div className="space-y-5">
          {errorMsg && (
            <div className="p-4 bg-red-50 border-2 border-red-100 text-red-700 text-sm font-bold rounded-2xl flex items-start space-x-3">
              <IconAlertCircle className="w-5 h-5 shrink-0" stroke={2} />
              <span>{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 text-sm font-bold rounded-2xl flex items-start space-x-3">
              <IconCheck className="w-5 h-5 shrink-0" stroke={2} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-xs font-bold text-amber-800">
              Reset password untuk: <span className="font-black text-amber-900">{people.find(p => p.id === selectedPersonId)?.full_name}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password Baru</label>
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>
      </FormPanel>

    </div>
  );
}
