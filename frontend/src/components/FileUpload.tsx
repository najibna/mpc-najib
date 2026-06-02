import { useCallback, useRef, useState } from "react";

type Props = {
  onFileSelected: (file: File) => void;
  busy: boolean;
  error?: string | null;
};

export default function FileUpload({ onFileSelected, busy, error }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        setFileName(null);
        onFileSelected(file); // backend will reject; surfaces consistent error
        return;
      }
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`group cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center backdrop-blur-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-intact ${
          dragOver
            ? "border-intact bg-intact-muted shadow-glow"
            : "border-[color:var(--border)] bg-[color:var(--card-bg)] hover:border-intact hover:shadow-glow-sm"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-intact-gradient text-2xl text-white shadow-glow-sm">
          {busy ? (
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7 text-charcoal"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
          )}
        </div>
        <p className="text-lg font-semibold text-charcoal">
          {busy ? "Analyzing transactions…" : "Drop your .xlsx file here"}
        </p>
        <p className="mt-1 text-sm text-mist-300">
          or click to browse. Corporate card transactions only.
        </p>
        {fileName && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-cream-100 px-3 py-1.5 text-sm text-intact">
            {fileName}
          </p>
        )}
      </div>
      {error && (
        <p className="mt-4 rounded-xl border border-intact/25 bg-intact-muted px-4 py-3 text-sm text-intact">
          {error}
        </p>
      )}
    </div>
  );
}
