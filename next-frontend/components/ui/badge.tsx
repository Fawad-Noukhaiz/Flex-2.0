import { cn } from "../../lib/cn";
import type { ReactNode } from "react";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700", className)}>{children}</span>;
}
