'use client';

import { useState } from 'react';
import { Announcement } from '@/lib/types';
import { 
  IconSpeakerphone, 
  IconPlus, 
  IconPin, 
  IconFlame, 
  IconUserCheck, 
  IconBook, 
  IconSparkles,
  IconTrash
} from '@tabler/icons-react';
import FormPanel from './FormPanel';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onSaveAnnouncement: (announcement: Omit<Announcement, 'id' | 'author_name'> & { id?: string }) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
}

export default function AnnouncementsView({ announcements, onSaveAnnouncement, onDeleteAnnouncement }: AnnouncementsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    await onSaveAnnouncement({
      title: title.trim(),
      content: content.trim(),
      is_pinned: isPinned
    });
    setSubmitting(false);
    setTitle('');
    setContent('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-5xl mx-auto">
      
      {/* HEADER - Playful & Modern */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/40">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Visi & Pengumuman 📣
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Pusat visi kerohanian ZEAL Tugu Jogja, komitmen, dan pengumuman resmi leadership.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-500/30 flex items-center space-x-2 transition-transform hover:-translate-y-0.5 shrink-0"
        >
          <IconPlus className="w-5 h-5" stroke={2} />
          <span>Buat Pengumuman</span>
        </button>
      </div>

      {/* SPIRITUAL COMMITMENT BANNER - GKDI PILLARS */}
      <div className="p-6 sm:p-8 rounded-[2rem] border-2 border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 space-y-6 shadow-sm">
        <div className="flex items-center space-x-2 text-amber-900 font-black text-sm uppercase tracking-widest bg-white/50 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
          <IconFlame className="w-5 h-5 text-orange-500" stroke={2.5} />
          <span>Pilar Kerohanian Leaders Tugu Jogja</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-3xl bg-white border border-amber-50 space-y-2 shadow-lg shadow-amber-200/40 transition-transform hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <IconBook className="w-6 h-6" stroke={2} />
            </div>
            <h4 className="text-slate-900 font-black text-base tracking-tight">Saat Teduh Harian</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Memulai setiap hari dengan doa dan perenungan Firman Tuhan secara konsisten.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-amber-50 space-y-2 shadow-lg shadow-amber-200/40 transition-transform hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4">
              <IconUserCheck className="w-6 h-6" stroke={2} />
            </div>
            <h4 className="text-slate-900 font-black text-base tracking-tight">Discipleship 1-on-1</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Memuridkan dengan keterbukaan dan bimbingan personal yang mengubahkan hidup.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-amber-50 space-y-2 shadow-lg shadow-amber-200/40 transition-transform hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <IconSparkles className="w-6 h-6" stroke={2} />
            </div>
            <h4 className="text-slate-900 font-black text-base tracking-tight">Membangun Rumah Tuhan</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Menjaga kebersamaan, semangat outreach yang menyala, dan ketaatan perpuluhan.
            </p>
          </div>
        </div>
      </div>

      {/* ANNOUNCEMENTS LIST */}
      <div className="space-y-5">
        {announcements.length === 0 ? (
          <div className="py-24 text-center bg-white/50 rounded-[2rem] border-2 border-slate-200 border-dashed backdrop-blur-sm">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50">
              <IconSpeakerphone className="w-10 h-10 text-slate-300" stroke={1.5} />
            </div>
            <p className="text-slate-800 font-extrabold text-lg">Belum ada pengumuman! 🤷‍♂️</p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Klik &quot;Buat Pengumuman&quot; untuk menyampaikan visi atau arahan.</p>
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="p-6 sm:p-8 rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/40 space-y-4 relative group hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {a.is_pinned && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                      <IconPin className="w-3.5 h-3.5" stroke={2.5} />
                      <span>PINNED</span>
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    Oleh: {a.author_name}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm('Yakin ingin menghapus pengumuman ini?')) onDeleteAnnouncement(a.id);
                  }}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-400 transition-all shadow-sm self-end sm:self-auto"
                >
                  <IconTrash className="w-5 h-5" stroke={2} />
                </button>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">{a.title}</h3>
                <div className="pt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {new Date(a.created_at || Date.now()).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-loose font-medium whitespace-pre-wrap">
                {a.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      <FormPanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Pengumuman Baru"
        onSubmit={handleSubmit}
        submitLabel="Simpan Pengumuman"
        isSubmitDisabled={submitting}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Judul Pengumuman *</label>
            <input
              type="text"
              required
              placeholder="Judul visi atau pengumuman..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Isi Pengumuman *</label>
            <textarea
              rows={5}
              required
              placeholder="Pesan visi atau arahan kegiatan..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 resize-none focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 cursor-pointer" onClick={() => setIsPinned(!isPinned)}>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
              isPinned ? 'bg-amber-500 border-amber-500 text-white' : 'border-amber-300 bg-white'
            }`}>
              {isPinned && <IconPin className="w-4 h-4" stroke={2.5} />}
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Pin Pengumuman</p>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-0.5">Tampilkan di paling atas halaman</p>
            </div>
          </div>
        </div>
      </FormPanel>

    </div>
  );
}
