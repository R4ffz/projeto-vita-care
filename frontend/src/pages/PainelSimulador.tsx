import { useCallback, useEffect, useState } from 'react';
import {
  Activity, Droplets, Thermometer, AlertOctagon, RotateCcw, Cpu, Info,
  Pause, Play, RefreshCw, Loader2,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { ServiceError } from '@/lib/api';
import { pacientesService, simuladorService } from '@/services';
import type { EstadoSimulado, Paciente, PerfilKey, PerfilSimulado } from '@/types';

const ROTULOS_PERFIL: Record<PerfilKey, string> = {
  jovem_saudavel:    'Jovem saudável',
  hipertenso:        'Hipertenso',
  idoso_fragilizado: 'Idoso fragilizado',
};

const ROTULOS_ESTADO: Record<EstadoSimulado, string> = {
  normal:           'Normal',
  taquicardia:      'Taquicardia',
  baixa_saturacao:  'Baixa saturação',
  febre:            'Febre',
};

const POLLING_MS = 5000;

interface Dados {
  perfis: PerfilSimulado[];
  pacientes: Map<number, Paciente>;
}

async function carregar(): Promise<Dados> {
  // Pacientes do backend pode falhar (backend offline) — não queremos quebrar
  // o painel só por causa disso. Status do simulador é o que importa.
  const [perfis, pacientes] = await Promise.all([
    simuladorService.status(),
    pacientesService.listar().catch(() => [] as Paciente[]),
  ]);
  return { perfis, pacientes: new Map(pacientes.map((p) => [p.id, p])) };
}

export function PainelSimulador() {
  const fetcher = useCallback(carregar, []);
  const { data, loading, error, reload, setData } = useAsync(fetcher, []);

  // Polling leve para refletir mudanças vindas de outro cliente (curl, CLI).
  useEffect(() => {
    const id = setInterval(reload, POLLING_MS);
    return () => clearInterval(id);
  }, [reload]);

  const [acaoEmCurso, setAcaoEmCurso] = useState<Record<string, boolean>>({});
  const [erroAcao, setErroAcao] = useState<ServiceError | null>(null);

  const executar = async (chave: string, acao: () => Promise<void>) => {
    setAcaoEmCurso((m) => ({ ...m, [chave]: true }));
    setErroAcao(null);
    try {
      await acao();
      // Refetch status pra atualizar os cards com o estado real do simulador.
      const novo = await simuladorService.status();
      setData((prev) => ({
        perfis: novo,
        pacientes: prev?.pacientes ?? new Map(),
      }));
    } catch (e) {
      if (e instanceof ServiceError) setErroAcao(e);
      else throw e;
    } finally {
      setAcaoEmCurso((m) => {
        const { [chave]: _, ...rest } = m;
        return rest;
      });
    }
  };

  return (
    <div className="space-y-5">
      <BlocoIntro />

      {erroAcao && <ErrorState error={erroAcao} />}

      {loading && <LoadingState label="Conectando ao simulador…" />}
      {error && (
        <div className="space-y-3">
          <ErrorState error={error} onRetry={reload} />
          <DicaSimuladorOffline />
        </div>
      )}

      {data && data.perfis.length === 0 && (
        <Card><EmptyState titulo="Simulador sem pacientes" /></Card>
      )}

      {data && data.perfis.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.perfis.map((perfil) => (
            <CardPaciente
              key={perfil.id}
              perfil={perfil}
              paciente={data.pacientes.get(perfil.id)}
              acaoEmCurso={acaoEmCurso}
              executar={executar}
            />
          ))}
        </div>
      )}

      <BlocoTecnico />
    </div>
  );
}

interface CardProps {
  perfil: PerfilSimulado;
  paciente: Paciente | undefined;
  acaoEmCurso: Record<string, boolean>;
  executar: (chave: string, acao: () => Promise<void>) => Promise<void>;
}

