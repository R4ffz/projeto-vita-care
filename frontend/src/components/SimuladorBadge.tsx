import { CircuitBoard } from 'lucide-react';

interface Props {
  /** 'compact' = pill discreto no topbar; 'full' = linha em rodapé/login. */
  variant?: 'compact' | 'full';
}

/**
 * Indicador profissional e discreto da fonte de dados (dispositivo IoT virtual).
 * Variantes:
 *   - compact: pill enxuto no topbar com tooltip.
 *   - full   : linha textual no rodapé / tela de login.
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
                 border border-vita-border-strong bg-vita-surface
                 text-[12px] font-medium text-vita-muted
                 hover:text-vita-text hover:border-vita-primary/40 transition"
    >
      <CircuitBoard className="h-3.5 w-3.5 text-vita-primary" />
      <span>IoT virtual</span>
    </span>
  );
}
