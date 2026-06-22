"use client";

import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Text } from "@/components/atoms/Text";

interface EmptyStateProps {
  title?: string;
  description?: string;
  animationUrl?: string;
  className?: string;
}

export function EmptyState({
  title = "No Data Found",
  description = "There is nothing to display here right now.",
  // A generic free lottie empty state url
  animationUrl = "https://assets9.lottiefiles.com/packages/lf20_t9gkjp6t.json",
  className = "",
}: EmptyStateProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch(animationUrl)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load lottie animation:", err));
  }, [animationUrl]);

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] ${className}`}>
      <div className="w-48 h-48 mb-4">
        {animationData ? (
          <Lottie animationData={animationData} loop={true} />
        ) : (
          <div className="w-full h-full bg-gray-100 animate-pulse rounded-full" />
        )}
      </div>
      <Text size="lg" className="font-bold mb-2 ds-text-primary">
        {title}
      </Text>
      <Text size="sm" color="gray-200">
        {description}
      </Text>
    </div>
  );
}
