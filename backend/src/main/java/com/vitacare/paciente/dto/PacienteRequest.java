package com.vitacare.paciente.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PacienteRequest(

        @NotBlank
        @Size(max = 150)
        String nome,

        @NotNull
        @Min(0)
        @Max(130)
        Integer idade,

        @Size(max = 150)
        String contatoEmergencia,

        String fotoUrl
) {
}
