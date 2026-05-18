import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { PacienteForm } from '@/components/PacienteForm';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { pacientesService } from '@/services';
import { ServiceError } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import type { PacienteRequest } from '@/types';

export function EdicaoPaciente() {
  const { id } = useParams();
  const pacienteId = Number(id);
  const navigate = useNavigate();
  const [erroSalvar, setErroSalvar] = useState<ServiceError | null>(null);

  const fetcher = useCallback(() => pacientesService.buscar(pacienteId), [pacienteId]);
  const { data, loading, error, reload } = useAsync(fetcher, [pacienteId]);

  const submit = async (req: PacienteRequest) => {
    setErroSalvar(null);
    try {
      await pacientesService.atualizar(pacienteId, req);
      navigate(`/pacientes/${pacienteId}`, { replace: true });
    } catch (e) {
      if (e instanceof ServiceError) setErroSalvar(e);
      else throw e;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to={`/pacientes/${pacienteId}`} className="vita-btn-ghost -ml-3">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle hint={data ? `#${data.id}` : 'Carregando…'}>
            Editar paciente
          </CardTitle>
        </CardHeader>
        <CardBody>
          {loading && <LoadingState label="Carregando dados do paciente…" />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {data && (
            <PacienteForm
              modo="editar"
              inicial={{
                nome: data.nome,
                idade: data.idade,
                contatoEmergencia: data.contatoEmergencia,
                fotoUrl: data.fotoUrl,
              }}
              onSubmit={submit}
              onCancelar={() => navigate(`/pacientes/${pacienteId}`)}
              erroExterno={erroSalvar}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
