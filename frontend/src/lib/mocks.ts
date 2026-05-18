// Mocks remanescentes — usados só pelas telas ainda não integradas ao backend.
//
// Prompt 15 vai substituir `perfisSimuladosMock` por chamada real ao
// `GET /sim/status` do servidor de controle do simulador.

import type { PerfilSimulado } from '@/types';

export const perfisSimuladosMock: PerfilSimulado[] = [
  { id: 1, perfil: 'jovem_saudavel',    estado: 'normal' },
  { id: 2, perfil: 'hipertenso',        estado: 'normal' },
  { id: 3, perfil: 'idoso_fragilizado', estado: 'normal' },
];
