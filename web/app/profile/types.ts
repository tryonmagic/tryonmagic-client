export interface UsageSummary {
  totalOperations: number;
  pointsUsed: number;
  mostUsedTool: string;
  usageByTool: ToolUsage[];
  recentActivity: DailyActivity[];
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
