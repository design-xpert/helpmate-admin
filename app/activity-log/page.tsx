"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Activity,
  Search,
  Download,
  Clock,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
} from "lucide-react";
import { CustomSelect, CustomSelectOption } from "@/components/CustomSelect";
import {
  getGlobalActivityLogsApi,
  type ApiActivityLogItem,
  type ApiActivityLogChange,
  type ApiGlobalActivityLogsParams,
} from "@/lib/api";

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  relativeTime: string;
  actor: {
    name: string;
    role?: string;
    type?: string;
    ip?: string;
    source?: string;
  };
  action: string;
  category: string;
  result: string;
  description: string;
  changes?: ApiActivityLogChange[];
  metadata?: Record<string, any>;
}

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 30) return `${diffDay} days ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateString;
  }
}

function mapApiItemToActivityLog(item: ApiActivityLogItem): ActivityLogItem {
  return {
    id: item._id,
    timestamp: item.createdAt,
    relativeTime: formatRelativeTime(item.createdAt),
    actor: {
      name: item.actor?.name || "",
      role: item.actor?.role || "",
      type: item.actor?.type || "",
      ip: item.context?.ip || "",
      source: item.context?.source || "",
    },
    action: item.action || "",
    category: item.category || "",
    result: item.result || "",
    description: item.description || "",
    changes: item.changes || [],
    metadata: {
      tenantId: item.tenantId,
      entity: item.entity,
    },
  };
}

const DATE_RANGE_OPTIONS: CustomSelectOption[] = [
  { value: "all", label: "All Time", icon: <Clock className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "today", label: "Today", icon: <Calendar className="w-3.5 h-3.5 text-brand-500" /> },
  { value: "yesterday", label: "Yesterday", icon: <Calendar className="w-3.5 h-3.5 text-slate-500" /> },
  { value: "last7days", label: "Last 7 Days", icon: <Calendar className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "last30days", label: "Last 30 Days", icon: <Calendar className="w-3.5 h-3.5 text-indigo-500" /> },
];

const PAGE_SIZE_OPTIONS: CustomSelectOption[] = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
  { value: "100", label: "100 / page" },
];

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedAction, setSelectedAction] = useState<string>("All");
  const [selectedResult, setSelectedResult] = useState<string>("All");
  const [selectedActorType, setSelectedActorType] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // UI state
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Main fetch function calling GET /api/dashboard/activity-logs/global
  const fetchActivityLogs = useCallback(async () => {
    setLoading(true);

    // Compute date filters
    let fromDate: string | undefined = undefined;
    let toDate: string | undefined = undefined;
    const now = new Date();
    if (dateRange === "today") {
      fromDate = now.toISOString().slice(0, 10);
      toDate = now.toISOString().slice(0, 10);
    } else if (dateRange === "yesterday") {
      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      fromDate = yest.toISOString().slice(0, 10);
      toDate = yest.toISOString().slice(0, 10);
    } else if (dateRange === "last7days") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      fromDate = past.toISOString().slice(0, 10);
      toDate = now.toISOString().slice(0, 10);
    } else if (dateRange === "last30days") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      fromDate = past.toISOString().slice(0, 10);
      toDate = now.toISOString().slice(0, 10);
    }

    const params: ApiGlobalActivityLogsParams = {
      page: currentPage,
      limit: pageSize,
      action: selectedAction !== "All" ? selectedAction : undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      result: selectedResult !== "All" ? selectedResult : undefined,
      actorType: selectedActorType !== "All" ? selectedActorType : undefined,
      fromDate,
      toDate,
      search: debouncedSearch || undefined,
      forceRefresh: true,
    };

    try {
      const res = await getGlobalActivityLogsApi(params);
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(mapApiItemToActivityLog);
        setLogs(mapped);
        if (res.pagination) {
          setTotalRecords(res.pagination.total);
          setTotalPages(Math.max(res.pagination.totalPages, 1));
        } else {
          setTotalRecords(mapped.length);
          setTotalPages(1);
        }
      } else {
        setLogs([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("fetchActivityLogs error:", err);
      setLogs([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    selectedAction,
    selectedCategory,
    selectedResult,
    selectedActorType,
    dateRange,
    debouncedSearch,
  ]);

  // Trigger fetch on parameter change
  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  // Dynamic filter options generated purely from API data
  const categoryOptions = useMemo<CustomSelectOption[]>(() => {
    const unique = Array.from(new Set(logs.map((l) => l.category).filter(Boolean)));
    return [
      { value: "All", label: "All Categories" },
      ...unique.map((cat) => ({ value: cat, label: cat })),
    ];
  }, [logs]);

  const actionOptions = useMemo<CustomSelectOption[]>(() => {
    const unique = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));
    return [
      { value: "All", label: "All Actions" },
      ...unique.map((act) => ({ value: act, label: act })),
    ];
  }, [logs]);

  const resultOptions = useMemo<CustomSelectOption[]>(() => {
    const unique = Array.from(new Set(logs.map((l) => l.result).filter(Boolean)));
    return [
      { value: "All", label: "All Results" },
      ...unique.map((res) => ({ value: res, label: res })),
    ];
  }, [logs]);

  const actorTypeOptions = useMemo<CustomSelectOption[]>(() => {
    const unique = Array.from(new Set(logs.map((l) => l.actor.type).filter(Boolean))) as string[];
    return [
      { value: "All", label: "All Actor Types" },
      ...unique.map((type) => ({ value: type, label: type })),
    ];
  }, [logs]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "All") count++;
    if (selectedAction !== "All") count++;
    if (selectedResult !== "All") count++;
    if (selectedActorType !== "All") count++;
    if (dateRange !== "all") count++;
    if (debouncedSearch) count++;
    return count;
  }, [selectedCategory, selectedAction, selectedResult, selectedActorType, dateRange, debouncedSearch]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedCategory("All");
    setSelectedAction("All");
    setSelectedResult("All");
    setSelectedActorType("All");
    setDateRange("all");
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = [
        "Log ID",
        "Timestamp",
        "Actor Name",
        "Actor Role",
        "Actor Type",
        "IP Address",
        "Source",
        "Category",
        "Action",
        "Result",
        "Description",
      ];
      const rows = logs.map((l) => [
        l.id,
        l.timestamp,
        `"${l.actor.name}"`,
        `"${l.actor.role || ""}"`,
        `"${l.actor.type || ""}"`,
        l.actor.ip || "",
        `"${l.actor.source || ""}"`,
        `"${l.category}"`,
        `"${l.action}"`,
        `"${l.result}"`,
        `"${(l.description || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `helpmate_activity_audit_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── PAGE HEADER (STRICTLY ONE PRIMARY BUTTON PER AGENTS.md RULE) ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800/80 shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Activity log
              </h1>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* THE ONLY PRIMARY BUTTON ON THIS PAGE (Strictly compliant with .agents/AGENTS.md) */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || logs.length === 0}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Export Audit CSV"}</span>
          </button>
        </div>
      </div>

      {/* ─── SEARCH & MULTI-FILTER TOOLBAR ─── */}
      <div className="relative z-20 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, category, description, actor, or IP..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic Filter Dropdowns From API Data */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="w-44">
              <CustomSelect
                size="sm"
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setCurrentPage(1);
                }}
                options={categoryOptions}
                placeholder="All Categories"
              />
            </div>

            {/* Action Filter */}
            <div className="w-40">
              <CustomSelect
                size="sm"
                value={selectedAction}
                onChange={(val) => {
                  setSelectedAction(val);
                  setCurrentPage(1);
                }}
                options={actionOptions}
                placeholder="All Actions"
              />
            </div>

            {/* Result Filter */}
            <div className="w-40">
              <CustomSelect
                size="sm"
                value={selectedResult}
                onChange={(val) => {
                  setSelectedResult(val);
                  setCurrentPage(1);
                }}
                options={resultOptions}
                placeholder="All Results"
              />
            </div>

            {/* Actor Type Filter */}
            {actorTypeOptions.length > 2 && (
              <div className="w-40">
                <CustomSelect
                  size="sm"
                  value={selectedActorType}
                  onChange={(val) => {
                    setSelectedActorType(val);
                    setCurrentPage(1);
                  }}
                  options={actorTypeOptions}
                  placeholder="All Actor Types"
                />
              </div>
            )}

            {/* Date Range Filter */}
            <div className="w-36">
              <CustomSelect
                size="sm"
                value={dateRange}
                onChange={(val) => {
                  setDateRange(val);
                  setCurrentPage(1);
                }}
                options={DATE_RANGE_OPTIONS}
                placeholder="All Time"
              />
            </div>

            {/* Reset Filters */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear ({activeFiltersCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT VIEW (TIMELINE WITH SHIMMER) ─── */}
      {loading ? (
        /* Shimmer Loading Skeleton for Timeline */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-6">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative animate-pulse">
                {/* Timeline node icon placeholder */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900" />

                {/* Timeline Card Shimmer */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="h-5 w-44 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                      <div className="h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </div>
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded-md" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-3.5 w-full max-w-xl bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3.5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            No activity logs found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting different filters, or resetting your filter criteria.
          </p>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        /* TIMELINE STREAM VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-6">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="relative">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shrink-0 shadow-xs ${
                    log.result?.toUpperCase() === "FAILED"
                      ? "bg-rose-500 text-white"
                      : log.result?.toUpperCase() === "SUCCESS"
                      ? "bg-emerald-500 text-white"
                      : "bg-sky-500 text-white"
                  }`}
                >
                  <Activity className="w-3 h-3" />
                </div>

                {/* Timeline Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {log.action}
                      </span>
                      {log.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {log.category}
                        </span>
                      )}
                      {log.result && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            log.result.toUpperCase() === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : log.result.toUpperCase() === "FAILED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {log.result.toUpperCase() === "SUCCESS" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {log.result.toUpperCase() === "FAILED" && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          {log.result.toUpperCase() !== "SUCCESS" && log.result.toUpperCase() !== "FAILED" && <Info className="w-3 h-3 text-slate-500" />}
                          <span>{log.result}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{log.relativeTime}</span>
                      <span>•</span>
                      <span>
                        {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {log.description && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {log.description}
                    </p>
                  )}

                  {/* Changes Diff Tags (if any) */}
                  {log.changes && log.changes.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {log.changes.map((diff, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          <span className="text-slate-400">{diff.field}:</span> {String(diff.oldValue ?? "none")} →{" "}
                          <strong className="text-brand-600 dark:text-brand-400 font-semibold">{String(diff.newValue)}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer: Actor Info directly from API response */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.actor.name && (
                        <>
                          <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center font-black text-[10px] shrink-0">
                            {log.actor.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {log.actor.name}
                          </span>
                        </>
                      )}
                      {(log.actor.role || log.actor.type) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-mono">
                          {log.actor.role || log.actor.type}
                        </span>
                      )}
                      {(log.actor.ip || log.actor.source) && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {[log.actor.ip, log.actor.source].filter(Boolean).join(" • ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TIMELINE PAGINATION FOOTER */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">
                Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} events
              </span>
              <div className="w-28">
                <CustomSelect
                  size="sm"
                  value={String(pageSize)}
                  onChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                  options={PAGE_SIZE_OPTIONS}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
