package com.vitacare.limite;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vitacare.limite.dto.LimiteConfigRequest;
import com.vitacare.limite.dto.LimiteConfigResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pacientes/{pacienteId}/limites")
public class LimiteConfigController {

    private final LimiteConfigService service;

    public LimiteConfigController(LimiteConfigService service) {
        this.service = service;
    }

    @GetMapping
    public LimiteConfigResponse buscar(@PathVariable Long pacienteId) {
        return service.buscar(pacienteId);
    }

    @PutMapping
    public LimiteConfigResponse atualizar(@PathVariable Long pacienteId,
                                          @Valid @RequestBody LimiteConfigRequest req) {
        return service.atualizar(pacienteId, req);
    }
}
