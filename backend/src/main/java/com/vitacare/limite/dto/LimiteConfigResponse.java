package com.vitacare.limite.dto;

import java.math.BigDecimal;

public record LimiteConfigResponse(
        Long pacienteId,
        Integer bpmMin,
        Integer bpmMax,
        Integer spo2Min,
        BigDecimal tempMax
) {
}
