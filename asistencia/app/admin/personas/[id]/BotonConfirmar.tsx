'use client'

import { useTransition } from 'react'

export function BotonConfirmar({
  accion,
  mensaje,
  className,
  children,
}: {
  accion: () => Promise<void>
  mensaje: string
  className?: string
  children: React.ReactNode
}) {
  const [pendiente, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pendiente}
      className={className}
      onClick={() => {
        if (confirm(mensaje)) start(() => accion())
      }}
    >
      {pendiente ? 'Procesando…' : children}
    </button>
  )
}

