"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Download, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import AspectRatioSelector from "@/app/ai-model/AspectRation";
import { generateAIModel } from "@/lib/api/ai-models";
import { useAppBridge } from "@shopify/app-bridge-react";
import { WebSocketClient } from "@/socket";
import { TaskProgress, TaskStatus } from "@/lib/api/type";
import Image from "next/image";
import EnhancedImage from "./ui/EnhanchedImage";

const locations = [
  {
    value: "studio",
    label: "Studio",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Professional studio setting with controlled lighting",
  },
  {
    value: "beach",
    label: "Beach",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Sunny beach with ocean views",
  },
  {
    value: "urban",
    label: "Urban Street",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "City streets with urban architecture",
  },
  {
    value: "runway",
    label: "Fashion Runway",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Professional fashion runway with spotlights",
  },
  {
    value: "nature",
    label: "Nature",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Natural outdoor settings with greenery",
  },
  {
    value: "cafe",
    label: "Café",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Cozy café interior with ambient lighting",
  },
  {
    value: "luxury",
    label: "Luxury Interior",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Upscale interior with elegant furnishings",
  },
];

const races = [
  {
    value: "east-asian",
    label: "East Asian",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "East Asian features and characteristics",
  },
  {
    value: "south-asian",
    label: "South Asian",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "South Asian features and characteristics",
  },
  {
    value: "indian",
    label: "Indian",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Indian features and characteristics",
  },
  {
    value: "american",
    label: "American",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "American features and characteristics",
  },
  {
    value: "african",
    label: "African",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "African features and characteristics",
  },
  {
    value: "european",
    label: "European",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "European features and characteristics",
  },
  {
    value: "middle-eastern",
    label: "Middle Eastern",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Middle Eastern features and characteristics",
  },
];

const genders = [
  {
    value: "female",
    label: "Female",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Female model characteristics",
  },
  {
    value: "male",
    label: "Male",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Male model characteristics",
  },
  {
    value: "non-binary",
    label: "Non-binary",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Non-binary model characteristics",
  },
];

const ageRanges = [
  {
    value: "18-25",
    label: "18-25",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Young adult age range",
  },
  {
    value: "26-35",
    label: "26-35",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Adult age range",
  },
  {
    value: "36-45",
    label: "36-45",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Middle adult age range",
  },
  {
    value: "46-60",
    label: "46-60",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Mature adult age range",
  },
  {
    value: "60+",
    label: "60+",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Senior age range",
  },
];

const skinTones = [
  {
    value: "fair",
    label: "Fair",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    color: "#FFDBAC",
    description: "Very light skin tone",
  },
  {
    value: "light",
    label: "Light",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    color: "#F1C27D",
    description: "Light skin tone",
  },
  {
    value: "medium",
    label: "Medium",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    color: "#E0AC69",
    description: "Medium skin tone",
  },
  {
    value: "olive",
    label: "Olive",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    color: "#C68642",
    description: "Olive skin tone",
  },
  {
    value: "tan",
    label: "Tan",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    color: "#8D5524",
    description: "Tan skin tone",
  },
  {
    value: "deep",
    label: "Deep",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    color: "#5E2F0D",
    description: "Deep skin tone",
  },
  {
    value: "dark",
    label: "Dark",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    color: "#321A0A",
    description: "Dark skin tone",
  },
];

interface OptionItemProps {
  label: string;
  image: string;
  description?: string;
  color?: string;
}

