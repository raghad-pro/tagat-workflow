import { Text } from "@/components/atoms/Text";
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
      <Text tag="h2" size="xl" className="mb-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
        {title}
      </Text>
      {subtitle && (
        <Text color="gray" className="max-w-2xl text-lg md:text-xl ds-text-gray-200 mt-4 mx-auto">
          {subtitle}
        </Text>
      )}
    </div>
  );
}
