'use client'

import { useActionState } from 'react'
import { iniciarSesion } from './actions'

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, undefined)

  return (
    <form action={accion} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Correo</span>
        <input name="email" type="email" required className="input mt-1" autoComplete="email" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Contraseña</span>
        <input name="password" type="password" required className="input mt-1" autoComplete="current-password" />
      </label>
      {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}
      <button disabled={pendiente} className="btn-primario w-full">
        {pendiente ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}

