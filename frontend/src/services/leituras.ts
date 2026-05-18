import { api } from '@/lib/api';
import type { Leitura } from '@/types';

export async function historico(pacienteId: number, minutos: number): Promise<Leitura[]> {
  const { data } = await api.get<Leitura[]>(`/api/pacientes/${pacienteId}/leituras`, {
    params: { minutos },
  });
  return data;
}

/** Retorna a leitura mais recente do paciente nos últimos N minutos, ou null. */
export async function ultima(pacienteId: number, minutos = 5): Promise<Leitura | null> {
  const lista = await historico(pacienteId, minutos);
  if (lista.length === 0) return null;
  // Backend devolve em ordem cronológica crescente; o último é o mais recente.
  return lista[lista.length - 1] ?? null;
}
