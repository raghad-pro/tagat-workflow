import * as React from "react";
import type { LucideProps } from "lucide-react";

export const CustomCardIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <rect width="20" height="14" x="2" y="5" rx="3" ry="3" />
        <line x1="2" x2="22" y1="11" y2="11" />
        <path d="M11 16h2" />
        <path d="M15 16h3" />
      </svg>
    );
  }
);

CustomCardIcon.displayName = "CustomCardIcon";
