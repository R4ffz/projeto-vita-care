// Barrel: serviços reexportados sob namespaces para uso limpo nas páginas.
// Ex.: import { pacientesService } from '@/services';
//      const lista = await pacientesService.listar();

export * as pacientesService from './pacientes';
export * as leiturasService  from './leituras';
export * as alertasService   from './alertas';
export * as limitesService   from './limites';
export * as simuladorService from './simulador';
