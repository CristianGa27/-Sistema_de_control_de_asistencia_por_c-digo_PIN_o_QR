import 'server-only'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

/** Exige un usuario autenticado que esté en perfiles_admin. */
export async function requireAdmin() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_admin')
    .select('id, nombre, rol')
    .eq('id', user.id)
    .maybeSingle()

  if (!perfil) redirect('/login?error=no-admin')

  return { supabase, user, perfil }
}

