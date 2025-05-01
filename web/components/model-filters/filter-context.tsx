"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type FilterCategory = "age" | "ethnicity" | "skinTone" | "gender" | "location" | "modelType"

export interface FilterState {
  age: string[]
  ethnicity: string[]
  skinTone: string[]
  gender: string[]
  location: string[]
  modelType: string[]
}

interface FilterContextType {
  filters: FilterState
  setFilter: (category: FilterCategory, value: string) => void
  removeFilter: (category: FilterCategory, value: string) => void
  resetCategory: (category: FilterCategory) => void
  resetAllFilters: () => void
  isFilterActive: (category: FilterCategory, value: string) => boolean
  getActiveFilterCount: () => number
  getCategoryFilterCount: (category: FilterCategory) => number
}

const defaultFilters: FilterState = {
  age: [],
  ethnicity: [],
  skinTone: [],
  gender: [],
  location: [],
  modelType: [],
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const setFilter = (category: FilterCategory, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value) ? prev[category] : [...prev[category], value],
    }))
  }

  const removeFilter = (category: FilterCategory, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item !== value),
    }))
  }

  const resetCategory = (category: FilterCategory) => {
    setFilters((prev) => ({
      ...prev,
      [category]: [],
    }))
  }

  const resetAllFilters = () => {
    setFilters(defaultFilters)
  }

  const isFilterActive = (category: FilterCategory, value: string) => {
    return filters[category].includes(value)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, values) => count + values.length, 0)
  }

  const getCategoryFilterCount = (category: FilterCategory) => {
    return filters[category].length
  }

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilter,
        removeFilter,
        resetCategory,
        resetAllFilters,
        isFilterActive,
        getActiveFilterCount,
        getCategoryFilterCount,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider")
  }
  return context
}
