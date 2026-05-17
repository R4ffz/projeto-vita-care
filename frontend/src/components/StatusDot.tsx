import type { StatusPaciente } from '@/types';

interface Props {
  status: StatusPaciente;
  size?: 'sm' | 'md';
  label?: boolean;
}

const ROTULO: Record<StatusPaciente, string> = {
  ok:       'Estável',
  atencao:  'Atenção',
  critico:  'Crítico',
  offline:  'Offline',
};

const COR_FUNDO: Record<StatusPaciente, string> = {
  ok:       'bg-vita-ok',
  atencao:  'bg-vita-warn',
  critico:  'bg-vita-crit',
  offline:  'bg-vita-muted',
};

const COR_TEXTO: Record<StatusPaciente, string> = {
  ok:       'text-emerald-700',
  atencao:  'text-amber-700',
  critico:  'text-rose-700',
  offline:  'text-vita-muted',
};

export function StatusDot({ status, size = 'md', label = true }: Props) {
  const dim = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  const pulse = status === 'critico';
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`relative inline-flex ${dim}`}>
        {pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${COR_FUNDO[status]} opacity-60 animate-ping`} />
        )}
        <span className={`relative inline-flex ${dim} rounded-full ${COR_FUNDO[status]}`} />
      </span>
      {label && (
        <span className={`text-xs font-medium ${COR_TEXTO[status]}`}>
          {ROTULO[status]}
        </span>
      )}
    </span>
  );
}
