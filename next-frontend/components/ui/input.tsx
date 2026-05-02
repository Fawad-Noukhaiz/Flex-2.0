"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-xl border border-blue-200/80 bg-white/90 px-3 py-2.5 text-sm text-slate-900", props.className)} />;
}