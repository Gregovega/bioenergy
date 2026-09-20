'use client'

// =============================================================
// COMPONENTE: arbol-referidos.tsx
// PORTAL: Inversionista
// QUÉ HACE: recibe la red completa (niveles 1-3) ya cargada desde
// el servidor y la muestra colapsada: solo los referidos directos
// (nivel 1) a simple vista. Al hacer clic en una persona, despliega
// debajo su propia lista de referidos, y así sucesivamente hasta el
// nivel 3. Evita que la pantalla se llene con cientos de nombres de
// una vez cuando la red crece.
// =============================================================

import { useState } from 'react'
import { ChevronRight, ChevronDown, User } from 'lucide-react'

type PersonaRed = {
  nivel: number
  inversionista_id: string
  referido_por_id: string | null
  nombre: string
  fecha_registro: string
  ganado_por_mi_usd: number
}

function formatoUsd(n: number) {
  const signo = n < 0 ? '-' : ''
  return `${signo}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

const PCT_POR_NIVEL: Record<number, string> = { 1: '5%', 2: '3%', 3: '2%' }

function NodoReferido({
  persona,
  hijos,
}: {
  persona: PersonaRed
  hijos: PersonaRed[]
}) {
  const [abierto, setAbierto] = useState(false)
  const tieneHijos = hijos.length > 0

  return (
    <li>
      <div
        role={tieneHijos ? 'button' : undefined}
        onClick={() => tieneHijos && setAbierto((v) => !v)}
        className={`flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm ${
          tieneHijos ? 'cursor-pointer hover:bg-base' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {tieneHijos ? (
            abierto ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
            )
          ) : (
            <User className="h-3.5 w-3.5 shrink-0 text-muted" />
          )}
          <div className="min-w-0">
            <p className="truncate text-ink">{persona.nombre}</p>
            <p className="text-[11px] text-muted">
              {new Date(persona.fecha_registro).toLocaleDateString('es-VE')}
              {tieneHijos && ` · ${hijos.length} referido${hijos.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs text-signal">
          +{formatoUsd(persona.ganado_por_mi_usd)}
        </span>
      </div>

      {tieneHijos && abierto && (
        <ul className="ml-5 mt-1 space-y-1 border-l border-line pl-3">
          {hijos.map((hijo) => (
            <NodoReferido
              key={hijo.inversionista_id}
              persona={hijo}
              hijos={porPadre.get(hijo.inversionista_id) ?? []}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

// Mapa global de "quién refirió a quién" construido una sola vez por render
// del árbol completo (se recalcula si cambia la red). Vive fuera del árbol
// de componentes porque NodoReferido es recursivo y todos necesitan la misma
// referencia sin pasarla por props en cada nivel.
let porPadre = new Map<string, PersonaRed[]>()

export function ArbolReferidos({ red }: { red: PersonaRed[] }) {
  porPadre = new Map()
  for (const p of red) {
    if (!p.referido_por_id) continue
    const lista = porPadre.get(p.referido_por_id) ?? []
    lista.push(p)
    porPadre.set(p.referido_por_id, lista)
  }

  const directos = red.filter((p) => p.nivel === 1)

  if (directos.length === 0) {
    return <p className="text-sm text-muted">Todavía nadie en tu red de referidos.</p>
  }

  return (
    <div className="space-y-1">
      <div className="mb-2 flex gap-4 text-[11px] text-muted">
        {[1, 2, 3].map((n) => (
          <span key={n}>Nivel {n} · {PCT_POR_NIVEL[n]}</span>
        ))}
      </div>
      <ul className="space-y-1">
        {directos.map((p) => (
          <NodoReferido key={p.inversionista_id} persona={p} hijos={porPadre.get(p.inversionista_id) ?? []} />
        ))}
      </ul>
    </div>
  )
}
