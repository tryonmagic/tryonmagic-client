"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Check,
  ShoppingCart,
  Sparkles,
  Eraser,
  Wand2,
  ImagePlus,
  Maximize,
  Shield,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Shirt,
  Palette,
  Replace,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { subscribedPlan } from "./queries";
import { useAppBridge } from "@shopify/app-bridge-react";
import { PaymentMethod, SubscriptionPlan } from "./type";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

interface PricingTier {
  id: SubscriptionPlan;
  name: string;
  price: number;
  points: number;
  description: string;
  features: string[];
  popular?: boolean;
}

interface ToolUsage {
  tool: string;
  icon: React.ElementType;
  pointsPerUse: number;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
  open?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: SubscriptionPlan.FREE,
    name: "Free",
    price: 0,
    points: 10,
    description: "Perfect for trying out our AI tools",
    features: [
      "Generate 10 AI fashion models",
      "Remove backgrounds from 20 images",
      "Upscale or relight 12 images",
      "Use Magic Eraser on 10 images",
      "Valid for 30 days",
    ],
  },
  {
    id: SubscriptionPlan.BASIC,
    name: "Basic",
    price: 9.99,
    points: 100,
    description: "Our most popular option for creators",
    features: [
      "Generate 20 AI fashion models",
      "Remove backgrounds from 40 images",
      "Upscale or relight 25 images",
      "Use Magic Eraser on 20 images",
      "Valid for 60 days",
    ],
    popular: true,
  },
  {
    id: SubscriptionPlan.PRO,
    name: "Professional",
    price: 29.99,
    points: 500,
    description: "Ideal for professional creators and businesses",
    features: [
      "Generate 50 AI fashion models",
      "Remove backgrounds from 100 images",
      "Upscale or relight 62 images",
      "Use Magic Eraser on 50 images",
      "Valid for 90 days",
    ],
  },
  {
    id: SubscriptionPlan.ENTERPRISE,
    name: "Enterprise",
    price: 99.99,
    points: 2000,
    description: "Ideal for large businesses and organizations",
    features: [
      "Generate 100 AI fashion models",
      "Remove backgrounds from 200 images",
      "Upscale or relight 125 images",
      "Use Magic Eraser on 100 images",
      "Valid for 180 days",
    ],
  },
];

const toolUsage: ToolUsage[] = [
  {
    tool: "AI Fashion Model",
    icon: Sparkles,
    pointsPerUse: 2,
    description: "Generate custom fashion models with various attributes",
  },
  {
    tool: "Remove Background",
    icon: Eraser,
    pointsPerUse: 1,
    description: "Remove image backgrounds with precision",
  },
  {
    tool: "Virtual Try-On",
    icon: Shirt,
    pointsPerUse: 3,
    description: "Try on clothes virtually with AI technology",
  },
  {
    tool: "Upscale Image",
    icon: Wand2,
    pointsPerUse: 1,
    description: "Enhance image resolution and quality",
  },
  {
    tool: "Enhance Image",
    icon: Palette,
    pointsPerUse: 2,
    description: "Improve image quality and lighting",
  },
  {
    tool: "Expand Image",
    icon: Maximize,
    pointsPerUse: 2,
    description: "Extend image boundaries seamlessly",
  },
  {
    tool: "Magic Eraser",
    icon: Eraser,
    pointsPerUse: 2,
    description: "Remove unwanted objects from images",
  },
  {
    tool: "AI Product",
    icon: ImagePlus,
    pointsPerUse: 3,
    description: "Transform product photography with AI styling",
  },
  {
    tool: "Replace Background",
    icon: Replace,
    pointsPerUse: 1,
    description: "Replace image backgrounds with new scenes",
  },
  {
    tool: "Generate Image",
    icon: Image,
    pointsPerUse: 2,
    description: "Create new images from text descriptions",
  },
];

const faqs: FAQ[] = [
  {
    question: "How long are my points valid for?",
    answer:
      "Points are valid for 30-90 days depending on your package. The expiration date is clearly shown in your account dashboard after purchase.",
  },
  {
    question: "Can I use my points across different tools?",
    answer:
      "Yes! Your points can be used across any of our AI tools. Each tool requires a different number of points per use, giving you the flexibility to use them however you need.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer refunds within 7 days of purchase if you haven't used more than 10% of your points. Please contact our support team for assistance with refunds.",
  },
  {
    question: "Can I transfer my points to another account?",
    answer:
      "Points are non-transferable between accounts. They are tied to the account that purchased them.",
  },
  {
    question: "Do you offer subscriptions?",
    answer:
      "Currently, we only offer one-time purchases. This gives you the flexibility to buy points as needed without recurring charges.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and Apple Pay.",
  },
];

