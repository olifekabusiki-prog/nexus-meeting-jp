'use client'

// magic linkは不使用（認証設計ルールv1.2）
// 旧URLアクセス対策のみ。TOPへリダイレクト。

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthConfirmPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-mtg-black">
      <div className="w-6 h-6 border-2 border-mtg-red border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
