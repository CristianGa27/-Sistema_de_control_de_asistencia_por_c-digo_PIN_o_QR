'use client'

export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secundario flex-1">
      🖨 Imprimir carnet
    </button>
  )
}

