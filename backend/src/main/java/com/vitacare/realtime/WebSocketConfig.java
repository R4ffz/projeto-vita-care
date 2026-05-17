package com.vitacare.realtime;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuração STOMP sobre WebSocket para atualização em tempo real do frontend.
 *
 * <h3>Endpoint de conexão</h3>
 * <ul>
 *   <li><code>ws://&lt;host&gt;:8080/ws</code> — handshake STOMP nativo (sem SockJS)</li>
 * </ul>
 *
 * <h3>Tópicos publicados pelo backend</h3>
 * <ul>
 *   <li><code>/topic/pacientes/{id}/leituras</code> — nova leitura MQTT do paciente {id}
 *       (payload: {@link com.vitacare.realtime.event.LeituraEvent})</li>
 *   <li><code>/topic/pacientes/{id}/alertas</code> — novo alerta do paciente {id}
 *       (payload: {@link com.vitacare.realtime.event.AlertaEvent})</li>
 *   <li><code>/topic/alertas</code> — todos os novos alertas (qualquer paciente)</li>
 *   <li><code>/topic/central</code> — espelho de <code>/topic/alertas</code> para a tela
 *       da central de monitoramento</li>
 * </ul>
 *
 * <p>O frontend só assina (SUBSCRIBE); o backend só publica. Não há prefixo
 * <code>/app</code> porque clientes não enviam mensagens via STOMP — comandos
 * continuam via REST.</p>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:3000"
                );
    }
}
