'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { MeetingSession, MeetingReport } from '@/types'

/* ---- Processing Steps ---- */
const STEPS = [
  { id: 'clean',  label: '文字起こしを清書・話者整理中...' },
  { id: 'report', label: '議事録レポートを生成中...' },
  { id: 'save',   label: 'Supabaseに保存中...' },
]

/* ---- Icons ---- */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const SPEAKER_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  self:    { label: '自分',  color: 'text-mtg-self',    bg: 'bg-mtg-red-dim border-mtg-red/30' },
  other_a: { label: '相手A', color: 'text-mtg-other-a', bg: 'bg-mtg-other-a/10 border-mtg-other-a/30' },
  other_b: { label: '相手B', color: 'text-mtg-other-b', bg: 'bg-mtg-other-b/10 border-mtg-other-b/30' },
}

export default function ReportPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [report, setReport] = useState<MeetingReport | null>(null)
  const [error, setError] = useState('')
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set([0]))

  useEffect(() => {
    const raw = sessionStorage.getItem('nexus_meeting_session')
    if (!raw) { router.push('/home'); return }

    const session: MeetingSession = JSON.parse(raw)
    run(session)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function run(session: MeetingSession) {
    try {
      // Step 1: 清書
      setStep(0)
      const rawText = session.transcript
        .map(e => {
          const label = e.speaker_role === 'self' ? '自分' :
            e.speaker_role === 'other_a' ? '相手A' :
            e.speaker_role === 'other_b' ? '相手B' : '不明'
          return `[${label}] ${e.text}`
        })
        .join('\n')

      const cleanRes = await fetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      const { cleaned } = await cleanRes.json()

      // Step 2: レポート生成
      setStep(1)
      const reportRes = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleaned ?? rawText }),
      })
      const { report: generatedReport } = await reportRes.json()
      setReport(generatedReport)

      // Step 3: 保存
      setStep(2)
      const supabase = createClient()
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (authSession?.access_token) {
        await fetch('/api/save-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session,
            report: generatedReport,
            token: authSession.access_token,
          }),
        })
      }
      setStep(3)
    } catch (err) {
      console.error(err)
      setError('処理中にエラーが発生しました。')
    }
  }

  function toggleTopic(i: number) {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  /* ---- 処理中 ---- */
  if (!report && !error) {
    return (
      <div className="min-h-dvh bg-mtg-black flex flex-col items-center justify-center px-8 gap-8">
        <div className="text-center space-y-1">
          <div className="text-lg font-black tracking-[0.2em] text-white">NEXUS</div>
          <div className="text-xs tracking-[0.4em] text-mtg-red">MEETING JP</div>
        </div>
        <div className="w-full max-w-xs space-y-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                step > i
                  ? 'bg-mtg-red border-mtg-red'
                  : step === i
                  ? 'border-mtg-red blink'
                  : 'border-mtg-border'
              }`}>
                {step > i ? (
                  <CheckIcon className="w-3.5 h-3.5 text-white" />
                ) : step === i ? (
                  <div className="w-2 h-2 rounded-full bg-mtg-red" />
                ) : null}
              </div>
              <span className={`text-sm transition-colors ${
                step > i ? 'text-mtg-light' : step === i ? 'text-white' : 'text-mtg-border'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-mtg-black flex flex-col items-center justify-center gap-4">
        <p className="text-mtg-red">{error}</p>
        <button onClick={() => router.push('/home')} className="text-mtg-mid underline text-sm">
          ホームに戻る
        </button>
      </div>
    )
  }

  /* ---- レポート表示 ---- */
  return (
    <div className="min-h-dvh bg-mtg-black">

      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-mtg-black/95 backdrop-blur border-b border-mtg-border px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.3em] text-mtg-red font-light">MEETING JP</div>
          <div className="text-white font-bold text-sm truncate max-w-xs mt-0.5">
            {report?.title ?? '議事録'}
          </div>
        </div>
        <button
          onClick={() => router.push('/home')}
          className="text-mtg-mid text-xs hover:text-white transition-colors"
        >
          ホームに戻る
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">

        {/* 基本情報 */}
        <div className="bg-mtg-surface border border-mtg-border rounded-2xl px-5 py-4 space-y-2">
          <div className="flex items-center gap-2 text-mtg-mid text-xs">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{report?.basic_info.date}</span>
            {report?.basic_info.location && <span>· {report.basic_info.location}</span>}
          </div>
          {report?.basic_info.participants && report.basic_info.participants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {report.basic_info.participants.map((p, i) => (
                <span key={i} className="text-xs text-mtg-light bg-mtg-dark border border-mtg-border rounded-full px-2.5 py-0.5">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* サマリー */}
        <section>
          <div className="text-xs font-semibold tracking-[0.2em] text-mtg-red mb-3">SUMMARY</div>
          <div className="bg-mtg-surface border border-mtg-border rounded-2xl px-5 py-4">
            <p className="text-mtg-light text-sm leading-relaxed">{report?.summary}</p>
          </div>
        </section>

        {/* トピック */}
        {report?.topics && report.topics.length > 0 && (
          <section>
            <div className="text-xs font-semibold tracking-[0.2em] text-mtg-red mb-3">TOPICS</div>
            <div className="space-y-2">
              {report.topics.map((topic, i) => (
                <div key={i} className="bg-mtg-surface border border-mtg-border rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleTopic(i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-white text-sm font-semibold">{topic.title}</span>
                    {expandedTopics.has(i)
                      ? <ChevronUpIcon className="w-4 h-4 text-mtg-mid shrink-0" />
                      : <ChevronDownIcon className="w-4 h-4 text-mtg-mid shrink-0" />
                    }
                  </button>
                  {expandedTopics.has(i) && (
                    <div className="px-5 pb-4 border-t border-mtg-border/50 pt-3">
                      <p className="text-mtg-light text-sm leading-relaxed whitespace-pre-line">{topic.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 決定事項 / ネクストアクション */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {report?.decisions && report.decisions.length > 0 && (
            <section>
              <div className="text-xs font-semibold tracking-[0.2em] text-mtg-red mb-3">DECISIONS</div>
              <div className="bg-mtg-surface border border-mtg-border rounded-2xl px-5 py-4 space-y-2">
                {report.decisions.map((d, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-mtg-red mt-2 shrink-0" />
                    <p className="text-mtg-light text-sm leading-relaxed">{d}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {report?.next_actions && report.next_actions.length > 0 && (
            <section>
              <div className="text-xs font-semibold tracking-[0.2em] text-mtg-red mb-3">NEXT ACTIONS</div>
              <div className="bg-mtg-surface border border-mtg-border rounded-2xl px-5 py-4 space-y-2">
                {report.next_actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckIcon className="w-4 h-4 text-mtg-other-b shrink-0 mt-0.5" />
                    <p className="text-mtg-light text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 話者別発言 */}
        {report?.transcript_by_speaker && (
          <section>
            <div className="text-xs font-semibold tracking-[0.2em] text-mtg-red mb-3">BY SPEAKER</div>
            <div className="space-y-3">
              {Object.entries(report.transcript_by_speaker).filter(([_k, lines]) => lines && lines.length > 0).map(([role, lines]) => {
                const badge = SPEAKER_BADGE[role]
                if (!badge) return null
                return (
                  <div key={role} className={`rounded-2xl border px-5 py-4 ${badge.bg}`}>
                    <div className={`text-xs font-bold tracking-wider mb-3 ${badge.color}`}>{badge.label}</div>
                    <div className="space-y-1.5">
                      {(lines as string[]).map((line, i) => (
                        <p key={i} className="text-mtg-light text-xs leading-relaxed">· {line}</p>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* カーワード */}
        {report?.keywords && report.keywords.length > 0 && (
          <section>
            <div className="text-xs font-semibold tracking-[0.2em] text-mtg-red mb-3">KEYWORDS</div>
            <div className="flex flex-wrap gap-2">
              {report.keywords.map((kw, i) => (
                <span key={i} className="text-xs text-mtg-light bg-mtg-surface border border-mtg-border rounded-full px-3 py-1">
                  {kw}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}
