import OpenAI from 'openai'

// nexus-meetingjp専用キー・ラウンドロビンローテーション（10本）
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

let currentIndex = 0

function getClient(): OpenAI {
  const key = keys[currentIndex % keys.length]
  currentIndex++
  return new OpenAI({ apiKey: key })
}

// Step 1: GPT-4o-mini で粗テキストを清書・話者整理
export async function cleanTranscript(
  rawText: string,
  dictionary: string[]
): Promise<string> {
  const client = getClient()
  const dictHint = dictionary.length > 0
    ? `\n\n【専門用語辞書】\n${dictionary.join('、')}`
    : ''

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `あなたは会議テキストを清書・整理するアシスタントです。
音声認識の誤字・脱字・言い間違いを修正し、読みやすい日本語に整えてください。
意味や内容は変えずに忠実に清書してください。
話者ラベル（自分 / 相手側）がある場合は必ず保持し、複数の相手がいる場合は文脈から「相手A」「相手B」に整理してください。
決して「要約」せず「整理」してください。${dictHint}`,
      },
      {
        role: 'user',
        content: `以下の音声認識テキストを清書・話者整理してください:\n\n${rawText}`,
      },
    ],
    max_tokens: 8000,
    temperature: 0.2,
  })

  return res.choices[0]?.message?.content ?? rawText
}

// Step 2: GPT-4o-mini で構造化レポート（意思決定ログ）を生成
export async function generateReport(cleanedText: string): Promise<string> {
  const client = getClient()

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `あなたはプロの会議議事録作成者です。会話を「要約」せず「構造化・整理」し、誰が（自分=self／相手A=other_a／相手B=other_b）何を述べたかを必ず明示してください。
発言は単に列挙せず文章でつなぎ、内容量が多いほど各トピックを複数段落で厚く詳述します（短い会議は簡潔でよい）。
以下の共通フォーマットでJSONを返してください。

{
  "title": "会議内容から推測した簡潔なタイトル（15文字程度。記号・改行不可）",
  "basic_info": {
    "date": "",
    "location": "場所（不明な場合は空文字）",
    "participants": ["参加者名（不明な場合は自分/相手A/相手B）"]
  },
  "summary": "会議全体の目的・主要な論点・結論を数文でしっかり記述（省略禁止。長い会議ほど厚く）",
  "topics": [
    {
      "title": "議題名",
      "content": "そのトピックでの議論を、発言者（自分=self／相手A=other_a／相手B=other_b）を示しながら流れに沿って省略せず整理した本文。カンマ列挙ではなく文章で書く（例:「相手Aは〜と述べた。これに対し自分は〜と応じた」）。内容が多ければ複数段落で詳述する。"
    }
  ],
  "decisions": ["決定事項・合意事項"],
  "next_actions": ["ネクストアクション"],
  "transcript_by_speaker": {
    "self": ["自分の主な発言"],
    "other_a": ["相手Aの主な発言"],
    "other_b": ["相手Bの主な発言（存在しない場合は空配列）"]
  },
  "keywords": ["キーワード・専門用語"]
}

重要なルール:
- 「要約」ではなく「整理・構造化」として扱うこと
- 発言内容は省略しないこと
- カンマ列挙禁止。文章で書くこと
- dateフィールドは必ず空文字 "" にすること（実日時はシステムが付与）
- 必ずJSON形式のみで返答すること`,
      },
      {
        role: 'user',
        content: `以下の会議テキストからレポートを作成してください:\n\n${cleanedText}`,
      },
    ],
    max_tokens: 8000,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  return res.choices[0]?.message?.content ?? '{}'
}
