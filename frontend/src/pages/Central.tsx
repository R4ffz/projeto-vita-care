import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Droplets, Thermometer, ChevronRight, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
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

const ROTULO_STATUS: Record<StatusPaciente, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  ok:      'Estável',
  offline: 'Offline',
};

const COR_STATUS_TEXTO: Record<StatusPaciente, string> = {
  critico: 'text-vita-crit',
  atencao: 'text-vita-warn',
  ok:      'text-vita-ok',
  offline: 'text-vita-muted',
};

const COR_STATUS_FUNDO: Record<StatusPaciente, string> = {
  critico: 'bg-vita-crit-soft',
  atencao: 'bg-vita-warn-soft',
  ok:      'bg-vita-ok-soft',
  offline: 'bg-vita-bg',
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
      {/* Faixa de métricas — tons da paleta clínica */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metrica titulo="Pacientes monitorados" valor={resumos.length} />
        <Metrica titulo="Em estado crítico"
                 valor={resumos.filter(r => r.status === 'critico').length} tone="crit" />
        <Metrica titulo="Em atenção"
                 valor={resumos.filter(r => r.status === 'atencao').length} tone="warn" />
        <Metrica titulo="Alertas em aberto" valor={alertasAtivos} tone="warn" />
      </div>

      {/* Grid de pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {resumos.map(({ paciente, leitura, status }) => (
          <CardPaciente
            key={paciente.id}
            paciente={paciente}
            leitura={leitura}
            status={status}
          />
        ))}
      </div>
    </div>
  );
}

function CardPaciente({
  paciente, leitura, status,
}: { paciente: Paciente; leitura: Leitura | null; status: StatusPaciente }) {
  return (
    <Link
      to={`/pacientes/${paciente.id}`}
      className="vita-card hover:shadow-soft transition group block"
    >
      {/* Header do paciente — avatar + nome em serif + chip de status */}
      <div className="px-5 py-4 flex items-start gap-3 border-b border-vita-border">
        <Avatar nome={paciente.nome} size="lg" ring={status} />
        <div className="min-w-0 flex-1">
          <h3 className="vita-display text-base leading-tight truncate">{paciente.nome}</h3>
          <p className="text-[11px] text-vita-muted mt-1 font-mono">
            {paciente.idade} anos · #{paciente.id}
          </p>
        </div>
        <span className={`inline-flex items-center text-[10px] font-mono uppercase
                          tracking-[0.18em] px-2 py-1 rounded-md shrink-0
                          ${COR_STATUS_FUNDO[status]} ${COR_STATUS_TEXTO[status]}`}>
          {ROTULO_STATUS[status]}
        </span>
      </div>

      {/* Hierarquia: BPM grande à esquerda + SpO2/Temp empilhados à direita */}
      <div className="px-5 py-4 flex items-start gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-vita-muted">
            <HeartPulse className="h-3.5 w-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Frequência cardíaca</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-semibold text-vita-text tabular-nums">
              {leitura?.bpm ?? '—'}
            </span>
            <span className="text-xs text-vita-muted font-medium">bpm</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <SinalCompacto icon={Droplets}    valor={leitura?.spo2 ?? null}        unidade="%" />
          <SinalCompacto icon={Thermometer} valor={leitura?.temperatura ?? null} unidade="°C" casas={1} />
        </div>
      </div>

      <div className="px-5 py-3 border-t border-vita-border flex items-center justify-between">
        <span className="text-[11px] text-vita-muted font-mono">
          {leitura ? `última leitura ${horaRelativa(leitura.timestamp)}` : 'sem leitura recente'}
        </span>
        <span className="text-xs text-vita-primary font-medium inline-flex items-center gap-1
                          group-hover:gap-1.5 transition-all">
          Abrir dashboard <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function Metrica({
  titulo, valor, tone,
}: { titulo: string; valor: number; tone?: 'crit' | 'warn' }) {
  const cor = tone === 'crit'
    ? 'text-vita-crit'
    : tone === 'warn'
      ? 'text-vita-warn'
      : 'text-vita-text';
  return (
    <div className="vita-card px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-vita-muted">
        {titulo}
      </div>
      <div className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${cor}`}>
        {valor}
      </div>
    </div>
  );
}

function SinalCompacto({
  icon: Icon, valor, unidade, casas = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  valor: number | null; unidade: string; casas?: number;
}) {
  const v = valor == null
    ? '—'
    : casas === 0 ? Math.round(valor).toString() : valor.toFixed(casas);
  return (
    <div className="flex items-center gap-2 min-w-[88px]">
      <Icon className="h-3.5 w-3.5 text-vita-muted shrink-0" />
      <span className="font-mono text-base font-semibold text-vita-text tabular-nums">
        {v}
      </span>
      <span className="text-[11px] text-vita-muted">{unidade}</span>
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
