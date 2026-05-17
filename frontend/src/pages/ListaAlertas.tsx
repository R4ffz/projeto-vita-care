import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Filter } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { SeveridadeBadge } from '@/components/SeveridadeBadge';
import { alertasMock, pacientesMock } from '@/lib/mocks';
import { formatarDataHora, formatarHoraRelativa, rotuloTipoAlerta } from '@/lib/format';
import type { Alerta } from '@/types';

export function ListaAlertas() {
  const [soPendentes, setSoPendentes] = useState(false);
  const [marcados, setMarcados] = useState<Set<number>>(new Set());

  const lista = alertasMock
    .map(a => marcados.has(a.id) ? { ...a, atendido: true } : a)
    .filter(a => !soPendentes || !a.atendido)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const marcar = (id: number) => {
    setMarcados(prev => new Set(prev).add(id));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle hint="Eventos clínicos disparados pelas regras do sistema">
              Histórico de alertas
            </CardTitle>
            <label className="inline-flex items-center gap-2 text-xs text-vita-muted cursor-pointer
                              px-2.5 py-1.5 rounded-lg hover:bg-vita-bg transition">
              <Filter className="h-3.5 w-3.5" />
              <input
                type="checkbox"
                checked={soPendentes}
                onChange={(e) => setSoPendentes(e.target.checked)}
                className="accent-vita-primary"
              />
              Mostrar apenas pendentes
            </label>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {lista.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-vita-muted">
              Nenhum alerta para os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-vita-bg/50 border-b border-vita-border text-left">
                  <tr className="text-[11px] font-mono uppercase tracking-wider text-vita-muted">
                    <th className="px-5 py-3">Paciente</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Valor medido</th>
                    <th className="px-5 py-3">Severidade</th>
                    <th className="px-5 py-3">Quando</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vita-border">
                  {lista.map(a => (
                    <Linha key={a.id} alerta={a} marcar={() => marcar(a.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Linha({ alerta, marcar }: { alerta: Alerta; marcar: () => void }) {
  const paciente = pacientesMock.find(p => p.id === alerta.pacienteId);
  const critico = alerta.severidade === 'CRITICA' && !alerta.atendido;

  return (
    <tr className={critico ? 'bg-rose-50/60' : ''}>
      <td className="px-5 py-3">
        <Link to={`/pacientes/${alerta.pacienteId}`}
              className="text-vita-text hover:text-vita-primary inline-flex items-center gap-1.5">
          <span className="font-medium">{paciente?.nome ?? `#${alerta.pacienteId}`}</span>
          <ExternalLink className="h-3 w-3 text-vita-muted" />
        </Link>
      </td>
      <td className="px-5 py-3 text-vita-text">{rotuloTipoAlerta(alerta.tipo)}</td>
      <td className="px-5 py-3 font-mono tabular-nums text-vita-text">{alerta.valorMedido ?? '—'}</td>
      <td className="px-5 py-3"><SeveridadeBadge severidade={alerta.severidade} /></td>
      <td className="px-5 py-3 text-vita-muted">
        <div className="font-mono text-xs">{formatarHoraRelativa(alerta.timestamp)}</div>
        <div className="font-mono text-[10px] opacity-70">{formatarDataHora(alerta.timestamp)}</div>
      </td>
      <td className="px-5 py-3">
        {alerta.atendido
          ? <span className="text-xs text-emerald-700 font-medium">Atendido</span>
          : <span className="text-xs text-amber-700 font-medium">Pendente</span>
        }
      </td>
      <td className="px-5 py-3 text-right">
        {!alerta.atendido && (
          <button onClick={marcar} className="vita-btn-ghost">
            <Check className="h-4 w-4" /> Marcar atendido
          </button>
        )}
      </td>
    </tr>
  );
}
