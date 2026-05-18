import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { createStompClient } from './stomp';
import type { Alerta, Leitura } from '@/types';

export type EstadoConexao = 'connecting' | 'connected' | 'disconnected' | 'error';

interface Handlers {
  onLeitura: (l: Leitura) => void;
  onAlerta:  (a: Alerta) => void;
}

interface Resultado {
  estado: EstadoConexao;
  /** Detalhe do último erro de conexão (mensagem curta) ou null. */
  erro: string | null;
}

/**
 * Mantém uma conexão STOMP enquanto o componente está montado e assina os
 * tópicos `/topic/pacientes/{id}/leituras` e `/topic/pacientes/{id}/alertas`.
 *
 * Os handlers são acessados via ref para que mudanças de identidade não
 * disparem reconexão a cada render. A reconexão automática é gerenciada
 * pelo `@stomp/stompjs` (reconnectDelay = 4s, configurado em createStompClient).
 */
export function useDashboardRealtime(
  pacienteId: number,
  handlers: Handlers,
): Resultado {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [estado, setEstado] = useState<EstadoConexao>('connecting');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(pacienteId)) return;

    const client: Client = createStompClient();
    setEstado('connecting');
    setErro(null);

    client.onConnect = () => {
      setEstado('connected');
      setErro(null);
      client.subscribe(`/topic/pacientes/${pacienteId}/leituras`, (msg) => {
        try {
          handlersRef.current.onLeitura(JSON.parse(msg.body) as Leitura);
        } catch {
          // payload inesperado: ignora silenciosamente
        }
      });
      client.subscribe(`/topic/pacientes/${pacienteId}/alertas`, (msg) => {
        try {
          handlersRef.current.onAlerta(JSON.parse(msg.body) as Alerta);
        } catch {
          /* idem */
        }
      });
    };

    client.onWebSocketClose = () => {
      // o stompjs reconecta sozinho; sinalizamos "reconectando" via 'connecting'
      setEstado((prev) => (prev === 'connected' ? 'connecting' : prev));
    };

    client.onWebSocketError = (ev) => {
      setEstado('error');
      setErro(`Falha no WebSocket${ev?.type ? ` (${ev.type})` : ''}.`);
    };

    client.onStompError = (frame) => {
      setEstado('error');
      setErro(frame.headers['message'] ?? 'Erro do broker STOMP.');
    };

    client.activate();

    return () => {
      setEstado('disconnected');
      // deactivate é async; subscriptions são limpas internamente.
      client.deactivate().catch(() => { /* silencia erro no teardown */ });
    };
  }, [pacienteId]);

  return { estado, erro };
}
