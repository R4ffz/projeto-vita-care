-- VitaCare IoT - Schema inicial
-- Tabelas do domínio: pacientes, leituras, alertas, limites_config.

-- ============================================================================
-- pacientes
-- Cadastro de idosos monitorados.
-- ============================================================================
CREATE TABLE pacientes (
    id                  BIGSERIAL    PRIMARY KEY,
    nome                VARCHAR(150) NOT NULL,
    idade               INTEGER      NOT NULL CHECK (idade BETWEEN 0 AND 130),
    contato_emergencia  VARCHAR(150),
    foto_url            TEXT,
    criado_em           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- leituras
-- Sinais vitais publicados pelo simulador (e, no futuro, por um ESP32 real).
-- ============================================================================
CREATE TABLE leituras (
    id           BIGSERIAL    PRIMARY KEY,
    paciente_id  BIGINT       NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    bpm          INTEGER,
    spo2         INTEGER,
    temperatura  NUMERIC(4,1),
    timestamp    TIMESTAMPTZ  NOT NULL
);

-- Índice composto para consultas de histórico por paciente em ordem decrescente.
CREATE INDEX idx_leituras_paciente_timestamp
    ON leituras (paciente_id, timestamp DESC);

-- ============================================================================
-- alertas
-- Eventos disparados por violação de limite ou detecção de queda.
-- ============================================================================
CREATE TABLE alertas (
    id            BIGSERIAL    PRIMARY KEY,
    paciente_id   BIGINT       NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo          VARCHAR(50)  NOT NULL,
    valor_medido  NUMERIC(6,2),
    severidade    VARCHAR(20)  NOT NULL
                  CHECK (severidade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
    atendido      BOOLEAN      NOT NULL DEFAULT FALSE,
    timestamp     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alertas_paciente_timestamp
    ON alertas (paciente_id, timestamp DESC);

-- Índice parcial para a fila de alertas ainda não atendidos.
CREATE INDEX idx_alertas_pendentes
    ON alertas (timestamp DESC)
    WHERE atendido = FALSE;

-- ============================================================================
-- limites_config
-- Limites de sinais vitais (1:1 com paciente). Por enquanto os valores são
-- iguais para todos (limites clínicos globais); customização por paciente
-- entra como funcionalidade desejável após o MVP.
-- ============================================================================
CREATE TABLE limites_config (
    id           BIGSERIAL     PRIMARY KEY,
    paciente_id  BIGINT        NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
    bpm_min      INTEGER       NOT NULL DEFAULT 50,
    bpm_max      INTEGER       NOT NULL DEFAULT 100,
    spo2_min     INTEGER       NOT NULL DEFAULT 92,
    temp_max     NUMERIC(4,1)  NOT NULL DEFAULT 37.8
);
