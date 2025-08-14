import { GenericAPIResponse } from "@/lib/api/type";

import { clientAPI } from "@/lib/api";
import { AuthenticatedQueryFunction } from "@/lib/hooks/useAuthenticatedQuery";
import { User } from "@/types/user";

export const getUserDetailsQuery: AuthenticatedQueryFunction<
  User,
  ["user-details"]
> = async (token) => {
  const res = await clientAPI(token).get<GenericAPIResponse<User>>("/users/me");
  const data = res.data.data;
  if (!data) {
    throw new Error("Something went wrong");
  }
  return data;
};
