package com.vitacare.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MqttProperties.class)
public class MqttConfig {

    @Bean
    public MqttClient mqttClient(MqttProperties props) throws MqttException {
        return new MqttClient(props.brokerUrl(), props.clientId(), new MemoryPersistence());
    }
}
