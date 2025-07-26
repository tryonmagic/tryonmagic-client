"use client";

import { X } from "lucide-react";
import { FilterDropdown } from "./filter-dropdown";
import { FilterChip } from "./filter-chip";
import { useFilters, type FilterCategory } from "./filter-context";

// Sample filter options
const filterOptions = {
  age: ["18-25", "26-35", "36-45", "46-55", "56+"],
  ethnicity: [
    "American",
    "Asian",
    "African",
    "European",
    "Hispanic",
    "Pacific Islander",
    "Middle Eastern",
  ],
  skinTone: ["Light", "Medium", "Dark", "Very Dark"],
  gender: ["Male", "Female", "Non-binary"],
  location: [
    "North America",
    "Europe",
    "Asia",
    "Africa",
    "Australia",
    "South America",
  ],
  modelType: [
    "Portrait",
    "Full Body",
    "Commercial",
    "Fashion",
    "Artistic",
    "Editorial",
  ],
};

export function FilterBar() {
  const { filters, getActiveFilterCount, resetAllFilters } = useFilters();
  const activeFilterCount = getActiveFilterCount();

  // Get all active filters
  const activeFilters: Array<{ category: FilterCategory; value: string }> = [];
  Object.entries(filters).forEach(([category, values]) => {
    values.forEach((value: any) => {
      activeFilters.push({
        category: category as FilterCategory,
        value,
      });
    });
  });

  return (
    <div className="border border-gray-200 rounded-lg p-2 bg-white" hidden>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-violet-100 text-violet-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            Clear all
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">Active filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(({ category, value }) => (
              <FilterChip
                key={`${category}-${value}`}
                category={category}
                value={value}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="mb-4">
        <h3 className="text-sm text-gray-500 mb-2">Quick Filters</h3>
        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            title="Age"
            category="age"
            options={filterOptions.age}
          />
          <FilterDropdown
            title="Ethnicity"
            category="ethnicity"
            options={filterOptions.ethnicity}
          />
          <FilterDropdown
            title="Skin Tone"
            category="skinTone"
            options={filterOptions.skinTone}
          />
          <FilterDropdown
            title="Gender"
            category="gender"
            options={filterOptions.gender}
          />
        </div>
      </div>

      {/* Additional Filters */}
      <div>
        <h3 className="text-sm text-gray-500 mb-2">Additional Filters</h3>
        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            title="Location"
            category="location"
            options={filterOptions.location}
          />
          <FilterDropdown
            title="Model Type"
            category="modelType"
            options={filterOptions.modelType}
          />
        </div>
      </div>
    </div>
  );
}
