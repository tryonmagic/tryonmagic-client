export type SubscriptionPurchaseRequest = {
  plan: SubscriptionPlan;
  paymentMethod: PaymentMethod;
  referenceId: string;
};

export type SubscriptionPurchaseResponse = {
  plan: SubscriptionPlan;
  amountPaid: number;
};

export enum SubscriptionPlan {
  FREE = "FREE",
  BASIC = "BASIC",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  PAYPAL = "PAYPAL",
  STRIPE = "STRIPE",
  BANK_TRANSFER = "BANK_TRANSFER",
  FREE = "FREE",
  CRYPTO = "CRYPTO",
  SHOPIFY = "SHOPIFY",
  PARTNER = "PARTNER",
}