export default function PurchasePage() {
  const [selectedTier, setSelectedTier] = useState<string>("standard");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const appBridge = useAppBridge();

  const handlePurchase = async () => {
    setIsProcessing(true);

    try {
      const token = await appBridge.idToken();
      const response = await subscribedPlan(token, {
        plan: SubscriptionPlan.FREE,
        paymentMethod: PaymentMethod.SHOPIFY,
        referenceId: Math.random().toString(36).substring(2, 15),
      });
      toast.success(
        `Points purchased successfully: ${response.data.data?.plan}`,
      );
      // setIsProcessing(false);
      // setPurchaseComplete(true);
    } catch (error) {
      console.error(error);
      let message = "Failed to purchase points";
      if (error instanceof AxiosError) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const selectedPlan =
    pricingTiers.find((tier) => tier.id === selectedTier) || pricingTiers[1];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to home</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Purchase Points
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Buy points to use across all our AI-powered tools
            </p>
          </div>
        </div>

        {purchaseComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-0 shadow-xl">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    Purchase Complete!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedPlan.points} points have been added to your account
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium mb-2">Purchase Summary</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      Plan
                    </span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      Points
                    </span>
                    <span className="font-medium">{selectedPlan.points}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      Amount Paid
                    </span>
                    <span className="font-medium">
                      ${selectedPlan.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Order ID
                    </span>
                    <span className="font-medium">
                      ORD-{Math.floor(Math.random() * 1000000)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button asChild>
                    <Link href="/">Return to Home</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/ai-model">Start Creating</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingTiers.map((tier) => (
                  <Card
                    key={tier.id}
                    className={`border-2 transition-all ${
                      selectedTier === tier.id
                        ? "border-purple-600 dark:border-purple-500 shadow-lg"
                        : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    } ${tier.popular ? "relative" : ""}`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-0 right-0 flex justify-center">
                        <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardHeader className={tier.popular ? "pt-6" : ""}>
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">
                          ${tier.price.toFixed(2)}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {" "}
                          one-time
                        </span>
                      </div>
                      <div className="mb-4">
                        <span className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                          {tier.points} Points
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {tier.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant={
                          selectedTier === tier.id ? "default" : "outline"
                        }
                        className="w-full"
                        onClick={() => setSelectedTier(tier.id)}
                      >
                        {selectedTier === tier.id ? "Selected" : "Select"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div> */}

              <Card className="bg-green-100 dark:bg-green-900/30">
                <CardHeader>
                  <CardDescription>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Currently, we are giving first 100 users a limited credit
                      of <b>20 points</b> to try our app. Soon, the subscription
                      plan will be published for more credit.
                    </p>

                    <Button
                      variant="outline"
                      onClick={handlePurchase}
                      className="mt-4 text-purple-600 dark:text-purple-400"
                    >
                      Get 20 Points for Free (Limited Time Offer)
                    </Button>
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Points Usage</CardTitle>
                  <CardDescription>
                    Here's how many points each tool requires per use
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {toolUsage.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <div
                          key={tool.tool}
                          className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 mt-0.5">
                            <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{tool.tool}</h3>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3.5 w-3.5 text-slate-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      {tool.description}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                              {tool.pointsPerUse} points per use
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                      >
                        <button
                          className="flex items-center justify-between w-full p-4 text-left font-medium"
                          onClick={() => toggleFaq(index)}
                        >
                          {faq.question}
                          {expandedFaqs[index] ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                        {expandedFaqs[index] && (
                          <div className="p-4 pt-0 text-slate-600 dark:text-slate-400">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* <div>
              <div className="sticky top-20">
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle>Checkout</CardTitle>
                    <CardDescription>
                      Complete your purchase to get {selectedPlan.points} points
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-600 dark:text-slate-400">
                          Plan
                        </span>
                        <span className="font-medium">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-600 dark:text-slate-400">
                          Points
                        </span>
                        <span className="font-medium">
                          {selectedPlan.points}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${selectedPlan.price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3">
                        Payment Method
                      </h3>
                      <Tabs defaultValue="card" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger
                            value="card"
                            onClick={() => setPaymentMethod("card")}
                          >
                            Card
                          </TabsTrigger>
                          <TabsTrigger
                            value="paypal"
                            onClick={() => setPaymentMethod("paypal")}
                          >
                            PayPal
                          </TabsTrigger>
                          <TabsTrigger
                            value="applepay"
                            onClick={() => setPaymentMethod("applepay")}
                          >
                            Apple Pay
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="card" className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name on Card</Label>
                            <Input id="name" placeholder="John Smith" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="card-number">Card Number</Label>
                            <Input
                              id="card-number"
                              placeholder="1234 5678 9012 3456"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input id="expiry" placeholder="MM/YY" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cvc">CVC</Label>
                              <Input id="cvc" placeholder="123" />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="paypal" className="mt-4">
                          <div className="text-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                              You'll be redirected to PayPal to complete your
                              purchase.
                            </p>
                            <Image
                              src="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=60&width=120"
                              alt="PayPal"
                              width={120}
                              height={60}
                              className="mx-auto"
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="applepay" className="mt-4">
                          <div className="text-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                              Complete your purchase with Apple Pay.
                            </p>
                            <Image
                              src="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=60&width=120"
                              alt="Apple Pay"
                              width={120}
                              height={60}
                              className="mx-auto"
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="lg"
                      onClick={handlePurchase}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Complete Purchase
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <Shield className="h-3 w-3" />
                      <span>Secure Payment</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>Instant Access</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                        Need more points?
                      </h3>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        For enterprise needs or bulk purchases, please{" "}
                        <Link href="#" className="underline">
                          contact our sales team
                        </Link>{" "}
                        for custom pricing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        )}

        <div className="mt-16 mb-8 text-center">
          <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Why Choose TryOnMagic?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">State-of-the-Art AI</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Our tools use the latest AI technology to deliver exceptional
                  results that look professional and natural.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Flexible Pricing</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Pay only for what you need with our points system. No
                  subscriptions or hidden fees.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Privacy & Security</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Your images and data are processed securely and never shared
                  with third parties.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
