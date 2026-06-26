import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nexus Meeting JP: ダーク基調 + 赤アクセント + 話者カラー
        mtg: {
          black:      '#0A0A0A',
          dark:       '#141414',
          surface:    '#1C1C1C',
          border:     '#2C2C2C',
          mid:        '#666666',
          light:      '#AAAAAA',
          white:      '#F5F5F5',
          red:        '#E53E3E',
          'red-dark': '#C53030',
          'red-dim':  '#3D1515',
          // 話者カラー
          self:       '#E53E3E',   // 自分: ブランドレッド
          'other-a':  '#4A9EFF',  // 相手A: ブルー
          'other-b':  '#34D399',  // 相手B: グリーン
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Hiragino Sans', 'Yu Gothic UI', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(229,62,62,0.5)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(229,62,62,0)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
      animation: {
        'pulse-red': 'pulse-red 1.5s ease-in-out infinite',
        'fade-in':   'fade-in 0.25s ease-out',
        blink:       'blink 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
