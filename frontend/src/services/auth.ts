import { api } from '@/lib/api';
import type { LoginResponse, UsuarioLogado } from '@/types';

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', { email, senha });
  return data;
}

export async function me(): Promise<UsuarioLogado> {
  const { data } = await api.get<UsuarioLogado>('/api/auth/me');
  return data;
}
