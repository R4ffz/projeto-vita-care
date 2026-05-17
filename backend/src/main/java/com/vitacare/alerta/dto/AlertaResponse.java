package com.vitacare.alerta.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.vitacare.alerta.Severidade;
import com.vitacare.alerta.TipoAlerta;

public record AlertaResponse(
        Long id,
        Long pacienteId,
        TipoAlerta tipo,
        BigDecimal valorMedido,
        Severidade severidade,
        Boolean atendido,
        Instant timestamp
) {
}
