import { SuccessWithPaginationResponse } from "@/lib/api/type";

import { AIModel } from "@/lib/api/type";
import { clientAPI } from "@/lib/api";
import { AuthenticatedQueryFunction } from "@/lib/hooks/useAuthenticatedQuery";

export const getAIModelsQuery: AuthenticatedQueryFunction<
  SuccessWithPaginationResponse<AIModel>,
  [
    "ai-models",
    {
      page: number;
      pageSize: number;
    },
  ]
> = async (token, queryKey) => {
  const [, { page, pageSize }] = queryKey;
  const params: Record<string, string | boolean | number | string[]> = {
    page,
    pageSize,
  };

  const res = await clientAPI(token).get<
    SuccessWithPaginationResponse<AIModel>
  >("/ai-models", {
    params,
  });

  return res.data;
};
