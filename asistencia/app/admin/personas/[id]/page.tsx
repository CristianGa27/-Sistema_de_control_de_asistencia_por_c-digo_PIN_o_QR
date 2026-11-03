import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { Avatar } from '@/components/Avatar'
import { requireAdmin } from '@/lib/auth'
import { formatFechaHora } from '@/lib/fechas'
import { contenidoQR } from '@/lib/qr'
import type { Horario, Persona } from '@/lib/tipos'
import { eliminarPersona, quitarFoto, regenerarQR } from '../actions'
import { PersonaForm } from '../PersonaForm'
import { BotonConfirmar } from './BotonConfirmar'
import { BotonImprimir } from './BotonImprimir'

export default async function PersonaPage({ params }: PageProps<'/admin/personas/[id]'>) {
  const { id } = await params
  const { supabase } = await requireAdmin()

  const [{ data: persona }, { data: horarios }, { data: marcas }] = await Promise.all([
    supabase.from('personas').select('*').eq('id', id).maybeSingle(),
    supabase.from('horarios').select('*').order('hora_entrada'),
    supabase
      .from('marcaciones')
      .select('id, tipo, estado, minutos_tarde, metodo, marcado_en')
      .eq('persona_id', id)
      .order('marcado_en', { ascending: false })
      .limit(10),
  ])
  if (!persona) notFound()
  const p = persona as Persona
  const nombre = `${p.nombre} ${p.apellido}`

  const qr = await QRCode.toDataURL(contenidoQR(p.qr_token), { width: 400, margin: 2 })

  return (
    <div className="space-y-6">
      <Link href="/admin/personas" className="text-sm text-slate-500 hover:underline print:hidden">
        ← Volver
      </Link>
      <h1 className="text-2xl font-extrabold text-slate-900 print:hidden">{nombre}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6 print:hidden">
          <PersonaForm persona={p} horarios={(horarios ?? []) as Horario[]} />

          <div className="card">
            <h2 className="mb-3 font-bold text-slate-900">Últimas marcaciones</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {(marcas ?? []).length === 0 && <li className="py-2 text-slate-400">Sin marcaciones</li>}
              {(marcas ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <span className="tabular-nums text-slate-600">{formatFechaHora(m.marcado_en)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs uppercase text-slate-400">{m.metodo}</span>
                    {m.tipo === 'salida' ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">Salida</span>
                    ) : m.estado === 'tarde' ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        Entrada · tarde {m.minutos_tarde}m
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                        Entrada · a tiempo
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card flex flex-wrap gap-3 border-red-200">
            {p.foto_url && (
              <form action={quitarFoto.bind(null, p.id)}>
                <button className="btn-secundario">Quitar foto</button>
              </form>
            )}
            <BotonConfirmar
              accion={eliminarPersona.bind(null, p.id)}
              mensaje={`¿Eliminar a ${nombre} y todas sus marcaciones? Esta acción no se puede deshacer.`}
              className="btn-peligro"
            >
              Eliminar persona
            </BotonConfirmar>
          </div>
        </div>

        {/* Carnet con QR */}
        <div className="space-y-3">
          <div id="carnet" className="card flex flex-col items-center gap-3 text-center print:border-2 print:shadow-none">
            <Avatar nombre={nombre} foto={p.foto_url} size={110} />
            <div>
              <div className="text-xl font-extrabold text-slate-900">{nombre}</div>
              {p.area && <div className="text-sm text-slate-500">{p.area}</div>}
              <div className="mt-1 font-mono text-sm text-slate-600">C.C. {p.documento}</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Código QR" className="h-56 w-56" />
            <div className="text-xs text-slate-400">Escanea este código en el kiosco</div>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <a href={qr} download={`QR-${p.documento}.png`} className="btn-secundario flex-1">
              ⬇ Descargar QR
            </a>
            <BotonImprimir />
          </div>
          <div className="print:hidden">
            <BotonConfirmar
              accion={regenerarQR.bind(null, p.id)}
              mensaje="El QR actual dejará de funcionar. ¿Generar uno nuevo?"
              className="btn-secundario w-full"
            >
              🔄 Generar nuevo QR
            </BotonConfirmar>
          </div>
        </div>
      </div>
    </div>
  )
}

