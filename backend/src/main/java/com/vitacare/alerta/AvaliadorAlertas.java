package com.vitacare.alerta;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vitacare.leitura.Leitura;
import com.vitacare.limite.LimiteConfig;
import com.vitacare.limite.LimiteConfigRepository;
import com.vitacare.realtime.RealtimePublisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Avalia leituras e eventos de queda contra os limites do paciente e gera
 * alertas, com janela de deduplicação para evitar ruído em violações contínuas.
 *
 * <p><b>Regra de deduplicação:</b> para cada par (paciente, tipo de alerta),
 * um novo alerta só é gerado se o último desse tipo nesse paciente foi há
 * pelo menos {@link #JANELA_DEDUP}. Enquanto a violação persistir dentro da
 * janela, leituras subsequentes ainda são persistidas em {@code leituras},
 * mas não geram novos alertas.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AvaliadorAlertas {

    private static final Duration JANELA_DEDUP = Duration.ofMinutes(5);

    /** Limiar de intensidade para queda CRITICA (vs ALTA). */
    private static final double INTENSIDADE_CRITICA = 2.5;

    private final LimiteConfigRepository limiteConfigRepository;
    private final AlertaRepository alertaRepository;
    private final RealtimePublisher realtimePublisher;

    @Transactional
    public void avaliarLeitura(Long pacienteId, Leitura leitura) {
        LimiteConfig limites = limiteConfigRepository.findByPacienteId(pacienteId).orElse(null);
        if (limites == null) {
            log.warn("Sem limites configurados para paciente {} — avaliação ignorada", pacienteId);
            return;
        }

        Instant ts = leitura.getTimestamp();

        Integer bpm = leitura.getBpm();
        if (bpm != null) {
            if (bpm < limites.getBpmMin()) {
                criar(pacienteId, TipoAlerta.BRADICARDIA, BigDecimal.valueOf(bpm), Severidade.ALTA, ts);
            } else if (bpm > limites.getBpmMax()) {
                criar(pacienteId, TipoAlerta.TAQUICARDIA, BigDecimal.valueOf(bpm), Severidade.ALTA, ts);
            }
        }

        Integer spo2 = leitura.getSpo2();
        if (spo2 != null && spo2 < limites.getSpo2Min()) {
            criar(pacienteId, TipoAlerta.SATURACAO_BAIXA, BigDecimal.valueOf(spo2), Severidade.ALTA, ts);
        }

        BigDecimal temp = leitura.getTemperatura();
        if (temp != null && temp.compareTo(limites.getTempMax()) > 0) {
            criar(pacienteId, TipoAlerta.FEBRE, temp, Severidade.ALTA, ts);
        }
    }

    @Transactional
    public void registrarQueda(Long pacienteId, Double intensidade, Instant ts) {
        Severidade severidade = (intensidade != null && intensidade >= INTENSIDADE_CRITICA)
                ? Severidade.CRITICA
                : Severidade.ALTA;
        BigDecimal valor = intensidade != null ? BigDecimal.valueOf(intensidade) : null;
        criar(pacienteId, TipoAlerta.QUEDA, valor, severidade, ts);
    }

    private void criar(Long pacienteId, TipoAlerta tipo, BigDecimal valor, Severidade severidade, Instant ts) {
        if (recente(pacienteId, tipo, ts)) {
            log.debug("Alerta {} para paciente {} suprimido (janela de deduplicação de {} min)",
                    tipo, pacienteId, JANELA_DEDUP.toMinutes());
            return;
        }
        Alerta alerta = new Alerta();
        alerta.setPacienteId(pacienteId);
        alerta.setTipo(tipo);
        alerta.setValorMedido(valor);
        alerta.setSeveridade(severidade);
        alerta.setAtendido(false);
        alerta.setTimestamp(ts);
        alertaRepository.save(alerta);
        log.warn("Alerta gerado: paciente={} tipo={} valor={} severidade={}",
                pacienteId, tipo, valor, severidade);
        realtimePublisher.publicarAlerta(alerta);
    }

    private boolean recente(Long pacienteId, TipoAlerta tipo, Instant agora) {
        return alertaRepository.findFirstByPacienteIdAndTipoOrderByTimestampDesc(pacienteId, tipo)
                .map(ultimo -> Duration.between(ultimo.getTimestamp(), agora).compareTo(JANELA_DEDUP) < 0)
                .orElse(false);
    }
}
