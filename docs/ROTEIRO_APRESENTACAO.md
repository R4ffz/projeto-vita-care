# VitaCare IoT — Roteiro de apresentação

Roteiro para apresentação de **12 a 15 minutos**, estruturado em sete blocos.
Cada bloco indica tempo aproximado, foco da fala e ações na tela.

## Antes de começar

Checklist (5 min antes):

1. Stack subindo e estável (`docker compose ps` mostra 5 containers `healthy`).
2. Navegador aberto em **3 abas**:
   - http://localhost:3000/central (Central de monitoramento)
   - http://localhost:3000/pacientes/1 (Dashboard de Maria das Graças)
   - http://localhost:3000/simulador (Painel do simulador)
3. Terminal extra aberto e pronto para `curl` (para disparar eventos manualmente
   se o painel falhar).
4. Logado como **`admin@vitacare.local` / `admin123`**.
5. Garantir que **nenhum alerta de QUEDA do paciente 3** foi gerado nos últimos
   5 minutos (caso contrário, a queda de demonstração será suprimida pelo
   dedup). Se necessário, esperar ou disparar a queda no paciente 1 ou 2.

---

## 1. Abertura e problema (0–2 min)

Idosos vivendo sozinhos ou com supervisão parcial enfrentam risco aumentado de
eventos clínicos silenciosos. Detecção tardia leva a complicações graves e
internações que poderiam ser evitadas com monitoramento contínuo.

O VitaCare IoT modela esse cenário: uma plataforma que coleta sinais vitais
continuamente, aplica regras automáticas e entrega alertas em tempo real para
a equipe de cuidado.

> **Slide ou fala**: 30 % dos idosos vivem sozinhos; o tempo médio até a
> intervenção em eventos como queda é o principal preditor de prognóstico.

---

## 2. Arquitetura (2–4 min)

Apresentar o diagrama de quatro camadas (ver `docs/ARQUITETURA.md`):

1. **Dispositivos** (simulada) — simulador Node.js publica MQTT como se
   fosse um ESP32.
2. **Rede** — broker Mosquitto distribui as mensagens.
3. **Processamento** — backend Spring Boot consome MQTT, persiste em
   PostgreSQL, avalia regras de alerta e empurra eventos via WebSocket.
4. **Aplicação** — frontend React em SPA com central, dashboard e painel.

**Mensagem-chave**: cada camada pode ser substituída de forma independente.
O backend não sabe — e não precisa saber — se a leitura veio de um sensor
físico ou de um simulador. Os contratos (tópico MQTT + formato do payload)
são os mesmos.

---

## 3. Stack (4–6 min)

| Camada | Tecnologia |
|---|---|
| Simulador | Node.js + `mqtt.js` + Express |
| Broker | Eclipse Mosquitto 2.0 |
| Backend | Java 17 + Spring Boot 3.5 (Web, JPA, Security, WebSocket) + Eclipse Paho + Flyway + JJWT |
| Banco | PostgreSQL 16 |
| Frontend | React 18 + TypeScript + Vite + Tailwind + Recharts + `@stomp/stompjs` |
| Infra | Docker Compose (5 serviços na rede bridge `vitacare`) |

**Justificativa rápida** (não precisa explicar cada uma):

- Java + Spring Boot + PostgreSQL é o padrão de sistemas corporativos e
  governamentais brasileiros (incluindo hospitalares e o ecossistema do SUS).
- Eclipse Paho é a biblioteca MQTT padrão para Java.
- React + Vite oferece dev experience moderna sem o peso de frameworks
  full-stack.
- Docker Compose dá reprodutibilidade — mesmo comando sobe tudo no notebook
  da banca ou em produção.

---

## 4. Demonstração — operação normal (6–8 min)

