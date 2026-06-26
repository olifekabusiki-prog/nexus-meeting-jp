import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// パスワードリセット後のSupabaseコールバビクはclientサイドで処理される。
// このルートはOAuthのcode交換用だったが、v1.1でOAuthは不使用。
// 念のため残置（予期しないリダイレクトをTOPへ送り返す）。
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/`)
}
