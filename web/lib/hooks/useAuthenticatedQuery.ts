import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
  QueryFunction,
} from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";

export type AuthenticatedQueryFunction<
  TData,
  TQueryKey extends readonly unknown[],
> = (token: string, queryKey: TQueryKey) => Promise<TData>;

export function useAuthenticatedQuery<
  TData = unknown,
  TError = unknown,
  TQueryKey extends readonly unknown[] = unknown[],
>(
  options: Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, "queryFn"> & {
    queryFn: AuthenticatedQueryFunction<TData, TQueryKey>;
  },
): UseQueryResult<TData, TError> {
  const app = useAppBridge();
  const { queryFn, ...restOptions } = options;

  return useQuery({
    ...restOptions,
    queryFn: async ({ queryKey }) => {
      const token = await app.idToken();
      return queryFn(token, queryKey);
    },
  });
}
