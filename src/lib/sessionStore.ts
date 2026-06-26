import { TranscriptEntry, MeetingSession } from '@/types'
import { v4 as uuidv4 } from 'uuid'

let currentSession: MeetingSession | null = null

export function startSession(mode: 'online' | 'offline'): MeetingSession {
  currentSession = {
    id: uuidv4(),
    mode,
    started_at: new Date().toISOString(),
    transcript: [],
  }
  return currentSession
}

export function addEntry(entry: Omit<TranscriptEntry, 'id' | 'timestamp'>): TranscriptEntry {
  const full: TranscriptEntry = {
    ...entry,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  }
  currentSession?.transcript.push(full)
  return full
}

export function endSession(): MeetingSession | null {
  if (currentSession) {
    currentSession.ended_at = new Date().toISOString()
  }
  return currentSession
}

export function getSession(): MeetingSession | null {
  return currentSession
}

export function clearSession(): void {
  currentSession = null
}

export function getTranscriptText(): string {
  if (!currentSession) return ''
  return currentSession.transcript
    .map(e => {
      const label =
        e.speaker_role === 'self' ? '自分' :
        e.speaker_role === 'other_a' ? '相手A' :
        e.speaker_role === 'other_b' ? '相手B' : '不明'
      return `[${label}] ${e.text}`
    })
    .join('\n')
}
