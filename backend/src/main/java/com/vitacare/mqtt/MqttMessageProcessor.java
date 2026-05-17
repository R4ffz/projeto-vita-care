package com.vitacare.mqtt;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitacare.alerta.AvaliadorAlertas;
import com.vitacare.leitura.Leitura;
import com.vitacare.leitura.LeituraRepository;
import com.vitacare.mqtt.payload.QuedaPayload;
import com.vitacare.mqtt.payload.SinalPayload;
import com.vitacare.mqtt.payload.StatusPayload;
import com.vitacare.paciente.PacienteRepository;
import com.vitacare.realtime.RealtimePublisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttMessageProcessor {

    private final ObjectMapper objectMapper;
    private final PacienteRepository pacienteRepository;
    private final LeituraRepository leituraRepository;
    private final AvaliadorAlertas avaliadorAlertas;
    private final RealtimePublisher realtimePublisher;

    @Transactional
    public void processarSinal(Long pacienteId, String payloadJson) {
        if (!pacienteExiste(pacienteId)) return;
        try {
            SinalPayload p = objectMapper.readValue(payloadJson, SinalPayload.class);

            Leitura leitura = new Leitura();
            leitura.setPacienteId(pacienteId);
            leitura.setBpm(p.bpm());
            leitura.setSpo2(p.spo2());
            leitura.setTemperatura(p.temp() != null ? BigDecimal.valueOf(p.temp()) : null);
            leitura.setTimestamp(p.ts() != null ? p.ts() : Instant.now());
            leituraRepository.save(leitura);

            log.debug("Leitura salva: paciente={} bpm={} spo2={} temp={}",
                    pacienteId, p.bpm(), p.spo2(), p.temp());

            realtimePublisher.publicarLeitura(leitura);

            avaliadorAlertas.avaliarLeitura(pacienteId, leitura);
        } catch (Exception e) {
            log.error("Erro processando sinal paciente={} payload={} : {}",
                    pacienteId, payloadJson, e.getMessage());
        }
    }

    @Transactional
    public void processarQueda(Long pacienteId, String payloadJson) {
        if (!pacienteExiste(pacienteId)) return;
        try {
            QuedaPayload p = objectMapper.readValue(payloadJson, QuedaPayload.class);
            if (!Boolean.TRUE.equals(p.detectada())) {
                log.debug("Queda 'não detectada' ignorada (paciente {})", pacienteId);
                return;
            }
            Instant ts = p.ts() != null ? p.ts() : Instant.now();
            avaliadorAlertas.registrarQueda(pacienteId, p.intensidade(), ts);
        } catch (Exception e) {
            log.error("Erro processando queda paciente={} payload={} : {}",
                    pacienteId, payloadJson, e.getMessage());
        }
    }

    public void processarStatus(Long pacienteId, String payloadJson) {
        if (!pacienteExiste(pacienteId)) return;
        try {
            StatusPayload p = objectMapper.readValue(payloadJson, StatusPayload.class);
            log.info("Status paciente {}: online={} ts={}", pacienteId, p.online(), p.ts());
        } catch (Exception e) {
            log.error("Erro processando status paciente={} payload={} : {}",
                    pacienteId, payloadJson, e.getMessage());
        }
    }

    private boolean pacienteExiste(Long pacienteId) {
        boolean existe = pacienteRepository.existsById(pacienteId);
        if (!existe) {
            log.warn("Mensagem ignorada: paciente {} não existe", pacienteId);
        }
        return existe;
    }
}
