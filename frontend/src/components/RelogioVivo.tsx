import { useEffect, useState } from 'react';

/**
 * Hora atual atualizada a cada segundo. Em mono fino, lembra mostrador de
 * monitor clínico. Os segundos ficam em opacity menor para não distraírem.
 */
export function RelogioVivo() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = pad(agora.getHours());
  const mm = pad(agora.getMinutes());
  const ss = pad(agora.getSeconds());

  return (
    <time
      className="hidden md:inline-flex items-center font-mono tabular-nums
                 text-sm text-vita-text/80"
      title="Hora local"
      dateTime={agora.toISOString()}
    >
      {hh}:{mm}
      <span className="text-vita-muted/60 ml-0.5">:{ss}</span>
    </time>
  );
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
