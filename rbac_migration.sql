-- 1. Tambahkan kolom auth_id dan role ke tabel people
ALTER TABLE public.people
ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN role TEXT DEFAULT 'MEMBER';

-- 2. Jadikan akun admin utamamu saat ini sebagai SUPER_ADMIN
-- (Ganti email di bawah dengan email yang kamu pakai buat login sekarang)
UPDATE public.people 
SET 
  role = 'SUPER_ADMIN', 
  auth_id = (SELECT id FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL@EXAMPLE.COM' LIMIT 1)
WHERE 
  -- Kamu bisa ganti ini dengan nama kamu di tabel people
  full_name = 'Nama Kamu Di Sini';
