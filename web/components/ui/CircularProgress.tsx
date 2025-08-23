"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CircularProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number; // 0-100
  size?: number; // px
  strokeWidth?: number; // px
  color?: string;
  trackColor?: string;
};

const CircularProgress = React.forwardRef<
  HTMLDivElement,
  CircularProgressProps
>(
  (
    {
      className,
      value = 0,
      size = 40,
      strokeWidth = 4,
      color = "#7c3aed", // default to purple-600
      trackColor = "#e5e7eb", // default to slate-200
      ...props
    },
    ref,
  ) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(value, 0), 100);
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn("relative inline-block", className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          width={size}
          height={size}
          className="block"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.5s ease",
            }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-medium"
          style={{ userSelect: "none" }}
        >
          {Math.round(progress)}%
        </span>
      </div>
    );
  },
);

CircularProgress.displayName = "CircularProgress";

export default CircularProgress;
