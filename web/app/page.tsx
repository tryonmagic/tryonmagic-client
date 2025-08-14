"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  ProgressBar,
  Badge,
  ButtonGroup,
  Grid,
  Icon,
  Banner,
  InlineStack,
  Box,
  Tooltip,
  Image,
} from "@shopify/polaris";
import {
  CreditCardIcon,
  StarFilledIcon,
  ImageIcon,
  PlusCircleIcon,
  EyeDropperIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useQuery } from "@tanstack/react-query";
import { getUserDetailsQuery } from "./queries";
import { useAuthenticatedQuery } from "@/lib/hooks/useAuthenticatedQuery";
import CreditIcon from "@/icons/CreditIcon";
import PlanIcon from "@/icons/PlanIcon";

interface ToolUsage {
  name: string;
  used: number;
  total: number;
  description: string;
  icon: any;
  link: string;
  buttonText: string;
}

const toolsUsage: ToolUsage[] = [
  {
    name: "Model Generation",
    used: 20,
    total: 0,
    description:
      "Customizable diverse fashion models. Ethnicity, gender, age, and skin tone. From various settings and environments",
    icon: StarFilledIcon,
    link: "/ai-model",
    buttonText: "Try Custom AI Model",
  },
  {
    name: "Image Expand",
    used: 40,
    total: 0,
    description:
      "Fine details like hair and transparent objects. Batch process multiple images. Perfect edge detection",
    icon: PlusCircleIcon,
    link: "/expand-image",
    buttonText: "Extend Image Seamlessly",
  },
  {
    name: "Image Upscale",
    used: 25,
    total: 0,
    description:
      "Increase resolution up to 4x. Enhance details and clarity. Fix pixelation and blur",
    icon: ImageIcon,
    link: "/upscale",
    buttonText: "Remove Background",
  },
  {
    name: "Magic Eraser",
    used: 20,
    total: 0,
    description:
      "Customizable diverse. Ethnicity, gender, age. From various settings",
    icon: EyeDropperIcon,
    link: "/magic-eraser",
    buttonText: "Use Virtual Try-On",
  },
];

const toolCards = [
  {
    title: "One-click background removal",
    description:
      "Fine details like hair and transparent objects. Batch process multiple images. Perfect edge detection",
    image: "/api/placeholder/400/300",
    buttonText: "Remove Background",
    link: "/remove-bg",
    before: "/api/placeholder/150/150",
    after: "/api/placeholder/150/150",
  },
  {
    title: "Expand your images",
    description:
      "Backgrounds in any direction. Convert portrait to landscape. Create panoramic views & More",
    buttonText: "Extend Image Seamlessly",
    link: "/expand-image",
  },
  {
    title: "Try AI product photography",
    description:
      "Products in custom environments. Lifestyle product photography. Ideal for e-commerce and marketing",
    buttonText: "Make Product Photo",
    link: "/ai-product",
  },
  {
    title: "Try clothes on AI models",
    description:
      "Customizable diverse. Ethnicity, gender, age. From various settings",
    buttonText: "Use Virtual Try-On",
    link: "/virtual-try-on",
  },
];

