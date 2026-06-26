import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import type { VoiceReport, VoiceSession } from '@/types'

const ROLE_LABEL: Record<string, string> = {
  host: '担当',
  client: 'お客様',
  coach: 'コーチ',
  unknown: '不明',
}

/** 全文書き起こしテキスト（分析・資料用） */
export function exportTranscript(session: VoiceSession, report?: VoiceReport | null): string {
  const date = report?.basic_info.date ?? new Date(session.started_at).toLocaleDateString('ja-JP')
  const lines: string[] = []
  lines.push(`■ NEXUS Voice 文字起こし全文`)
  lines.push(`日時: ${date}`)
  lines.push('─'.repeat(40))
  lines.push('')
  session.transcript.forEach(entry => {
    const time = new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const role = ROLE_LABEL[entry.speaker_role] ?? entry.speaker_role
    lines.push(`[${time}] [${role}]`)
    lines.push(entry.text)
    lines.push('')
  })
  return lines.join('\n')
}

function reportToLines(report: VoiceReport): string[] {
  const lines: string[] = []
  lines.push(`■ 基本情報`)
  lines.push(`日時: ${report.basic_info.date}`)
  if (report.basic_info.location) lines.push(`場所: ${report.basic_info.location}`)
  lines.push(`参加者: ${report.basic_info.participants.join('、')}`)
  lines.push('')
  lines.push(`■ サマリー`)
  lines.push(report.summary)
  lines.push('')
  lines.push(`■ トピック別まとめ`)
  report.topics.forEach(t => {
    lines.push(`【${t.title}】`)
    lines.push(t.content)
  })
  lines.push('')
  lines.push(`■ 決定事項・合意事項`)
  report.decisions.forEach(d => lines.push(`・${d}`))
  lines.push('')
  lines.push(`■ ネクストアクション`)
  report.next_actions.forEach(a => lines.push(`・${a}`))
  lines.push('')
  lines.push(`■ キーワード・専門用語`)
  lines.push(report.keywords.join('、'))
  lines.push('')
  lines.push(`■ Slide用テキスト`)
  lines.push(report.slide_text)
  return lines
}

export async function exportToWord(report: VoiceReport, filename: string) {
  const children = reportToLines(report).map((line) => {
    if (line.startsWith('■')) {
      return new Paragraph({
        text: line,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    }
    return new Paragraph({
      children: [new TextRun({ text: line, font: 'Hiragino Sans' })],
      spacing: { after: 60 },
    })
  })

  const doc = new Document({
    sections: [{ children }],
    creator: 'NEXUS Voice',
    title: report.title || `商談レポート ${report.basic_info.date}`,
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${filename}.docx`)
}

// jsPDFは日本語非対応のため、ブラウザのPDF印刷機能を使用
export function printReport(): void {
  window.print()
}

export function downloadAudio(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.webm`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToClipboard(report: VoiceReport): string {
  return reportToLines(report).join('\n')
}
