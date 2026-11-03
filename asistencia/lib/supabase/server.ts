import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Cliente de Supabase con la sesión del usuario (respeta RLS). */
export async function supabaseServer() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Llamado desde un Server Component: el middleware refresca la sesión.
        }
      },
    },
  })
}
