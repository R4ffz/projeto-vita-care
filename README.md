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
| `mosquitto.conf` | Configuração do broker Mosquitto para desenvolvimento local. |
| `.gitignore` | Padrões de arquivos ignorados pelo Git (Java, Node, React, Docker, IDEs, SO). |

---

## Como rodar

Esta fase do projeto sobe apenas a **infraestrutura local** (PostgreSQL + Mosquitto). Backend, frontend e simulador são adicionados nas próximas fases.

### Pré-requisitos

- Docker Desktop (Windows / macOS) ou Docker Engine + Docker Compose v2.20+ (Linux).

### Subir os serviços

```bash
docker compose up -d
```

Isso sobe:

- **PostgreSQL** em `localhost:5432` — database `vitacare`, usuário `vitacare`, senha `vitacare_dev`.
- **Mosquitto** em `localhost:1883` — acesso anônimo, apenas para desenvolvimento local.

Verificar status e logs:

```bash
docker compose ps                # ambos devem aparecer "running" (Postgres "healthy")
docker compose logs -f           # acompanhar logs (Ctrl+C para sair)
```

### Testar o PostgreSQL

```bash
docker exec -it vitacare-postgres psql -U vitacare -d vitacare -c "SELECT version();"
```

Deve retornar a versão do PostgreSQL 16.

### Testar o Mosquitto

Em **um terminal**, abra um subscriber escutando um tópico de teste:

```bash
docker exec -it vitacare-mosquitto mosquitto_sub -h localhost -t "vitacare/teste" -v
```

(O terminal fica bloqueado aguardando mensagens.)

Em **outro terminal**, publique uma mensagem:

```bash
docker exec -it vitacare-mosquitto mosquitto_pub -h localhost -t "vitacare/teste" -m "ola VitaCare"
```

No primeiro terminal deve aparecer:

```
vitacare/teste ola VitaCare
```

Teste opcional com a estrutura real de tópicos que o projeto vai usar:

```bash
# Em um terminal: escuta sinais de qualquer paciente
docker exec -it vitacare-mosquitto mosquitto_sub -h localhost -t "pacientes/+/sinais" -v

# Em outro terminal: publica um sinal vital de exemplo
docker exec -it vitacare-mosquitto mosquitto_pub -h localhost -t "pacientes/1/sinais" -m '{"bpm":78,"spo2":97,"temp":36.8}'
```

> Se você tiver os clientes Mosquitto instalados localmente (`mosquitto-clients` no Linux, `mosquitto` via Homebrew no macOS, instalador oficial no Windows), pode rodar os mesmos comandos removendo o prefixo `docker exec -it vitacare-mosquitto`.

### Parar os serviços

```bash
docker compose down              # para os containers, mantém o volume do Postgres
docker compose down -v           # para tudo e apaga os dados persistidos do Postgres
```

---

## Subir a stack completa via Docker (backend + frontend)

A partir desta fase, o `docker-compose.yml` também sobe **backend Spring Boot** e
**frontend React** dockerizados. O simulador Node.js continua rodando **fora** do
compose (execute `cd simulator && npm start` em outro terminal).

### Pré-requisitos

- Docker Desktop (Windows / macOS) ou Docker Engine + Compose v2.20+ (Linux).
- Node.js 20+ apenas se for rodar o simulador local.

### Subir tudo do zero

```bash
docker compose up --build -d     # builda imagens e sobe os 4 serviços
docker compose ps                # backend e frontend devem aparecer 'healthy'
docker compose logs -f backend   # acompanhar logs do Spring
```

A primeira build demora ~2–4 min (download do Maven + npm). Builds subsequentes
reaproveitam o cache (segundos).

### Limpar e recomeçar

```bash
docker compose down              # para tudo, mantém volume do Postgres
docker compose down -v           # para tudo e apaga o banco
docker compose build --no-cache  # força rebuild sem cache
```

### Acessos

| Serviço     | URL / porta                          | Credencial / observação |
|---|---|---|
| Frontend    | http://localhost:3000                | login JWT (ver abaixo) |
| Backend REST| http://localhost:8080/api            | exposto direto para curl/Postman |
| `/api/health` | http://localhost:8080/api/health   | público (sem token) |
| Backend via proxy | http://localhost:3000/api/…    | nginx do frontend encaminha |
| WebSocket   | ws://localhost:3000/ws (via proxy) ou ws://localhost:8080/ws | STOMP nativo |
| PostgreSQL  | localhost:5432, db `vitacare`        | user `vitacare` / pwd `vitacare_dev` |
| Mosquitto   | localhost:1883                       | anônimo (dev) |
| Simulator (host) | http://localhost:4000/sim       | rodar `cd simulator && npm start` |

> **Swagger não está habilitado** neste protótipo. Endpoints REST estão
> documentados no README do backend.

### Credenciais de login (seed)

| E-mail | Senha | Perfil |
|---|---|---|
| `admin@vitacare.local`      | `admin123`        | ADMIN |
| `enfermagem@vitacare.local` | `profissional123` | PROFISSIONAL |
| `cuidador@vitacare.local`   | `cuidador123`     | CUIDADOR |

### Variáveis de ambiente opcionais

Copie `.env.example` para `.env` na raiz para sobrescrever senha do Postgres ou
o secret do JWT. Defaults adequados para dev já vêm setados.

### Arquitetura Docker

```
  navegador  ──── http://localhost:3000 ────▶  vitacare-frontend (nginx)
                                                   │
                                                   │ /api/* /ws (reverse proxy)
                                                   ▼
                                              vitacare-backend (Spring Boot)
                                                   │
                              ┌────────────────────┼──────────────────────┐
                              ▼                    ▼                      ▼
                         postgres:5432        mosquitto:1883        (futuro)
                       (vitacare-postgres) (vitacare-mosquitto)

  navegador  ──── http://localhost:4000 ────▶  simulator (Node, no host)
                                                   │
                                                   │ MQTT publish
                                                   ▼
                                          localhost:1883 ──▶ vitacare-mosquitto
                                          (port forwarding)
```

Rede `vitacare` (bridge) liga os 4 containers. O simulador permanece no host
para facilitar controle durante a demonstração (CLI no terminal).

