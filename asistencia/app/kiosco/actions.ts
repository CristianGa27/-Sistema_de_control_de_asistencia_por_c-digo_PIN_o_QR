'use server'

import QRCode from 'qrcode'
import { headers } from 'next/headers'
import { z } from 'zod'
import { hoyLocal, rangoDia } from '@/lib/fechas'
import { crearTokenQR, obtenerIpLocal } from '@/lib/qr-token'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { EstadoHoy, EstadoMarcacion, ResultadoMarcacion, TipoMarcacion } from '@/lib/tipos'

const schema = z.object({
  codigo: z.string().trim().min(4, 'Código muy corto').max(64),
  metodo: z.enum(['documento', 'qr']),
  tipoForzado: z.enum(['auto', 'entrada', 'salida']).optional(),
})

function minutosDesdeMedianoche(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minutosActualesBogota() {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
  return minutosDesdeMedianoche(partes)
}

export async function registrarMarcacion(input: {
  codigo: string
  metodo: 'documento' | 'qr'
  tipoForzado?: 'auto' | 'entrada' | 'salida'
  dispositivo?: string
}): Promise<ResultadoMarcacion> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Código no válido' }
  }

  const admin = supabaseAdmin()
  if (!admin) {
    return { ok: false, error: 'Configura Supabase en .env.local' }
  }

  const codigo = parsed.data.codigo
  let metodo: 'documento' | 'pin' | 'qr' = parsed.data.metodo

  // 1. Buscar la persona activa por QR, cédula o PIN
  let persona = null
  if (metodo === 'qr') {
    const { data } = await admin.from('personas').select('*').eq('activo', true).eq('qr_token', codigo).maybeSingle()
    persona = data
  } else {
    const { data: porDoc } = await admin
      .from('personas')
      .select('*')
      .eq('activo', true)
      .eq('documento', codigo)
      .maybeSingle()
    if (porDoc) {
      persona = porDoc
      metodo = 'documento'
    } else {
      const { data: porPin } = await admin
        .from('personas')
        .select('*')
        .eq('activo', true)
        .eq('pin', codigo)
        .maybeSingle()
      if (porPin) {
        persona = porPin
        metodo = 'pin'
      }
    }
  }

  if (!persona) {
    return { ok: false, error: 'Código no válido' }
  }

  // 2. Consultar última marcación de hoy
  const { inicio } = rangoDia(hoyLocal())
  const { data: ultima } = await admin
    .from('marcaciones')
    .select('*')
    .eq('persona_id', persona.id)
    .gte('marcado_en', inicio)
    .order('marcado_en', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 3. Decidir si es ENTRADA o SALIDA
  let tipo: TipoMarcacion
  if (parsed.data.tipoForzado === 'entrada' || parsed.data.tipoForzado === 'salida') {
    tipo = parsed.data.tipoForzado
  } else {
    tipo = ultima && ultima.tipo === 'entrada' ? 'salida' : 'entrada'
  }

  // Evitar doble clic accidental del mismo tipo en menos de 8 segundos
  if (ultima && ultima.tipo === tipo && Date.now() - new Date(ultima.marcado_en).getTime() < 8000) {
    return {
      ok: false,
      error: `Ya registraste tu ${tipo} hace unos segundos`,
      nombre: `${persona.nombre} ${persona.apellido}`,
      foto: persona.foto_url,
    }
  }

  // 4. Obtener horario de la persona (si tiene asignado)
  let horario: { hora_entrada: string; hora_salida: string | null; tolerancia_min: number } | null = null
  if (persona.horario_id) {
    const { data: h } = await admin
      .from('horarios')
      .select('hora_entrada, hora_salida, tolerancia_min')
      .eq('id', persona.horario_id)
      .maybeSingle()
    horario = h
  }

  // 5. Validar salida: debe haber marcado entrada hoy y haber cumplido su hora de salida
  if (tipo === 'salida') {
    if (!ultima || ultima.tipo !== 'entrada') {
      return {
        ok: false,
        error: 'No puedes marcar salida sin haber registrado tu entrada hoy',
        nombre: `${persona.nombre} ${persona.apellido}`,
        foto: persona.foto_url,
      }
    }

    if (horario?.hora_salida) {
      const minAhora = minutosActualesBogota()
      const minSalida = minutosDesdeMedianoche(horario.hora_salida)
      if (minAhora < minSalida) {
        const faltan = minSalida - minAhora
        const horas = Math.floor(faltan / 60)
        const mins = faltan % 60
        const textoFaltan = horas > 0 ? `${horas}h ${mins}m` : `${mins} min`
        return {
          ok: false,
          error: `No puedes marcar salida antes de las ${horario.hora_salida.slice(0, 5)} (faltan ${textoFaltan})`,
          nombre: `${persona.nombre} ${persona.apellido}`,
          foto: persona.foto_url,
        }
      }
    }
  }

  // 6. Calcular puntualidad si es entrada
  let estado: EstadoMarcacion | null = null
  let minutos_tarde = 0

  if (tipo === 'entrada') {
    if (horario) {
      const minAhora = minutosActualesBogota()
      const minEntrada = minutosDesdeMedianoche(horario.hora_entrada)
      const limite = minEntrada + (horario.tolerancia_min ?? 0)
      if (minAhora > limite) {
        estado = 'tarde'
        minutos_tarde = minAhora - minEntrada
      } else {
        estado = 'a_tiempo'
      }
    } else {
      estado = 'a_tiempo'
    }
  }

  // 5. Insertar la marcación
  const { data: nueva, error } = await admin
    .from('marcaciones')
    .insert({
      persona_id: persona.id,
      tipo,
      metodo,
      estado,
      minutos_tarde,
      dispositivo: input.dispositivo ?? 'kiosco',
    })
    .select('*')
    .single()

  if (error || !nueva) {
    console.error('registrar_marcacion', error)
    return { ok: false, error: 'Error del servidor, intenta de nuevo' }
  }

  return {
    ok: true,
    tipo,
    estado,
    minutos_tarde,
    hora: nueva.marcado_en,
    nombre: `${persona.nombre} ${persona.apellido}`,
    foto: persona.foto_url,
  }
}

export async function obtenerEstadoHoy(): Promise<EstadoHoy[]> {
  const admin = supabaseAdmin()
  if (!admin) return []

  const { data, error } = await admin
    .from('estado_hoy')
    .select('*')
    .order('primera_entrada', { ascending: true })

  if (error) {
    console.error('estado_hoy', error)
    return []
  }
  return (data ?? []) as EstadoHoy[]
}

/** Genera un código QR para mostrar en el kiosco que las personas escanean con su celular. */
export async function generarQRKiosco(): Promise<{ qrDataUrl: string; url: string }> {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  let host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    const ip = obtenerIpLocal()
    const port = host.split(':')[1] ?? '3000'
    if (ip) host = `${ip}:${port}`
  }

  const token = crearTokenQR()
  const url = `${proto}://${host}/marcar?t=${encodeURIComponent(token)}`
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 420,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  })
  return { qrDataUrl, url }
}
