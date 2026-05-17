import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`vita-card ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-5 py-4 border-b border-vita-border ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardProps) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  hint?: string;
}

export function CardTitle({ children, hint }: CardTitleProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-vita-text">{children}</h2>
      {hint && <p className="text-xs text-vita-muted mt-0.5">{hint}</p>}
    </div>
  );
}
