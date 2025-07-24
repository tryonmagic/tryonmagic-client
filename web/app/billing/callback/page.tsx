"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Layout,
  Page,
  Spinner,
  Banner,
  Button,
} from "@shopify/polaris";
import { useRouter, useSearchParams } from "next/navigation";
import { useSubscriptionMutations } from "../hooks/use-subscription";

export default function BillingCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAfterExternalChange } = useSubscriptionMutations();

  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get callback parameters
        const charge_id = searchParams.get("charge_id");
        const subscription_id = searchParams.get("subscription_id");
        const status = searchParams.get("status");

        // Log callback parameters for debugging
        console.log("Billing callback parameters:", {
          charge_id,
          subscription_id,
          status,
        });

        // Check if the subscription was successfully created
        if (status === "accepted" || status === "active") {
          // Refresh subscription data to get the latest state
          await refreshAfterExternalChange();
          setSuccess(true);

          // Redirect to billing page after a short delay
          setTimeout(() => {
            router.push("/billing");
          }, 2000);
        } else if (status === "declined" || status === "cancelled") {
          setError("Subscription was cancelled or declined. Please try again.");
        } else {
          // For any other status or missing status, refresh data and redirect
          await refreshAfterExternalChange();
          router.push("/billing");
        }
      } catch (error) {
        console.error("Error processing billing callback:", error);
        setError(
          "Failed to process subscription callback. Please check your billing page.",
        );
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, refreshAfterExternalChange, router]);

  const handleReturnToBilling = () => {
    router.push("/billing");
  };

  if (isProcessing) {
    return (
      <Page title="Processing Subscription">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <Spinner size="large" />
                <div style={{ marginTop: "1.5rem" }}>
                  <Text variant="headingMd" as="h2">
                    Processing your subscription
                  </Text>
                  <div style={{ marginTop: "0.5rem" }}>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Please wait while we set up your subscription...
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Subscription Error">
        <Layout>
          <Layout.Section>
            <Banner tone="critical">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <Text variant="headingMd" as="h2">
                  Something went wrong
                </Text>
                <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    There was an issue processing your subscription. You can try
                    again or contact support if the problem persists.
                  </Text>
                </div>
                <Button variant="primary" onClick={handleReturnToBilling}>
                  Return to Billing
                </Button>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (success) {
    return (
      <Page title="Subscription Successful">
        <Layout>
          <Layout.Section>
            <Banner tone="success">
              <p>Your subscription has been successfully created!</p>
            </Banner>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <Text variant="headingMd" as="h2">
                  Welcome to ProdigyAI!
                </Text>
                <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Your subscription is now active. You'll be redirected to
                    your billing page shortly.
                  </Text>
                </div>
                <Button variant="primary" onClick={handleReturnToBilling}>
                  Go to Billing Page
                </Button>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Fallback - should not reach here
  return (
    <Page title="Billing">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <Button variant="primary" onClick={handleReturnToBilling}>
                Return to Billing
              </Button>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
