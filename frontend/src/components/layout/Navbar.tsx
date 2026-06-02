import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { NAV } from "../../copy";

function navClass(isActive: boolean): string {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <NavLink to="/" className="shrink-0 py-4" aria-label="Home">
            <img
              src="/intactinsurance.svg"
              alt="Intact Insurance"
              className="h-9 w-auto max-w-[140px] object-contain object-left sm:h-10 sm:max-w-[160px]"
              draggable={false}
            />
          </NavLink>

          <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex xl:gap-8">
            {NAV.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={"end" in link ? link.end : undefined}
                className={({ isActive }) => navClass(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link to="/ask" className="btn-cta hidden sm:inline-flex">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Ask AI
            </Link>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="rounded-md p-2 text-charcoal lg:hidden"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav className="border-t border-[color:var(--border)] bg-cream px-4 py-4 lg:hidden">
          {NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={"end" in link ? link.end : undefined}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-md px-3 py-3 text-base ${
                  isActive ? "bg-intact-muted font-semibold text-intact" : "text-charcoal-muted"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/ask"
            onClick={() => setOpen(false)}
            className="btn-cta mt-3 w-full"
          >
            Ask AI
          </Link>
        </nav>
      )}
    </header>
  );
}
