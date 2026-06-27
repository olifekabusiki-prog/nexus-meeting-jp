import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/', '/auth']
const APP_NAME = 'nexus_meeting'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── デモモード: Supabase認証をスキップ ──
  // ログイン画面の「デモを試す」ボタンで nexus_demo=1 がセットされる
  if (request.cookies.get('nexus_demo')?.value === '1') {
    // / にアクセスしたら /home へ
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
    return NextResponse.next()
  }

  // ── パブリックルート（認証不要） ──
  const isPublic = pathname === '/' || pathname.startsWith('/auth/')
  if (isPublic) {
    return NextResponse.next()
  }

  // ── 保護ルート: Supabaseセッション確認 ──
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // 未ログイン → ログイン画面へ
  if (!session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ログイン済みで / にアクセス → /home へ
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // app_access チェック
  const { data: allowed } = await supabase.rpc('has_app_access', { p_app_name: APP_NAME })
  if (!allowed) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/?error=no_access', request.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|icon|apple-touch|manifest).*)'],
}
