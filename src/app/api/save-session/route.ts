import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import type { MeetingSession, MeetingReport } from '@/types'

export async function POST(req: Request) {
  try {
    const { session, report, token } = await req.json() as {
      session: MeetingSession
      report: MeetingReport | null
      token: string
    }

    const supabase = createServiceClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const durationMin = session.started_at && session.ended_at
      ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
      : null

    const transcriptText = session.transcript
      .map(e => {
        const label = e.speaker_role === 'self' ? '自分' : e.speaker_role === 'other_a' ? '相手A' : e.speaker_role === 'other_b' ? '相手B' : '不明'
        return `[${label}] ${e.text}`
      })
      .join('\n')

    const title = report?.title
      ? `${new Date(session.started_at).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}_${report.title}`
      : `NEXUS Meeting ${new Date(session.started_at).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}`

    const { data: rawLog, error: logError } = await supabase
      .from('raw_logs')
      .insert({
        user_id: user.id,
        source_app: 'nexus_meeting',
        session_type: session.mode === 'online' ? 'online_meeting' : 'offline_meeting',
        title,
        summary_text: report?.summary ?? null,
        key_terms: report?.keywords ?? [],
        started_at: session.started_at,
        ended_at: session.ended_at ?? new Date().toISOString(),
        duration_min: durationMin,
        content: { mode: session.mode, transcript: session.transcript, raw_text: transcriptText },
      })
      .select('id')
      .single()

    if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

    if (report && rawLog) {
      await supabase.from('reports').insert({
        user_id: user.id, raw_log_id: rawLog.id, report_type: 'meeting_jp',
        content: report, key_terms: report.keywords ?? [], action_items: report.next_actions ?? [],
      })
    }
    return NextResponse.json({ ok: true, log_id: rawLog?.id })
  } catch (error) {
    console.error('[save-session] error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