function OptionItem({ label, image, description, color }: OptionItemProps) {
  return (
    <div className="flex items-center space-x-3 p-1">
      <div className="relative h-12 w-12 overflow-hidden rounded-md">
        {color ? (
          <div
            className="absolute inset-0 rounded-md"
            style={{ backgroundColor: color }}
          />
        ) : (
          <Image
            src={
              image ||
              "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg"
            }
            alt={label}
            className="h-full w-full object-cover"
            width={100}
            height={100}
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
}

function VisualSelect({
  value,
  onValueChange,
  options,
  label,
}: VisualSelectProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
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
                    <Image
                      src={
                        selectedOption.image ||
                        "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg"
                      }
                      alt={selectedOption.label}
                      className="h-full w-full object-cover"
                      width={32}
                      height={32}
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

export default function AIFashionGenerator() {
  const [formData, setFormData] = useState({
    location: "studio",
    race: "american",
    gender: "female",
    age: "26-35",
    skinTone: "medium",
    prompt:
      "Elegant fashion model wearing a designer dress with professional lighting",
    negativePrompt:
      "distorted features, unrealistic proportions, poor lighting",
    aspectRatio: "3:4",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");
  const [activeTab, setActiveTab] = useState("form");
  const [overrideParameters, setOverrideParameters] = useState(false);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const appBridge = useAppBridge();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActiveTab("result");
    const sessionToken = await appBridge.idToken();
    const response = await generateAIModel(sessionToken, {
      prompt: formData.prompt,
      negativePrompt: formData.negativePrompt,
      modelLocation: formData.location,
      ethnicity: formData.race,
      skinTone: formData.skinTone,
      ageRange: formData.age,
      aspectRatio: formData.aspectRatio,
      overrideParameters,
      gender: formData.gender,
    });
    const task = response.data.data;
    if (!task) {
      console.error("No task data returned");
      return;
    }

    const websocket = new WebSocketClient(task.userId);
    websocket.on<TaskProgress>("task-progress", (data) => {
      console.log("WebSocket data received:", data);
      setTaskProgress(data);
      if (data.status === TaskStatus.SUCCEEDED) {
        setIsGenerating(false);
        setGeneratedImage(data.resultData?.outputImageUrl || "");
      }
    });
  };

  const handleReset = () => {
    setGeneratedImage("");
    setActiveTab("form");
  };

  // Get the selected location image for the preview
  const selectedLocation =
    locations.find((loc) => loc.value === formData.location)?.image || "";

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="form">Parameters</TabsTrigger>
          <TabsTrigger value="result">Result</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <VisualSelect
                    label="Location"
                    value={formData.location}
                    onValueChange={(value) =>
                      handleInputChange("location", value)
                    }
                    options={locations}
                  />

                  <VisualSelect
                    label="Ethnicity"
                    value={formData.race}
                    onValueChange={(value) => handleInputChange("race", value)}
                    options={races}
                  />

                  <VisualSelect
                    label="Gender"
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleInputChange("gender", value)
                    }
                    options={genders}
                  />

                  <VisualSelect
                    label="Age Range"
                    value={formData.age}
                    onValueChange={(value) => handleInputChange("age", value)}
                    options={ageRanges}
                  />

                  <VisualSelect
                    label="Skin Tone"
                    value={formData.skinTone}
                    onValueChange={(value) =>
                      handleInputChange("skinTone", value)
                    }
                    options={skinTones}
                  />
                  <AspectRatioSelector
                    defaultValue="3:4"
                    onChange={(value) =>
                      handleInputChange("aspectRatio", value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="override-toggle"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Override parameters with prompt
                      </Label>
                      <Switch
                        id="override-toggle"
                        checked={overrideParameters}
                        onCheckedChange={setOverrideParameters}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>

                    {overrideParameters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-800 dark:text-amber-300 text-sm"
                      >
                        <p>
                          Parameter selections will be ignored. The AI will
                          generate based solely on your prompt.
                        </p>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="prompt">Prompt</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Describe the fashion model and outfit..."
                        value={formData.prompt}
                        onChange={(e) =>
                          handleInputChange("prompt", e.target.value)
                        }
                        className="min-h-[120px] resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="negativePrompt">Negative Prompt</Label>
                      <Textarea
                        id="negativePrompt"
                        placeholder="Elements to avoid in the generation..."
                        value={formData.negativePrompt}
                        onChange={(e) =>
                          handleInputChange("negativePrompt", e.target.value)
                        }
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Preview Settings</h3>
                      {overrideParameters && (
                        <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded-full">
                          Parameters Ignored
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "grid grid-cols-2 gap-4 transition-opacity duration-300",
                        overrideParameters && "opacity-50",
                      )}
                    >
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Location</div>
                        <div className="h-24 rounded-md overflow-hidden">
                          <Image
                            src={
                              selectedLocation ||
                              "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg"
                            }
                            alt="Selected location"
                            className="h-full w-full object-cover"
                            width={150}
                            height={96}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Model Characteristics
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="px-2 py-1 bg-muted rounded-full text-xs">
                            {
                              races.find((r) => r.value === formData.race)
                                ?.label
                            }
                          </div>
                          <div className="px-2 py-1 bg-muted rounded-full text-xs">
                            {
                              genders.find((g) => g.value === formData.gender)
                                ?.label
                            }
                          </div>
                          <div className="px-2 py-1 bg-muted rounded-full text-xs">
                            {
                              ageRanges.find((a) => a.value === formData.age)
                                ?.label
                            }
                          </div>
                          <div
                            className="px-2 py-1 rounded-full text-xs flex items-center gap-1"
                            style={{
                              backgroundColor: skinTones.find(
                                (s) => s.value === formData.skinTone,
                              )?.color,
                              color: ["fair", "light", "medium"].includes(
                                formData.skinTone,
                              )
                                ? "#000"
                                : "#fff",
                            }}
                          >
                            <span>
                              {
                                skinTones.find(
                                  (s) => s.value === formData.skinTone,
                                )?.label
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      size="lg"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Fashion Model
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="result" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center"
          >
            <Card className="w-full max-w-2xl mx-auto overflow-hidden">
              <CardContent className="p-6">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center min-h-[500px]">
                    <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
                    <p className="text-lg text-center text-slate-600 dark:text-slate-400">
                      Generating your fashion model...
                    </p>
                    {!overrideParameters ? (
                      <p className="text-sm text-center text-slate-500 dark:text-slate-500 mt-2 max-w-md">
                        Creating a {formData.gender} model with {formData.race}{" "}
                        features, age {formData.age}, {formData.skinTone} skin
                        tone, in a {formData.location} setting
                      </p>
                    ) : (
                      <p className="text-sm text-center text-slate-500 dark:text-slate-500 mt-2 max-w-md">
                        Using your prompt to generate a custom fashion model
                      </p>
                    )}
                  </div>
                ) : generatedImage ? (
                  <div className="space-y-4">
                    <EnhancedImage
                      src={generatedImage}
                      alt="Generated fashion model"
                      className="w-full h-auto rounded-lg shadow-lg object-cover aspect-[3/4]"
                      height={700}
                      width={500}
                    />

                    <div className="flex space-x-4">
                      <Button
                        onClick={handleReset}
                        // variant="outline"
                        className="flex-1"
                      >
                        Modify Parameters
                      </Button>
                      <Button
                        onClick={handleGenerate}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate New
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[500px]">
                    <p className="text-lg text-center text-slate-600 dark:text-slate-400">
                      Configure your parameters and generate a fashion model
                    </p>
                    <Button
                      onClick={() => setActiveTab("form")}
                      // variant="outline"
                      className="mt-4"
                    >
                      Go to Parameters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
