import type { Severidade } from '@/types';

const CLASSES: Record<Severidade, string> = {
  BAIXA:   'bg-slate-100 text-slate-700 border-slate-200',
  MEDIA:   'bg-amber-50 text-amber-800 border-amber-200',
  ALTA:    'bg-orange-50 text-orange-800 border-orange-200',
  CRITICA: 'bg-rose-50 text-rose-800 border-rose-200',
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
