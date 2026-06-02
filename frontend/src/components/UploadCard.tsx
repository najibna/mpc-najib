import { useRef, useState } from "react";
import { importExcel } from "../api/smb";
import { PAGES } from "../copy";
import type { ImportResult } from "../types/smb";

type Props = { onImported?: () => void };

export default function UploadCard({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function onFile(file: File) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await importExcel(file);
      setResult(res);
      onImported?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof msg === "string" ? msg : PAGES.home.upload.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-8 text-center sm:p-10">
      <h3 className="font-serif text-2xl font-semibold text-charcoal">{PAGES.home.upload.title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-charcoal-muted">{PAGES.home.upload.help}</p>
      <div className="mt-6">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? PAGES.home.upload.uploading : PAGES.home.upload.button}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-intact">{error}</p>}
      {result?.ok && (
        <p className="mt-3 text-sm text-emerald-700">
          {PAGES.home.upload.success(result.rows_imported)}
        </p>
      )}
    </div>
  );
}
