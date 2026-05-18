import { useState } from 'react';
import {
  Activity, Droplets, Thermometer, AlertOctagon, RotateCcw, Cpu, Info,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card';
import { perfisSimuladosMock } from '@/lib/mocks';
import { useAsync } from '@/lib/useAsync';
import { pacientesService } from '@/services';
import type { PerfilSimulado } from '@/types';
import { useCallback } from 'react';

const ROTULOS_PERFIL: Record<PerfilSimulado['perfil'], string> = {
  jovem_saudavel:    'Jovem saudável',
  hipertenso:        'Hipertenso',
  idoso_fragilizado: 'Idoso fragilizado',
};

const ROTULOS_ESTADO: Record<PerfilSimulado['estado'], string> = {
  normal:           'Normal',
  taquicardia:      'Taquicardia',
  baixa_saturacao:  'Baixa saturação',
  febre:            'Febre',
};

export function PainelSimulador() {
  const [perfis, setPerfis] = useState<PerfilSimulado[]>(perfisSimuladosMock);
  const fetchPacientes = useCallback(() => pacientesService.listar(), []);
  const { data: pacientes } = useAsync(fetchPacientes, []);

  const setEstado = (id: number, estado: PerfilSimulado['estado']) => {
    setPerfis(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
  };

  return (
    <div className="space-y-5">
      <div className="vita-card px-5 py-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-vita-primary-soft text-vita-primary
                        inline-flex items-center justify-center">
          <Cpu className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-medium text-vita-text">Controles dos dispositivos IoT virtuais</div>
          <p className="text-xs text-vita-muted mt-0.5">
            Aciona eventos no simulador para demonstração. A camada física foi substituída
            por um processo Node.js que publica MQTT como se fosse um ESP32. As ações abaixo
            ainda usam estado local — a chamada real ao endpoint <span className="font-mono">/sim/*</span> do
            simulador entra no Prompt 15.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {perfis.map(perfil => {
          const paciente = pacientes?.find(p => p.id === perfil.id);
          return (
            <Card key={perfil.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle hint={ROTULOS_PERFIL[perfil.perfil]}>
                    {paciente?.nome ?? `Paciente #${perfil.id}`}
                  </CardTitle>
                  <EstadoBadge estado={perfil.estado} />
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-2">
                  <Acao icon={Activity}      label="Taquicardia"     onClick={() => setEstado(perfil.id, 'taquicardia')} />
                  <Acao icon={Droplets}      label="Baixa saturação" onClick={() => setEstado(perfil.id, 'baixa_saturacao')} />
                  <Acao icon={Thermometer}   label="Febre"           onClick={() => setEstado(perfil.id, 'febre')} />
                  <Acao icon={AlertOctagon}  label="Queda"           tone="crit" onClick={() => alert(`Queda disparada (paciente ${perfil.id})`)} />
                </div>
                <button
                  onClick={() => setEstado(perfil.id, 'normal')}
                  className="vita-btn-secondary w-full mt-2"
                >
                  <RotateCcw className="h-4 w-4" /> Resetar para normal
                </button>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="vita-card px-5 py-4 flex items-start gap-3">
        <Info className="h-4 w-4 mt-0.5 text-vita-primary shrink-0" />
        <div className="text-xs text-vita-muted">
          O simulador roda em <span className="font-mono">localhost:4000</span> (servidor de controle)
          e publica no broker MQTT em <span className="font-mono">localhost:1883</span> nos tópicos
          {' '}<span className="font-mono">pacientes/&#123;id&#125;/sinais</span>,{' '}
          <span className="font-mono">…/queda</span> e <span className="font-mono">…/status</span>.
          Ver <span className="font-mono">simulator/README.md</span> para mais detalhes.
        </div>
      </div>
    </div>
  );
}

function Acao({
  icon: Icon, label, onClick, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone?: 'crit';
}) {
  const cls = tone === 'crit'
    ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
    : 'border-vita-border text-vita-text hover:bg-vita-bg';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2
                  px-3 py-2 rounded-lg text-sm font-medium border transition ${cls}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function EstadoBadge({ estado }: { estado: PerfilSimulado['estado'] }) {
  if (estado === 'normal') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                       border border-emerald-200 bg-emerald-50 text-emerald-700
                       text-[11px] font-semibold uppercase tracking-wide">
        Normal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                     border border-amber-200 bg-amber-50 text-amber-800
                     text-[11px] font-semibold uppercase tracking-wide">
      {ROTULOS_ESTADO[estado]}
    </span>
  );
}
