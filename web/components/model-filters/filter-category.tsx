"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FilterOption } from "./filter-option";
import { type FilterCategory, useFilters } from "./filter-context";
import { cn } from "@/lib/utils";

interface FilterCategoryProps {
  title: string;
  category: FilterCategory;
  options: string[];
  expandable?: boolean;
  maxVisible?: number;
}

export function FilterCategoryRow({
  title,
  category,
  options,
  expandable = true,
  maxVisible = 5,
}: FilterCategoryProps) {
  const { filters, setFilter } = useFilters();
  const [expanded, setExpanded] = useState(false);

  const selectedValue = filters[category];
  const visibleOptions = expanded ? options : options.slice(0, maxVisible);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option) => (
          <FilterOption
            key={option}
            label={option}
            isSelected={selectedValue.includes(option)}
            onClick={() => setFilter(category, option)}
          />
        ))}

        {expandable && options.length > maxVisible && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center justify-center px-2 py-1 rounded-lg",
              "text-sm font-medium text-gray-600 hover:bg-gray-100",
              "border border-gray-200 transition-colors",
            )}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <span>Show Less</span>
                <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                <span>+{options.length - maxVisible} More</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
