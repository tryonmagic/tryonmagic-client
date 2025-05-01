"use client"

import type React from "react"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { FilterDropdown } from "./filter-dropdown"
import { FilterChips } from "./filter-chips"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFilters } from "./filter-context"

// Sample filter options
const filterOptions = {
  age: ["18-25", "26-35", "36-45", "46-55", "56+"],
  ethnicity: ["American", "Asian", "African", "European", "Hispanic", "Middle Eastern", "Pacific Islander"],
  skinTone: ["Light", "Medium", "Dark", "Very Dark"],
  gender: ["Male", "Female", "Non-binary"],
  location: ["North America", "Europe", "Asia", "Africa", "Australia", "South America"],
  modelType: ["Portrait", "Full Body", "Commercial", "Fashion", "Artistic", "Editorial"],
}

export function CompactFilterBar() {
  const [expanded, setExpanded] = useState(false)
  const { resetAllFilters, filters } = useFilters()

  // Count total active filters
  const activeFilterCount = Object.values(filters).reduce((count, values) => count + values.length, 0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm relative z-10">
      {/* Filter header - always visible */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h2 className="font-medium text-sm">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="bg-violet-100 text-violet-800 rounded-full px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={resetAllFilters} className="text-xs text-gray-500 hover:text-gray-700">
              Clear all
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label={expanded ? "Collapse filters" : "Expand filters"}
          >
            {expanded ? <X className="h-4 w-4 text-gray-500" /> : <ChevronExpand className="h-4 w-4 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Filter chips - show active filters */}
      <div className="px-3 py-2">
        <FilterChips />
      </div>

      {/* Expandable filter section */}
      {expanded && (
        <div className="p-3 border-t border-gray-100">
          <ScrollArea className="h-auto max-h-[300px]">
            <div className="space-y-4">
              {/* Primary filters - always visible in a horizontal scroll */}
              <div className="mb-4">
                <h3 className="text-xs text-gray-500 mb-2">Quick Filters</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  <FilterDropdown title="Age" category="age" options={filterOptions.age} />
                  <FilterDropdown title="Ethnicity" category="ethnicity" options={filterOptions.ethnicity} />
                  <FilterDropdown title="Skin Tone" category="skinTone" options={filterOptions.skinTone} />
                  <FilterDropdown title="Gender" category="gender" options={filterOptions.gender} />
                </div>
              </div>

              {/* Secondary filters */}
              <div>
                <h3 className="text-xs text-gray-500 mb-2">Additional Filters</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  <FilterDropdown title="Location" category="location" options={filterOptions.location} />
                  <FilterDropdown title="Model Type" category="modelType" options={filterOptions.modelType} />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// Simple icon component for the expand/collapse button
function ChevronExpand(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  )
}
