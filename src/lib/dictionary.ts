import { createClient } from '@/lib/supabase'

const APP_NAME = 'nexus_voice'

/** ログイン中ユーザーの辞書単語一覧（RLSでuser_id自動フィルター） */
export async function loadVoiceWords(): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_dictionary')
    .select('term')
    .eq('app_name', APP_NAME)
    .order('created_at', { ascending: true })

  if (error) { console.error('[Dictionary] load error:', error.message); return [] }
  return (data ?? []).map((r: { term: string }) => r.term)
}

/** 単語を追加。重複は 'duplicate' を返す */
export async function addVoiceWord(term: string): Promise<'ok' | 'duplicate' | 'error'> {
  const word = term.trim()
  if (!word) return 'ok'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'error'

  const { error } = await supabase
    .from('user_dictionary')
    .insert({ user_id: user.id, app_name: APP_NAME, term: word, category: 'personal' })

  if (error) {
    if (error.code === '23505') return 'duplicate'
    console.error('[Dictionary] add error:', error.message)
    return 'error'
  }
  return 'ok'
}

/** 単語を削除 */
export async function deleteVoiceWord(term: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('user_dictionary')
    .delete()
    .eq('user_id', user.id)
    .eq('app_name', APP_NAME)
    .eq('term', term)

  if (error) console.error('[Dictionary] delete error:', error.message)
}
