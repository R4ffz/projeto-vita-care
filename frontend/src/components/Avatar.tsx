import type { StatusPaciente } from '@/types';

interface Props {
  nome: string;
  /** Tamanhos pré-definidos. */
  size?: 'sm' | 'md' | 'lg';
  /** Cor do anel ao redor (estado clínico). null = sem anel. */
  ring?: StatusPaciente | null;
  /** Variante visual. */
  tone?: 'sage' | 'petrol' | 'neutral';
}

const SIZES: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

const TONES: Record<NonNullable<Props['tone']>, string> = {
  sage:    'bg-vita-primary-soft text-vita-primary-strong',
  petrol:  'bg-vita-accent-soft  text-vita-accent',
  neutral: 'bg-vita-bg           text-vita-muted',
};

const RING_COLOR: Record<StatusPaciente, string> = {
  ok:      'ring-vita-ok',
  atencao: 'ring-vita-warn',
  critico: 'ring-vita-crit',
  offline: 'ring-vita-border',
};

/**
 * Avatar circular com iniciais do nome. Substitui a foto quando ela não existe
 * e dá um toque humano à interface. Anel opcional sinaliza estado clínico.
 */
export function Avatar({ nome, size = 'md', ring = null, tone = 'sage' }: Props) {
  const iniciais = extrairIniciais(nome);
  const sizeCls  = SIZES[size];
  const toneCls  = TONES[tone];
  const ringCls  = ring
    ? `ring-2 ring-offset-2 ring-offset-vita-surface ${RING_COLOR[ring]}`
    : '';
  const pulse    = ring === 'critico' ? 'animate-pulse' : '';

  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full
                  font-semibold tracking-tight select-none
                  ${sizeCls} ${toneCls} ${ringCls} ${pulse}`}
    >
      {iniciais}
    </span>
  );
}

function extrairIniciais(nome: string): string {
  const limpo = nome.trim();
  if (!limpo) return '?';
  const partes = limpo.split(/\s+/);
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  const primeira = partes[0]![0] ?? '';
  const ultima   = partes[partes.length - 1]![0] ?? '';
  return (primeira + ultima).toUpperCase();
}
