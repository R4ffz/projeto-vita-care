import type { ComponentType } from 'react';
import type { StatusPaciente } from '@/types';

interface Props {
  label: string;
  unidade: string;
  valor: number | null;
  faixa?: string;
  status?: StatusPaciente;
  icon?: ComponentType<{ className?: string }>;
  /** quantidade de casas decimais a exibir no valor */
  casas?: number;
}

const BORDA_STATUS: Record<StatusPaciente, string> = {
  ok:      'border-l-vita-ok',
  atencao: 'border-l-vita-warn',
  critico: 'border-l-vita-crit',
  offline: 'border-l-vita-muted',
};

export function SinalCard({
  label, unidade, valor, faixa, status = 'ok', icon: Icon, casas = 0,
}: Props) {
  const valorTexto = valor == null
    ? '—'
    : casas === 0 ? Math.round(valor).toString() : valor.toFixed(casas);

  return (
    <div className={`vita-card border-l-4 ${BORDA_STATUS[status]}`}>
      <div className="px-5 py-4 flex items-start justify-between">
        <div className="flex items-center gap-2 text-vita-muted">
          {Icon && <Icon className="h-4 w-4" />}
          <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-4xl font-semibold text-vita-text tabular-nums">
            {valorTexto}
          </span>
          <span className="text-sm text-vita-muted font-medium">{unidade}</span>
        </div>
        {faixa && (
          <div className="mt-1 text-[11px] text-vita-muted font-mono">{faixa}</div>
        )}
      </div>
    </div>
  );
}
