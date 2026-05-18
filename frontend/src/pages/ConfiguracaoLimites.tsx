import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, Info, Check } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { pacientesService, limitesService } from '@/services';
import { ServiceError } from '@/lib/api';
import type { LimiteConfigRequest } from '@/types';

export function ConfiguracaoLimites() {
  const [params, setParams] = useSearchParams();
  const carregarPacientes = useCallback(() => pacientesService.listar(), []);
  const pacientesQuery = useAsync(carregarPacientes, []);

  const idParam = params.get('paciente');
  const pacientes = pacientesQuery.data ?? [];
  const pacienteIdInicial = idParam ? Number(idParam) : pacientes[0]?.id ?? null;

  // Sincroniza param na URL com a primeira opção quando a lista chega.
  useEffect(() => {
    if (!idParam && pacientes.length > 0) {
      const next = new URLSearchParams(params);
      next.set('paciente', String(pacientes[0]!.id));
      setParams(next, { replace: true });
    }
  }, [idParam, pacientes, params, setParams]);

  return (
    <div className="space-y-5 max-w-3xl">
      <Card>
        <CardBody>
          <label className="vita-label">Paciente</label>
          {pacientesQuery.loading && <LoadingState inline label="Carregando pacientes…" />}
          {pacientesQuery.error && <ErrorState error={pacientesQuery.error} onRetry={pacientesQuery.reload} />}
          {pacientesQuery.data && pacientesQuery.data.length === 0 && (
            <EmptyState titulo="Nenhum paciente cadastrado" />
          )}
          {pacientesQuery.data && pacientesQuery.data.length > 0 && pacienteIdInicial != null && (
            <select
              value={pacienteIdInicial}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                next.set('paciente', e.target.value);
                setParams(next, { replace: true });
              }}
              className="vita-input"
            >
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nome} (#{p.id})</option>
              ))}
            </select>
          )}
        </CardBody>
      </Card>

      {pacienteIdInicial != null && (
        <BlocoLimites pacienteId={pacienteIdInicial} />
      )}
    </div>
  );
}

function BlocoLimites({ pacienteId }: { pacienteId: number }) {
  const fetcher = useCallback(() => limitesService.buscar(pacienteId), [pacienteId]);
  const { data, loading, error, reload, setData } = useAsync(fetcher, [pacienteId]);

  const [form, setForm] = useState<LimiteConfigRequest | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<ServiceError | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        bpmMin: data.bpmMin,
        bpmMax: data.bpmMax,
        spo2Min: data.spo2Min,
        tempMax: Number(data.tempMax),
      });
      setSucesso(false);
      setErroSalvar(null);
    }
  }, [data]);

  if (loading) return <LoadingState label="Carregando limites…" />;
  if (error)   return <ErrorState error={error} onRetry={reload} />;
  if (!data || !form) return null;

  const bpmInvalido = form.bpmMin >= form.bpmMax;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErroSalvar(null);
    setSucesso(false);
    try {
      const atualizado = await limitesService.atualizar(pacienteId, form);
      setData(atualizado);
      setSucesso(true);
    } catch (err) {
      if (err instanceof ServiceError) setErroSalvar(err);
      else throw err;
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle hint="Faixas que disparam alertas automáticos">
          Limites clínicos
        </CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={submit} className="space-y-5">
          {erroSalvar && <ErrorState error={erroSalvar} />}

          <Linha titulo="Frequência cardíaca (bpm)"
                 sub="Faixa normal — fora dela gera bradicardia ou taquicardia.">
            <Numero label="Mínimo" value={form.bpmMin}
                    onChange={(v) => setForm(s => s && ({ ...s, bpmMin: v }))} />
            <Numero label="Máximo" value={form.bpmMax}
                    onChange={(v) => setForm(s => s && ({ ...s, bpmMax: v }))} />
          </Linha>
          {bpmInvalido && (
            <p className="text-xs text-vita-crit">BPM mínimo precisa ser menor que o máximo.</p>
          )}

          <Linha titulo="Saturação SpO₂ (%)" sub="Abaixo deste valor, gera alerta de saturação baixa.">
            <Numero label="Mínimo" value={form.spo2Min} max={100}
                    onChange={(v) => setForm(s => s && ({ ...s, spo2Min: v }))} />
          </Linha>

          <Linha titulo="Temperatura (°C)" sub="Acima deste valor, gera alerta de febre.">
            <Numero label="Máximo" value={form.tempMax} step={0.1}
                    onChange={(v) => setForm(s => s && ({ ...s, tempMax: v }))} />
          </Linha>

          <div className="flex items-start gap-2 text-xs text-vita-muted bg-vita-bg
                          border border-vita-border rounded-lg px-3 py-2.5">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-vita-primary" />
            <span>
              Valores padrão recomendados (clínicos genéricos para idosos):
              BPM 50–100, SpO₂ ≥ 92, temperatura ≤ 37,8 °C.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {sucesso && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                <Check className="h-4 w-4" /> Limites salvos.
              </span>
            )}
            <button type="submit" className="vita-btn-primary" disabled={bpmInvalido || salvando}>
              <Save className="h-4 w-4" />
              {salvando ? 'Salvando…' : 'Salvar limites'}
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function Linha({
  titulo, sub, children,
}: { titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
      <div>
        <div className="text-sm font-medium text-vita-text">{titulo}</div>
        <div className="text-xs text-vita-muted mt-0.5">{sub}</div>
      </div>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

function Numero({
  label, value, onChange, step = 1, max,
}: { label: string; value: number; onChange: (v: number) => void; step?: number; max?: number }) {
  return (
    <div>
      <label className="vita-label">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="vita-input w-28 font-mono tabular-nums"
      />
    </div>
  );
}
