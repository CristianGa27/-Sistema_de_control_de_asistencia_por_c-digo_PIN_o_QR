import { iniciales } from '@/lib/fechas'

export function Avatar({
  nombre,
  foto,
  size = 48,
  className = '',
}: {
  nombre: string
  foto?: string | null
  size?: number
  className?: string
}) {
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={foto}
        alt={nombre}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-600 font-bold text-white ${className}`}
    >
      {iniciales(nombre)}
    </div>
  )
}

