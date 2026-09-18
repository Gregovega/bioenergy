// =============================================================
// PÁGINA: app/page.tsx  →  ruta pública "/"
// QUÉ ES: la landing page de Bioenergy. Es lo primero que ve
// cualquier persona que llega al sitio, sin necesidad de cuenta.
// La lógica que antes estaba aquí (redirigir según el rol) se
// movió a app/portal/page.tsx, ruta "/portal".
// =============================================================

import Link from 'next/link'
import {
  Zap,
  Sun,
  Battery,
  Users,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Handshake,
  Package,
  ArrowRight,
  LineChart,
  Leaf,
} from 'lucide-react'

export const metadata = {
  title: 'Bioenergy · Energía que rinde para todos',
  description:
    'Invierte desde montos pequeños en equipos de energía solar que generan ingresos reales, o aporta tu propio equipo para que nosotros lo gestionemos.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base">
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-50 border-b border-line/60 bg-base/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" strokeWidth={2.5} />
            <span className="font-display text-lg tracking-tight text-ink">Bioenergy</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#como-funciona" className="transition-colors hover:text-ink">
              Cómo funciona
            </a>
            <a href="#formas" className="transition-colors hover:text-ink">
              Formas de participar
            </a>
            <a href="#transparencia" className="transition-colors hover:text-ink">
              Transparencia
            </a>
          </nav>
          <Link
            href="/login"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#F2B705 1px, transparent 1px), linear-gradient(90deg, #F2B705 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(242,183,5,0.18), transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sun className="h-3.5 w-3.5" />
              Energía solar con retorno compartido
            </span>

            <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-ink sm:text-6xl">
              La energía que mueve al país,
              <br />
              <span className="text-accent">financiada por su gente.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Instalamos equipos solares en hogares y comercios que pagan una mensualidad por
              tenerlos. Ese pago se reparte entre quienes ayudaron a comprar el equipo. No hace
              falta ser millonario para entrar: con el precio de una salida a comer ya eres dueño
              de una parte.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#formas"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-base transition-opacity hover:opacity-90 sm:w-auto"
              >
                Quiero participar
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#como-funciona"
                className="flex w-full items-center justify-center rounded-lg border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent sm:w-auto"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          {/* Métricas de propuesta */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
            {[
              { valor: 'Bajo', etiqueta: 'Monto mínimo de entrada' },
              { valor: '100%', etiqueta: 'Del equipo respaldado por gente real' },
              { valor: 'Mensual', etiqueta: 'Frecuencia de reparto' },
              { valor: '3', etiqueta: 'Formas distintas de participar' },
            ].map((m) => (
              <div key={m.etiqueta} className="bg-surface p-6 text-center">
                <p className="font-display text-2xl text-accent">{m.valor}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{m.etiqueta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CÓMO FUNCIONA ---------------- */}
      <section id="como-funciona" className="border-t border-line bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Cómo funciona
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
              Un equipo, muchos dueños, un ingreso que se reparte
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              El modelo es simple y no depende de especulación: hay un equipo físico, hay alguien
              que lo usa y paga por él, y ese pago se divide entre quienes lo hicieron posible.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                paso: '01',
                titulo: 'Se reúne el capital',
                texto:
                  'Varias personas aportan lo que pueden hasta cubrir el costo de un equipo solar completo. Cada quien recibe participaciones según lo que puso.',
              },
              {
                icon: Battery,
                paso: '02',
                titulo: 'Se instala el equipo',
                texto:
                  'Bioenergy compra, nacionaliza e instala el sistema en la casa o el negocio de un cliente que necesita energía estable.',
              },
              {
                icon: Wallet,
                paso: '03',
                titulo: 'El cliente paga su mensualidad',
                texto:
                  'El cliente paga menos de lo que gastaría en plantas, combustible o pérdidas por apagones. Paga por tener luz, no por comprar el equipo.',
              },
              {
                icon: TrendingUp,
                paso: '04',
                titulo: 'El dinero se reparte',
                texto:
                  'Cada pago confirmado se divide automáticamente entre todos los dueños del equipo, en proporción exacta a sus participaciones.',
              },
            ].map(({ icon: Icon, paso, titulo, texto }) => (
              <div
                key={paso}
                className="rounded-xl border border-line bg-surface p-6 transition-colors hover:border-accent/40"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
                  <span className="font-mono text-xs text-muted">{paso}</span>
                </div>
                <h3 className="mt-5 font-display text-lg text-ink">{titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FORMAS DE PARTICIPAR ---------------- */}
      <section id="formas" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Formas de participar
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
              Entras con lo que tengas: dinero o equipo
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              No todos llegan igual. Unos tienen ahorros pequeños, otros ya tienen equipos parados
              sin producir. Para cada caso hay una puerta de entrada distinta, pero todos cobran
              bajo la misma regla.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {/* Inversionista */}
            <div className="flex flex-col rounded-xl border border-accent/40 bg-surface p-7">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
                <Users className="h-3 w-3" />
                Más común
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">Aportas dinero</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Compras participaciones de un equipo. Mientras más temprano entras, mejor es tu
                precio de entrada. Desde ese momento cobras tu parte de cada mensualidad que pague
                el cliente de ese equipo.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                {[
                  'Entrada accesible, sin necesidad de comprar un equipo completo',
                  'Cobras cada vez que el cliente paga, no al final de un plazo',
                  'Ves tus participaciones y tus pagos en tu panel privado',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tercero que aporta equipo */}
            <div className="flex flex-col rounded-xl border border-line bg-surface p-7">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-signal/10 px-2.5 py-1 text-[11px] font-medium text-signal">
                <Package className="h-3 w-3" />
                Para empresarios
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">Aportas tu equipo</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                ¿Ya tienes equipos y no sabes cómo rentabilizarlos? Los entregas a costo real —
                incluyendo nacionalización — y nosotros los instalamos, conseguimos el cliente,
                cobramos y damos soporte. Tú no haces operación.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                {[
                  'Tu equipo se valora a su costo real, sin descuentos por nuestra parte',
                  'Recibes participaciones bajo la misma regla que todos los demás',
                  'Nosotros ganamos por gestionar, no por revenderte el equipo',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cliente final */}
            <div className="flex flex-col rounded-xl border border-line bg-surface p-7">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted/10 px-2.5 py-1 text-[11px] font-medium text-muted">
                <Sun className="h-3 w-3" />
                Para hogares y comercios
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">Recibes la energía</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                No pagas el equipo completo ni te endeudas para comprarlo. Pagas una mensualidad
                por tener energía estable, con el equipo instalado, mantenido y respaldado por
                nosotros.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                {[
                  'Sin desembolso grande al inicio',
                  'Mantenimiento y soporte incluidos',
                  'Energía estable aunque falle la red',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 rounded-xl border border-line bg-surface/50 p-5 text-sm leading-relaxed text-muted">
            <span className="font-medium text-ink">La regla que nos une:</span> venga tu aporte en
            dinero o en equipo, todas las participaciones valen lo mismo a la hora de repartir. Lo
            que cambia es el precio al que entraste, no lo que cobras después.
          </p>
        </div>
      </section>

      {/* ---------------- TRANSPARENCIA ---------------- */}
      <section id="transparencia" className="border-t border-line bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-accent">
                Transparencia
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
                Nada de promesas a ciegas
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Tu dinero está atado a un equipo físico con número de serie, instalado en una
                dirección real, usado por un cliente con nombre. No es un fondo abstracto ni una
                promesa de rendimiento futuro.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Cuando el cliente paga, el sistema reparte automáticamente. Ni nosotros decidimos a
                mano quién cobra cuánto: lo calcula el sistema según las participaciones de cada
                quien.
              </p>

              <div className="mt-10">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-base transition-opacity hover:opacity-90"
                >
                  Entrar a mi panel
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  titulo: 'Respaldo físico',
                  texto: 'Cada participación está atada a un equipo con serial identificable.',
                },
                {
                  icon: LineChart,
                  titulo: 'Reparto automático',
                  texto: 'El sistema calcula y acredita cada pago sin intervención manual.',
                },
                {
                  icon: Handshake,
                  titulo: 'Reglas iguales',
                  texto: 'La misma fórmula de reparto aplica para todos los participantes.',
                },
                {
                  icon: Leaf,
                  titulo: 'Impacto medible',
                  texto: 'Cada equipo desplaza consumo sucio y reduce emisiones reales.',
                },
              ].map(({ icon: Icon, titulo, texto }) => (
                <div key={titulo} className="rounded-xl border border-line bg-surface p-6">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
                  <h3 className="mt-4 font-display text-base text-ink">{titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CIERRE ---------------- */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            La luz no debería ser un privilegio
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
            Y financiarla tampoco debería estar reservado a unos pocos. Si tienes algo que aportar
            — poco o mucho, dinero o equipos — hay un lugar para ti en esto.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-base transition-opacity hover:opacity-90 sm:w-auto"
            >
              Empezar ahora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" strokeWidth={2.5} />
            <span className="font-display text-sm text-ink">Bioenergy</span>
          </div>
          <p className="text-center text-xs text-muted sm:text-right">
            Energía distribuida con retorno compartido.
            <br className="sm:hidden" /> © {new Date().getFullYear()} Bioenergy.
          </p>
        </div>
      </footer>
    </div>
  )
}
