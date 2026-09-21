# TUGU APP - PROJECT CONTEXT & HANDOVER DOCUMENT

Dokumen ini dibuat khusus untuk memberikan konteks **SANGAT DETAIL** kepada AI Agent penerus yang akan melanjutkan pengembangan project "Tugu". Baca dokumen ini secara menyeluruh sebelum menyentuh kode.

---

## 1. TENTANG APLIKASI (APP CONTEXT)
**Nama Aplikasi:** Tugu (Aplikasi PDG / Ministry Tracking)
**Tujuan:** Sistem informasi dan manajemen untuk gereja / persekutuan mahasiswa (youth ministry). Aplikasi ini digunakan untuk mendata anggota (Disciple, Visitor, Studyan), melacak statistik ibadah mingguan (Absensi, Reachout, Visitor), mencatat log Belajar Alkitab (BA), serta mengatur hierarki grup (Small Group / PDG) dan proses serah terima (handover) kepemimpinan.

---

## 2. TECH STACK
* **Framework:** Next.js (App Router, versi 14/15) + React
* **Bahasa:** TypeScript
* **Styling:** Tailwind CSS
* **Database & BaaS:** Supabase (PostgreSQL, Supabase Auth)
* **Visualisasi Chart:** Recharts (`AreaChart` untuk analitik tren visitor & reachout)
* **Iconography:** `@tabler/icons-react`
* **Lainnya:** `canvas-confetti` (untuk UI feedback), Ekspor data ke CSV.

---

## 3. ARSITEKTUR KODE (NEW SOLID REFACTOR)
Sebelumnya, project ini menggunakan *God Object* (semua ditaruh di `src/lib/supabase.ts` dan file UI tunggal). Kami baru saja menyelesaikan **Refactoring Besar (SOLID / Single Responsibility Principle)**.

### A. Struktur Folder API / Services
Semua logika pemanggilan Supabase dipisah ke `src/lib/services/`:
* `core.ts` : Konfigurasi Supabase Client & fallback `localStorage`.
* `auth.ts` : Handle login & manajemen user.
* `people.ts` : CRUD tabel `people` dan `bible_study_logs`. *(Ini baru saja diupdate untuk mendukung `mentor_id`)*.
* `groups.ts` : CRUD grup dan manajemen anggota grup.
* `stats.ts` : Logika penyimpanan Statistik Mingguan (Weekly Stats, Absensi, Progress BA).
* `events.ts` & `announcements.ts` : Manajemen acara dan pengumuman.

*(Catatan: `src/lib/supabase.ts` saat ini masih bertindak sebagai **Barrel File** yang mengekspor ulang (re-export) semua fungsi dari service di atas agar import di UI tidak rusak).*

### B. Struktur UI Components
Komponen UI yang dulunya raksasa (>600 baris) sudah dibelah menjadi modular:
* `src/components/StatistikaView.tsx` kini hanya bertindak sebagai *Parent*. Logika isinya ada di:
  * `Statistika/StatistikaForm.tsx` (Form pelaporan absen mingguan)
  * `Statistika/StatistikaAnalytics.tsx` (Grafik trend Recharts)
  * `Statistika/StatistikaHistory.tsx` (Tabel riwayat statistik)
* `src/components/GroupsView.tsx` kini jauh lebih ringan karena modal-modalnya dipisah ke:
  * `Groups/GroupFormModal.tsx`
  * `Groups/GroupHandoverModal.tsx` (Logic serah terima Leader, alasan pindah, riwayat utuh)
  * `Groups/GroupMembersModal.tsx` (Centang masuk-keluarnya anggota grup)

---

## 4. SKEMA DATABASE UTAMA (SUPABASE)
*(Gunakan referensi `src/lib/types.ts` untuk melihat struktur Type/Interface-nya secara detail)*

1. **`people`**: Menyimpan data individu (Person).
   * Kolom penting: `id`, `full_name`, `gender` (BROTHER/SISTER), `status` (LEADER, DISCIPLE, BIBLE_STUDY, VISITOR, WEAK, INACTIVE), `campus`, `birth_date`, `baptism_date`, `study_stage`.
