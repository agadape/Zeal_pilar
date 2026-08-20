import { Person } from '../types';
import { supabase, isSupabaseConfigured } from './core';

export async function getCurrentUserProfile(): Promise<Person | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('auth_id', user.id)
    .single();
    
  if (!error && data) return data as Person;
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
