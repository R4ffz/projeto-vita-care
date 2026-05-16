package com.vitacare.paciente;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vitacare.common.exception.NotFoundException;
import com.vitacare.limite.LimiteConfig;
import com.vitacare.limite.LimiteConfigRepository;
import com.vitacare.paciente.dto.PacienteRequest;
import com.vitacare.paciente.dto.PacienteResponse;

@Service
public class PacienteService {

    private static final Integer LIMITE_PADRAO_BPM_MIN  = 50;
    private static final Integer LIMITE_PADRAO_BPM_MAX  = 100;
    private static final Integer LIMITE_PADRAO_SPO2_MIN = 92;
    private static final BigDecimal LIMITE_PADRAO_TEMP_MAX = new BigDecimal("37.8");

    private final PacienteRepository pacienteRepository;
    private final LimiteConfigRepository limiteConfigRepository;

    public PacienteService(PacienteRepository pacienteRepository,
                           LimiteConfigRepository limiteConfigRepository) {
        this.pacienteRepository = pacienteRepository;
        this.limiteConfigRepository = limiteConfigRepository;
    }

    @Transactional(readOnly = true)
    public List<PacienteResponse> listar() {
        return pacienteRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PacienteResponse buscarPorId(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Paciente " + id + " não encontrado"));
        return toResponse(paciente);
    }

    @Transactional
    public PacienteResponse criar(PacienteRequest req) {
        Paciente paciente = new Paciente();
        paciente.setNome(req.nome());
        paciente.setIdade(req.idade());
        paciente.setContatoEmergencia(req.contatoEmergencia());
        paciente.setFotoUrl(req.fotoUrl());
        paciente = pacienteRepository.save(paciente);

        LimiteConfig limites = new LimiteConfig();
        limites.setPacienteId(paciente.getId());
        limites.setBpmMin(LIMITE_PADRAO_BPM_MIN);
        limites.setBpmMax(LIMITE_PADRAO_BPM_MAX);
        limites.setSpo2Min(LIMITE_PADRAO_SPO2_MIN);
        limites.setTempMax(LIMITE_PADRAO_TEMP_MAX);
        limiteConfigRepository.save(limites);

        return toResponse(paciente);
    }

    @Transactional
    public PacienteResponse atualizar(Long id, PacienteRequest req) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Paciente " + id + " não encontrado"));
        paciente.setNome(req.nome());
        paciente.setIdade(req.idade());
        paciente.setContatoEmergencia(req.contatoEmergencia());
        paciente.setFotoUrl(req.fotoUrl());
        return toResponse(paciente);
    }

    @Transactional
    public void deletar(Long id) {
        if (!pacienteRepository.existsById(id)) {
            throw new NotFoundException("Paciente " + id + " não encontrado");
        }
        pacienteRepository.deleteById(id);
    }

    private PacienteResponse toResponse(Paciente p) {
        return new PacienteResponse(
                p.getId(),
                p.getNome(),
                p.getIdade(),
                p.getContatoEmergencia(),
                p.getFotoUrl(),
                p.getCriadoEm()
        );
    }
}
