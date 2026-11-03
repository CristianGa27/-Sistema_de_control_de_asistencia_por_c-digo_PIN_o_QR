export type TipoMarcacion = 'entrada' | 'salida'
export type EstadoMarcacion = 'a_tiempo' | 'tarde'
export type MetodoMarcacion = 'documento' | 'pin' | 'qr' | 'manual'

export type ResultadoMarcacion =
  | {
      ok: true
      tipo: TipoMarcacion
      estado: EstadoMarcacion | null
      minutos_tarde: number
      hora: string
      nombre: string
      foto: string | null
    }
  | {
      ok: false
      error: string
      nombre?: string
      foto?: string | null
    }

export type EstadoHoy = {
  persona_id: string
  nombre: string
  apellido: string
  area: string | null
  foto_url: string | null
  ultimo_tipo: TipoMarcacion
  ultima_marca: string
  primera_entrada: string | null
  estado_llegada: EstadoMarcacion | null
  minutos_tarde: number | null
}

export type Horario = {
  id: number
  nombre: string
  hora_entrada: string
  hora_salida: string | null
  tolerancia_min: number
}

export type Persona = {
  id: string
  documento: string
  pin: string | null
  qr_token: string
  nombre: string
  apellido: string
  area: string | null
  foto_url: string | null
  horario_id: number | null
  activo: boolean
  created_at: string
}

