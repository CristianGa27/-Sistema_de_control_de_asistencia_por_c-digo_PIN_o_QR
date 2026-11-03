'use client'

import { useState, useTransition } from 'react'
import { Avatar } from '@/components/Avatar'
import { formatHora } from '@/lib/fechas'
import type { ResultadoMarcacion } from '@/lib/tipos'
import { marcarDesdeQR } from './actions'

export function MarcarMovilForm({ token }: { token: string }) {
  const [codigo, setCodigo] = useState('')
  const [tipoForzado, setTipoForzado] = useState<'auto' | 'entrada' | 'salida'>('auto')
  const [resultado, setResultado] = useState<ResultadoMarcacion | null>(null)
  const [pendiente, startTransition] = useTransition()

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim() || pendiente) return
    startTransition(async () => {
      const r = await marcarDesdeQR({ token, codigo, tipoForzado })
      setResultado(r)
      if (r.ok) setCodigo('')
    })
  }

  if (resultado?.ok) {
    const esSalida = resultado.tipo === 'salida'
    const esTarde = resultado.estado === 'tarde'
    const fondo = esSalida ? 'bg-blue-600' : esTarde ? 'bg-red-600' : 'bg-green-600'
    const primerNombre = resultado.nombre.split(' ')[0]
    const titulo = esSalida
      ? `¡Hasta luego, ${primerNombre}!`
      : esTarde
        ? `Llegaste tarde, ${primerNombre}`
        : `¡Llegaste a tiempo, ${primerNombre}!`
    const sub = esSalida
      ? `Salida · ${formatHora(resultado.hora)}`
      : esTarde
        ? `${resultado.minutos_tarde} min de retraso · Entrada ${formatHora(resultado.hora)}`
        : `Entrada · ${formatHora(resultado.hora)}`

    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center text-white ${fondo}`}>
        <Avatar nombre={resultado.nombre} foto={resultado.foto} size={160} className="border-4 border-white shadow-2xl" />
        <h1 className="text-4xl font-extrabold">{titulo}</h1>
        <p className="text-lg opacity-90">{resultado.nombre}</p>
        <p className="text-xl font-semibold tabular-nums">{sub}</p>
        <button
          type="button"
          onClick={() => setResultado(null)}
          className="mt-4 rounded-xl bg-white/20 px-6 py-3 font-semibold hover:bg-white/30"
        >
          Listo
        </button>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-800/80 p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">📲</div>
          <h1 className="text-2xl font-extrabold">Registrar Asistencia</h1>
          <p className="text-sm text-slate-400">Ingresa tu cédula o PIN para confirmar</p>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-900 p-1 text-xs">
            <button
              type="button"
              onClick={() => setTipoForzado('auto')}
              className={`rounded-lg py-2 font-semibold ${
                tipoForzado === 'auto' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              🔄 Auto
            </button>
            <button
              type="button"
              onClick={() => setTipoForzado('entrada')}
              className={`rounded-lg py-2 font-semibold ${
                tipoForzado === 'entrada' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              🟢 Entrada
            </button>
            <button
              type="button"
              onClick={() => setTipoForzado('salida')}
              className={`rounded-lg py-2 font-semibold ${
                tipoForzado === 'salida' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              🔵 Salida
            </button>
          </div>

          <input
            type="text"
            inputMode="numeric"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Tu cédula o PIN"
            required
            autoFocus
            className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900 px-4 py-4 text-center font-mono text-2xl tracking-widest text-white outline-none focus:border-emerald-500"
          />

          {resultado && !resultado.ok && (
            <p className="rounded-xl bg-red-500/20 p-3 text-center text-sm font-medium text-red-300">
              {resultado.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {pendiente ? 'Registrando…' : '✓ Marcar asistencia'}
          </button>
        </form>
      </div>
    </main>
  )
}

