package com.vitacare.alerta;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    List<Alerta> findAllByOrderByTimestampDesc();

    List<Alerta> findByPacienteIdOrderByTimestampDesc(Long pacienteId);

    List<Alerta> findByAtendidoFalseOrderByTimestampDesc();

    Optional<Alerta> findFirstByPacienteIdAndTipoOrderByTimestampDesc(Long pacienteId, TipoAlerta tipo);
}
