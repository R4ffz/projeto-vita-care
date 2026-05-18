import { Client, type IMessage } from '@stomp/stompjs';

// Factory para o cliente STOMP do VitaCare IoT.
// Resolução do endpoint:
//   1. VITE_WS_URL no .env (override explícito);
//   2. Em dev (Vite na 5173) → fala direto com o backend em ws://localhost:8080/ws;
//   3. Em produção (Docker/Nginx servindo na mesma origem) → reusa o host
//      atual e deixa o proxy /ws do Nginx encaminhar para o backend.
//
// Uso esperado:
//   const client = createStompClient();
//   client.onConnect = () => {
//     client.subscribe('/topic/alertas', (m) => handler(JSON.parse(m.body)));
//   };
//   client.activate();

function resolveWsUrl(): string {
  const fromEnv = import.meta.env.VITE_WS_URL;
  if (fromEnv) return fromEnv;

  if (typeof window === 'undefined') return 'ws://localhost:8080/ws';

  // Dev: Vite servindo a SPA na 5173 não tem o STOMP proxied por padrão,
  // então conectamos direto no backend Spring (porta 8080).
  if (window.location.port === '5173') return 'ws://localhost:8080/ws';

  // Produção (Docker): mesmo host do frontend, Nginx faz o upgrade para o backend.
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

export function createStompClient(): Client {
  return new Client({
    brokerURL: resolveWsUrl(),
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => { /* silenciado por padrão */ },
  });
}

export type StompMessage = IMessage;
