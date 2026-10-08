// =============================================================
// ARCHIVO: lib/ia/proveedores.ts
// QUÉ HACE: una sola interfaz para hablar con varios proveedores de IA:
//   Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini) y DeepSeek.
// Cada proveedor traduce nuestros mensajes a su formato y devuelve el
// resultado en el mismo formato. Así el resto del sistema no cambia
// cuando se cambia de proveedor.
// Las claves viven SOLO en variables de entorno del servidor (Netlify).
// Solo usa fetch: no necesita instalar ningún paquete.
// =============================================================

export type IdProveedor = 'anthropic' | 'openai' | 'google' | 'deepseek'

export type Parte =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'llamada'; id: string; nombre: string; args: any; firma?: string }
  | { tipo: 'resultado'; id: string; nombre: string; contenido: string }

export type Mensaje = { rol: 'usuario' | 'asistente'; partes: Parte[] }

export type Herramienta = {
  nombre: string
  descripcion: string
  esquema: Record<string, any> // JSON Schema del objeto de argumentos
}

export type Entrada = {
  apiKey: string
  modelo: string
  sistema: string
  mensajes: Mensaje[]
  herramientas: Herramienta[]
  maxTokens: number
}

export type Salida = {
  mensaje: Mensaje
  tokensEntrada: number | null
  tokensSalida: number | null
}

export type Proveedor = {
  id: IdProveedor
  nombre: string
  claveEnv: string
  completar: (e: Entrada) => Promise<Salida>
  listarModelos: (apiKey: string) => Promise<string[]>
}

// ---------- utilidades ----------
const textosDe = (m: Mensaje) =>
  m.partes.filter((p): p is Extract<Parte, { tipo: 'texto' }> => p.tipo === 'texto')
const llamadasDe = (m: Mensaje) =>
  m.partes.filter((p): p is Extract<Parte, { tipo: 'llamada' }> => p.tipo === 'llamada')
const resultadosDe = (m: Mensaje) =>
  m.partes.filter((p): p is Extract<Parte, { tipo: 'resultado' }> => p.tipo === 'resultado')

async function llamar(url: string, init: RequestInit): Promise<any> {
  const r = await fetch(url, init)
  const texto = await r.text()
  let json: any = null
  try {
    json = JSON.parse(texto)
  } catch {
    json = null
  }
  if (!r.ok) {
    const detalle =
      json?.error?.message ?? (typeof json?.error === 'string' ? json.error : null) ?? texto.slice(0, 300)
    throw new Error(`Error ${r.status} del proveedor: ${detalle}`)
  }
  return json
}

