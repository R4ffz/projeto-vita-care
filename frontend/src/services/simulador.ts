import { simApi } from '@/lib/api';
import type { PerfilSimulado, StatusSimulador } from '@/types';

/**
 * Cliente do servidor de controle do simulador (porta 4000 por padrão).
 * Consome os endpoints definidos em `simulator/src/controlServer.js`.
 */

export async function status(): Promise<PerfilSimulado[]> {
  const { data } = await simApi.get<StatusSimulador>('/sim/status');
  return data.pacientes;
}

export async function queda(id: number, intensidade?: number): Promise<void> {
  await simApi.post(`/sim/${id}/queda`, intensidade != null ? { intensidade } : {});
}

export async function taquicardia(id: number): Promise<void> {
  await simApi.post(`/sim/${id}/taquicardia`);
}

export async function baixaSaturacao(id: number): Promise<void> {
  await simApi.post(`/sim/${id}/baixa-saturacao`);
}

export async function febre(id: number): Promise<void> {
  await simApi.post(`/sim/${id}/febre`);
}

export async function reset(id: number): Promise<void> {
  await simApi.post(`/sim/${id}/reset`);
}

export async function pausar(id: number): Promise<void> {
  await simApi.post(`/sim/${id}/pausar`);
}

export async function retomar(id: number): Promise<void> {
  await simApi.post(`/sim/${id}/retomar`);
}
