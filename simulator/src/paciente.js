import { PERFIS } from './perfis.js';

const ESTADOS_VALIDOS = ['normal', 'taquicardia', 'baixa_saturacao', 'febre'];

export class PacienteVirtual {
  constructor(id, perfilKey) {
    if (!PERFIS[perfilKey]) {
      throw new Error(`Perfil desconhecido: ${perfilKey}`);
    }
    this.id = id;
    this.perfilKey = perfilKey;
    this.perfil = PERFIS[perfilKey];
    this.estado = 'normal';
    this.publicando = true;   // se false, o loop de sinais pula este paciente
  }

  setEstado(estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      throw new Error(`Estado invalido: ${estado}`);
    }
    this.estado = estado;
  }

  reset() {
    this.estado = 'normal';
  }

  pausar()  { this.publicando = false; }
  retomar() { this.publicando = true;  }

  gerarSinal() {
    return {
      bpm: this.#gerarBpm(),
      spo2: this.#gerarSpo2(),
      temp: this.#gerarTemp(),
      ts: new Date().toISOString(),
    };
  }

  gerarQueda(intensidade = 2.7) {
    return {
      detectada: true,
      intensidade,
      ts: new Date().toISOString(),
    };
  }

  gerarStatus(online = true) {
    return {
      online,
      ts: new Date().toISOString(),
    };
  }

  #gerarBpm() {
    if (this.estado === 'taquicardia') {
      return Math.round(jitter(140, 15));
    }
    return Math.round(jitter(this.perfil.bpm.centro, this.perfil.bpm.amplitude));
  }

  #gerarSpo2() {
    if (this.estado === 'baixa_saturacao') {
      return Math.round(jitter(88, 2));
    }
    return Math.round(jitter(this.perfil.spo2.centro, this.perfil.spo2.amplitude));
  }

  #gerarTemp() {
    if (this.estado === 'febre') {
      return round1(jitter(38.7, 0.4));
    }
    return round1(jitter(this.perfil.temp.centro, this.perfil.temp.amplitude));
  }
}

function jitter(centro, amplitude) {
  return centro + (Math.random() * 2 - 1) * amplitude;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
