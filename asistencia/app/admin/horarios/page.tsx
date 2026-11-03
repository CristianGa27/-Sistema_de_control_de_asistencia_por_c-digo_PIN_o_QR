import { requireAdmin } from '@/lib/auth'
import type { Horario } from '@/lib/tipos'
import { BotonConfirmar } from '../personas/[id]/BotonConfirmar'
import { eliminarHorario } from './actions'
import { HorarioForm } from './HorarioForm'

export default async function HorariosPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('horarios').select('*').order('hora_entrada')
  const horarios = (data ?? []) as Horario[]

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Horarios</h1>
        <p className="text-slate-500">
          Si una persona marca su entrada después de la <b>hora de entrada + tolerancia</b>, se registra como{' '}
          <span className="font-semibold text-red-600">tarde</span>; si no, como{' '}
          <span className="font-semibold text-green-600">a tiempo</span>.
        </p>
      </div>

      <div className="card">
        <h2 className="mb-3 font-bold text-slate-900">Nuevo horario</h2>
        <HorarioForm />
      </div>

      <div className="space-y-3">
        {horarios.length === 0 && <p className="text-slate-400">No hay horarios creados.</p>}
        {horarios.map((h) => (
          <div key={h.id} className="card space-y-2">
            <HorarioForm horario={h} />
            <div className="text-right">
              <BotonConfirmar
                accion={eliminarHorario.bind(null, h.id)}
                mensaje={`¿Eliminar el horario "${h.nombre}"? Las personas con este horario quedarán sin horario.`}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                Eliminar
              </BotonConfirmar>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

