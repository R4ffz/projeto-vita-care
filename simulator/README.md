# VitaCare IoT — Simulador

Simulador de **dispositivos IoT virtuais** que substitui o ESP32 no protótipo acadêmico do VitaCare IoT.

Para o backend, este simulador é **indistinguível de um dispositivo real**: conecta no mesmo broker MQTT, publica nos mesmos tópicos (`pacientes/{id}/sinais`, `pacientes/{id}/queda`, `pacientes/{id}/status`) e usa o mesmo formato de payload JSON. Trocar o simulador por hardware real exige apenas apontar o ESP32 para o broker — nada muda no resto do sistema.

> Esta é a camada de **dispositivos** do projeto. A justificativa técnica para usar simulador no lugar de hardware está no documento técnico do VitaCare IoT (seção 2).

---

## Stack

- Node.js 20+
- [`mqtt.js`](https://github.com/mqttjs/MQTT.js) — cliente MQTT
- `express` — endpoint HTTP de controle (consumido pelo painel do simulador no frontend)
- `dotenv` — configuração via `.env`

## Pré-requisitos

1. Broker MQTT subindo em `localhost:1883` (já vem do `docker-compose.yml` na raiz do monorepo).
2. Pacientes com IDs `1`, `2` e `3` existindo no banco. O seed do Flyway (`V2__seed_pacientes.sql`) cria esses três automaticamente quando o backend sobe. Sem isso, o backend simplesmente ignora as mensagens MQTT — o simulador continua publicando normalmente.

## Instalação

```bash
cd simulator
npm install
cp .env.example .env     # opcional - defaults já funcionam
```

## Como rodar

```bash
npm start                # execução normal
npm run dev              # node --watch (reinicia ao salvar)
```

Saída esperada:

```
[sim] VitaCare IoT - dispositivo IoT virtual
[sim] broker  : mqtt://localhost:1883
[sim] cliente : vitacare-simulator
[sim] pacientes:
  - 1 (perfil: jovem_saudavel)
  - 2 (perfil: hipertenso)
  - 3 (perfil: idoso_fragilizado)
[control] HTTP em http://localhost:4000/sim
[mqtt] conectado
Comandos:
  status                          lista pacientes e estado atual
  ...
sim>
```

A partir daí, ele publica em `pacientes/{id}/sinais` a cada **5 s** e em `pacientes/{id}/status` a cada **30 s**.

---

## Perfis de paciente

A atribuição é determinística (round-robin sobre `PATIENT_IDS`):

| ID | Perfil | Comportamento em estado normal |
|---|---|---|
| 1 | `jovem_saudavel`     | BPM ~72, SpO2 ~98, temp ~36.6 |
| 2 | `hipertenso`         | BPM ~88 (perto do limite máx 100), SpO2 ~96, temp ~36.7 |
| 3 | `idoso_fragilizado`  | BPM ~70, SpO2 ~94 (perto do limite mín 92), temp ~36.5 |

Os perfis estão calibrados para **não dispararem alertas** em estado normal — alertas só aparecem quando um estado anormal é forçado.

## Estados anormais

| Estado            | Efeito enquanto ativo | Limpa com |
|---|---|---|
| `taquicardia`     | BPM publicado ~140 | `reset` |
| `baixa_saturacao` | SpO2 publicado ~88 | `reset` |
| `febre`           | Temperatura publicada ~38.7 | `reset` |

`queda` é um evento **pontual**: uma única publicação em `pacientes/{id}/queda` com `{detectada: true, intensidade}`. Não fixa estado no paciente.

---

## Eventos manuais — CLI

No prompt `sim>`:

```
queda 1 2.7           # publica queda no paciente 1 com intensidade 2.7
taquicardia 2         # paciente 2 passa a publicar BPM ~140
baixa-saturacao 3     # paciente 3 passa a publicar SpO2 ~88
febre 1               # paciente 1 passa a publicar temp ~38.7
reset 2               # paciente 2 volta para normal
status                # lista pacientes e estados atuais
help
exit                  # ou quit, ou Ctrl+C
```

## Eventos manuais — HTTP

Os mesmos comandos via REST local na porta 4000 (para o painel do simulador no Prompt 15):

```bash
curl -X POST http://localhost:4000/sim/1/queda \
     -H 'Content-Type: application/json' -d '{"intensidade":3.1}'
curl -X POST http://localhost:4000/sim/2/taquicardia
curl -X POST http://localhost:4000/sim/3/baixa-saturacao
curl -X POST http://localhost:4000/sim/1/febre
curl -X POST http://localhost:4000/sim/2/reset
curl       http://localhost:4000/sim/status
```

---

## Como verificar mensagens chegando no backend

Suba a infraestrutura e o backend, depois rode o simulador. Em paralelo, valide por qualquer um dos caminhos abaixo:

**1. Logs do backend** — deve aparecer a cada 5 s algo como:

```
Leitura salva: paciente=1 bpm=72 spo2=98 temp=36.6
Status paciente 1: online=true ts=...
```

E após disparar `curl -X POST http://localhost:4000/sim/1/taquicardia`, em poucos segundos:

```
Alerta gerado: paciente=1 tipo=TAQUICARDIA valor=141 severidade=ALTA
```

**2. REST do backend** (histórico):

```bash
curl http://localhost:8080/api/pacientes/1/leituras?minutos=5
curl http://localhost:8080/api/alertas
```

**3. Espia direta no tópico MQTT** (sem o backend):

```bash
docker exec -it vitacare-mosquitto mosquitto_sub -h localhost -t 'pacientes/+/sinais' -v
docker exec -it vitacare-mosquitto mosquitto_sub -h localhost -t 'pacientes/+/queda'  -v
```

**4. WebSocket/STOMP do backend** (com qualquer cliente STOMP apontando para `ws://localhost:8080/ws`):

- assinar `/topic/pacientes/1/leituras` — deve receber `LeituraEvent` a cada 5 s
- assinar `/topic/alertas` — deve receber `AlertaEvent` ao disparar `taquicardia`, `baixa-saturacao`, `febre` ou `queda`

---

## Variáveis de ambiente

Veja `.env.example`.

| Variável | Default | Descrição |
|---|---|---|
| `MQTT_URL`            | `mqtt://localhost:1883`         | Endereço do broker. |
| `MQTT_CLIENT_ID`      | `vitacare-simulator`            | Identificador no broker. |
| `PATIENT_IDS`         | `1,2,3`                         | IDs (existentes no banco) a simular. |
| `SINAIS_INTERVAL_MS`  | `5000`                          | Período entre leituras de sinais. |
| `STATUS_INTERVAL_MS`  | `30000`                         | Período entre publicações de status. |
| `CONTROL_PORT`        | `4000`                          | Porta HTTP do endpoint de controle. |

## Limitações

- Acesso anônimo ao broker (apenas para desenvolvimento local).
- Reconexão automática a cada 2 s, mas sem fila local persistente — mensagens publicadas enquanto o broker estiver fora são descartadas.
- O simulador **não** consulta o backend para descobrir pacientes; usa a lista fixa em `PATIENT_IDS`. Mudar pacientes no banco exige ajustar essa variável.
