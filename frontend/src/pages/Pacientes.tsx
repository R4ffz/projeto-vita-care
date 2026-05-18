import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/auth/AuthContext';
import { temPermissao } from '@/auth/permissoes';
import { pacientesService } from '@/services';
import { ServiceError } from '@/lib/api';
import type { Paciente } from '@/types';

export function Pacientes() {
  const fetcher = useCallback(() => pacientesService.listar(), []);
  const { data, loading, error, reload, setData } = useAsync(fetcher, []);

  const { usuario } = useAuth();
  const podeCriar    = temPermissao(usuario, 'paciente.criar');
  const podeEditar   = temPermissao(usuario, 'paciente.editar');
  const podeExcluir  = temPermissao(usuario, 'paciente.excluir');

  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [erroExcluir, setErroExcluir] = useState<ServiceError | null>(null);

  const excluir = async (p: Paciente) => {
    const ok = window.confirm(
      `Excluir o paciente "${p.nome}"? Esta ação não pode ser desfeita.\n\n` +
      `Leituras e alertas históricos vinculados podem ser perdidos.`,
    );
    if (!ok) return;
    setExcluindoId(p.id);
    setErroExcluir(null);
    try {
      await pacientesService.excluir(p.id);
      setData((prev) => (prev ?? []).filter((x) => x.id !== p.id));
    } catch (e) {
      if (e instanceof ServiceError) setErroExcluir(e);
      else throw e;
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <div className="space-y-4">
      {erroExcluir && <ErrorState error={erroExcluir} />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle hint={data ? `${data.length} pacientes monitorados` : ' '}>
              Pacientes
            </CardTitle>
            {podeCriar && (
              <Link to="/pacientes/novo" className="vita-btn-primary">
                <UserPlus className="h-4 w-4" /> Cadastrar
              </Link>
            )}
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading && <LoadingState label="Carregando pacientes…" />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {data && data.length === 0 && (
            <EmptyState
              titulo="Nenhum paciente cadastrado"
              descricao={podeCriar
                ? 'Cadastre o primeiro paciente para começar.'
                : 'Aguarde um profissional cadastrar pacientes para acompanhar.'}
              acao={podeCriar ? (
                <Link to="/pacientes/novo" className="vita-btn-primary">
                  <UserPlus className="h-4 w-4" /> Cadastrar
                </Link>
              ) : undefined}
            />
          )}
          {data && data.length > 0 && (
            <ul className="divide-y divide-vita-border">
              {data.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4
                                            hover:bg-vita-bg/60 transition group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-vita-text truncate">{p.nome}</span>
                      <span className="text-xs text-vita-muted font-mono">#{p.id}</span>
                    </div>
                    <div className="text-xs text-vita-muted mt-0.5">
                      {p.idade} anos · {p.contatoEmergencia ?? 'sem contato cadastrado'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to={`/pacientes/${p.id}`} className="vita-btn-ghost" title="Abrir dashboard">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    {podeEditar && (
                      <Link to={`/pacientes/${p.id}/editar`} className="vita-btn-ghost" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    )}
                    {podeExcluir && (
                      <button
                        onClick={() => excluir(p)}
                        disabled={excluindoId === p.id}
                        className="vita-btn-ghost text-vita-crit hover:text-vita-crit hover:bg-vita-crit-soft
                                   disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
