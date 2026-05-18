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
import { Sparkline } from '@/components/Sparkline';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/auth/AuthContext';
import { temPermissao } from '@/auth/permissoes';
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
  serieBpm: number[];        // últimos BPMs para sparkline
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
      const [historico, limites] = await Promise.all([
        leiturasService.historico(paciente.id, 5).catch((): Leitura[] => []),
        limitesService.buscar(paciente.id).catch(() => null),
      ]);
      const leitura = historico.length ? historico[historico.length - 1]! : null;
      const serieBpm = historico
        .slice(-24)
        .map(l => l.bpm)
        .filter((v): v is number => v != null);
      return {
        paciente,
        leitura,
        serieBpm,
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
  const { usuario } = useAuth();
  const podeCriarPaciente = temPermissao(usuario, 'paciente.criar');

  if (loading) return <LoadingState label="Carregando central de monitoramento…" />;
  if (error)   return <ErrorState error={error} onRetry={reload} />;
  if (!data || data.resumos.length === 0) {
    return (
      <Card>
        <EmptyState
          titulo="Nenhum paciente cadastrado"
          descricao={podeCriarPaciente
            ? 'Comece cadastrando um paciente para iniciar o monitoramento.'
            : 'Aguarde um profissional cadastrar pacientes para acompanhar.'}
          acao={podeCriarPaciente ? (
            <Link to="/pacientes/novo" className="vita-btn-primary">
              <UserPlus className="h-4 w-4" /> Cadastrar paciente
            </Link>
          ) : undefined}
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
    <div className="space-y-10">
      <CabecalhoClinico
        total={resumos.length}
        criticos={resumos.filter(r => r.status === 'critico').length}
        atencao={resumos.filter(r => r.status === 'atencao').length}
        alertasAtivos={alertasAtivos}
        ultimaLeitura={resumos[0]?.leitura?.timestamp ?? null}
      />

      <SecaoRequerAtencao pacientes={requeremAtencao} />

      <SecaoEstaveis pacientes={estaveis} />

      <SecaoTimeline alertas={alertas.slice(0, 8)} pacientesPorId={pacientesPorId} />
    </div>
  );
}

// ─── Cabeçalho clínico ────────────────────────────────────────────────────────

function CabecalhoClinico({
  total, criticos, atencao, alertasAtivos, ultimaLeitura,
}: {
  total: number; criticos: number; atencao: number;
  alertasAtivos: number; ultimaLeitura: string | null;
}) {
  const { usuario } = useAuth();
  const tone: 'ok' | 'warn' | 'crit' = criticos > 0 ? 'crit' : atencao > 0 ? 'warn' : 'ok';

  const fundo = {
    crit: 'bg-vita-crit-soft border-vita-crit/40',
    warn: 'bg-vita-warn-soft border-vita-warn/40',
    ok:   'bg-vita-primary-soft border-vita-primary/30',
  }[tone];

  const dataExt = (() => {
    const fmt = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
    return fmt.charAt(0).toUpperCase() + fmt.slice(1);
  })();

  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';

  const resumoClinico = (() => {
    if (criticos > 0) {
      return (
        <>
          <strong className="text-vita-crit font-medium">{criticos}</strong>{' '}
          {plural(criticos, 'paciente em estado crítico', 'pacientes em estado crítico')}
          {atencao > 0 && (
            <> · <strong className="text-vita-warn font-medium">{atencao}</strong> em atenção</>
          )}
          {' '}entre os <strong className="font-medium text-vita-text">{total}</strong>{' '}
          em acompanhamento.
        </>
      );
    }
    if (atencao > 0) {
      return (
        <>
          <strong className="text-vita-warn font-medium">{atencao}</strong>{' '}
          {plural(atencao, 'paciente requer atenção', 'pacientes requerem atenção')}
          {' '}entre os <strong className="font-medium text-vita-text">{total}</strong>{' '}
          em acompanhamento.
        </>
      );
    }
    return (
      <>
        <strong className="font-medium text-vita-text">{total}</strong>{' '}
        {plural(total, 'paciente sob acompanhamento', 'pacientes sob acompanhamento')}
        , todos com sinais vitais dentro dos limites configurados.
      </>
    );
  })();

  return (
    <section className={`rounded-2xl border ${fundo} px-6 sm:px-8 py-6 sm:py-7`}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-[26px] sm:text-[30px] leading-tight tracking-tight text-vita-text">
            {saudacao()}{primeiroNome && <>, <span className="italic">{primeiroNome}</span></>}.
          </h2>
          <p className="text-[13px] text-vita-muted mt-1">
            {dataExt}
          </p>
        </div>
        <div className="text-[12px] text-vita-muted flex items-center gap-2 sm:justify-end">
          <span className="vita-pulse-dot text-vita-ok" />
          <span>
            {ultimaLeitura
              ? <>Última leitura {formatarHoraRelativa(ultimaLeitura)}</>
              : 'Aguardando primeira leitura'}
          </span>
        </div>
      </div>

      <p className="mt-4 text-[15px] sm:text-base text-vita-text/85 leading-relaxed max-w-3xl">
        {resumoClinico}
        {alertasAtivos > 0 && (
          <>
            {' '}Há <strong className="text-vita-warn font-medium">{alertasAtivos}</strong>{' '}
            {plural(alertasAtivos, 'alerta pendente', 'alertas pendentes')} de atendimento.
          </>
        )}
      </p>
    </section>
  );
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
        <div className="rounded-2xl border border-vita-border bg-vita-surface
                        px-5 py-5 flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-vita-ok-soft text-vita-ok
                           inline-flex items-center justify-center shrink-0
                           ring-1 ring-vita-ok/40">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[14px] font-medium text-vita-text">
              Nenhum paciente requer atenção no momento.
            </div>
            <div className="text-[12.5px] text-vita-muted mt-0.5">
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
    ? 'bg-vita-crit-soft border-vita-crit/40'
    : 'bg-vita-warn-soft border-vita-warn/40';

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => navigate(destino)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(destino); } }}
      className={`rounded-2xl border ${fundo} shadow-card hover:shadow-soft
                  cursor-pointer transition group focus:outline-none
                  focus:ring-2 focus:ring-vita-primary/30`}
    >
      <div className="px-5 sm:px-6 py-5 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Avatar nome={paciente.nome} size="lg" ring={status} />
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[18px] leading-tight truncate text-vita-text font-medium">
              {paciente.nome}
            </h3>
            <p className="text-[12.5px] text-vita-muted mt-1.5">
              {paciente.idade} anos
              <span className="text-vita-muted/60"> · </span>
              <span className="font-mono">#{paciente.id}</span>
              <span className="text-vita-muted/60"> · </span>
              <span>{leitura ? `última leitura ${formatarHoraRelativa(leitura.timestamp)}` : 'sem leitura recente'}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-6 md:flex md:items-baseline">
          <SinalDetalhado icon={HeartPulse}  valor={leitura?.bpm ?? null}         unidade="bpm" />
          <SinalDetalhado icon={Droplets}    valor={leitura?.spo2 ?? null}        unidade="%" />
          <SinalDetalhado icon={Thermometer} valor={leitura?.temperatura != null ? Number(leitura.temperatura) : null} unidade="°C" casas={1} />
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(destino); }}
          className="vita-btn-primary self-stretch md:self-auto md:shrink-0"
        >
          Ver paciente
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
        <span className="text-[10px] font-mono uppercase tracking-[0.14em]">{unidade}</span>
      </div>
      <div className="mt-1 font-mono vita-num text-2xl font-semibold text-vita-text">
        {v}
      </div>
    </div>
  );
}

