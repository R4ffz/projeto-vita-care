package com.vitacare.paciente.dto;

import java.time.Instant;

public record PacienteResponse(
        Long id,
        String nome,
        Integer idade,
        String contatoEmergencia,
        String fotoUrl,
        Instant criadoEm
) {
}
