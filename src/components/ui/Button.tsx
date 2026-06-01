import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "sub-btn-primary disabled:bg-zinc-700 disabled:text-zinc-400 disabled:shadow-none",
  secondary:
    "border border-sky-500/30 bg-sky-950/40 text-sky-100 hover:border-sky-400/50 hover:bg-sky-900/50",
  ghost: "bg-transparent text-sky-200/80 hover:bg-sky-950/60",
  danger:
    "border border-rose-500/40 bg-rose-950/50 text-rose-100 hover:bg-rose-900/60 shadow-[0_0_16px_rgba(244,63,94,0.2)]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <button
      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
