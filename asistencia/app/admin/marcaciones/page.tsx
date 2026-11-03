import { Avatar } from '@/components/Avatar'
import { requireAdmin } from '@/lib/auth'
import { formatFechaHora, hoyLocal } from '@/lib/fechas'
import { consultarMarcaciones } from '@/lib/marcaciones'

export default async function MarcacionesPage({ searchParams }: PageProps<'/admin/marcaciones'>) {
  const sp = await searchParams
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  const desde = str(sp.desde) || hoyLocal()
  const hasta = str(sp.hasta) || desde
  const q = str(sp.q).trim()
  const tipo = str(sp.tipo)

  const { supabase } = await requireAdmin()
  const filas = await consultarMarcaciones(supabase, { desde, hasta, q, tipo }, 500)
  const csv = `/admin/marcaciones/csv?${new URLSearchParams({ desde, hasta, q, tipo })}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Historial de marcaciones</h1>
        <a href={csv} className="btn-secundario">
          ⬇ Exportar CSV
        </a>
      </div>

      <form className="card flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Desde</span>
          <input type="date" name="desde" defaultValue={desde} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Hasta</span>
          <input type="date" name="hasta" defaultValue={hasta} className="input mt-1" />
        </label>
        <label className="block min-w-48 flex-1">
          <span className="text-xs font-medium text-slate-600">Persona</span>
          <input name="q" defaultValue={q} placeholder="Nombre o cédula" className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Tipo</span>
          <select name="tipo" defaultValue={tipo} className="input mt-1">
            <option value="">Todas</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="tarde">Llegadas tarde</option>
          </select>
        </label>
        <button className="btn-primario">Filtrar</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Fecha y hora</th>
              <th className="th">Persona</th>
              <th className="th">Cédula</th>
              <th className="th">Tipo</th>
              <th className="th">Método</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.length === 0 && (
              <tr>
                <td colSpan={5} className="td py-10 text-center text-slate-400">
                  Sin marcaciones en este rango
                </td>
              </tr>
            )}
            {filas.map((m) => {
              const nombre = `${m.personas.nombre} ${m.personas.apellido}`
              return (
                <tr key={m.id}>
                  <td className="td tabular-nums">{formatFechaHora(m.marcado_en)}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <Avatar nombre={nombre} foto={m.personas.foto_url} size={28} />
                      <span className="font-medium text-slate-900">{nombre}</span>
                    </div>
                  </td>
                  <td className="td font-mono">{m.personas.documento}</td>
                  <td className="td">
                    {m.tipo === 'salida' ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">Salida</span>
                    ) : m.estado === 'tarde' ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        Entrada · tarde {m.minutos_tarde}m
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                        Entrada · a tiempo
                      </span>
                    )}
                  </td>
                  <td className="td text-xs uppercase text-slate-500">{m.metodo}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filas.length === 500 && <p className="text-sm text-slate-500">Mostrando las 500 más recientes. Usa CSV para ver todo.</p>}
    </div>
  )
}

