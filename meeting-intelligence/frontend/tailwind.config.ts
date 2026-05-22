import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0a0a0f',
        'bg-surface': '#12121a',
        'bg-elevated': '#1a1a28',
        'border-dim': '#1e1e2e',
        'border-bright': '#2e2e4e',
        'accent-blue': '#0e71eb',
        'accent-gold': '#f59e0b',
        'text-primary': '#f0f0f0',
        'text-secondary': '#8888aa',
        'text-muted': '#44445a',
        'speaker-1': '#60a5fa',
        'speaker-2': '#34d399',
        'speaker-3': '#f472b6',
        'speaker-4': '#a78bfa',
        'speaker-5': '#fb923c',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
