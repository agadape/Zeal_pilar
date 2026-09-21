# Database Migration Runbook

## Migration yang harus dijalankan

Gunakan `supabase_security_alignment.sql` untuk database production yang strukturnya sesuai dump terakhir. Script dibungkus transaction dan aman dijalankan ulang.

Sebelum menjalankan:

1. Buat backup database dari Supabase Dashboard.
2. Pastikan minimal satu record admin memiliki `auth_id`, `auth_user_id`, `is_admin = true`, atau `role = 'SUPER_ADMIN'`.
3. Jalankan script melalui SQL Editor sebagai database owner.

## Verifikasi setelah migrasi

Pastikan tidak ada policy allow-all:

```sql
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (qual = 'true' or with_check = 'true');
```

Hasil yang diharapkan: nol baris untuk tabel aplikasi.

Pastikan identitas auth tersambung:

```sql
select id, full_name, auth_user_id, auth_id, role, is_admin
from public.people
where auth_user_id is not null or auth_id is not null
order by full_name;
```

Pastikan leader grup mendapat role yang benar:

```sql
select g.group_name, p.full_name, p.role
from public.groups g
left join public.people p on p.id = g.leader_id
order by g.group_name;
```

Pastikan kolom mentor tersedia:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'bible_study_logs'
  and column_name = 'mentor_id';
```

## Smoke test akun

- Super Admin: seluruh tab, people/group/event/account management, semua statistik.
- Group Leader: direktori, grup sendiri, statistik grup sendiri, BA, dan pengumuman; tanpa Admin/event mutation.
- Anonymous: akses tabel dengan anon key tanpa access token ditolak RLS dan route redirect ke `/login`.

## Rollback

Gunakan backup database. Jangan mengembalikan policy `USING (true)` sebagai rollback. Jika login admin terputus, perbaiki mapping melalui SQL Editor memakai UUID `auth.users`, lalu set `auth_user_id` dan `role = 'SUPER_ADMIN'`.
