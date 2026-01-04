import { SubscriptionPlan } from "@/app/purchase/type";
import { Task } from "@/lib/api/type";

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: string;
  pointsBalance: number;
  pointsUsed: number;
  pointsTotal: number;
  monthlyPoints: number;
  lastResetDate: Date;
  nextResetDate: Date;
}

export interface UsageSummary {
  totalPoints: number;
  currentSubscription: UserSubscription;
  totalOperations: number;
  pointsUsed: number;
  mostUsedTool: ToolUsage;
  usageByTool: ToolUsage[];
  dailyActivity: DailyActivity[];
  recentOperations: Task[];
}

export interface ToolUsage {
  toolName: string;
  usageCount: number;
  percentage: number;
}

export interface DailyActivity {
  date: string;
  operations: number;
}
