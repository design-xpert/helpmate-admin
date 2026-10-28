"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

export type JobLifecycleStatus = "Assigned" | "En Route" | "In Progress" | "Completed" | "Alerts";

export interface JobNotificationLogItem {
  id: string;
  jobStatus: JobLifecycleStatus;
  bookingId: string;
  recipientName: string;
  recipientPhone: string;
  recipientRole: "Customer" | "Technician Partner" | "Admin";
  title: string;
  message: string;
  priority: "High Priority" | "Normal" | "Critical";
  status: "Delivered" | "Sent" | "Read" | "Failed";
  timestamp: string;
}

export default function NotificationsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Job Status Filters & Search
  const [selectedFilter, setSelectedFilter] = useState<string>("All Notifications");
  const [searchQuery, setSearchQuery] = useState("");

  // Job Lifecycle Notifications Dataset
  const [logs, setLogs] = useState<JobNotificationLogItem[]>([
    {
      id: "LOG-VAR-901",
      jobStatus: "Assigned",
      bookingId: "BK-VAR-8821",
      recipientName: "Rajesh Kumar Agrawal",
      recipientPhone: "+91 98390 12345",
      recipientRole: "Customer",
      title: "Service Partner Assigned",
      message: "HelpMate Booking #BK-VAR-8821 assigned! Partner Ramesh Yadav scheduled for 10:00 AM slot.",
      priority: "Normal",
      status: "Delivered",
      timestamp: "2 mins ago",
    },
    {
      id: "LOG-VAR-902",
      jobStatus: "En Route",
      bookingId: "BK-VAR-8821",
      recipientName: "Ramesh Yadav (Partner)",
      recipientPhone: "+91 99350 11223",
      recipientRole: "Technician Partner",
      title: "Partner En Route to Customer Site",
      message: "Partner Ramesh Yadav is traveling to customer location at Sigra, Varanasi (Est. arrival: 12 mins).",
      priority: "Normal",
      status: "Delivered",
      timestamp: "8 mins ago",
    },
    {
      id: "LOG-VAR-903",
      jobStatus: "In Progress",
      bookingId: "BK-VAR-8819",
      recipientName: "Alok Verma",
      recipientPhone: "+91 98391 44556",
      recipientRole: "Customer",
      title: "AC Jet Wash Service Work In Progress",
      message: "Technician has reached customer site and started Split AC Power Jet Foam Cleaning.",
      priority: "High Priority",
      status: "Read",
      timestamp: "20 mins ago",
    },
    {
      id: "LOG-VAR-904",
      jobStatus: "Completed",
      bookingId: "BK-VAR-8815",
      recipientName: "Sunita Devi",
      recipientPhone: "+91 94152 67890",
      recipientRole: "Customer",
      title: "Job Completed & OTP Verified",
      message: "4-Digit closure OTP 8821 verified! Service completed successfully and billing receipt generated.",
      priority: "Normal",
      status: "Delivered",
      timestamp: "35 mins ago",
    },
    {
      id: "LOG-VAR-905",
      jobStatus: "Alerts",
      bookingId: "BK-VAR-8812",
      recipientName: "Varanasi Ops Coordinator",
      recipientPhone: "Admin Alert",
      recipientRole: "Admin",
      title: "Diagnostic Spare Quote Requires Approval",
      message: "Technician requested diagnostic quote of ₹1,450 for copper pipe replacement. Requires admin review.",
      priority: "Critical",
      status: "Delivered",
      timestamp: "50 mins ago",
    },
    {
      id: "LOG-VAR-906",
      jobStatus: "Assigned",
      bookingId: "BK-VAR-8809",
      recipientName: "Vikram Malhotra",
      recipientPhone: "+91 98765 43210",
      recipientRole: "Customer",
      title: "RO Water Purifier Service Assigned",
      message: "Technician Manoj Kumar assigned for RO Filter Sanitization at Lanka locality.",
      priority: "Normal",
      status: "Sent",
      timestamp: "1 hour ago",
    },
    {
      id: "LOG-VAR-907",
      jobStatus: "Completed",
      bookingId: "BK-VAR-8801",
      recipientName: "Siddharth Gupta",
      recipientPhone: "+91 91234 56789",
      recipientRole: "Customer",
      title: "Commercial Unit Repair Completed",
      message: "Commercial HVAC hydro repair completed. Net payment of ₹3,000 processed to partner.",
      priority: "Normal",
      status: "Delivered",
      timestamp: "2 hours ago",
    },
  ]);

  // Filtered Notifications based on Job Lifecycle Statuses
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchFilter =
        selectedFilter === "All Notifications" ||
        (selectedFilter === "Assigned" && item.jobStatus === "Assigned") ||
        (selectedFilter === "En Route" && item.jobStatus === "En Route") ||
        (selectedFilter === "In Progress" && item.jobStatus === "In Progress") ||
        (selectedFilter === "Completed" && item.jobStatus === "Completed") ||
        (selectedFilter === "Alerts" && item.jobStatus === "Alerts");

      const matchSearch =
        searchQuery === "" ||
        item.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [logs, selectedFilter, searchQuery]);

  const handleResendNotification = (id: string) => {
    setLogs(
      logs.map((l) =>
        l.id === id ? { ...l, status: "Delivered", timestamp: "Just now (Resent)" } : l
      )
    );
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadgeStyle = (jobStatus: JobLifecycleStatus) => {
    switch (jobStatus) {
      case "Assigned":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800";
      case "En Route":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "In Progress":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Alerts":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
    }
  };

  const getStatusIcon = (jobStatus: JobLifecycleStatus) => {
    switch (jobStatus) {
      case "Assigned":
        return <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />;
      case "En Route":
        return <Navigation className="w-3.5 h-3.5 text-purple-600" />;
      case "In Progress":
        return <Wrench className="w-3.5 h-3.5 text-amber-600 animate-pulse" />;
      case "Completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "Alerts":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-10">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-600" />
          <span>Notifications Hub</span>
        </h1>
      </div>

      {/* ─── 2. JOB STATUS LIFECYCLE FILTER BAR & SEARCH ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {["All Notifications", "Assigned", "En Route", "In Progress", "Completed", "Alerts"].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === filter
                  ? "bg-brand-600 text-white shadow-xs font-black"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span>{filter}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking ID, customer or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-medium"
          />
        </div>
      </div>

      {/* ─── 3. JOB LIFECYCLE AUDIT TRAIL LIST ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Job Stage Activity Log ({filteredLogs.length})</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400 font-bold">Auto-synced with Partner Telemetry API</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Job Lifecycle Status Badge */}
                  <span
                    className={`font-mono font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${getStatusBadgeStyle(
                      log.jobStatus
                    )}`}
                  >
                    {getStatusIcon(log.jobStatus)}
                    <span>{log.jobStatus}</span>
                  </span>

                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    #{log.bookingId}
                  </span>

                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {log.recipientName} ({log.recipientPhone})
                  </span>

                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {log.recipientRole}
                  </span>
                </div>

                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white pt-0.5">
                  {log.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {log.message}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <span className="text-[11px] font-mono text-slate-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {log.timestamp}
                </span>

                <button
                  type="button"
                  onClick={() => handleResendNotification(log.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-slate-700 dark:text-slate-300 hover:text-brand-600 font-extrabold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{copiedId === log.id ? "Resent!" : "Resend Alert"}</span>
                </button>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium text-xs">
              No job notifications found for filter &ldquo;{selectedFilter}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
