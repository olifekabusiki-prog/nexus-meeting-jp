'use client'

// Whisper機能は無効化（オンライン文字起こしAPIを使用）

export type WhisperLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export async function loadWhisper(
  onProgress?: (status: WhisperLoadStatus, progress?: number) => void
): Promise<void> {
  onProgress?.('ready', 100)
}

export async function transcribeBlob(
  _blob: Blob,
  _language = 'ja'
): Promise<string> {
  return ''
}

export function isWhisperReady(): boolean {
  return true
}
