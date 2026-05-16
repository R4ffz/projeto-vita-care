-- Dados iniciais para testes: três pacientes simulados representando os
-- perfis citados no documento técnico (saudável, hipertenso, idoso frágil).
-- Os limites usam os valores clínicos globais da SEÇÃO 07 do PDF.

INSERT INTO pacientes (nome, idade, contato_emergencia, foto_url) VALUES
    ('Maria das Graças Souza', 78, 'Joana Souza (filha) - (62) 99876-5432',    NULL),
    ('João Carlos Ferreira',   82, 'Rita Ferreira (esposa) - (62) 99765-4321', NULL),
    ('Antônio Mendes Lima',    89, 'Roberto Mendes (filho) - (62) 99654-3210', NULL);

INSERT INTO limites_config (paciente_id, bpm_min, bpm_max, spo2_min, temp_max)
SELECT id, 50, 100, 92, 37.8
FROM pacientes
WHERE nome IN (
    'Maria das Graças Souza',
    'João Carlos Ferreira',
    'Antônio Mendes Lima'
);
