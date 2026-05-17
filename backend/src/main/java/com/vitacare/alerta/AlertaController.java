package com.vitacare.alerta;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.vitacare.alerta.dto.AlertaResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService service;

    @GetMapping("/api/alertas")
    public List<AlertaResponse> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/api/pacientes/{pacienteId}/alertas")
    public List<AlertaResponse> listarPorPaciente(@PathVariable Long pacienteId) {
        return service.listarPorPaciente(pacienteId);
    }

    @PatchMapping("/api/alertas/{id}/atendido")
    public AlertaResponse marcarAtendido(@PathVariable Long id) {
        return service.marcarAtendido(id);
    }
}
