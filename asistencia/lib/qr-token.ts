import 'server-only'
import { createHmac } from 'crypto'
import { networkInterfaces } from 'os'

function secret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'asistencia-qr-secret'
}

export function crearTokenQR(ts = Date.now()) {
  const sig = createHmac('sha256', secret()).update(String(ts)).digest('hex').slice(0, 16)
  return `${ts}.${sig}`
}

export function verificarTokenQR(token: string, maxEdadMs = 15 * 60 * 1000) {
  const [tsStr, sig] = (token ?? '').split('.')
  const ts = Number(tsStr)
  if (!ts || !sig || Math.abs(Date.now() - ts) > maxEdadMs) return false
  const esperado = createHmac('sha256', secret()).update(String(ts)).digest('hex').slice(0, 16)
  return sig === esperado
}

/** Obtiene la IP de la red local (Wi-Fi/LAN) para que el celular pueda abrir el enlace del QR. */
export function obtenerIpLocal(): string | null {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
        return net.address
      }
    }
  }
  return null
}

