import { CircuitBoard } from 'lucide-react';

interface Props {
  /** 'compact' = pill discreto no topbar; 'full' = linha em rodapé/login. */
  variant?: 'compact' | 'full';
}

/**
 * Indicador profissional e discreto de que a fonte dos dados é um dispositivo
 * IoT virtual (simulador), em vez do badge "MODO SIMULAÇÃO" gritante.
 */
export function SimuladorBadge({ variant = 'compact' }: Props) {
  if (variant === 'full') {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-vita-muted">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-vita-primary opacity-60 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-vita-primary" />
        </span>
        <span>Ambiente de demonstração — dados recebidos via simulador IoT virtual.</span>
      </div>
    );
  }

  return (
    <span
      title="Fonte dos dados: dispositivo IoT virtual (simulador). Ver rodapé para detalhes."
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                 border border-vita-border bg-white
                 text-[11px] font-medium text-vita-muted
                 hover:text-vita-text transition"
    >
      <CircuitBoard className="h-3.5 w-3.5 text-vita-primary" />
      <span className="font-mono uppercase tracking-wide">IoT virtual</span>
    </span>
  );
}
