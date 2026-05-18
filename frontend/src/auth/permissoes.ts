// Mapa central de permissões por perfil — fonte única de verdade no frontend.
// Mantenha em sincronia com o backend (@PreAuthorize nos controllers).
//
// CUIDADOR:     apenas visualização (Central, Pacientes, Alertas, Histórico).
// PROFISSIONAL: tudo que o cuidador vê + CRUD parcial (cria/edita pacientes,
//               configura limites clínicos, marca alertas atendidos, opera
//               o painel do simulador). Não pode EXCLUIR pacientes.
// ADMIN:        acesso total, inclusive exclusão de pacientes.

import type { Perfil, UsuarioLogado } from '@/types';

export type Acao =
  | 'paciente.criar'
  | 'paciente.editar'
  | 'paciente.excluir'
  | 'paciente.marcarAtendido'   // marcar alerta atendido
  | 'limites.configurar'
  | 'simulador.operar';

const MATRIZ: Record<Acao, Perfil[]> = {
  'paciente.criar':         ['ADMIN', 'PROFISSIONAL'],
  'paciente.editar':        ['ADMIN', 'PROFISSIONAL'],
  'paciente.excluir':       ['ADMIN'],
  'paciente.marcarAtendido':['ADMIN', 'PROFISSIONAL', 'CUIDADOR'],
  'limites.configurar':     ['ADMIN', 'PROFISSIONAL'],
  'simulador.operar':       ['ADMIN', 'PROFISSIONAL'],
};

export function temPermissao(
  usuario: UsuarioLogado | null,
  acao: Acao,
): boolean {
  if (!usuario) return false;
  return MATRIZ[acao].includes(usuario.perfil);
}
