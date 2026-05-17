package com.vitacare.mqtt;

import java.nio.charset.StandardCharsets;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class MqttListener {

    private static final String[] TOPICS = {
            "pacientes/+/sinais",
            "pacientes/+/queda",
            "pacientes/+/status"
    };

    private static final int MAX_INITIAL_ATTEMPTS = 10;
    private static final long INITIAL_RETRY_DELAY_MS = 3000L;

    private final MqttClient mqttClient;
    private final MqttProperties props;
    private final MqttMessageProcessor processor;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        mqttClient.setCallback(new MqttCallbackExtended() {
            @Override
            public void connectComplete(boolean reconnect, String serverURI) {
                log.info("MQTT conectado a {} (reconnect={})", serverURI, reconnect);
                subscribeAll();
            }

            @Override
            public void connectionLost(Throwable cause) {
                log.warn("MQTT conexão perdida: {}",
                        cause != null ? cause.getMessage() : "desconhecido");
            }

            @Override
            public void messageArrived(String topic, MqttMessage message) {
                handleMessage(topic, new String(message.getPayload(), StandardCharsets.UTF_8));
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) {
                // não usado em subscriber
            }
        });

        Thread t = new Thread(this::connectWithRetry, "mqtt-init");
        t.setDaemon(true);
        t.start();
    }

    private void connectWithRetry() {
        MqttConnectOptions opts = new MqttConnectOptions();
        opts.setAutomaticReconnect(true);
        opts.setCleanSession(props.cleanSession());
        opts.setConnectionTimeout(props.connectionTimeoutSeconds());
        opts.setKeepAliveInterval(props.keepAliveSeconds());

        for (int attempt = 1; attempt <= MAX_INITIAL_ATTEMPTS; attempt++) {
            try {
                mqttClient.connect(opts);
                return; // connectComplete fará o subscribe
            } catch (MqttException e) {
                log.warn("MQTT tentativa {}/{} falhou: {}",
                        attempt, MAX_INITIAL_ATTEMPTS, e.getMessage());
                if (attempt == MAX_INITIAL_ATTEMPTS) {
                    log.error("MQTT não conectou após {} tentativas — backend segue sem MQTT",
                            MAX_INITIAL_ATTEMPTS);
                    return;
                }
                try {
                    Thread.sleep(INITIAL_RETRY_DELAY_MS);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    private void subscribeAll() {
        for (String topic : TOPICS) {
            try {
                mqttClient.subscribe(topic, props.qos());
                log.info("MQTT subscribed: {} (qos={})", topic, props.qos());
            } catch (MqttException e) {
                log.error("Falha ao subscrever em {}: {}", topic, e.getMessage());
            }
        }
    }

    private void handleMessage(String topic, String payload) {
        try {
            String[] parts = topic.split("/");
            if (parts.length != 3 || !"pacientes".equals(parts[0])) {
                log.warn("Tópico ignorado (formato inesperado): {}", topic);
                return;
            }

            Long pacienteId;
            try {
                pacienteId = Long.parseLong(parts[1]);
            } catch (NumberFormatException nfe) {
                log.warn("PacienteId inválido no tópico {}", topic);
                return;
            }

            switch (parts[2]) {
                case "sinais" -> processor.processarSinal(pacienteId, payload);
                case "queda"  -> processor.processarQueda(pacienteId, payload);
                case "status" -> processor.processarStatus(pacienteId, payload);
                default       -> log.warn("Tópico ignorado (sufixo desconhecido): {}", topic);
            }
        } catch (Exception e) {
            log.error("Erro inesperado no dispatcher topico={}: {}", topic, e.getMessage(), e);
        }
    }

    @PreDestroy
    public void shutdown() {
        try {
            if (mqttClient.isConnected()) {
                mqttClient.disconnect();
                log.info("MQTT desconectado.");
            }
            mqttClient.close();
        } catch (MqttException e) {
            log.warn("Erro ao desconectar MQTT: {}", e.getMessage());
        }
    }
}
