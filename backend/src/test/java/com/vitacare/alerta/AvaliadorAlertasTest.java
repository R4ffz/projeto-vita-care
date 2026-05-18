package com.vitacare.alerta;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.vitacare.leitura.Leitura;
import com.vitacare.limite.LimiteConfig;
import com.vitacare.limite.LimiteConfigRepository;
import com.vitacare.realtime.RealtimePublisher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes do avaliador de alertas — cobre as regras clínicas centrais e a
 * janela de deduplicação de 5 minutos.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AvaliadorAlertasTest {

    private static final Long PACIENTE_ID = 1L;
    private static final Instant TS = Instant.parse("2026-05-18T12:00:00Z");

    @Mock private LimiteConfigRepository limiteRepo;
    @Mock private AlertaRepository alertaRepo;
    @Mock private RealtimePublisher realtimePublisher;

    @InjectMocks private AvaliadorAlertas avaliador;

    private LimiteConfig limites;

    @BeforeEach
    void setUp() {
        limites = new LimiteConfig();
        limites.setPacienteId(PACIENTE_ID);
        limites.setBpmMin(50);
        limites.setBpmMax(100);
        limites.setSpo2Min(92);
        limites.setTempMax(new BigDecimal("37.8"));
        when(limiteRepo.findByPacienteId(PACIENTE_ID)).thenReturn(Optional.of(limites));
    }

    @Nested
    @DisplayName("Regras clínicas sobre sinais vitais")
    class RegrasClinicas {

        @Test
        @DisplayName("BPM acima do limite gera TAQUICARDIA")
        void bpmAcimaGeraTaquicardia() {
            sinalBpmEnvia(120);

            Alerta a = capturarAlertaSalvo();
            assertThat(a.getTipo()).isEqualTo(TipoAlerta.TAQUICARDIA);
            assertThat(a.getSeveridade()).isEqualTo(Severidade.ALTA);
            assertThat(a.getValorMedido()).isEqualByComparingTo("120");
            assertThat(a.getAtendido()).isFalse();
        }

        @Test
        @DisplayName("BPM abaixo do limite gera BRADICARDIA")
        void bpmAbaixoGeraBradicardia() {
            sinalBpmEnvia(40);

            assertThat(capturarAlertaSalvo().getTipo()).isEqualTo(TipoAlerta.BRADICARDIA);
        }

        @Test
        @DisplayName("BPM dentro da faixa não gera alerta")
        void bpmNormalNaoGeraAlerta() {
            sinalBpmEnvia(75);

            verify(alertaRepo, never()).save(any());
            verify(realtimePublisher, never()).publicarAlerta(any());
        }

        @Test
        @DisplayName("SpO2 abaixo do limite gera SATURACAO_BAIXA")
        void spo2BaixoGeraAlerta() {
            Leitura l = leitura(null, 88, null);
            avaliador.avaliarLeitura(PACIENTE_ID, l);

            assertThat(capturarAlertaSalvo().getTipo()).isEqualTo(TipoAlerta.SATURACAO_BAIXA);
        }

        @Test
        @DisplayName("Temperatura acima do limite gera FEBRE")
        void temperaturaAltaGeraAlerta() {
            Leitura l = leitura(null, null, new BigDecimal("38.5"));
            avaliador.avaliarLeitura(PACIENTE_ID, l);

            Alerta a = capturarAlertaSalvo();
            assertThat(a.getTipo()).isEqualTo(TipoAlerta.FEBRE);
            assertThat(a.getValorMedido()).isEqualByComparingTo("38.5");
        }

        @Test
        @DisplayName("Sem limites configurados, avaliação é ignorada (não gera alerta)")
        void semLimitesNaoGeraAlerta() {
            when(limiteRepo.findByPacienteId(PACIENTE_ID)).thenReturn(Optional.empty());

            avaliador.avaliarLeitura(PACIENTE_ID, leitura(180, 70, new BigDecimal("40.0")));

            verify(alertaRepo, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Deduplicação por janela de 5 minutos")
    class Deduplicacao {

        @Test
        @DisplayName("Alerta duplicado dentro de 5 min é suprimido")
        void duplicadoDentroDaJanelaEhSuprimido() {
            // Último alerta de TAQUICARDIA foi há 2 minutos.
            Alerta ultimo = alertaJaExistente(TipoAlerta.TAQUICARDIA, TS.minusSeconds(120));
            when(alertaRepo.findFirstByPacienteIdAndTipoOrderByTimestampDesc(PACIENTE_ID, TipoAlerta.TAQUICARDIA))
                    .thenReturn(Optional.of(ultimo));

            sinalBpmEnvia(125);

            verify(alertaRepo, never()).save(any());
            verify(realtimePublisher, never()).publicarAlerta(any());
        }

        @Test
        @DisplayName("Alerta após 5 min da última violação gera novo alerta")
        void aposJanelaGeraNovoAlerta() {
            // Último alerta de TAQUICARDIA foi há 6 minutos.
            Alerta ultimo = alertaJaExistente(TipoAlerta.TAQUICARDIA, TS.minusSeconds(360));
            when(alertaRepo.findFirstByPacienteIdAndTipoOrderByTimestampDesc(PACIENTE_ID, TipoAlerta.TAQUICARDIA))
                    .thenReturn(Optional.of(ultimo));

            sinalBpmEnvia(125);

            verify(alertaRepo).save(any());
            verify(realtimePublisher).publicarAlerta(any());
        }
    }

    @Nested
    @DisplayName("Eventos de queda")
    class Queda {

        @Test
        @DisplayName("Queda com intensidade ≥ 2.5 é CRITICA")
        void quedaForteEhCritica() {
            avaliador.registrarQueda(PACIENTE_ID, 3.1, TS);

            Alerta a = capturarAlertaSalvo();
            assertThat(a.getTipo()).isEqualTo(TipoAlerta.QUEDA);
            assertThat(a.getSeveridade()).isEqualTo(Severidade.CRITICA);
        }

        @Test
        @DisplayName("Queda com intensidade < 2.5 é ALTA")
        void quedaLeveEhAlta() {
            avaliador.registrarQueda(PACIENTE_ID, 1.8, TS);

            assertThat(capturarAlertaSalvo().getSeveridade()).isEqualTo(Severidade.ALTA);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void sinalBpmEnvia(int bpm) {
        avaliador.avaliarLeitura(PACIENTE_ID, leitura(bpm, null, null));
    }

    private Leitura leitura(Integer bpm, Integer spo2, BigDecimal temp) {
        Leitura l = new Leitura();
        l.setPacienteId(PACIENTE_ID);
        l.setBpm(bpm);
        l.setSpo2(spo2);
        l.setTemperatura(temp);
        l.setTimestamp(TS);
        return l;
    }

    private Alerta alertaJaExistente(TipoAlerta tipo, Instant ts) {
        Alerta a = new Alerta();
        a.setPacienteId(PACIENTE_ID);
        a.setTipo(tipo);
        a.setTimestamp(ts);
        a.setSeveridade(Severidade.ALTA);
        a.setAtendido(false);
        return a;
    }

    private Alerta capturarAlertaSalvo() {
        ArgumentCaptor<Alerta> cap = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepo).save(cap.capture());
        verify(realtimePublisher).publicarAlerta(eq(cap.getValue()));
        return cap.getValue();
    }
}
