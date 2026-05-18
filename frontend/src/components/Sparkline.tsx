interface Props {
  /** Série numérica (ex: últimos BPMs). Mínimo 2 pontos. */
  valores: number[];
  /** Largura visual em px. */
  width?: number;
  /** Altura visual em px. */
  height?: number;
  /** Cor do traço — usa currentColor por padrão (herda do contexto). */
  cor?: string;
  /** Espessura do traço. */
  strokeWidth?: number;
}

/**
 * Mini-sparkline em SVG puro. Sem libs, sem deps, sem state.
 * Renderiza uma linha suavizada representando a tendência da série.
 * Usada nos cards de paciente estável para indicar "monitor vivo".
 */
export function Sparkline({
  valores,
  width = 64,
  height = 22,
  cor = 'currentColor',
  strokeWidth = 1.4,
}: Props) {
  if (valores.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line
          x1={0} y1={height / 2}
          x2={width} y2={height / 2}
          stroke={cor}
          strokeWidth={strokeWidth}
          strokeDasharray="2 3"
          strokeLinecap="round"
          opacity={0.35}
        />
      </svg>
    );
  }

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const range = max - min || 1;
  const padY = 2;
  const usableH = height - padY * 2;
  const stepX = width / (valores.length - 1);

  const pontos = valores.map((v, i) => {
    const x = i * stepX;
    const y = padY + usableH - ((v - min) / range) * usableH;
    return [x, y] as const;
  });

  const d = pontos
    .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`))
    .join(' ');

  const [ultimoX, ultimoY] = pontos[pontos.length - 1]!;

  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <path
        d={d}
        stroke={cor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ultimoX} cy={ultimoY} r={1.8} fill={cor} />
    </svg>
  );
}
