import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { historicoMock, pacientesMock } from '@/lib/mocks';
import { formatarHora } from '@/lib/format';

type Periodo = '60min' | '24h' | '7d';

const PERIODOS: Array<{ value: Periodo; label: string; minutos: number }> = [
  { value: '60min', label: 'Últimos 60 min', minutos: 60 },
  { value: '24h',   label: 'Últimas 24 h',  minutos: 60 * 24 },
  { value: '7d',    label: 'Últimos 7 dias', minutos: 60 * 24 * 7 },
];

export function HistoricoGrafico() {
  const [params, setParams] = useSearchParams();
  const pacienteId = Number(params.get('paciente') ?? pacientesMock[0]!.id);
  const periodo = (params.get('periodo') as Periodo) ?? '60min';
  const [periodoLocal, setPeriodoLocal] = useState<Periodo>(periodo);

  const periodoCfg = PERIODOS.find(p => p.value === periodoLocal) ?? PERIODOS[0]!;
  const dados = useMemo(
    () => historicoMock(pacienteId, periodoCfg.minutos).map(l => ({
      tempo: formatarHora(l.timestamp),
      bpm: l.bpm,
      spo2: l.spo2,
      temp: l.temperatura,
    })),
    [pacienteId, periodoCfg.minutos],
  );

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
          <div className="flex-1">
            <label className="vita-label">Paciente</label>
            <select
              value={pacienteId}
              onChange={(e) => setPaciente(Number(e.target.value))}
              className="vita-input"
            >
              {pacientesMock.map(p => (
                <option key={p.id} value={p.id}>{p.nome} (#{p.id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="vita-label">Período</label>
            <div className="inline-flex rounded-lg border border-vita-border bg-white p-1">
              {PERIODOS.map(p => (
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

      <GraficoCard titulo="Frequência cardíaca (bpm)" dataKey="bpm" cor="#0d9488" unidade="bpm" dados={dados} />
      <GraficoCard titulo="Saturação de oxigênio (%)" dataKey="spo2" cor="#0ea5e9" unidade="%" dados={dados} />
      <GraficoCard titulo="Temperatura corporal (°C)" dataKey="temp" cor="#f59e0b" unidade="°C" dados={dados} />
    </div>
  );
}

interface GraficoProps {
  titulo: string;
  dataKey: 'bpm' | 'spo2' | 'temp';
  cor: string;
  unidade: string;
  dados: Array<Record<string, string | number | null>>;
}

function GraficoCard({ titulo, dataKey, cor, unidade, dados }: GraficoProps) {
  return (
    <Card>
      <CardHeader><CardTitle hint={`${dados.length} pontos no período`}>{titulo}</CardTitle></CardHeader>
      <CardBody className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="tempo" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit={` ${unidade}`} width={60} />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#64748b' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={cor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
