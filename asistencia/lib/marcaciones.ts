import 'server-only'
import { rangoDia } from '@/lib/fechas'
import type { supabaseServer } from '@/lib/supabase/server'

export type FiltrosMarcaciones = { desde: string; hasta: string; q?: string; tipo?: string }

export type FilaMarcacion = {
  id: number
  tipo: 'entrada' | 'salida'
  metodo: string
  estado: 'a_tiempo' | 'tarde' | null
  minutos_tarde: number
  marcado_en: string
  personas: { nombre: string; apellido: string; documento: string; area: string | null; foto_url: string | null }
}

export async function consultarMarcaciones(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  { desde, hasta, q, tipo }: FiltrosMarcaciones,
  limite = 1000,
) {
  let query = supabase
    .from('marcaciones')
    .select('id, tipo, metodo, estado, minutos_tarde, marcado_en, personas!inner(nombre, apellido, documento, area, foto_url)')
    .gte('marcado_en', rangoDia(desde).inicio)
    .lt('marcado_en', rangoDia(hasta).fin)
    .order('marcado_en', { ascending: false })
    .limit(limite)

  if (tipo === 'entrada' || tipo === 'salida') query = query.eq('tipo', tipo)
  if (tipo === 'tarde') query = query.eq('estado', 'tarde')
  if (q) {
    const s = q.replace(/[%,()]/g, '')
    query = query.or(`nombre.ilike.%${s}%,apellido.ilike.%${s}%,documento.ilike.%${s}%`, {
      referencedTable: 'personas',
    })
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as FilaMarcacion[]
}

