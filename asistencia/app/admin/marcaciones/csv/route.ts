import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { formatFechaHora, hoyLocal } from '@/lib/fechas'
import { consultarMarcaciones } from '@/lib/marcaciones'

function celda(v: string | number | null | undefined) {
  const s = String(v ?? '')
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(request: NextRequest) {
  const { supabase } = await requireAdmin()
  const sp = request.nextUrl.searchParams
  const desde = sp.get('desde') || hoyLocal()
  const hasta = sp.get('hasta') || desde

  const filas = await consultarMarcaciones(
    supabase,
    { desde, hasta, q: sp.get('q') ?? '', tipo: sp.get('tipo') ?? '' },
    20000,
  )

  const encabezado = ['Fecha y hora', 'Cédula', 'Nombre', 'Apellido', 'Área', 'Tipo', 'Estado', 'Minutos tarde', 'Método']
  const lineas = filas.map((m) =>
    [
      formatFechaHora(m.marcado_en),
      m.personas.documento,
      m.personas.nombre,
      m.personas.apellido,
      m.personas.area,
      m.tipo,
      m.tipo === 'entrada' ? (m.estado === 'tarde' ? 'Tarde' : 'A tiempo') : '',
      m.tipo === 'entrada' ? m.minutos_tarde : '',
      m.metodo,
    ]
      .map(celda)
      .join(';'),
  )

  const contenido = '\uFEFF' + [encabezado.join(';'), ...lineas].join('\r\n')
  return new NextResponse(contenido, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="asistencia_${desde}_${hasta}.csv"`,
    },
  })
}

