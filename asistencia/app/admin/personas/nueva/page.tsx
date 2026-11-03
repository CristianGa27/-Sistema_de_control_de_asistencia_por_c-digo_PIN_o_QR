import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import type { Horario } from '@/lib/tipos'
import { PersonaForm } from '../PersonaForm'

export default async function NuevaPersonaPage() {
  const { supabase } = await requireAdmin()
  const { data: horarios } = await supabase.from('horarios').select('*').order('hora_entrada')

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/personas" className="text-sm text-slate-500 hover:underline">
        ← Volver
      </Link>
      <h1 className="text-2xl font-extrabold text-slate-900">Nueva persona</h1>
      <PersonaForm horarios={(horarios ?? []) as Horario[]} />
    </div>
  )
}

