import { KioscoPanel } from '@/components/kiosco/KioscoPanel'
import { obtenerEstadoHoy } from './actions'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Kiosco · Control de Asistencia' }

export default async function KioscoPage() {
  const estado = await obtenerEstadoHoy()
  return <KioscoPanel estadoInicial={estado} />
}

