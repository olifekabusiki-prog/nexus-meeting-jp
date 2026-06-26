'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { captureAudioStreams, createChunkRecorder, stopAudioStreams, type AudioStreams } from '@/lib/audioCapture'
import { loadWhisper, transcribeBlob, isWhisperReady, type WhisperLoadStatus } from '@/lib/whisper'
import type { TranscriptEntry } from '@/types'

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

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const SPEAKER_STYLES: Record<string, { label: string; color: string; side: 'left' | 'right' }> = {
  self:    { label: '自分',  color: 'text-mtg-self',    side: 'right' },
  other_a: { label: '相手A', color: 'text-mtg-other-a', side: 'left'  },
  other_b: { label: '相手B', color: 'text-mtg-other-b', side: 'left'  },
  unknown: { label: '?',    color: 'text-mtg-mid',     side: 'left'  },
}

/* ---- Session Content ---- */
function SessionContent() {
  const router = useRouter()
  const params = useSearchParams()
  const online = params.get('mode') === 'online'

  const [whisperStatus, setWhisperStatus] = useState<WhisperLoadStatus>('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])

  const streamsRef    = useRef<Partial<AudioStreams>>({})
  const micRecorder   = useRef<MediaRecorder | null>(null)
  const sysRecorder   = useRef<MediaRecorder | null>(null)
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef  = useRef<string>(new Date().toISOString())
  const transcriptRef = useRef<TranscriptEntry[]>([])
  const scrollRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isWhisperReady()) {
      setWhisperStatus('loading')
      loadWhisper((status, progress) => {
        setWhisperStatus(status)
        setLoadProgress(progress ?? 0)
      }).catch(() => setWhisperStatus('error'))
    } else {
      setWhisperStatus('ready')
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript])

  useEffect(() => {
    return () => {
      micRecorder.current?.stop()
      sysRecorder.current?.stop()
      stopAudioStreams(streamsRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const addEntry = useCallback((text: string, role: TranscriptEntry['speaker_role']) => {
    if (!text.trim()) return
    const entry: TranscriptEntry = {
      id: uuidv4(),
      speaker_role: role,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    }
    transcriptRef.current = [...transcriptRef.current, entry]
    setTranscript([...transcriptRef.current])
  }, [])

  async function handleStart() {
    if (whisperStatus !== 'ready') return
    try {
      const streams = await captureAudioStreams(online)
      streamsRef.current = streams
      startedAtRef.current = new Date().toISOString()
      setIsCapturing(true)
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
      micRecorder.current = createChunkRecorder(streams.micStream, async (blob) => {
        const text = await transcribeBlob(blob)
        addEntry(text, 'self')
      })
      if (streams.systemStream) {
        sysRecorder.current = createChunkRecorder(streams.systemStream, async (blob) => {
          const text = await transcribeBlob(blob)
          addEntry(text, 'other_a')
        })
      }
    } catch (err) {
      console.error('Start error:', err)
      alert('音声合取得に失敗しました。権限を確オをしてください。')
    }
  }

  function handleStop() {
    micRecorder.current?.stop()
    sysRecorder.current?.stop()
    stopAudioStreams(streamsRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    setIsCapturing(false)
    const session = {
      id: uuidv4(),
      mode: online ? 'online' : 'offline',
      started_at: startedAtRef.current,
      ended_at: new Date().toISOString(),
      transcript: transcriptRef.current,
    }
    sessionStorage.setItem('nexus_meeting_session', JSON.stringify(session))
    router.push('/report')
  }

  if (whisperStatus === 'loading') {
    return (
      <div className="h-dvh bg-mtg-black flex flex-col items-center justify-center gap-6 px-8">
        <div className="text-center space-y-2">
          <div className="text-white font-semibold tracking-wider">音声⨞ンジンを準備中</div>
          <div className="text-mtg-mid text-xs">初回のみぐ鍴知いかかります<span className="ml-1">(先容せ次料き必要）</span></div>
        </div>
        <div className="w-full max-w-xs bg-mtg-surface rounded-full h-1.5">
          <div className="bg-mtg-red h-1.5 rounded-full transition-all duration-300" style={{ width: `${Math.max(5, loadProgress)}%` }} />
        </div>
        <div className="text-mtg-mid text-xs font-mono">{Math.round(loadProgress)}%</div>
      </div>
    )
  }

  if (whisperStatus === 'error') {
    return (
      <div className="h-dvh bg-mtg-black flex flex-col items-center justify-center gap-4 px-8">
        <div className="text-mtg-red font-semibold">エンジンのロードに失敗しました</div>
        <button onClick={() => router.push('/home')} className="text-mtg-mid text-sm underline">
          ホームに戻る
        </button>
      </div>
    )
  }

  return (
    <div className="h-dvh bg-mtg-black flex flex-col overflow-hidden">
      <header className="shrink-0 flex items-center justify-between px-5 pt-8 pb-4 border-b border-mtg-border">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm tracking-widest">MEETING JP</span>
          <div className="flex items-center gap-2">
            {isCapturing && (
              <>
                <div className="flex items-center gap-1 bg-mtg-red/10 border border-mtg-red/30 rounded-full px-2.5 py-1">
                  <MicIcon className="w-3 h-3 text-mtg-self" />
                  <div className="w-1.5 h-1.5 rounded-full bg-mtg-self recording-pulse" />
                </div>
                {online && (
                  <div className="flex items-center gap-1 bg-mtg-other-a/10 border border-mtg-other-a/30 rounded-full px-2.5 py-1">
                    <MonitorIcon className="w-3 h-3 text-mtg-other-a" />
                    <div className="w-1.5 h-1.5 rounded-full bg-mtg-other-a blink" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {isCapturing && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-mtg-red recording-pulse" />
            <span className="text-mtg-red text-xs font-mono font-semibold">{formatTime(elapsed)}</span>
          </div>
        )}
      </header>
      {isCapturing && (
        <div className="shrink-0 flex items-center gap-4 px-5 py-2 border-b border-mtg-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-mtg-self" />
            <span className="text-mtg-self text-xs">自分（マイク）</span>
          </div>
          {online && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-mtg-other-a" />
              <span className="text-mtg-other-a text-xs">相手A（システム音声）</span>
            </div>
          )}
        </div>
      )}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3 min-h-0"
      >
        {transcript.length === 0 && (
          <div className="text-center mt-20 space-y-2">
            {isCapturing ? (
              <>
                <div className="text-mtg-mid text-sm">音声を認識中...</div>
                <div className="text-mtg-border text-xs">チャンクが哆外続してきます（㾤と）</div>
              </>
            ) : (
              <>
                <div className="text-mtg-mid text-sm">準備完了</div>
                <div className="text-mtg-border text-xs">下の「開始」ボタンを押してください</div>
              </>
            )}
          </div>
        )}
        {transcript.map((entry) => {
          const style = SPEAKER_STYLES[entry.speaker_role] ?? SPEAKERESTYLES.unknown
          const isRight = style.side === 'right'
          return (
            <div key={entry.id} className={`flex flex-col fade-up ${isRight ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-1.5 mb-1 ${isRight ? 'flex-row-reverse' : ''}`}>
                <span className={`text-xs font-semibold ${style.color}`}>{style.label}</span>
                <span className="text-mtg-border text-xs">
                  {new Date(entry.timestamp).toLocaleTimeString('Ja-JP', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </span>
              </div>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${isRight ? 'bg-mtg-red-dim border border-mtg-red/30 rounded-tr-sm' : 'bg-mtg-surface border border-mtg-border rounded-tl-sm'}`}>
                <p className="text-white text-sm leading-relaxed">{entry.text}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="shrink-0 border-t border-mtg-border px-5 py-5">
        <div className="flex items-center justify-center gap-6 max-w-sm mx-auto">
          <button onClick={() => router.push('/home')} disabled={isCapturing} className="flex flex-col items-center gap-1.5 text-mtg-mid disabled:opacity-30">
            <div className="w-12 h-12 rounded-full border border-mtg-border flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M19 12H15 1	5 9l7 7M19 12"5 12l7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span className="text-xs">戻る</span>
          </button>
          {!isCapturing ? (
            <button onClick={handleStart} disabled={whisperStatus !== 'ready'} className="flex flex-col items-center gap-1.5">
              <div className="w-20 h-20 rounded-full bg-mtg-red flex items-center justify-center shadow-xl shadow-mtg-red/40 active:scale-95 transition-all disabled:opacity-50">
                <span className="text-white font-bold text-base tracking-wider">開始</span>
              </div>
              <span className="text-mtg-red text-xs font-semibold">TAP TO START</span>
            </button>
          ) : (
            <button onClick={handleStop} className="flex flex-col items-center gap-1.5">
              <div className="w-20 h-20 rounded-full bg-mtg-surface border-2 border-mtg-red flex items-center justify-center active:scale-95 transition-all recording-pulse">
                <div className="w-7 h-7 rounded-sm bg-mtg-red" />
              </div>
              <span className="text-white text-xs font-semibold">STOP &amp; REPORT</span>
            </button>
          )}
          <div className="flex flex-col items-center gap-1.5 w-12">
            <div className="w-12 h-12 rounded-full border border-mtg-border flex items-center justify-center">
              <span className="text-mtg-light text-xs font-mono font-bold">{transcript.length}</span>
            </div>
            <span className="text-mtg-mid text-xs">発���取得 </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="h-dvh bg-mtg-black flex items-center justify-center"><p className="text-mtg-mid text-sm">読み���み中...</p></div>}>
      <SessionContent />
    </Suspense>
  )
}
