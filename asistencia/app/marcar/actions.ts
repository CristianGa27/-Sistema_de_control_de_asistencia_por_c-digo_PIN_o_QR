'use server'

import { registrarMarcacion } from '@/app/kiosco/actions'
import { verificarTokenQR } from '@/lib/qr-token'
import type { ResultadoMarcacion } from '@/lib/tipos'

export async function marcarDesdeQR(input: {
  token: string
  codigo: string
  tipoForzado?: 'auto' | 'entrada' | 'salida'
}): Promise<ResultadoMarcacion> {
  if (!verificarTokenQR(input.token)) {
    return { ok: false, error: 'El código QR expiró. Escanea el QR actual de la pantalla.' }
  }

  const codigo = input.codigo.trim()
  if (codigo.length < 4) {
    return { ok: false, error: 'Ingresa tu cédula o PIN' }
  }

  return registrarMarcacion({
    codigo,
    metodo: 'documento',
    tipoForzado: input.tipoForzado ?? 'auto',
    dispositivo: 'qr-movil',
  })
}
