# Tugu Leaders Portal — Technical Documentation

## Runtime flow

1. Middleware memperbarui cookie Supabase dan mengarahkan user tanpa sesi ke `/login`.
2. `src/app/page.tsx` mengambil people, groups, stats, announcements, events, dan profile secara paralel.
3. Profile dicari melalui `auth_user_id`; `auth_id` hanya fallback transisi.
4. View menerima data dan handler dari root orchestrator.
5. Mutation service melempar error Supabase. Root menampilkan error dan hanya reload data setelah mutation berhasil.

## Data model

- `people` menyimpan profil, status ministry, tanggal lahir/baptis, identitas auth, dan role.
- `bible_study_logs` menyimpan sesi BA; `mentor_id` menunjuk mentor sesi.
- `groups` dan `group_members` membentuk struktur PDG.
- `group_leadership_history` menyimpan masa jabatan; trigger menangani assignment awal dan handover.
- `weekly_stats` adalah header unik per grup/tanggal; absence dan study progress disimpan pada tabel relasi.
- `events` menyimpan metadata dan `event_rosters` menyimpan assignment pelayanan.
- `announcements.author_id` dipakai RLS; `author_name` adalah snapshot display.

## Authorization

RLS bersifat permissive/OR. Tidak boleh ada policy `ALL USING (true)` bersama policy aman. Migrasi alignment menghapus seluruh policy lama tersebut.

- Semua user authenticated dapat membaca data operasional yang dibutuhkan portal.
- Admin mengelola people, pembuatan/penghapusan grup, event, history, dan akun.
- Group leader mengelola member dan statistik grup yang dipimpinnya.
- Group leader dapat mencatat BA dan membuat pengumuman.
- Author dapat mengubah/menghapus pengumumannya sendiri.

Server action `createLeaderAccount` dan `resetLeaderPassword` memverifikasi Super Admin dari sesi server sebelum membuat admin client.

## Local development fallback

Jika URL/key Supabase kosong, service memakai LocalStorage dengan prefix `tugu_*`. Jika Supabase dikonfigurasi namun request gagal, service tidak boleh jatuh ke LocalStorage. Tombol Refresh hanya menghapus key milik Tugu, bukan seluruh storage origin.

## Known boundaries

- Penggantian seluruh anggota grup masih berupa delete lalu insert dan belum dibungkus database transaction/RPC.
- Belum ada test automation untuk RLS dan server actions.
- Legacy columns `auth_id` dan `is_admin` belum dihapus agar deployment backward-compatible.
- PWA service worker masih network-only dan belum menyediakan offline cache penuh.
