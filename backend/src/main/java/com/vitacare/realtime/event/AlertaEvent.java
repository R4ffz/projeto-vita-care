package com.vitacare.realtime.event;

import java.math.BigDecimal;
import java.time.Instant;

import com.vitacare.alerta.Alerta;
import com.vitacare.alerta.Severidade;
import com.vitacare.alerta.TipoAlerta;

/**
 * Payload publicado simultaneamente em três tópicos sempre que
 * {@link com.vitacare.alerta.AvaliadorAlertas} gera um novo alerta:
 * <ul>
 *   <li><code>/topic/pacientes/{pacienteId}/alertas</code> — tela do paciente</li>
 *   <li><code>/topic/alertas</code> — feed global</li>
 *   <li><code>/topic/central</code> — central de monitoramento</li>
 * </ul>
 *
 * <p>Alertas suprimidos pela janela de deduplicação NÃO geram evento.</p>
 *
 * <h3>Exemplo JSON</h3>
 * <pre>{@code
 * {
 *   "id": 312,
 *   "pacienteId": 7,
 *   "tipo": "TAQUICARDIA",
 *   "valorMedido": 142,
 *   "severidade": "ALTA",
 *   "atendido": false,
 *   "timestamp": "2026-05-17T14:32:10Z"
 * }
 * }</pre>
 *
 * <p>Valores possíveis: {@link TipoAlerta} = BRADICARDIA, TAQUICARDIA,
 * SATURACAO_BAIXA, FEBRE, QUEDA. {@link Severidade} = BAIXA, MEDIA, ALTA,
 * CRITICA.</p>
 */
public record AlertaEvent(
        Long id,
        Long pacienteId,
        TipoAlerta tipo,
        BigDecimal valorMedido,
        Severidade severidade,
        Boolean atendido,
        Instant timestamp
) {
    public static AlertaEvent from(Alerta a) {
        return new AlertaEvent(
                a.getId(),
                a.getPacienteId(),
                a.getTipo(),
                a.getValorMedido(),
                a.getSeveridade(),
                a.getAtendido(),
                a.getTimestamp()
        );
    }
}
