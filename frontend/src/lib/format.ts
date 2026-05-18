import type { TipoAlerta } from '@/types';

const ROTULOS_TIPO: Record<TipoAlerta, string> = {
  BRADICARDIA:     'Bradicardia',
  TAQUICARDIA:     'Taquicardia',
  SATURACAO_BAIXA: 'Saturação baixa',
  FEBRE:           'Febre',
  QUEDA:           'Queda',
};

export function rotuloTipoAlerta(tipo: TipoAlerta): string {
  return ROTULOS_TIPO[tipo] ?? tipo;
}

export function formatarHoraRelativa(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const seg = Math.round(ms / 1000);
  if (seg < 5)    return 'agora';
  if (seg < 60)   return `há ${seg}s`;
  const min = Math.round(seg / 60);
  if (min < 60)   return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24)     return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}

export function formatarHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Saudação contextual com base na hora local.
 * Faixas usadas em centros clínicos brasileiros: 5–11h dia, 12–17h tarde,
 * 18–4h noite.
 */
export function saudacao(d: Date = new Date()): string {
  const h = d.getHours();
  if (h >= 5 && h < 12)  return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}
