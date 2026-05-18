import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Droplets, Thermometer, ChevronRight, UserPlus } from 'lucide-react';
import { Card } from '@/components/Card';
import { StatusDot } from '@/components/StatusDot';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { derivarStatus } from '@/lib/status';
import { pacientesService, leiturasService, limitesService, alertasService } from '@/services';
import type { Leitura, LimiteConfig, Paciente, StatusPaciente } from '@/types';

interface PacienteResumo {
  paciente: Paciente;
  leitura: Leitura | null;
  limites: LimiteConfig | null;
  status: StatusPaciente;
}

interface DadosCentral {
  resumos: PacienteResumo[];
  alertasAtivos: number;
}

const ORDEM_GRAVIDADE: Record<StatusPaciente, number> = {
  critico: 0, atencao: 1, ok: 2, offline: 3,
};

async function carregarCentral(): Promise<DadosCentral> {
  const [pacientes, alertas] = await Promise.all([
    pacientesService.listar(),
    alertasService.listarTodos(),
  ]);

  const resumos = await Promise.all(
    pacientes.map(async (paciente): Promise<PacienteResumo> => {
      const [leitura, limites] = await Promise.all([
        leiturasService.ultima(paciente.id, 5).catch(() => null),
        limitesService.buscar(paciente.id).catch(() => null),
      ]);
      return {
        paciente,
        leitura,
        limites,
        status: derivarStatus(leitura, limites),
      };
    }),
  );

  resumos.sort((a, b) => ORDEM_GRAVIDADE[a.status] - ORDEM_GRAVIDADE[b.status]);

  return {
    resumos,
    alertasAtivos: alertas.filter((a) => !a.atendido).length,
  };
}

export function Central() {
  const fetcher = useCallback(carregarCentral, []);
  const { data, loading, error, reload } = useAsync(fetcher, []);

  if (loading) return <LoadingState label="Carregando central de monitoramento…" />;
  if (error)   return <ErrorState error={error} onRetry={reload} />;
  if (!data || data.resumos.length === 0) {
    return (
      <Card>
        <EmptyState
          titulo="Nenhum paciente cadastrado"
          descricao="Comece cadastrando um paciente para iniciar o monitoramento."
          acao={
            <Link to="/pacientes/novo" className="vita-btn-primary">
              <UserPlus className="h-4 w-4" /> Cadastrar paciente
            </Link>
          }
        />
      </Card>
    );
  }

  const { resumos, alertasAtivos } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricaResumo titulo="Pacientes monitorados" valor={resumos.length} />
        <MetricaResumo titulo="Em estado crítico"
                       valor={resumos.filter(r => r.status === 'critico').length}
                       tone="crit" />
        <MetricaResumo titulo="Em atenção"
                       valor={resumos.filter(r => r.status === 'atencao').length}
                       tone="warn" />
        <MetricaResumo titulo="Alertas em aberto" valor={alertasAtivos} tone="warn" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {resumos.map(({ paciente, leitura, status }) => (
          <Link
            key={paciente.id}
            to={`/pacientes/${paciente.id}`}
            className="vita-card hover:border-vita-primary/40 hover:shadow-md transition group"
          >
            <div className="px-5 py-4 flex items-start justify-between border-b border-vita-border">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-vita-text truncate">{paciente.nome}</h3>
                <p className="text-xs text-vita-muted mt-0.5">
                  {paciente.idade} anos · ID #{paciente.id}
                </p>
              </div>
              <StatusDot status={status} />
            </div>

            <div className="px-5 py-4 grid grid-cols-3 gap-3">
              <MiniSinal icon={Heart}       valor={leitura?.bpm ?? null}         unidade="bpm" />
              <MiniSinal icon={Droplets}    valor={leitura?.spo2 ?? null}        unidade="%"   />
              <MiniSinal icon={Thermometer} valor={leitura?.temperatura ?? null} unidade="°C" casas={1} />
            </div>

            <div className="px-5 py-3 border-t border-vita-border flex items-center justify-between">
              <span className="text-[11px] text-vita-muted font-mono">
                {leitura ? `última leitura: ${horaRelativa(leitura.timestamp)}` : 'sem leitura recente'}
              </span>
              <span className="text-xs text-vita-primary font-medium inline-flex items-center gap-1
                                group-hover:gap-1.5 transition-all">
                Abrir dashboard <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
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
  valor: number | null; unidade: string; casas?: number;
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

function horaRelativa(iso: string): string {
  const seg = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 5)  return 'agora';
  if (seg < 60) return `${seg}s atrás`;
  const min = Math.round(seg / 60);
  if (min < 60) return `${min} min atrás`;
  return `${Math.round(min / 60)}h atrás`;
}
