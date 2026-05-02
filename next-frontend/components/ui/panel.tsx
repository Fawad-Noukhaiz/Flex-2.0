import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Panel({
  title,
  subtitle,
  children,
  className,
  titleClassName,
  subtitleClassName,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-blue-100/80 bg-white/80 p-5 backdrop-blur", className)}>
      <div className="mb-4 space-y-1">
        <h2 className={cn("text-lg font-semibold text-blue-950", titleClassName)}>{title}</h2>
        {subtitle ? <p className={cn("text-sm text-blue-700/80", subtitleClassName)}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}