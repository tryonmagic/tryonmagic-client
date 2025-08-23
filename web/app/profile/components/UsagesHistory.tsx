"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Download, Search, ChevronDown, View } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { getTasks } from "../queries";
import { useAuthenticatedQuery } from "@/lib/hooks/useAuthenticatedQuery";
import {
  formatDate,
  getStatusColor,
  getStatusText,
  getToolIcon,
} from "@/lib/utils";
import Pagination from "@/components/ui/pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const tasksPerPage = 10;

export default function UsagesHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTool, setFilterTool] = useState("all");
  const [dateRange, setDateRange] = useState("all-time");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: tasks,
    isFetching: isFetchingTasks,
    isLoading: isLoadingTasks,
  } = useAuthenticatedQuery({
    queryKey: ["users/me/tasks", { page: currentPage, pageSize: tasksPerPage }],
    queryFn: getTasks,
    staleTime: 1000 * 5,
  });

  return (
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
              <SelectItem value="AI Fashion Model">AI Fashion Model</SelectItem>
              <SelectItem value="Remove Background">
                Remove Background
              </SelectItem>
              <SelectItem value="Upscale Image">Upscale Image</SelectItem>
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
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks && tasks.results.length > 0 ? (
                tasks.results.map((item) => {
                  const Icon = getToolIcon(item.type);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                          <span>{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.transactionHistory?.debitAmount} points
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(item.status)}
                        >
                          {getStatusText(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.status === "SUCCEEDED" ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden">
                            {item.resultData?.outputImageUrl ? (
                              Array.isArray(item.resultData?.outputImageUrl) ? (
                                <div className="flex flex-wrap gap-2">
                                  {item.resultData?.outputImageUrl.map(
                                    (url) => (
                                      <Image
                                        key={url}
                                        src={url}
                                        alt={item.type}
                                        width={40}
                                        height={40}
                                        className="object-cover"
                                      />
                                    ),
                                  )}
                                </div>
                              ) : (
                                <Image
                                  src={item.resultData?.outputImageUrl}
                                  alt={item.type}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              )
                            ) : (
                              <p className="text-sm text-warning-500 dark:text-warning-400">
                                No result
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {getStatusText(item.status)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <View className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-slate-500 dark:text-slate-400"
                  >
                    {isLoadingTasks || isFetchingTasks ? (
                      <div className="flex justify-center items-center h-full w-full">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      "No operations found matching your filters."
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - simplified for demo */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium">{tasks?.results.length}</span>{" "}
            of <span className="font-medium">{tasks?.totalResults}</span>{" "}
            operations
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={tasks?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
