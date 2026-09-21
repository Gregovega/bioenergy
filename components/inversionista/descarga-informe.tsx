'use client'

// =============================================================
// COMPONENTE: descarga-informe.tsx
// PORTAL: Inversionista
// QUÉ HACE: botón que descarga el informe fiscal del año como un
// archivo Excel (.xlsx) con varias hojas, para pasárselo al
// contador. El archivo se arma en el navegador con los mismos
// datos que la página ya cargó (no hace consultas nuevas).
// =============================================================

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { descargarXlsx, type Hoja } from '@/lib/xlsx-simple'

export function DescargaInformeFiscal({
  hojas,
  nombreArchivo,
}: {
  hojas: Hoja[]
  nombreArchivo: string
}) {
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function descargar() {
    setGenerando(true)
    setError(null)
    try {
      descargarXlsx(nombreArchivo, hojas)
    } catch {
      setError('No se pudo generar el archivo. Intenta de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        onClick={descargar}
        disabled={generando}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base disabled:opacity-50"
      >
        {generando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Descargar Excel para mi contador
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
