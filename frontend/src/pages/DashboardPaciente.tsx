import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, Droplets, Thermometer, Phone, ArrowLeft, LineChart, SlidersHorizontal,
  Pencil, Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/Card';
import { SinalCard } from '@/components/SinalCard';
import { StatusDot } from '@/components/StatusDot';
import { SeveridadeBadge } from '@/components/SeveridadeBadge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { LiveStatus } from '@/components/LiveStatus';
import { EmergencyModal } from '@/components/EmergencyModal';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/auth/AuthContext';
import { temPermissao } from '@/auth/permissoes';
import { useDashboardRealtime } from '@/lib/useDashboardRealtime';
import { useTickInterval } from '@/lib/useTickInterval';
import { derivarStatus } from '@/lib/status';
import { ServiceError } from '@/lib/api';
import {
  pacientesService, leiturasService, alertasService, limitesService,
} from '@/services';
import type { Alerta, Leitura, LimiteConfig, Paciente } from '@/types';
import { formatarHoraRelativa, rotuloTipoAlerta } from '@/lib/format';

interface DadosPaciente {
  paciente: Paciente;
  leitura: Leitura | null;
  limites: LimiteConfig | null;
  alertas: Alerta[];
}

export function DashboardPaciente() {
  const { id } = useParams();
  const pacienteId = Number(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const podeEditar          = temPermissao(usuario, 'paciente.editar');
  const podeExcluir         = temPermissao(usuario, 'paciente.excluir');
  const podeConfigurarLimites = temPermissao(usuario, 'limites.configurar');

  // ─── Carga inicial via REST ───────────────────────────────────────────────
  const fetcher = useCallback(async (): Promise<DadosPaciente> => {
    const [paciente, leitura, limites, alertas] = await Promise.all([
      pacientesService.buscar(pacienteId),
      leiturasService.ultima(pacienteId, 5).catch(() => null),
      limitesService.buscar(pacienteId).catch(() => null),
      alertasService.listarPorPaciente(pacienteId).catch(() => []),
    ]);
    return { paciente, leitura, limites, alertas };
  }, [pacienteId]);

  const { data, loading, error, reload } = useAsync(fetcher, [pacienteId]);

  // ─── Estado vivo (hidratado pelo REST, atualizado pelo WS) ────────────────
  const [leituraAtual, setLeituraAtual] = useState<Leitura | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [modalAlerta, setModalAlerta] = useState<Alerta | null>(null);
  const [atendendoModal, setAtendendoModal] = useState(false);
  const dispensadosRef = useRef<Set<number>>(new Set());

  // Hidrata estado vivo quando o REST retorna.
  useEffect(() => {
    if (data) {
      setLeituraAtual(data.leitura);
      setAlertas(data.alertas);
    }
  }, [data]);

  // Limpa estado dispensado ao trocar de paciente.
  useEffect(() => {
    dispensadosRef.current = new Set();
    setModalAlerta(null);
  }, [pacienteId]);

  // ─── Handlers WebSocket ───────────────────────────────────────────────────
  const onLeitura = useCallback((l: Leitura) => {
    setLeituraAtual((prev) => {
      if (!prev) return l;
      const novoTs = new Date(l.timestamp).getTime();
      const antigoTs = new Date(prev.timestamp).getTime();
      return novoTs >= antigoTs ? l : prev;
    });
  }, []);

  const onAlerta = useCallback((a: Alerta) => {
    setAlertas((prev) => {
      if (prev.some((x) => x.id === a.id)) return prev;
      return [a, ...prev];
    });
    if (
      a.tipo === 'QUEDA'
      && a.severidade === 'CRITICA'
      && !a.atendido
      && !dispensadosRef.current.has(a.id)
    ) {
      setModalAlerta(a);
    }
  }, []);

  const { estado: estadoWs } = useDashboardRealtime(pacienteId, { onLeitura, onAlerta });

  // Mantém "última atualização" atualizada visualmente.
  useTickInterval(10_000);

  // ─── Ações ────────────────────────────────────────────────────────────────
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<ServiceError | null>(null);

  const excluir = async () => {
    if (!data) return;
    const ok = window.confirm(`Excluir "${data.paciente.nome}"? Ação irreversível.`);
    if (!ok) return;
    setExcluindo(true);
    setErroExcluir(null);
    try {
      await pacientesService.excluir(pacienteId);
      navigate('/central', { replace: true });
    } catch (e) {
      if (e instanceof ServiceError) setErroExcluir(e);
      else throw e;
    } finally {
      setExcluindo(false);
    }
  };

  const fecharModal = () => {
    if (modalAlerta) dispensadosRef.current.add(modalAlerta.id);
    setModalAlerta(null);
  };

  const atenderModal = async () => {
    if (!modalAlerta) return;
    setAtendendoModal(true);
    try {
      const atualizado = await alertasService.marcarAtendido(modalAlerta.id);
      setAlertas((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
      dispensadosRef.current.add(modalAlerta.id);
      setModalAlerta(null);
    } catch {
      // mantém o modal aberto; ErrorState do botão de excluir não cobre isso,
      // mas o ServiceError já loga no console via interceptor.
    } finally {
      setAtendendoModal(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return <LoadingState label="Carregando paciente…" />;
  if (error)   return <ErrorState error={error} onRetry={reload} />;
  if (!data)   return null;

  const { paciente, limites } = data;
  const status = derivarStatus(leituraAtual, limites);
  const alertasRecentes = alertas.slice(0, 5);
  const tempNumerica = leituraAtual?.temperatura != null
    ? Number(leituraAtual.temperatura)
    : null;
  const tempMaxNumerico = limites ? Number(limites.tempMax) : null;

  return (
    <div className="space-y-6">
      <Link to="/central" className="vita-btn-ghost -ml-3">
        <ArrowLeft className="h-4 w-4" /> Central
      </Link>

      {erroExcluir && <ErrorState error={erroExcluir} />}

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
          {podeConfigurarLimites && (
            <Link to={`/limites?paciente=${paciente.id}`} className="vita-btn-secondary">
              <SlidersHorizontal className="h-4 w-4" /> Limites
            </Link>
          )}
          {podeEditar && (
            <Link to={`/pacientes/${paciente.id}/editar`} className="vita-btn-secondary">
              <Pencil className="h-4 w-4" /> Editar
            </Link>
          )}
          {podeExcluir && (
            <button onClick={excluir} disabled={excluindo}
                    className="vita-btn-secondary text-vita-crit border-vita-crit/40
                               hover:bg-vita-crit-soft hover:border-vita-crit/50">
              <Trash2 className="h-4 w-4" /> {excluindo ? 'Excluindo…' : 'Excluir'}
            </button>
          )}
        </div>
      </div>

      {/* Sinais vitais ao vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SinalCard
          icon={Heart}        label="Frequência cardíaca" unidade="bpm"
          valor={leituraAtual?.bpm ?? null} status={status}
          faixa={limites ? `normal ${limites.bpmMin}–${limites.bpmMax}` : undefined}
        />
        <SinalCard
          icon={Droplets}     label="Saturação SpO₂" unidade="%"
          valor={leituraAtual?.spo2 ?? null} status={status}
          faixa={limites ? `mínimo ${limites.spo2Min}` : undefined}
        />
        <SinalCard
          icon={Thermometer}  label="Temperatura" unidade="°C" casas={1}
          valor={tempNumerica} status={status}
          faixa={tempMaxNumerico != null ? `máximo ${tempMaxNumerico.toFixed(1)}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle hint="Telemetria">Status da conexão</CardTitle>
              <LiveStatus estado={estadoWs} />
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <Linha rotulo="Dispositivo"    valor="IoT virtual" />
            <Linha
              rotulo="Última leitura"
              valor={leituraAtual ? formatarHoraRelativa(leituraAtual.timestamp) : 'sem leitura recente'}
            />
            <Linha rotulo="Tópico MQTT"    valor={`pacientes/${paciente.id}/sinais`} mono />
            <Linha rotulo="Canal WS"       valor={`/topic/pacientes/${paciente.id}/leituras`} mono />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle hint={alertas.length > 0 ? `${alertas.length} no histórico` : 'sem registros'}>
              Alertas recentes
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {alertasRecentes.length === 0 ? (
              <EmptyState titulo="Sem alertas registrados" descricao="Tudo dentro dos limites configurados." />
            ) : (
              <ul className="divide-y divide-vita-border">
                {alertasRecentes.map(a => (
                  <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <SeveridadeBadge severidade={a.severidade} />
                        <span className="text-sm font-medium text-vita-text">
                          {rotuloTipoAlerta(a.tipo)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-vita-muted font-mono">
                        valor {a.valorMedido ?? '—'} · {formatarHoraRelativa(a.timestamp)}
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

      {/* Modal de emergência para queda crítica */}
      {modalAlerta && (
        <EmergencyModal
          alerta={modalAlerta}
          paciente={paciente}
          onFechar={fecharModal}
          onAtender={atenderModal}
          atendendo={atendendoModal}
        />
      )}
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
