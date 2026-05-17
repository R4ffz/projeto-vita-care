package com.vitacare.realtime.event;

import java.math.BigDecimal;
import java.time.Instant;

import com.vitacare.leitura.Leitura;

/**
 * Payload publicado em <code>/topic/pacientes/{pacienteId}/leituras</code>
 * sempre que uma nova leitura MQTT é persistida.
 *
 * <p>Espelha {@link com.vitacare.leitura.dto.LeituraResponse} de propósito —
 * assim o frontend pode reaproveitar o mesmo type usado no histórico REST.</p>
 *
 * <h3>Exemplo JSON</h3>
 * <pre>{@code
 * {
 *   "id": 1421,
 *   "pacienteId": 7,
 *   "bpm": 88,
 *   "spo2": 96,
 *   "temperatura": 36.7,
 *   "timestamp": "2026-05-17T14:32:10Z"
 * }
 * }</pre>
 */
public record LeituraEvent(
        Long id,
        Long pacienteId,
        Integer bpm,
        Integer spo2,
        BigDecimal temperatura,
        Instant timestamp
) {
    public static LeituraEvent from(Leitura l) {
        return new LeituraEvent(
                l.getId(),
                l.getPacienteId(),
                l.getBpm(),
                l.getSpo2(),
                l.getTemperatura(),
                l.getTimestamp()
        );
    }
}
