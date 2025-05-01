"use client"

import { X } from "lucide-react"
import { useFilters, type FilterCategory } from "./filter-context"

// Map category names to display names
const categoryDisplayNames: Record<FilterCategory, string> = {
  age: "Age",
  ethnicity: "Ethnicity",
  skinTone: "Skin Tone",
  gender: "Gender",
  location: "Location",
  modelType: "Type",
}

export function FilterChips() {
  const { filters, removeFilter } = useFilters()

  // Get all active filters
  const activeFilters: Array<{ category: FilterCategory; value: string }> = []

  Object.entries(filters).forEach(([category, values]) => {
    values.forEach((value) => {
      activeFilters.push({
        category: category as FilterCategory,
        value,
      })
    })
  })

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
      <span className="text-xs text-gray-500 whitespace-nowrap">Active filters:</span>
      {activeFilters.map(({ category, value }) => (
        <div
          key={`${category}-${value}`}
          className="flex items-center bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
        >
          <span className="text-violet-500 mr-1">{categoryDisplayNames[category]}:</span>
          <span>{value}</span>
          <button
            onClick={() => removeFilter(category, value)}
            className="ml-1 p-0.5 rounded-full hover:bg-violet-200"
            aria-label={`Remove ${value} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
