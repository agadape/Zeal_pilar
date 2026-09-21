# Tugu Leaders Portal — Technical Documentation

## Runtime flow

1. Middleware memperbarui cookie Supabase dan mengarahkan user tanpa sesi ke `/login`.
2. `src/app/page.tsx` mengambil people, groups, stats, announcements, events, d-Tree, dan profile secara paralel.
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
- `dtree_settings` menyimpan dua Pemimpin Jemaat sebagai akar global.
- `mentorship_relationships` menyimpan pembimbing utama, pembimbing pendamping, dan histori relasi yang sudah berakhir.
- Posisi leader grup tidak disimpan sebagai relasi. Leader otomatis menjadi cabang pertama di bawah Pemimpin Jemaat sesuai gender.

## d-Tree invariants

- Satu orang hanya boleh berada dalam satu grup aktif, termasuk sebagai leader.
- Pembimbing dan anggota wajib berada di grup serta gender yang sama.
- Satu anggota hanya memiliki satu pembimbing utama aktif, tetapi boleh memiliki beberapa pembimbing pendamping.
- Leader grup berada langsung di bawah Pemimpin Jemaat dan tidak memiliki pembimbing utama tersimpan.
- Database menolak self-mentoring, relasi aktif duplikat, dan siklus pembimbingan.
- Mutation perpindahan memakai RPC agar relasi lama ditutup dan relasi baru dibuat dalam satu transaction.
- Penghapusan anggota dari grup mengakhiri relasi aktifnya. Handover menempatkan leader lama sebagai anggota belum ditempatkan.

## Authorization

RLS bersifat permissive/OR. Tidak boleh ada policy `ALL USING (true)` bersama policy aman. Migrasi alignment menghapus seluruh policy lama tersebut.

- Semua user authenticated dapat membaca data operasional yang dibutuhkan portal.
- Admin mengelola people, pembuatan/penghapusan grup, event, history, dan akun.
- Group leader mengelola member dan statistik grup yang dipimpinnya.
- Group leader dapat mencatat BA dan membuat pengumuman.
- Author dapat mengubah/menghapus pengumumannya sendiri.
- Semua user authenticated dapat melihat d-Tree. Semua Group Leader dapat mengelola seluruh relasi d-Tree. Hanya Admin dapat mengganti pasangan Pemimpin Jemaat.

Server action `createLeaderAccount` dan `resetLeaderPassword` memverifikasi Super Admin dari sesi server sebelum membuat admin client.

## Local development fallback

Jika URL/key Supabase kosong, service memakai LocalStorage dengan prefix `tugu_*`. Jika Supabase dikonfigurasi namun request gagal, service tidak boleh jatuh ke LocalStorage. Tombol Refresh hanya menghapus key milik Tugu, bukan seluruh storage origin.

## Known boundaries

- Update anggota grup menghitung diff sebelum delete/insert, tetapi rangkaian diff tersebut belum dibungkus satu RPC transaction.
- Belum ada test automation untuk RLS dan server actions.
- Legacy columns `auth_id` dan `is_admin` belum dihapus agar deployment backward-compatible.
- PWA service worker masih network-only dan belum menyediakan offline cache penuh.
