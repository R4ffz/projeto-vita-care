import { Client, type IMessage } from '@stomp/stompjs';

// Factory para o cliente STOMP do VitaCare IoT.
// Nesta etapa NÃO é instanciado — o Prompt 13 (Dashboard em tempo real)
// vai conectar e assinar /topic/pacientes/{id}/leituras, /topic/alertas etc.
//
// Uso esperado:
//   const client = createStompClient();
//   client.onConnect = () => {
//     client.subscribe('/topic/alertas', (m) => handler(JSON.parse(m.body)));
//   };
//   client.activate();
//
// Para desconectar: client.deactivate();

export function createStompClient(): Client {
  const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws';
  return new Client({
    brokerURL: wsUrl,
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // Em dev, logs verbosos no console — desligar em produção.
    debug: () => { /* silenciado por padrão */ },
  });
}

export type StompMessage = IMessage;
