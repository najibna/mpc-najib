import { Link, useLocation } from "react-router-dom";

/** Floating Ask AI — Intact careers chat widget style. */
export default function AskAiFab() {
  const { pathname } = useLocation();
  if (pathname === "/ask") return null;

  return (
    <Link
      to="/ask"
      className="fixed bottom-6 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3 sm:right-8"
      aria-label="Open Ask AI"
    >
      <span className="hidden rounded-full bg-white px-5 py-3 text-sm font-medium text-charcoal shadow-card sm:inline-block">
        Chat with Ask AI
      </span>
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-intact text-lg font-bold text-white shadow-intact"
        aria-hidden
      >
        <span className="font-serif tracking-tighter">[]</span>
      </span>
    </Link>
  );
}
