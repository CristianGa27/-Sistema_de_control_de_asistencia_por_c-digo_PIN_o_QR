import { MarcarMovilForm } from './MarcarMovilForm'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Marcar Asistencia · QR' }

export default async function MarcarPage({ searchParams }: PageProps<'/marcar'>) {
  const { t } = await searchParams
  const token = typeof t === 'string' ? t : ''
  return <MarcarMovilForm token={token} />
}

