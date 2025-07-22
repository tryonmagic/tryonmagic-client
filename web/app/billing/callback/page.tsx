"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Text, Button, Layout, Page } from "@shopify/polaris";
import { useRouter } from "next/navigation";

export default function BillingCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const chargeId = searchParams.get("charge_id");
    const shop = searchParams.get("shop");

    if (!chargeId) {
      setStatus("error");
      setMessage("No charge ID found in the URL");
      return;
    }

    // Check the subscription status
    checkSubscriptionStatus(chargeId, shop);
  }, [searchParams]);

  const checkSubscriptionStatus = async (
    chargeId: string,
    shop: string | null,
  ) => {
    try {
      // You can implement additional logic here to check the subscription status
      // For now, we'll assume success if we have a charge_id
      setStatus("success");
      setMessage("Your subscription has been successfully activated!");
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setStatus("error");
      setMessage(
        "There was an error processing your subscription. Please contact support.",
      );
    }
  };

  const handleContinue = () => {
    router.push("/");
  };

  const handleContactSupport = () => {
    // You can implement contact support logic here
    window.open("mailto:support@tryonmagic.com", "_blank");
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "2rem", textAlign: "center" }}>
              {status === "loading" && (
                <>
                  <Text variant="headingLg" as="h1">
                    Processing Your Subscription
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Please wait while we confirm your subscription...
                  </Text>
                </>
              )}

              {status === "success" && (
                <>
                  <Text variant="headingLg" as="h1" tone="success">
                    Subscription Activated!
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {message}
                  </Text>
                  <div style={{ marginTop: "1rem" }}>
                    <Button variant="primary" onClick={handleContinue}>
                      Continue to App
                    </Button>
                  </div>
                </>
              )}

              {status === "error" && (
                <>
                  <Text variant="headingLg" as="h1" tone="critical">
                    Subscription Error
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {message}
                  </Text>
                  <div style={{ marginTop: "1rem" }}>
                    <Button onClick={handleContactSupport}>
                      Contact Support
                    </Button>
                    <div style={{ marginTop: "0.5rem" }}>
                      <Button onClick={handleContinue}>Return to App</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