function CardPaciente({ perfil, paciente, acaoEmCurso, executar }: CardProps) {
  const k = (acao: string) => `${perfil.id}:${acao}`;
  const carregando = (acao: string) => !!acaoEmCurso[k(acao)];
  const qualquerEmCurso = Object.keys(acaoEmCurso)
    .some((key) => key.startsWith(`${perfil.id}:`));

  const set = (estado: EstadoSimulado) => {
    const acao = estado === 'taquicardia'      ? 'taquicardia'
              : estado === 'baixa_saturacao'  ? 'baixaSaturacao'
              : 'febre';
    return () => executar(k(acao), () => {
      if (estado === 'taquicardia')     return simuladorService.taquicardia(perfil.id);
      if (estado === 'baixa_saturacao') return simuladorService.baixaSaturacao(perfil.id);
      return simuladorService.febre(perfil.id);
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle hint={ROTULOS_PERFIL[perfil.perfil]}>
            {paciente?.nome ?? `Paciente #${perfil.id}`}
          </CardTitle>
          <EstadoBadge perfil={perfil} />
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-2">
          <Acao
            icon={Activity}
            label="Taquicardia"
            ativo={perfil.estado === 'taquicardia'}
            carregando={carregando('taquicardia')}
            disabled={qualquerEmCurso || !perfil.publicando}
            onClick={set('taquicardia')}
          />
          <Acao
            icon={Droplets}
            label="Baixa saturação"
            ativo={perfil.estado === 'baixa_saturacao'}
            carregando={carregando('baixaSaturacao')}
            disabled={qualquerEmCurso || !perfil.publicando}
            onClick={set('baixa_saturacao')}
          />
          <Acao
            icon={Thermometer}
            label="Febre"
            ativo={perfil.estado === 'febre'}
            carregando={carregando('febre')}
            disabled={qualquerEmCurso || !perfil.publicando}
            onClick={set('febre')}
          />
          <Acao
            icon={AlertOctagon}
            label="Queda"
            tone="crit"
            carregando={carregando('queda')}
            disabled={qualquerEmCurso}
            onClick={() => executar(k('queda'), () => simuladorService.queda(perfil.id))}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => executar(k('reset'), () => simuladorService.reset(perfil.id))}
            disabled={qualquerEmCurso || perfil.estado === 'normal'}
            className="vita-btn-secondary disabled:opacity-50"
          >
            {carregando('reset')
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RotateCcw className="h-4 w-4" />}
            Resetar
          </button>

          {perfil.publicando ? (
            <button
              onClick={() => executar(k('pausar'), () => simuladorService.pausar(perfil.id))}
              disabled={qualquerEmCurso}
              className="vita-btn-secondary"
            >
              {carregando('pausar')
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Pause className="h-4 w-4" />}
              Pausar sinais
            </button>
          ) : (
            <button
              onClick={() => executar(k('retomar'), () => simuladorService.retomar(perfil.id))}
              disabled={qualquerEmCurso}
              className="vita-btn-primary"
            >
              {carregando('retomar')
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Play className="h-4 w-4" />}
              Retomar
            </button>
          )}
        </div>

        {!perfil.publicando && (
          <p className="mt-3 text-[11px] text-vita-muted">
            Sinais pausados — somente status online continua sendo publicado.
            Estados anormais ficam congelados até retomar.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function Acao({
  icon: Icon, label, onClick, tone, ativo, carregando, disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone?: 'crit';
  ativo?: boolean;
  carregando?: boolean;
  disabled?: boolean;
}) {
  let cls: string;
  if (tone === 'crit') {
    cls = 'border-rose-200 text-rose-700 hover:bg-rose-50';
  } else if (ativo) {
    cls = 'border-vita-primary bg-vita-primary-soft text-vita-primary-strong';
  } else {
    cls = 'border-vita-border text-vita-text hover:bg-vita-bg';
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-2
                  px-3 py-2 rounded-lg text-sm font-medium border transition
                  disabled:opacity-50 disabled:pointer-events-none ${cls}`}
    >
      {carregando
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function EstadoBadge({ perfil }: { perfil: PerfilSimulado }) {
  if (!perfil.publicando) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                       border border-slate-300 bg-slate-100 text-slate-700
                       text-[11px] font-semibold uppercase tracking-wide">
        <Pause className="h-3 w-3" /> Pausado
      </span>
    );
  }
  if (perfil.estado === 'normal') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                       border border-emerald-200 bg-emerald-50 text-emerald-700
                       text-[11px] font-semibold uppercase tracking-wide">
        Normal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                     border border-amber-200 bg-amber-50 text-amber-800
                     text-[11px] font-semibold uppercase tracking-wide">
      {ROTULOS_ESTADO[perfil.estado]}
    </span>
  );
}

function BlocoIntro() {
  return (
    <div className="vita-card px-5 py-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-vita-primary-soft text-vita-primary
                      inline-flex items-center justify-center shrink-0">
        <Cpu className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm">
        <div className="font-medium text-vita-text">
          Controles dos dispositivos IoT virtuais
        </div>
        <p className="text-xs text-vita-muted mt-0.5">
          Tela de demonstração. A camada física foi substituída por um processo
          Node.js que publica MQTT como se fosse um ESP32. Cada ação aqui aciona
          o servidor de controle do simulador em <span className="font-mono">localhost:4000</span>,
          que então publica no broker para o backend processar.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="vita-btn-ghost"
        title="Recarregar status"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  );
}

function BlocoTecnico() {
  return (
    <div className="vita-card px-5 py-4 flex items-start gap-3">
      <Info className="h-4 w-4 mt-0.5 text-vita-primary shrink-0" />
      <div className="text-xs text-vita-muted leading-relaxed space-y-2">
        <div>
          <div className="font-medium text-vita-text mb-1">Fluxo do clique até o dashboard</div>
          Painel → <span className="font-mono">POST /sim/&#123;id&#125;/&lt;evento&gt;</span> no simulador →
          publicação MQTT em <span className="font-mono">pacientes/&#123;id&#125;/&#123;sinais|queda&#125;</span> →
          backend Spring consome via Eclipse Paho → persiste em PostgreSQL →
          avalia regras de alerta → publica em <span className="font-mono">/topic/pacientes/&#123;id&#125;/leituras</span>{' '}
          e <span className="font-mono">/topic/alertas</span> → Dashboard do paciente atualiza em tempo real.
        </div>
        <div className="text-vita-muted/90">
          <span className="font-medium text-vita-text">Dedup:</span> alertas idênticos
          consecutivos para o mesmo paciente são deduplicados em janela de <span className="font-mono">5 minutos</span>.
          Se você disparar o mesmo evento duas vezes seguidas, o segundo não gera novo alerta.
        </div>
      </div>
    </div>
  );
}

function DicaSimuladorOffline() {
  return (
    <div className="vita-card px-5 py-4">
      <div className="text-sm font-medium text-vita-text mb-2">Simulador parece estar fora</div>
      <ol className="text-xs text-vita-muted space-y-1 list-decimal list-inside">
        <li>Em um terminal: <span className="font-mono">cd simulator &amp;&amp; npm start</span></li>
        <li>Confirme que ele subiu o servidor de controle em <span className="font-mono">http://localhost:4000/sim</span></li>
        <li>Use o botão <span className="font-medium">Tentar de novo</span> acima</li>
      </ol>
    </div>
  );
}
