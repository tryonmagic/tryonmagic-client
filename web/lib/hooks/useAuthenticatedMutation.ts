import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
export type AuthenticatedMutationFunction<TData, TVariables> = (
  token: string,
  variables: TVariables,
) => Promise<TData>;
export function useAuthenticatedMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
  > & {
    mutationFn: AuthenticatedMutationFunction<TData, TVariables>;
  },
): UseMutationResult<TData, TError, TVariables, TContext> {
  const app = useAppBridge();
  const { mutationFn, ...restOptions } = options;
  return useMutation({
    ...restOptions,
    mutationFn: async (variables: TVariables) => {
      const token = await app.idToken();
      return mutationFn(token, variables);
    },
  });
}
