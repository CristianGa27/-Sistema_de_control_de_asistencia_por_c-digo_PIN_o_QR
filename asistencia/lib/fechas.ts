const ZONA = 'America/Bogota'

export function formatHora(iso: string | Date) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function formatHoraCorta(iso: string | Date) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function formatFecha(iso: string | Date) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatFechaHora(iso: string | Date) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

/** Fecha de hoy (YYYY-MM-DD) en hora local del negocio. */
export function hoyLocal() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date())
}

/** Rango [inicio, fin) en ISO para un día YYYY-MM-DD en hora local (UTC-5, sin horario de verano). */
export function rangoDia(fecha: string) {
  const inicio = new Date(`${fecha}T00:00:00-05:00`)
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000)
  return { inicio: inicio.toISOString(), fin: fin.toISOString() }
}

export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

