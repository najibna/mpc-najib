import { useEffect, useState } from "react";
import { exportAuditLog, getAuditLog } from "../api/smb";
import PageHeader, { Spinner } from "../components/ui/PageHeader";
import { DEMO_BUNDLE } from "../data/demoBundle";
import { PAGES } from "../copy";
import type { AuditEntry } from "../types/smb";

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const [log, setLog] = useState<AuditEntry[]>(DEMO_BUNDLE.audit);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  useEffect(() => {
    getAuditLog().then((l) => {
      setLog(l);
      setLoading(false);
    });
  }, []);

  async function handleExport(format: "csv" | "json") {
    setExporting(format);
    try {
      const res = await exportAuditLog(format);
      if (format === "csv") {
        downloadFile(res.filename, String(res.content), "text/csv;charset=utf-8");
      } else {
        downloadFile(res.filename, JSON.stringify(res.content, null, 2), "application/json");
      }
    } finally {
      setExporting(null);
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader title={PAGES.audit.title} subtitle={PAGES.audit.subtitle}
        actions={
          log.length > 0 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleExport("csv")}
                disabled={exporting !== null}
                className="btn-secondary text-xs"
              >
                {exporting === "csv" ? "Exporting…" : "Export CSV"}
              </button>
              <button
                type="button"
                onClick={() => handleExport("json")}
                disabled={exporting !== null}
                className="btn-secondary text-xs"
              >
                {exporting === "json" ? "Exporting…" : "Export JSON"}
              </button>
            </div>
          ) : undefined
        }
      />

      {log.length === 0 ? (
        <div className="card p-8 text-center text-mist-400">No audit events yet. Actions will appear here.</div>
      ) : (
        <div className="table-container overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[color:var(--border)] bg-cream-100 text-xs uppercase text-mist-400">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Status change</th>
                <th className="px-4 py-3">AI rec.</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {log.map((e, i) => {
                const d = e.detail ?? {};
                const prev = String(d.previous_status ?? "");
                const next = String(d.new_status ?? "");
                const aiRec = String(d.ai_recommendation ?? "");
                return (
                  <tr key={i}>
                    <td className="px-4 py-3 text-mist-400">{e.timestamp?.slice(0, 19)}</td>
                    <td className="px-4 py-3 font-medium text-intact">{e.action}</td>
                    <td className="px-4 py-3 text-mist-200">{e.actor}</td>
                    <td className="px-4 py-3 text-mist-300">{e.target}</td>
                    <td className="px-4 py-3 text-xs text-mist-400">
                      {prev || next ? `${prev || "—"} → ${next || "—"}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-mist-400">{aiRec || "—"}</td>
                    <td className="px-4 py-3 text-xs text-mist-500">
                      {d.note ? String(d.note).slice(0, 60) : JSON.stringify(d).slice(0, 60)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

}
