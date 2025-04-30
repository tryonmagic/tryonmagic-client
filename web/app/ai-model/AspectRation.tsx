"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type AspectRatioOption = {
  id: string;
  label: string;
  value: string;
  width: number;
  height: number;
};

const aspectRatios: AspectRatioOption[] = [
  { id: "square", label: "1:1", value: "1:1", width: 24, height: 24 },
  {
    id: "portrait-tall",
    label: "9:16",
    value: "9:16",
    width: 18,
    height: 32,
  },
  {
    id: "landscape-wide",
    label: "16:9",
    value: "16:9",
    width: 32,
    height: 18,
  },
  { id: "portrait", label: "3:4", value: "3:4", width: 18, height: 24 },
  { id: "landscape", label: "4:3", value: "4:3", width: 24, height: 18 },
];

interface AspectRatioSelectorProps {
  label?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export default function AspectRatioSelector({
  label = "Aspect Ratio",
  defaultValue = "1:1",
  onChange,
}: AspectRatioSelectorProps) {
  const [aspect, setAspect] = useState(defaultValue);

  const handleChange = (value: string) => {
    if (value) {
      setAspect(value);
      onChange?.(value);
    }
  };
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleMouseEnter = (ratio: AspectRatioOption) => {
    const type =
      ratio.width > ratio.height
        ? "Landscape"
        : ratio.width === ratio.height
          ? "Square"
          : "Portrait";
    setShowTooltip(`${type} (${ratio.label})`);
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
  };

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-medium mb-4 text-gray-800">{label}</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {aspectRatios.map((ratio) => (
          <button
            key={ratio.id}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded transition-all",
              aspect === ratio.value
                ? "bg-blue-50"
                : "bg-white hover:bg-gray-50",
            )}
            onClick={() => handleChange(ratio.value)}
            onMouseEnter={() => handleMouseEnter(ratio)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={cn(
                "border-2 rounded mb-1",
                aspect === ratio.value ? "border-blue-500" : "border-gray-400",
              )}
              style={{
                width: ratio.width,
                height: ratio.height,
                maxWidth: "32px",
                maxHeight: "32px",
              }}
            />
            <span className="text-sm font-medium text-gray-700">
              {ratio.label}
            </span>
          </button>
        ))}
      </div>

      {showTooltip && (
        <div className="absolute bg-gray-800 text-white text-sm py-1 px-3 rounded shadow-lg">
          {showTooltip}
        </div>
      )}
    </div>
  );
}
