'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { obtenerEstadoHoy, registrarMarcacion } from '@/app/kiosco/actions'
import { Confirmacion } from '@/components/kiosco/Confirmacion'
import { ListaPresentes } from '@/components/kiosco/ListaPresentes'
import { QRKiosco } from '@/components/kiosco/QRKiosco'
import { Reloj } from '@/components/kiosco/Reloj'
import { TecladoNumerico } from '@/components/kiosco/TecladoNumerico'
import { PREFIJO_QR } from '@/lib/qr'
import type { EstadoHoy, ResultadoMarcacion } from '@/lib/tipos'

type Modo = 'codigo' | 'qr'
type TipoSeleccion = 'auto' | 'entrada' | 'salida'

export function KioscoPanel({ estadoInicial }: { estadoInicial: EstadoHoy[] }) {
  const [modo, setModo] = useState<Modo>('codigo')
  const [tipoSeleccion, setTipoSeleccion] = useState<TipoSeleccion>('auto')
  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState<ResultadoMarcacion | null>(null)
  const [estado, setEstado] = useState<EstadoHoy[]>(estadoInicial)
  const [pendiente, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const prevEstadoRef = useRef<Map<string, string>>(
    new Map(estadoInicial.map((e) => [e.persona_id, e.ultima_marca])),
  )

  const refrescar = useCallback(async (detectarNuevas = false) => {
    const nuevo = await obtenerEstadoHoy()
    if (detectarNuevas) {
      for (const item of nuevo) {
        const prevMarca = prevEstadoRef.current.get(item.persona_id)
        if (prevMarca !== item.ultima_marca) {
          setResultado({
            ok: true,
            tipo: item.ultimo_tipo,
            estado: item.estado_llegada,
            minutos_tarde: item.minutos_tarde ?? 0,
            hora: item.ultima_marca,
            nombre: `${item.nombre} ${item.apellido}`,
            foto: item.foto_url,
          })
          break
        }
      }
    }
    prevEstadoRef.current = new Map(nuevo.map((e) => [e.persona_id, e.ultima_marca]))
    setEstado(nuevo)
  }, [])

  // Actualiza cada 3 s para reflejar de inmediato cuando alguien marca escaneando el QR desde su celular
  useEffect(() => {
    const t = setInterval(() => refrescar(true), 3000)
    return () => clearInterval(t)
  }, [refrescar])

  useEffect(() => {
    if (modo === 'codigo' && !resultado) inputRef.current?.focus()
  }, [modo, resultado])

  const enviar = useCallback(
    (valor: string, forzar?: TipoSeleccion) => {
      const texto = valor.trim()
      if (!texto || pendiente || resultado) return
      const esQR = texto.startsWith(PREFIJO_QR)
      startTransition(async () => {
        const r = await registrarMarcacion({
          codigo: esQR ? texto.slice(PREFIJO_QR.length) : texto,
          metodo: esQR ? 'qr' : 'documento',
          tipoForzado: forzar ?? tipoSeleccion,
        })
        setResultado(r)
        setCodigo('')
        if (r.ok) await refrescar(false)
      })
    },
    [pendiente, resultado, refrescar, tipoSeleccion],
  )

  const onTecla = (t: string) => {
    if (t === 'borrar') setCodigo((c) => c.slice(0, -1))
    else if (t === 'ok') enviar(codigo)
    else setCodigo((c) => (c.length < 20 ? c + t : c))
    inputRef.current?.focus()
  }

  const cerrar = useCallback(() => setResultado(null), [])

  return (
    <main className="flex min-h-screen flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between border-b border-slate-800 px-8 py-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Control de Asistencia</h1>
          <p className="text-sm text-slate-400">Marca tu entrada o salida</p>
        </div>
        <Reloj />
      </header>

      <div className="grid flex-1 gap-8 p-8 lg:grid-cols-[minmax(0,480px)_1fr]">
        <section className="flex flex-col gap-4">
          {/* Selector de método: Cédula/PIN o QR */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-800 p-1.5">
            {(
              [
                ['codigo', '🔢 Cédula / PIN'],
                ['qr', '📲 Código QR'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setModo(m)}
                className={`rounded-xl py-3 text-lg font-semibold transition ${
                  modo === m ? 'bg-emerald-500 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Selector de tipo de marcación: Automático, Entrada o Salida */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-800/80 p-1 text-sm">
            <button
              type="button"
              onClick={() => setTipoSeleccion('auto')}
              className={`rounded-lg py-2 font-semibold transition ${
                tipoSeleccion === 'auto' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔄 Automático
            </button>
            <button
              type="button"
              onClick={() => setTipoSeleccion('entrada')}
              className={`rounded-lg py-2 font-semibold transition ${
                tipoSeleccion === 'entrada' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🟢 Entrada
            </button>
            <button
              type="button"
              onClick={() => setTipoSeleccion('salida')}
              className={`rounded-lg py-2 font-semibold transition ${
                tipoSeleccion === 'salida' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔵 Salida
            </button>
          </div>

          {modo === 'codigo' ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  enviar(codigo)
                }}
              >
                <input
                  ref={inputRef}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onBlur={() => !resultado && setTimeout(() => inputRef.current?.focus(), 100)}
                  placeholder="Escribe tu cédula o PIN"
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-full rounded-2xl border-2 border-slate-700 bg-slate-800 px-5 py-5 text-center font-mono text-4xl tracking-[0.2em] outline-none placeholder:text-lg placeholder:tracking-normal placeholder:text-slate-500 focus:border-emerald-500"
                />
              </form>
              <TecladoNumerico onTecla={onTecla} deshabilitado={pendiente} />
            </>
          ) : (
            <QRKiosco onEscanear={enviar} pausado={!!resultado || pendiente} />
          )}

          {pendiente && <p className="text-center text-emerald-400">Registrando…</p>}
        </section>

        <section className="min-h-[400px] rounded-3xl bg-slate-800/40 p-6 ring-1 ring-slate-800">
          <ListaPresentes estado={estado} />
        </section>
      </div>

      {resultado && <Confirmacion resultado={resultado} onCerrar={cerrar} />}
    </main>
  )
}
