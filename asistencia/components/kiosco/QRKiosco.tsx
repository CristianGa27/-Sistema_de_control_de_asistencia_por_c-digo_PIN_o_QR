'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { generarQRKiosco } from '@/app/kiosco/actions'

const EscanerQR = dynamic(() => import('@/components/kiosco/EscanerQR').then((m) => m.EscanerQR), {
  ssr: false,
  loading: () => <div className="aspect-square w-72 animate-pulse rounded-2xl bg-slate-700" />,
})

export function QRKiosco({
  onEscanear,
  pausado,
}: {
  onEscanear: (codigo: string) => void
  pausado: boolean
}) {
  const [submodo, setSubmodo] = useState<'mostrar' | 'escanear'>('mostrar')
  const [qr, setQr] = useState<{ qrDataUrl: string; url: string } | null>(null)
  const [segundos, setSegundos] = useState(60)

  const cargar = useCallback(async () => {
    const nuevo = await generarQRKiosco()
    setQr(nuevo)
    setSegundos(60)
  }, [])

  // Detecta automáticamente si está en celular/tablet para ofrecer el escáner o el QR
  useEffect(() => {
    if (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const t = setTimeout(() => setSubmodo('escanear'), 0)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const t0 = setTimeout(cargar, 0)
    const intervalo = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          cargar()
          return 60
        }
        return s - 1
      })
    }, 1000)
    return () => {
      clearTimeout(t0)
      clearInterval(intervalo)
    }
  }, [cargar])

  const procesarLectura = (texto: string) => {
    try {
      const u = new URL(texto)
      if (u.pathname.startsWith('/marcar')) {
        window.location.href = u.pathname + u.search
        return
      }
    } catch {
      /* No es una URL, es un código QR de carnet (ASIS-...) o cédula */
    }
    onEscanear(texto)
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-slate-700 bg-slate-800/70 p-5 text-center">
      {/* Selector entre ver el QR en pantalla o abrir la cámara en el móvil */}
      <div className="grid w-full grid-cols-2 gap-1.5 rounded-xl bg-slate-900 p-1 text-sm">
        <button
          type="button"
          onClick={() => setSubmodo('mostrar')}
          className={`rounded-lg py-2 font-semibold transition ${
            submodo === 'mostrar' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          🖥 Mostrar QR
        </button>
        <button
          type="button"
          onClick={() => setSubmodo('escanear')}
          className={`rounded-lg py-2 font-semibold transition ${
            submodo === 'escanear' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          📷 Escanear con cámara
        </button>
      </div>

      {submodo === 'mostrar' ? (
        <>
          {qr ? (
            <div className="rounded-2xl bg-white p-4 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.qrDataUrl} alt="Código QR para marcar asistencia" className="h-64 w-64" />
            </div>
          ) : (
            <div className="h-72 w-72 animate-pulse rounded-2xl bg-slate-700" />
          )}

          <div className="space-y-1">
            <p className="text-base font-bold text-white">Escanea este código QR con tu celular</p>
            <p className="text-xs text-slate-400">
              Se renueva automáticamente en <span className="font-mono text-emerald-400">{segundos}s</span>
            </p>
          </div>

          {qr && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={cargar}
                className="rounded-lg bg-slate-700 px-3 py-1.5 font-semibold text-slate-200 hover:bg-slate-600"
              >
                🔄 Nuevo QR
              </button>
              <a
                href={qr.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-emerald-600/20 px-3 py-1.5 font-semibold text-emerald-300 hover:bg-emerald-600/30"
              >
                📱 Abrir formulario del QR
              </a>
            </div>
          )}
        </>
      ) : (
        <div className="w-full max-w-xs space-y-3">
          <EscanerQR onCodigo={procesarLectura} pausado={pausado} />
          <p className="text-xs text-slate-400">
            Apunta la cámara de tu móvil al código QR de la pantalla o del carnet
          </p>
        </div>
      )}
    </div>
  )
}
