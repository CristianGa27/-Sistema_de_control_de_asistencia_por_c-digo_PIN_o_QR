'use client'

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'ok'] as const

export function TecladoNumerico({
  onTecla,
  deshabilitado,
}: {
  onTecla: (t: (typeof TECLAS)[number]) => void
  deshabilitado?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TECLAS.map((t) => (
        <button
          key={t}
          type="button"
          disabled={deshabilitado}
          onClick={() => onTecla(t)}
          className={`h-20 rounded-2xl text-3xl font-bold shadow transition active:scale-95 disabled:opacity-50 ${
            t === 'ok'
              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
              : t === 'borrar'
                ? 'bg-slate-600 text-white hover:bg-slate-500'
                : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {t === 'ok' ? '✓' : t === 'borrar' ? '⌫' : t}
        </button>
      ))}
    </div>
  )
}

