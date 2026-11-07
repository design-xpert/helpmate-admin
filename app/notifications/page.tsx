"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "@/components/Toast";
import {
  Bell,
  CheckCircle2,
  Search,
  AlertTriangle,
  CalendarCheck,
  Navigation,
  Wrench,
  KeyRound,
  User,
  Clock,
  RotateCcw,
  Sparkles,
  MessageSquare,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { CustomSelect, CustomSelectOption } from "@/components/CustomSelect";
import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  type ApiNotificationItem,
} from "@/lib/api";

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hr${diffHour > 1 ? "s" : ""} ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 30) return `${diffDay} days ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateString;
  }
}

function getCategoryBadge(category: string) {
  const cat = (category || "").toUpperCase();
  switch (cat) {
    case "BOOKING":
      return "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800";
    case "PARTNER":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "CUSTOMER":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "PAYMENT":
    case "INVOICE":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    case "ADMIN":
    case "SECURITY":
    case "ROLE":
      return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  }
}

function getNotificationIcon(category: string, action: string) {
  const act = (action || "").toUpperCase();
  const cat = (category || "").toUpperCase();
  if (act.includes("ASSIGN")) return <User className="w-4 h-4 text-sky-600" />;
  if (act.includes("CANCEL")) return <AlertTriangle className="w-4 h-4 text-rose-600" />;
  if (act.includes("COMPLETE") || act.includes("SUCCESS")) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (act.includes("LOGIN") || act.includes("AUTH")) return <KeyRound className="w-4 h-4 text-amber-600" />;
  if (cat === "BOOKING") return <CalendarCheck className="w-4 h-4 text-brand-600" />;
  if (cat === "PAYMENT") return <CreditCard className="w-4 h-4 text-indigo-600" />;
  return <Bell className="w-4 h-4 text-slate-600" />;
}

const CATEGORY_FILTER_OPTIONS: CustomSelectOption[] = [
  { value: "ALL", label: "All Categories", icon: <Layers className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "BOOKING", label: "Bookings", icon: <CalendarCheck className="w-3.5 h-3.5 text-brand-500" /> },
  { value: "PARTNER", label: "Partners", icon: <User className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "CUSTOMER", label: "Customers", icon: <User className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "PAYMENT", label: "Payments", icon: <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> },
  { value: "ADMIN", label: "Security & Admin", icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> },
];

const PAGE_SIZE_OPTIONS: CustomSelectOption[] = [
  { value: "10", label: "10 per page" },
  { value: "20", label: "20 per page" },
  { value: "50", label: "50 per page" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [markingAllRead, setMarkingAllRead] = useState<boolean>(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Filters state
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch notifications from GET /api/notifications
  const fetchNotifications = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const isReadParam =
        readFilter === "unread" ? false : readFilter === "read" ? true : undefined;

      try {
        const [notifRes, countRes] = await Promise.all([
          getNotificationsApi({
            page: currentPage,
            limit: pageSize,
            isRead: isReadParam,
            forceRefresh: true,
          }),
          getUnreadNotificationCountApi(true),
        ]);

        if (notifRes && notifRes.success && Array.isArray(notifRes.data)) {
          setNotifications(notifRes.data);
          if (notifRes.pagination) {
            setTotalRecords(notifRes.pagination.total);
            setTotalPages(Math.max(notifRes.pagination.totalPages, 1));
          } else {
            setTotalRecords(notifRes.data.length);
            setTotalPages(1);
          }
        }

        if (countRes && countRes.success && countRes.data) {
          setUnreadCount(countRes.data.unreadCount || 0);
        } else if (typeof notifRes?.unreadCount === "number") {
          setUnreadCount(notifRes.unreadCount);
        }
      } catch (err) {
        console.error("fetchNotifications error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, pageSize, readFilter]
  );

  // Initial fetch and 10-second background polling without shimmer
  useEffect(() => {
    fetchNotifications(false);
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark a single notification as read: PATCH /api/notifications/:id/read
  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));

    try {
      const res = await markNotificationAsReadApi(id);
      if (res && res.success) {
        toast.success("Marked as Read", "Notification marked as read.");
      }
    } catch (err) {
      console.error("handleMarkAsRead error:", err);
    } finally {
      setMarkingId(null);
    }
  };

  // Mark all notifications as read: PATCH /api/notifications/read-all
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAllRead(true);

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      const res = await markAllNotificationsAsReadApi();
      if (res && res.success) {
        toast.success("All Read", "All notifications marked as read.");
      }
    } catch (err) {
      console.error("handleMarkAllAsRead error:", err);
      toast.error("Error", "Failed to mark all as read.");
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Client-side filtering for category and search
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Category match
      if (categoryFilter !== "ALL") {
        if ((item.category || "").toUpperCase() !== categoryFilter) return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchMessage = item.message?.toLowerCase().includes(q);
        const matchAction = item.action?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchActor = item.actor?.name?.toLowerCase().includes(q);
        const matchEntity = item.entity?.name?.toLowerCase().includes(q);
        if (!matchMessage && !matchAction && !matchCategory && !matchActor && !matchEntity) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, categoryFilter, searchQuery]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── 1. PAGE HEADER (STRICTLY ONE PRIMARY BUTTON PER AGENTS.md RULE) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800/80 shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Notifications Hub
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-black text-xs shadow-2xs">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System alerts, booking updates, and administrative push notifications.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Secondary Button */}
          <button
            type="button"
            onClick={() => fetchNotifications(false)}
            disabled={loading || refreshing}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading || refreshing ? "animate-spin text-brand-600" : ""}`} />
          </button>

          {/* THE ONLY PRIMARY BUTTON ON THIS PAGE (Strictly compliant with .agents/AGENTS.md) */}
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead || unreadCount === 0 || loading}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{markingAllRead ? "Marking..." : "Mark All As Read"}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. FILTERS & SEARCH TOOLBAR ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs (All / Unread / Read) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setReadFilter("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                readFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Notifications
            </button>
            <button
              type="button"
              onClick={() => {
                setReadFilter("unread");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                readFilter === "unread"
                  ? "bg-brand-600 text-white shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setReadFilter("read");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                readFilter === "read"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Read
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-1 lg:justify-end">
            {/* Category Filter */}
            <div className="w-44">
              <CustomSelect
                size="sm"
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={CATEGORY_FILTER_OPTIONS}
                placeholder="All Categories"
              />
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notification messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. NOTIFICATIONS AUDIT TRAIL LIST ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Notification Feed ({filteredNotifications.length})</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            Real-time System Audit Stream
          </span>
        </div>

        {/* Body: Direct display without shimmer */}
        {filteredNotifications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {readFilter === "unread"
                ? "You're all caught up! No unread notifications."
                : "No notifications found"}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {readFilter === "unread"
                ? "All events and updates have been acknowledged."
                : "Try adjusting your search query or category filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  !notif.isRead
                    ? "bg-brand-50/20 dark:bg-brand-950/20 hover:bg-brand-50/40 dark:hover:bg-brand-950/30"
                    : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/80 mt-0.5">
                    {getNotificationIcon(notif.category, notif.action)}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Category Badge */}
                      <span
                        className={`font-mono font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryBadge(
                          notif.category
                        )}`}
                      >
                        {notif.category || "UPDATE"}
                      </span>

                      {/* Unread indicator dot */}
                      {!notif.isRead && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                          <span>NEW</span>
                        </span>
                      )}

                      {/* Actor Info */}
                      {notif.actor?.name && (
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">
                          {notif.actor.name}
                        </span>
                      )}

                      {/* Entity Reference */}
                      {notif.entity?.id && (
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                          #{notif.entity.id}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white pt-0.5 flex items-center gap-2">
                      <span>{notif.action || "Notification Alert"}</span>
                      {notif.entity?.type === "Booking" && (
                        <Link
                          href={`/bookings`}
                          className="text-slate-400 hover:text-brand-600 inline-flex items-center gap-0.5 font-semibold text-[11px]"
                        >
                          <span>View Bookings</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <span className="text-[11px] font-mono text-slate-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatRelativeTime(notif.createdAt)}</span>
                  </span>

                  {!notif.isRead ? (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif._id)}
                      disabled={markingId === notif._id}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                      <span>{markingId === notif._id ? "Saving..." : "Mark Read"}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Read</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── 4. PAGINATION FOOTER ─── */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} notifications
            </span>
            <div className="w-32">
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
              disabled={currentPage <= 1 || loading}
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
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
