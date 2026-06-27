'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/* ---- SVG Icons ---- */
function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round" />
    </svg>
  )
}

function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.2" y1="12" x2="16" y2="12" strokeLinecap="round" />
      <line x1="7.4" y1="5.8" x2="10" y2="10.3" strokeLinecap="round" />
      <line x1="4.8" y1="18.2" x2="8" y2="13.7" strokeLinecap="round" />
    </svg>
  )
}

/* ---- Login Form ---- */
function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const noAccess = params.get('error') === 'no_access'
    ? 'このメールアドレスにはアクセス権限がありません。'
    : ''

  async function gateAndGo() {
    const { data: allowed } = await supabase.rpc('has_app_access', { p_app_name: 'nexus_meeting' })
    if (allowed) {
      router.replace('/home')
    } else {
      await supabase.auth.signOut()
      setMsg('このメールアドレスにはアクセス権限がありません。')
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setMsg('メールアドレスまたはパスワードが違います。'); return }
    await gateAndGo()
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setMsg('パスワードは8文字以上で設定してください。'); return }
    setLoading(true); setMsg('')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    setLoading(false)
    if (error) {
      if (error.status === 422 || error.message?.toLowerCase().includes('already registered')) {
        setMsg('このメールアドレスはすでに登録されています。ログインしてください。')
        setMode('login')
      } else {
        setMsg(error.message)
      }
      return
    }
    if (!data.session) {
      setMsg('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。')
      return
    }
    await gateAndGo()
  }

  async function handleDemo() {
    setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/demo-login', { method: 'POST' })
      if (!res.ok) { setMsg('デモは現在利用できません。'); return }
      const { access_token, refresh_token } = await res.json()
      await supabase.auth.setSession({ access_token, refresh_token })
      router.replace('/home')
    } catch {
      setMsg('デモの起動に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-mtg-black px-6">
      <div className="w-full max-w-sm space-y-10">

        {/* ロゴ */}
        <div className="text-center space-y-1">
          <div className="text-4xl font-black tracking-[0.2em] text-white">NEXUS</div>
          <div className="text-base font-light tracking-[0.5em] text-mtg-red">MEETING JP</div>

          {/* 動作要件 */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-mtg-mid border border-mtg-border rounded-full px-3 py-1 bg-mtg-dark">
                <MonitorIcon className="w-3 h-3" />
                <span>PC専用</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-mtg-other-a border border-mtg-other-a/30 rounded-full px-3 py-1 bg-mtg-other-a/5">
                <ChromeIcon className="w-3 h-3" />
                <span>Google Chrome 専用</span>
              </div>
            </div>
            <p className="text-mtg-border text-[11px] leading-relaxed">
              Zoom・Meet などのオンライン会議は別ウィンドウで開き、<br />
              このアプリは Google Chrome で起動してください。
            </p>
          </div>
        </div>

        {/* サインアップ説明 */}
        {mode === 'signup' && (
          <div className="bg-mtg-surface border border-mtg-border rounded-xl p-4 text-xs text-mtg-light leading-relaxed">
            このアプリ専用のパスワードを設定してください（8文字以上）。
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          <div>
            <label className="block text-mtg-light text-xs mb-1.5 tracking-wider">メールアドレス</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required autoComplete="email"
              className="w-full bg-mtg-surface border border-mtg-border rounded-xl px-4 py-3 text-white placeholder-mtg-mid focus:outline-none focus:border-mtg-red transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-mtg-light text-xs mb-1.5 tracking-wider">パスワード</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '8文字以上' : 'パスワード'} required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full bg-mtg-surface border border-mtg-border rounded-xl px-4 py-3 pr-12 text-white placeholder-mtg-mid focus:outline-none focus:border-mtg-red transition-colors text-sm"
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mtg-mid hover:text-mtg-light transition-colors"
              >
                {showPw ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M3 3l18 18M10.5 10.5A3 3 0 0013.5 13.5M9.9 9.9A3 3 0 0114.1 14.1M4 4s-2 4 8 4 8-4 8-4M4 20s-2-4 8-4 8 4 8 4" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {(msg || noAccess) && (
            <p className="text-mtg-red text-xs">{msg || noAccess}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-mtg-red hover:bg-mtg-red-dark text-white rounded-xl py-3.5 font-semibold tracking-wider disabled:opacity-40 active:scale-95 transition-all text-sm"
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'パスワードを設定して登録'}
          </button>
        </form>

        <div className="flex justify-between text-xs">
          <button
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setMsg('') }}
            className="text-mtg-red underline underline-offset-4"
          >
            {mode === 'login' ? '初回パスワード設定はこちら' : 'ログインに戻る'}
          </button>
          <a href="/auth/reset" className="text-mtg-mid underline underline-offset-4">
            パスワードを忘れた方
          </a>
        </div>

        {/* デモボタン */}
        <div className="text-center pt-2 border-t border-mtg-border">
          <p className="text-mtg-border text-[11px] mb-3">アカウントをお持ちでない方</p>
          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="text-mtg-mid text-xs border border-mtg-border rounded-xl px-6 py-2.5 hover:border-mtg-light hover:text-mtg-light transition-colors disabled:opacity-40"
          >
            デモを試す
          </button>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
