package com.vitacare.mqtt;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mqtt")
public record MqttProperties(
        String brokerUrl,
        String clientId,
        int qos,
        boolean cleanSession,
        int connectionTimeoutSeconds,
        int keepAliveSeconds
) {
}
