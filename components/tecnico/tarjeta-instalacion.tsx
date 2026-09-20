'use client'

// =============================================================
// COMPONENTE: tarjeta-instalacion.tsx
// PORTAL: Técnico
// QUÉ HACE: una instalación pendiente asignada al técnico. Permite
// confirmar el número de serie del equipo, subir una foto de la
// instalación y marcarla como completada. Usa el mismo patrón de
// subida que "comprobantes" (bucket propio "instalaciones").
// =============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Check, Loader2, MapPin } from 'lucide-react'

type Instalacion = {
  id: string
  tipo: string
  prioridad: string
  estado: string
  fecha_programada: string | null
  fecha_completada: string | null
  numero_serie_confirmado: string | null
  notas: string | null
  equipo: { numero_serie: string; modelo: string } | null
  cliente: { nombre: string; direccion_fisica: string | null } | null
}

export function TarjetaInstalacion({ instalacion, userId }: { instalacion: Instalacion; userId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [serial, setSerial] = useState('')
  const [notas, setNotas] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const completada = instalacion.estado === 'completada'

  async function marcarCompletada() {
    if (!archivo) {
      setMensaje('Sube una foto del equipo ya instalado.')
      return
    }
    setEnviando(true)
    setMensaje(null)

    const ruta = `${userId}/${instalacion.id}-${Date.now()}-${archivo.name}`
    const { error: errorSubida } = await supabase.storage.from('instalaciones').upload(ruta, archivo)

    if (errorSubida) {
      setEnviando(false)
      setMensaje(`No se pudo subir la foto: ${errorSubida.message}`)
      return
    }

    const { error: errorUpdate } = await supabase
      .from('orden_trabajo')
      .update({
        estado: 'completada',
        fecha_completada: new Date().toISOString(),
        numero_serie_confirmado: serial.trim() || null,
        notas: notas.trim() || null,
        foto_url: ruta,
      })
      .eq('id', instalacion.id)

    setEnviando(false)

    if (errorUpdate) {
      setMensaje(`No se pudo actualizar: ${errorUpdate.message}`)
      return
    }

    router.refresh()
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-sm text-ink">{instalacion.equipo?.numero_serie ?? '—'}</p>
          <p className="text-xs text-muted">
            {instalacion.equipo?.modelo} · <span className="capitalize">{instalacion.tipo}</span> ·{' '}
            <span className="capitalize">{instalacion.prioridad}</span>
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${
            completada
              ? 'border-signal/30 bg-signal/10 text-signal'
              : 'border-accent/30 bg-accent/10 text-accent'
          }`}
        >
          {instalacion.estado}
        </span>
      </div>

      {instalacion.cliente && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="h-3 w-3" />
          {instalacion.cliente.nombre}
          {instalacion.cliente.direccion_fisica && ` · ${instalacion.cliente.direccion_fisica}`}
        </p>
      )}

      {instalacion.fecha_programada && !completada && (
        <p className="mt-1 text-xs text-muted">Programada: {instalacion.fecha_programada}</p>
      )}

      {completada ? (
        <div className="mt-3 space-y-1 text-xs text-muted">
          <p>Completada: {new Date(instalacion.fecha_completada!).toLocaleString('es-VE')}</p>
          {instalacion.numero_serie_confirmado && (
            <p>Serial confirmado: {instalacion.numero_serie_confirmado}</p>
          )}
          {instalacion.notas && <p className="italic">"{instalacion.notas}"</p>}
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Confirma el número de serie instalado"
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas (opcional)"
            rows={2}
            className="w-full rounded-md border border-line bg-base px-3 py-2 text-sm text-ink"
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-xs text-muted">
            <Camera className="h-3.5 w-3.5" />
            {archivo ? archivo.name : 'Foto del equipo instalado'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </label>
          {mensaje && <p className="text-xs text-red-500">{mensaje}</p>}
          <button
            onClick={marcarCompletada}
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Marcar instalación completada
          </button>
        </div>
      )}
    </div>
  )
}
