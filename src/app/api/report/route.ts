import { NextResponse } from 'next/server'
import { generateReport } from '@/lib/openai'
import type { MeetingReport } from '@/types'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ report: null })

    const raw = await generateReport(text)
    const report: MeetingReport = JSON.parse(raw)

    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    report.basic_info.date = now

    return NextResponse.json({ report })
  } catch (error) {
    console.error('/api/report error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
