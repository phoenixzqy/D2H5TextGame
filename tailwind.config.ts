import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        d2: {
          bg: '#0b0c0d',
          panel: '#191b1d',
          border: '#635643',
          gold: '#d3b77b',
          // Item rarity colors
          white: '#e0d9cc',
          magic: '#9aaaff',
          rare: '#f5e26b',
          unique: '#c8a66a',
          set: '#62ce67',
          runeword: '#ff8c1a',
          // boss tier ring (per docs/art/card-design-spec.md §5)
          boss: '#9b2222'
        }
      },
      fontSize: {
        // card stat numerals + micro labels
        'stat-xl': ['1.75rem', { lineHeight: '1', fontWeight: '700' }],
        'stat-lg': ['1.5rem', { lineHeight: '1', fontWeight: '700' }],
        'micro': ['0.625rem', { lineHeight: '0.875rem' }]
      },
      keyframes: {
        // sparingly-used "shimmer" for runeword + boss frames
        'd2-shimmer': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200,168,90,0.0)' },
          '50%': { boxShadow: '0 0 8px 1px rgba(200,168,90,0.45)' }
        }
      },
      animation: {
        'd2-shimmer': 'd2-shimmer 4s ease-in-out infinite'
      },
      fontFamily: {
        serif: ['Palatino Linotype', 'Book Antiqua', 'Georgia', 'Songti SC', 'STSong', 'SimSun', 'serif'],
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
} satisfies Config;
