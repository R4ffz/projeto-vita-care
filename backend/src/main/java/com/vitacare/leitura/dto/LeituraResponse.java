package com.vitacare.leitura.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record LeituraResponse(
        Long id,
        Long pacienteId,
        Integer bpm,
        Integer spo2,
        BigDecimal temperatura,
        Instant timestamp
) {
}
