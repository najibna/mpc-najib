import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: Props) {
  return <div className={`card ${className}`}>{children}</div>;
}

type PanelProps = Props & { title?: string };

export function Panel({ title, children, className = "" }: PanelProps) {
  return (
    <div className={`card p-6 sm:p-8 ${className}`}>
      {title && (
        <h3 className="section-label mb-6 text-center sm:text-left">{title}</h3>
      )}
      {children}
    </div>
  );
}
