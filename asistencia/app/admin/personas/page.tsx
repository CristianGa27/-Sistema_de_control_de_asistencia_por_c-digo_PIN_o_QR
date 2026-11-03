import Link from 'next/link'
import { Avatar } from '@/components/Avatar'
import { requireAdmin } from '@/lib/auth'
import type { Horario, Persona } from '@/lib/tipos'

export default async function PersonasPage({ searchParams }: PageProps<'/admin/personas'>) {
  const { q } = await searchParams
  const busqueda = typeof q === 'string' ? q.trim() : ''
  const { supabase } = await requireAdmin()

  let query = supabase.from('personas').select('*').order('apellido').order('nombre')
  if (busqueda) {
    const s = busqueda.replace(/[%,()]/g, '')
    query = query.or(`nombre.ilike.%${s}%,apellido.ilike.%${s}%,documento.ilike.%${s}%,area.ilike.%${s}%`)
  }
  const [{ data: personas }, { data: horarios }] = await Promise.all([
    query,
    supabase.from('horarios').select('*'),
  ])
  const mapaHorarios = new Map((horarios as Horario[] | null)?.map((h) => [h.id, h]) ?? [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Personas</h1>
        <Link href="/admin/personas/nueva" className="btn-primario">
          + Nueva persona
        </Link>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={busqueda} placeholder="Buscar por nombre, cédula o área…" className="input max-w-md" />
        <button className="btn-secundario">Buscar</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Persona</th>
              <th className="th">Cédula</th>
              <th className="th">PIN</th>
              <th className="th">Horario</th>
              <th className="th">Estado</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(personas as Persona[] | null)?.length === 0 && (
              <tr>
                <td colSpan={6} className="td py-10 text-center text-slate-400">
                  No hay personas registradas
                </td>
              </tr>
            )}
            {(personas as Persona[] | null)?.map((p) => {
              const nombre = `${p.nombre} ${p.apellido}`
              const h = p.horario_id ? mapaHorarios.get(p.horario_id) : null
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={nombre} foto={p.foto_url} size={36} />
                      <div>
                        <div className="font-semibold text-slate-900">{nombre}</div>
                        <div className="text-xs text-slate-400">{p.area}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td font-mono">{p.documento}</td>
                  <td className="td font-mono">{p.pin ? '••••' : '—'}</td>
                  <td className="td">{h ? `${h.nombre} (${h.hora_entrada.slice(0, 5)})` : '—'}</td>
                  <td className="td">
                    {p.activo ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">Activo</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">Inactivo</span>
                    )}
                  </td>
                  <td className="td text-right">
                    <Link href={`/admin/personas/${p.id}`} className="font-semibold text-emerald-600 hover:underline">
                      Ver / editar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

