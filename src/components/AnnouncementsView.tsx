'use client';

import { useState } from 'react';
import { Announcement } from '@/lib/types';
import { Megaphone, Pin, Plus, X, Check, Heart, ShieldCheck } from 'lucide-react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onSaveAnnouncement: (announcement: Omit<Announcement, 'id'> & { id?: string }) => Promise<void>;
}

export default function AnnouncementsView({ announcements, onSaveAnnouncement }: AnnouncementsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await onSaveAnnouncement({
      title: title.trim(),
      author_name: authorName.trim() || 'Leader',
      content: content.trim(),
      is_pinned: isPinned
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Visi & Pengumuman Tugu</h1>
          <p className="text-sm text-slate-400">Pengarahan pelayanan dari Babeh (Om Hendra) & BPC, pengumuman resmi, serta pengingat Saat Teduh.</p>
        </div>
        <button
          onClick={() => {
            setTitle('');
            setAuthorName('Om Hendra (Babeh)');
            setContent('');
            setIsPinned(true);
            setIsModalOpen(true);
          }}
          className="btn-glow px-4 py-2.5 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-white/10 hover:bg-slate-200"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>

      {/* SPIRITUAL CHECKIN BANNER */}
      <div className="glass-panel p-6 rounded-2xl border border-white/15 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 space-y-3">
        <div className="flex items-center space-x-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Tugu Leadership Commitment</span>
        </div>
        <p className="text-sm text-slate-300">
          Sebagai pemimpin small group (Tugu Leader), mari jaga disiplin rohani harian kita: <strong>Saat Teduh (ST)</strong> rutin setiap pagi dan ketaatan <strong>Perpuluhan</strong> bulanan.
        </p>
      </div>

      {/* ANNOUNCEMENTS LIST */}
      <div className="space-y-4">
        {announcements.map(an => (
          <div 
            key={an.id} 
            className={`glass-panel p-6 rounded-2xl border space-y-3 transition-all ${
              an.is_pinned 
                ? 'border-white/30 bg-white/10' 
                : 'border-white/10'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {an.is_pinned && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1 uppercase">
                      <Pin className="w-3 h-3" />
                      <span>PINNED VISION</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">Dari: {an.author_name}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{an.title}</h3>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {an.content}
            </p>
          </div>
        ))}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/20 space-y-6 animate-fade-in bg-zinc-950">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Buat Pengumuman / Visi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Visi Rumah Tuhan & Kampus Outreach"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nama Pembuat / Author *</label>
                <input
                  type="text"
                  required
                  placeholder="Om Hendra (Babeh) / Bang Daniel / BPC"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Isi Pengumuman *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan arahan pelayanan, firman, atau informasi penting..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pin"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                  className="rounded bg-zinc-900 border-white/20 text-white focus:ring-0"
                />
                <label htmlFor="pin" className="text-xs text-slate-300 cursor-pointer">
                  Pin pengumuman ini di paling atas
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-glow px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
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
