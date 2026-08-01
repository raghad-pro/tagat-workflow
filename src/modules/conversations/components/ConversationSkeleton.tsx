import React from "react";

/** Placeholder rows for the sidebar while the conversation list loads. */
export function ConversationListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 rounded-2xl p-3.5">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[var(--color-border-inputs)]" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div
              className="h-3 animate-pulse rounded bg-[var(--color-border-inputs)]"
              style={{ width: `${55 + ((index * 13) % 30)}%` }}
            />
            <div
              className="h-2.5 animate-pulse rounded bg-[var(--color-border-form)]"
              style={{ width: `${70 + ((index * 7) % 25)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Alternating bubble placeholders while a thread loads. */
export function MessagesSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => {
        const mine = index % 3 === 0;
        return (
          <div key={index} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className="h-12 animate-pulse rounded-2xl bg-[var(--color-border-form)]"
              style={{ width: `${35 + ((index * 17) % 35)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
