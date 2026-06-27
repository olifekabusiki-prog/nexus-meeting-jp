'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/* ---- Icons ---- */
function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0014 0" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round" />
    </svg>
  )
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setEmail(session.user.email ?? '')
      else if (event === 'SIGNED_OUT') router.push('/')
    })
    return () => subscription.unsubscribe()
  }, [router])

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/')
  }

  function handleStart() {
    router.push(`/session?mode=${online ? 'online' : 'offline'}`)
  }

  return (
    <div className="min-h-dvh bg-mtg-black flex flex-col">

      {/* ヘッダー */}
      <header className="flex items-center justify-between px-6 pt-10 pb-6 border-b border-mtg-border">
        <div>
          <div className="text-lg font-black tracking-[0.2em] text-white">NEXUS</div>
          <div className="text-[10px] font-light tracking-[0.5em] text-mtg-red mt-0.5">MEETING JP</div>
        </div>
        <button onClick={handleSignOut} className="text-mtg-mid text-xs hover:text-mtg-light transition-colors">
          ログアウト
        </button>
      </header>

      {/* メイン */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8 max-w-lg mx-auto w-full">

        {/* オンライン / 対面 トグル */}
        <div className="w-full bg-mtg-surface border border-mtg-border rounded-2xl overflow-hidden">
          {/* トグルスイッチ */}
          <div className="flex p-1 gap-1">
            <button
              onClick={() => setOnline(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                online
                  ? 'bg-mtg-red text-white shadow-lg shadow-mtg-red/30'
                  : 'text-mtg-mid hover:text-mtg-light'
              }`}
            >
              オンライン
            </button>
            <button
              onClick={() => setOnline(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                !online
                  ? 'bg-mtg-red text-white shadow-lg shadow-mtg-red/30'
                  : 'text-mtg-mid hover:text-mtg-light'
              }`}
            >
              対面
            </button>
          </div>

          {/* モード説明 */}
          <div className="px-5 pb-5 pt-2">
            {online ? (
              <div className="space-y-3">
                <p className="text-mtg-light text-xs leading-relaxed">
                  Zoom・Teams・Meet など、あらゆるオンライン会議ツールに対応。マイクとシステム音声を同時取得し、話者を自動分離します。
                </p>
                <div className="flex items-center gap-5 pt-1">
                  <div className="flex items-center gap-2 text-mtg-self">
                    <MicIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">マイク（自分）</span>
                  </div>
                  <div className="text-mtg-border text-lg font-light">+</div>
                  <div className="flex items-center gap-2 text-mtg-other-a">
                    <MonitorIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">システム音声（相手）</span>
                  </div>
                </div>
                <p className="text-mtg-mid text-xs">
                  イヤホン推奨。スピーカー使用時は話者分離精度が低下する場合があります。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-mtg-light text-xs leading-relaxed">
                  同じ部屋での対面会議に対応。マイクで全員の音声を取得し、GPTが文脈から話者を推測整理します。
                </p>
                <div className="flex items-center gap-2 text-mtg-mid pt-1">
                  <UsersIcon className="w-4 h-4" />
                  <span className="text-xs">端末を参加者の中央に置いてください</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 開始ボタン */}
        <button
          onClick={handleStart}
          className="w-full group relative bg-mtg-red hover:bg-mtg-red-dark rounded-2xl py-5 flex items-center justify-between px-6 transition-all active:scale-[0.98] shadow-xl shadow-mtg-red/20"
        >
          <div className="text-left">
            <div className="text-white font-bold text-lg tracking-wide">会議をスタート</div>
            <div className="text-white/70 text-xs mt-0.5">
              {online ? 'マイク + システム音声を取得します' : 'マイクのみ取得します'}
            </div>
          </div>
          <ChevronRightIcon className="w-6 h-6 text-white/80 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 注意文（オンライン時） */}
        {online && (
          <p className="text-mtg-mid text-xs text-center leading-relaxed">
            スタート後、画面共有の許可ダイアログが表示されます。<br />
            「システム音声を共有」を選択してください。
          </p>
        )}
      </main>

      {/* フッター */}
      <footer className="px-6 pb-6 text-center">
        {email && <p className="text-mtg-mid text-xs">{email}</p>}
      </footer>
    </div>
  )
}
