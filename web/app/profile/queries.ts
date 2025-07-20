import { clientAPI } from "@/lib/api";
import { GenericAPIResponse } from "@/lib/api/type";
import { UsageSummary } from "./types";

export const getUsageHistory = async (token: string) => {
  const response = await clientAPI(token).get<
    GenericAPIResponse<UsageSummary[]>
  >("tasks/usage/history");
  return response.data.data;
};
