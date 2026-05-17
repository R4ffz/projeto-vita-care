import { SimuladorBadge } from './SimuladorBadge';

export function Footer() {
  return (
    <footer className="border-t border-vita-border bg-vita-surface px-6 py-3
                       flex flex-col sm:flex-row items-start sm:items-center
                       justify-between gap-2">
      <SimuladorBadge variant="full" />
      <div className="text-[11px] text-vita-muted font-mono tracking-wide">
        VitaCare IoT · v0.1 · Protótipo acadêmico
      </div>
    </footer>
  );
}
