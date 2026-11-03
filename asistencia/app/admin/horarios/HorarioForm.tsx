'use client'

import { useActionState, useEffect, useRef } from 'react'
import type { Horario } from '@/lib/tipos'
import { guardarHorario } from './actions'

export function HorarioForm({ horario }: { horario?: Horario }) {
  const [estado, accion, pendiente] = useActionState(guardarHorario, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado?.ok && !horario) formRef.current?.reset()
  }, [estado, horario])

  return (
    <form ref={formRef} action={accion} className="flex flex-wrap items-end gap-3">
      {horario && <input type="hidden" name="id" value={horario.id} />}
      <label className="block min-w-40 flex-1">
        <span className="text-xs font-medium text-slate-600">Nombre</span>
        <input name="nombre" defaultValue={horario?.nombre} placeholder="Ej. Mañana" required className="input mt-1" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Entrada</span>
        <input
          type="time"
          name="hora_entrada"
          defaultValue={horario?.hora_entrada.slice(0, 5) ?? '08:00'}
          required
          className="input mt-1"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Salida</span>
        <input type="time" name="hora_salida" defaultValue={horario?.hora_salida?.slice(0, 5) ?? ''} className="input mt-1" />
      </label>
      <label className="block w-28">
        <span className="text-xs font-medium text-slate-600">Tolerancia (min)</span>
        <input
          type="number"
          name="tolerancia_min"
          min={0}
          max={240}
          defaultValue={horario?.tolerancia_min ?? 10}
          required
          className="input mt-1"
        />
      </label>
      <button disabled={pendiente} className="btn-primario">
        {pendiente ? '…' : horario ? 'Guardar' : '+ Agregar'}
      </button>
      {estado?.error && <p className="w-full text-sm text-red-600">{estado.error}</p>}
      {estado?.ok && horario && <p className="w-full text-sm text-green-600">Guardado ✔</p>}
    </form>
  )
}

