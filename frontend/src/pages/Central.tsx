import { Link } from 'react-router-dom';
import { Heart, Droplets, Thermometer, ChevronRight } from 'lucide-react';
import { pacientesMock, ultimaLeituraMock, statusMock, alertasMock } from '@/lib/mocks';
import { StatusDot } from '@/components/StatusDot';
import type { StatusPaciente } from '@/types';

const ORDEM_GRAVIDADE: Record<StatusPaciente, number> = {
  critico: 0, atencao: 1, ok: 2, offline: 3,
};

export function Central() {
  const pacientes = [...pacientesMock].sort((a, b) =>
    ORDEM_GRAVIDADE[statusMock[a.id] ?? 'offline'] - ORDEM_GRAVIDADE[statusMock[b.id] ?? 'offline'],
  );

  const alertasAtivos = alertasMock.filter(a => !a.atendido);

  return (
    <div className="space-y-6">
      {/* Faixa de métricas resumidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricaResumo titulo="Pacientes monitorados" valor={pacientes.length} />
        <MetricaResumo titulo="Em estado crítico"     valor={pacientes.filter(p => statusMock[p.id] === 'critico').length} tone="crit" />
        <MetricaResumo titulo="Em atenção"            valor={pacientes.filter(p => statusMock[p.id] === 'atencao').length} tone="warn" />
        <MetricaResumo titulo="Alertas em aberto"     valor={alertasAtivos.length} tone="warn" />
      </div>

      {/* Grid de cards por paciente */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pacientes.map(p => {
          const status = statusMock[p.id] ?? 'offline';
          const leitura = ultimaLeituraMock[p.id];
          return (
            <Link
              key={p.id}
              to={`/pacientes/${p.id}`}
              className="vita-card hover:border-vita-primary/40 hover:shadow-md transition group"
            >
              <div className="px-5 py-4 flex items-start justify-between border-b border-vita-border">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-vita-text truncate">{p.nome}</h3>
                  <p className="text-xs text-vita-muted mt-0.5">
                    {p.idade} anos · ID #{p.id}
                  </p>
                </div>
                <StatusDot status={status} />
              </div>

              <div className="px-5 py-4 grid grid-cols-3 gap-3">
                <MiniSinal icon={Heart}      valor={leitura?.bpm}         unidade="bpm" />
                <MiniSinal icon={Droplets}   valor={leitura?.spo2}        unidade="%"   />
                <MiniSinal icon={Thermometer} valor={leitura?.temperatura} unidade="°C" casas={1} />
              </div>

              <div className="px-5 py-3 border-t border-vita-border flex items-center justify-between">
                <span className="text-[11px] text-vita-muted font-mono">
                  última leitura: agora
                </span>
                <span className="text-xs text-vita-primary font-medium inline-flex items-center gap-1
                                  group-hover:gap-1.5 transition-all">
                  Abrir dashboard <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MetricaResumo({
  titulo, valor, tone,
}: { titulo: string; valor: number; tone?: 'crit' | 'warn' }) {
  const cor = tone === 'crit'
    ? 'text-vita-crit'
    : tone === 'warn'
      ? 'text-vita-warn'
      : 'text-vita-text';
  return (
    <div className="vita-card px-4 py-3">
      <div className="text-[11px] font-mono uppercase tracking-wider text-vita-muted">{titulo}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${cor}`}>{valor}</div>
    </div>
  );
}

function MiniSinal({
  icon: Icon, valor, unidade, casas = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  valor?: number | null; unidade: string; casas?: number;
}) {
  const v = valor == null ? '—' : casas === 0 ? Math.round(valor).toString() : valor.toFixed(casas);
  return (
    <div>
      <div className="flex items-center gap-1.5 text-vita-muted">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-mono uppercase tracking-wider">{unidade}</span>
      </div>
      <div className="mt-0.5 font-mono text-lg font-semibold text-vita-text tabular-nums">
        {v}
      </div>
    </div>
  );
}
