"use client";

import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  InlineStack,
  Image,
  Link,
} from "@shopify/polaris";
import { getUserDetailsQuery } from "./queries";
import { useAuthenticatedQuery } from "@/lib/hooks/useAuthenticatedQuery";
import CreditIcon from "@/icons/CreditIcon";
import PlanIcon from "@/icons/PlanIcon";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getUsageHistory } from "./usage/queries";

const tools = [
  {
    name: "AI Product",
    description: [
      "Transform your products with advanced AI-powered editing and enhancement",
      "Replace backgrounds and place products in realistic lifestyle and commercial settings",
      "Enhance product details and add realistic lighting effects",
      "Change product colors while maintaining texture and details",
      // "Generate multiple product variations and configurations",
      // "Perfect for e-commerce and marketing",
    ],
    link: "/ai-product",
  },
  {
    name: "Smart Background",
    description: [
      "Remove backgrounds from images with precision and accuracy",
      "Replace backgrounds with realistic and natural-looking images",
      "Replace background with any color, image, texture, or pattern",
      "Replace background with AI ",
      // "Enhance image quality and clarity",
      // "Perfect for e-commerce and marketing",
    ],
    link: "/smart-background",
  },
  {
    name: "Upscale Image",
    description: [
      "Enhance image resolution and quality",
      "Increase resolution up to 4x",
      "Enhance details and clarity",
      "Fix pixelation and blur",
      // "Perfect for e-commerce and marketing",
    ],
    link: "/upscale-image",
  },
  {
    name: "Expand Image",
    description: [
      "Extend images seamlessly in any direction",
      "Convert portrait to landscape",
      "Create panoramic views and more",
      "Make images to fit any device",
      // "Perfect for e-commerce and marketing",
    ],
    link: "/expand-image",
  },
  {
    name: "Magic Eraser",
    description: [
      "Remove unwanted objects, people, or elements from images",
      "Perfect for e-commerce and marketing",
      "Replace objects with any object",
      "Insert objects into images",
      // "Perfect for e-commerce and marketing",
    ],
    link: "/magic-eraser",
  },
];

export default function Dashboard() {
  const { data: userData, isLoading: isUserLoading } = useAuthenticatedQuery({
    queryKey: ["user-details"],
    queryFn: getUserDetailsQuery,
  });

  const {
    isLoading,
    data: usageSummary,
    isFetching,
  } = useAuthenticatedQuery({
    queryKey: ["usage-history"],
    queryFn: getUsageHistory,
    staleTime: 1000 * 5,
  });

  const handleUpgradePlan = () => {
    // Navigate to upgrade page or handle upgrade logic
    window.open("/purchase", "_self");
  };

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Page fullWidth>
      <Layout>
        {/* Header Section */}
        <Layout.Section>
          <div
            style={{
              marginBottom: "1.5rem",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <Text variant="headingXl" as="h1">
                Welcome {userData?.firstName}! Transform your creative vision
                with our suite of AI-powered tools.
              </Text>
            </div>
            <div className="flex justify-end flex-1 mr-8 mt-0">
              <Link url="/profile">
                <Button variant="primary" size="large">
                  View usages
                </Button>
              </Link>
            </div>
          </div>
        </Layout.Section>
        <Layout.Section>
          <InlineStack gap="500">
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
                    Credit Available
                  </Text>
                  <Text variant="headingLg" as="h2" fontWeight="bold">
                    {usageSummary?.currentSubscription.pointsBalance}
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
                  <CreditIcon />
                </div>
                <div>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Total Operations
                  </Text>
                  <Text variant="headingLg" as="h2" fontWeight="bold">
                    {usageSummary?.totalOperations}
                  </Text>
                </div>
              </InlineStack>
            </Card>
            <Card>
              <InlineStack align="start" gap="300">
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
                    {usageSummary?.currentSubscription?.plan
                      ? usageSummary.currentSubscription.plan
                          .charAt(0)
                          .toUpperCase() +
                        usageSummary.currentSubscription.plan
                          .slice(1)
                          .toLowerCase()
                      : ""}
                  </Text>
                </div>
              </InlineStack>
            </Card>
            <div
              style={{
                width: "580px",
                marginLeft: "0.7rem",
              }}
            >
              <Card>
                <InlineStack align="start" gap="100">
                  {usageSummary?.usageByTool
                    // .sort((a, b) => b.toolName.length - a.toolName.length)
                    .slice(0, 3)
                    .map((tool, index) => (
                      <div
                        key={tool.toolName}
                        className={
                          "flex flex-col gap-2 pr-4" +
                          (index !== usageSummary?.usageByTool.length - 1
                            ? " border-r-2 border-r-gray-200"
                            : "")
                        }
                      >
                        <Text variant="headingLg" as="h1" alignment="center">
                          {tool.usageCount}
                        </Text>
                        <Text variant="bodySm" as="h4">
                          {tool.toolName.length > 18
                            ? tool.toolName.slice(0, 18) + "..."
                            : tool.toolName}
                        </Text>
                      </div>
                    ))}
                  <div className={"flex flex-col gap-2"}>
                    <Text variant="bodySm" as="h4" alignment="center">
                      Need more credits?
                    </Text>
                    <Button variant="plain" onClick={handleUpgradePlan}>
                      Upgrade your plan
                    </Button>
                  </div>
                </InlineStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>
        <Layout.Section>
          <InlineStack gap="800">
            <Card padding="0">
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  background: "linear-gradient(90deg, #fff 60%, #eaf4ff 100%)",
                  padding: "1.5rem",
                  minHeight: "220px",
                  gap: "3rem",
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
                    Create AI Models in Seconds
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
                  <Link url="/ai-model">
                    <Button variant="primary">Generate AI Model</Button>
                  </Link>
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
            <Card padding="0">
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  background: "linear-gradient(90deg, #fff 60%, #eaf4ff 100%)",
                  padding: "1.5rem",
                  minHeight: "220px",
                  gap: "3rem",
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
                    Virtual Try-On for your clothes
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {[
                      "Select AI model to try on your garment",
                      "Upload your own Model image to try on",
                      "Try on your garment on the model",
                    ].map((item, index) => (
                      <div
                        key={item}
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
                          {item}
                        </Text>
                      </div>
                    ))}
                  </div>
                  <Link url="/virtual-try-on">
                    <Button variant="primary">Try Virtual Try-On</Button>
                  </Link>
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
          </InlineStack>
        </Layout.Section>

        {/* New Section: 4 Tool Cards Row */}
        <Layout.Section>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "stretch",
            }}
          >
            {/* Enhance Image Resolution Card */}
            {tools.map((tool) => (
              <Card key={tool.name} padding="300">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    width: "201px",
                    height: "350px",
                  }}
                >
                  <div>
                    <Text variant="headingMd" as="h3" fontWeight="bold">
                      {tool.name}
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        marginTop: "1rem",
                      }}
                    >
                      {tool.description.map((item) => (
                        <div
                          key={item}
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
                            <p style={{ width: "180px" }}>{item}</p>
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "1rem",
                    }}
                  >
                    <Link url={tool.link}>
                      <Button size="large">{tool.name}</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
