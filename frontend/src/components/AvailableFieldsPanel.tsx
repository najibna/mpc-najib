import { useEffect, useState } from "react";
import { getMeta } from "../api/smb";
import { L } from "../labels";
import type { Meta } from "../types/smb";

type Props = { className?: string; defaultOpen?: boolean };

const FIELD_LABELS: Record<string, string> = {
  "employee names": "People’s names",
  departments: "Team names",
  "receipt status": "Receipt yes/no",
  "pre-approval status": "Pre-approval yes/no",
  "business purpose": "Why they bought it",
  "meal context": "Meal details",
  "tip data": "Tip amounts",
};

const COLUMN_LABELS: Record<string, string> = {
  transaction_code: "Card number",
  merchant: "Store name",
  amount: "Amount",
  date: "Date",
  "category/MCC": "Spend type",
  location: "Place",
};

function friendlyColumn(col: string): string {
  return COLUMN_LABELS[col] ?? col.replace(/_/g, " ");
}

export default function AvailableFieldsPanel({ className = "", defaultOpen = false }: Props) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    getMeta().then(setMeta);
  }, []);

  if (!meta?.data_availability) return null;
  const avail = meta.data_availability;
  const provided = avail.provided_columns?.length
    ? avail.provided_columns.map(friendlyColumn)
    : Object.values(COLUMN_LABELS);

  const unavailable = (avail.missing_fields ?? []).map((f) => FIELD_LABELS[f] ?? f);
  const enabled = avail.features_enabled ?? [];
  const disabled = avail.features_unavailable ?? [];

  return (
    <div className={`rounded-xl border border-[color:var(--border)] bg-cream-50 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-charcoal">{L.fields.title}</span>
        <span className="text-xs text-mist-500">{open ? L.fields.hide : L.fields.show}</span>
      </button>
      {open && (
        <div className="border-t border-[color:var(--border)] px-4 pb-4 pt-3 text-xs text-mist-300">
          <p className="mb-2 text-mist-200">{meta.data_source_label ?? "Your Excel file"}</p>

          {avail.department_analysis_note && (
            <p className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-charcoal-muted">
              {L.insights.noDept}
            </p>
          )}

          <p className="mb-1 font-medium text-mist-400">{L.fields.inFile}</p>
          <p className="leading-relaxed">{provided.join(" · ")}</p>

          {unavailable.length > 0 && (
            <>
              <p className="mb-1 mt-3 font-medium text-amber-900/90">{L.fields.missing}</p>
              <ul className="list-inside list-disc space-y-0.5 text-mist-400">
                {unavailable.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}

          {enabled.length > 0 && (
            <>
              <p className="mb-1 mt-3 font-medium text-emerald-800">{L.fields.works}</p>
              <ul className="list-inside list-disc space-y-0.5 text-mist-400">
                {enabled.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}

          {disabled.length > 0 && (
            <>
              <p className="mb-1 mt-3 font-medium text-mist-500">{L.fields.wontWork}</p>
              <ul className="list-inside list-disc space-y-0.5 text-mist-500">
                {disabled.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-3 text-mist-500">
            {L.fields.whoGrouped}: {avail.identity_label ?? "card number"}
          </p>
        </div>
      )}
    </div>
  );
}

export function DataEmptyState({
  title,
  body,
  className = "",
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-8 text-center ${className}`}
    >
      <p className="text-sm font-medium text-amber-900">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-mist-400">{body}</p>
    </div>
  );
}
