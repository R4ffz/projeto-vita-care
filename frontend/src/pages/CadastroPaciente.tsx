import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Info } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';

export function CadastroPaciente() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '',
    idade: '',
    contatoEmergencia: '',
    fotoUrl: '',
  });
  const [salvando, setSalvando] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      alert('Cadastro local realizado. A integração com a API entra no Prompt 12.');
      navigate('/central');
    }, 400);
  };

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(s => ({ ...s, [k]: e.target.value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/central" className="vita-btn-ghost -ml-3">
        <ArrowLeft className="h-4 w-4" /> Central
      </Link>

      <Card>
        <CardHeader>
          <CardTitle hint="Dados básicos para iniciar o monitoramento">
            Novo paciente
          </CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="vita-label">Nome completo *</label>
              <input
                type="text" required value={form.nome} onChange={set('nome')}
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
                  type="url" value={form.fotoUrl} onChange={set('fotoUrl')}
                  className="vita-input" placeholder="https://…"
                />
              </div>
            </div>

            <div>
              <label className="vita-label">Contato de emergência</label>
              <input
                type="text" value={form.contatoEmergencia} onChange={set('contatoEmergencia')}
                className="vita-input" placeholder="ex.: Joana Souza (filha) - (62) 99876-5432"
              />
            </div>

            <div className="flex items-start gap-2 text-xs text-vita-muted bg-vita-bg
                            border border-vita-border rounded-lg px-3 py-2.5">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-vita-primary" />
              <span>
                Ao cadastrar, o sistema criará automaticamente limites clínicos padrão
                (BPM 50–100, SpO₂ ≥ 92, temp ≤ 37.8 °C). Eles podem ser ajustados na tela
                <span className="font-medium"> Limites clínicos</span>.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link to="/central" className="vita-btn-secondary">Cancelar</Link>
              <button type="submit" className="vita-btn-primary" disabled={salvando}>
                <UserPlus className="h-4 w-4" />
                {salvando ? 'Salvando…' : 'Cadastrar paciente'}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