// ─── Seção: em monitoramento estável ──────────────────────────────────────────

function SecaoEstaveis({ pacientes }: { pacientes: PacienteResumo[] }) {
  if (pacientes.length === 0) return null;
  return (
    <section>
      <HeaderSecao
        titulo="Em monitoramento estável"
        contador={`${pacientes.length} ${plural(pacientes.length, 'paciente', 'pacientes')}`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pacientes.map(r => <CardEstavel key={r.paciente.id} resumo={r} />)}
      </div>
    </section>
  );
}

function CardEstavel({ resumo }: { resumo: PacienteResumo }) {
  const { paciente, leitura, status, serieBpm } = resumo;

  return (
    <Link
      to={`/pacientes/${paciente.id}`}
      className="group rounded-2xl border border-vita-border bg-vita-surface
                 hover:border-vita-primary/40 hover:shadow-glow transition
                 px-5 py-5 flex flex-col gap-4"
    >
      {/* Cabeçalho: avatar + identificação + horário */}
      <div className="flex items-start gap-3">
        <Avatar nome={paciente.nome} size="md" ring={status} />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-[16px] truncate leading-tight text-vita-text font-medium">
            {paciente.nome}
          </div>
          <div className="text-[11.5px] text-vita-muted mt-0.5">
            {paciente.idade} anos
            <span className="text-vita-muted/50"> · </span>
            <span className="font-mono">#{paciente.id}</span>
          </div>
        </div>
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-vita-ok/80 shrink-0 mt-1">
          {leitura ? formatarHoraRelativa(leitura.timestamp) : '—'}
        </span>
      </div>

      {/* ECG vivo + sparkline neon — sensação de monitor cardíaco */}
      <div className="rounded-lg bg-vita-bg/50 px-3 py-2 text-vita-ok flex items-center justify-between gap-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-vita-muted">
          BPM trend
        </span>
        <span className="text-vita-ok flex-1 flex justify-end">
          <Sparkline valores={serieBpm} width={120} height={26} strokeWidth={1.5} />
        </span>
      </div>

      {/* Linha de sinais vitais clínicos — números grandes em mono */}
      <div className="grid grid-cols-3 gap-2">
        <SinalCompacto icon={HeartPulse} valor={leitura?.bpm ?? null} unidade="BPM" />
        <SinalCompacto icon={Droplets} valor={leitura?.spo2 ?? null} unidade="SpO₂" sufixo="%" />
        <SinalCompacto
          icon={Thermometer}
          valor={leitura?.temperatura != null ? Number(leitura.temperatura) : null}
          unidade="TEMP"
          sufixo="°C"
          casas={1}
        />
      </div>
    </Link>
  );
}

