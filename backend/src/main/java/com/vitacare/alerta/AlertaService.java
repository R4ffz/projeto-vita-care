package com.vitacare.alerta;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vitacare.alerta.dto.AlertaResponse;
import com.vitacare.common.exception.NotFoundException;
import com.vitacare.paciente.PacienteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private final AlertaRepository alertaRepository;
    private final PacienteRepository pacienteRepository;

    @Transactional(readOnly = true)
    public List<AlertaResponse> listarTodos() {
        return alertaRepository.findAllByOrderByTimestampDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaResponse> listarPorPaciente(Long pacienteId) {
        if (!pacienteRepository.existsById(pacienteId)) {
            throw new NotFoundException("Paciente " + pacienteId + " não encontrado");
        }
        return alertaRepository.findByPacienteIdOrderByTimestampDesc(pacienteId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AlertaResponse marcarAtendido(Long id) {
        Alerta a = alertaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Alerta " + id + " não encontrado"));
        a.setAtendido(true);
        return toResponse(a);
    }

    private AlertaResponse toResponse(Alerta a) {
        return new AlertaResponse(
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
