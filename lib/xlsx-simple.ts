// =============================================================
// lib/xlsx-simple.ts
// Generador mínimo de archivos .xlsx (Excel real) SIN dependencias
// nuevas: arma el XML de Office Open XML a mano y lo empaqueta en
// un .zip "sin compresión". Funciona en el navegador.
//
// Por qué así y no CSV: un CSV se rompe según el idioma del Excel
// (coma vs punto y coma, decimales con coma). Un .xlsx guarda los
// números como números y las fechas como fechas: el contador lo
// abre y suma sin arreglar nada.
// =============================================================

export type Celda =
  | string
  | number
  | null
  | { usd: number } // número con 2 decimales y separador de miles
  | { fecha: string } // 'YYYY-MM-DD' -> fecha real de Excel
  | { pct: number } // 0.25 -> 25.00%

export type Hoja = {
  nombre: string
  /** La primera fila se trata como encabezado (negrita, fondo gris, congelada). */
  filas: Celda[][]
  anchos?: number[]
}

const ESTILO = { normal: 0, encabezado: 1, usd: 2, fecha: 3, pct: 4 }

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // caracteres de control que hacen inválido el XML
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

function letraColumna(indice: number): string {
  let n = indice + 1
  let letras = ''
  while (n > 0) {
    const resto = (n - 1) % 26
    letras = String.fromCharCode(65 + resto) + letras
    n = Math.floor((n - 1) / 26)
  }
  return letras
}

function fechaASerial(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return null
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return ms / 86400000 + 25569 // días desde 1899-12-30 (origen de Excel)
}

function celdaXml(ref: string, celda: Celda, esEncabezado: boolean): string {
  if (celda === null || celda === undefined) return ''

  if (typeof celda === 'string') {
    if (celda === '') return ''
    const s = esEncabezado ? ESTILO.encabezado : ESTILO.normal
    return `<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${escaparXml(celda)}</t></is></c>`
  }

  if (typeof celda === 'number') {
    if (!Number.isFinite(celda)) return ''
    return `<c r="${ref}" s="${ESTILO.normal}"><v>${celda}</v></c>`
  }

  if ('usd' in celda) {
    if (!Number.isFinite(celda.usd)) return ''
    return `<c r="${ref}" s="${ESTILO.usd}"><v>${celda.usd}</v></c>`
  }

  if ('pct' in celda) {
    if (!Number.isFinite(celda.pct)) return ''
    return `<c r="${ref}" s="${ESTILO.pct}"><v>${celda.pct}</v></c>`
  }

  if ('fecha' in celda) {
    const serial = fechaASerial(celda.fecha)
    if (serial === null) return ''
    return `<c r="${ref}" s="${ESTILO.fecha}"><v>${serial}</v></c>`
  }

  return ''
}

function hojaXml(hoja: Hoja): string {
  const anchos = hoja.anchos ?? []
  const cols = anchos.length
    ? `<cols>${anchos
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join('')}</cols>`
    : ''

  const filas = hoja.filas
    .map((fila, r) => {
      const celdas = fila
        .map((c, i) => celdaXml(`${letraColumna(i)}${r + 1}`, c, r === 0))
        .join('')
      return `<row r="${r + 1}">${celdas}</row>`
    })
    .join('')

  const congelar =
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    congelar +
    cols +
    `<sheetData>${filas}</sheetData>` +
    '</worksheet>'
  )
}

const ESTILOS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd"/></numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFE8ECF4"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="5">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>'

