import { Subscription } from "@/lib/api/type";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  subscription: Subscription;
}
