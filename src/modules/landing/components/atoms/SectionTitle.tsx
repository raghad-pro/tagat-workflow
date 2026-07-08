
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionTitleProps {
  title: ReactNode;
  subtitle?: string;
  className?: string;
  align?: "left" | "center" | "right";
}

export function SectionTitle({ title, subtitle, className, align = "center" }: SectionTitleProps) {
  return (
    <div className={cn("mb-16", align === "center" && "text-center", align === "right" && "text-right", className)}>
      <h2 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground ds-text-gray-200 mt-4 mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
