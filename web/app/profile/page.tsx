"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  History,
  Calendar,
  Clock,
  ArrowRight,
  Download,
  Search,
  ChevronDown,
  Sparkles,
  Eraser,
  Wand2,
  ImagePlus,
  Maximize,
  Edit,
  Camera,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getUsageHistory } from "./queries";

// Mock data for the profile
const userData = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  avatar: "/placeholder.svg",
  joinDate: "January 2023",
  plan: "Standard",
  pointsAvailable: 145,
  pointsTotal: 200,
  pointsExpiry: "June 15, 2023",
};

// Mock data for usage history
const usageHistory = [
  {
    id: "usage-1",
    date: "2023-05-10T14:30:00",
    tool: "AI Fashion Model",
    icon: Sparkles,
    pointsUsed: 10,
    status: "completed",
    result: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "usage-2",
    date: "2023-05-09T10:15:00",
    tool: "Remove Background",
    icon: Eraser,
    pointsUsed: 5,
    status: "completed",
    result: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "usage-3",
    date: "2023-05-08T16:45:00",
    tool: "Upscale Image",
    icon: Wand2,
    pointsUsed: 8,
    status: "completed",
    result: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "usage-4",
    date: "2023-05-07T09:20:00",
    tool: "AI Product",
    icon: ImagePlus,
    pointsUsed: 10,
    status: "completed",
    result: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "usage-5",
    date: "2023-05-06T11:10:00",
    tool: "Expand Image",
    icon: Maximize,
    pointsUsed: 8,
    status: "completed",
    result: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "usage-6",
    date: "2023-05-05T15:30:00",
    tool: "Magic Eraser",
    icon: Eraser,
    pointsUsed: 10,
    status: "completed",
    result: "/placeholder.svg?height=100&width=100",
  },
];

// Mock data for usage statistics
const usageStats = {
  totalUsage: 51,
  byTool: [
    { tool: "AI Fashion Model", count: 15, percentage: 29 },
    { tool: "Remove Background", count: 12, percentage: 24 },
    { tool: "Upscale Image", count: 8, percentage: 16 },
    { tool: "AI Product", count: 6, percentage: 12 },
    { tool: "Expand Image", count: 5, percentage: 10 },
    { tool: "Magic Eraser", count: 5, percentage: 10 },
  ],
  recentActivity: [
    { date: "Today", count: 3 },
    { date: "Yesterday", count: 5 },
    { date: "May 8", count: 2 },
    { date: "May 7", count: 4 },
    { date: "May 6", count: 1 },
    { date: "May 5", count: 3 },
    { date: "May 4", count: 2 },
  ],
};

// Tool icons mapping
const toolIcons: Record<string, React.ElementType> = {
  "AI Fashion Model": Sparkles,
  "Remove Background": Eraser,
  "Upscale Image": Wand2,
  "AI Product": ImagePlus,
  "Expand Image": Maximize,
  "Magic Eraser": Eraser,
};

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTool, setFilterTool] = useState("all");
  const [dateRange, setDateRange] = useState("all-time");
  const shopifyApp = useAppBridge();
  console.log(shopifyApp);
  useEffect(() => {
    const fetchUsageHistory = async () => {
      const token = await shopifyApp.idToken();
      const usageHistory = await getUsageHistory(token);
      console.log(usageHistory);
    };
    fetchUsageHistory();
  }, [shopifyApp]);

  // Set the active tab based on URL parameter
  useEffect(() => {
    if (tabParam && ["overview", "usage", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Filter usage history based on search, tool, and date range
  const filteredHistory = usageHistory.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.tool.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTool = filterTool === "all" || item.tool === filterTool;

    // Simple date filtering logic - could be expanded for more complex filtering
    const itemDate = new Date(item.date);
    const now = new Date();
    let matchesDate = true;

    if (dateRange === "last-week") {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = itemDate >= lastWeek;
    } else if (dateRange === "last-month") {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = itemDate >= lastMonth;
    }

    return matchesSearch && matchesTool && matchesDate;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            My Profile
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account, view usage history, and track your points
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Points Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Your Points</CardTitle>
                <CardDescription>
                  Current plan:{" "}
                  <span className="font-medium">{userData.plan}</span>
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
                        {userData.pointsAvailable} / {userData.pointsTotal}
                      </span>
                    </div>
                    <Progress
                      value={
                        (userData.pointsAvailable / userData.pointsTotal) * 100
                      }
                      className="h-2"
                    />
                    <div className="flex items-center mt-2 text-xs text-slate-500 dark:text-slate-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Points expire on {userData.pointsExpiry}</span>
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
                      {usageStats.byTool.map((item) => {
                        const Icon = toolIcons[item.tool] || Sparkles;
                        return (
                          <div key={item.tool} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <Icon className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                                <span>{item.tool}</span>
                              </div>
                              <span className="font-medium">
                                {item.count} uses
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
                      {usageStats.recentActivity.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <span>{item.date}</span>
                          <Badge variant="outline">
                            {item.count} operations
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
                            {usageStats.totalUsage}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Points Used
                          </p>
                          <p className="text-3xl font-bold">
                            {userData.pointsTotal - userData.pointsAvailable}
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
                              const mostUsed = usageStats.byTool[0];
                              const Icon = toolIcons[mostUsed.tool] || Sparkles;
                              return (
                                <>
                                  <Icon className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                                  <p className="text-lg font-bold">
                                    {mostUsed.tool}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {usageHistory.slice(0, 3).map((item) => {
                    const Icon = item.icon;
                    return (
                      <Card key={item.id} className="overflow-hidden border">
                        <div className="aspect-square relative">
                          <Image
                            src={item.result || "/placeholder.svg"}
                            alt={item.tool}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <div className="flex items-center text-white">
                              <Icon className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">
                                {item.tool}
                              </span>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatDate(item.date)}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.pointsUsed} points
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
            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
                <CardDescription>
                  Track all your AI operations and points usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <Input
                      type="search"
                      placeholder="Search operations..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterTool} onValueChange={setFilterTool}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by tool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tools</SelectItem>
                      <SelectItem value="AI Fashion Model">
                        AI Fashion Model
                      </SelectItem>
                      <SelectItem value="Remove Background">
                        Remove Background
                      </SelectItem>
                      <SelectItem value="Upscale Image">
                        Upscale Image
                      </SelectItem>
                      <SelectItem value="AI Product">AI Product</SelectItem>
                      <SelectItem value="Expand Image">Expand Image</SelectItem>
                      <SelectItem value="Magic Eraser">Magic Eraser</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-time">All Time</SelectItem>
                      <SelectItem value="last-week">Last 7 Days</SelectItem>
                      <SelectItem value="last-month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Tool</TableHead>
                        <TableHead>Points Used</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => {
                          const Icon = item.icon;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {formatDate(item.date)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Icon className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                                  <span>{item.tool}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {item.pointsUsed} points
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="h-10 w-10 rounded-md overflow-hidden">
                                  <Image
                                    src={item.result || "/placeholder.svg"}
                                    alt={item.tool}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Download className="mr-2 h-4 w-4" />
                                      <span>Download</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <ArrowRight className="mr-2 h-4 w-4" />
                                      <span>View Details</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-slate-500 dark:text-slate-400"
                          >
                            No operations found matching your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination - simplified for demo */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-medium">
                      {filteredHistory.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{usageHistory.length}</span>{" "}
                    operations
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
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
            </Card>
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
                      <Input id="name" defaultValue={userData.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={userData.email}
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
