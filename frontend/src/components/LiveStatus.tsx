import type { EstadoConexao } from '@/lib/useDashboardRealtime';

interface Props {
  estado: EstadoConexao;
}

const CFG: Record<EstadoConexao, { rotulo: string; dot: string; pulse: boolean; text: string }> = {
  connected:    { rotulo: 'ao vivo',     dot: 'bg-emerald-500', pulse: true,  text: 'text-emerald-700' },
  connecting:   { rotulo: 'conectando…', dot: 'bg-amber-500',   pulse: true,  text: 'text-amber-700'   },
  disconnected: { rotulo: 'desconectado',dot: 'bg-slate-400',   pulse: false, text: 'text-vita-muted'  },
  error:        { rotulo: 'sem conexão', dot: 'bg-rose-500',    pulse: false, text: 'text-rose-700'    },
};

export function LiveStatus({ estado }: Props) {
  const cfg = CFG[estado];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider">
      <span className="relative inline-flex h-2 w-2">
        {cfg.pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60 animate-ping`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
      </span>
      <span className={cfg.text}>{cfg.rotulo}</span>
    </span>
  );
}
