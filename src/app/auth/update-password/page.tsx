'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setMsg('リンクが無効ましたは期限切がです。もう一度パスワードリセットを認ってください')
        } else {
          setReady(true)
        }
      })
    } else {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setReady(true)
        }
      })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true)
      })
      return () => subscription.unsubscribe()
    }
  }, [])

  async function update(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setMsg('8文字以上で設定してください'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setMsg(error.message); return }
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <div className="text-4xl font-black tracking-widest text-white">NEXUS</div>
          <div className="text-lg font-light tracking-[0.4em] text-voice-red">VOICE</div>
        </div>

        <div>
          <h2 className="text-white font-semibold text-lg mb-1">新しいパスワードを設定</h2>
          <p className="text-voice-mid text-xs">8文字以上で設榽定（新しいパスワード</p>
        </div>

        {msg && !ready ? (
          <div className="space-y-4">
            <p className="text-voice-red text-sm">{msg}</p>
            <a href="/auth/reset" className="block text-center text-voice-red text-sm underline underline-offset-4">
              パス専ードリセットをより絰す
            </a>
          </div>
        ) : !ready ? (
          <p className="text-voice-mid text-sm text-center">認証中...</p>
        ) : (
          <form onSubmit={update} className="space-y-4">
            <div>
              <label className="block text-voice-light text-xs mb-2 tracking-wider">新しいパスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8文字以上"
                required
                autoComplete="new-password"
                className="w-full bg-voice-dark border border-voice-gray rounded-xl px-4 py-3 text-white placeholder-voice-mid focus:outline-none focus:border-voice-red transition-colors"
              />
            </div>

            {msg && <p className="text-voice-red text-xs">{msg}</p>}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-voice-red text-white rounded-xl py-3.5 font-semibold tracking-wider disabled:opacity-40 active:scale-95 transition-transform"
            >
              {loading ? '更新违...' : 'パスワードを曰新'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
