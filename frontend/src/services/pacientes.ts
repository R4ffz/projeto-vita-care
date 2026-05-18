import { api } from '@/lib/api';
import type { Paciente, PacienteRequest } from '@/types';

const BASE = '/api/pacientes';

export async function listar(): Promise<Paciente[]> {
  const { data } = await api.get<Paciente[]>(BASE);
  return data;
}

export async function buscar(id: number): Promise<Paciente> {
  const { data } = await api.get<Paciente>(`${BASE}/${id}`);
  return data;
}

export async function criar(payload: PacienteRequest): Promise<Paciente> {
  const { data } = await api.post<Paciente>(BASE, payload);
  return data;
}

export async function atualizar(id: number, payload: PacienteRequest): Promise<Paciente> {
  const { data } = await api.put<Paciente>(`${BASE}/${id}`, payload);
  return data;
}

export async function excluir(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
