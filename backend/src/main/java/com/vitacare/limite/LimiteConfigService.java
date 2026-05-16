package com.vitacare.limite;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vitacare.common.exception.NotFoundException;
import com.vitacare.limite.dto.LimiteConfigRequest;
import com.vitacare.limite.dto.LimiteConfigResponse;
import com.vitacare.paciente.PacienteRepository;

@Service
public class LimiteConfigService {

    private final LimiteConfigRepository limiteConfigRepository;
    private final PacienteRepository pacienteRepository;

    public LimiteConfigService(LimiteConfigRepository limiteConfigRepository,
                               PacienteRepository pacienteRepository) {
        this.limiteConfigRepository = limiteConfigRepository;
        this.pacienteRepository = pacienteRepository;
    }

    @Transactional(readOnly = true)
    public LimiteConfigResponse buscar(Long pacienteId) {
        garantirPaciente(pacienteId);
        LimiteConfig l = limiteConfigRepository.findByPacienteId(pacienteId)
                .orElseThrow(() -> new NotFoundException(
                        "Limites não encontrados para paciente " + pacienteId));
        return toResponse(l);
    }

    @Transactional
    public LimiteConfigResponse atualizar(Long pacienteId, LimiteConfigRequest req) {
        garantirPaciente(pacienteId);
        LimiteConfig limites = limiteConfigRepository.findByPacienteId(pacienteId)
                .orElseThrow(() -> new NotFoundException(
                        "Limites não encontrados para paciente " + pacienteId));

        if (req.bpmMin() >= req.bpmMax()) {
            throw new IllegalArgumentException("bpmMin deve ser menor que bpmMax");
        }

        limites.setBpmMin(req.bpmMin());
        limites.setBpmMax(req.bpmMax());
        limites.setSpo2Min(req.spo2Min());
        limites.setTempMax(req.tempMax());
        return toResponse(limites);
    }

    private void garantirPaciente(Long pacienteId) {
        if (!pacienteRepository.existsById(pacienteId)) {
            throw new NotFoundException("Paciente " + pacienteId + " não encontrado");
        }
    }

    private LimiteConfigResponse toResponse(LimiteConfig l) {
        return new LimiteConfigResponse(
                l.getPacienteId(),
                l.getBpmMin(),
                l.getBpmMax(),
                l.getSpo2Min(),
                l.getTempMax()
        );
    }
}
