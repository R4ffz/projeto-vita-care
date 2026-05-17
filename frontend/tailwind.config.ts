import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens semânticos do VitaCare IoT (paleta Med Tech).
        // Use sempre o token (text-vita-text, bg-vita-surface), nunca os hex.
        vita: {
          bg:           '#f8fafc',  // slate-50 — fundo do app
          surface:      '#ffffff',  // cards / superfícies
          border:       '#e2e8f0',  // slate-200
          muted:        '#64748b',  // slate-500 — texto secundário
          text:         '#0f172a',  // slate-900 — texto principal
          primary:      '#0d9488',  // teal-600 — marca, ações primárias
          'primary-strong': '#0f766e', // teal-700 — hover/active
          'primary-soft':   '#ccfbf1', // teal-100 — badges/realces suaves
          accent:       '#f59e0b',  // amber-500 — acento controlado
          'accent-soft':'#fef3c7',  // amber-100
          sidebar:      '#0f172a',  // slate-900
          'sidebar-fg': '#cbd5e1',  // slate-300
          'sidebar-muted': '#64748b',
          'sidebar-hover': '#1e293b', // slate-800
          'sidebar-active': '#0d9488', // teal-600
          ok:           '#10b981',  // emerald-500
          warn:         '#f59e0b',  // amber-500
          crit:         '#e11d48',  // rose-600
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
