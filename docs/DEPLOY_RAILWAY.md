# Deploy no Railway

Guia para subir a stack inteira do VitaCare IoT (PostgreSQL + Mosquitto +
backend + frontend + simulador) em um único projeto Railway.

> **Pré-requisito:** projeto Railway já criado e linkado ao repositório
> [`R4ffz/projeto-vita-care`](https://github.com/R4ffz/projeto-vita-care).

---

## Visão geral

O Railway não roda `docker-compose` — cada componente vira um serviço
independente, todos dentro do mesmo projeto. A comunicação entre eles
acontece pela rede privada interna (`*.railway.internal`).

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │───▶│   Backend    │───▶│  PostgreSQL  │
│   (nginx)    │    │ (Spring Boot)│    │   (plugin)   │
└──────┬───────┘    └──────┬───────┘    └──────────────┘
       │                   │
       │ público            │ MQTT
       ▼                   ▼
   ┌──────────┐      ┌──────────────┐
   │ Usuário  │      │  Mosquitto   │◀──┐
   └──────────┘      └──────────────┘   │
                                    ┌───┴──────────┐
                                    │  Simulador   │
                                    └──────────────┘
```

---

## 1. Adicionar PostgreSQL

No painel do projeto, clique em **Add → Database → PostgreSQL**.
Aceite os defaults. O serviço será criado com o nome **Postgres** e
exporá as variáveis: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`,
`PGPASSWORD`, `DATABASE_URL`.

---

## 2. Criar serviço **mosquitto**

1. **Add → GitHub Repo → projeto-vita-care**
2. Em **Settings → Source**, configure:
   - **Root Directory:** `mosquitto`
3. Em **Settings → Networking**, **não** habilite domínio público
   (o broker é consumido só internamente).
4. Renomeie o serviço para `mosquitto`.

Sem variáveis de ambiente necessárias. O `railway.json` da pasta já
aponta para o `Dockerfile` que constrói a imagem do Mosquitto com a
`mosquitto.conf` embarcada (listener TCP 1883, anonymous habilitado).

---

## 3. Criar serviço **backend**

1. **Add → GitHub Repo → projeto-vita-care** (mesmo repo, novo serviço).
2. **Settings → Source → Root Directory:** `backend`.
3. Renomeie para `backend`.
4. Em **Variables**, adicione:

   | Variável | Valor |
   |---|---|
   | `PORT` | `8080` |
   | `SPRING_PROFILES_ACTIVE` | `docker` |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
   | `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
   | `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
   | `MQTT_BROKER_URL` | `tcp://${{mosquitto.RAILWAY_PRIVATE_DOMAIN}}:1883` |
   | `VITACARE_SECURITY_JWT_SECRET` | gere com `openssl rand -base64 48` |

   > As referências `${{Postgres.VAR}}` e `${{mosquitto.VAR}}` são
   > resolvidas automaticamente pelo Railway a partir do **nome** dos
   > serviços vizinhos — confira se os nomes batem.

5. **Settings → Networking → Public Networking → Generate Domain**
   (opcional, útil pra testar a API direto). A porta exposta deve ser
   `8080` (mesma de `PORT`).

---

## 4. Criar serviço **frontend**

1. **Add → GitHub Repo → projeto-vita-care** (novo serviço, mesmo repo).
2. **Settings → Source → Root Directory:** `frontend`.
3. Renomeie para `frontend`.
4. Em **Variables**, adicione:

   | Variável | Valor |
   |---|---|
   | `BACKEND_HOST` | `${{backend.RAILWAY_PRIVATE_DOMAIN}}:8080` |
   | `NGINX_PORT` | `80` |

5. **Settings → Networking → Public Networking → Generate Domain**
   (esta é a URL que os usuários acessam). Porta exposta: `80`.

O nginx do frontend faz reverse proxy de `/api/` e `/ws` para
`backend.railway.internal:8080`, então o navegador faz tudo no mesmo
host e CORS não entra em jogo.

---

## 5. Criar serviço **simulator**

1. **Add → GitHub Repo → projeto-vita-care** (novo serviço).
2. **Settings → Source → Root Directory:** `simulator`.
3. Renomeie para `simulator`.
4. Em **Variables**, adicione:

   | Variável | Valor |
   |---|---|
   | `MQTT_URL` | `mqtt://${{mosquitto.RAILWAY_PRIVATE_DOMAIN}}:1883` |
   | `MQTT_CLIENT_ID` | `vitacare-simulator` |
   | `PATIENT_IDS` | `1,2,3` |
   | `SINAIS_INTERVAL_MS` | `5000` |
   | `STATUS_INTERVAL_MS` | `30000` |
   | `CONTROL_PORT` | `4000` |

5. **Networking:** não precisa de domínio público — o painel do
   simulador no frontend só funciona em dev local (proxy do Vite).
   Se quiser controlar o simulador em produção, gere um domínio público
   e ajuste o frontend para incluir `/sim/*` no reverse proxy.

---

## Ordem de deploy

O Railway resolve as referências `${{servico.VAR}}` mesmo se o serviço
de destino ainda não estiver deployado, então a ordem não é estrita.
Recomendado:

1. **Postgres** (sobe sozinho em segundos).
2. **mosquitto** (build da imagem ~30s).
3. **backend** (build do JAR ~3-5min na primeira vez).
4. **frontend** (build do bundle Vite + nginx ~2min).
5. **simulator** (npm ci + start, ~1min).

---

## Verificação

- Acesse o domínio público do **frontend**: a SPA deve carregar.
- `GET /api/health` (via domínio público do frontend ou do backend)
  deve retornar `{"status":"UP",...}`.
- Logs do **backend** devem mostrar `Connected to MQTT broker` apontando
  para `mosquitto.railway.internal`.
- Logs do **simulator** devem mostrar publicações periódicas.

---

## Custos

5 serviços + Postgres em um único projeto. No plano gratuito/trial,
o uso de CPU do Spring Boot na inicialização (JIT) costuma ser o maior
consumidor. Considere:

- Configurar `JAVA_OPTS=-XX:+UseSerialGC -Xmx256m` no backend para
  reduzir RAM (em **Variables**).
- Pausar `simulator` quando não estiver demonstrando, para economizar
  horas-CPU.

---

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Backend `Build failed` sem logs | Root Directory não setado — Railway tenta buildar a raiz do monorepo. |
| Backend sobe mas `502` no frontend | `BACKEND_HOST` errado, ou backend não escutando em `PORT=8080`. |
| Backend reinicia em loop | Postgres ainda não pronto OU `MQTT_BROKER_URL` aponta para um Mosquitto inexistente. |
| `unauthorized` no MQTT | `mosquitto.conf` exige auth e o backend/simulator não fornecem credenciais. Aqui usamos `allow_anonymous true` — verifique se o arquivo correto foi embarcado na imagem. |
| Frontend mostra HTML mas API quebra | Confirme que o domínio público está apontando pra **porta 80** do frontend (e não pra outra porta). |