export default function Dashboard() {
  const app = useAppBridge();

  const { data: userData, isLoading: isUserLoading } = useAuthenticatedQuery({
    queryKey: ["user-details"],
    queryFn: getUserDetailsQuery,
  });

  const handleUpgradePlan = () => {
    // Navigate to upgrade page or handle upgrade logic
    window.open("/purchase", "_self");
  };

  const toolUsage = [
    {
      name: "Model Generation",
      used: 20,
      remaining: 0,
    },
    {
      name: "AI Product",
      used: 20,
      remaining: 0,
    },
    {
      name: "Virtual Try-On",
      used: 20,
      remaining: 0,
    },
    {
      name: "Image Expand",
      used: 20,
      remaining: 0,
    },
  ];

  if (isUserLoading) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <Text variant="headingMd" as="h2">
                  Loading dashboard...
                </Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page fullWidth>
      <Layout>
        {/* Header Section */}
        <Layout.Section>
          <div style={{ marginBottom: "1.5rem", width: 490 }}>
            <Text variant="headingXl" as="h1">
              Welcome {userData?.firstName}! Transform your creative vision with
              our suite of AI-powered tools.
            </Text>
          </div>
        </Layout.Section>
        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <InlineStack align="start" gap="400">
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#f0f8ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CreditIcon />
                </div>
                <div>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Total Credit
                  </Text>
                  <Text variant="headingLg" as="h2" fontWeight="bold">
                    100
                  </Text>
                </div>
              </InlineStack>
            </Card>
            <Card>
              <InlineStack align="start" gap="400">
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#f0f8ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <PlanIcon />
                </div>
                <div>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Your Plan
                  </Text>
                  <Text variant="headingLg" as="h2" fontWeight="bold">
                    Free
                  </Text>
                </div>
              </InlineStack>
            </Card>
            <Card padding="0">
              <div style={{ backgroundColor: "#F3FAFF", padding: "1rem" }}>
                <InlineStack align="start" gap="400">
                  {toolUsage.map((tool, index) => (
                    <div
                      key={tool.name}
                      className={
                        "flex flex-col gap-2 pr-4" +
                        (index !== toolUsage.length - 1
                          ? " border-r-2 border-r-gray-200"
                          : "")
                      }
                    >
                      <Text variant="headingLg" as="h1" alignment="center">
                        {tool.used}/{tool.remaining}
                      </Text>
                      <Text variant="bodySm" as="h4">
                        {tool.name}
                      </Text>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 pr-4">
                    <Text variant="bodySm" as="h4" alignment="center">
                      See all usage
                    </Text>
                  </div>
                  <div className={"flex flex-col gap-2 pr-4"}>
                    <Text variant="bodySm" as="h4" alignment="center">
                      Need more credits?
                    </Text>
                    <Button variant="plain" onClick={handleUpgradePlan}>
                      Upgrade your plan
                    </Button>
                  </div>
                </InlineStack>
              </div>
            </Card>
          </InlineStack>
        </Layout.Section>
        <Layout.Section>
          <InlineStack gap="400">
            <Card padding="0">
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  background: "linear-gradient(90deg, #fff 60%, #eaf4ff 100%)",
                  padding: "1.5rem",
                  minHeight: "220px",
                  gap: "2rem",
                }}
              >
                {/* Left Side: Text and Button */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="headingMd" as="h3" fontWeight="bold">
                    Create AI Models in Minutes
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ color: "#29A0FC", fontSize: "1.2em" }}>
                        ✦
                      </span>
                      <Text variant="bodyMd" as="span">
                        Customizable diverse fashion models
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ color: "#29A0FC", fontSize: "1.2em" }}>
                        ✦
                      </span>
                      <Text variant="bodyMd" as="span">
                        Ethnicity, gender, age, and skin tone
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ color: "#29A0FC", fontSize: "1.2em" }}>
                        ✦
                      </span>
                      <Text variant="bodyMd" as="span">
                        From various settings and environments
                      </Text>
                    </div>
                  </div>
                  <Button>Try Custom AI Model</Button>
                </div>
                {/* Right Side: Images Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 56px)",
                    gridTemplateRows: "repeat(2, 56px)",
                    gap: "12px",
                    alignItems: "center",
                    justifyItems: "center",
                    background:
                      "linear-gradient(120deg, #eaf4ff 60%, #fff0 100%)",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <Image
                      key={item}
                      source="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaiApYmBJJ72ZqYFdzKrdfCsXtnjAin1nD8A&s"
                      alt="Model 1"
                      style={{
                        borderRadius: "8px",
                        width: "56px",
                        height: "56px",
                        objectFit: "cover",
                      }}
                    />
                  ))}
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex flex-col gap-2">
                <div></div>
                <Text variant="bodySm" as="h4">
                  View all orders
                </Text>
              </div>
            </Card>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