**Ação 1**: abrir a **Central de monitoramento** (http://localhost:3000/central).

Falar sobre o que aparece:

- Faixa clínica no topo com saudação contextual e contagem de pacientes em
  cada estado.
- Triagem visual por gravidade — "Requer atenção" em destaque, "Estáveis"
  em cards compactos.
- "Atividade clínica recente" — feed dos últimos alertas em tempo real.

**Ação 2**: abrir o **Dashboard de Maria das Graças** (clicar no card ou ir
em http://localhost:3000/pacientes/1).

Mostrar:

- Cards de BPM, SpO₂ e Temperatura atualizando ao vivo (vide o indicador
  "ao vivo" no card "Status da conexão" — pulso verde).
- Faixa de referência (`normal 50–100`) visível abaixo de cada valor.
- Pequenos detalhes técnicos no card de status: tópico MQTT e canal STOMP do
  paciente.

**Ponto-chave**: as leituras chegam a cada ~5 s sem que a página seja
recarregada. É o WebSocket STOMP entregando.

---

## 5. Demonstração — alerta (8–10 min)

**Ação 3**: abrir o **Painel do simulador** (http://localhost:3000/simulador).

**Ação 4**: clicar **Taquicardia** no card de **João Carlos (#2)**.

O que esperar:

- O card no painel destaca o botão "Taquicardia" como ativo, badge "Atenção"
  aparece à direita.
- Na Central (outra aba), em ~5 s, João Carlos sobe para "Requer atenção"
  com fundo âmbar e botão "Atender →".
- A faixa clínica no topo muda de "0 em atenção" para "1 em atenção".
- No Dashboard do paciente 2, BPM sobe para ~140, cards mudam para borda
  vermelha, e em poucos segundos um **AlertaEvent** chega via WebSocket
  para "Alertas recentes".

**Falar**: a regra clínica é simples — se BPM > 100, gera alerta
TAQUICARDIA. Se for o primeiro em 5 minutos, é registrado; senão, é
suprimido por deduplicação para evitar ruído.

**Ação 5**: voltar ao painel e clicar **Reset** em João Carlos. O paciente
volta para "Estáveis" no próximo tick.

---

## 6. Demonstração — queda (10–12 min)

**Ação 6**: ainda no Painel do simulador, clicar **Queda** em **Antônio
Mendes (#3)**.

O que esperar:

- Resposta imediata (queda é evento pontual, não periódico).
- Se o Dashboard do paciente 3 estiver aberto em outra aba, **abre o Modal
  de Emergência** em tela cheia:
  - Faixa vermelha no topo: *"Alerta crítico — atenção imediata"*
  - Título em serif: *"Queda detectada"*
  - Nome do paciente, idade, intensidade da queda, horário
  - Botão **"Marcar como atendido"**
- Na lista de Alertas, a nova entrada vem com borda vermelha à esquerda e
  ícone hexagonal de emergência.

**Ação 7**: clicar **"Marcar como atendido"** no modal. O alerta vai para
status "Atendido", o destaque vermelho some, e a Central reflete a mudança.

**Falar**: severidade `CRITICA` é atribuída quando a intensidade da queda é
≥ 2,5 g. Abaixo disso, é `ALTA`. O modal só abre para a combinação
`QUEDA + CRITICA + !atendido`.

---

## 7. Justificativa técnica e conclusão (12–15 min)

**Por que simulador em vez de hardware?**

A camada de dispositivos foi a única não implementada em hardware. A
decisão foi consciente: concentrar esforço nas camadas de arquitetura,
protocolo, processamento e visualização — entregando essas quatro camadas
em profundidade — em vez de dividir tempo com calibração de sensores
biomédicos de baixo custo e variabilidade de leitura.

Os tópicos MQTT, formatos de payload, regras de alerta e fluxo de
WebSocket são exatamente os mesmos que um dispositivo físico precisaria.
Substituir o simulador por um ESP32 com MAX30102 + DS18B20 + acelerômetro
seria um trabalho isolado — backend, banco, broker e frontend não mudam.

**Em produção real**, dados de saúde são considerados sensíveis pela LGPD
e exigiriam consentimento explícito, criptografia em trânsito e em
repouso, controle de acesso granular e auditoria — pontos que este
protótipo não cobre, e que estariam fora do escopo da disciplina.

**Encerramento**:

> "Mais segurança para quem precisa.
> Mais tranquilidade para quem ama."

---

## Caso algo dê errado durante a demo

| Sintoma | Causa provável | Ação |
|---|---|---|
| Card do paciente fica "Offline" | Simulador parou de publicar | `docker compose restart simulator` |
| Backend retorna 401 | Token JWT expirou (8 h) | Logar novamente |
| Clicar "Queda" não gera alerta | Dedup de 5 min ativo para esse paciente | Esperar 5 min ou disparar em outro paciente; alternativamente `curl -X POST .../queda` num paciente diferente |
| Modal de emergência não abre | Dashboard não estava aberto na hora ou intensidade < 2,5 | Reabrir Dashboard antes; usar `{"intensidade":3.2}` |
| Tudo offline | Docker Desktop hibernou | `docker compose up -d` |
| Frontend não atualizou após mudança | Imagem Docker antiga | `docker compose up -d --build frontend` |

Comandos úteis para "puxar do bolso":

```bash
docker compose ps                                        # estado dos containers
docker compose logs -f backend                           # acompanhar Spring
docker exec -it vitacare-mosquitto \
  mosquitto_sub -h localhost -t 'pacientes/+/sinais' -v  # espia MQTT
curl http://localhost:4000/sim/status                    # estado do simulador
```
