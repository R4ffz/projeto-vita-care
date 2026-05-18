import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse, Droplets, Thermometer, UserPlus, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { SeveridadeBadge } from '@/components/SeveridadeBadge';
import { useAsync } from '@/lib/useAsync';
import { derivarStatus } from '@/lib/status';
import {
  formatarHora, formatarHoraRelativa, rotuloTipoAlerta, saudacao,
} from '@/lib/format';
import { pacientesService, leiturasService, limitesService, alertasService } from '@/services';
import type {
  Alerta, Leitura, LimiteConfig, Paciente, StatusPaciente,
} from '@/types';

// ─── Dados ────────────────────────────────────────────────────────────────────

interface PacienteResumo {
  paciente: Paciente;
  leitura: Leitura | null;
  limites: LimiteConfig | null;
  status: StatusPaciente;
}

interface DadosCentral {
  resumos: PacienteResumo[];
  alertas: Alerta[];
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
  return { resumos, alertas };
}

// ─── Página ───────────────────────────────────────────────────────────────────

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

  const { resumos, alertas } = data;
  const pacientesPorId = new Map(resumos.map(r => [r.paciente.id, r.paciente]));
  const requeremAtencao = resumos.filter(r => r.status === 'critico' || r.status === 'atencao');
  const estaveis = resumos.filter(r => r.status === 'ok' || r.status === 'offline');
  const alertasAtivos = alertas.filter(a => !a.atendido).length;

  return (
    <div className="space-y-8">
      <FaixaClinica
        total={resumos.length}
        criticos={resumos.filter(r => r.status === 'critico').length}
        atencao={resumos.filter(r => r.status === 'atencao').length}
        alertasAtivos={alertasAtivos}
      />

      <SecaoRequerAtencao pacientes={requeremAtencao} />

      <SecaoEstaveis pacientes={estaveis} />

      <SecaoTimeline alertas={alertas.slice(0, 8)} pacientesPorId={pacientesPorId} />
    </div>
  );
}

// ─── Faixa clínica de status (topo) ───────────────────────────────────────────

function FaixaClinica({
  total, criticos, atencao, alertasAtivos,
}: { total: number; criticos: number; atencao: number; alertasAtivos: number }) {
  const tone = criticos > 0 ? 'crit' : atencao > 0 ? 'warn' : 'ok';
  const fundo = {
    crit: 'bg-vita-crit-soft border-vita-crit/20',
    warn: 'bg-vita-warn-soft border-vita-warn/20',
    ok:   'bg-vita-ok-soft border-vita-ok/20',
  }[tone];

  return (
    <section className={`rounded-xl border ${fundo} px-6 sm:px-7 py-5 sm:py-6`}>
      <p className="vita-display italic text-2xl sm:text-[26px] text-vita-text">
        {saudacao()}.
      </p>
      <p className="mt-2 text-sm sm:text-[15px] text-vita-text/80 leading-relaxed">
        <Metric n={total} /> {plural(total, 'paciente', 'pacientes')} em acompanhamento
        <Sep />
        <Metric n={atencao} tone={atencao > 0 ? 'warn' : 'muted'} /> em atenção
        <Sep />
        <Metric n={criticos} tone={criticos > 0 ? 'crit' : 'muted'} /> em estado crítico
        <Sep />
        <Metric n={alertasAtivos} tone={alertasAtivos > 0 ? 'warn' : 'muted'} /> {plural(alertasAtivos, 'alerta pendente', 'alertas pendentes')}
      </p>
    </section>
  );
}

function Metric({ n, tone = 'text' }: { n: number; tone?: 'text' | 'warn' | 'crit' | 'muted' }) {
  const cor = {
    text:   'text-vita-text',
    warn:   'text-vita-warn',
    crit:   'text-vita-crit',
    muted:  'text-vita-muted',
  }[tone];
  return (
    <span className={`font-mono tabular-nums font-semibold ${cor}`}>{n}</span>
  );
}

function Sep() {
  return <span className="text-vita-muted/60 mx-1.5">·</span>;
}

function plural(n: number, sing: string, plur: string): string {
  return n === 1 ? sing : plur;
}

// ─── Seção: requer atenção ────────────────────────────────────────────────────

function SecaoRequerAtencao({ pacientes }: { pacientes: PacienteResumo[] }) {
  return (
    <section>
      <HeaderSecao
        titulo="Requer atenção"
        contador={pacientes.length > 0 ? `${pacientes.length} ${plural(pacientes.length, 'paciente', 'pacientes')}` : null}
      />
      {pacientes.length === 0 ? (
        <div className="vita-card px-5 py-6 flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-vita-ok-soft text-vita-ok
                           inline-flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-medium text-vita-text">
              Nenhum paciente requer atenção no momento.
            </div>
            <div className="text-xs text-vita-muted mt-0.5">
              Todos os sinais vitais dentro dos limites configurados.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pacientes.map(r => <CardAtencao key={r.paciente.id} resumo={r} />)}
        </div>
      )}
    </section>
  );
}

