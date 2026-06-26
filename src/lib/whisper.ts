'use client'

// @huggingface/transformers を動的インポート（SSR回避）
let pipeline: ((audio: Float32Array | AudioBuffer, options?: Record<string, unknown>) => Promise<{ text: string }>) | null = null
let isLoading = false

export type WhisperLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Whisperモデルをロード（初回のく）
 * WebGPUが利用可能な場合はWebGPU、そうでなければWasm
 */
export async function loadWhisper(
  onProgress?: (status: WhisperLoadStatus, progress?: number) => void
): Promise<void> {
  if (pipeline) return
  if (isLoading) return

  isLoading = true
  onProgress?.('loading', 0)

  try {
    const { pipeline: createPipeline } = await import('@huggingface/transformers')

    // WebGPU対応確認
    const device = 'gpu' in navigator ? 'webgpu' : 'wasm'

    pipeline = await createPipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-large-v3-turbo',
      {
        device,
        dtype: device === 'webgpu' ? 'fp16' : 'q8',
        progress_callback: (p: { progress?: number }) => {
          onProgress?.('loading', p.progress ?? 0)
        },
      }
    ) as typeof pipeline

    onProgress?.('ready', 100)
  } catch (e) {
    console.error('Whisper load error:', e)
    onProgress?.('error')
    throw e
  } finally {
    isLoading = false
  }
}

/**
 * 音声Blobをテキストに変換
 */
export async function transcribeBlob(
  blob: Blob,
  language = 'ja'
): Promise<string> {
  if (!pipeline) throw new Error('Whisper not loaded')

  const arrayBuffer = await blob.arrayBuffer()
  const audioContext = new AudioContext({ sampleRate: 16000 })
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  const float32 = audioBuffer.getChannelData(0)

  const result = await pipeline(float32, {
    language,
    task: 'transcribe',
    return_timestamps: false,
  })

  return result?.text?.trim() ?? ''
}

export function isWhisperReady(): boolean {
  return pipeline !== null
}
