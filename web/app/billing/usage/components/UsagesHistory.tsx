"use client";

import { useMemo, useState } from "react";
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
  getStatusBadgeVariant,
  getStatusText,
  getToolIcon,
  handleDownload,
} from "@/lib/utils";
import Pagination from "@/components/ui/pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { imagePreviewAtom } from "@/app/atom";
import { useAtom } from "jotai";
import { TaskStatus, TaskType, TaskTypeLabel } from "@/lib/api/type";

const tasksPerPage = 10;

export default function UsagesHistory() {
  const [filterTool, setFilterTool] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all-time");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [, setImagePreview] = useAtom(imagePreviewAtom);

  const { startDate: effectiveStart, endDate: effectiveEnd } = useMemo(() => {
    if (dateRange === "custom") {
      return { startDate, endDate };
    }
    if (dateRange === "all-time") {
      return { startDate: undefined, endDate: undefined };
    }

    const now = new Date();
    let start = new Date();
    if (dateRange === "last-1-day") {
      start.setDate(now.getDate() - 1);
    } else if (dateRange === "last-3-days") {
      start.setDate(now.getDate() - 3);
    } else if (dateRange === "last-week") {
      start.setDate(now.getDate() - 7);
    } else if (dateRange === "last-15-days") {
      start.setDate(now.getDate() - 15);
    } else if (dateRange === "last-month") {
      start.setDate(now.getDate() - 30);
    } else if (dateRange === "last-3-months") {
      start.setMonth(now.getMonth() - 3);
    } else if (dateRange === "last-6-months") {
      start.setMonth(now.getMonth() - 6);
    }

    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    };
  }, [dateRange, startDate, endDate]);

  const {
    data: tasks,
    isFetching: isFetchingTasks,
    isLoading: isLoadingTasks,
  } = useAuthenticatedQuery({
    queryKey: [
      "users/me/tasks",
      {
        page: currentPage,
        pageSize: tasksPerPage,
        taskType: filterTool,
        taskStatus: statusFilter,
        dateFrom: effectiveStart,
        dateTo: effectiveEnd,
      },
    ],
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 justify-end">
            <Select
              value={filterTool}
              onValueChange={(val) => {
                setFilterTool(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by tool" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tools</SelectItem>
                {Object.values(TaskType).map((tool) => (
                  <SelectItem key={tool} value={tool}>
                    {TaskTypeLabel[tool]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(TaskStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusText(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={dateRange}
              onValueChange={(val) => {
                setDateRange(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="last-1-day">Last 24 Hours</SelectItem>
                <SelectItem value="last-3-days">Last 3 Days</SelectItem>
                <SelectItem value="last-week">Last 7 Days</SelectItem>
                <SelectItem value="last-15-days">Last 15 Days</SelectItem>
                <SelectItem value="last-month">Last 30 Days</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === "custom" && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Input
                type="date"
                className="w-full sm:w-[160px]"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="text-slate-500">to</span>
              <Input
                type="date"
                className="w-full sm:w-[160px]"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
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
                        <Badge variant={getStatusBadgeVariant(item.status)}>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setImagePreview(item.resultData?.outputImageUrl)
                          }
                        >
                          <View className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDownload(item.resultData?.outputImageUrl)
                          }
                        >
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