// ---------- Anthropic (Claude) ----------
const anthropic: Proveedor = {
  id: 'anthropic',
  nombre: 'Anthropic (Claude)',
  claveEnv: 'ANTHROPIC_API_KEY',

  async completar(e) {
    const messages = e.mensajes.map((m) => ({
      role: m.rol === 'usuario' ? 'user' : 'assistant',
      content: m.partes
        .map((p) =>
          p.tipo === 'texto'
            ? p.texto
              ? { type: 'text', text: p.texto }
              : null
            : p.tipo === 'llamada'
              ? { type: 'tool_use', id: p.id, name: p.nombre, input: p.args ?? {} }
              : { type: 'tool_result', tool_use_id: p.id, content: p.contenido }
        )
        .filter(Boolean),
    }))

    const body: any = { model: e.modelo, max_tokens: e.maxTokens, system: e.sistema, messages }
    if (e.herramientas.length) {
      body.tools = e.herramientas.map((h) => ({
        name: h.nombre,
        description: h.descripcion,
        input_schema: h.esquema,
      }))
    }

    const data = await llamar('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': e.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const partes: Parte[] = []
    for (const b of data?.content ?? []) {
      if (b.type === 'text' && b.text) partes.push({ tipo: 'texto', texto: b.text })
      else if (b.type === 'tool_use')
        partes.push({ tipo: 'llamada', id: b.id, nombre: b.name, args: b.input ?? {} })
    }
    return {
      mensaje: { rol: 'asistente', partes },
      tokensEntrada: data?.usage?.input_tokens ?? null,
      tokensSalida: data?.usage?.output_tokens ?? null,
    }
  },

  async listarModelos(apiKey) {
    const data = await llamar('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    })
    return (data?.data ?? []).map((m: any) => String(m.id)).sort()
  },
}

// ---------- Compatibles con OpenAI (OpenAI y DeepSeek) ----------
function crearCompatibleOpenAI(
  id: IdProveedor,
  nombre: string,
  claveEnv: string,
  base: string
): Proveedor {
  return {
    id,
    nombre,
    claveEnv,

    async completar(e) {
      const messages: any[] = [{ role: 'system', content: e.sistema }]
      for (const m of e.mensajes) {
        if (m.rol === 'usuario') {
          for (const r of resultadosDe(m)) {
            messages.push({ role: 'tool', tool_call_id: r.id, content: r.contenido })
          }
          const t = textosDe(m).map((x) => x.texto).join('\n')
          if (t) messages.push({ role: 'user', content: t })
        } else {
          const t = textosDe(m).map((x) => x.texto).join('\n')
          const ll = llamadasDe(m)
          const msg: any = { role: 'assistant', content: t || null }
          if (ll.length) {
            msg.tool_calls = ll.map((l) => ({
              id: l.id,
              type: 'function',
              function: { name: l.nombre, arguments: JSON.stringify(l.args ?? {}) },
            }))
          }
          messages.push(msg)
        }
      }

      const body: any = { model: e.modelo, messages }
      if (e.herramientas.length) {
        body.tools = e.herramientas.map((h) => ({
          type: 'function',
          function: { name: h.nombre, description: h.descripcion, parameters: h.esquema },
        }))
      }

      const data = await llamar(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${e.apiKey}` },
        body: JSON.stringify(body),
      })

      const msg = data?.choices?.[0]?.message
      const partes: Parte[] = []
      if (msg?.content) partes.push({ tipo: 'texto', texto: String(msg.content) })
      for (const tc of msg?.tool_calls ?? []) {
        let args: any = {}
        try {
          args = JSON.parse(tc.function?.arguments || '{}')
        } catch {
          args = {}
        }
        partes.push({ tipo: 'llamada', id: tc.id, nombre: tc.function?.name, args })
      }
      return {
        mensaje: { rol: 'asistente', partes },
        tokensEntrada: data?.usage?.prompt_tokens ?? null,
        tokensSalida: data?.usage?.completion_tokens ?? null,
      }
    },

    async listarModelos(apiKey) {
      const data = await llamar(`${base}/models`, {
        headers: { authorization: `Bearer ${apiKey}` },
      })
      const excluir = /embed|whisper|tts|dall|image|audio|realtime|transcribe|moderation|search/i
      return (data?.data ?? [])
        .map((m: any) => String(m.id))
        .filter((m: string) => !excluir.test(m))
        .sort()
    },
  }
}

const openai = crearCompatibleOpenAI('openai', 'OpenAI (ChatGPT)', 'OPENAI_API_KEY', 'https://api.openai.com/v1')
const deepseek = crearCompatibleOpenAI('deepseek', 'DeepSeek', 'DEEPSEEK_API_KEY', 'https://api.deepseek.com')

// ---------- Google (Gemini) ----------
const GOOGLE_BASE = 'https://generativelanguage.googleapis.com/v1beta'

const google: Proveedor = {
  id: 'google',
  nombre: 'Google (Gemini)',
  claveEnv: 'GOOGLE_API_KEY',

  async completar(e) {
    const contents = e.mensajes.map((m) => ({
      role: m.rol === 'usuario' ? 'user' : 'model',
      parts: m.partes
        .map((p) => {
          if (p.tipo === 'texto') return p.texto ? { text: p.texto } : null
          if (p.tipo === 'llamada') {
            const parte: any = { functionCall: { name: p.nombre, args: p.args ?? {} } }
            if (p.firma) parte.thoughtSignature = p.firma
            return parte
          }
          return { functionResponse: { name: p.nombre, response: { resultado: p.contenido } } }
        })
        .filter(Boolean),
    }))

    const body: any = {
      systemInstruction: { parts: [{ text: e.sistema }] },
      contents,
      generationConfig: { maxOutputTokens: e.maxTokens },
    }
    if (e.herramientas.length) {
      body.tools = [
        {
          functionDeclarations: e.herramientas.map((h) => {
            const decl: any = { name: h.nombre, description: h.descripcion }
            // Gemini rechaza un esquema de objeto sin propiedades: se omite.
            if (Object.keys(h.esquema?.properties ?? {}).length > 0) decl.parameters = h.esquema
            return decl
          }),
        },
      ]
    }

    const modelo = e.modelo.replace(/^models\//, '')
    const data = await llamar(`${GOOGLE_BASE}/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': e.apiKey },
      body: JSON.stringify(body),
    })

    const candidato = data?.candidates?.[0]
    if (!candidato) {
      throw new Error('Google no devolvió respuesta (puede haberla bloqueado por sus filtros).')
    }

    const partes: Parte[] = []
    let i = 0
    for (const p of candidato.content?.parts ?? []) {
      if (p.functionCall) {
        partes.push({
          tipo: 'llamada',
          id: `g_${Date.now()}_${i++}`,
          nombre: p.functionCall.name,
          args: p.functionCall.args ?? {},
          firma: p.thoughtSignature,
        })
      } else if (p.text && !p.thought) {
        partes.push({ tipo: 'texto', texto: p.text })
      }
    }
    return {
      mensaje: { rol: 'asistente', partes },
      tokensEntrada: data?.usageMetadata?.promptTokenCount ?? null,
      tokensSalida: data?.usageMetadata?.candidatesTokenCount ?? null,
    }
  },

  async listarModelos(apiKey) {
    const data = await llamar(`${GOOGLE_BASE}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': apiKey },
    })
    return (data?.models ?? [])
      .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
      .map((m: any) => String(m.name).replace(/^models\//, ''))
      .sort()
  },
}

// ---------- registro ----------
export const PROVEEDORES: Record<IdProveedor, Proveedor> = { anthropic, openai, google, deepseek }

export const IDS_PROVEEDORES = Object.keys(PROVEEDORES) as IdProveedor[]

export function esProveedor(id: string): id is IdProveedor {
  return id in PROVEEDORES
}

export function claveConfigurada(id: IdProveedor): boolean {
  const v = process.env[PROVEEDORES[id].claveEnv]
  return typeof v === 'string' && v.trim().length > 0
}
