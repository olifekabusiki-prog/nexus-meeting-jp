'use client'

export interface AudioStreams {
  micStream: MediaStream
  systemStream: MediaStream | null
  micTrack: MediaStreamTrack
  systemTrack: MediaStreamTrack | null
}

/**
 * 2ストリーム音声取得
 * - マイク: getUserMedia + echoCancellation（自分の声）
 * - システム音声: getDisplayMedia（Zoom等・相手の声）
 */
export async function captureAudioStreams(onlineMode: boolean): Promise<AudioStreams> {
  // ① マイク取得（echoCancellation: スピーカー時の漏れ込みを軽減）
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
  // video: true が必要な場合があるため指定し、videoトラックは即破棄
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  })

  // videoトラックを即停止・破棄
  displayStream.getVideoTracks().forEach(t => t.stop())

  const systemTrack = displayStream.getAudioTracks()[0] ?? null
  const systemStream = systemTrack
    ? new MediaStream([systemTrack])
    : null

  return { micStream, systemStream, micTrack, systemTrack }
}

/**
 * ストリームを停止
 */
export function stopAudioStreams(streams: Partial<AudioStreams>) {
  streams.micStream?.getTracks().forEach(t => t.stop())
  streams.systemStream?.getTracks().forEach(t => t.stop())
}

/**
 * AudioStreamをチャンク録音するRecorder
 * onChunk: チャンクBlobが生成されるたびに呼ばれる
 */
export function createChunkRecorder(
  stream: MediaStream,
  onChunk: (blob: Blob) => void,
  chunkDurationMs = 4000
): MediaRecorder {
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm',
  })

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) onChunk(e.data)
  }

  recorder.start(chunkDurationMs)
  return recorder
}
