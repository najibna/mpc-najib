import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
};

export default function Hero({ eyebrow, title, description, children }: Props) {
  return (
    <section className="border-b border-[color:var(--border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <span className="badge-intact mb-4 inline-block uppercase tracking-wider">{eyebrow}</span>
          )}
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 text-base leading-relaxed text-charcoal-muted sm:text-lg">{description}</p>
          )}
        </div>
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}
