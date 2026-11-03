'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useRef, useState } from 'react'
import { guardarHorario } from '@/app/admin/horarios/actions'
import { Avatar } from '@/components/Avatar'
import type { Horario, Persona } from '@/lib/tipos'
import { guardarPersona } from './actions'

/** Reduce la imagen a 500px máx. y la convierte a JPEG antes de subirla. */
async function reducirImagen(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const max = 500
  const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.8))
  return new File([blob], 'foto.jpg', { type: 'image/jpeg' })
}

export function PersonaForm({ persona, horarios }: { persona?: Persona; horarios: Horario[] }) {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(persona?.foto_url ?? null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [mostrarNuevoHorario, setMostrarNuevoHorario] = useState(false)
  const [estadoHorario, accionHorario, pendienteHorario] = useActionState(guardarHorario, undefined)
  const inputFoto = useRef<HTMLInputElement>(null)

  const [estado, accion, pendiente] = useActionState(async (_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) => {
    try {
      if (fotoFile) {
        formData.set('foto', fotoFile)
      } else {
        formData.delete('foto')
      }
      const res = await guardarPersona(undefined, formData)
      if (res?.ok && res.personaId && !persona) {
        router.push(`/admin/personas/${res.personaId}`)
        router.refresh()
      } else if (res?.ok) {
        router.refresh()
      }
      return res
    } catch (e) {
      return { error: (e as Error).message || 'Error al guardar, intenta de nuevo' }
    }
  }, undefined)

  const onFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const reducida = await reducirImagen(file)
      setFotoFile(reducida)
      setPreview(URL.createObjectURL(reducida))
    } catch {
      setFotoFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const nombreCompleto = persona ? `${persona.nombre} ${persona.apellido}` : 'Nueva persona'

  return (
    <div className="space-y-4">
      {mostrarNuevoHorario && (
        <form action={accionHorario} className="card space-y-3 border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">🕘 Crear nuevo horario rápido</span>
            <button
              type="button"
              onClick={() => setMostrarNuevoHorario(false)}
              className="text-xs text-slate-500 hover:underline"
            >
              Cerrar
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block min-w-40 flex-1">
              <span className="text-xs font-medium text-slate-600">Nombre del turno</span>
              <input name="nombre" placeholder="Ej. Turno Mañana / Tarde" required className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Hora entrada</span>
              <input type="time" name="hora_entrada" defaultValue="11:00" required className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Hora salida</span>
              <input type="time" name="hora_salida" defaultValue="18:00" className="input mt-1" />
            </label>
            <label className="block w-28">
              <span className="text-xs font-medium text-slate-600">Tolerancia (min)</span>
              <input
                type="number"
                name="tolerancia_min"
                defaultValue={10}
                min={0}
                max={240}
                required
                className="input mt-1"
              />
            </label>
            <button disabled={pendienteHorario} className="btn-primario">
              {pendienteHorario ? 'Creando…' : '+ Agregar horario'}
            </button>
          </div>
          {estadoHorario?.error && <p className="text-xs text-red-600">{estadoHorario.error}</p>}
          {estadoHorario?.ok && (
            <p className="text-xs font-semibold text-emerald-700">¡Horario agregado a la lista! ✔</p>
          )}
        </form>
      )}

      <form action={accion} className="card space-y-5">
        {persona && <input type="hidden" name="id" value={persona.id} />}

        <div className="flex items-center gap-5">
          <Avatar nombre={nombreCompleto} foto={preview} size={96} className="ring-4 ring-slate-100" />
          <div className="space-y-2">
            <input
              ref={inputFoto}
              type="file"
              accept="image/*"
              capture="user"
              onChange={onFoto}
              className="hidden"
            />
            <button type="button" onClick={() => inputFoto.current?.click()} className="btn-secundario">
              📷 {preview ? 'Cambiar foto' : 'Subir / tomar foto'}
            </button>
            <p className="text-xs text-slate-500">Se mostrará al marcar la asistencia.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nombre *</span>
            <input name="nombre" defaultValue={persona?.nombre} required className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Apellido *</span>
            <input name="apellido" defaultValue={persona?.apellido} required className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Cédula *</span>
            <input
              name="documento"
              defaultValue={persona?.documento}
              required
              inputMode="numeric"
              className="input mt-1 font-mono"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">PIN (4 dígitos, opcional)</span>
            <input
              name="pin"
              defaultValue={persona?.pin ?? ''}
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]{4}"
              className="input mt-1 font-mono"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Área / Cargo</span>
            <input name="area" defaultValue={persona?.area ?? ''} className="input mt-1" />
          </label>
          <div className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Horario</span>
              <button
                type="button"
                onClick={() => setMostrarNuevoHorario((v) => !v)}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                {mostrarNuevoHorario ? '✕ Cancelar' : '+ Crear nuevo horario'}
              </button>
            </div>
            <select
              name="horario_id"
              defaultValue={persona?.horario_id ?? horarios[0]?.id ?? ''}
              className="input mt-1"
            >
              <option value="">Sin horario (siempre a tiempo)</option>
              {horarios.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre} · entra {h.hora_entrada.slice(0, 5)} (+{h.tolerancia_min} min)
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="activo" defaultChecked={persona?.activo ?? true} className="h-4 w-4" />
          <span className="text-sm text-slate-700">Activo (puede marcar asistencia)</span>
        </label>

        {estado?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{estado.error}</p>}
        {estado?.ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Cambios guardados ✔</p>}

        <button disabled={pendiente} className="btn-primario">
          {pendiente ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
