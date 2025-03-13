"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface OptionItemProps {
  label: string;
  image: string;
  description?: string;
  color?: string;
}

export function OptionItem({
  label,
  image,
  description,
  color,
}: OptionItemProps) {
  return (
    <div className="flex items-center space-x-3 p-1">
      <div className="relative h-12 w-12 overflow-hidden rounded-md">
        {color ? (
          <div
            className="absolute inset-0 rounded-md"
            style={{ backgroundColor: color }}
          />
        ) : (
          <img
            src={
              image ||
              "https://ig89yd5z8iykrgxva.lite.vusercontent.nethttps://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg"
            }
            alt={label}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div>
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );
}

interface VisualSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: any[];
  label: string;
  disabled?: boolean;
}

export function VisualSelect({
  value,
  onValueChange,
  options,
  label,
  disabled = false,
}: VisualSelectProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn("w-full", disabled && "opacity-70 cursor-not-allowed")}
        >
          <SelectValue>
            {selectedOption && (
              <div className="flex items-center space-x-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-md">
                  {selectedOption.color ? (
                    <div
                      className="absolute inset-0 rounded-md"
                      style={{ backgroundColor: selectedOption.color }}
                    />
                  ) : (
                    <img
                      src={
                        selectedOption.image ||
                        "https://ig89yd5z8iykrgxva.lite.vusercontent.nethttps://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg"
                      }
                      alt={selectedOption.label}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="p-0 focus:bg-transparent data-[state=checked]:bg-transparent"
              >
                <div
                  className={cn(
                    "rounded-md p-2 transition-colors",
                    value === option.value ? "bg-muted" : "hover:bg-muted/50",
                  )}
                >
                  <OptionItem
                    label={option.label}
                    image={option.image}
                    description={option.description}
                    color={option.color}
                  />
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
