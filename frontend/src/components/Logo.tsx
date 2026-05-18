interface LogoProps {
  size?: number;
  showWordmark?: boolean;
}

/**
 * Marca do VitaCare. Mark à esquerda em sálvia (paleta primária) sobre
 * preenchimento sálvia-claro. Wordmark "VitaCare" em serif para reforçar
 * a identidade clínica/editorial.
 */
export function Logo({ size = 32, showWordmark = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#e3ece9" />
        <path
          d="M6 17h4l2-5 4 10 2-5h8"
          stroke="#3d6b66"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-serif text-[17px] font-medium tracking-tight text-vita-text">
            VitaCare
          </div>
          <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-vita-muted">
            IoT
          </div>
        </div>
      )}
    </div>
  );
}
