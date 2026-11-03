'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'

export type EstadoForm = { error?: string; ok?: boolean; personaId?: string } | undefined

const schema = z.object({
  documento: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z]{5,20}$/, 'La cédula debe tener entre 5 y 20 caracteres, sin espacios'),
  pin: z
    .string()
    .trim()
    .regex(/^([0-9]{4})?$/, 'El PIN debe tener exactamente 4 dígitos')
    .transform((v) => v || null),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(80),
  area: z
    .string()
    .trim()
    .max(80)
    .transform((v) => v || null),
  horario_id: z
    .string()
    .transform((v) => (v ? Number(v) : null)),
  activo: z.string().optional().transform((v) => v === 'on'),
})

function mensajeError(e: { code?: string; message: string }) {
  if (e.code === '23505') {
    if (e.message.includes('documento')) return 'Ya existe una persona con esa cédula'
    if (e.message.includes('pin')) return 'Ese PIN ya está en uso por otra persona'
  }
  if (e.code === '23514') return 'Revisa los datos: cédula o PIN con formato inválido'
  return 'No se pudo guardar: ' + e.message
}

async function subirFoto(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  personaId: string,
  foto: FormDataEntryValue | null,
) {
  if (!(foto instanceof File) || foto.size === 0) return null
  if (!foto.type.startsWith('image/')) throw new Error('El archivo de foto debe ser una imagen')
  if (foto.size > 2 * 1024 * 1024) throw new Error('La foto no puede pesar más de 2 MB')

  const ext = foto.type === 'image/png' ? 'png' : foto.type === 'image/webp' ? 'webp' : 'jpg'
  const ruta = `${personaId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('fotos').upload(ruta, foto, {
    contentType: foto.type,
    upsert: true,
  })
  if (error) throw new Error('No se pudo subir la foto: ' + error.message)
  return supabase.storage.from('fotos').getPublicUrl(ruta).data.publicUrl
}

export async function guardarPersona(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') ?? '') || null

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  const datos = parsed.data

  let personaId = id
  if (id) {
    const { error } = await supabase.from('personas').update(datos).eq('id', id)
    if (error) return { error: mensajeError(error) }
  } else {
    const { data, error } = await supabase.from('personas').insert(datos).select('id').single()
    if (error) return { error: mensajeError(error) }
    personaId = data.id
  }

  try {
    const url = await subirFoto(supabase, personaId!, formData.get('foto'))
    if (url) {
      const { error } = await supabase.from('personas').update({ foto_url: url }).eq('id', personaId!)
      if (error) return { error: mensajeError(error) }
    }
  } catch (e) {
    return { error: (e as Error).message }
  }

  revalidatePath('/admin/personas')
  if (id) revalidatePath(`/admin/personas/${id}`)
  return { ok: true, personaId: personaId! }
}

export async function quitarFoto(id: string) {
  const { supabase } = await requireAdmin()
  await supabase.from('personas').update({ foto_url: null }).eq('id', id)
  revalidatePath(`/admin/personas/${id}`)
}

export async function regenerarQR(id: string) {
  const { supabase } = await requireAdmin()
  const token = randomBytes(16).toString('hex')
  await supabase.from('personas').update({ qr_token: token }).eq('id', id)
  revalidatePath(`/admin/personas/${id}`)
}

export async function eliminarPersona(id: string) {
  const { supabase } = await requireAdmin()
  await supabase.from('personas').delete().eq('id', id)
  revalidatePath('/admin/personas')
  redirect('/admin/personas')
}

