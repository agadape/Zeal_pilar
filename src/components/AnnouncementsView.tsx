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
   
  } from '@tabler/icons-react';
import FormPanel from './FormPanel';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onSaveAnnouncement: (announcement: Omit<Announcement, 'id'> & { id?: string }) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
}

export default function AnnouncementsView({ announcements, onSaveAnnouncement, onDeleteAnnouncement }: AnnouncementsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    await onSaveAnnouncement({
      title: title.trim(),
      author_name: authorName.trim() || 'Tugu Leader',
      content: content.trim(),
      is_pinned: isPinned
    });
    setSubmitting(false);
    setTitle('');
    setContent('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-3">
            <IconSpeakerphone className="w-7 h-7 text-[#b5852e] shrink-0" stroke={1.5} />
            <span>Visi & Pengumuman</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Pusat visi kerohanian ZEAL Tugu Jogja, komitmen Saat Teduh, dan pengumuman resmi leadership.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-tactile btn-primary shrink-0"
        >
          <IconPlus className="w-4 h-4" stroke={2} />
          <span>Buat Pengumuman</span>
        </button>
      </div>

      {/* SPIRITUAL COMMITMENT BANNER - GKDI PILLARS */}
      <div className="tugu-card p-6 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/30 space-y-4">
        <div className="flex items-center space-x-2 text-amber-900 font-mono text-xs font-bold uppercase tracking-wider">
          <IconFlame className="w-4 h-4 text-[#b5852e]" stroke={1.5} />
          <span>Pilar Kerohanian Leaders Tugu Jogja</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-amber-200/60 space-y-1 shadow-2xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <IconBook className="w-4 h-4 text-emerald-700" stroke={1.5} />
              <span>Saat Teduh Harian</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Memulai setiap hari dengan doa dan perenungan Firman Tuhan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-200/60 space-y-1 shadow-2xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <IconUserCheck className="w-4 h-4 text-cyan-700" stroke={1.5} />
              <span>Discipleship 1-on-1</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Memuridkan dengan keterbukaan dan bimbingan personal secara konsisten.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-200/60 space-y-1 shadow-2xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <IconSparkles className="w-4 h-4 text-purple-700" stroke={1.5} />
              <span>Membangun Rumah Tuhan</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Menjaga kebersamaan, semangat outreach, dan ketaatan perpuluhan tepat waktu.
            </p>
          </div>
        </div>
      </div>

      {/* ANNOUNCEMENTS LIST */}
      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="tugu-card p-6 rounded-3xl border border-slate-200 bg-white space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {a.is_pinned && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300/80 text-[10px] font-mono font-bold uppercase flex items-center space-x-1">
                    <IconPin className="w-3 h-3 text-[#b5852e]" stroke={1.5} />
                    <span>PINNED</span>
                  </span>
                )}
                <span className="text-xs text-slate-500 font-mono">Ditulis oleh: <strong className="text-slate-900">{a.author_name}</strong></span>
              </div>
              
              <button
                onClick={() => onDeleteAnnouncement(a.id)}
                className="btn-tactile text-xs text-rose-600 hover:text-rose-700 font-mono font-semibold"
              >
                Hapus
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{a.title}</h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{a.content}</p>

            <div className="pt-2 text-[10px] font-mono text-slate-400">
              Diposting: {new Date(a.created_at || Date.now()).toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      <FormPanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Pengumuman Baru"
        onSubmit={handleSubmit}
        submitLabel="Simpan Data"
        isSubmitDisabled={submitting}
      >
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Judul Pengumuman *</label>
          <input
            type="text"
            required
            placeholder="Judul visi atau pengumuman..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Nama Penulis</label>
          <input
            type="text"
            placeholder="Bang Daniel / Om Hendra"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#b5852e]"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-600 uppercase mb-1">Isi Pengumuman *</label>
          <textarea
            rows={4}
            required
            placeholder="Pesan visi atau arahan kegiatan..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 resize-none"
          />
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="pinCheck"
            checked={isPinned}
            onChange={e => setIsPinned(e.target.checked)}
            className="rounded bg-white border-slate-300 text-amber-600 focus:ring-0"
          />
          <label htmlFor="pinCheck" className="text-xs text-slate-700 font-mono font-medium">Pin pengumuman di paling atas</label>
        </div>
      </FormPanel>

    </div>
  );
}
