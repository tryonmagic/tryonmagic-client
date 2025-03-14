"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { LoadingAnimation } from "@/components/loading-animation";

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return isLoading ? <LoadingAnimation /> : children;
}
