import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  children: ReactNode;
};

function classesFor(variant: Variant, extra?: string): string {
  const base = variant === "primary" ? "btn-primary" : "btn-secondary";
  return `${base} ${extra ?? ""}`.trim();
}

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={classesFor(variant, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <a className={classesFor(variant, className)} {...rest}>
      {children}
    </a>
  );
}
