import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const APP_NAME = 'nexus_meeting'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // / と /auth/* は認証不要ルート
  const isPublicRoute = path === '/' || path.startsWith('/auth')

  // 未ログイン → TOPへ
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ログイン済み → app_accessチェック
  if (user && !isPublicRoute) {
    const { data: allowed } = await supabase.rpc('has_app_access', { p_app_name: APP_NAME })
    if (!allowed) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/?error=no_access', request.url))
    }
  }

  // ログイン済みでTOPにいる → /homeへ
  if (user && path === '/') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
