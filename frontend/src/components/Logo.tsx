interface LogoProps {
  variant?: 'sidebar' | 'inline';
  size?: number;
}

export function Logo({ variant = 'sidebar', size = 32 }: LogoProps) {
  const stroke = variant === 'sidebar' ? '#5eead4' : '#0d9488'; // teal-300 / teal-600
  const fill   = variant === 'sidebar' ? '#0f766e' : '#ccfbf1'; // teal-700 / teal-100
  const text   = variant === 'sidebar' ? 'text-white' : 'text-vita-text';
  const sub    = variant === 'sidebar' ? 'text-vita-sidebar-fg/70' : 'text-vita-muted';

  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="7" fill={fill} />
        <path
          d="M6 17h4l2-5 4 10 2-5h8"
          stroke={stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div className="leading-tight">
        <div className={`font-semibold tracking-tight ${text}`}>VitaCare</div>
        <div className={`text-[10px] font-mono uppercase tracking-[0.18em] ${sub}`}>IoT · v0.1</div>
      </div>
    </div>
  );
}
