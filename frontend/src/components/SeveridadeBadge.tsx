import type { Severidade } from '@/types';

const CLASSES: Record<Severidade, string> = {
  BAIXA:   'bg-vita-surface-elev text-vita-muted border-vita-border-strong',
  MEDIA:   'bg-vita-warn-soft text-vita-warn border-vita-warn/30',
  ALTA:    'bg-vita-warn-soft text-vita-warn border-vita-warn/45',
  CRITICA: 'bg-vita-crit-soft text-vita-crit border-vita-crit/40',
};

const ROTULO: Record<Severidade, string> = {
  BAIXA:   'Baixa',
  MEDIA:   'Média',
  ALTA:    'Alta',
  CRITICA: 'Crítica',
};

export function SeveridadeBadge({ severidade }: { severidade: Severidade }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md
                      text-[11px] font-semibold uppercase tracking-wide
                      border ${CLASSES[severidade]}`}>
      {ROTULO[severidade]}
    </span>
  );
}
