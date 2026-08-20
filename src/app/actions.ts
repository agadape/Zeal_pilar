'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrlRaw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseUrl = supabaseUrlRaw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export async function createLeaderAccount(formData: FormData) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY belum di-set di environment variables (Vercel/Local).' };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const personId = formData.get('person_id') as string;

  if (!email || !password || !personId) {
    return { error: 'Email, password, dan pilihan Leader wajib diisi.' };
  }

  try {
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto confirm so they can login immediately
    });

    if (authError) {
      return { error: `Gagal membuat akun auth: ${authError.message}` };
    }

    if (!authData.user) {
      return { error: 'Berhasil, tetapi data user tidak dikembalikan oleh Supabase.' };
    }

    // 2. Link the auth_id to the people table
    const { error: updateError } = await supabaseAdmin
      .from('people')
      .update({
        auth_id: authData.user.id,
        role: 'GROUP_LEADER'
      })
      .eq('id', personId);

    if (updateError) {
      // Rollback auth user creation if linking fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { error: `Gagal menyambungkan akun ke data Leader: ${updateError.message}` };
    }

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message || 'Terjadi kesalahan sistem.' };
    }
    return { error: 'Terjadi kesalahan sistem.' };
  }
}

export async function resetLeaderPassword(formData: FormData) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY belum di-set.' };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const authId = formData.get('auth_id') as string;
  const newPassword = formData.get('password') as string;

  if (!authId || !newPassword) {
    return { error: 'Auth ID dan password baru wajib diisi.' };
  }

  try {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authId, {
      password: newPassword
    });

    if (authError) {
      return { error: `Gagal mereset password: ${authError.message}` };
    }
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message || 'Terjadi kesalahan sistem saat mereset password.' };
    }
    return { error: 'Terjadi kesalahan sistem saat mereset password.' };
  }
}
