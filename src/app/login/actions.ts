'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: String(formData.get('email') || '').trim().toLowerCase(),
    password: String(formData.get('password') || ''),
  }

  if (!data.email || !data.password) {
    return { error: 'Email dan password wajib diisi.' }
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