2. **`groups`**: Menyimpan data PDG.
   * Kolom penting: `id`, `group_name`, `category`, `leader_id`, `baptism_goal`.
3. **`group_members`**: Tabel relasi *many-to-many* antara Grup dan People.
4. **`weekly_stats`**: Menyimpan laporan mingguan grup.
   * Kolom penting: `group_id`, `week_date`, `active_disciples_count`, `sunday_visitors_count`, `reachout_count`, `baptisms_count`, dsb. Memiliki *UNIQUE Constraint* pada `(group_id, week_date)` untuk mencegah duplikasi, dan di-handle dengan `upsert` Supabase.
5. **`bible_study_logs`**: Melacak sesi Belajar Alkitab (BA).
   * **[UPDATE TERBARU]**: Menambahkan kolom `mentor_id (UUID REFERENCES people(id))` untuk mendata SIAPA yang mem-BA murid tersebut pada sesi terkait.

---

## 5. PROGRESS TERAKHIR SEBELUM HANDOVER INI
1. **Perbaikan UX Saving:** Tombol *Simpan & Copy WA* di UI Statistika sekarang tidak menyebabkan aplikasi nge-*freeze* atau reload sembarangan. Sudah dioptimalkan menggunakan state `saving` dan asinkronus `onRefreshData`.
2. **Refactoring SOLID 100%:** Memecah `supabase.ts`, `GroupsView.tsx`, dan `StatistikaView.tsx` menjadi pecahan kecil agar AI penerus lebih mudah mengedit tanpa merusak baris yang tidak relevan.
3. **Penambahan Fitur Mentor ID (BA Log):**
   * Membuat file `add_mentor_id.sql` agar User mengeksekusinya di Supabase.
   * Update type `WeeklyStudyProgressLog` dengan `mentor_id?: string`.
   * Update `saveBibleStudyLog` di `people.ts` untuk mem-*parsing* `mentor_id`.
   * Update Form *Catat BA* di `PeopleView.tsx` untuk menyertakan elemen `<select>` dropdown Mentor (di-filter hanya menampilkan Leader & Disciple).

---

## 6. FITUR ANDALAN YANG HARUS DIJAGA KUALITASNYA
* **Generate WA Text:** Terdapat logika di mana aplikasi otomatis mengubah laporan form menjadi *template* Markdown untuk WhatsApp (lengkap dengan nama absensi & reason-nya). Jangan merusak formatter ini.
* **Handover Leader:** Jika ketua grup lulus/pindah, fitur ini mengalihkan kepemimpinan *tanpa* menghapus history grup tersebut.
* **UI States:** Banyak form memiliki `<optgroup>` spesifik (seperti Alasan Missing: Sakit, MIA, Tugas Kampus).
* **Caching & Fallback:** Pada `core.ts`, masih terdapat sistem `getLocalData` dan `setLocalData` peninggalan versi lawas. Pertahankan dengan hati-hati.

---

## 7. NEXT STEPS / TODO LIST (REKOMENDASI IDE)
AI Agent selanjutnya dapat langsung mengerjakan ide-ide berikut bersama User:
1. **Widget Ulang Tahun & HUT Rohani:** Membuat dashboard card *"Yang Ulang Tahun / HUT Rohani Minggu Ini"* berdasarkan data `birth_date` & `baptism_date` yang ada di database.
2. **Sistem Alert "MIA" (Missing In Action):** Menambahkan detektor otomatis jika ada `DISCIPLE` yang absen 3 minggu berturut-turut untuk diberi flag merah agar Leader bisa mem-follow up.
3. **Tab Prayer Requests (Pokok Doa):** Bikin fitur baru di Detail Grup untuk melacak pokok doa anggota grup, tidak hanya metrik angka/absen saja.

---
**PESAN UNTUK AI AGENT BARU:**
* *"Konteks codebase ini sudah sangat clean berkat penerapan Single Responsibility Principle. Jangan buat God Object lagi! Jika ada fitur kompleks baru, pisahkan menjadi komponen atau service baru. You've got this! Semangat codingnya!"*
