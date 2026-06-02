import { useEffect, useState } from "react";
import { getMeta } from "../api/smb";
import { useDataVersion } from "../hooks/useDataVersion";
import type { Meta } from "../types/smb";

type Props = { onDataChange?: () => void };

export default function DataSourceBadge({ onDataChange }: Props) {
  const dataVersion = useDataVersion();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  function reload(force = false) {
    getMeta(force).then(setMeta).catch(() => setMeta(null));
    onDataChange?.();
  }
  useEffect(() => { reload(dataVersion > 0); }, [dataVersion]);

  if (!meta) return null;
  const loaded = meta.loaded !== false && meta.data_source != null;
  const avail = meta.data_availability;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            loaded
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/40"
              : "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/40"
          }`}
        >
          {meta.data_source_label ?? (loaded ? "Live from uploaded Excel" : "Connecting to data…")}
        </span>
        {loaded && (
          <button
            onClick={() => setShowDetail((s) => !s)}
            className="text-xs text-intact underline-offset-2 hover:text-intact hover:underline"
          >
            {showDetail ? "Hide data provenance" : "Data provenance"}
          </button>
        )}
      </div>
      {showDetail && loaded && (
        <div className="rounded-xl border border-[color:var(--border)] bg-cream-100 px-4 py-3 text-xs text-mist-300">
          <p className="font-medium text-mist-200">{meta.transparency_note ?? avail?.data_honesty_note}</p>
          {meta.total_spend != null && (
            <p className="mt-2">
              <span className="text-intact">From Excel:</span>{" "}
              ${meta.total_spend.toLocaleString()} · {meta.transaction_count?.toLocaleString()} transactions ·{" "}
              {meta.card_code_count ?? meta.employee_count} {avail?.identity_label?.toLowerCase() ?? "card codes"}
            </p>
          )}
          {avail && avail.missing_fields.length > 0 && (
            <p className="mt-2 text-amber-900/90">
              Not in file: {avail.missing_fields.join(", ")}. Unavailable fields are not invented or scored.
            </p>
          )}
          {meta.policy_thresholds && (
            <p className="mt-2 text-mist-400">
              Policy thresholds: ${meta.policy_thresholds.approval_cap} approval cap · $
              {meta.policy_thresholds.receipt_threshold} receipt threshold
            </p>
          )}
        </div>
      )}
    </div>
  );
}
