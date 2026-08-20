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
      case 'LEADER': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'DISCIPLE': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'BIBLE_STUDY': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'VISITOR': return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
      case 'WEAK': return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'INACTIVE': return 'bg-slate-100 text-slate-500 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const statusLabel = person.status === 'BIBLE_STUDY' ? 'Studyan' : person.status;

  return (
    <FormPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Disciple"
      cancelLabel="Tutup"
    >
      <div className="space-y-6">
        {/* Header Profile */}
        <div className="flex items-start justify-between bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{person.full_name}</h2>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${person.gender === 'BROTHER' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-pink-100 text-pink-700 border-pink-200'}`}>
                {person.gender}
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusBadgeClass(person.status)}`}>
                {statusLabel}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { onClose(); onEdit(person); }}
            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-2xl text-indigo-600 transition-colors shadow-sm"
            title="Edit Profil"
          >
            <IconEdit className="w-5 h-5" stroke={2} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-3">
          {person.phone_number && (
            <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-500"><IconPhone className="w-5 h-5" stroke={2} /></div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nomor HP</p>
                <p className="text-sm font-bold text-slate-900">{person.phone_number}</p>
              </div>
            </div>
          )}
          {person.campus && (
            <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-500"><IconSchool className="w-5 h-5" stroke={2} /></div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Kampus / Univ</p>
                <p className="text-sm font-bold text-slate-900">{person.campus}</p>
              </div>
            </div>
          )}
          {['DISCIPLE', 'LEADER', 'WEAK'].includes(person.status) && (
            <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500"><IconUsersGroup className="w-5 h-5" stroke={2} /></div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Grup PDG</p>
                <p className="text-sm font-bold text-slate-900">{group ? group.group_name : 'Belum Ada Grup'}</p>
              </div>
            </div>
          )}
          {(person.birth_date || person.baptism_date) && (
            <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-500"><IconCalendarEvent className="w-5 h-5" stroke={2} /></div>
              <div className="w-full">
                {person.birth_date && (
                  <div className="flex justify-between w-full items-center">
                    <span className="text-xs font-bold text-slate-500">Lahir Jasmani</span>
                    <span className="text-xs font-extrabold text-slate-900">{new Date(person.birth_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                  </div>
                )}
                {person.baptism_date && (
                  <div className="flex justify-between w-full items-center mt-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500">Lahir Rohani (Baptis)</span>
                    <span className="text-xs font-extrabold text-slate-900">{new Date(person.baptism_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {person.notes && (
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl shadow-sm">
            <h3 className="text-[10px] uppercase font-black tracking-widest text-amber-800 mb-2">Catatan Tambahan</h3>
            <p className="text-sm font-medium text-amber-950 leading-relaxed">{person.notes}</p>
          </div>
        )}

        {/* Spiritual Tracking Section (BA & Follow-up) */}
        {(person.status !== 'INACTIVE') && (
          <div className="pt-6 border-t border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <IconBook className="w-5 h-5 text-indigo-400" />
                {['DISCIPLE', 'LEADER', 'WEAK'].includes(person.status) ? 'Follow-up Study' : 'Belajar Alkitab'}
              </h3>
              <button 
                type="button"
                onClick={() => { onClose(); onTrackBA(person); }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                + Catat Progress
              </button>
            </div>

            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl shadow-inner">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Stage Saat Ini</p>
              <p className="text-base font-extrabold text-amber-900">{person.study_stage || 'Belum mulai'}</p>
            </div>

            {person.study_history && person.study_history.length > 0 && (
              <div className="space-y-3 mt-4">
                {person.study_history.slice().reverse().map(log => (
                  <div key={log.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-900">Minggu {log.week_number}: {log.lesson_topic}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.study_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                    </div>
                    {log.notes && <p className="text-xs font-medium text-slate-600 leading-relaxed">{log.notes}</p>}
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
