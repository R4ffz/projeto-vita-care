import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';

// Cliente Axios singleton — base configurável por VITE_API_URL.
// Em dev o default aponta para o backend Spring em localhost:8080.
// Em produção, deixe VITE_API_URL vazio para usar rota relativa (mesmo host).
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const SIM_BASE = import.meta.env.VITE_SIM_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

export const simApi = axios.create({
  baseURL: SIM_BASE,
  timeout: 4000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Erro padronizado lançado pelos services. `message` é amigável para exibir
 * na UI; `fieldErrors` carrega os erros de validação por campo quando o
 * backend retorna 400 do GlobalExceptionHandler.
 */
export class ServiceError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function instalarInterceptorErro(client: typeof api) {
  client.interceptors.response.use(
    (resp) => resp,
    (err: AxiosError<ApiError>) => {
      // Sem resposta = erro de rede / backend fora
      if (!err.response) {
        return Promise.reject(new ServiceError(
          err.code === 'ECONNABORTED'
            ? 'Tempo esgotado ao falar com o servidor.'
            : 'Não foi possível conectar ao backend. Verifique se ele está rodando.',
          0,
        ));
      }
      const { status, data } = err.response;
      const msg = data?.message ?? `Erro ${status} ao chamar a API.`;
      return Promise.reject(new ServiceError(msg, status, data?.fields));
    },
  );
}

instalarInterceptorErro(api);
instalarInterceptorErro(simApi);
