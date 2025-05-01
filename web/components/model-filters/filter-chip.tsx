"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { type FilterCategory, useFilters } from "./filter-context"

interface FilterChipProps {
  category: FilterCategory
  value: string
  displayCategory?: boolean
}

// Map category names to display names
const categoryDisplayNames: Record<FilterCategory, string> = {
  age: "Age",
  ethnicity: "Ethnicity",
  skinTone: "Skin Tone",
  gender: "Gender",
  location: "Location",
  modelType: "Model Type",
}

export function FilterChip({ category, value, displayCategory = true }: FilterChipProps) {
  const { removeFilter } = useFilters()

  return (
    <div
      className={cn(
        "flex items-center bg-violet-50 text-violet-800 px-2 py-1 rounded-full text-sm",
        "border border-violet-100",
      )}
    >
      {displayCategory && <span className="text-violet-500 mr-1">{categoryDisplayNames[category]}:</span>}
      <span>{value}</span>
      <button
        onClick={() => removeFilter(category, value)}
        className="ml-1 p-0.5 rounded-full hover:bg-violet-100"
        aria-label={`Remove ${value} filter`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
