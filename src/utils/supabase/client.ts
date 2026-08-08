import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrlRaw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseUrl = supabaseUrlRaw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
