import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// パスワードリセット後のコールバックはclient側で処理。
// 予期しないリダイレクトをTOPへ送り返す。
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/`)
}
