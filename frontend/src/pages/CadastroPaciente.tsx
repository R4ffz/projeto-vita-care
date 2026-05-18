import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { PacienteForm } from '@/components/PacienteForm';
import { pacientesService } from '@/services';
import { ServiceError } from '@/lib/api';
import type { PacienteRequest } from '@/types';

export function CadastroPaciente() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<ServiceError | null>(null);

  const submit = async (req: PacienteRequest) => {
    setErro(null);
    try {
      const criado = await pacientesService.criar(req);
      navigate(`/pacientes/${criado.id}`, { replace: true });
    } catch (e) {
      if (e instanceof ServiceError) setErro(e);
      else throw e;
    }
  };

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
          <PacienteForm
            modo="criar"
            onSubmit={submit}
            onCancelar={() => navigate('/central')}
            erroExterno={erro}
          />
        </CardBody>
      </Card>
    </div>
  );
}
