package com.vitacare.limite;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LimiteConfigRepository extends JpaRepository<LimiteConfig, Long> {

    Optional<LimiteConfig> findByPacienteId(Long pacienteId);
}
