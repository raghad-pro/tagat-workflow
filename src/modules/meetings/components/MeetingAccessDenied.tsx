"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import type { MeetingAccessReason } from "../hooks/useMeetingAccess";

interface MeetingAccessDeniedProps {
  reason: MeetingAccessReason;
  meetingTitle?: string;
  /** Dark palette for the room route, light for the details page. */
  variant?: "light" | "dark";
}

/** Maps each reason onto its pair of message keys under `meetings.accessDenied`. */
const COPY: Record<string, { title: string; body: string }> = {
  declined: { title: "declinedTitle", body: "declinedBody" },
  not_invited: { title: "notInvitedTitle", body: "notInvitedBody" },
};

/**
 * Shown instead of the Join button when the account holds no usable invitation.
 */
export function MeetingAccessDenied({
  reason,
  meetingTitle,
  variant = "light",
}: MeetingAccessDeniedProps) {
  const router = useRouter();
  const t = useTranslations("meetings.accessDenied");
  const copy = COPY[reason] ?? COPY.not_invited;
  const isDark = variant === "dark";

  return (
    <div
      className={
        isDark
          ? "flex flex-col items-center justify-center min-h-[550px] gap-3 bg-[#0D1117] rounded-[16px] border border-[#1A2236] text-center px-8"
          : "flex flex-col items-center justify-center min-h-[450px] gap-3 text-center px-8"
      }
    >
      <div
        className={
          isDark
            ? "w-14 h-14 rounded-full bg-[#1A2236] flex items-center justify-center"
            : "w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
        }
      >
        <Lock className={isDark ? "w-6 h-6 text-[#25C6DA]" : "w-6 h-6 text-slate-400"} />
      </div>

      <h2
        className={
          isDark
            ? "text-lg font-bold text-white"
            : "text-lg font-bold text-slate-900 dark:text-slate-100"
        }
      >
        {t(copy.title as never)}
      </h2>

      {meetingTitle && (
        <p className={isDark ? "text-sm font-medium text-gray-300" : "text-sm font-medium text-slate-500 dark:text-slate-400"}>
          {meetingTitle}
        </p>
      )}

      <p
        className={
          isDark
            ? "text-sm text-gray-400 max-w-sm"
            : "text-sm text-slate-500 dark:text-slate-400 max-w-sm"
        }
      >
        {t(copy.body as never)}
      </p>

      <button
        onClick={() => router.push("/meetings")}
        className="mt-4 px-5 py-2 rounded-[8px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white transition-colors font-bold text-sm cursor-pointer"
      >
        {t("backToMeetings")}
      </button>
    </div>
  );
}
