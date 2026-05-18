// Dados mockados remanescentes — usados apenas pelas telas que ainda não foram
// integradas ao backend.
//
// Prompt 14 vai substituir `historicoMock` por chamada real ao
// `GET /api/pacientes/{id}/leituras?minutos=N`.
//
// Prompt 15 vai substituir `perfisSimuladosMock` por chamada real ao
// `GET /sim/status` do servidor de controle do simulador.

import type { Leitura, PerfilSimulado } from '@/types';

export function historicoMock(pacienteId: number, minutos: number): Leitura[] {
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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