function CardAtencao({ resumo }: { resumo: PacienteResumo }) {
  const navigate = useNavigate();
  const { paciente, leitura, status } = resumo;
  const destino = `/pacientes/${paciente.id}`;
  const fundo = status === 'critico'
    ? 'bg-vita-crit-soft/50 border-vita-crit/30'
    : 'bg-vita-warn-soft/50 border-vita-warn/30';

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => navigate(destino)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(destino); } }}
      className={`rounded-xl border ${fundo} shadow-card hover:shadow-soft
                  cursor-pointer transition group focus:outline-none
                  focus:ring-2 focus:ring-vita-primary/30`}
    >
      <div className="px-5 sm:px-6 py-5 flex flex-col md:flex-row md:items-center gap-5">
        {/* Identificação */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Avatar nome={paciente.nome} size="lg" ring={status} />
          <div className="min-w-0 flex-1">
            <h3 className="vita-display text-lg leading-tight truncate">
              {paciente.nome}
            </h3>
            <p className="text-xs text-vita-muted mt-1">
              {paciente.idade} anos
              <span className="text-vita-muted/60"> · </span>
              <span className="font-mono">#{paciente.id}</span>
              <span className="text-vita-muted/60"> · </span>
              <span>{leitura ? `última leitura ${formatarHoraRelativa(leitura.timestamp)}` : 'sem leitura recente'}</span>
            </p>
          </div>
        </div>

        {/* Sinais vitais */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 md:flex md:items-baseline">
          <SinalDetalhado icon={HeartPulse}  valor={leitura?.bpm ?? null}         unidade="bpm" />
          <SinalDetalhado icon={Droplets}    valor={leitura?.spo2 ?? null}        unidade="%" />
          <SinalDetalhado icon={Thermometer} valor={leitura?.temperatura != null ? Number(leitura.temperatura) : null} unidade="°C" casas={1} />
        </div>

        {/* Ação clínica */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(destino); }}
          className="vita-btn-primary self-stretch md:self-auto md:shrink-0"
        >
          Atender
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function SinalDetalhado({
  icon: Icon, valor, unidade, casas = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  valor: number | null; unidade: string; casas?: number;
}) {
  const v = valor == null
    ? '—'
    : casas === 0 ? Math.round(valor).toString() : valor.toFixed(casas);
  return (
    <div>
      <div className="flex items-center gap-1.5 text-vita-muted">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-wider">{unidade}</span>
      </div>
      <div className="mt-0.5 font-mono text-xl font-semibold text-vita-text tabular-nums">
        {v}
      </div>
    </div>
  );
}

// ─── Seção: estáveis ──────────────────────────────────────────────────────────

function SecaoEstaveis({ pacientes }: { pacientes: PacienteResumo[] }) {
  if (pacientes.length === 0) return null;
  return (
    <section>
      <HeaderSecao
        titulo="Estáveis"
        contador={`${pacientes.length} ${plural(pacientes.length, 'paciente', 'pacientes')}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pacientes.map(r => <CardEstavel key={r.paciente.id} resumo={r} />)}
      </div>
    </section>
  );
}

function CardEstavel({ resumo }: { resumo: PacienteResumo }) {
  const { paciente, leitura, status } = resumo;
  return (
    <Link
      to={`/pacientes/${paciente.id}`}
      className="vita-card hover:shadow-soft transition flex items-center gap-3 px-4 py-3"
    >
      <Avatar nome={paciente.nome} size="md" ring={status} />
      <div className="min-w-0 flex-1">
        <div className="vita-display text-sm truncate leading-tight">{paciente.nome}</div>
        <div className="text-[11px] text-vita-muted mt-0.5">
          {paciente.idade} anos
          <span className="text-vita-muted/60"> · </span>
          <span className="font-mono tabular-nums">{leitura?.bpm ?? '—'} bpm</span>
        </div>
      </div>
      <span className="text-[10px] font-mono text-vita-muted shrink-0">
        {leitura ? formatarHoraRelativa(leitura.timestamp) : '—'}
      </span>
    </Link>
  );
}

// ─── Seção: timeline de atividade ─────────────────────────────────────────────

function SecaoTimeline({
  alertas, pacientesPorId,
}: { alertas: Alerta[]; pacientesPorId: Map<number, Paciente> }) {
  if (alertas.length === 0) return null;
  return (
    <section>
      <HeaderSecao
        titulo="Atividade clínica recente"
        acao={
          <Link to="/alertas" className="text-xs text-vita-primary hover:text-vita-primary-strong
                                          inline-flex items-center gap-1 transition">
            Ver todos os alertas
            <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      <div className="vita-card divide-y divide-vita-border">
        {alertas.map(a => {
          const paciente = pacientesPorId.get(a.pacienteId);
          return (
            <Link
              key={a.id}
              to={`/pacientes/${a.pacienteId}`}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3
                         hover:bg-vita-bg/60 transition"
            >
              <span className="text-[11px] font-mono tabular-nums text-vita-muted
                               w-12 shrink-0">
                {formatarHora(a.timestamp)}
              </span>
              <SeveridadeBadge severidade={a.severidade} />
              <span className="text-sm text-vita-text min-w-0 flex-1 truncate">
                <span className="vita-display">
                  {paciente?.nome ?? `Paciente #${a.pacienteId}`}
                </span>
                <span className="text-vita-muted/70 mx-1.5">·</span>
                <span className="text-vita-muted">{rotuloTipoAlerta(a.tipo)}</span>
              </span>
              {a.atendido && (
                <span className="text-[10px] uppercase tracking-wider text-vita-ok
                                 font-medium shrink-0 hidden sm:inline">
                  atendido
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Header de seção (compartilhado) ──────────────────────────────────────────

function HeaderSecao({
  titulo, contador, acao,
}: { titulo: string; contador?: string | null; acao?: React.ReactNode }) {
  return (
    <header className="flex items-baseline justify-between gap-3 mb-3 px-1">
      <h2 className="vita-display italic text-lg sm:text-xl text-vita-text">
        {titulo}
        {contador && (
          <span className="ml-3 text-xs not-italic font-sans font-normal text-vita-muted">
            {contador}
          </span>
        )}
      </h2>
      {acao}
    </header>
  );
}
