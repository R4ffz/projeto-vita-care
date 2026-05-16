# VitaCare IoT

Aplicação web de monitoramento contínuo de sinais vitais de idosos em ambiente domiciliar, baseada em arquitetura IoT de quatro camadas, com a camada de dispositivos representada por um simulador de software.

> ⚠️ **Protótipo acadêmico.** Este sistema utiliza **dados simulados** e foi desenvolvido como trabalho da disciplina de Internet das Coisas. **Não substitui** atendimento médico, exames clínicos ou serviços de emergência.

---

## Arquitetura resumida

```
┌──────────────────┐   MQTT publish    ┌─────────────────┐
│   Simulador      │  pacientes/{id}/  │                 │
│   Node.js        │ ──── sinais ────▶ │   Mosquitto     │
│   (dispositivo   │ ──── queda  ────▶ │   (broker MQTT) │
│    IoT virtual)  │ ◀── comando ───── │                 │
└──────────────────┘                   └────────┬────────┘
                                                │ subscribe
                                                ▼
┌──────────────────────────────────────────────────────────┐
│            Backend Spring Boot (Java 17, Maven)          │
│                                                          │
│  Spring Integration MQTT ─▶ Service de leituras          │
│                              │                           │
│                              ├─▶ JPA ─▶ PostgreSQL       │
│                              ├─▶ Avaliador de regras     │
│                              └─▶ STOMP broker            │
│                                                          │
│  API REST + WebSocket/STOMP                              │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│         Frontend React (Vite + TS + Tailwind)            │
│  Login · Central · Dashboard · Histórico · Alertas       │
│  Painel do simulador  +  badge "MODO SIMULAÇÃO"          │
└──────────────────────────────────────────────────────────┘
```

Quatro camadas IoT:

1. **Dispositivos** — simulador Node.js publicando sinais vitais virtuais.
2. **Rede** — broker MQTT Mosquitto distribuindo mensagens entre publicadores e assinantes.
3. **Processamento** — backend Spring Boot consumindo MQTT, persistindo em PostgreSQL, aplicando regras de alerta e emitindo eventos em tempo real.
4. **Aplicação** — frontend React exibindo dashboard, histórico, alertas e painel do simulador.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Simulador | Node.js 20+, `mqtt.js` |
| Broker MQTT | Mosquitto 2.x |
| Backend | Java 17, Spring Boot 3 (Web, Data JPA, Security, WebSocket), Spring Integration MQTT, Flyway, JWT |
| Banco de dados | PostgreSQL 16 |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Axios, `@stomp/stompjs` + SockJS, Chart.js |
| Build backend | Maven |
| Infra local | Docker Compose |
| Documentação da API | Springdoc OpenAPI / Swagger UI |

---

## Estrutura do repositório

| Pasta / arquivo | Conteúdo |
|---|---|
| `backend/` | Aplicação Java Spring Boot — API REST, consumidor MQTT, regras de alerta, broadcast WebSocket/STOMP. |
| `frontend/` | Aplicação React + Vite + TypeScript — UI completa do sistema (login, dashboard, histórico, alertas, painel do simulador). |
| `simulator/` | Simulador Node.js que publica sinais vitais e eventos no broker MQTT e escuta tópicos de comando vindos do backend. |
| `docs/` | Documentação técnica complementar — diagramas, contratos MQTT, decisões de arquitetura, roteiro de apresentação. |
| `docker-compose.yml` | Orquestração local dos serviços de infraestrutura (PostgreSQL + Mosquitto). |
| `.gitignore` | Padrões de arquivos ignorados pelo Git (Java, Node, React, Docker, IDEs, SO). |

---

## Como rodar

A documentação de execução de cada serviço será preenchida nas próximas fases. Por enquanto, a infraestrutura local pode ser iniciada com:

```bash
docker compose up -d
```

Isso sobe:

- PostgreSQL em `localhost:5432` (database `vitacare`, usuário `vitacare`, senha `vitacare`).
- Mosquitto em `localhost:1883` (acesso anônimo, apenas para desenvolvimento local).

---



