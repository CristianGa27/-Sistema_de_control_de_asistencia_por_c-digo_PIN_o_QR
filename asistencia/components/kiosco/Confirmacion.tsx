'use client'

import { useEffect } from 'react'
import { Avatar } from '@/components/Avatar'
import { formatHora } from '@/lib/fechas'
import type { ResultadoMarcacion } from '@/lib/tipos'

function primerNombre(nombre?: string) {
  return nombre?.split(' ')[0] ?? ''
}

function sonar(tipo: 'ok' | 'tarde' | 'error') {
  try {
    const ctx = new AudioContext()
    const notas = tipo === 'ok' ? [880, 1320] : tipo === 'tarde' ? [440, 330] : [200, 160]
    notas.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = f
      osc.type = tipo === 'error' ? 'square' : 'sine'
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.17)
    })
    setTimeout(() => ctx.close(), 800)
  } catch {
    /* sin audio */
  }
}

export function Confirmacion({
  resultado,
  onCerrar,
}: {
  resultado: ResultadoMarcacion
  onCerrar: () => void
}) {
  let fondo: string
  let titulo: string
  let subtitulo: string
  let icono: string

  if (!resultado.ok) {
    fondo = 'bg-slate-700'
    icono = '⚠️'
    titulo = resultado.error
    subtitulo = resultado.nombre ? resultado.nombre : 'Verifica tu cédula, PIN o código QR'
  } else if (resultado.tipo === 'salida') {
    fondo = 'bg-blue-600'
    icono = '👋'
    titulo = `Hasta luego, ${primerNombre(resultado.nombre)}`
    subtitulo = `Salida · ${formatHora(resultado.hora)}`
  } else if (resultado.estado === 'tarde') {
    fondo = 'bg-red-600'
    icono = '⏰'
    titulo = `Llegaste tarde, ${primerNombre(resultado.nombre)}`
    subtitulo = `${resultado.minutos_tarde} min de retraso · Entrada ${formatHora(resultado.hora)}`
  } else {
    fondo = 'bg-green-600'
    icono = '✅'
    titulo = `¡Llegaste a tiempo, ${primerNombre(resultado.nombre)}!`
    subtitulo = `Entrada · ${formatHora(resultado.hora)}`
  }

  useEffect(() => {
    sonar(!resultado.ok ? 'error' : resultado.estado === 'tarde' ? 'tarde' : 'ok')
    const t = setTimeout(onCerrar, resultado.ok ? 4000 : 3000)
    return () => clearTimeout(t)
  }, [resultado, onCerrar])

  const nombre = resultado.nombre ?? ''

  return (
    <div
      onClick={onCerrar}
      className={`fixed inset-0 z-50 flex animate-[aparecer_.25s_ease-out] flex-col items-center justify-center gap-6 p-8 text-center text-white ${fondo}`}
    >
      {nombre ? (
        <Avatar nombre={nombre} foto={resultado.foto} size={240} className="border-8 border-white/80 shadow-2xl" />
      ) : (
        <div className="text-9xl">{icono}</div>
      )}
      <h2 className="text-5xl font-extrabold drop-shadow md:text-6xl">{titulo}</h2>
      {resultado.ok && <p className="text-2xl font-medium opacity-90">{resultado.nombre}</p>}
      <p className="text-3xl font-semibold tabular-nums opacity-95">{subtitulo}</p>
    </div>
  )
}

