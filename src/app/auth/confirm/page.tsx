'use client'

// magic linkは廃止済み（2026-06-20）
// このページは旧URLのアクセス対策のみ。TOPへリダイレクト。

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-voice-black">
      <div className="w-6 h-6 border-2 border-voice-red border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
