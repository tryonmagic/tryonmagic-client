import { useQuery } from "@tanstack/react-query";

import { getAIModels, getGarments } from "@/lib/api/ai-models";
import { useAppBridge } from "@shopify/app-bridge-react";

export function useAIModels() {
  const app = useAppBridge(); // Initialize App Bridge

  return useQuery({
    queryKey: ["ai-models"],
    queryFn: async () => {
      const token = await app.idToken(); // Get the token from App Bridge
      return getAIModels(token); // Pass the token to the API function
    },
  });
}

export function useGarments() {
  const app = useAppBridge(); // Initialize App Bridge

  return useQuery({
    queryKey: ["garments"],
    queryFn: async () => {
      const token = await app.idToken(); // Get the token from App Bridge
      return getGarments(token); // Pass the token to the API function
    },
  });
}
