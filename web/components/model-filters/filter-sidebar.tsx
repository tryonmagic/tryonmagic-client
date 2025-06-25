"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FilterCategoryRow } from "./filter-category"
import { useFilters } from "./filter-context"

// Sample filter options - these would come from your API or data source
const filterOptions = {
  age: ["All Ages", "18-25", "26-35", "36-45", "46-55", "56+"],
  ethnicity: [
    "All Ethnicities",
    "American",
    "Asian",
    "African",
    "European",
    "Hispanic",
    "Middle Eastern",
    "Pacific Islander",
  ],
  skinTone: ["All Skin Tones", "Light", "Medium", "Dark"],
  gender: ["All Genders", "Male", "Female", "Non-binary"],
  location: ["All Locations", "North America", "Europe", "Asia", "Africa", "Australia", "South America"],
  modelType: ["All Types", "Portrait", "Full Body", "Commercial", "Fashion", "Artistic"],
}

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function FilterSidebar({ isOpen, onClose }: FilterSidebarProps) {
  const { resetAllFilters } = useFilters()

  return (
    <div
      className={`
      fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-lg transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "translate-x-full"}
    `}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Filter Models</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close filters">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100vh-64px-72px)]">
        <FilterCategoryRow title="Age" category="age" options={filterOptions.age} />

        <FilterCategoryRow title="Ethnicity" category="ethnicity" options={filterOptions.ethnicity} />

        <FilterCategoryRow title="Skin Tone" category="skinTone" options={filterOptions.skinTone} />

        <FilterCategoryRow title="Gender" category="gender" options={filterOptions.gender} />

        <FilterCategoryRow title="Location" category="location" options={filterOptions.location} />

        <FilterCategoryRow title="Model Type" category="modelType" options={filterOptions.modelType} />
      </div>

      <div className="p-4 border-t flex justify-between">
        <Button variant="outline" onClick={resetAllFilters}>
          Reset All
        </Button>
        <Button onClick={onClose}>Apply Filters</Button>
      </div>
    </div>
  )
}
