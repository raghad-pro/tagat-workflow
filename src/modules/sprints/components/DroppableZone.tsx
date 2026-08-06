"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableZoneProps {
  id: string;
  data: Record<string, unknown>;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A drop target that highlights while a card hovers over it.
 *
 * The highlight is not decoration: without it there is no way to tell which of
 * several adjacent sprint cards a task would land in.
 */
export function DroppableZone({
  id,
  data,
  disabled,
  className,
  children,
}: DroppableZoneProps) {
  const { setNodeRef, isOver, active } = useDroppable({ id, data, disabled });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl transition-colors",
        // Only outline while something is actually being dragged, so the page
        // is not covered in dashed boxes at rest.
        active && !disabled && "outline-2 outline-dashed outline-offset-2 outline-transparent",
        active && !disabled && "outline-[var(--color-border-form)]",
        isOver && !disabled && "outline-[var(--color-bg-primary)] bg-[var(--color-bg-primary-200)]/40",
        className
      )}
    >
      {children}
    </div>
  );
}
