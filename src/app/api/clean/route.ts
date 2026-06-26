import { NextResponse } from 'next/server'
import { cleanTranscript } from '@/lib/openai'
import { createClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ cleaned: '' })

    const supabase = createClient()
    const { data: dictData } = await supabase
      .from('user_dictionary')
      .select('term')
      .eq('app_name', 'nexus_meeting')
      .order('created_at', { ascending: false })
      .limit(200)

    const dictionary = dictData?.map((d: { term: string }) => d.term) ?? []

    const cleaned = await cleanTranscript(text, dictionary)
    return NextResponse.json({ cleaned })
  } catch (error) {
    console.error('/api/clean error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
