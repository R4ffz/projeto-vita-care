package com.vitacare.leitura;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vitacare.leitura.dto.LeituraResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pacientes/{pacienteId}/leituras")
@RequiredArgsConstructor
public class LeituraController {

    private final LeituraService service;

    @GetMapping
    public List<LeituraResponse> historico(
            @PathVariable Long pacienteId,
            @RequestParam(defaultValue = "60") int minutos
    ) {
        if (minutos <= 0 || minutos > 1440) {
            throw new IllegalArgumentException("minutos deve estar entre 1 e 1440");
        }
        return service.historicoUltimosMinutos(pacienteId, minutos);
    }
}
