import { Link } from 'react-router-dom';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { pacientesMock, statusMock } from '@/lib/mocks';
import { StatusDot } from '@/components/StatusDot';

export function Pacientes() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle hint={`${pacientesMock.length} pacientes monitorados`}>
            Pacientes
          </CardTitle>
          <Link to="/pacientes/novo" className="vita-btn-primary">
            <UserPlus className="h-4 w-4" /> Cadastrar
          </Link>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <ul className="divide-y divide-vita-border">
          {pacientesMock.map(p => {
            const status = statusMock[p.id] ?? 'offline';
            return (
              <li key={p.id}>
                <Link
                  to={`/pacientes/${p.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4
                             hover:bg-vita-bg/60 transition group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-vita-text truncate">{p.nome}</span>
                      <span className="text-xs text-vita-muted font-mono">#{p.id}</span>
                    </div>
                    <div className="text-xs text-vita-muted mt-0.5">
                      {p.idade} anos · {p.contatoEmergencia ?? 'sem contato cadastrado'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <StatusDot status={status} />
                    <ChevronRight className="h-4 w-4 text-vita-muted group-hover:text-vita-primary transition" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
