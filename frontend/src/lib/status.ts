import type { Leitura, LimiteConfig, StatusPaciente } from '@/types';

const MAX_IDADE_LEITURA_MS = 2 * 60 * 1000; // > 2 min sem leitura = offline

/**
 * Deriva o status visual do paciente comparando a última leitura com os
 * limites configurados. Sem leitura recente => offline. Qualquer parâmetro
 * fora do limite => critico. Próximo do limite (margem 5%) => atencao.
 */
export function derivarStatus(
  leitura: Leitura | null,
  limites: LimiteConfig | null,
): StatusPaciente {
  if (!leitura) return 'offline';
  const idadeMs = Date.now() - new Date(leitura.timestamp).getTime();
  if (idadeMs > MAX_IDADE_LEITURA_MS) return 'offline';
  if (!limites) return 'ok';

  const { bpm, spo2, temperatura } = leitura;
  const { bpmMin, bpmMax, spo2Min, tempMax } = limites;

  const violaBpm  = bpm  != null && (bpm < bpmMin || bpm > bpmMax);
  const violaSpo2 = spo2 != null && spo2 < spo2Min;
  const violaTemp = temperatura != null && Number(temperatura) > Number(tempMax);

  if (violaBpm || violaSpo2 || violaTemp) return 'critico';

  // Margens de "atenção" (5% do range / 1 ponto pra SpO2 / 0.3°C pra temp).
  const range = bpmMax - bpmMin;
  const margemBpm = Math.max(2, Math.round(range * 0.05));
  const perto =
    (bpm  != null && (bpm <= bpmMin + margemBpm || bpm >= bpmMax - margemBpm)) ||
    (spo2 != null && spo2 <= spo2Min + 1) ||
    (temperatura != null && Number(tempMax) - Number(temperatura) <= 0.3);

  return perto ? 'atencao' : 'ok';
}
