"use client"

import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFilters } from "./filter-context"

interface MobileFilterButtonProps {
  onClick: () => void
}

export function MobileFilterButton({ onClick }: MobileFilterButtonProps) {
  const { filters } = useFilters()

  // Count active filters (excluding "All" filters)
  const activeFilterCount = Object.values(filters).filter((value) => !value.startsWith("All ")).length

  return (
    <Button variant="outline" className="flex items-center gap-2 md:hidden" onClick={onClick}>
      <Filter className="h-4 w-4" />
      <span>Filters</span>
      {activeFilterCount > 0 && (
        <span className="flex items-center justify-center bg-violet-500 text-white rounded-full w-5 h-5 text-xs">
          {activeFilterCount}
        </span>
      )}
    </Button>
  )
}
