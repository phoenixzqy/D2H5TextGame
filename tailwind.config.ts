import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        d2: {
          bg: '#0a0a0a',
          panel: '#1a1410',
          border: '#4a3a2a',
          gold: '#c8a85a',
          // Item rarity colors
          white: '#d0d0d0',
          magic: '#6a82ff',
          rare: '#f5e26b',
          unique: '#b8860b',
          set: '#00b300',
          runeword: '#ff8c1a',
          // (NEW) — boss tier ring (per docs/art/card-design-spec.md §5)
          boss: '#9b2222'
        }
      },
      fontSize: {
        // (NEW) — card stat numerals + micro labels
        'stat-xl': ['1.75rem', { lineHeight: '1', fontWeight: '700' }],
        'stat-lg': ['1.5rem', { lineHeight: '1', fontWeight: '700' }],
        'micro': ['0.625rem', { lineHeight: '0.875rem' }]
      },
      keyframes: {
        // (NEW) — sparingly-used "shimmer" for runeword + boss frames
        'd2-shimmer': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200,168,90,0.0)' },
          '50%': { boxShadow: '0 0 8px 1px rgba(200,168,90,0.45)' }
        }
      },
      animation: {
        'd2-shimmer': 'd2-shimmer 4s ease-in-out infinite'
      },
      fontFamily: {
        serif: ['Tinos', 'Georgia', 'Times New Roman', 'serif'],
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
