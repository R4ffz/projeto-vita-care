import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, Info } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { pacientesMock, limitesMock } from '@/lib/mocks';

export function ConfiguracaoLimites() {
  const [params, setParams] = useSearchParams();
  const pacienteId = Number(params.get('paciente') ?? pacientesMock[0]!.id);
  const base = limitesMock[pacienteId];

  const [form, setForm] = useState({
    bpmMin: base?.bpmMin ?? 50,
    bpmMax: base?.bpmMax ?? 100,
    spo2Min: base?.spo2Min ?? 92,
    tempMax: base?.tempMax ?? 37.8,
  });

  useEffect(() => {
    const novo = limitesMock[pacienteId];
    if (novo) {
      setForm({
        bpmMin: novo.bpmMin, bpmMax: novo.bpmMax,
        spo2Min: novo.spo2Min, tempMax: novo.tempMax,
      });
    }
  }, [pacienteId]);

  const trocar = (id: number) => {
    const next = new URLSearchParams(params);
    next.set('paciente', String(id));
    setParams(next, { replace: true });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    alert('Limites validados localmente. Persistência entra no Prompt 12.');
  };

  const bpmInvalido = form.bpmMin >= form.bpmMax;

  return (
    <div className="space-y-5 max-w-3xl">
      <Card>
        <CardBody>
          <label className="vita-label">Paciente</label>
          <select
            value={pacienteId}
            onChange={(e) => trocar(Number(e.target.value))}
            className="vita-input"
          >
            {pacientesMock.map(p => (
              <option key={p.id} value={p.id}>{p.nome} (#{p.id})</option>
            ))}
          </select>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle hint="Faixas que disparam alertas automáticos">
            Limites clínicos
          </CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={submit} className="space-y-5">
            <Linha titulo="Frequência cardíaca (bpm)" sub="Faixa normal — fora dela gera bradicardia ou taquicardia.">
              <Numero
                label="Mínimo" value={form.bpmMin}
                onChange={(v) => setForm(s => ({ ...s, bpmMin: v }))}
              />
              <Numero
                label="Máximo" value={form.bpmMax}
                onChange={(v) => setForm(s => ({ ...s, bpmMax: v }))}
              />
            </Linha>
            {bpmInvalido && (
              <p className="text-xs text-vita-crit">BPM mínimo precisa ser menor que o máximo.</p>
            )}

            <Linha titulo="Saturação SpO₂ (%)" sub="Abaixo deste valor, gera alerta de saturação baixa.">
              <Numero
                label="Mínimo" value={form.spo2Min} max={100}
                onChange={(v) => setForm(s => ({ ...s, spo2Min: v }))}
              />
            </Linha>

            <Linha titulo="Temperatura (°C)" sub="Acima deste valor, gera alerta de febre.">
              <Numero
                label="Máximo" value={form.tempMax} step={0.1}
                onChange={(v) => setForm(s => ({ ...s, tempMax: v }))}
              />
            </Linha>

            <div className="flex items-start gap-2 text-xs text-vita-muted bg-vita-bg
                            border border-vita-border rounded-lg px-3 py-2.5">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-vita-primary" />
              <span>
                Valores padrão recomendados (clínicos genéricos para idosos):
                BPM 50–100, SpO₂ ≥ 92, temperatura ≤ 37,8 °C. Ajustes individuais
                ficam vinculados ao paciente selecionado acima.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="submit" className="vita-btn-primary" disabled={bpmInvalido}>
                <Save className="h-4 w-4" /> Salvar limites
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
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
