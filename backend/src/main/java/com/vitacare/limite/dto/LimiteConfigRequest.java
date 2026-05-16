package com.vitacare.limite.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record LimiteConfigRequest(

        @NotNull
        @Min(0) @Max(250)
        Integer bpmMin,

        @NotNull
        @Min(0) @Max(250)
        Integer bpmMax,

        @NotNull
        @Min(0) @Max(100)
        Integer spo2Min,

        @NotNull
        @DecimalMin("30.0")
        @DecimalMax("45.0")
        BigDecimal tempMax
) {
}
