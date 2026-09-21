# TUGU APP — Project Context & Handover

Dokumen ini adalah konteks utama untuk developer atau AI agent yang melanjutkan project Tugu. Kondisi database aktual tetap menjadi sumber kebenaran tertinggi; file migrasi repo menjelaskan cara menyelaraskannya.

## Produk

Tugu adalah portal internal ZEAL Youth & Campus Ministry GKDI Jogja. Aplikasi menangani data jemaat, grup PDG, statistik ibadah mingguan, reachout, visitor, baptisan, progres Belajar Alkitab, event pelayanan, milestone, dan pengumuman leadership.

## Arsitektur

- Next.js 15 App Router dan React 19.
- `src/app/page.tsx` adalah client orchestrator untuk state people, groups, stats, announcements, events, dan current user.
- `src/lib/services/*` memisahkan akses data berdasarkan domain.
- `src/lib/supabase.ts` adalah barrel export untuk menjaga import komponen tetap stabil.
- Supabase middleware melindungi seluruh route selain `/login`.
- Supabase RLS adalah batas keamanan utama; pengecekan UI hanya untuk UX.

## Identitas dan role

Kontrak kanonik:

- `people.auth_user_id` → `auth.users.id`
- `people.role` → `SUPER_ADMIN | GROUP_LEADER | MEMBER`

Kolom `auth_id` dan `is_admin` adalah legacy compatibility. Helper aplikasi `isAdminPerson()` menerima keduanya selama masa transisi. Migrasi `supabase_security_alignment.sql` melakukan backfill dan memasang helper database `get_auth_person_id()`, `is_admin()`, dan `is_group_leader()`.

Server action admin wajib melakukan pemeriksaan role di server sebelum memakai service-role key. Jangan mengandalkan tombol yang disembunyikan di UI.

## Domain service

- `core.ts`: browser client, status konfigurasi, dan LocalStorage development fallback.
- `auth.ts`: current profile dan ganti password.
- `people.ts`: CRUD people, histori BA, mentor, dan milestone.
- `groups.ts`: CRUD grup, anggota, lookup grup seseorang, dan handover.
- `stats.ts`: weekly stats, absence rows, dan study-progress rows.
- `events.ts`: event dan event roster.
- `announcements.ts`: pengumuman beserta author identity.

Jika Supabase terkonfigurasi, error database harus dilempar ke UI. Jangan melakukan fallback write ke LocalStorage karena hal itu dapat membuat kegagalan produksi terlihat sukses. Fallback hanya digunakan ketika environment Supabase memang tidak dikonfigurasi.

## Modul UI

- Dashboard: ringkasan, laporan terbaru sesuai grup user, milestone, event, dan settings password.
- Data Disciple: direktori; pengelolaan data dibatasi admin, pencatatan BA dibatasi leader/admin.
- Grup PDG: detail, anggota, target baptisan, dan handover.
- Statistik: form untuk grup milik leader, formatter WA, grafik, histori, dan CSV.
- Jadwal: event dan duty roster; mutation hanya admin.
- Pengumuman: create oleh leader/admin, delete oleh author/admin.
- Admin: create account dan reset password menggunakan server action terotorisasi.

## Invariant penting

1. Format WhatsApp di `StatistikaForm` adalah fitur inti; ubah hanya dengan persetujuan produk.
2. `(group_id, week_date)` harus unik pada `weekly_stats`.
3. Saat update statistik, relation absence/progress lama harus dibersihkan walaupun list baru kosong.
4. Handover harus menutup histori leader lama dan membuka histori leader baru tanpa menghapus statistik/anggota.
5. Modal memakai flex column, header/footer fixed, serta content `flex-1 min-h-0 overflow-y-auto` untuk Safari mobile.
6. Jangan mengembalikan policy RLS public `USING (true)`.
7. Jangan mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke client.

## Status verifikasi

- TypeScript: gunakan `npx tsc --noEmit`.
- ESLint: gunakan `npm run lint`; generated `.next` sudah diabaikan.
- Build tidak lagi mengambil Google Fonts saat build sehingga dapat berjalan offline.
- Belum ada automated test suite; test auth/RLS tetap harus dilakukan di Supabase staging.

## Deployment berikutnya

1. Backup database Supabase.
2. Jalankan `supabase_security_alignment.sql`.
3. Ikuti verifikasi `DATABASE_MIGRATION.md` menggunakan akun admin dan group leader.
4. Deploy kode.
5. Pantau error PostgREST dan Auth setelah deployment.
