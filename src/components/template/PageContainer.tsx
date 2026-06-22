"use client";
import { PageSkeleton, type SkeletonVariant } from "@/components/atoms/PageSkeleton";

interface PageContainerProps {
  isLoading: boolean;
  skeletonVariant?: SkeletonVariant;
  skeletonRows?: number;
  children: React.ReactNode;
}

export function PageContainer({ isLoading, skeletonVariant = "table", skeletonRows, children }: PageContainerProps) {
  if (isLoading) return <PageSkeleton variant={skeletonVariant} rows={skeletonRows} />;
  return <div className="p-4 sm:p-6">{children}</div>;
}