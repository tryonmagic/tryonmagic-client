"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Zap,
  ImagePlus,
  Wand2,
  SunMedium,
  Maximize,
  Eraser,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[40rem] w-[40rem] rounded-full bg-purple-600/20 blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
            <span className="relative">
              <span className="text-white">Prodigy</span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                AI
              </span>
              <span className="absolute -top-16 left-1/2 -translate-x-1/2">
                <Sparkles className="h-12 w-12 text-purple-400 opacity-50" />
              </span>
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300 md:text-xl">
            Transform your creative vision with our suite of AI-powered tools.
            From fashion models to image enhancement, ProdigyAI brings your
            ideas to life.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              asChild
            >
              <Link href="/ai-model">
                Try AI Model <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              //  variant="outline"
              className="border-purple-400 text-white hover:bg-purple-950"
              asChild
            >
              <Link href="/purchase">
                Get 200 Points <ShoppingCart className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Powerful AI Tools at Your Fingertips
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Discover our comprehensive suite of AI-powered tools designed to
              elevate your creative projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-slate-800/50 backdrop-blur-sm"
              >
                <CardContent className="p-0">
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={feature.image || "/placeholder.svg"}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <feature.icon className="h-5 w-5 text-purple-400" />
                          <h3 className="font-bold text-white text-lg">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-white/80 text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                        What you can do:
                      </h4>
                      <ul className="space-y-2">
                        {feature.capabilities.map((capability, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-slate-700 dark:text-slate-300"
                          >
                            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1 mt-0.5">
                              <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm">{capability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      asChild
                    >
                      <Link href={feature.link}>
                        Try {feature.title}{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Fashion Model Showcase */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900 dark:to-purple-900/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                AI Fashion Model Generator
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                Create stunning fashion models with AI in seconds. Our advanced
                AI technology allows you to customize every aspect of your
                model, from ethnicity and gender to age and skin tone.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 mt-0.5">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Customizable Parameters
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Control every detail from location and ethnicity to
                      clothing style
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 mt-0.5">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Advanced Prompt Engineering
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Fine-tune your results with detailed prompts and negative
                      prompts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 mt-0.5">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      High-Resolution Output
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Generate professional-quality images ready for your
                      marketing campaigns
                    </p>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                asChild
              >
                <Link href="/ai-model">
                  Create Your Fashion Model{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full bg-purple-400/10 blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-pink-400/10 blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg shadow-lg">
                    <Image
                      src="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=500&width=400"
                      alt="Fashion model example 1"
                      width={400}
                      height={500}
                      className="object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg shadow-lg">
                    <Image
                      src="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=500&width=400"
                      alt="Fashion model example 2"
                      width={400}
                      height={500}
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="overflow-hidden rounded-lg shadow-lg">
                    <Image
                      src="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=500&width=400"
                      alt="Fashion model example 3"
                      width={400}
                      height={500}
                      className="object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg shadow-lg">
                    <Image
                      src="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=500&width=400"
                      alt="Fashion model example 4"
                      width={400}
                      height={500}
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Examples */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              See the Magic in Action
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Witness the transformative power of our AI tools with these before
              and after examples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beforeAfterExamples.map((example, index) => (
              <Card key={index} className="overflow-hidden border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <example.icon className="h-5 w-5 text-purple-500" />
                    {example.title}
                  </h3>
                  <div className="relative">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                          Before
                        </p>
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                          <Image
                            src={example.before || "/placeholder.svg"}
                            alt={`Before ${example.title}`}
                            width={300}
                            height={300}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                          After
                        </p>
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                          <Image
                            src={example.after || "/placeholder.svg"}
                            alt={`After ${example.title}`}
                            width={300}
                            height={300}
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <Button
                        className="bg-black/70 hover:bg-black/90 text-white"
                        asChild
                      >
                        <Link href={example.link}>
                          Try it now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                    {example.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/Points Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Purchase points and use them across all our AI tools
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="overflow-hidden border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">
                    200 ProdigyAI Points
                  </h3>
                  <p className="opacity-90">
                    Everything you need to bring your creative vision to life
                  </p>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                      $19.99
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {" "}
                      one-time purchase
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1 mt-0.5">
                        <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm">
                        Generate 20 AI fashion models
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1 mt-0.5">
                        <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm">
                        Remove backgrounds from 40 images
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1 mt-0.5">
                        <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm">
                        Upscale or relight 25 images
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1 mt-0.5">
                        <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm">
                        Mix and match points across all tools
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1 mt-0.5">
                        <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm">
                        No subscription, use at your own pace
                      </span>
                    </li>
                  </ul>
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    asChild
                  >
                    <Link href="/purchase">
                      Get 200 Points <ShoppingCart className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Ready to Transform Your Creative Process?
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            Join thousands of creators who are already using ProdigyAI to bring
            their ideas to life
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-900 hover:bg-slate-100"
            asChild
          >
            <Link href="/ai-model">
              Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: "AI Model",
    description: "Generate custom fashion models for your brand or project",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=500",
    icon: Sparkles,
    link: "/ai-model",
    capabilities: [
      "Create diverse fashion models with customizable attributes",
      "Control ethnicity, gender, age, and skin tone",
      "Choose from various settings and environments",
      "Perfect for fashion brands and e-commerce",
    ],
  },
  {
    title: "AI Product",
    description:
      "Transform product photography with AI-generated backgrounds and styling",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=500",
    icon: ImagePlus,
    link: "/ai-product",
    capabilities: [
      "Place products in custom environments",
      "Create lifestyle product photography",
      "Generate multiple variations quickly",
      "Ideal for e-commerce and marketing",
    ],
  },
  {
    title: "Remove BG",
    description:
      "Instantly remove backgrounds from any image with perfect edge detection",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=500",
    icon: Eraser,
    link: "/remove-bg",
    capabilities: [
      "One-click background removal",
      "Preserve fine details like hair and transparent objects",
      "Batch process multiple images",
      "Download with transparent background",
    ],
  },
  {
    title: "Upscale",
    description: "Enhance image resolution without losing quality",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=500",
    icon: Wand2,
    link: "/upscale",
    capabilities: [
      "Increase image resolution up to 4x",
      "Enhance details and clarity",
      "Fix pixelation and blur",
      "Perfect for old photos or low-quality images",
    ],
  },
  {
    title: "Relight",
    description: "Change the lighting of any image to create the perfect mood",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=500",
    icon: SunMedium,
    link: "/relight",
    capabilities: [
      "Adjust lighting direction and intensity",
      "Create dramatic shadows or soft illumination",
      "Change time of day in outdoor photos",
      "Enhance product photography lighting",
    ],
  },
  {
    title: "Expand Image",
    description:
      "Seamlessly extend your images beyond their original boundaries",
    image:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=500",
    icon: Maximize,
    link: "/expand-image",
    capabilities: [
      "Extend backgrounds in any direction",
      "Convert portrait to landscape (and vice versa)",
      "Create panoramic views from standard photos",
      "Perfect for social media and marketing materials",
    ],
  },
];

const beforeAfterExamples = [
  {
    title: "Background Removal",
    before:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300",
    after:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300",
    description:
      "Clean, professional product images with backgrounds completely removed.",
    icon: Eraser,
    link: "/remove-bg",
  },
  {
    title: "Image Upscaling",
    before:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300",
    after:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300",
    description:
      "Transform low-resolution images into crisp, detailed high-resolution photos.",
    icon: Wand2,
    link: "/upscale",
  },
  {
    title: "Relighting",
    before:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300",
    after:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300",
    description:
      "Change the lighting direction and mood of your photos with AI precision.",
    icon: SunMedium,
    link: "/relight",
  },
];
