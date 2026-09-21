import { Person } from '../types';
import { supabase, isSupabaseConfigured } from './core';

export async function getCurrentUserProfile(): Promise<Person | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: canonicalProfile, error: canonicalError } = await supabase
    .from('people')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (canonicalError) throw canonicalError;
  if (canonicalProfile) return canonicalProfile as Person;

  // Temporary compatibility while the alignment migration is being deployed.
  const { data: legacyProfile, error: legacyError } = await supabase
    .from('people')
    .select('*')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (legacyError) throw legacyError;
  if (legacyProfile) return legacyProfile as Person;
  return null;
}

export async function updateUserPassword(newPassword: string): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error("Supabase tidak terkonfigurasi") };
  }
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  return { error };
}
