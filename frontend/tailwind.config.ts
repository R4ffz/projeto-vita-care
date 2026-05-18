import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens semânticos do VitaCare IoT — paleta "Dark Clinical".
        // Estética de monitor de leito noturno / war-room clínico.
        // Mantém os mesmos tokens (vita-text, vita-bg, vita-primary, etc.)
        // para preservar compatibilidade com o resto do app.
        vita: {
          bg:               '#0d1418',  // grafite profundo — canvas do app
          surface:          '#131c22',  // grafite — cards e superfícies
          'surface-elev':   '#1a242b',  // grafite elevado — cards over cards
          border:           '#1f2b33',  // borda escura quase invisível
          'border-strong':  '#2a3842',  // borda visível em divisores
          muted:            '#7d8a96',  // cinza azulado claro — secundário
          text:             '#e8eef2',  // off-white quente — primário
          primary:          '#5fc8b4',  // mint/sálvia neon — marca, destaque
          'primary-strong': '#4eb19e',  // mint neon mais profundo — hover/active
          'primary-soft':   '#173933',  // mint translúcido escuro — chips/pílulas
          accent:           '#3a8db5',  // petróleo claro — links, headlines secundárias
          'accent-soft':    '#15324a',  // petróleo escuro translúcido

          // Sidebar — ainda mais escura que o canvas pra criar profundidade.
          sidebar:          '#0a1014',  // grafite quase preto
          'sidebar-fg':     '#c4d1da',  // texto principal
          'sidebar-muted':  '#6e7c87',  // labels/secundários
          'sidebar-hover':  '#131c22',  // hover sutil
          'sidebar-active': '#5fc8b4',  // mint neon (mesmo da primary)

          // Status clínicos em tons neon para legibilidade em fundo escuro.
          ok:               '#5fc8b4',  // mint neon (estável)
          'ok-soft':        '#173933',  // mint translúcido escuro
          warn:             '#e0a05a',  // âmbar quente (atenção)
          'warn-soft':      '#3a2b14',  // âmbar translúcido escuro
          crit:             '#e85f6a',  // coral neon (crítico)
          'crit-soft':      '#3a141a',  // coral translúcido escuro
        },
      },
      fontFamily: {
        // Serif editorial: Newsreader — usada só em saudações e headlines.
        serif: ['Newsreader', '"Source Serif 4"', 'Georgia', 'serif'],
        // UI sans: Atkinson Hyperlegible — desenhada pelo Braille Institute
        // para máxima legibilidade e diferenciação de cada caractere.
        // Ideal para o público-alvo (idosos, cuidadores em plantão).
        sans: ['"Atkinson Hyperlegible"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Mono: IBM Plex Mono — referência em UIs clínicas/EHR; diferenciação
        // máxima de glifos (1/l/I, 0/O) crítica para leitura de sinais vitais.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // Sombras adaptadas para fundo escuro — depth via blur, não via cor.
        card: '0 1px 2px 0 rgb(0 0 0 / 0.20), 0 1px 3px 0 rgb(0 0 0 / 0.25)',
        soft: '0 8px 24px -6px rgb(0 0 0 / 0.35), 0 2px 8px -2px rgb(0 0 0 / 0.25)',
        // Glow neon sálvia — para CTAs e elementos vivos.
        glow: '0 0 0 1px rgb(95 200 180 / 0.20), 0 0 20px -4px rgb(95 200 180 / 0.30)',
      },
    },
  },
  plugins: [],
} satisfies Config;
