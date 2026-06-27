'use client'

export interface AudioStreams {
  micStream: MediaStream
  systemStream: MediaStream | null
  micTrack: MediaStreamTrack
  systemTrack: MediaStreamTrack | null
  _silentCtx?: AudioContext  // cleanup用・外部から直接使わない
}

/**
 * 2ストリーム音声取得
 * - マイク: getUserMedia + echoCancellation（自分の声）
 * - システム音声: getDisplayMedia（Zoom・Teams・Meet など・相手の声）
 *
 * システム音声はAudioContext(gain=0)でサイレント接続し、
 * キャプチャしたストリームが再生ループになるのを防ぐ。
 */
export async function captureAudioStreams(onlineMode: boolean): Promise<AudioStreams> {
  // ① マイク取得（echoCancellation: スピーカー使用時の漏れ込みを軽減）
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000,
    },
  })
  const micTrack = micStream.getAudioTracks()[0]

  if (!onlineMode) {
    return { micStream, systemStream: null, micTrack, systemTrack: null }
  }

  // ② システム音声取得（オンラインモード時のみ）
  // video: true が必要なブラウザがあるため指定し、videoTrack は即 stop() して破棄
  const displayStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
  displayStream.getVideoTracks().forEach(t => t.stop())

  const systemTrack = displayStream.getAudioTracks()[0] ?? null
  if (!systemTrack) {
    return { micStream, systemStream: null, micTrack, systemTrack: null }
  }

  const systemStream = new MediaStream([systemTrack])

  // ③ システム音声をサイレントなAudioContextに接続
  // → キャプチャしたストリームが2重再生されるのを防ぐ
  // → 元の会議アプリ（Zoom等）の音声再生には影響しない
  let silentCtx: AudioContext | undefined
  try {
    silentCtx = new AudioContext()
    const src = silentCtx.createMediaStreamSource(systemStream)
    const gain = silentCtx.createGain()
    gain.gain.value = 0
    src.connect(gain)
    gain.connect(silentCtx.destination)
  } catch {
    // AudioContext非対応環境ではスキップ
  }

  return { micStream, systemStream, micTrack, systemTrack, _silentCtx: silentCtx }
}

export function stopAudioStreams(streams: Partial<AudioStreams>) {
  streams.micStream?.getTracks().forEach(t => t.stop())
  streams.systemStream?.getTracks().forEach(t => t.stop())
  streams._silentCtx?.close()
}

/**
 * AudioStreamをチャンク録音するRecorder
 * onChunk: チャンクBlobが生成されるたびに呼ばれる
 */
export function createChunkRecorder(
  stream: MediaStream,
  onChunk: (blob: Blob) => void
): MediaRecorder {
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm'
  const recorder = new MediaRecorder(stream, { mimeType })
  recorder.ondataavailable = e => {
    if (e.data.size > 0) onChunk(e.data)
  }
  recorder.start(4000)
  return recorder
}
