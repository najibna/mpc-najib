import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const WORKFLOW_STATUSES = [
  "New",
  "Under Review",
  "Dismissed",
  "Escalated",
  "Resolved",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const WORKFLOW_STATUS_CONFIG: Record<
  WorkflowStatus,
  { label: string; hint: string; badge: string; dot: string; menu: string }
> = {
  New: {
    label: "New",
    hint: "Nobody has looked at this yet",
    badge: "border-sky-500/40 bg-sky-500/15 text-sky-200",
    dot: "bg-sky-400",
    menu: "hover:bg-sky-500/10",
  },
  "Under Review": {
    label: "Checking",
    hint: "Someone is looking into it",
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-900",
    dot: "bg-amber-400",
    menu: "hover:bg-amber-50",
  },
  Dismissed: {
    label: "Ignored",
    hint: "Marked OK or not a problem",
    badge: "border-mist-500/30 bg-cream-200 text-mist-300",
    dot: "bg-mist-400",
    menu: "hover:bg-cream-200",
  },
  Escalated: {
    label: "Sent up",
    hint: "Sent to a manager",
    badge: "border-intact/30 bg-intact-muted text-intact",
    dot: "bg-red-400",
    menu: "hover:bg-intact-muted",
  },
  Resolved: {
    label: "Done",
    hint: "Fixed or closed",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-200",
    dot: "bg-emerald-400",
    menu: "hover:bg-emerald-500/10",
  },
};

const MENU_HEIGHT = 168;
const GAP = 4;

function normalizeStatus(status?: string): WorkflowStatus {
  if (status && status in WORKFLOW_STATUS_CONFIG) return status as WorkflowStatus;
  return "New";
}

type MenuPos = { top: number; left: number; width: number };

function computeMenuPos(button: HTMLButtonElement): MenuPos {
  const rect = button.getBoundingClientRect();
  const width = Math.max(rect.width, 140);
  let left = rect.left;
  let top = rect.bottom + GAP;

  if (top + MENU_HEIGHT > window.innerHeight - 8) {
    top = rect.top - MENU_HEIGHT - GAP;
  }
  if (top < 8) top = rect.bottom + GAP;

  if (left + width > window.innerWidth - 8) {
    left = window.innerWidth - width - 8;
  }
  if (left < 8) left = 8;

  return { top, left, width };
}

type Props = {
  status?: string;
  onChange: (status: WorkflowStatus) => void;
  disabled?: boolean;
};

export default function WorkflowStatusPicker({ status, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const current = normalizeStatus(status);
  const cfg = WORKFLOW_STATUS_CONFIG[current];

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    setMenuPos(computeMenuPos(buttonRef.current));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function reposition() {
      if (buttonRef.current) setMenuPos(computeMenuPos(buttonRef.current));
    }

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] overflow-hidden rounded-lg border border-[color:var(--border)] bg-white py-1 shadow-card"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          >
            <ul>
              {WORKFLOW_STATUSES.map((st) => {
                const item = WORKFLOW_STATUS_CONFIG[st];
                const active = st === current;
                return (
                  <li key={st}>
                    <button
                      type="button"
                      title={item.hint}
                      onClick={() => {
                        onChange(st);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors ${
                        active ? item.badge : `text-mist-200 ${item.menu}`
                      }`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {active && <span className="text-[10px] opacity-70">✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        title={cfg.hint}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full min-w-[7.5rem] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm font-semibold transition-colors hover:brightness-110 disabled:opacity-50 ${cfg.badge}`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
        <span className="min-w-0 flex-1 truncate">{cfg.label}</span>
        <span className="shrink-0 text-[10px] opacity-60">{open ? "▲" : "▼"}</span>
      </button>
      {menu}
    </div>
  );
}
