"use client";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageSkeleton, type SkeletonVariant } from "@/components/atoms/PageSkeleton";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";

interface PageContainerProps {
  isLoading: boolean;
  skeletonVariant?: SkeletonVariant;
  skeletonRows?: number;
  /**
   * Renders a failure state instead of the page body.
   *
   * Optional so existing callers are unaffected. Without it a failed request
   * falls through to an empty table reading "no data found" — which tells the
   * user their records are gone when in fact the request never succeeded.
   */
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function PageContainer({
  isLoading,
  skeletonVariant = "table",
  skeletonRows,
  isError,
  error,
  onRetry,
  children,
}: PageContainerProps) {
  const t = useTranslations("common");

  if (isLoading) return <PageSkeleton variant={skeletonVariant} rows={skeletonRows} />;

  if (isError) {
    // The axios interceptor already turns 5xx into a readable sentence; show
    // it verbatim so a server fault is distinguishable from an empty table.
    const message =
      (error as any)?.message ||
      (error as any)?.response?.data?.message ||
      t("error");

    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border ds-border-form p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-status-pending-bg)]">
            <AlertTriangle size={22} className="text-[var(--color-status-pending)]" />
          </div>
          <Text size="lg" weight="bold" tag="h2">{t("loadFailedTitle")}</Text>
          <Text size="sm" className="ds-text-gray-200 max-w-md">{message}</Text>
          {onRetry && (
            <Button variant="solid" size="md" onClick={onRetry} licon={<RotateCw size={15} />}>
              {t("retry")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <div className="p-4 sm:p-6">{children}</div>;
}
