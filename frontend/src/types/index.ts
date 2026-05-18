// Tipos compartilhados do VitaCare IoT — espelham os contratos REST/WebSocket do backend.

export type TipoAlerta =
  | 'BRADICARDIA'
  | 'TAQUICARDIA'
  | 'SATURACAO_BAIXA'
  | 'FEBRE'
  | 'QUEDA';

export type Severidade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type StatusPaciente = 'ok' | 'atencao' | 'critico' | 'offline';

export interface Paciente {
  id: number;
  nome: string;
  idade: number;
  contatoEmergencia: string | null;
  fotoUrl: string | null;
  criadoEm: string;
}

export interface Leitura {
  id: number;
  pacienteId: number;
  bpm: number | null;
  spo2: number | null;
  temperatura: number | null;
  timestamp: string;
}

export interface Alerta {
  id: number;
  pacienteId: number;
  tipo: TipoAlerta;
  valorMedido: number | null;
  severidade: Severidade;
  atendido: boolean;
  timestamp: string;
}

export interface LimiteConfig {
  pacienteId: number;
  bpmMin: number;
  bpmMax: number;
  spo2Min: number;
  tempMax: number;
}

export interface PacienteRequest {
  nome: string;
  idade: number;
  contatoEmergencia: string | null;
  fotoUrl: string | null;
}

export interface LimiteConfigRequest {
  bpmMin: number;
  bpmMax: number;
  spo2Min: number;
  tempMax: number;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  fields?: Record<string, string>;
}

// ─── Autenticação ────────────────────────────────────────────────────────────

export type Perfil = 'CUIDADOR' | 'PROFISSIONAL' | 'ADMIN';

export interface UsuarioLogado {
  id: number;
  email: string;
  nome: string;
  perfil: Perfil;
}

export interface LoginResponse {
  token: string;
  expiresInHours: number;
  usuario: UsuarioLogado;
}

export type EstadoSimulado = 'normal' | 'taquicardia' | 'baixa_saturacao' | 'febre';
export type PerfilKey = 'jovem_saudavel' | 'hipertenso' | 'idoso_fragilizado';

export interface PerfilSimulado {
  id: number;
  perfil: PerfilKey;
  estado: EstadoSimulado;
  publicando: boolean;
}

export interface StatusSimulador {
  pacientes: PerfilSimulado[];
}
