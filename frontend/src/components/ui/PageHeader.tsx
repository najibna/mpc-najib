import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  hero?: boolean;
};

export default function PageHeader({ title, subtitle, actions, hero = false }: Props) {
  if (hero) {
    return (
      <section className="mb-12 px-2 pt-4 text-center sm:mb-16 sm:pt-8">
        <h1 className="page-title mx-auto max-w-3xl">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        {actions && <div className="mt-8 flex flex-wrap justify-center gap-4">{actions}</div>}
      </section>
    );
  }

  return (
    <div className="mb-10 text-center sm:text-left">
      <h1 className="font-serif text-3xl font-bold text-charcoal sm:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-charcoal-muted sm:mx-0">
          {subtitle}
        </p>
      )}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">{actions}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-charcoal-muted">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-intact/25 border-t-intact" />
      {label}
    </div>
  );
}

export function severityBadge(severity: string): string {
  switch (severity) {
    case "high":
      return "bg-intact-muted text-intact ring-1 ring-intact/25";
    case "medium":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
    default:
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  }
}

export function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(v);
}

export { cardholderLabel, humanGroupLabel, humanSeverity, humanRuleId, formatCardNumber } from "../../labels";
