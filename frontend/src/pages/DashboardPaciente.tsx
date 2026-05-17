import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, Droplets, Thermometer, Phone, ArrowLeft, LineChart, SlidersHorizontal,
} from 'lucide-react';
import {
  pacientesMock, ultimaLeituraMock, statusMock, alertasMock, limitesMock,
} from '@/lib/mocks';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/Card';
import { SinalCard } from '@/components/SinalCard';
import { StatusDot } from '@/components/StatusDot';
import { SeveridadeBadge } from '@/components/SeveridadeBadge';
import { formatarHoraRelativa, rotuloTipoAlerta } from '@/lib/format';

export function DashboardPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pacienteId = Number(id);
  const paciente = pacientesMock.find(p => p.id === pacienteId);

  if (!paciente) {
    return (
      <div className="vita-card px-5 py-8 text-center">
        <p className="text-sm text-vita-muted">Paciente não encontrado.</p>
        <button onClick={() => navigate('/central')} className="vita-btn-secondary mt-4">
          Voltar para a Central
        </button>
      </div>
    );
  }

  const leitura = ultimaLeituraMock[paciente.id];
  const status  = statusMock[paciente.id] ?? 'offline';
  const limites = limitesMock[paciente.id];
  const alertasDoPaciente = alertasMock
    .filter(a => a.pacienteId === paciente.id)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Link to="/central" className="vita-btn-ghost -ml-3">
        <ArrowLeft className="h-4 w-4" /> Central
      </Link>

      {/* Cabeçalho do paciente */}
      <div className="vita-card px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-vita-text">{paciente.nome}</h2>
            <StatusDot status={status} />
          </div>
          <div className="mt-1.5 text-sm text-vita-muted">
            {paciente.idade} anos · paciente #{paciente.id}
          </div>
          {paciente.contatoEmergencia && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-vita-muted">
              <Phone className="h-3.5 w-3.5" />
              {paciente.contatoEmergencia}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/historico?paciente=${paciente.id}`} className="vita-btn-secondary">
            <LineChart className="h-4 w-4" /> Histórico
          </Link>
          <Link to={`/limites?paciente=${paciente.id}`} className="vita-btn-secondary">
            <SlidersHorizontal className="h-4 w-4" /> Ajustar limites
          </Link>
        </div>
      </div>

      {/* Sinais vitais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SinalCard
          icon={Heart}
          label="Frequência cardíaca"
          unidade="bpm"
          valor={leitura?.bpm ?? null}
          faixa={limites ? `normal ${limites.bpmMin}–${limites.bpmMax}` : undefined}
          status={status}
        />
        <SinalCard
          icon={Droplets}
          label="Saturação SpO₂"
          unidade="%"
          valor={leitura?.spo2 ?? null}
          faixa={limites ? `mínimo ${limites.spo2Min}` : undefined}
          status={status}
        />
        <SinalCard
          icon={Thermometer}
          label="Temperatura"
          unidade="°C"
          valor={leitura?.temperatura ?? null}
          casas={1}
          faixa={limites ? `máximo ${limites.tempMax.toFixed(1)}` : undefined}
          status={status}
        />
      </div>

      {/* Última atualização + alertas recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        <Card>
          <CardHeader><CardTitle hint="Telemetria">Status da conexão</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <Linha rotulo="Dispositivo"   valor="IoT virtual" />
            <Linha rotulo="Última leitura" valor={leitura ? formatarHoraRelativa(leitura.timestamp) : '—'} />
            <Linha rotulo="Tópico MQTT"   valor={`pacientes/${paciente.id}/sinais`} mono />
            <Linha rotulo="Canal WS"      valor={`/topic/pacientes/${paciente.id}/leituras`} mono />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle hint="Últimos 5 eventos">Alertas recentes</CardTitle>
          </CardHeader>
          <CardBody>
            {alertasDoPaciente.length === 0 ? (
              <p className="text-sm text-vita-muted">Sem alertas registrados.</p>
            ) : (
              <ul className="divide-y divide-vita-border -mx-5">
                {alertasDoPaciente.map(a => (
                  <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <SeveridadeBadge severidade={a.severidade} />
                        <span className="text-sm font-medium text-vita-text">
                          {rotuloTipoAlerta(a.tipo)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-vita-muted font-mono">
                        valor {a.valorMedido} · {formatarHoraRelativa(a.timestamp)}
                        {a.atendido && ' · atendido'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-vita-muted">{rotulo}</span>
      <span className={`text-xs text-vita-text ${mono ? 'font-mono' : 'font-medium'}`}>
        {valor}
      </span>
    </div>
  );
}
