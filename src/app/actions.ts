'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/utils/supabase/server';

const supabaseUrlRaw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseUrl = supabaseUrlRaw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function getAdminClient() {
  return createAdminClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function requireSuperAdmin() {
  const sessionClient = await createSessionClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return { error: 'Sesi login tidak valid.' } as const;

  const adminClient = getAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from('people')
    .select('id, role, is_admin')
    .or(`auth_user_id.eq.${user.id},auth_id.eq.${user.id}`)
    .maybeSingle();

  if (profileError || !profile || (profile.role !== 'SUPER_ADMIN' && profile.is_admin !== true)) {
    return { error: 'Akses ditolak. Hanya Super Admin yang dapat menjalankan aksi ini.' } as const;
  }

  return { adminClient, profile } as const;
}

export async function createLeaderAccount(formData: FormData) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY belum di-set di environment variables (Vercel/Local).' };
  }

  const authorization = await requireSuperAdmin();
  if ('error' in authorization) return { error: authorization.error };
  const supabaseAdmin = authorization.adminClient;

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const personId = String(formData.get('person_id') || '');

  if (!email || !password || !personId) {
    return { error: 'Email, password, dan pilihan Leader wajib diisi.' };
  }

  if (password.length < 6) return { error: 'Password minimal 6 karakter.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Format email tidak valid.' };

  try {
    const { data: targetPerson, error: targetError } = await supabaseAdmin
      .from('people')
      .select('id, status, auth_user_id, auth_id')
      .eq('id', personId)
      .maybeSingle();

    if (targetError || !targetPerson || targetPerson.status !== 'LEADER') {
      return { error: 'Data target bukan Leader yang valid.' };
    }
    if (targetPerson.auth_user_id || targetPerson.auth_id) {
      return { error: 'Leader tersebut sudah memiliki akun login.' };
    }

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

    // 2. Link the canonical auth identity to the people table.
    const { data: linkedPerson, error: updateError } = await supabaseAdmin
      .from('people')
      .update({
        auth_user_id: authData.user.id,
        auth_id: authData.user.id,
        role: 'GROUP_LEADER',
        is_admin: false
      })
      .eq('id', personId)
      .is('auth_user_id', null)
      .is('auth_id', null)
      .select('id')
      .maybeSingle();

    if (updateError || !linkedPerson) {
      // Rollback auth user creation if linking fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return {
        error: updateError
          ? `Gagal menyambungkan akun ke data Leader: ${updateError.message}`
          : 'Leader tersebut baru saja terhubung ke akun lain. Silakan muat ulang halaman.'
      };
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

  const authorization = await requireSuperAdmin();
  if ('error' in authorization) return { error: authorization.error };
  const supabaseAdmin = authorization.adminClient;

  const authId = String(formData.get('auth_id') || '');
  const newPassword = String(formData.get('password') || '');

  if (!authId || !newPassword) {
    return { error: 'Auth ID dan password baru wajib diisi.' };
  }
  if (newPassword.length < 6) return { error: 'Password minimal 6 karakter.' };

  try {
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('people')
      .select('id')
      .or(`auth_user_id.eq.${authId},auth_id.eq.${authId}`)
      .maybeSingle();
    if (targetError || !targetProfile) {
      return { error: 'Akun target tidak terhubung ke data people.' };
    }

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
