"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { VisualSelect } from "./visual-select"
import { locations, races, genders, ageRanges, skinTones } from "@/data/model-options"

interface ParameterCardProps {
  formData: {
    location: string
    race: string
    gender: string
    age: string
    skinTone: string
  }
  onValueChange: (field: string, value: string) => void
  disabled?: boolean
}

export function ParameterCard({ formData, onValueChange, disabled = false }: ParameterCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-opacity duration-300", disabled && "opacity-60")}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {disabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-800 dark:text-amber-300 text-sm mb-4"
            >
              <p>Parameters are currently ignored due to prompt override.</p>
            </motion.div>
          )}

          <VisualSelect
            label="Location"
            value={formData.location}
            onValueChange={(value) => onValueChange("location", value)}
            options={locations}
            disabled={disabled}
          />

          <VisualSelect
            label="Ethnicity"
            value={formData.race}
            onValueChange={(value) => onValueChange("race", value)}
            options={races}
            disabled={disabled}
          />

          <VisualSelect
            label="Gender"
            value={formData.gender}
            onValueChange={(value) => onValueChange("gender", value)}
            options={genders}
            disabled={disabled}
          />

          <VisualSelect
            label="Age Range"
            value={formData.age}
            onValueChange={(value) => onValueChange("age", value)}
            options={ageRanges}
            disabled={disabled}
          />

          <VisualSelect
            label="Skin Tone"
            value={formData.skinTone}
            onValueChange={(value) => onValueChange("skinTone", value)}
            options={skinTones}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  )
}

