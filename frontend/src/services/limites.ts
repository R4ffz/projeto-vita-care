import { api } from '@/lib/api';
import type { LimiteConfig, LimiteConfigRequest } from '@/types';

export async function buscar(pacienteId: number): Promise<LimiteConfig> {
  const { data } = await api.get<LimiteConfig>(`/api/pacientes/${pacienteId}/limites`);
  return data;
}

export async function atualizar(
  pacienteId: number,
  payload: LimiteConfigRequest,
): Promise<LimiteConfig> {
  const { data } = await api.put<LimiteConfig>(
    `/api/pacientes/${pacienteId}/limites`,
    payload,
  );
  return data;
}
