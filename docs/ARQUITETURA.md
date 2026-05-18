# VitaCare IoT — Arquitetura

Este documento descreve a arquitetura do VitaCare IoT em mais profundidade do
que o README. Foco: camadas IoT, fluxo de dados, justificativa do simulador e
caminho de migração para um dispositivo físico real.

---

## 1. Camadas IoT

O sistema adota o modelo clássico de **quatro camadas** de uma aplicação IoT,
com responsabilidades claras e contratos padronizados entre elas. Cada camada
pode ser desenvolvida, testada e substituída de forma independente.

| Camada | Componente | Tecnologia | Responsabilidade |
|---|---|---|---|
| **1. Dispositivos** *(simulada)* | `simulator/` | Node.js + `mqtt.js` + Express | Gerar dados fisiológicos por paciente virtual e publicar no broker MQTT. Expor API HTTP local para controle manual. |
| **2. Rede** | `mosquitto` | Eclipse Mosquitto 2.0 | Receber mensagens dos publicadores e entregá-las aos assinantes em tempo real, com QoS configurável. |
| **3. Processamento** | `backend/` | Java 17 + Spring Boot 3 + Eclipse Paho + JPA/Hibernate + Flyway + JJWT | Consumir mensagens MQTT, persistir leituras no PostgreSQL, avaliar regras clínicas, gerar alertas e empurrar eventos para o frontend. Servir API REST autenticada. |
| **4. Aplicação** | `frontend/` | React 18 + Vite + TypeScript + Tailwind + Recharts + `@stomp/stompjs` | Renderizar a central de monitoramento, dashboard de paciente, histórico, alertas e painel do simulador. Carga inicial por REST e atualização ao vivo por WebSocket/STOMP. |

Persistência (PostgreSQL 16) é compartilhada entre as camadas 3 e 4 — só o
backend tem conexão direta; o frontend acessa apenas via REST.

---

## 2. Fluxo de dados

### 2.1 Leitura periódica de sinais vitais

```
[Simulador]
   │
   │ a cada 5 s (configurável)
   │   PacienteVirtual.gerarSinal()
   │     { bpm, spo2, temp, ts }
   │
   ▼  MQTT publish
[Mosquitto] ── tópico: pacientes/{id}/sinais
   │
   ▼  MQTT subscribe (qos=1)
[Backend / MqttListener]
   │
   ▼  dispatch por sufixo do tópico
[MqttMessageProcessor.processarSinal]
   │
   ├─▶ leituraRepository.save(leitura)             ← PostgreSQL
   ├─▶ realtimePublisher.publicarLeitura(leitura)  ← STOMP /topic/pacientes/{id}/leituras
   └─▶ avaliadorAlertas.avaliarLeitura(...)        ← regras clínicas
          │
          │ se BPM, SpO₂ ou temp violar os limites:
          ▼
       alertaRepository.save(alerta)               ← PostgreSQL
       realtimePublisher.publicarAlerta(alerta)    ← STOMP /topic/pacientes/{id}/alertas
                                                   │       /topic/alertas
                                                   ▼       /topic/central
                                                [Frontend]
```

### 2.2 Evento pontual de queda

```
[Operador]
   │ clique "Queda" no Painel do Simulador
   ▼
[Frontend] ── POST http://localhost:4000/sim/{id}/queda  { intensidade }
   │
   ▼
[Simulator / controlServer.js]
   └─▶ publish MQTT em pacientes/{id}/queda
         { detectada: true, intensidade, ts }
         │
         ▼
[Backend / MqttMessageProcessor.processarQueda]
   └─▶ AvaliadorAlertas.registrarQueda(...)
        - severidade CRITICA se intensidade >= 2,5; senão ALTA
        - persiste no banco, publica em /topic/pacientes/{id}/alertas + /topic/alertas + /topic/central
         │
         ▼
[Frontend / DashboardPaciente]
   └─▶ EmergencyModal abre em tela cheia
   └─▶ Alertas recentes atualiza
```

### 2.3 Regra de deduplicação

Para cada par `(paciente, tipo)`, um novo alerta só é gerado se o último
alerta desse tipo nesse paciente foi há **5 minutos ou mais**. Enquanto a
violação persistir dentro da janela, leituras subsequentes ainda são
persistidas em `leituras`, mas não geram novos alertas. Quando a regra
suprime, o backend loga em nível INFO:

```
Alerta TAQUICARDIA para paciente 1 suprimido (dedup de 5 min, ainda dentro da janela)
```

---

## 3. Modelo de dados

Migrações Flyway em `backend/src/main/resources/db/migration/`:

| Versão | Conteúdo |
|---|---|
| `V1__init_schema.sql` | Tabelas `pacientes`, `leituras`, `alertas`, `limites_config` |
| `V2__seed_pacientes.sql` | 3 pacientes de demonstração + limites padrão |
| `V3__usuarios.sql` | Tabela `usuarios` (BCrypt + perfis `CUIDADOR/PROFISSIONAL/ADMIN`) |

