"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/provider";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-lime text-ink hover:brightness-110 active:scale-[0.98] glow-lime font-bold",
  secondary: "glass text-paper hover:bg-white/12 active:scale-[0.98] font-semibold",
  ghost: "text-muted hover:text-paper hover:bg-white/8 font-semibold",
  danger: "bg-magenta text-white hover:brightness-110 active:scale-[0.98] font-bold",
};

const SIZES = {
  sm: "px-3.5 py-2 text-sm rounded-xl",
  md: "px-5 py-3 text-base rounded-2xl",
  lg: "px-6 py-4 text-lg rounded-2xl",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: keyof typeof SIZES;
  full?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : ""} ${className}`}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  full,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: keyof typeof SIZES;
  full?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return <Tag className={`glass rounded-3xl ${className}`}>{children}</Tag>;
}

export function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "lime" | "magenta" | "cyan" | "amber";
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/10 text-muted",
    lime: "bg-lime/18 text-lime",
    magenta: "bg-magenta/20 text-magenta",
    cyan: "bg-cyan/18 text-cyan",
    amber: "bg-amber/18 text-amber",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-1 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-lime" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-ink transition-all ${checked ? "left-6" : "left-1 bg-white/70"}`}
        />
      </span>
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-white/8 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
            value === o.value ? "bg-lime text-ink" : "text-muted hover:text-paper"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const { t } = useLang();
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-lg font-bold disabled:opacity-30"
        aria-label={t.settings.less}
      >
        −
      </button>
      <span className="min-w-16 text-center text-base font-bold tabular-nums">
        {format ? format(value) : value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-lg font-bold disabled:opacity-30"
        aria-label={t.settings.more}
      >
        +
      </button>
    </div>
  );
}
