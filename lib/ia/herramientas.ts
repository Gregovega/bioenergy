// =============================================================
// ARCHIVO: lib/ia/herramientas.ts
// QUÉ HACE: define lo ÚNICO que el asistente puede hacer. No tiene SQL
// libre ni llave maestra: cada herramienta consulta con la sesión de la
// persona que usa el chat (así manda la seguridad de Supabase) o propone
// una acción que debe aprobar una persona.
// Los textos libres escritos por terceros (mensajes de leads, notas) NO se
// entregan a la IA, para reducir el riesgo de instrucciones ocultas.
// =============================================================

import type { Herramienta } from './proveedores'

const SIN_ARGS = { type: 'object', properties: {} }

export const HERRAMIENTAS: Herramienta[] = [
  {
    nombre: 'resumen_negocio',
    descripcion:
      'Devuelve un resumen actual del negocio: pagos pendientes, leads, órdenes de trabajo abiertas, equipos por estado, inversionistas, clientes, participaciones y acciones del asistente por decidir.',
    esquema: SIN_ARGS,
  },
  {
    nombre: 'pagos_pendientes',
    descripcion:
      'Lista los pagos reportados por clientes que están pendientes de verificar (máximo 30).',
    esquema: SIN_ARGS,
  },
  {
    nombre: 'leads',
    descripcion:
      'Lista leads del CRM (nombre, estado, monto de interés, origen, fecha). Se puede filtrar por estado.',
    esquema: {
      type: 'object',
      properties: {
        estado: { type: 'string', enum: ['nuevo', 'contactado', 'en_proceso'] },
      },
    },
  },
  {
    nombre: 'ordenes_trabajo_abiertas',
    descripcion: 'Lista las órdenes de trabajo pendientes o en curso (máximo 30).',
    esquema: SIN_ARGS,
  },
  {
    nombre: 'tipos_de_accion',
    descripcion:
      'Lista los tipos de acción que el asistente puede proponer ahora, con su nivel de riesgo. Consúltala antes de proponer una acción.',
    esquema: SIN_ARGS,
  },
  {
    nombre: 'proponer_accion',
    descripcion:
      'Propone una acción para que una persona la apruebe en la bandeja de Aprobaciones. NO ejecuta nada. Usa solo tipos devueltos por tipos_de_accion. Las acciones de dinero requieren monto_total_usd en el payload.',
    esquema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', description: 'Tipo de acción permitido' },
        titulo: { type: 'string', description: 'Título corto y claro' },
        descripcion: { type: 'string', description: 'Qué se propone y por qué' },
        payload: { type: 'object', description: 'Datos de la acción (ej. monto_total_usd)' },
      },
      required: ['tipo', 'titulo'],
    },
  },
]

export type ResultadoHerramienta = { contenido: string; propuestaId?: string }

const LIMITE = 8000

function aTexto(valor: unknown): string {
  const s = JSON.stringify(valor)
  return s.length > LIMITE ? s.slice(0, LIMITE) + '…(recortado)' : s
}

export async function ejecutarHerramienta(
  supabase: any,
  nombre: string,
  args: any,
  contexto: { agente: string }
): Promise<ResultadoHerramienta> {
  try {
    switch (nombre) {
      case 'resumen_negocio': {
        const { data, error } = await supabase.rpc('fn_ia_resumen_negocio')
        if (error) throw error
        return { contenido: aTexto(data) }
      }

      case 'pagos_pendientes': {
        const { data: pagos, error } = await supabase
          .from('pago')
          .select('id, cliente_id, monto_usd, periodo, metodo_pago, fecha_pago, created_at')
          .eq('estado', 'pendiente')
          .order('created_at', { ascending: false })
          .limit(30)
        if (error) throw error
        const ids = Array.from(new Set((pagos ?? []).map((p: any) => p.cliente_id).filter(Boolean)))
        let nombres = new Map<string, string>()
        if (ids.length) {
          const { data: clientes } = await supabase.from('cliente_final').select('id, nombre').in('id', ids)
          nombres = new Map((clientes ?? []).map((c: any) => [c.id, c.nombre] as [string, string]))
        }
        return {
          contenido: aTexto(
            (pagos ?? []).map((p: any) => ({ ...p, cliente: nombres.get(p.cliente_id) ?? null }))
          ),
        }
      }

      case 'leads': {
        let q = supabase
          .from('lead')
          .select('id, nombre, estado, monto_interes_usd, origen, created_at')
          .order('created_at', { ascending: false })
          .limit(30)
        if (args?.estado) q = q.eq('estado', String(args.estado))
        const { data, error } = await q
        if (error) throw error
        return { contenido: aTexto(data ?? []) }
      }

      case 'ordenes_trabajo_abiertas': {
        const { data, error } = await supabase
          .from('orden_trabajo')
          .select('id, tipo, estado, prioridad, fecha_programada, created_at')
          .in('estado', ['pendiente', 'en_curso'])
          .order('created_at', { ascending: false })
          .limit(30)
        if (error) throw error
        return { contenido: aTexto(data ?? []) }
      }

      case 'tipos_de_accion': {
        const { data, error } = await supabase
          .from('ia_accion_tipo')
          .select('tipo, descripcion, riesgo')
          .eq('activo', true)
        if (error) throw error
        return { contenido: aTexto(data ?? []) }
      }

      case 'proponer_accion': {
        if (!args?.tipo || !args?.titulo) {
          return { contenido: 'Error: faltan tipo o titulo.' }
        }
        const { data, error } = await supabase.rpc('fn_ia_proponer_accion', {
          p_tipo: String(args.tipo),
          p_titulo: String(args.titulo).slice(0, 200),
          p_descripcion: args.descripcion ? String(args.descripcion).slice(0, 2000) : null,
          p_payload: args.payload && typeof args.payload === 'object' ? args.payload : {},
          p_agente: contexto.agente,
        })
        if (error) return { contenido: 'No se pudo proponer: ' + error.message }
        return {
          contenido: 'Propuesta creada y enviada a Aprobaciones. Una persona debe aprobarla; nada se ejecutó.',
          propuestaId: String(data),
        }
      }

      default:
        return { contenido: `Herramienta desconocida: ${nombre}` }
    }
  } catch (e: any) {
    return { contenido: 'Error al consultar: ' + (e?.message ?? String(e)) }
  }
}
