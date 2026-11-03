import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-900 p-8 text-white">
      <h1 className="text-4xl font-extrabold">Control de Asistencia</h1>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/kiosco"
          className="rounded-2xl bg-emerald-500 px-8 py-5 text-xl font-bold shadow hover:bg-emerald-400"
        >
          🕒 Abrir kiosco
        </Link>
        <Link
          href="/admin"
          className="rounded-2xl bg-slate-700 px-8 py-5 text-xl font-bold shadow hover:bg-slate-600"
        >
          ⚙️ Administración
        </Link>
      </div>
    </main>
  )
}
