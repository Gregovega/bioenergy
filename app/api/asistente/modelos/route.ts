// =============================================================
// ARCHIVO: app/api/asistente/modelos/route.ts
// QUÉ HACE: pide al proveedor la lista de modelos disponibles con TU clave,
// para que elijas uno en el panel sin tener que adivinar el nombre.
// Solo admin / super_admin. Nunca devuelve la clave.
// =============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PROVEEDORES, esProveedor } from '@/lib/ia/proveedores'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('rol').eq('user_id', user.id).maybeSingle()
  if (!staff || !['super_admin', 'admin'].includes(staff.rol)) {
    return NextResponse.json({ error: 'Sin acceso.' }, { status: 403 })
  }

  const id = req.nextUrl.searchParams.get('proveedor') ?? ''
  if (!esProveedor(id)) return NextResponse.json({ error: 'Proveedor no válido.' }, { status: 400 })

  const prov = PROVEEDORES[id]
  const apiKey = process.env[prov.claveEnv]
  if (!apiKey) {
    return NextResponse.json(
      { error: `Falta la variable ${prov.claveEnv} en Netlify.` },
      { status: 400 }
    )
  }

  try {
    const modelos = await prov.listarModelos(apiKey)
    return NextResponse.json({ modelos })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'No se pudo consultar.' }, { status: 502 })
  }
}
