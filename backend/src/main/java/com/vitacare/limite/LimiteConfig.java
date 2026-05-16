package com.vitacare.limite;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "limites_config")
@Getter
@Setter
@NoArgsConstructor
public class LimiteConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "paciente_id", nullable = false, unique = true)
    private Long pacienteId;

    @Column(name = "bpm_min", nullable = false)
    private Integer bpmMin;

    @Column(name = "bpm_max", nullable = false)
    private Integer bpmMax;

    @Column(name = "spo2_min", nullable = false)
    private Integer spo2Min;

    @Column(name = "temp_max", nullable = false, precision = 4, scale = 1)
    private BigDecimal tempMax;
}
