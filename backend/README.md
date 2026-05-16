# Backend — VitaCare IoT

Aplicação Spring Boot que servirá a API REST, consumirá MQTT, persistirá no PostgreSQL, aplicará regras de alerta e fará broadcast em tempo real via WebSocket/STOMP.

Esta fase entrega apenas a **fundação** do backend: projeto Maven funcional, conexão Postgres, Flyway pronto, health check e CORS para o frontend local. MQTT, autenticação, entidades e endpoints de negócio entram nas próximas fases.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | Java 17 |
| Framework | Spring Boot 3.5.14 |
| Build | Maven (com Maven Wrapper) |
| Web | Spring Web (Tomcat embarcado) |
| Persistência | Spring Data JPA + Hibernate |
| Banco | PostgreSQL 16 |
| Migrações | Flyway |
| Tempo real | Spring WebSocket |
| Validação | Jakarta Bean Validation |
| Boilerplate | Lombok |

## Pré-requisitos

- JDK 17+ (validado com Temurin 21).
- Maven 3.8+ (ou o wrapper incluso: `./mvnw` / `.\mvnw.cmd`).
- Infraestrutura local rodando na raiz do monorepo:

```bash
# Na raiz do monorepo (projeto-vita-care/)
docker compose up -d
```

## Configuração

A aplicação lê de [src/main/resources/application.yml](src/main/resources/application.yml):

- **PostgreSQL**: `jdbc:postgresql://localhost:5432/vitacare` — usuário `vitacare`, senha `vitacare_dev`.
- **Porta HTTP**: `8080`.
- **Flyway**: habilitado, lê de `classpath:db/migration` (ainda sem migrações nesta fase).
- **JPA**: `ddl-auto: none` — o schema é responsabilidade exclusiva do Flyway.
- **CORS**: libera `http://localhost:5173` e `http://localhost:3000` em `/api/**`.

## Como rodar

A partir da pasta `backend/`:

```powershell
# Compilar
.\mvnw.cmd clean compile

# Subir o servidor (Postgres precisa estar rodando)
.\mvnw.cmd spring-boot:run
```

No Linux / macOS, troque `.\mvnw.cmd` por `./mvnw`.

A aplicação inicia em `http://localhost:8080`.

## Health check

```powershell
curl http://localhost:8080/api/health
```

Resposta esperada:

```json
{
  "status": "UP",
  "service": "vitacare-backend",
  "timestamp": "2026-05-16T20:00:00.000Z"
}
```

## Estrutura de pacotes

```
com.vitacare
├── VitacareBackendApplication.java   bootstrap do Spring Boot
├── config/
│   └── CorsConfig.java               CORS para o frontend local
└── health/
    └── HealthController.java         endpoint GET /api/health
```

## Próximas fases

- Auth (Spring Security + JWT).
- Entidades JPA + migrações Flyway (`pacientes`, `leituras`, `alertas`, `limites_config`, `usuarios`).
- CRUD `pacientes` + Swagger.
- Consumo MQTT (Spring Integration MQTT).
- Regras de alerta + broadcast WebSocket/STOMP.
