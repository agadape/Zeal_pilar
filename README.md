# GKDI Tugu — Leaders Portal

Portal internal ZEAL Youth & Campus Ministry GKDI Jogja untuk mengelola disciple, grup PDG, pohon pembimbingan, laporan mingguan, progres Belajar Alkitab, event pelayanan, milestone, dan pengumuman.

## Stack

- Next.js 15 App Router, React 19, dan TypeScript
- Tailwind CSS v4
- Supabase Auth dan PostgreSQL
- Recharts, Tabler Icons, dan canvas-confetti
- PWA manifest dan service worker sederhana

## Fitur aktif

- Dashboard ringkas, milestone ulang tahun, status laporan, dan event terdekat
- Direktori jemaat dengan data pribadi, status, kampus, dan histori BA
- Grup PDG, assignment anggota, target baptisan, dan handover leader
- d-Tree interaktif dengan dua Pemimpin Jemaat, cabang per grup, pembimbing utama/pendamping, histori, pencarian, zoom, dan drag-and-drop terkonfirmasi
- Laporan mingguan, formatter WhatsApp, analitik, histori, dan ekspor CSV
- Jadwal event beserta duty roster
- Pengumuman yang dapat dibuat leader dan dikelola author/admin
- Login, ganti password, pembuatan akun leader, dan reset password oleh admin
- LocalStorage hanya sebagai mode development ketika Supabase tidak dikonfigurasi

## Menjalankan secara lokal

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh tersedia di server/Vercel. Jangan pernah menggunakan prefix `NEXT_PUBLIC_` untuk key tersebut.

## Database

Untuk database lama yang sudah berjalan, jalankan berurutan:

1. `supabase_security_alignment.sql` untuk instalasi yang belum pernah menjalankannya
2. `supabase_dtree.sql` untuk mengaktifkan d-Tree
3. `supabase_bugfixes.sql` untuk constraint integritas laporan, d-Tree, dan progres BA
4. Verifikasi menggunakan query pada `DATABASE_MIGRATION.md`
5. Deploy aplikasi setelah migrasi berhasil

Migrasi alignment menambah kontrak yang hilang, menyatukan identitas, menghapus policy public `USING (true)`, memasang RLS final, memperbaiki trigger handover, dan mengamankan view.

Untuk instalasi baru, jalankan schema lama berurutan, lanjutkan `supabase_security_alignment.sql`, `supabase_dtree.sql`, lalu `supabase_bugfixes.sql`. Schema lama kini memulai RLS dalam keadaan tertutup; policy akses final hanya dibuat oleh alignment. Alignment juga membuat `bible_study_logs` bila tabel tersebut belum tersedia.

## Model akses

| Kemampuan | Super Admin | Group Leader | Member |
|---|---:|---:|---:|
| Melihat direktori, grup, statistik, event | Ya | Ya | Ya |
| Mengelola data jemaat | Ya | Diri sendiri via RLS | Diri sendiri via RLS |
| Mengelola anggota/statistik grup | Ya | Grup sendiri | Tidak |
| Melihat d-Tree | Ya | Ya | Ya |
| Mengelola relasi d-Tree | Ya | Semua cabang | Tidak |
| Mengganti Pemimpin Jemaat d-Tree | Ya | Tidak | Tidak |
| Mencatat progres BA | Ya | Ya | Tidak |
| Mengelola event | Ya | Tidak | Tidak |
| Membuat pengumuman | Ya | Ya | Tidak |
| Membuat/reset akun | Ya | Tidak | Tidak |

Identitas kanonik adalah `people.auth_user_id`. `auth_id` dan `is_admin` masih dipertahankan sementara untuk kompatibilitas data lama.

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
npm run build
```

## Struktur penting

```text
src/app/page.tsx                 orkestrasi state dan navigasi
src/app/actions.ts               server actions khusus Super Admin
src/components/                  seluruh view dan panel UI
src/lib/services/                akses Supabase per domain
src/lib/services/dtree.ts        query dan mutation pohon pembimbingan
src/lib/permissions.ts           helper permission UI
src/lib/types.ts                 kontrak TypeScript
src/utils/supabase/              client browser/server/middleware
supabase_security_alignment.sql  migrasi final skema dan RLS
supabase_dtree.sql               tabel, validasi, RPC, dan RLS d-Tree
supabase_bugfixes.sql            constraint integritas pasca d-Tree
DATABASE_MIGRATION.md            panduan deployment database
```
