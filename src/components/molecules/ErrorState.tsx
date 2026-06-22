"use client";

import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  animationUrl?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something Went Wrong",
  description = "An unexpected error occurred. Please try again later.",
  // A generic free lottie error state url
  animationUrl = "https://assets3.lottiefiles.com/packages/lf20_suhe7qtm.json",
  onRetry,
  className = "",
}: ErrorStateProps) {
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
          <div className="w-full h-full bg-red-100 animate-pulse rounded-full" />
        )}
      </div>
      <Text size="lg" className="font-bold mb-2 ds-text-error">
        {title}
      </Text>
      <Text size="sm" color="gray-200" className="mb-6">
        {description}
      </Text>
      {onRetry && (
        <Button variant="solid" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