function SinalCompacto({
  icon: Icon, valor, unidade, casas = 0, sufixo = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  valor: number | null; unidade: string; casas?: number; sufixo?: string;
}) {
  const v = valor == null
    ? '—'
    : casas === 0 ? Math.round(valor).toString() : valor.toFixed(casas);
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-vita-muted">
        <Icon className="h-3 w-3" />
        <span className="text-[9.5px] font-mono uppercase tracking-[0.12em]">{unidade}</span>
      </div>
      <div className="font-mono vita-num text-[22px] font-semibold text-vita-text leading-tight mt-1">
        {v}
        {sufixo && <span className="text-[12px] text-vita-muted ml-0.5">{sufixo}</span>}
      </div>
    </div>
  );
}

// ─── Seção: atividade clínica ─────────────────────────────────────────────────

function SecaoTimeline({
  alertas, pacientesPorId,
}: { alertas: Alerta[]; pacientesPorId: Map<number, Paciente> }) {
  if (alertas.length === 0) return null;
  return (
    <section>
      <HeaderSecao
        titulo="Atividade clínica recente"
        acao={
          <Link to="/alertas" className="text-[13px] text-vita-primary hover:text-vita-primary-strong
                                          inline-flex items-center gap-1 transition font-medium">
            Ver todos os alertas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="rounded-2xl border border-vita-border bg-vita-surface
                      divide-y divide-vita-border">
        {alertas.map(a => {
          const paciente = pacientesPorId.get(a.pacienteId);
          return (
            <Link
              key={a.id}
              to={`/pacientes/${a.pacienteId}`}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5
                         hover:bg-vita-surface-elev transition"
            >
              <span className="text-[11.5px] font-mono tabular-nums text-vita-muted
                               w-12 shrink-0">
                {formatarHora(a.timestamp)}
              </span>
              <SeveridadeBadge severidade={a.severidade} />
              <span className="text-[14px] text-vita-text min-w-0 flex-1 truncate">
                <span className="font-serif font-medium">
                  {paciente?.nome ?? `Paciente #${a.pacienteId}`}
                </span>
                <span className="text-vita-muted/60 mx-1.5">·</span>
                <span className="text-vita-muted">{rotuloTipoAlerta(a.tipo)}</span>
              </span>
              {a.atendido && (
                <span className="text-[10.5px] uppercase tracking-wider text-vita-ok
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
    <header className="flex items-baseline justify-between gap-3 mb-4 px-1">
      <h2 className="font-serif text-[19px] sm:text-[20px] text-vita-text font-medium tracking-tight">
        {titulo}
        {contador && (
          <span className="ml-3 text-[12.5px] font-sans font-normal text-vita-muted">
            {contador}
          </span>
        )}
      </h2>
      {acao}
    </header>
  );
}
