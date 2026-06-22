"use client";

import { Info } from "lucide-react";
import { Text } from "@/components/atoms/Text";

interface InfoBannerProps {
  title?: string;
  message: string;
}

export function InfoBanner({ title, message }: InfoBannerProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6"
      style={{
        background: "var(--color-bg-primary-200)",
        border: "1px solid rgba(37,198,218,0.25)",
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: "rgba(37,198,218,0.18)" }}
      >
        <Info size={15} style={{ color: "var(--color-primary)" }} />
      </div>

      {/* Content */}
      <div className="min-w-0">
        {title && (
          <Text size="sm" weight="bold" tag="p" className="mb-0.5">
            {title}
          </Text>
        )}
        <Text size="sm" color="gray-100" tag="p" className="leading-relaxed">
          {message}
        </Text>
      </div>
    </div>
  );
}