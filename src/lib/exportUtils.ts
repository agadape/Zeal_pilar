import { Person, WeeklyStat } from './types';

export function exportPeopleToCSV(people: Person[]): void {
  if (!people || people.length === 0) {
    alert('Belum ada data jemaat untuk di-export.');
    return;
  }

  const headers = ['Nama Lengkap', 'Gender', 'Status', 'Kampus/Asal', 'Nomor Telepon', 'Stage BA', 'Catatan'];
  const rows = people.map(p => [
    `"${p.full_name.replace(/"/g, '""')}"`,
    `"${p.gender}"`,
    `"${p.status}"`,
    `"${(p.campus || '-').replace(/"/g, '""')}"`,
    `"${(p.phone_number || '-').replace(/"/g, '""')}"`,
    `"${(p.study_stage || '-').replace(/"/g, '""')}"`,
    `"${(p.notes || '-').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `Data_Jemaat_GKDI_Tugu_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportStatsToCSV(stats: WeeklyStat[]): void {
  if (!stats || stats.length === 0) {
    alert('Belum ada data statistik untuk di-export.');
    return;
  }

  const headers = ['Tanggal', 'Group', 'Active Disciples', 'Missing Ibadah', 'Reachout', 'Visitor Ibadah', 'Visitor Acara', 'Baptis', 'Catatan'];
  const rows = stats.map(s => [
    `"${s.week_date}"`,
    `"${(s.group_name || 'Group').replace(/"/g, '""')}"`,
    s.active_disciples_count,
    s.missing_ibadah_count,
    s.reachout_count,
    s.sunday_visitors_count,
    s.event_visitors_count,
    s.baptisms_count,
    `"${(s.notes || '-').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `Laporan_Statistik_GKDI_Tugu_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
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
}
