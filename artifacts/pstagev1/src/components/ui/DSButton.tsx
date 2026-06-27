import { type ReactNode, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ink";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  pill = false,
  icon,
  iconRight,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const cls = [
    "ds-btn",
    `ds-btn-${size}`,
    `ds-btn-${variant}`,
    pill ? "ds-btn-pill" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={cls} {...props}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
