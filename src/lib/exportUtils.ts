import { Person, WeeklyStat } from './types';
import { toLocalDateValue } from './dateUtils';

function csvCell(value: string | number | null | undefined): string {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportPeopleToCSV(people: Person[]): void {
  if (!people || people.length === 0) {
    alert('Belum ada data disciple untuk di-export.');
    return;
  }

  const headers = ['Nama Lengkap', 'Gender', 'Status', 'Kampus/Asal', 'Nomor Telepon', 'Stage BA', 'Catatan'];
  const rows = people.map(p => [
    csvCell(p.full_name),
    csvCell(p.gender),
    csvCell(p.status),
    csvCell(p.campus || '-'),
    csvCell(p.phone_number || '-'),
    csvCell(p.study_stage || '-'),
    csvCell(p.notes || '-')
  ]);

  const csvContent = `\uFEFF${[headers.map(csvCell).join(','), ...rows.map(r => r.join(','))].join('\r\n')}`;
  downloadFile(csvContent, `Data_Disciple_GKDI_Tugu_${toLocalDateValue()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportStatsToCSV(stats: WeeklyStat[]): void {
  if (!stats || stats.length === 0) {
    alert('Belum ada data statistik untuk di-export.');
    return;
  }

  const headers = ['Tanggal', 'Group', 'Active Disciples', 'Missing Ibadah', 'Reachout', 'Visitor Ibadah', 'Visitor Acara', 'Baptis', 'Catatan'];
  const rows = stats.map(s => [
    csvCell(s.week_date),
    csvCell(s.group_name || 'Group'),
    csvCell(s.active_disciples_count),
    csvCell(s.missing_ibadah_count),
    csvCell(s.reachout_count),
    csvCell(s.sunday_visitors_count),
    csvCell(s.event_visitors_count),
    csvCell(s.baptisms_count),
    csvCell(s.notes || '-')
  ]);

  const csvContent = `\uFEFF${[headers.map(csvCell).join(','), ...rows.map(r => r.join(','))].join('\r\n')}`;
  downloadFile(csvContent, `Laporan_Statistik_GKDI_Tugu_${toLocalDateValue()}.csv`, 'text/csv;charset=utf-8;');
}

function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
