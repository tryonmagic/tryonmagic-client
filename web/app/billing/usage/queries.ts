import { clientAPI } from "@/lib/api";
import {
  GenericAPIResponse,
  PaginationResponseData,
  SuccessWithPaginationResponse,
  Task,
} from "@/lib/api/type";
import { UsageSummary } from "./types";
import { AuthenticatedQueryFunction } from "@/lib/hooks/useAuthenticatedQuery";

export const getUsageHistory: AuthenticatedQueryFunction<
  UsageSummary | null,
  ["usage-history"]
> = async (token) => {
  const response = await clientAPI(token).get<GenericAPIResponse<UsageSummary>>(
    "users/usage/history",
  );
  return response.data.data;
};

export const getTasks: AuthenticatedQueryFunction<
  PaginationResponseData<Task>,
  [
    "users/me/tasks",
    {
      page: number;
      pageSize: number;
      taskType?: string;
      taskStatus?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ]
> = async (token, queryKey) => {
  const [, { page, pageSize, taskType, taskStatus, dateFrom, dateTo }] =
    queryKey;
  const params: Record<string, string | boolean | number | string[]> = {
    page,
    pageSize,
  };

  if (taskType && taskType !== "all") params.taskType = taskType;
  if (taskStatus && taskStatus !== "all") params.taskStatus = taskStatus;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const res = await clientAPI(token).get<SuccessWithPaginationResponse<Task>>(
    "/users/me/tasks",
    {
      params,
    },
  );

  return {
    results: res.data.data.results,
    page,
    limit: pageSize,
    totalPages: res.data.data.totalPages,
    totalResults: res.data.data.totalResults,
  };
};
