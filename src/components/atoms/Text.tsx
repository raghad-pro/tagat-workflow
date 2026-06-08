// src/components/atoms/Text.tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type TextSize    = "sm" | "base" | "lg" | "xl";
type TextWeight  = "regular" | "medium" | "bold";
type TextColor   = "primary" | "gray" | "gray-100" | "gray-200" | "brand"| "error";
type TextLeading = "tight" | "normal" | "relaxed";
type TextTag     = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "label";

interface TextProps {
  children:    ReactNode;
  size?:       TextSize;
  weight?:     TextWeight;
  color?:      TextColor;
  leading?:    TextLeading;
  tag?:        TextTag;
  className?:  string;
  htmlFor?:    string;          
}

// ─── Maps ──────────────────────────────────────────────────────────────────────
const sizeMap: Record<TextSize, string> = {
  sm:   "ds-text-sm",
  base: "ds-text-base",
  lg:   "ds-text-lg",
  xl:   "ds-text-xl",
};

const weightMap: Record<TextWeight, string> = {
  regular: "ds-font-regular",
  medium:  "ds-font-medium",
  bold:    "ds-font-bold",
};

const colorMap: Record<TextColor, string> = {
  primary:  "ds-text-primary",
  gray:     "ds-text-gray",
  "gray-100": "ds-text-gray-100",
  "gray-200": "ds-text-gray-200",
  brand:    "ds-text-brand",
   error: "ds-text-error",
};

const leadingMap: Record<TextLeading, string> = {
  tight:   "ds-leading-tight",
  normal:  "ds-leading-normal",
  relaxed: "ds-leading-relaxed",
};

// ─── Component ─────────────────────────────────────────────────────────────────
export function Text({
  children,
  size     = "base",
  weight   = "regular",
  color    = "primary",
  leading  = "normal",
  tag:Tag  = "p",
  className,
  htmlFor,
}: TextProps) {
  return (
    <Tag
      className={cn(
        sizeMap[size],
        weightMap[weight],
        colorMap[color],
        leadingMap[leading],
        className
      )}
      {...(Tag === "label" && htmlFor ? { htmlFor } : {})}
    >
      {children}
    </Tag>
  );
}