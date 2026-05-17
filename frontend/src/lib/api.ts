import axios from 'axios';

// Cliente Axios singleton — apontado para o backend Spring.
// Nesta etapa as páginas usam dados de src/lib/mocks.ts.
// No Prompt 12, services específicos (pacientes, leituras, alertas, limites)
// vão consumir esta instância.

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente separado para o servidor de controle do simulador (porta 4000).
export const simApi = axios.create({
  baseURL: import.meta.env.VITE_SIM_URL ?? 'http://localhost:4000',
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});
