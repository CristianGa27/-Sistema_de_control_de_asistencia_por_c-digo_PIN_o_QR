import { LoginForm } from './LoginForm'

export const metadata = { title: 'Ingresar · Control de Asistencia' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { error } = await searchParams
  const faltaConfig = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Administración</h1>
        <p className="mb-6 text-sm text-slate-500">Control de Asistencia</p>
        {faltaConfig && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Faltan las variables de entorno de Supabase en Vercel (Settings → Environment Variables).
          </p>
        )}
        {error === 'no-admin' && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Tu usuario no tiene permisos de administrador.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  )
}