function nombreHojaValido(nombre: string, usados: Set<string>): string {
  let limpio = nombre.replace(/[\[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Hoja'
  let candidato = limpio
  let n = 2
  while (usados.has(candidato.toLowerCase())) {
    const sufijo = ` ${n++}`
    candidato = limpio.slice(0, 31 - sufijo.length) + sufijo
  }
  usados.add(candidato.toLowerCase())
  return candidato
}

// ------------------------- ZIP (sin compresión) -------------------------

const TABLA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(datos: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

type ArchivoZip = { ruta: string; datos: Uint8Array }

function empaquetarZip(archivos: ArchivoZip[]): Uint8Array {
  const enc = new TextEncoder()
  const partes: Uint8Array[] = []
  const centrales: Uint8Array[] = []
  let offset = 0

  for (const a of archivos) {
    const nombre = enc.encode(a.ruta)
    const crc = crc32(a.datos)
    const tam = a.datos.length

    const local = new Uint8Array(30 + nombre.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true) // versión mínima
    lv.setUint16(6, 0, true) // flags
    lv.setUint16(8, 0, true) // método 0 = almacenado
    lv.setUint16(10, 0, true) // hora
    lv.setUint16(12, 0x21, true) // fecha 1980-01-01
    lv.setUint32(14, crc, true)
    lv.setUint32(18, tam, true)
    lv.setUint32(22, tam, true)
    lv.setUint16(26, nombre.length, true)
    lv.setUint16(28, 0, true)
    local.set(nombre, 30)

    const central = new Uint8Array(46 + nombre.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, 0, true)
    cv.setUint16(14, 0x21, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, tam, true)
    cv.setUint32(24, tam, true)
    cv.setUint16(28, nombre.length, true)
    cv.setUint16(30, 0, true)
    cv.setUint16(32, 0, true)
    cv.setUint16(34, 0, true)
    cv.setUint16(36, 0, true)
    cv.setUint32(38, 0, true)
    cv.setUint32(42, offset, true)
    central.set(nombre, 46)

    partes.push(local, a.datos)
    centrales.push(central)
    offset += local.length + a.datos.length
  }

  const tamCentral = centrales.reduce((acc, c) => acc + c.length, 0)
  const fin = new Uint8Array(22)
  const fv = new DataView(fin.buffer)
  fv.setUint32(0, 0x06054b50, true)
  fv.setUint16(8, archivos.length, true)
  fv.setUint16(10, archivos.length, true)
  fv.setUint32(12, tamCentral, true)
  fv.setUint32(16, offset, true)

  const todo = [...partes, ...centrales, fin]
  const total = todo.reduce((acc, p) => acc + p.length, 0)
  const salida = new Uint8Array(total)
  let pos = 0
  for (const p of todo) {
    salida.set(p, pos)
    pos += p.length
  }
  return salida
}

// ------------------------- API pública -------------------------

export function crearXlsx(hojas: Hoja[]): Uint8Array {
  const enc = new TextEncoder()
  const usados = new Set<string>()
  const nombres = hojas.map((h) => nombreHojaValido(h.nombre, usados))

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    hojas
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
      )
      .join('') +
    '</Types>'

  const relsRaiz =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>'

  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' +
    nombres
      .map((n, i) => `<sheet name="${escaparXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('') +
    '</sheets></workbook>'

  const relsWorkbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    hojas
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
      )
      .join('') +
    `<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    '</Relationships>'

  const archivos: ArchivoZip[] = [
    { ruta: '[Content_Types].xml', datos: enc.encode(contentTypes) },
    { ruta: '_rels/.rels', datos: enc.encode(relsRaiz) },
    { ruta: 'xl/workbook.xml', datos: enc.encode(workbook) },
    { ruta: 'xl/_rels/workbook.xml.rels', datos: enc.encode(relsWorkbook) },
    { ruta: 'xl/styles.xml', datos: enc.encode(ESTILOS_XML) },
    ...hojas.map((h, i) => ({
      ruta: `xl/worksheets/sheet${i + 1}.xml`,
      datos: enc.encode(hojaXml(h)),
    })),
  ]

  return empaquetarZip(archivos)
}

/** Dispara la descarga de un .xlsx en el navegador. */
export function descargarXlsx(nombreArchivo: string, hojas: Hoja[]): void {
  const bytes = crearXlsx(hojas)
  const blob = new Blob([bytes as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
