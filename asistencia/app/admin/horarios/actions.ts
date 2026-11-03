'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'

export type EstadoHorario = { error?: string; ok?: boolean } | undefined

const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(60),
  hora_entrada: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de entrada inválida'),
  hora_salida: z
    .string()
    .regex(/^(\d{2}:\d{2})?$/, 'Hora de salida inválida')
    .transform((v) => v || null),
  tolerancia_min: z.coerce.number().int().min(0).max(240),
})

export async function guardarHorario(_prev: EstadoHorario, formData: FormData): Promise<EstadoHorario> {
  const { supabase } = await requireAdmin()
  const id = Number(formData.get('id')) || null
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const { error } = id
    ? await supabase.from('horarios').update(parsed.data).eq('id', id)
    : await supabase.from('horarios').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/admin/horarios')
  revalidatePath('/admin/personas')
  revalidatePath('/admin/personas/nueva')
  return { ok: true }
}

export async function eliminarHorario(id: number) {
  const { supabase } = await requireAdmin()
  await supabase.from('horarios').delete().eq('id', id)
  revalidatePath('/admin/horarios')
}

