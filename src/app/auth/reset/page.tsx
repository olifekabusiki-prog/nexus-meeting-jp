'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ResetPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) {
      setMsg(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="text-4xl">📨</div>
          <h2 className="text-white font-semibold text-lg">メールを送信しました</h2>
          <p className="text-voice-light text-sm leading-relaxed">
            <span className="text-white">{email}</span> にリセット用リンクを送信しました。<br />
            メール内のリンクから新しいパスワードを設定してください。
          </p>
          <a href="/" className="text-voice-mid text-sm underline underline-offset-4">
            ログインに戻る
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <div className="text-4xl font-black tracking-widest text-white">NEXUS</div>
          <div className="text-lg font-light tracking-[0.4em] text-voice-red">VOICE</div>
        </div>

        <div>
          <h2 className="text-white font-semibold text-lg mb-1">パスワードをリセット</h2>
          <p className="text-voice-mid text-xs">登録メールアドレスにリセット用リンクを送ります</p>
        </div>

        <form onSubmit={send} className="space-y-4">
          <div>
            <label className="block text-voice-light text-xs mb-2 tracking-wider">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-voice-dark border border-voice-gray rounded-xl px-4 py-3 text-white placeholder-voice-mid focus:outline-none focus:border-voice-red transition-colors"
            />
          </div>

          {msg && <p className="text-voice-red text-xs">{msg}</p>}

          <button
            type="submit"
            disabled={!email}
            className="w-full bg-voice-red text-white rounded-xl py-3.5 font-semibold tracking-wider disabled:opacity-40 active:scale-95 transition-transform"
          >
            リセットメールを送信
          </button>
        </form>

        <a href="/" className="block text-center text-voice-mid text-xs underline underline-offset-4">
          ログインに戻る
        </a>
      </div>
    </div>
  )
}
