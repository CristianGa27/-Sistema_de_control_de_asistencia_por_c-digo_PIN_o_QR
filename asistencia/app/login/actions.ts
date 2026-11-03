'use server'

import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

export async function iniciarSesion(_prev: { error?: string } | undefined, formData: FormData) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: 'Faltan las variables de entorno de Supabase en Vercel' }
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Escribe tu correo y contraseña' }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Correo o contraseña incorrectos' }

  redirect('/admin')
}

export async function cerrarSesion() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  redirect('/login')
}
