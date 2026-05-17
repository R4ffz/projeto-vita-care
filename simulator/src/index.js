import 'dotenv/config';
import mqtt from 'mqtt';

import { PacienteVirtual } from './paciente.js';
import { perfilParaIndice } from './perfis.js';
import { iniciarControlServer } from './controlServer.js';
import { iniciarCli } from './cli.js';

const cfg = lerConfig();
const pacientes = cfg.patientIds.map(
  (id, idx) => new PacienteVirtual(id, perfilParaIndice(idx))
);

console.log('[sim] VitaCare IoT - dispositivo IoT virtual');
console.log(`[sim] broker  : ${cfg.mqttUrl}`);
console.log(`[sim] cliente : ${cfg.clientId}`);
console.log('[sim] pacientes:');
for (const p of pacientes) {
  console.log(`  - ${p.id} (perfil: ${p.perfilKey})`);
}

const client = mqtt.connect(cfg.mqttUrl, {
  clientId: cfg.clientId,
  clean: true,
  reconnectPeriod: 2000,
});

let loopSinais;
let loopStatus;

client.on('connect', () => {
  console.log('[mqtt] conectado');
  for (const p of pacientes) publicarStatus(p, true);

  if (!loopSinais) {
    loopSinais = setInterval(() => {
      for (const p of pacientes) publicarSinal(p);
    }, cfg.sinaisIntervalMs);
  }
  if (!loopStatus) {
    loopStatus = setInterval(() => {
      for (const p of pacientes) publicarStatus(p, true);
    }, cfg.statusIntervalMs);
  }
});

client.on('reconnect', () => console.log('[mqtt] reconectando...'));
client.on('offline',   () => console.warn('[mqtt] offline'));
client.on('error',     (err) => console.error('[mqtt] erro:', err.message));

await iniciarControlServer({
  port: cfg.controlPort,
  pacientes,
  onQueda: (p, intensidade) => publicarQueda(p, intensidade),
});

if (process.stdin.isTTY) {
  iniciarCli({
    pacientes,
    onQueda: (p, intensidade) => publicarQueda(p, intensidade),
    onExit:  shutdown,
  });
} else {
  console.log('[sim] stdin nao e TTY - CLI desativado, controle disponivel apenas via HTTP');
}

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

function publicarSinal(paciente) {
  publicar(`pacientes/${paciente.id}/sinais`, paciente.gerarSinal());
}

function publicarStatus(paciente, online) {
  publicar(`pacientes/${paciente.id}/status`, paciente.gerarStatus(online));
}

function publicarQueda(paciente, intensidade) {
  publicar(`pacientes/${paciente.id}/queda`, paciente.gerarQueda(intensidade));
  console.log(`[mqtt] queda -> paciente ${paciente.id} (intensidade ${intensidade})`);
}

function publicar(topic, payloadObj) {
  const payload = JSON.stringify(payloadObj);
  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) console.warn(`[mqtt] publish falhou em ${topic}: ${err.message}`);
  });
}

let encerrando = false;
async function shutdown() {
  if (encerrando) return;
  encerrando = true;
  console.log('\n[sim] encerrando - publicando offline e desconectando...');

  if (loopSinais) clearInterval(loopSinais);
  if (loopStatus) clearInterval(loopStatus);

  await Promise.all(pacientes.map(p => new Promise(resolve => {
    const topic = `pacientes/${p.id}/status`;
    const payload = JSON.stringify(p.gerarStatus(false));
    client.publish(topic, payload, { qos: 1 }, () => resolve());
  })));

  client.end(false, {}, () => process.exit(0));
}

function lerConfig() {
  const mqttUrl  = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
  const clientId = process.env.MQTT_CLIENT_ID ?? `vitacare-simulator-${process.pid}`;

  const patientIds = (process.env.PATIENT_IDS ?? '1,2,3')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number);

  if (patientIds.length === 0 || patientIds.some(Number.isNaN)) {
    throw new Error('PATIENT_IDS invalido - informe lista separada por virgula, ex: PATIENT_IDS=1,2,3');
  }

  const sinaisIntervalMs = Number(process.env.SINAIS_INTERVAL_MS ?? 5000);
  const statusIntervalMs = Number(process.env.STATUS_INTERVAL_MS ?? 30000);
  const controlPort      = Number(process.env.CONTROL_PORT ?? 4000);

  return { mqttUrl, clientId, patientIds, sinaisIntervalMs, statusIntervalMs, controlPort };
}
