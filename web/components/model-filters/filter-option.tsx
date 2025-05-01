"use client"

import { cn } from "@/lib/utils"

interface FilterOptionProps {
  label: string
  isSelected: boolean
  onClick: () => void
  compact?: boolean
}

export function FilterOption({ label, isSelected, onClick, compact = false }: FilterOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50",
        compact ? "px-3 py-1.5" : "px-4 py-2",
        isSelected ? "bg-violet-500 text-white" : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
      )}
      aria-pressed={isSelected}
    >
      {label}
    </button>
  )
}
