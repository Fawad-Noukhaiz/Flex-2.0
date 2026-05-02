"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200",
        variant === "primary"
          ? "border border-cyan-100/70 bg-gradient-to-r from-cyan-200 to-blue-100 text-blue-900 shadow-[0_12px_35px_-16px_rgba(56,189,248,0.7)] hover:from-cyan-100 hover:to-white"
          : "border border-white/35 bg-white/10 text-white hover:bg-white/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    />
  );
}