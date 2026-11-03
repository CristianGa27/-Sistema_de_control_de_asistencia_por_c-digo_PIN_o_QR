import { Avatar } from '@/components/Avatar'
import { formatHoraCorta } from '@/lib/fechas'
import type { EstadoHoy } from '@/lib/tipos'

export function ListaPresentes({ estado }: { estado: EstadoHoy[] }) {
  const presentes = estado.filter((e) => e.ultimo_tipo === 'entrada')
  const salieron = estado.filter((e) => e.ultimo_tipo === 'salida')
  const tarde = presentes.filter((e) => e.estado_llegada === 'tarde').length

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-2xl font-bold">
          Presentes hoy <span className="text-emerald-400">({presentes.length})</span>
        </h2>
        <div className="flex gap-3 text-sm text-slate-400">
          <span>🟢 {presentes.length - tarde}</span>
          <span>🔴 {tarde}</span>
          <span>Salieron: {salieron.length}</span>
        </div>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
        {presentes.length === 0 && (
          <li className="rounded-xl bg-slate-800/60 p-6 text-center text-slate-400">
            Todavía no hay nadie presente
          </li>
        )}
        {presentes.map((p) => {
          const nombre = `${p.nombre} ${p.apellido}`
          const esTarde = p.estado_llegada === 'tarde'
          return (
            <li
              key={p.persona_id}
              className="flex items-center gap-3 rounded-xl bg-slate-800/70 p-3 ring-1 ring-slate-700"
            >
              <Avatar nombre={nombre} foto={p.foto_url} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{nombre}</div>
                {p.area && <div className="truncate text-xs text-slate-400">{p.area}</div>}
              </div>
              <div className="text-right">
                <div className="font-mono text-sm tabular-nums">
                  {p.primera_entrada ? formatHoraCorta(p.primera_entrada) : '—'}
                </div>
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    esTarde ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                  }`}
                >
                  {esTarde ? `Tarde ${p.minutos_tarde ?? 0}m` : 'A tiempo'}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

