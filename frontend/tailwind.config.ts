import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens semânticos do VitaCare IoT — paleta "Soft Clinical".
        // Use sempre o token (text-vita-text, bg-vita-surface), nunca os hex.
        // Sálvia + azul-petróleo + bege-pedra: identidade clínica, quente,
        // distante do padrão "SaaS tech" de slate/teal vibrante.
        vita: {
          bg:           '#f5f3ee',  // bege-pedra muito claro — fundo do app
          surface:      '#ffffff',  // cards / superfícies
          border:       '#e7e3da',  // borda quente, quase imperceptível
          muted:        '#5a6573',  // cinza azulado — texto secundário
          text:         '#1c2530',  // slate profundo com toque azulado
          primary:      '#3d6b66',  // sálvia profundo — marca, ações principais
          'primary-strong': '#2f5550', // sálvia mais profundo — hover/active
          'primary-soft':   '#e3ece9', // sálvia translúcido — pílulas, fundos
          accent:       '#2c5b7a',  // azul-petróleo — links, headlines secundárias
          'accent-soft':'#e6edf4',  // azul-petróleo translúcido

          // Sidebar CLARA (off-white quente) — quebra o padrão dark slate de SaaS.
          sidebar:         '#f9f7f2', // off-white quente
          'sidebar-fg':    '#3d4451', // texto principal da sidebar (carvão suave)
          'sidebar-muted': '#8a9099', // labels de seção
          'sidebar-hover': '#ffffff', // hover sutil (vai contrastar com bege)
          'sidebar-active':'#3d6b66', // sálvia (mesma da primary)

          // Status clínicos — tons mais naturais e menos saturados.
          ok:           '#5fa777',  // verde-sálvia (estável)
          'ok-soft':    '#e4f0e7',  // verde-sálvia translúcido
          warn:         '#c47f3a',  // âmbar terroso (atenção)
          'warn-soft':  '#f6ebd9',  // âmbar terroso translúcido
          crit:         '#c14d52',  // vermelho-terracota (crítico)
          'crit-soft':  '#f6dcde',  // vermelho-terracota translúcido
        },
      },
      fontFamily: {
        // Headlines de seção, nomes de paciente, alertas → serif editorial.
        // Cria diferenciação imediata com o padrão sans-only de SaaS.
        serif: ['"Source Serif 4"', '"Source Serif Pro"', 'Georgia', 'serif'],
        // UI, corpo, botões, labels → continua Inter (legibilidade).
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Valores numéricos (BPM/SpO2/Temp) e metadata técnica.
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // Sombras mais quentes e suaves que slate puro.
        card: '0 1px 2px 0 rgb(28 37 48 / 0.04), 0 1px 3px 0 rgb(28 37 48 / 0.05)',
        soft: '0 4px 16px -4px rgb(28 37 48 / 0.08), 0 2px 6px -2px rgb(28 37 48 / 0.05)',
      },
    },
  },
  plugins: [],
} satisfies Config;
