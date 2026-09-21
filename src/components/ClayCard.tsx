import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ClayCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function ClayCard({
  children,
  className,
  hover = true,
  onClick,
}: ClayCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "clay",
        hover && "hover:-translate-y-0.5 transition-all duration-300",
        onClick && "cursor-pointer",
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
