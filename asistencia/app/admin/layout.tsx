import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { cerrarSesion } from '@/app/login/actions'

const MENU = [
  { href: '/admin', label: '📊 Hoy' },
  { href: '/admin/personas', label: '👥 Personas' },
  { href: '/admin/horarios', label: '🕘 Horarios' },
  { href: '/admin/marcaciones', label: '📋 Historial' },
] as const

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const { user, perfil } = await requireAdmin()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 p-5 text-white md:flex print:hidden">
        <div className="mb-8">
          <div className="text-lg font-extrabold">Asistencia</div>
          <div className="text-xs text-slate-400">Panel administrativo</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-800">
              {m.label}
            </Link>
          ))}
          <Link
            href="/kiosco"
            target="_blank"
            className="mt-4 rounded-lg bg-emerald-600 px-3 py-2 text-center font-semibold hover:bg-emerald-500"
          >
            🕒 Abrir kiosco
          </Link>
        </nav>
        <div className="border-t border-slate-800 pt-4 text-sm">
          <div className="truncate text-slate-300">{perfil.nombre ?? user.email}</div>
          <form action={cerrarSesion}>
            <button className="mt-2 text-slate-400 hover:text-white">Cerrar sesión</button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-2 overflow-x-auto bg-slate-900 p-3 md:hidden print:hidden">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-white">
              {m.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
