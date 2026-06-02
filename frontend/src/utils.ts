import type { RiskCategory } from "./types/transaction";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

export const RISK_CATEGORIES: RiskCategory[] = [
  "Compliant",
  "Needs Review",
  "High Risk",
  "Likely Policy Violation",
];

export function riskBadgeClasses(category: RiskCategory): string {
  switch (category) {
    case "Likely Policy Violation":
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/40";
    case "High Risk":
      return "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/40";
    case "Needs Review":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40";
    default:
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40";
  }
}

export function riskChartColor(category: string): string {
  switch (category) {
    case "Likely Policy Violation":
      return "#f87171";
    case "High Risk":
      return "#fb923c";
    case "Needs Review":
      return "#fbbf24";
    default:
      return "#34d399";
  }
}
