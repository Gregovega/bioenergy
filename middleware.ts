import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RUTAS_PROTEGIDAS = ['/admin', '/inversionista', '/cliente']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Importante: getUser() (no getSession()) para validar el token contra Supabase Auth.
  const { data: { user } } = await supabase.auth.getUser()

  const esRutaProtegida = RUTAS_PROTEGIDAS.some((ruta) =>
    request.nextUrl.pathname.startsWith(ruta)
  )

  if (esRutaProtegida && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/inversionista/:path*', '/cliente/:path*'],
}
