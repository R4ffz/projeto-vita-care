import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Filter } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { SeveridadeBadge } from '@/components/SeveridadeBadge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { alertasService, pacientesService } from '@/services';
import { ServiceError } from '@/lib/api';
import { formatarDataHora, formatarHoraRelativa, rotuloTipoAlerta } from '@/lib/format';
import type { Alerta, Paciente } from '@/types';

interface Dados {
  alertas: Alerta[];
  pacientesPorId: Map<number, Paciente>;
}

async function carregar(): Promise<Dados> {
  const [alertas, pacientes] = await Promise.all([
    alertasService.listarTodos(),
    pacientesService.listar(),
  ]);
  return {
    alertas,
    pacientesPorId: new Map(pacientes.map(p => [p.id, p])),
  };
}

export function ListaAlertas() {
  const fetcher = useCallback(carregar, []);
  const { data, loading, error, reload, setData } = useAsync(fetcher, []);
  const [soPendentes, setSoPendentes] = useState(false);
  const [marcandoId, setMarcandoId] = useState<number | null>(null);
  const [erroAcao, setErroAcao] = useState<ServiceError | null>(null);

  const marcar = async (a: Alerta) => {
    setMarcandoId(a.id);
    setErroAcao(null);
    try {
      const atualizado = await alertasService.marcarAtendido(a.id);
      setData((prev) => {
        if (!prev) return { alertas: [atualizado], pacientesPorId: new Map() };
        return {
          ...prev,
          alertas: prev.alertas.map(x => x.id === atualizado.id ? atualizado : x),
        };
      });
    } catch (e) {
      if (e instanceof ServiceError) setErroAcao(e);
      else throw e;
    } finally {
      setMarcandoId(null);
    }
  };

  return (
    <div className="space-y-4">
      {erroAcao && <ErrorState error={erroAcao} />}

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
          {loading && <LoadingState label="Carregando alertas…" />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {data && (() => {
            const lista = data.alertas
              .filter(a => !soPendentes || !a.atendido)
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

            if (lista.length === 0) {
              return (
                <EmptyState
                  titulo="Nenhum alerta para os filtros atuais"
                  descricao={soPendentes ? 'Todos os alertas foram atendidos.' : 'Nada foi disparado pelo sistema ainda.'}
                />
              );
            }

            return (
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
                      <Linha
                        key={a.id}
                        alerta={a}
                        paciente={data.pacientesPorId.get(a.pacienteId)}
                        marcando={marcandoId === a.id}
                        marcar={() => marcar(a)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </CardBody>
      </Card>
    </div>
  );
}

function Linha({
  alerta, paciente, marcando, marcar,
}: { alerta: Alerta; paciente: Paciente | undefined; marcando: boolean; marcar: () => void }) {
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
          <button onClick={marcar} disabled={marcando} className="vita-btn-ghost">
            <Check className="h-4 w-4" /> {marcando ? 'Marcando…' : 'Marcar atendido'}
          </button>
        )}
      </td>
    </tr>
  );
}
