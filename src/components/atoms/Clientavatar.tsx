"use client";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md";
  src?: string;
}

const COLORS = [
  { bg: "rgba(37,198,218,0.15)",  color: "var(--color-primary)" },
  { bg: "rgba(251,191,36,0.15)",  color: "#d97706" },
  { bg: "rgba(167,139,250,0.15)", color: "#7c3aed" },
  { bg: "rgba(52,211,153,0.15)",  color: "#059669" },
  { bg: "rgba(239,68,68,0.12)",   color: "#dc2626" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const SIZE_MAP = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
};

export function ClientAvatar({ name, size = "md" }: AvatarProps) {
  const safeName = name || "User";
  const idx = (safeName.charCodeAt(0) || 0) % COLORS.length;
  const { bg, color } = COLORS[idx];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${SIZE_MAP[size]}`}
      style={{ background: bg, color }}
    >
      {getInitials(safeName)}
    </span>
  );
}