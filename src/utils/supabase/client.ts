import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrlRaw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseUrl = supabaseUrlRaw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase belum dikonfigurasi untuk browser client.')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
