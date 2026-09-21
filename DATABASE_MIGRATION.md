# Database Migration Runbook

## Migrasi keamanan dasar

Gunakan `supabase_security_alignment.sql` untuk database production yang strukturnya sesuai dump terakhir. Script dibungkus transaction dan aman dijalankan ulang.

Jika migrasi tersebut sudah sukses pada deployment sebelumnya, tidak perlu menjalankannya ulang hanya untuk mengaktifkan d-Tree.

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

## Migrasi d-Tree

Setelah security alignment tersedia, jalankan `supabase_dtree.sql`. Script ini membuat:

- `dtree_settings`
- `mentorship_relationships`
- validasi satu orang satu grup
- validasi gender, grup, duplikasi, dan siklus
- RPC mutation atomic dan RLS d-Tree

Sebelum menjalankan, periksa data grup lama:

```sql
select person_id, count(*) as total_assignment
from public.group_members
group by person_id
having count(*) > 1;

select leader_id, count(*) as total_group
from public.groups
where leader_id is not null and archived_at is null
group by leader_id
having count(*) > 1;

select gm.person_id, gm.group_id as member_group, g.id as leader_group
from public.group_members gm
join public.groups g on g.leader_id = gm.person_id
where g.archived_at is null and gm.group_id <> g.id;

select p.id, p.full_name, p.gender, g.group_name, g.category
from public.group_members gm
join public.people p on p.id = gm.person_id
join public.groups g on g.id = gm.group_id
where p.gender is distinct from g.category
union all
select p.id, p.full_name, p.gender, g.group_name, g.category
from public.groups g
join public.people p on p.id = g.leader_id
where g.archived_at is null and p.gender is distinct from g.category;
```

Keempat query harus menghasilkan nol baris. Migrasi sengaja berhenti tanpa perubahan jika menemukan konflik agar tidak memilih grup secara sembarangan.

Verifikasi setelah migrasi d-Tree:

```sql
select id, brother_root_id, sister_root_id, updated_at
from public.dtree_settings;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('dtree_settings', 'mentorship_relationships')
order by tablename, policyname;
```

Setelah itu buka tab d-Tree sebagai Admin, atur dua Pemimpin Jemaat, lalu tempatkan satu anggota dari panel Belum Ditempatkan.

## Smoke test akun

- Super Admin: seluruh tab, people/group/event/account management, semua statistik.
- Group Leader: direktori, grup sendiri, statistik grup sendiri, BA, dan pengumuman; tanpa Admin/event mutation.
- d-Tree Admin: dapat mengganti dua root dan seluruh relasi.
- d-Tree Group Leader: dapat mengelola seluruh relasi tetapi tidak dapat mengganti root.
- d-Tree Member: hanya dapat melihat pohon dan popup detail.
- Anonymous: akses tabel dengan anon key tanpa access token ditolak RLS dan route redirect ke `/login`.

## Rollback

Gunakan backup database. Jangan mengembalikan policy `USING (true)` sebagai rollback. Jika login admin terputus, perbaiki mapping melalui SQL Editor memakai UUID `auth.users`, lalu set `auth_user_id` dan `role = 'SUPER_ADMIN'`.
