// Dados mockados para esta etapa. Alinhados com a seed do Flyway
// (V2__seed_pacientes.sql), de modo que ao plugar a API real no Prompt 12
// os mesmos IDs continuem fazendo sentido visualmente.

import type {
  Paciente, Leitura, Alerta, LimiteConfig, PerfilSimulado, StatusPaciente,
} from '@/types';

export const pacientesMock: Paciente[] = [
  {
    id: 1, nome: 'Maria das Graças Souza', idade: 78,
    contatoEmergencia: 'Joana Souza (filha) - (62) 99876-5432',
    fotoUrl: null,
    criadoEm: '2026-04-12T10:00:00Z',
  },
  {
    id: 2, nome: 'João Carlos Ferreira', idade: 82,
    contatoEmergencia: 'Rita Ferreira (esposa) - (62) 99765-4321',
    fotoUrl: null,
    criadoEm: '2026-04-12T10:00:00Z',
  },
  {
    id: 3, nome: 'Antônio Mendes Lima', idade: 89,
    contatoEmergencia: 'Roberto Mendes (filho) - (62) 99654-3210',
    fotoUrl: null,
    criadoEm: '2026-04-12T10:00:00Z',
  },
];

export const limitesMock: Record<number, LimiteConfig> = {
  1: { id: 1, pacienteId: 1, bpmMin: 50, bpmMax: 100, spo2Min: 92, tempMax: 37.8 },
  2: { id: 2, pacienteId: 2, bpmMin: 55, bpmMax: 95,  spo2Min: 92, tempMax: 37.8 },
  3: { id: 3, pacienteId: 3, bpmMin: 50, bpmMax: 100, spo2Min: 93, tempMax: 37.8 },
};

export const ultimaLeituraMock: Record<number, Leitura> = {
  1: { id: 1001, pacienteId: 1, bpm: 72, spo2: 98, temperatura: 36.6, timestamp: agoraMenos(0) },
  2: { id: 1002, pacienteId: 2, bpm: 88, spo2: 96, temperatura: 36.8, timestamp: agoraMenos(0) },
  3: { id: 1003, pacienteId: 3, bpm: 70, spo2: 94, temperatura: 36.5, timestamp: agoraMenos(0) },
};

export const statusMock: Record<number, StatusPaciente> = {
  1: 'ok',
  2: 'atencao',
  3: 'atencao',
};

export const alertasMock: Alerta[] = [
  alerta(501, 3, 'SATURACAO_BAIXA', 89, 'ALTA',    false, agoraMenos(2)),
  alerta(502, 2, 'TAQUICARDIA',     142, 'ALTA',    false, agoraMenos(7)),
  alerta(503, 3, 'QUEDA',           3.2, 'CRITICA', true,  agoraMenos(45)),
  alerta(504, 1, 'FEBRE',           38.4, 'ALTA',   true,  agoraMenos(120)),
  alerta(505, 2, 'BRADICARDIA',     46, 'ALTA',    true,  agoraMenos(260)),
];

export function historicoMock(pacienteId: number, minutos: number): Leitura[] {
  // Gera série temporal sintética e estável (sem random) para os gráficos da etapa visual.
  const pontos = Math.min(60, Math.max(10, Math.floor(minutos / 2)));
  const baseBpm  = pacienteId === 2 ? 88 : 72;
  const baseSpo2 = pacienteId === 3 ? 94 : 97;
  const baseTemp = 36.6;
  const agora = Date.now();
  const intervalo = (minutos * 60_000) / pontos;
  const out: Leitura[] = [];
  for (let i = 0; i < pontos; i++) {
    const t = agora - (pontos - i - 1) * intervalo;
    const wave = Math.sin((i / pontos) * Math.PI * 2);
    out.push({
      id: pacienteId * 10_000 + i,
      pacienteId,
      bpm: Math.round(baseBpm + wave * 6),
      spo2: Math.round(baseSpo2 + Math.sin(i / 3) * 1.2),
      temperatura: round1(baseTemp + Math.cos(i / 4) * 0.2),
      timestamp: new Date(t).toISOString(),
    });
  }
  return out;
}

export const perfisSimuladosMock: PerfilSimulado[] = [
  { id: 1, perfil: 'jovem_saudavel',    estado: 'normal' },
  { id: 2, perfil: 'hipertenso',        estado: 'normal' },
  { id: 3, perfil: 'idoso_fragilizado', estado: 'normal' },
];

function alerta(
  id: number, pacienteId: number, tipo: Alerta['tipo'],
  valor: number, severidade: Alerta['severidade'],
  atendido: boolean, timestamp: string,
): Alerta {
  return { id, pacienteId, tipo, valorMedido: valor, severidade, atendido, timestamp };
}

function agoraMenos(minutos: number): string {
  return new Date(Date.now() - minutos * 60_000).toISOString();
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
