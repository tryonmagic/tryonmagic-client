"use client";

import { Page, Layout, Card, Text, Link, BlockStack } from "@shopify/polaris";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <Page
      title="Privacy Policy"
      backAction={{
        content: "Back",
        onAction: () => router.push("/"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd" as="h2">
                Last Updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>

              <Text variant="bodyMd" as="p">
                At TryOnMagic, we take your privacy seriously. This Privacy
                Policy explains how we collect, use, disclose, and safeguard
                your information when you use our Shopify app and services.
                Please read this privacy policy carefully. If you do not agree
                with the terms of this privacy policy, please do not access the
                application.
              </Text>

              <Text variant="headingMd" as="h2">
                1. Information We Collect
              </Text>

              <BlockStack gap="300">
                <Text variant="bodyMd" as="p">
                  <strong>1.1 Account Information:</strong> When you install and
                  use TryOnMagic, we collect information associated with your
                  Shopify account, including:
                </Text>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                  <li>Shop name and domain</li>
                  <li>Merchant name and email address</li>
                  <li>Shopify store information</li>
                  <li>OAuth tokens for API access</li>
                </ul>

                <Text variant="bodyMd" as="p">
                  <strong>1.2 Usage Data:</strong> We collect information about
                  how you use our services, including:
                </Text>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                  <li>Feature usage and tool selections</li>
                  <li>Credit/point consumption</li>
                  <li>Task history and processing status</li>
                  <li>Subscription plan information</li>
                </ul>

                <Text variant="bodyMd" as="p">
                  <strong>1.3 Image Data:</strong> When you use our AI-powered
                  tools, we process:
                </Text>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                  <li>Product images you upload</li>
                  <li>Model images for virtual try-on</li>
                  <li>Generated and processed images</li>
                  <li>Image metadata and processing parameters</li>
                </ul>
              </BlockStack>

              <Text variant="headingMd" as="h2">
                2. How We Use Your Information
              </Text>

              <BlockStack gap="300">
                <Text variant="bodyMd" as="p">
                  We use the information we collect to:
                </Text>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                  <li>
                    Provide, maintain, and improve our AI-powered image editing
                    and virtual try-on services
                  </li>
                  <li>Process your images and generate AI-enhanced content</li>
                  <li>Manage your account, subscriptions, and credits</li>
                  <li>
                    Track usage and provide analytics and reporting features
                  </li>
                  <li>
                    Communicate with you about your account, services, and
                    updates
                  </li>
                  <li>
                    Ensure security, prevent fraud, and comply with legal
                    obligations
                  </li>
                </ul>
              </BlockStack>

              <Text variant="headingMd" as="h2">
                3. Data Storage and Security
              </Text>

              <BlockStack gap="300">
                <Text variant="bodyMd" as="p">
                  <strong>3.1 Data Storage:</strong> Your data is stored on
                  secure servers using industry-standard encryption. We retain
                  your data for as long as necessary to provide our services and
                  comply with legal obligations.
                </Text>

                <Text variant="bodyMd" as="p">
                  <strong>3.2 Security Measures:</strong> We implement
                  appropriate technical and organizational measures to protect
                  your information, including:
                </Text>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security assessments and updates</li>
                  <li>
                    Limited access to personal data on a need-to-know basis
                  </li>
                </ul>

                <Text variant="bodyMd" as="p">
                  <strong>3.3 Data Retention:</strong> We retain your data for
                  the duration of your account and as required by law. When you
                  delete your account or request data deletion, we will remove
                  your personal data in accordance with our data retention
                  policies and applicable laws.
                </Text>
              </BlockStack>

              <Text variant="headingMd" as="h2">
                4. Data Sharing and Disclosure
              </Text>

              <BlockStack gap="300">
                <Text variant="bodyMd" as="p">
                  We do not sell your personal information. We may share your
                  information only in the following circumstances:
                </Text>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                  <li>
                    <strong>Service Providers:</strong> We may share data with
                    third-party service providers who perform services on our
                    behalf, such as cloud hosting, payment processing, and
                    analytics. These providers are contractually obligated to
                    protect your data.
                  </li>
                  <li>
                    <strong>AI Processing:</strong> Your images may be processed
                    by third-party AI services to provide our features. These
                    services are bound by strict confidentiality agreements.
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> We may disclose
                    information if required by law, court order, or government
                    regulation.
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In the event of a
                    merger, acquisition, or sale of assets, your information may
                    be transferred as part of that transaction.
                  </li>
                </ul>
              </BlockStack>

              <Text variant="headingMd" as="h2">
                5. Your Rights and Choices
              </Text>

              <BlockStack gap="300">
                <Text variant="bodyMd" as="p">
                  Depending on your location, you may have the following rights
                  regarding your personal information:
                </Text>
                <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
                  <li>
                    <strong>Access:</strong> Request access to your personal
                    data
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of
                    inaccurate or incomplete data
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal
                    data
                  </li>
                  <li>
                    <strong>Portability:</strong> Request transfer of your data
                    to another service
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to processing of your
                    personal data
                  </li>
                  <li>
                    <strong>Restriction:</strong> Request restriction of
                    processing
                  </li>
                </ul>

                <Text variant="bodyMd" as="p">
                  To exercise these rights, please contact us using the
                  information provided in the "Contact Us" section below. We
                  will respond to your request within 30 days.
                </Text>

                <Text variant="bodyMd" as="p">
                  <strong>GDPR Compliance:</strong> If you are located in the
                  European Economic Area (EEA), we comply with the General Data
                  Protection Regulation (GDPR). We handle data access and
                  deletion requests through Shopify's GDPR webhook system.
                </Text>
              </BlockStack>

              <Text variant="headingMd" as="h2">
                6. Cookies and Tracking Technologies
              </Text>

              <Text variant="bodyMd" as="p">
                We use cookies and similar tracking technologies to enhance your
                experience, analyze usage patterns, and improve our services.
                You can control cookie preferences through your browser
                settings. However, disabling cookies may limit certain features
                of our application.
              </Text>

              <Text variant="headingMd" as="h2">
                7. Children's Privacy
              </Text>

              <Text variant="bodyMd" as="p">
                Our services are not intended for individuals under the age of
                18. We do not knowingly collect personal information from
                children. If you believe we have collected information from a
                child, please contact us immediately.
              </Text>

              <Text variant="headingMd" as="h2">
                8. International Data Transfers
              </Text>

              <Text variant="bodyMd" as="p">
                Your information may be transferred to and processed in
                countries other than your country of residence. These countries
                may have different data protection laws. We ensure appropriate
                safeguards are in place to protect your data in accordance with
                this Privacy Policy.
              </Text>

              <Text variant="headingMd" as="h2">
                9. Changes to This Privacy Policy
              </Text>

              <Text variant="bodyMd" as="p">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new Privacy
                Policy on this page and updating the "Last Updated" date. You
                are advised to review this Privacy Policy periodically for any
                changes.
              </Text>

              <Text variant="headingMd" as="h2">
                10. Contact Us
              </Text>

              <BlockStack gap="300">
                <Text variant="bodyMd" as="p">
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or our data practices, please contact us:
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>TryOnMagic</strong>
                  <br />
                  Email: support@tryonmagic.com
                  <br />
                  Website:{" "}
                  <Link url="https://tryonmagic.com" external>
                    https://tryonmagic.com
                  </Link>
                </Text>
              </BlockStack>

              <Text variant="bodyMd" as="p" tone="subdued">
                By using TryOnMagic, you acknowledge that you have read and
                understood this Privacy Policy and agree to the collection, use,
                and disclosure of your information as described herein.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
