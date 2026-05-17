package com.vitacare.leitura;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vitacare.common.exception.NotFoundException;
import com.vitacare.leitura.dto.LeituraResponse;
import com.vitacare.paciente.PacienteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LeituraService {

    private final LeituraRepository leituraRepository;
    private final PacienteRepository pacienteRepository;

    @Transactional(readOnly = true)
    public List<LeituraResponse> historicoUltimosMinutos(Long pacienteId, int minutos) {
        if (!pacienteRepository.existsById(pacienteId)) {
            throw new NotFoundException("Paciente " + pacienteId + " não encontrado");
        }
        Instant desde = Instant.now().minus(Duration.ofMinutes(minutos));
        return leituraRepository
                .findByPacienteIdAndTimestampAfterOrderByTimestampAsc(pacienteId, desde)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private LeituraResponse toResponse(Leitura l) {
        return new LeituraResponse(
                l.getId(),
                l.getPacienteId(),
                l.getBpm(),
                l.getSpo2(),
                l.getTemperatura(),
                l.getTimestamp()
        );
    }
}
