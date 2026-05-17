// Perfis fisiológicos do simulador. Cada paciente recebe um perfil determinístico
// na inicialização (round-robin sobre PATIENT_IDS). Os valores aqui descrevem o
// estado NORMAL — estados anormais (taquicardia, febre etc.) são tratados em
// paciente.js e sobrescrevem só o sinal afetado.

export const PERFIS = {
  // Jovem saudável: tudo no meio da faixa normal.
  jovem_saudavel: {
    bpm:  { centro: 72, amplitude: 5 },
    spo2: { centro: 98, amplitude: 1 },
    temp: { centro: 36.6, amplitude: 0.2 },
  },
  // Hipertenso: BPM perto do limite máximo (100), demais normais.
  hipertenso: {
    bpm:  { centro: 88, amplitude: 5 },
    spo2: { centro: 96, amplitude: 1 },
    temp: { centro: 36.7, amplitude: 0.2 },
  },
  // Idoso fragilizado: SpO2 perto do limite mínimo (92), maior variabilidade no BPM.
  idoso_fragilizado: {
    bpm:  { centro: 70, amplitude: 8 },
    spo2: { centro: 94, amplitude: 1 },
    temp: { centro: 36.5, amplitude: 0.25 },
  },
};

const ORDEM_PERFIS = ['jovem_saudavel', 'hipertenso', 'idoso_fragilizado'];

export function perfilParaIndice(idx) {
  return ORDEM_PERFIS[idx % ORDEM_PERFIS.length];
}
