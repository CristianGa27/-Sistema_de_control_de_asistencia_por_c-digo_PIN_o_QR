'use client'

import { Scanner } from '@yudiel/react-qr-scanner'

export function EscanerQR({ onCodigo, pausado }: { onCodigo: (texto: string) => void; pausado: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border-4 border-slate-700 bg-black">
      <Scanner
        paused={pausado}
        onScan={(codigos) => {
          const valor = codigos?.[0]?.rawValue
          if (valor) onCodigo(valor)
        }}
        formats={['qr_code']}
        scanDelay={1500}
        components={{ finder: true }}
        styles={{ container: { aspectRatio: '1 / 1' } }}
      />
    </div>
  )
}

