"use client";

import {
  Page,
  Layout,
  Card,
  Text,
  Link,
  BlockStack,
  Badge,
} from "@shopify/polaris";
import { useRouter } from "next/navigation";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  changes: {
    type: "feature" | "improvement" | "fix" | "security";
    description: string;
  }[];
}

const changelogEntries: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2024-12-15",
    type: "major",
    changes: [
      {
        type: "feature",
        description:
          "Initial release of TryOnMagic with core AI-powered image editing tools",
      },
      {
        type: "feature",
        description:
          "Garments Studio - cloths try on functionality with AI-generated and custom model support",
      },
      {
        type: "feature",
        description: "AI Model Generation with customizable appearance options",
      },
      {
        type: "feature",
        description:
          "AI Product Editing with scene generation and color changes",
      },
      {
        type: "feature",
        description: "Smart Background removal and replacement",
      },
      {
        type: "feature",
        description: "Image Upscaling up to 4x resolution",
      },
      {
        type: "feature",
        description: "Image Expansion for aspect ratio adjustments",
      },
      {
        type: "feature",
        description: "Magic Eraser for object removal and replacement",
      },
      {
        type: "feature",
        description: "Credit-based usage system with flexible packages",
      },
      {
        type: "feature",
        description: "Real-time progress tracking via WebSocket",
      },
      {
        type: "feature",
        description: "Usage history and analytics dashboard",
      },
      {
        type: "feature",
        description: "GDPR compliance with mandatory webhooks",
      },
      {
        type: "feature",
        description: "Shopify integration with seamless product image access",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2024-12-20",
    type: "minor",
    changes: [
      {
        type: "improvement",
        description: "Enhanced Garments Studio processing speed by 40%",
      },
      {
        type: "improvement",
        description: "Improved AI model generation quality and diversity",
      },
      {
        type: "improvement",
        description: "Better edge detection for background removal",
      },
      {
        type: "feature",
        description: "Added batch processing support for multiple images",
      },
      {
        type: "feature",
        description: "New filter options for AI model gallery",
      },
      {
        type: "improvement",
        description: "Optimized image upload and processing workflow",
      },
      {
        type: "fix",
        description: "Fixed issue with image download on mobile devices",
      },
      {
        type: "fix",
        description: "Resolved credit balance display inconsistencies",
      },
    ],
  },
  {
    version: "1.1.1",
    date: "2024-12-25",
    type: "patch",
    changes: [
      {
        type: "fix",
        description:
          "Fixed WebSocket connection issues causing progress updates to fail",
      },
      {
        type: "fix",
        description: "Resolved error when processing very large image files",
      },
      {
        type: "improvement",
        description: "Better error messages for failed operations",
      },
      {
        type: "security",
        description: "Enhanced data encryption for image storage",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2025-01-05",
    type: "minor",
    changes: [
      {
        type: "feature",
        description: "Added new processing modes: Balanced, Quality, and Speed",
      },
      {
        type: "feature",
        description: "Image preview gallery with thumbnails",
      },
      {
        type: "feature",
        description:
          "Export options for different image formats and resolutions",
      },
      {
        type: "improvement",
        description: "Redesigned usage dashboard with better analytics",
      },
      {
        type: "improvement",
        description: "Faster image processing for Smart Background tool",
      },
      {
        type: "fix",
        description: "Fixed credit refund issue for failed operations",
      },
      {
        type: "fix",
        description: "Resolved navigation menu display issues",
      },
    ],
  },
  {
    version: "1.2.1",
    date: "2025-01-10",
    type: "patch",
    changes: [
      {
        type: "fix",
        description: "Fixed issue with subscription plan display",
      },
      {
        type: "improvement",
        description: "Improved loading states and user feedback",
      },
      {
        type: "fix",
        description: "Resolved GDPR webhook handling edge cases",
      },
    ],
  },
];

function getTypeBadge(type: "feature" | "improvement" | "fix" | "security") {
  const badges = {
    feature: { tone: "success" as const, children: "New Feature" },
    improvement: { tone: "info" as const, children: "Improvement" },
    fix: { tone: "attention" as const, children: "Bug Fix" },
    security: { tone: "critical" as const, children: "Security" },
  };
  return badges[type];
}

function getVersionBadge(type: "major" | "minor" | "patch") {
  const badges = {
    major: { tone: "critical" as const, children: "Major" },
    minor: { tone: "info" as const, children: "Minor" },
    patch: { tone: "success" as const, children: "Patch" },
  };
  return badges[type];
}

export default function ChangelogPage() {
  const router = useRouter();

  return (
    <Page
      title="Changelog"
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
                Stay up to date with the latest improvements, new features, and
                bug fixes in TryOnMagic. We're constantly working to improve
                your experience.
              </Text>

              <BlockStack gap="600">
                {changelogEntries.map((entry, index) => (
                  <Card key={entry.version}>
                    <BlockStack gap="400">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <Text variant="headingMd" as="h2">
                              Version {entry.version}
                            </Text>
                            <Badge {...getVersionBadge(entry.type)} />
                          </div>
                          <Text variant="bodyMd" as="p" tone="subdued">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Text>
                        </div>
                      </div>

                      <BlockStack gap="300">
                        {entry.changes.map((change, changeIndex) => (
                          <div
                            key={changeIndex}
                            style={{
                              display: "flex",
                              gap: "0.75rem",
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ marginTop: "0.25rem" }}>
                              <Badge {...getTypeBadge(change.type)} />
                            </div>
                            <Text variant="bodyMd" as="span">
                              {change.description}
                            </Text>
                          </div>
                        ))}
                      </BlockStack>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>

              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">
                    Want to stay updated?
                  </Text>
                  <Text variant="bodyMd" as="p">
                    We regularly update TryOnMagic with new features and
                    improvements. Check back here for the latest updates, or
                    contact us if you have suggestions for new features.
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
