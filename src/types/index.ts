// 話者ロール（MeetingJP: 音源2分離）
export type SpeakerRole = 'self' | 'other_a' | 'other_b' | 'unknown'

// 発言エントリ（TranscriptEntry共通型）
export interface TranscriptEntry {
  id: string
  speaker_role: SpeakerRole
  text: string
  timestamp: string // ISO8601
  metadata?: Record<string, unknown>
}

// セッション状態
export type SessionStatus = 'idle' | 'recording' | 'processing' | 'done'

// 会議モード
export type MeetingMode = 'online' | 'offline'

// セッションデータ
export interface MeetingSession {
  id: string
  mode: MeetingMode
  started_at: string
  ended_at?: string
  transcript: TranscriptEntry[]
  report?: MeetingReport
}

// レポート（MeetingJP共通フォーマット）
export interface MeetingReport {
  title?: string
  basic_info: {
    date: string
    location?: string
    participants: string[]
  }
  summary: string
  topics: TopicSection[]
  decisions: string[]
  next_actions: string[]
  transcript_by_speaker: {
    self: string[]
    other_a: string[]
    other_b?: string[]
  }
  keywords: string[]
}

export interface TopicSection {
  title: string
  content: string
}

// ユーザー辞書エントリ
export interface DictionaryEntry {
  id: string
  word: string
  reading?: string
  category: 'shared' | 'personal'
  created_at: string
}
