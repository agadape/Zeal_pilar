import { Person, Group } from '@/lib/types';
import FormPanel from './FormPanel';
import { 
  IconPhone, 
  IconSchool, 
  IconUsersGroup, 
  IconBook, 
  IconEdit, 
  IconCalendarEvent
} from '@tabler/icons-react';

interface PersonDetailPanelProps {
  person: Person | null;
  group?: Group;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (p: Person) => void;
  onTrackBA: (p: Person) => void;
}

export default function PersonDetailPanel({ person, group, isOpen, onClose, onEdit, onTrackBA }: PersonDetailPanelProps) {
  if (!person) return null;

  const getStatusBadgeClass = (st: string) => {
    switch (st) {
      case 'LEADER': return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'DISCIPLE': return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'BIBLE_STUDY': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'VISITOR': return 'bg-cyan-100 text-cyan-900 border-cyan-200';
      case 'WEAK': return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'INACTIVE': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const statusLabel = person.status === 'BIBLE_STUDY' ? 'Belajar Alkitab' : person.status;

  return (
    <FormPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Jemaat"
      cancelLabel="Tutup"
    >
      <div className="space-y-6">
        {/* Header Profile */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{person.full_name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${person.gender === 'BROTHER' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-pink-50 text-pink-800 border-pink-200'}`}>
                {person.gender}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getStatusBadgeClass(person.status)}`}>
                {statusLabel}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { onClose(); onEdit(person); }}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
            title="Edit Profil"
          >
            <IconEdit className="w-4 h-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-3">
          {person.phone_number && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><IconPhone className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Nomor HP</p>
                <p className="text-sm font-semibold text-slate-900">{person.phone_number}</p>
              </div>
            </div>
          )}
          {person.campus && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><IconSchool className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Kampus / Univ</p>
                <p className="text-sm font-semibold text-slate-900">{person.campus}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><IconUsersGroup className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Kelompok PDG</p>
              <p className="text-sm font-semibold text-slate-900">{group ? group.group_name : 'Belum Ada Kelompok'}</p>
            </div>
          </div>
          {(person.birth_date || person.baptism_date) && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><IconCalendarEvent className="w-4 h-4" /></div>
              <div className="w-full">
                {person.birth_date && (
                  <div className="flex justify-between w-full">
                    <span className="text-xs font-semibold text-slate-600">Lahir Jasmani</span>
                    <span className="text-xs font-bold text-slate-900">{new Date(person.birth_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                  </div>
                )}
                {person.baptism_date && (
                  <div className="flex justify-between w-full mt-1">
                    <span className="text-xs font-semibold text-slate-600">Lahir Rohani (Baptis)</span>
                    <span className="text-xs font-bold text-slate-900">{new Date(person.baptism_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {person.notes && (
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
            <h3 className="text-[10px] uppercase font-bold text-amber-800 mb-1">Catatan Tambahan</h3>
            <p className="text-xs text-amber-950">{person.notes}</p>
          </div>
        )}

        {/* Bible Study Section */}
        {(person.status === 'BIBLE_STUDY' || (person.study_history && person.study_history.length > 0)) && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <IconBook className="w-4 h-4 text-[#b5852e]" />
                Progress Belajar Alkitab
              </h3>
              <button 
                type="button"
                onClick={() => { onClose(); onTrackBA(person); }}
                className="text-[10px] font-bold text-[#b5852e] hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors"
              >
                + Catat Progress Baru
              </button>
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-amber-800 uppercase">Stage Saat Ini</p>
              <p className="text-sm font-bold text-slate-900">{person.study_stage || 'Belum mulai'}</p>
            </div>

            {person.study_history && person.study_history.length > 0 && (
              <div className="space-y-2 mt-3">
                {person.study_history.slice().reverse().map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-900">Minggu {log.week_number}: {log.lesson_topic}</span>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(log.study_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                    </div>
                    {log.notes && <p className="text-[11px] text-slate-600">{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </FormPanel>
  );
}
