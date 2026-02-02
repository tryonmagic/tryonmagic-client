"use client";

import {
  Page,
  Layout,
  Card,
  Text,
  Link,
  BlockStack,
  Button,
} from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type React from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  category: string;
}

const faqCategories = [
  "General",
  "Credits & Billing",
  "Garments Studio",
  "AI Tools",
  "Technical Support",
];

const faqs: FAQItem[] = [
  // General Questions
  {
    category: "General",
    question: "What is TryOnMagic?",
    answer:
      "TryOnMagic is an AI-powered Shopify app that helps merchants create professional product visuals without expensive photo shoots. Our tools include Garments Studio, AI model generation, product image editing, background removal, image upscaling, and more.",
  },
  {
    category: "General",
    question: "How do I get started?",
    answer:
      "Simply install the app from the Shopify App Store. Once installed, you'll receive free credits to try our tools. Navigate to any tool from the main dashboard and start creating professional product images.",
  },
  {
    category: "General",
    question: "Do I need any design skills to use TryOnMagic?",
    answer:
      "No design skills required! Our AI-powered tools are designed to be user-friendly. Simply upload your images, select your preferences, and let our AI do the work. The interface is intuitive and guides you through each step.",
  },
  {
    category: "General",
    question: "What image formats are supported?",
    answer:
      "We support all common image formats including JPG, JPEG, PNG, and WebP. For best results, we recommend using high-quality images (minimum 800x800 pixels).",
  },
  {
    category: "General",
    question: "Can I use the generated images commercially?",
    answer:
      "Yes! All images generated using TryOnMagic can be used for commercial purposes, including on your Shopify store, marketing materials, social media, and advertising campaigns.",
  },

  // Credits & Billing
  {
    category: "Credits & Billing",
    question: "How do credits work?",
    answer:
      "Credits (also called points) are used to access our AI tools. Each tool requires a different number of credits per use. You can purchase credit packages that suit your needs, and unused credits remain in your account until they expire.",
  },
  {
    category: "Credits & Billing",
    question: "How long are my credits valid for?",
    answer:
      "Credits are valid for 30-90 days depending on your package. The expiration date is clearly shown in your account dashboard after purchase. You can check your credit balance and expiration date anytime in the Usage section.",
  },
  {
    category: "Credits & Billing",
    question: "Can I use my credits across different tools?",
    answer:
      "Yes! Your credits can be used across any of our AI tools. Each tool requires a different number of credits per use, giving you the flexibility to use them however you need. For example, Garments Studio costs 3 credits, while Smart Background costs 1 credit.",
  },
  {
    category: "Credits & Billing",
    question: "Do you offer refunds?",
    answer:
      "We offer refunds within 7 days of purchase if you haven't used more than 10% of your credits. Please contact our support team at support@tryonmagic.com for assistance with refunds.",
  },
  {
    category: "Credits & Billing",
    question: "Can I transfer my credits to another account?",
    answer:
      "Credits are non-transferable between accounts. They are tied to the Shopify store account that purchased them and cannot be shared or transferred.",
  },
  {
    category: "Credits & Billing",
    question: "Do you offer subscriptions?",
    answer:
      "Currently, we only offer one-time credit purchases. This gives you the flexibility to buy credits as needed without recurring charges. You can purchase additional credits anytime from the Purchase page.",
  },
  {
    category: "Credits & Billing",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and Apple Pay. All payments are processed securely through Shopify's billing system.",
  },

  // Garments Studio
  {
    category: "Garments Studio",
    question: "What is Garments Studio?",
    answer:
      "Garments Studio allows you to showcase your clothing products on AI-generated or custom uploaded models. This helps customers visualize how your products will look when worn, increasing confidence and potentially boosting sales.",
  },
  {
    category: "Garments Studio",
    question: "What types of clothing can I use with Garments Studio?",
    answer:
      "Garments Studio supports tops, bottoms, dresses, and full outfits. The tool works best with clear product images on plain backgrounds. For best results, ensure your clothing items are well-lit and clearly visible.",
  },
  {
    category: "Garments Studio",
    question: "Can I use my own model images?",
    answer:
      "Yes! You can upload your own model images or choose from our diverse AI-generated model gallery. Our AI model gallery includes models with various ethnicities, body types, ages, and skin tones to help you represent diverse customers.",
  },
  {
    category: "Garments Studio",
    question: "How long does Garments Studio take?",
    answer:
      "Processing time varies depending on the complexity and selected mode (balanced, quality, or speed). Typically, a Garments Studio render takes 1-3 minutes. You can track progress in real-time through the app interface.",
  },
  {
    category: "Garments Studio",
    question: "What image quality can I expect?",
    answer:
      "Garments Studio produces high-quality images suitable for e-commerce. The quality depends on your input images and selected processing mode. We recommend using high-resolution product images (minimum 1000x1000 pixels) for best results.",
  },

  // AI Tools
  {
    category: "AI Tools",
    question: "What AI tools are available?",
    answer:
      "TryOnMagic offers multiple AI-powered tools: Garments Studio (3 credits), AI Model Generation (2 credits), AI Product Editing (3 credits), Smart Background (1 credit), Image Upscaling (1 credit), Image Expansion (2 credits), and Magic Eraser (2 credits).",
  },
  {
    category: "AI Tools",
    question: "What is AI Product Editing?",
    answer:
      "AI Product Editing allows you to transform product images with scene generation, background replacement, product recoloring, and realistic lighting effects. You can place products in lifestyle settings, change colors while maintaining texture, and enhance product details.",
  },
  {
    category: "AI Tools",
    question: "How does Smart Background work?",
    answer:
      "Smart Background can remove backgrounds with precision, replace them with AI-generated scenes, or replace them with any color, image, texture, or pattern you choose. The tool uses advanced edge detection to ensure clean, professional results.",
  },
  {
    category: "AI Tools",
    question: "What is Image Upscaling?",
    answer:
      "Image Upscaling enhances image resolution up to 4x while improving details and clarity. It's perfect for fixing pixelation, improving low-resolution images, and preparing images for high-quality printing or large displays.",
  },
  {
    category: "AI Tools",
    question: "What is Image Expansion?",
    answer:
      "Image Expansion extends images seamlessly in any direction. You can convert portrait to landscape orientation, create panoramic views, or make images fit any device or aspect ratio. The AI intelligently fills in the expanded areas.",
  },
  {
    category: "AI Tools",
    question: "What is Magic Eraser?",
    answer:
      "Magic Eraser removes unwanted objects, people, or elements from images. You can also replace objects with AI-generated content or insert new objects using text prompts. The tool maintains natural-looking results with precise object selection.",
  },
  {
    category: "AI Tools",
    question: "Can I generate AI models?",
    answer:
      "Yes! Our AI Model Generation tool lets you create diverse fashion models with customizable appearance including ethnicity, gender, age, and skin tone. Generated models can be used for Garments Studio or exported for product visualization.",
  },

  // Technical Support
  {
    category: "Technical Support",
    question: "How do I download my processed images?",
    answer:
      "Once processing is complete, you can download your images directly from the app. Click on the processed image and use the download button. Images are available in high resolution suitable for e-commerce use.",
  },
  {
    category: "Technical Support",
    question: "What happens if processing fails?",
    answer:
      "If processing fails, the credits used for that operation are automatically refunded to your account. You can retry the operation or contact support if the issue persists. Failed operations are clearly marked in your usage history.",
  },
  {
    category: "Technical Support",
    question: "Can I process multiple images at once?",
    answer:
      "Currently, each tool processes one image at a time. However, you can queue multiple operations. Each operation is processed independently, and you can track progress for all queued operations in your usage history.",
  },
  {
    category: "Technical Support",
    question: "How do I track my usage?",
    answer:
      "You can view your usage history, credit balance, and operation statistics in the Usage section of the app. The dashboard shows your total operations, credit consumption, and usage by tool type.",
  },
  {
    category: "Technical Support",
    question: "Is my data secure?",
    answer:
      "Yes, we take data security seriously. All images and data are encrypted in transit and at rest. We comply with GDPR regulations and have implemented industry-standard security measures. See our Privacy Policy for more details.",
  },
  {
    category: "Technical Support",
    question: "How do I contact support?",
    answer: (
      <>
        You can contact our support team at{" "}
        <Link url="mailto:support@tryonmagic.com" external>
          support@tryonmagic.com
        </Link>
        . We typically respond within 24 hours. For urgent issues, please
        include "URGENT" in your subject line.
      </>
    ),
  },
  {
    category: "Technical Support",
    question: "What if I need to uninstall the app?",
    answer:
      "You can uninstall the app at any time from your Shopify admin. Upon uninstallation, all your data will be deleted in accordance with our Privacy Policy and GDPR requirements. Any unused credits will be forfeited.",
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFaqs =
    selectedCategory === "All"
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  return (
    <Page
      title="Frequently Asked Questions"
      backAction={{
        content: "Back",
        onAction: () => router.push("/"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text variant="bodyMd" as="p">
                Find answers to common questions about TryOnMagic. If you can't
                find what you're looking for, please{" "}
                <Link url="mailto:support@tryonmagic.com" external>
                  contact our support team
                </Link>
                .
              </Text>

              {/* Category Filter */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <button
                  onClick={() => setSelectedCategory("All")}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background:
                      selectedCategory === "All" ? "#2563eb" : "white",
                    color: selectedCategory === "All" ? "white" : "#374151",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: selectedCategory === "All" ? "600" : "400",
                  }}
                >
                  All
                </button>
                {faqCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      background:
                        selectedCategory === category ? "#2563eb" : "white",
                      color:
                        selectedCategory === category ? "white" : "#374151",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: selectedCategory === category ? "600" : "400",
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* FAQ Items */}
              <BlockStack gap="400">
                {filteredFaqs.map((faq, index) => {
                  const originalIndex = faqs.indexOf(faq);
                  const isExpanded = expandedItems.has(originalIndex);

                  return (
                    <Card key={originalIndex}>
                      <BlockStack gap="300">
                        <div
                          onClick={() => toggleItem(originalIndex)}
                          style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.5rem 0",
                          }}
                        >
                          <Text
                            variant="headingSm"
                            as="h3"
                            fontWeight="semibold"
                          >
                            {faq.question}
                          </Text>
                          <span
                            style={{
                              fontSize: "1.25rem",
                              color: "#6b7280",
                              transform: isExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.2s",
                            }}
                          >
                            ▼
                          </span>
                        </div>
                        {isExpanded && (
                          <div
                            style={{
                              paddingTop: "0.5rem",
                              borderTop: "1px solid #e5e7eb",
                            }}
                          >
                            <Text variant="bodyMd" as="span">
                              {faq.answer as React.ReactNode}
                            </Text>
                          </div>
                        )}
                      </BlockStack>
                    </Card>
                  );
                })}
              </BlockStack>

              {/* Contact Section */}
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">
                    Still have questions?
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Can't find the answer you're looking for? Our support team
                    is here to help.
                  </Text>
                  <div>
                    <Link url="mailto:support@tryonmagic.com" external>
                      Contact Support
                    </Link>
                  </div>
                </BlockStack>
              </Card>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
