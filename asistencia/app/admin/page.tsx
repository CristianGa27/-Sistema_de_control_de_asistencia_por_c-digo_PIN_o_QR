import { Avatar } from '@/components/Avatar'
import { requireAdmin } from '@/lib/auth'
import { formatFecha, formatHoraCorta } from '@/lib/fechas'
import type { EstadoHoy } from '@/lib/tipos'

export default async function AdminHoy() {
  const { supabase } = await requireAdmin()

  const [{ data }, { count: totalActivos }] = await Promise.all([
    supabase.from('estado_hoy').select('*').order('primera_entrada', { ascending: true }),
    supabase.from('personas').select('id', { count: 'exact', head: true }).eq('activo', true),
  ])
  const estado = (data ?? []) as EstadoHoy[]

  const presentes = estado.filter((e) => e.ultimo_tipo === 'entrada')
  const llegaron = estado.length
  const tarde = estado.filter((e) => e.estado_llegada === 'tarde').length
  const ausentes = Math.max((totalActivos ?? 0) - llegaron, 0)

  const tarjetas = [
    { label: 'Presentes ahora', valor: presentes.length, color: 'text-emerald-600' },
    { label: 'Llegaron a tiempo', valor: llegaron - tarde, color: 'text-green-600' },
    { label: 'Llegaron tarde', valor: tarde, color: 'text-red-600' },
    { label: 'Sin marcar', valor: ausentes, color: 'text-slate-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Asistencia de hoy</h1>
        <p className="capitalize text-slate-500">{formatFecha(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="card">
            <div className="text-sm text-slate-500">{t.label}</div>
            <div className={`text-4xl font-extrabold ${t.color}`}>{t.valor}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Persona</th>
              <th className="th">Entrada</th>
              <th className="th">Llegada</th>
              <th className="th">Estado actual</th>
              <th className="th">Última marca</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {estado.length === 0 && (
              <tr>
                <td colSpan={5} className="td py-10 text-center text-slate-400">
                  Nadie ha marcado hoy
                </td>
              </tr>
            )}
            {estado.map((e) => {
              const nombre = `${e.nombre} ${e.apellido}`
              return (
                <tr key={e.persona_id}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={nombre} foto={e.foto_url} size={36} />
                      <div>
                        <div className="font-semibold text-slate-900">{nombre}</div>
                        <div className="text-xs text-slate-400">{e.area}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td tabular-nums">{e.primera_entrada ? formatHoraCorta(e.primera_entrada) : '—'}</td>
                  <td className="td">
                    {e.estado_llegada === 'tarde' ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                        Tarde · {e.minutos_tarde} min
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                        A tiempo
                      </span>
                    )}
                  </td>
                  <td className="td">
                    {e.ultimo_tipo === 'entrada' ? (
                      <span className="font-semibold text-emerald-600">● Presente</span>
                    ) : (
                      <span className="text-slate-400">○ Salió</span>
                    )}
                  </td>
                  <td className="td tabular-nums">{formatHoraCorta(e.ultima_marca)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

