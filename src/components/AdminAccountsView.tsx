'use client';

import { useState } from 'react';
import { Person } from '@/lib/types';
import { createLeaderAccount } from '@/app/actions';
import { 
  IconShieldLock, 
  IconUserPlus, 
  IconCheck, 
  IconAlertCircle,
  IconKey
} from '@tabler/icons-react';
import FormPanel from './FormPanel';

interface AdminAccountsViewProps {
  currentUser: Person | null;
  people: Person[];
  onRefreshData: () => Promise<void>;
}

export default function AdminAccountsView({ currentUser, people, onRefreshData }: AdminAccountsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  // Only allow SUPER_ADMIN to see this
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-red-200">
        <IconShieldLock className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Ditolak</h2>
        <p className="text-sm text-slate-500">Hanya Super Admin yang dapat mengakses halaman manajemen akun.</p>
      </div>
    );
  }

  // Find all people who are leaders but don't have an auth_id yet
  const unlinkedLeaders = people.filter(p => p.status === 'LEADER' && !p.auth_id);
  // Find all people who already have accounts
  const linkedAccounts = people.filter(p => p.auth_id);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-3">
            <IconShieldLock className="w-7 h-7 text-indigo-600 shrink-0" stroke={1.5} />
            <span>Manajemen Akun</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Buat dan kelola akses login untuk para Leader.</p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setSuccessMsg('');
            setIsModalOpen(true);
          }}
          className="btn-tactile bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-sm border border-indigo-700 flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all"
        >
          <IconUserPlus className="w-4 h-4" stroke={2} />
          <span>Buat Akun Leader</span>
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3">
        <IconAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900">
          <strong>Perhatian:</strong> Fitur pembuatan akun membutuhkan <code>SUPABASE_SERVICE_ROLE_KEY</code> yang diatur di Environment Variables Vercel kamu.
        </div>
      </div>

      {/* LINKED ACCOUNTS LIST */}
      <div className="tugu-card bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <IconKey className="w-4 h-4 text-emerald-600" />
            <span>Leader dengan Akses Login ({linkedAccounts.length})</span>
          </h3>
        </div>
        <div className="divide-y divide-slate-50">
          {linkedAccounts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Belum ada akun yang terdaftar selain milikmu.</div>
          ) : (
            linkedAccounts.map(person => (
              <div key={person.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{person.full_name}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">Role: {person.role || 'MEMBER'}</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  TERHUBUNG
                </span>
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
        onSubmit={handleSubmit}
        submitLabel="Buat Akun"
        isSubmitDisabled={submitting || !email || !password || !selectedPersonId}
      >
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
            <IconAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start space-x-2">
            <IconCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Pilih Leader (Tanpa Akun)</label>
          <select
            value={selectedPersonId}
            onChange={e => setSelectedPersonId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
            required
          >
            <option value="">-- Pilih Nama Leader --</option>
            {unlinkedLeaders.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
          {unlinkedLeaders.length === 0 && (
            <p className="text-[10px] text-amber-600 mt-1">Semua Leader di tabel People sudah punya akun, atau belum ada yang berstatus LEADER.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Email Login</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="contoh: budi.leader@gmail.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Password Sementara</label>
          <input
            type="text"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
          />
        </div>

      </FormPanel>

    </div>
  );
}
