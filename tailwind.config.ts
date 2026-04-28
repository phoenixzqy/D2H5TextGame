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
          runeword: '#ff8c1a'
        }
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
