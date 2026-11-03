/** Prefijo que llevan los QR de las personas: ASIS-<qr_token> */
export const PREFIJO_QR = 'ASIS-'

export function contenidoQR(qrToken: string) {
  return `${PREFIJO_QR}${qrToken}`
}

