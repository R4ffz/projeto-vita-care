package com.vitacare.leitura;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LeituraRepository extends JpaRepository<Leitura, Long> {

    List<Leitura> findByPacienteIdAndTimestampAfterOrderByTimestampAsc(Long pacienteId, Instant since);

    Optional<Leitura> findFirstByPacienteIdOrderByTimestampDesc(Long pacienteId);
}
