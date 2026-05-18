import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Info } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { leiturasService, limitesService, pacientesService } from '@/services';
import { formatarHora } from '@/lib/format';
import type { LimiteConfig } from '@/types';

type Periodo = '60min' | '24h' | '7d';

/** Backend limita histórico a 1440 min (24h) por requisição. */
const MAX_MINUTOS_BACKEND = 1440;

const PERIODOS: Array<{ value: Periodo; label: string; minutos: number }> = [
  { value: '60min', label: 'Últimos 60 min', minutos: 60 },
  { value: '24h',   label: 'Últimas 24 h',  minutos: 60 * 24 },
  { value: '7d',    label: 'Últimos 7 dias', minutos: 60 * 24 * 7 },
];

interface PontoGrafico {
  tempo: string;
  bpm: number | null;
  spo2: number | null;
  temp: number | null;
}

interface DadosHistorico {
  pontos: PontoGrafico[];
  totalRetornado: number;
  capadoBackend: boolean;
}

export function HistoricoGrafico() {
  const [params, setParams] = useSearchParams();

  // Lista de pacientes para o dropdown.
  const fetchPacientes = useCallback(() => pacientesService.listar(), []);
  const pacientesQuery = useAsync(fetchPacientes, []);
  const pacientes = pacientesQuery.data ?? [];

  const idParam = params.get('paciente');
  const pacienteId = idParam ? Number(idParam) : pacientes[0]?.id ?? null;
  const periodo = (params.get('periodo') as Periodo) ?? '60min';
  const [periodoLocal, setPeriodoLocal] = useState<Periodo>(periodo);
  const periodoCfg = PERIODOS.find((p) => p.value === periodoLocal) ?? PERIODOS[0]!;

  // Cap no limite do backend, sem "inventar regra complexa".
  const minutosEfetivos = Math.min(periodoCfg.minutos, MAX_MINUTOS_BACKEND);
  const capadoBackend = periodoCfg.minutos > MAX_MINUTOS_BACKEND;

  // Carrega leituras + limites em paralelo. Refetch quando paciente/período muda.
  const fetchDados = useCallback(async (): Promise<{ historico: DadosHistorico; limites: LimiteConfig | null }> => {
    if (pacienteId == null) {
      return { historico: { pontos: [], totalRetornado: 0, capadoBackend }, limites: null };
    }
    const [leituras, limites] = await Promise.all([
      leiturasService.historico(pacienteId, minutosEfetivos),
      limitesService.buscar(pacienteId).catch(() => null),
    ]);
    return {
      historico: {
        pontos: leituras.map((l) => ({
          tempo: formatarHora(l.timestamp),
          bpm: l.bpm,
          spo2: l.spo2,
          temp: l.temperatura != null ? Number(l.temperatura) : null,
        })),
        totalRetornado: leituras.length,
        capadoBackend,
      },
      limites,
    };
  }, [pacienteId, minutosEfetivos, capadoBackend]);

  const dadosQuery = useAsync(fetchDados, [pacienteId, minutosEfetivos]);

  const setPaciente = (id: number) => {
    const next = new URLSearchParams(params);
    next.set('paciente', String(id));
    setParams(next, { replace: true });
  };

  const setPeriodo = (p: Periodo) => {
    setPeriodoLocal(p);
    const next = new URLSearchParams(params);
    next.set('periodo', p);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 min-w-0">
            <label className="vita-label">Paciente</label>
            {pacientesQuery.loading && <LoadingState inline label="Carregando pacientes…" />}
            {pacientesQuery.error && (
              <ErrorState error={pacientesQuery.error} onRetry={pacientesQuery.reload} compact />
            )}
            {pacientes.length > 0 && pacienteId != null && (
              <select
                value={pacienteId}
                onChange={(e) => setPaciente(Number(e.target.value))}
                className="vita-input"
              >
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} (#{p.id})</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="vita-label">Período</label>
            <div className="inline-flex rounded-lg border border-vita-border bg-white p-1">
              {PERIODOS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodo(p.value)}
                  className={[
                    'px-3 py-1.5 rounded-md text-xs font-medium transition',
                    p.value === periodoLocal
                      ? 'bg-vita-primary text-white'
                      : 'text-vita-muted hover:text-vita-text hover:bg-vita-bg',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {pacientes.length === 0 && !pacientesQuery.loading && (
        <Card><EmptyState titulo="Nenhum paciente cadastrado" /></Card>
      )}

      {pacienteId != null && (
        <Conteudo
          loading={dadosQuery.loading}
          error={dadosQuery.error}
          onRetry={dadosQuery.reload}
          historico={dadosQuery.data?.historico ?? null}
          limites={dadosQuery.data?.limites ?? null}
        />
      )}
    </div>
  );
}

interface ConteudoProps {
  loading: boolean;
  error: ReturnType<typeof useAsync>['error'];
  onRetry: () => void;
  historico: DadosHistorico | null;
  limites: LimiteConfig | null;
}

function Conteudo({ loading, error, onRetry, historico, limites }: ConteudoProps) {
  if (loading) return <LoadingState label="Carregando histórico…" />;
  if (error)   return <ErrorState error={error} onRetry={onRetry} />;
  if (!historico) return null;

  const { pontos, totalRetornado, capadoBackend } = historico;

  if (totalRetornado === 0) {
    return (
      <Card>
        <EmptyState
          titulo="Sem leituras no período selecionado"
          descricao="Verifique se o simulador está rodando e publicando para este paciente."
        />
        {capadoBackend && <NotaCap />}
      </Card>
    );
  }

  return (
    <>
      {capadoBackend && <NotaCap />}
      <GraficoCard
        titulo="Frequência cardíaca"
        unidade="bpm"
        dataKey="bpm"
        cor="#0d9488"
        pontos={pontos}
        totalRetornado={totalRetornado}
        refMin={limites?.bpmMin ?? null}
        refMax={limites?.bpmMax ?? null}
      />
      <GraficoCard
        titulo="Saturação de oxigênio"
        unidade="%"
        dataKey="spo2"
        cor="#0ea5e9"
        pontos={pontos}
        totalRetornado={totalRetornado}
        refMin={limites?.spo2Min ?? null}
        refMax={null}
      />
      <GraficoCard
        titulo="Temperatura corporal"
        unidade="°C"
        dataKey="temp"
        cor="#f59e0b"
        pontos={pontos}
        totalRetornado={totalRetornado}
        refMin={null}
        refMax={limites ? Number(limites.tempMax) : null}
      />
    </>
  );
}

function NotaCap() {
  return (
    <div className="flex items-start gap-2 text-[11px] text-vita-muted bg-vita-bg
                    border border-vita-border rounded-lg px-3 py-2">
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-vita-primary" />
      <span>
        Backend retorna no máximo <span className="font-mono">1440 min</span> (24h) por
        requisição. Para 7 dias o gráfico mostra as últimas 24h.
      </span>
    </div>
  );
}

interface GraficoProps {
  titulo: string;
  unidade: string;
  dataKey: 'bpm' | 'spo2' | 'temp';
  cor: string;
  pontos: PontoGrafico[];
  totalRetornado: number;
  refMin: number | null;
  refMax: number | null;
}

function GraficoCard({
  titulo, unidade, dataKey, cor, pontos, totalRetornado, refMin, refMax,
}: GraficoProps) {
  const dominio = useMemo<[number | 'auto', number | 'auto']>(() => {
    const valores = pontos.map((p) => p[dataKey]).filter((v): v is number => v != null);
    if (valores.length === 0) return ['auto', 'auto'];
    const min = Math.min(...valores, refMin ?? Number.POSITIVE_INFINITY);
    const max = Math.max(...valores, refMax ?? Number.NEGATIVE_INFINITY);
    const folga = dataKey === 'temp' ? 0.3 : 5;
    return [Math.floor(min - folga), Math.ceil(max + folga)];
  }, [pontos, dataKey, refMin, refMax]);

  return (
    <Card>
      <CardHeader>
        <CardTitle hint={`${totalRetornado} pontos no período`}>{titulo}</CardTitle>
      </CardHeader>
      <CardBody className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pontos} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="tempo" stroke="#64748b" tick={{ fontSize: 11 }}
              minTickGap={32}
            />
            <YAxis
              stroke="#64748b" tick={{ fontSize: 11 }}
              unit={` ${unidade}`} width={64}
              domain={dominio}
              allowDecimals={dataKey === 'temp'}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#64748b' }}
              formatter={(v) => [`${v} ${unidade}`, titulo]}
            />
            {refMin != null && (
              <ReferenceLine y={refMin} stroke="#f43f5e" strokeDasharray="4 4"
                             label={{ value: `mín ${refMin}`, position: 'insideTopLeft',
                                      fill: '#f43f5e', fontSize: 10 }} />
            )}
            {refMax != null && (
              <ReferenceLine y={refMax} stroke="#f43f5e" strokeDasharray="4 4"
                             label={{ value: `máx ${refMax}`, position: 'insideBottomLeft',
                                      fill: '#f43f5e', fontSize: 10 }} />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={cor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
