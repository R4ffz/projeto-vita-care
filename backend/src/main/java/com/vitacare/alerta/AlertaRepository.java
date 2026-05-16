package com.vitacare.alerta;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    List<Alerta> findByPacienteIdOrderByTimestampDesc(Long pacienteId);

    List<Alerta> findByAtendidoFalseOrderByTimestampDesc();
}
