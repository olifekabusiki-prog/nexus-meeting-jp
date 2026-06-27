import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai'

const keys = [
  process.env.OPENAI_API_KEY_1,
  process.env.OPENAI_API_KEY_2,
  process.env.OPENAI_API_KEY_3,
  process.env.OPENAI_API_KEY_4,
  process.env.OPENAI_API_KEY_5,
  process.env.OPENAI_API_KEY_6,
  process.env.OPENAI_API_KEY_7,
  process.env.OPENAI_API_KEY_8,
  process.env.OPENAI_API_KEY_9,
  process.env.OPENAI_API_KEY_10,
].filter(Boolean) as string[]

let idx = 0
function getClient() {
  const key = keys[idx % keys.length]
  idx++
  return new OpenAI({ apiKey: key })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const language = (form.get('language') as string) ?? 'ja'
    if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })

    const client = getClient()
    const buf = Buffer.from(await file.arrayBuffer())
    const audioFile = await toFile(buf, 'audio.webm', { type: 'audio/webm' })

    const result = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language,
    })

    return NextResponse.json({ text: result.text })
  } catch (err) {
    console.error('[transcribe]', err)
    return NextResponse.json({ text: '' })
  }
}
