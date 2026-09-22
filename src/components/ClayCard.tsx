import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ClayCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export function ClayCard({
  children,
  className,
  hover = true,
  onClick,
  ariaLabel,
}: ClayCardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      className={cn(
        "clay",
        hover && "transition-all duration-300 hover:-translate-y-0.5",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-accent)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ClayCardInset({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("clay-inset", className)}>
      {children}
    </div>
  );
}
