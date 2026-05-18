import { api } from '@/lib/api';
import type { Alerta } from '@/types';

export async function listarTodos(): Promise<Alerta[]> {
  const { data } = await api.get<Alerta[]>('/api/alertas');
  return data;
}

export async function listarPorPaciente(pacienteId: number): Promise<Alerta[]> {
  const { data } = await api.get<Alerta[]>(`/api/pacientes/${pacienteId}/alertas`);
  return data;
}

export async function marcarAtendido(id: number): Promise<Alerta> {
  const { data } = await api.patch<Alerta>(`/api/alertas/${id}/atendido`);
  return data;
}
