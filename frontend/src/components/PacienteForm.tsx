import { useState, type FormEvent } from 'react';
import { Info, Save } from 'lucide-react';
import type { PacienteRequest } from '@/types';
import type { ServiceError } from '@/lib/api';
import { ErrorState } from './ErrorState';

interface Props {
  inicial?: Partial<PacienteRequest>;
  modo: 'criar' | 'editar';
  onSubmit: (req: PacienteRequest) => Promise<void>;
  onCancelar?: () => void;
  erroExterno?: ServiceError | null;
}

export function PacienteForm({ inicial, modo, onSubmit, onCancelar, erroExterno }: Props) {
  const [form, setForm] = useState({
    nome: inicial?.nome ?? '',
    idade: inicial?.idade != null ? String(inicial.idade) : '',
    contatoEmergencia: inicial?.contatoEmergencia ?? '',
    fotoUrl: inicial?.fotoUrl ?? '',
  });
  const [salvando, setSalvando] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await onSubmit({
        nome: form.nome.trim(),
        idade: Number(form.idade),
        contatoEmergencia: form.contatoEmergencia.trim() || null,
        fotoUrl: form.fotoUrl.trim() || null,
      });
    } finally {
      setSalvando(false);
    }
  };

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-5">
      {erroExterno && <ErrorState error={erroExterno} />}

      <div>
        <label className="vita-label">Nome completo *</label>
        <input
          type="text" required maxLength={150}
          value={form.nome} onChange={set('nome')}
          className="vita-input" placeholder="ex.: Maria das Graças Souza"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="vita-label">Idade *</label>
          <input
            type="number" required min={0} max={130}
            value={form.idade} onChange={set('idade')}
            className="vita-input" placeholder="ex.: 78"
          />
        </div>
        <div>
          <label className="vita-label">Foto (URL — opcional)</label>
          <input
            type="url" maxLength={500}
            value={form.fotoUrl ?? ''} onChange={set('fotoUrl')}
            className="vita-input" placeholder="https://…"
          />
        </div>
      </div>

      <div>
        <label className="vita-label">Contato de emergência</label>
        <input
          type="text" maxLength={150}
          value={form.contatoEmergencia ?? ''} onChange={set('contatoEmergencia')}
          className="vita-input" placeholder="ex.: Joana Souza (filha) - (62) 99876-5432"
        />
      </div>

      {modo === 'criar' && (
        <div className="flex items-start gap-2 text-xs text-vita-muted bg-vita-bg
                        border border-vita-border rounded-lg px-3 py-2.5">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-vita-primary" />
          <span>
            Ao cadastrar, o sistema criará automaticamente limites clínicos padrão
            (BPM 50–100, SpO₂ ≥ 92, temp ≤ 37.8 °C). Eles podem ser ajustados na tela
            <span className="font-medium"> Limites clínicos</span>.
          </span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="vita-btn-secondary">
            Cancelar
          </button>
        )}
        <button type="submit" className="vita-btn-primary" disabled={salvando}>
          <Save className="h-4 w-4" />
          {salvando
            ? 'Salvando…'
            : modo === 'criar' ? 'Cadastrar paciente' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
