'use client'

import { useEffect, useState } from 'react'

export function Reloj() {
  const [ahora, setAhora] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setAhora(new Date())
    const t0 = setTimeout(tick, 0)
    const t = setInterval(tick, 1000)
    return () => {
      clearTimeout(t0)
      clearInterval(t)
    }
  }, [])

  if (!ahora) return <div className="h-14" />

  const hora = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(ahora)

  const fecha = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(ahora)

  return (
    <div className="text-right">
      <div className="text-4xl font-bold tabular-nums tracking-tight">{hora}</div>
      <div className="text-sm capitalize text-slate-400">{fecha}</div>
    </div>
  )
}
