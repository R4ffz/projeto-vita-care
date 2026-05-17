package com.vitacare.realtime;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.vitacare.alerta.Alerta;
import com.vitacare.leitura.Leitura;
import com.vitacare.realtime.event.AlertaEvent;
import com.vitacare.realtime.event.LeituraEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Fachada para publicar eventos de tempo real nos tópicos STOMP.
 *
 * <p>Falhas de envio são engolidas e logadas em WARN — o fluxo MQTT/REST
 * principal não pode ser quebrado porque um cliente WebSocket caiu.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publicarLeitura(Leitura leitura) {
        LeituraEvent ev = LeituraEvent.from(leitura);
        send("/topic/pacientes/" + leitura.getPacienteId() + "/leituras", ev);
    }

    public void publicarAlerta(Alerta alerta) {
        AlertaEvent ev = AlertaEvent.from(alerta);
        send("/topic/pacientes/" + alerta.getPacienteId() + "/alertas", ev);
        send("/topic/alertas", ev);
        send("/topic/central", ev);
    }

    private void send(String destination, Object payload) {
        try {
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception e) {
            log.warn("Falha ao publicar em {}: {}", destination, e.getMessage());
        }
    }
}
