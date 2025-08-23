"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  History,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Key,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getUsageHistory } from "./queries";
import { useAuthenticatedQuery } from "@/lib/hooks/useAuthenticatedQuery";
import {
  formatDate,
  getStatusBadgeVariant,
  getStatusText,
  getToolIcon,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import UsagesHistory from "./components/UsagesHistory";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("overview");

  const {
    isLoading,
    data: usageSummary,
    isFetching,
  } = useAuthenticatedQuery({
    queryKey: ["usage-history"],
    queryFn: getUsageHistory,
    staleTime: 1000 * 5,
  });

  // Set the active tab based on URL parameter
  useEffect(() => {
    if (tabParam && ["overview", "usage", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  if (!usageSummary) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Usage History
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View your usage history and track your points
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
            {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Points Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Your Points</CardTitle>
                <CardDescription>
                  Current plan:{" "}
                  <span className="font-medium">
                    {usageSummary.currentSubscription.plan}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Available Points
                      </span>
                      <span className="text-sm font-medium">
                        {usageSummary.currentSubscription.pointsBalance} /{" "}
                        {usageSummary.currentSubscription.pointsTotal}
                      </span>
                    </div>
                    <Progress
                      value={
                        (usageSummary.currentSubscription.pointsBalance /
                          usageSummary.currentSubscription.pointsTotal) *
                        100
                      }
                      className="h-2"
                    />
                    <div className="flex items-center mt-2 text-xs text-slate-500 dark:text-slate-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        Points expire on{" "}
                        {new Date(
                          usageSummary.currentSubscription.nextResetDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button asChild>
                      <Link href="/purchase">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Buy More Points
                      </Link>
                    </Button>
                    <Button variant="outline">
                      <History className="mr-2 h-4 w-4" />
                      View Purchase History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Dashboard</CardTitle>
                <CardDescription>
                  Overview of your tool usage and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Usage by Tool */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Usage by Tool</h3>
                    <div className="space-y-3">
                      {usageSummary.usageByTool.map((item) => {
                        const Icon = getToolIcon(item.toolName);
                        return (
                          <div key={item.toolName} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <Icon className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                                <span>{item.toolName}</span>
                              </div>
                              <span className="font-medium">
                                {item.usageCount} uses
                              </span>
                            </div>
                            <Progress
                              value={item.percentage}
                              className="h-1.5"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recent Activity</h3>
                    <div className="space-y-2">
                      {usageSummary.dailyActivity
                        .slice(0, 8)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <span>
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                            <Badge variant="outline">
                              {item.operations} operations
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Total Operations
                          </p>
                          <p className="text-3xl font-bold">
                            {usageSummary.totalOperations}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Points Used
                          </p>
                          <p className="text-3xl font-bold">
                            {usageSummary.currentSubscription.pointsTotal -
                              usageSummary.currentSubscription.pointsBalance}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="col-span-2">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Most Used Tool
                          </p>
                          <div className="flex items-center justify-center mt-1">
                            {(() => {
                              const mostUsed = usageSummary.mostUsedTool;
                              const Icon = getToolIcon(mostUsed.toolName);
                              return (
                                <>
                                  <Icon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                                  <p className="text-lg font-bold">
                                    {mostUsed.toolName}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("usage")}
                >
                  View Detailed History
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Recent Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Operations</CardTitle>
                <CardDescription>
                  Your most recent AI operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-13 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {usageSummary.recentOperations.map((item) => {
                    const Icon = Sparkles;
                    const resultImageUrl = Array.isArray(
                      item.resultData?.outputImageUrl,
                    )
                      ? item.resultData?.outputImageUrl[0]
                      : item.resultData?.outputImageUrl || null;

                    const ToolIcon = getToolIcon(item.type);

                    return (
                      <Card key={item.id} className="overflow-hidden border">
                        <div className="aspect-square relative">
                          {resultImageUrl ? (
                            <Image
                              src={resultImageUrl}
                              alt={item.type}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            // Creative fallback based on status
                            <div
                              className={cn(
                                "w-full h-full flex flex-col items-center justify-center relative",
                                item.status === "PROCESSING" ||
                                  item.status === "QUEUED"
                                  ? "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/50"
                                  : item.status === "PENDING"
                                    ? "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/50"
                                    : item.status === "FAILED"
                                      ? "bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-950/50"
                                      : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900",
                              )}
                            >
                              {/* Animated processing indicator */}
                              {(item.status === "PROCESSING" ||
                                item.status === "QUEUED") && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                              )}

                              {/* Main icon */}
                              <div
                                className={cn(
                                  "p-4 rounded-full mb-3",
                                  item.status === "PROCESSING" ||
                                    item.status === "QUEUED"
                                    ? "bg-blue-100 dark:bg-blue-900/50"
                                    : item.status === "PENDING"
                                      ? "bg-amber-100 dark:bg-amber-900/50"
                                      : item.status === "FAILED"
                                        ? "bg-red-100 dark:bg-red-900/50"
                                        : "bg-slate-100 dark:bg-slate-800",
                                )}
                              >
                                <ToolIcon
                                  className={cn(
                                    "h-8 w-8",
                                    item.status === "PROCESSING" ||
                                      item.status === "QUEUED"
                                      ? "text-blue-600 dark:text-blue-400 animate-pulse"
                                      : item.status === "PENDING"
                                        ? "text-amber-600 dark:text-amber-400"
                                        : item.status === "FAILED"
                                          ? "text-red-600 dark:text-red-400"
                                          : "text-slate-600 dark:text-slate-400",
                                  )}
                                />
                              </div>

                              {/* Status text */}
                              <p
                                className={cn(
                                  "text-xs font-medium text-center px-2",
                                  item.status === "PROCESSING" ||
                                    item.status === "QUEUED"
                                    ? "text-blue-700 dark:text-blue-300"
                                    : item.status === "PENDING"
                                      ? "text-amber-700 dark:text-amber-300"
                                      : item.status === "FAILED"
                                        ? "text-red-700 dark:text-red-300"
                                        : "text-slate-600 dark:text-slate-400",
                                )}
                              >
                                {item.status === "PROCESSING" &&
                                  "Creating your result..."}
                                {item.status === "QUEUED" &&
                                  "In queue for processing"}
                                {item.status === "PENDING" &&
                                  "Waiting to start"}
                                {item.status === "FAILED" &&
                                  "Processing failed"}
                                {item.status === "SUCCEEDED" && "Ready to view"}
                              </p>

                              {/* Processing dots animation */}
                              {(item.status === "PROCESSING" ||
                                item.status === "QUEUED") && (
                                <div className="flex space-x-1 mt-2">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Status badge - always show */}
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant={getStatusBadgeVariant(item.status)}
                              className="text-xs"
                            >
                              {getStatusText(item.status)}
                            </Badge>
                          </div>

                          {/* Tool name overlay - only show when there's an image */}
                          {resultImageUrl && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                              <div className="flex items-center text-white">
                                <ToolIcon className="h-4 w-4 mr-2" />
                                <span className="text-sm font-medium">
                                  {item.type}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-0">
                          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 px-1 py-2">
                            <span>{formatDate(item.createdAt)}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.transactionHistory?.debitAmount} points
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("usage")}
                >
                  View All Operations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Usage History Tab */}
          <TabsContent value="usage" className="space-y-8">
            <UsagesHistory />
            {/* Export Options */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Download your usage history in different formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export as JSON
                  </Button>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={"userData.name"} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={"userData.email"}
                      />
                    </div>
                    <Button className="w-full">Save Changes</Button>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Control what notifications you receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Receive emails about your account activity
                        </p>
                      </div>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing-emails">
                          Marketing Emails
                        </Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Receive promotional emails about new features and
                          offers
                        </p>
                      </div>
                      <Switch id="marketing-emails" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="points-expiry">
                          Points Expiry Reminders
                        </Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Get notified when your points are about to expire
                        </p>
                      </div>
                      <Switch id="points-expiry" defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Password</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Last changed 3 months ago
                        </p>
                      </div>
                      <Button variant="outline">
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Enable 2FA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">
                      Danger Zone
                    </CardTitle>
                    <CardDescription>
                      Irreversible account actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Delete Account</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
