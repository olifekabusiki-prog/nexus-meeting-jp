'use client'

export type WhisperLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export async function loadWhisper(
  onProgress?: (status: WhisperLoadStatus, progress?: number) => void
): Promise<void> {
  onProgress?.('ready', 100)
}

export async function transcribeBlob(blob: Blob, language = 'ja'): Promise<string> {
  try {
    const form = new FormData()
    form.append('file', blob, 'audio.webm')
    form.append('language', language)
    const res = await fetch('/api/transcribe', { method: 'POST', body: form })
    if (!res.ok) return ''
    const { text } = await res.json()
    return text ?? ''
  } catch {
    return ''
  }
}

export function isWhisperReady(): boolean {
  return true
}
