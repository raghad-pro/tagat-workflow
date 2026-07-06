"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { ClientAvatar } from "@/components/atoms/Clientavatar";

// ─── Status pill ───────────────────────────────────────────────────────────────
export type PivotStatus = "pending" | "approved" | "rejected" | string;

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string }> = {
  approved: { bg: "rgba(52,211,153,0.12)", color: "#059669", dot: "#34d399" },
  active: { bg: "rgba(52,211,153,0.12)", color: "#059669", dot: "#34d399" },
  completed: { bg: "rgba(52,211,153,0.12)", color: "#059669", dot: "#34d399" },
  pending: { bg: "rgba(251,191,36,0.12)", color: "#d97706", dot: "#f59e0b" },
  "in-progress": { bg: "rgba(251,191,36,0.12)", color: "#d97706", dot: "#f59e0b" },
  rejected: { bg: "rgba(239,68,68,0.10)", color: "var(--color-error)", dot: "#ef4444" },
  inactive: { bg: "rgba(239,68,68,0.10)", color: "var(--color-error)", dot: "#ef4444" },
  cancelled: { bg: "rgba(239,68,68,0.10)", color: "var(--color-error)", dot: "#ef4444" },
};

export function StatusPill({ status }: { status: PivotStatus }) {
  if (!status) return null;
  const statusKey = status.toLowerCase();
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {label}
    </span>
  );
}

// ─── Info row ──────────────────────────────────────────────────────────────────
export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-3"
      style={{ borderBottom: "1px solid var(--color-border-form)" }}
    >
      <Text size="sm" color="gray-200" tag="span" className="shrink-0 w-32 text-start">
        {label}
      </Text>
      <div className="text-end flex flex-col items-end justify-center">{children}</div>
    </div>
  );
}

// ─── Layout Component ─────────────────────────────────────────────────────────────────
export interface ViewDetailsLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  avatarName?: string;
  avatarSrc?: string;
  headerIcon?: React.ReactNode;
  headerTitle: string;
  headerSubtitle?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ViewDetailsLayout({
  isOpen,
  onClose,
  title,
  avatarName,
  avatarSrc,
  headerIcon,
  headerTitle,
  headerSubtitle,
  children,
  size = "md",
}: ViewDetailsLayoutProps) {
  if (!isOpen) return null;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      mode="view"
      size={size}
    >
      <div className="flex flex-col gap-5">
        {/* Header Block */}
        <div
          className="flex items-center gap-4 p-4 rounded-xl"
          style={{ background: "var(--color-bg)" }}
        >
          {headerIcon ? (
            <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-primary-200)] flex items-center justify-center text-[var(--color-primary)]">
              {headerIcon}
            </div>
          ) : avatarName ? (
            <ClientAvatar name={avatarName} src={avatarSrc} size="md" />
          ) : null}
          <div>
            <Text size="base" weight="bold" tag="p">{headerTitle}</Text>
            {headerSubtitle && <Text size="sm" color="gray-200" tag="p">{headerSubtitle}</Text>}
          </div>
        </div>

        {/* Content Rows */}
        <div className="flex flex-col">
          {children}
        </div>
      </div>
    </ActionModal>
  );
}