Seed dos 3 usuários é feito em runtime (`UsuarioSeedRunner`), usando o
`PasswordEncoder` do Spring — evita hashes hardcoded na migration.

---

## 4. Topologia de rede e Docker

Os 5 serviços rodam isolados na rede bridge `vitacare`. Comunicação interna
usa nome do serviço como hostname (`postgres`, `mosquitto`, `backend`,
`frontend`, `simulator`). Portas expostas no host:

| Serviço | Porta host | Porta interna |
|---|---|---|
| `vitacare-postgres` | 5432 | 5432 |
| `vitacare-mosquitto` | 1883 | 1883 |
| `vitacare-backend` | 8080 | 8080 |
| `vitacare-frontend` (Nginx) | 3000 | 80 |
| `vitacare-simulator` | 4000 | 4000 |

O frontend faz reverse proxy de `/api/*` e `/ws` (com upgrade WebSocket)
para o backend dentro da rede. Isso permite que o navegador acesse
`http://localhost:3000/api/...` na mesma origem que a SPA — sem
configuração CORS adicional em produção.

Healthchecks: Postgres, backend, frontend e simulator. `depends_on:
service_healthy` garante ordem correta de inicialização.

---

## 5. Justificativa do simulador

A camada de dispositivos é a única não implementada em hardware. A decisão
foi tomada por critérios de **viabilidade, controle e robustez de
demonstração**:

- **Foco nas camadas de software.** A disciplina trata de arquitetura,
  protocolos e visualização — concentrar esforços nessas camadas resulta em
  entrega mais aprofundada que dividir o tempo com circuito e firmware.
- **Eliminação de pontos de falha.** Sensores biomédicos de baixo custo
  (MAX30102, DS18B20) apresentam variação grande de leitura, exigem
  calibração e dependem de Wi-Fi estável. A simulação remove esse risco em
  apresentação.
- **Escalabilidade.** O simulador roda múltiplos pacientes em paralelo —
  inviável com vários ESP32 físicos em uma sala.
- **Controle determinístico.** Eventos críticos (queda, taquicardia, febre)
  são acionados sob demanda via API/CLI, permitindo demonstração
  reprodutível.
- **Honestidade técnica.** O simulador publica nos mesmos tópicos e com o
  mesmo formato de payload que um ESP32 publicaria — o backend é
  agnóstico à origem dos dados.

---

## 6. Caminho para hardware real

A arquitetura está preparada para receber um dispositivo físico (ESP32 ou
equivalente) **sem alteração em backend, banco, broker ou frontend**.

### O que o dispositivo precisa fazer

1. Conectar via Wi-Fi a uma rede com acesso ao broker MQTT (`mosquitto`).
2. Publicar leituras de sinais vitais em
   `pacientes/{id}/sinais` no formato:
   ```json
   { "bpm": 78, "spo2": 97, "temp": 36.8, "ts": "2026-05-18T10:00:00Z" }
   ```
3. Publicar eventos de queda em `pacientes/{id}/queda`:
   ```json
   { "detectada": true, "intensidade": 2.7, "ts": "..." }
   ```
4. Publicar status online em `pacientes/{id}/status`:
   ```json
   { "online": true, "ts": "..." }
   ```

### Hardware sugerido (referência)

| Componente | Função |
|---|---|
| ESP32 (ou ESP8266) | MCU + Wi-Fi |
| MAX30102 | Oxímetro + frequência cardíaca |
| DS18B20 ou MLX90614 | Temperatura corporal |
| MPU6050 ou ADXL345 | Acelerômetro para detecção de queda |
| Bateria + módulo de carga | Autonomia em uso domiciliar |

### Bibliotecas Arduino/PlatformIO

- `PubSubClient` ou `Arduino MQTT` para comunicação com Mosquitto
- `ArduinoJson` para montar os payloads
- Driver específico de cada sensor

### Procedimento de troca

1. Provisionar o dispositivo com SSID/senha da rede e endereço do broker
   (`mqtt://<host>:1883`).
2. Configurar `client_id` único por dispositivo (ex. `vitacare-esp32-001`).
3. Iniciar o firmware. O backend já assina `pacientes/+/sinais`,
   `pacientes/+/queda` e `pacientes/+/status` — começará a receber os dados
   automaticamente.
4. **Opcional**: parar o container `vitacare-simulator` para evitar
   convivência de dados simulados e reais durante a transição
   (`docker compose stop simulator`).

Nada precisa ser tocado no backend, banco, broker ou frontend.

### Considerações de produção

Uma implantação real exigiria:

- **Autenticação no broker MQTT** (usuário + senha ou mTLS) e
  segmentação por dispositivo.
- **TLS no canal MQTT** (porta 8883) e HTTPS no frontend.
- **LGPD**: dados de saúde são sensíveis — consentimento explícito,
  criptografia em trânsito e em repouso, controle granular de acesso,
  direito de exclusão.
- **Backup e retenção** definidos para a tabela `leituras`, que cresce
  rapidamente (uma leitura a cada poucos segundos por dispositivo).
- **Observabilidade**: métricas (Prometheus/Micrometer) e logs estruturados.
