"use client"

import { useState, useRef } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { type FilterCategory, useFilters } from "./filter-context"
import { useOnClickOutside } from "@/hooks/use-click-outside"

interface FilterDropdownProps {
  title: string
  category: FilterCategory
  options: string[]
}

export function FilterDropdown({ title, category, options }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { filters, setFilter, removeFilter, resetCategory, getCategoryFilterCount } = useFilters()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedCount = getCategoryFilterCount(category)
  const hasSelections = selectedCount > 0

  // Close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => setIsOpen(false))

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50",
          hasSelections ? "border-violet-200 bg-violet-50 text-violet-700" : "border-gray-200 bg-white text-gray-700",
        )}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {hasSelections && (
          <span className="bg-violet-200 text-violet-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {selectedCount}
          </span>
        )}
        <ChevronDown className="h-4 w-4 ml-1" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200"
          style={{
            left: "0",
            top: "100%",
          }}
        >
          <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-sm">{title}</h3>
            {hasSelections && (
              <button onClick={() => resetCategory(category)} className="text-xs text-gray-500 hover:text-gray-700">
                Clear
              </button>
            )}
          </div>
          <div className="p-2 max-h-80">
            <div className="grid grid-cols-1 gap-1">
              {options.map((option) => {
                const isSelected = filters[category].includes(option)
                return (
                  <button
                    key={option}
                    onClick={() => (isSelected ? removeFilter(category, option) : setFilter(category, option))}
                    className={cn(
                      "flex items-center w-full px-2 py-1.5 text-sm rounded-md",
                      "hover:bg-gray-50 transition-colors text-left",
                      isSelected ? "text-violet-700" : "text-gray-700",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 mr-2 flex-shrink-0 rounded border",
                        isSelected
                          ? "bg-violet-500 border-violet-500 flex items-center justify-center"
                          : "border-gray-300",
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
