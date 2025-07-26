import { clientAPI } from "@/lib/api";
import { GenericAPIResponse } from "@/lib/api/type";
import {
  SubscriptionPurchaseRequest,
  SubscriptionPurchaseResponse,
} from "./type";

export const subscribedPlan = async (
  token: string,
  plan: SubscriptionPurchaseRequest,
) => {
  return clientAPI(token).post<
    GenericAPIResponse<SubscriptionPurchaseResponse>
  >("subscription/purchase", plan);
};
