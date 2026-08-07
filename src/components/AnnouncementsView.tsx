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
  IconX, 
  IconCheck 
} from '@tabler/icons-react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onSaveAnnouncement: (announcement: Omit<Announcement, 'id'> & { id?: string }) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
}

export default function AnnouncementsView({ announcements, onSaveAnnouncement, onDeleteAnnouncement }: AnnouncementsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await onSaveAnnouncement({
      title: title.trim(),
      author_name: authorName.trim() || 'Tugu Leader',
      content: content.trim(),
      is_pinned: isPinned
    });
    setTitle('');
    setContent('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <IconSpeakerphone className="w-7 h-7 text-white shrink-0" stroke={1.5} />
            <span>Visi & Pengumuman</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">Pusat visi kerohanian ZEAL Tugu Jogja, komitmen Saat Teduh, dan pengumuman resmi leadership.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-tactile btn-primary shrink-0"
        >
          <IconPlus className="w-4 h-4" stroke={2} />
          <span>Buat Pengumuman</span>
        </button>
      </div>

      {/* SPIRITUAL COMMITMENT BANNER */}
      <div className="tugu-card p-6 rounded-2xl border border-white/15 bg-zinc-900/80 space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
          <IconFlame className="w-4 h-4 text-amber-400" stroke={1.5} />
          <span>Pilar Kerohanian Leaders Tugu Jogja</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <IconBook className="w-4 h-4 text-emerald-400" stroke={1.5} />
              <span>Saat Teduh Harian</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Memulai setiap hari dengan doa dan perenungan Firman Tuhan.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <IconUserCheck className="w-4 h-4 text-cyan-400" stroke={1.5} />
              <span>Discipleship 1-on-1</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Memuridkan dengan keterbukaan dan bimbingan personal secara konsisten.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <IconSparkles className="w-4 h-4 text-purple-400" stroke={1.5} />
              <span>Membangun Rumah Tuhan</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Menjaga kebersamaan, semangat outreach, dan ketaatan perpuluhan tepat waktu.
            </p>
          </div>
        </div>
      </div>

      {/* ANNOUNCEMENTS LIST */}
      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="tugu-card p-6 rounded-2xl border border-white/10 space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {a.is_pinned && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase flex items-center space-x-1">
                    <IconPin className="w-3 h-3" stroke={1.5} />
                    <span>PINNED</span>
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">Ditulis oleh: <strong className="text-white">{a.author_name}</strong></span>
              </div>
              
              <button
                onClick={() => onDeleteAnnouncement(a.id)}
                className="btn-tactile text-xs text-rose-400 hover:text-rose-300 font-mono"
              >
                Hapus
              </button>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">{a.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{a.content}</p>

            <div className="pt-2 text-[10px] font-mono text-slate-400">
              Diposting: {new Date(a.created_at || Date.now()).toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tugu-card w-full max-w-lg rounded-2xl p-6 border border-white/20 space-y-6 animate-fade-in bg-zinc-950">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Buat Pengumuman Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <IconX className="w-5 h-5" stroke={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  placeholder="Judul visi atau pengumuman..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Nama Penulis</label>
                <input
                  type="text"
                  placeholder="Bang Daniel / Om Hendra"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">Isi Pengumuman *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Pesan visi atau arahan kegiatan..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                  className="rounded bg-zinc-900 border-white/20 text-amber-500"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-300 font-mono">Pin pengumuman di paling atas</label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-tactile btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-tactile btn-primary"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
                  <span>Posting Pengumuman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
