import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';

// Cliente Axios singleton — base configurável por VITE_API_URL.
// Em dev o default aponta para o backend Spring em localhost:8080.
// Em produção, deixe VITE_API_URL vazio para usar rota relativa (mesmo host).
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const SIM_BASE = import.meta.env.VITE_SIM_URL ?? 'http://localhost:4000';

/** Chave usada no localStorage para guardar `{ token, usuario }`. */
export const AUTH_STORAGE_KEY = 'vitacare:auth';
/** Evento disparado no window quando o backend responde 401 em rota protegida. */
export const UNAUTHORIZED_EVENT = 'vitacare:unauthorized';

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

/** Lê o token persistido sem depender do React context (interceptor roda fora). */
function lerToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

// ─── Request: injeta Authorization ────────────────────────────────────────────
api.interceptors.request.use((cfg) => {
  const token = lerToken();
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// ─── Response: padroniza erros e trata 401 ────────────────────────────────────
function instalarInterceptorErro(client: typeof api, ehBackend: boolean) {
  client.interceptors.response.use(
    (resp) => resp,
    (err: AxiosError<ApiError>) => {
      if (!err.response) {
        return Promise.reject(new ServiceError(
          err.code === 'ECONNABORTED'
            ? 'Tempo esgotado ao falar com o servidor.'
            : 'Não foi possível conectar ao servidor.',
          0,
        ));
      }
      const { status, data } = err.response;

      // 401 no backend principal → token expirado/inválido. Limpa e avisa a app.
      // Exceção: o próprio /api/auth/login pode retornar 401 (credenciais erradas)
      // e nesse caso a tela de Login mostra a mensagem em si — não dispara logout.
      if (ehBackend && status === 401) {
        const url = err.config?.url ?? '';
        if (!url.includes('/api/auth/login')) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
        }
      }

      const msg = data?.message ?? `Erro ${status} ao chamar a API.`;
      return Promise.reject(new ServiceError(msg, status, data?.fields));
    },
  );
}

instalarInterceptorErro(api, true);
instalarInterceptorErro(simApi, false);
