"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
  CreditCard,
  Layers,
  Settings,
  X,
  ChevronRight,
  Eye,
  Copy,
  Check,
  ArrowUpDown,
  Smartphone,
  Laptop,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  Radio,
  FileCode,
  Plus,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { CustomSelect, CustomSelectOption } from "@/components/CustomSelect";

export type EventSeverity = "info" | "success" | "warning" | "critical";

export type EventModule =
  | "Bookings"
  | "Partners"
  | "Customers"
  | "Billing"
  | "CMS & Pricing"
  | "Security & RBAC"
  | "System Worker";

export interface LogChangeDiff {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  relativeTime: string;
  actor: {
    name: string;
    email: string;
    role: "Super Admin" | "Office Admin" | "Partner" | "Customer" | "System Bot";
    avatarUrl?: string;
    ipAddress: string;
    device: "Desktop / Chrome" | "Mobile / App" | "API / Server Daemon";
    location: string;
  };
  event: string;
  module: EventModule;
  actionType: "Create" | "Update" | "Delete" | "Status Change" | "Auth & Access";
  severity: EventSeverity;
  targetEntity: {
    type: string;
    id: string;
    name: string;
    linkUrl?: string;
  };
  description: string;
  changes?: LogChangeDiff[];
  metadata?: Record<string, any>;
}

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: "LOG-VAR-10892",
    timestamp: "2026-11-02T10:32:15.000Z",
    relativeTime: "2 mins ago",
    actor: {
      name: "Aman Verma",
      email: "aman@helpmate.net.in",
      role: "Super Admin",
      ipAddress: "103.24.88.14",
      device: "Desktop / Chrome",
      location: "Sigra, Varanasi",
    },
    event: "Booking Status Updated",
    module: "Bookings",
    actionType: "Status Change",
    severity: "success",
    targetEntity: {
      type: "Booking",
      id: "BK-VAR-8942",
      name: "AC Deep Clean & Jet Pump Service",
      linkUrl: "/bookings",
    },
    description: "Marked job as Completed after customer OTP verification & digital invoice generation.",
    changes: [
      { field: "bookingStatus", oldValue: "In Progress", newValue: "Completed" },
      { field: "paymentStatus", oldValue: "Pending", newValue: "Paid" },
      { field: "completedAt", oldValue: null, newValue: "2026-11-02T10:32:00.000Z" },
    ],
    metadata: {
      otpVerified: true,
      serviceRating: 5,
      invoiceNumber: "HM-INV-2026-8942",
      totalCollected: 1499,
      paymentMode: "UPI / PhonePe",
    },
  },
  {
    id: "LOG-VAR-10891",
    timestamp: "2026-11-02T10:25:40.000Z",
    relativeTime: "9 mins ago",
    actor: {
      name: "System Daemon Worker",
      email: "worker-dispatch@helpmate.net.in",
      role: "System Bot",
      ipAddress: "172.31.18.22",
      device: "API / Server Daemon",
      location: "AWS ap-south-1 (Mumbai)",
    },
    event: "Partner Auto-Dispatched",
    module: "Bookings",
    actionType: "Update",
    severity: "info",
    targetEntity: {
      type: "Booking",
      id: "BK-VAR-8945",
      name: "Microwave PCB Diagnostic",
      linkUrl: "/bookings",
    },
    description: "Algorithmic proximity dispatch assigned partner Manoj Kumar (Distance: 1.8km, Rating: 4.8).",
    changes: [
      { field: "assignedPartner", oldValue: "Unassigned", newValue: "Manoj Kumar (TECH-104)" },
      { field: "dispatchScore", oldValue: null, newValue: "94.2%" },
    ],
    metadata: {
      nearestLocality: "Lanka, Varanasi",
      distanceKm: 1.8,
      responseTimeMs: 340,
    },
  },
  {
    id: "LOG-VAR-10890",
    timestamp: "2026-11-02T10:14:02.000Z",
    relativeTime: "20 mins ago",
    actor: {
      name: "Pooja Sharma",
      email: "pooja.sharma@helpmate.net.in",
      role: "Office Admin",
      ipAddress: "103.24.88.19",
      device: "Desktop / Chrome",
      location: "Cantt HQ, Varanasi",
    },
    event: "Partner KYC Verification Approved",
    module: "Partners",
    actionType: "Update",
    severity: "success",
    targetEntity: {
      type: "Partner",
      id: "TECH-VAR-449",
      name: "Rajesh Gond (Electrician Pro)",
      linkUrl: "/technicians",
    },
    description: "Approved Aadhaar and Bank verification documents. Partner marked active for job allocations.",
    changes: [
      { field: "kycStatus", oldValue: "Pending Review", newValue: "Verified & Approved" },
      { field: "payoutEnabled", oldValue: false, newValue: true },
      { field: "dutyStatus", oldValue: "Inactive", newValue: "On-Duty Available" },
    ],
    metadata: {
      aadhaarLast4: "8821",
      bankIfsc: "PUNB0123400",
      verifiedByAdminId: "ADM-004",
    },
  },
  {
    id: "LOG-VAR-10889",
    timestamp: "2026-11-02T09:48:19.000Z",
    relativeTime: "46 mins ago",
    actor: {
      name: "Aman Verma",
      email: "aman@helpmate.net.in",
      role: "Super Admin",
      ipAddress: "103.24.88.14",
      device: "Desktop / Chrome",
      location: "Sigra, Varanasi",
    },
    event: "Service Package Pricing Updated",
    module: "CMS & Pricing",
    actionType: "Update",
    severity: "warning",
    targetEntity: {
      type: "Service Package",
      id: "PKG-RO-02",
      name: "RO Water Purifier Complete Filter Replacement",
      linkUrl: "/cms",
    },
    description: "Updated Diwali festive discount pricing and warranty tag configuration.",
    changes: [
      { field: "price", oldValue: "₹1,899", newValue: "₹1,699" },
      { field: "discountBadge", oldValue: "10% OFF", newValue: "15% FESTIVE" },
      { field: "warrantyDays", oldValue: 30, newValue: 60 },
    ],
    metadata: {
      category: "Water Purifier",
      affectedAddonsCount: 3,
      approvedBy: "Aman Verma",
    },
  },
  {
    id: "LOG-VAR-10888",
    timestamp: "2026-11-02T09:12:00.000Z",
    relativeTime: "1 hour ago",
    actor: {
      name: "Rajesh Gond",
      email: "rajesh.tech@helpmate.partner",
      role: "Partner",
      ipAddress: "49.36.124.90",
      device: "Mobile / App",
      location: "Bhelupur, Varanasi",
    },
    event: "Diagnostic Quote Submitted",
    module: "Billing",
    actionType: "Create",
    severity: "info",
    targetEntity: {
      type: "Booking",
      id: "BK-VAR-8930",
      name: "Submersible Pump Motor Repair",
      linkUrl: "/bookings",
    },
    description: "Added 2 add-on spare parts (Heavy Capacitor & Bearing) requiring customer approval for ₹850.",
    changes: [
      { field: "addOnsTotal", oldValue: "₹0", newValue: "₹850" },
      { field: "estimateStatus", oldValue: "Standard", newValue: "Additional Quoted" },
    ],
    metadata: {
      parts: ["50uF Capacitor", "Sealed Steel Bearing 6204"],
      customerNotifiedSms: true,
    },
  },
  {
    id: "LOG-VAR-10887",
    timestamp: "2026-11-02T08:35:10.000Z",
    relativeTime: "2 hours ago",
    actor: {
      name: "Vikram Malhotra",
      email: "vikram.m@gmail.com",
      role: "Customer",
      ipAddress: "27.57.190.41",
      device: "Mobile / App",
      location: "Mahmoorganj, Varanasi",
    },
    event: "New Online Booking Placed",
    module: "Bookings",
    actionType: "Create",
    severity: "info",
    targetEntity: {
      type: "Booking",
      id: "BK-VAR-8947",
      name: "Full Home Deep Cleaning & Sanitization",
      linkUrl: "/bookings",
    },
    description: "Customer created booking from consumer mobile app. Scheduled for Today 02:00 PM - 04:00 PM.",
    changes: [
      { field: "originChannel", oldValue: null, newValue: "Mobile App (Android)" },
      { field: "totalAmount", oldValue: null, newValue: "₹2,499" },
      { field: "slot", oldValue: null, newValue: "02:00 PM - 04:00 PM" },
    ],
    metadata: {
      locality: "Mahmoorganj",
      pincode: "221010",
      couponApplied: "FIRSTCLEAN100",
    },
  },
  {
    id: "LOG-VAR-10886",
    timestamp: "2026-11-02T07:15:33.000Z",
    relativeTime: "3 hours ago",
    actor: {
      name: "Security Sentinel Daemon",
      email: "security@helpmate.net.in",
      role: "System Bot",
      ipAddress: "172.31.18.25",
      device: "API / Server Daemon",
      location: "AWS ap-south-1 (Mumbai)",
    },
    event: "Multiple Failed Login Attempts Detected",
    module: "Security & RBAC",
    actionType: "Auth & Access",
    severity: "critical",
    targetEntity: {
      type: "Security Incident",
      id: "SEC-ALERT-409",
      name: "Brute-force Block on Admin Portal",
    },
    description: "IP 194.26.29.112 exceeded 5 consecutive failed login attempts on office-admin portal. Temporarily blocked for 60 mins.",
    changes: [
      { field: "ipRateLimit", oldValue: "Active (0/5)", newValue: "Blocked (5/5)" },
      { field: "blockExpiry", oldValue: null, newValue: "2026-11-02T08:15:33.000Z" },
    ],
    metadata: {
      targetedAccount: "coordinator-varanasi@helpmate.net.in",
      firewallRule: "WAF-DROP-IP-409",
      actionTaken: "IP rate-limited for 3600 seconds",
    },
  },
  {
    id: "LOG-VAR-10885",
    timestamp: "2026-11-01T22:10:00.000Z",
    relativeTime: "12 hours ago",
    actor: {
      name: "Aman Verma",
      email: "aman@helpmate.net.in",
      role: "Super Admin",
      ipAddress: "103.24.88.14",
      device: "Desktop / Chrome",
      location: "Sigra, Varanasi",
    },
    event: "Staff Role Permissions Modified",
    module: "Security & RBAC",
    actionType: "Update",
    severity: "warning",
    targetEntity: {
      type: "Role / Permissions",
      id: "ROLE-DISPATCH-01",
      name: "Varanasi Area Coordinator",
      linkUrl: "/users",
    },
    description: "Granted permission to override booking cancellation penalty and manually edit partner payout splits.",
    changes: [
      { field: "canOverrideCancellationFee", oldValue: false, newValue: true },
      { field: "canEditCommissionSplit", oldValue: false, newValue: true },
    ],
    metadata: {
      modifiedRole: "Varanasi Area Coordinator",
      affectedUsersCount: 4,
    },
  },
  {
    id: "LOG-VAR-10884",
    timestamp: "2026-11-01T18:42:11.000Z",
    relativeTime: "16 hours ago",
    actor: {
      name: "Finance Automated Ledger",
      email: "finance-bot@helpmate.net.in",
      role: "System Bot",
      ipAddress: "172.31.18.22",
      device: "API / Server Daemon",
      location: "AWS ap-south-1 (Mumbai)",
    },
    event: "Weekly Partner Payout Batch Processed",
    module: "Billing",
    actionType: "Create",
    severity: "success",
    targetEntity: {
      type: "Payout Batch",
      id: "PAY-BATCH-2026-W44",
      name: "Varanasi Weekly Payout (42 Partners)",
      linkUrl: "/settlements",
    },
    description: "Disbursed ₹1,28,450 to 42 verified technicians via RazorpayX IMPS payout batch.",
    changes: [
      { field: "batchStatus", oldValue: "Pending Initiation", newValue: "Settled / Bank Success" },
      { field: "totalTransferred", oldValue: "₹0", newValue: "₹1,28,450" },
    ],
    metadata: {
      successfulTransfers: 42,
      failedTransfers: 0,
      bankUtrRange: "PUNBH26305001 - PUNBH26305042",
    },
  },
  {
    id: "LOG-VAR-10883",
    timestamp: "2026-11-01T15:05:44.000Z",
    relativeTime: "19 hours ago",
    actor: {
      name: "Pooja Sharma",
      email: "pooja.sharma@helpmate.net.in",
      role: "Office Admin",
      ipAddress: "103.24.88.19",
      device: "Desktop / Chrome",
      location: "Cantt HQ, Varanasi",
    },
    event: "Customer Profile Address Updated",
    module: "Customers",
    actionType: "Update",
    severity: "info",
    targetEntity: {
      type: "Customer",
      id: "CUST-VAR-104",
      name: "Sunil Kumar Srivastava",
      linkUrl: "/customers",
    },
    description: "Updated flat number and added landmark (Near Kashi Vishwanath Dham Gate 4).",
    changes: [
      { field: "landmark", oldValue: "Near Godowlia", newValue: "Kashi Vishwanath Gate 4" },
      { field: "flatNumber", oldValue: "Flat 201", newValue: "Flat 204, 2nd Floor" },
    ],
    metadata: {
      updatedVia: "Customer Call Request",
    },
  },
];

const MODULE_OPTIONS: CustomSelectOption[] = [
  { value: "All", label: "All Modules", icon: <Layers className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "Bookings", label: "Bookings", icon: <CalendarCheck className="w-3.5 h-3.5 text-brand-500" /> },
  { value: "Partners", label: "Partners", icon: <User className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "Customers", label: "Customers", icon: <User className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "Billing", label: "Billing & Payouts", icon: <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> },
  { value: "CMS & Pricing", label: "CMS & Pricing", icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
  { value: "Security & RBAC", label: "Security & RBAC", icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-500" /> },
];

const SEVERITY_OPTIONS: CustomSelectOption[] = [
  { value: "All", label: "All Severities", icon: <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "Info", label: "Info", icon: <Info className="w-3.5 h-3.5 text-sky-500" /> },
  { value: "Success", label: "Success", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "Warning", label: "Warning", icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> },
  { value: "Critical", label: "Critical", icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> },
];

const ACTION_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: "All", label: "All Actions", icon: <Activity className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "Create", label: "Create", icon: <Plus className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "Update", label: "Update", icon: <RefreshCw className="w-3.5 h-3.5 text-brand-500" /> },
  { value: "Status Change", label: "Status Change", icon: <ArrowUpDown className="w-3.5 h-3.5 text-purple-500" /> },
  { value: "Delete", label: "Delete", icon: <X className="w-3.5 h-3.5 text-rose-500" /> },
  { value: "Auth & Access", label: "Auth & Access", icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> },
];

const ROLE_OPTIONS: CustomSelectOption[] = [
  { value: "All", label: "All Roles", icon: <User className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "Super Admin", label: "Super Admin", icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> },
  { value: "Office Admin", label: "Office Admin", icon: <Laptop className="w-3.5 h-3.5 text-brand-500" /> },
  { value: "Partner", label: "Partner", icon: <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "Customer", label: "Customer", icon: <User className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "System Bot", label: "System Bot", icon: <Radio className="w-3.5 h-3.5 text-slate-400" /> },
];

const DATE_RANGE_OPTIONS: CustomSelectOption[] = [
  { value: "all", label: "All Time", icon: <Clock className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "today", label: "Today", icon: <Calendar className="w-3.5 h-3.5 text-brand-500" /> },
  { value: "yesterday", label: "Yesterday", icon: <Calendar className="w-3.5 h-3.5 text-slate-500" /> },
  { value: "last7days", label: "Last 7 Days", icon: <Calendar className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "last30days", label: "Last 30 Days", icon: <Calendar className="w-3.5 h-3.5 text-indigo-500" /> },
];

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>(INITIAL_LOGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("All");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [selectedActionType, setSelectedActionType] = useState<string>("All");
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("all");
  const [activeView, setActiveView] = useState<"table" | "timeline">("table");
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<ActivityLogItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Auto-pulse simulation when live stream is enabled
  useEffect(() => {
    if (!isLiveStream) return;
    const interval = setInterval(() => {
      // Gentle timestamp update simulation
    }, 15000);
    return () => clearInterval(interval);
  }, [isLiveStream]);

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search matches
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        log.id.toLowerCase().includes(query) ||
        log.event.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        log.actor.name.toLowerCase().includes(query) ||
        log.actor.email.toLowerCase().includes(query) ||
        log.actor.ipAddress.includes(query) ||
        log.targetEntity.id.toLowerCase().includes(query) ||
        log.targetEntity.name.toLowerCase().includes(query);

      // Module Filter
      const matchModule = selectedModule === "All" || log.module === selectedModule;

      // Severity Filter
      const matchSeverity = selectedSeverity === "All" || log.severity === selectedSeverity.toLowerCase();

      // Action Type Filter
      const matchActionType = selectedActionType === "All" || log.actionType === selectedActionType;

      // Role Filter
      const matchRole = selectedRole === "All" || log.actor.role === selectedRole;

      // Date Range Filter
      let matchDate = true;
      if (dateRange !== "all") {
        const logDate = new Date(log.timestamp).getTime();
        const referenceNow = new Date("2026-11-02T22:00:00.000Z").getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (dateRange === "today") {
          matchDate = referenceNow - logDate <= oneDayMs;
        } else if (dateRange === "yesterday") {
          matchDate = referenceNow - logDate > oneDayMs && referenceNow - logDate <= 2 * oneDayMs;
        } else if (dateRange === "last7days") {
          matchDate = referenceNow - logDate <= 7 * oneDayMs;
        } else if (dateRange === "last30days") {
          matchDate = referenceNow - logDate <= 30 * oneDayMs;
        }
      }

      return matchSearch && matchModule && matchSeverity && matchActionType && matchRole && matchDate;
    });
  }, [logs, searchQuery, selectedModule, selectedSeverity, selectedActionType, selectedRole, dateRange]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedModule !== "All") count++;
    if (selectedSeverity !== "All") count++;
    if (selectedActionType !== "All") count++;
    if (selectedRole !== "All") count++;
    if (dateRange !== "all") count++;
    return count;
  }, [selectedModule, selectedSeverity, selectedActionType, selectedRole, dateRange]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedModule("All");
    setSelectedSeverity("All");
    setSelectedActionType("All");
    setSelectedRole("All");
    setDateRange("all");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    setIsExporting(true);
    setTimeout(() => {
      // Generate clean CSV format
      const headers = ["Event ID", "Timestamp", "Actor Name", "Actor Role", "IP Address", "Module", "Event Action", "Target Type", "Target ID", "Description", "Severity"];
      const rows = filteredLogs.map((l) => [
        l.id,
        l.timestamp,
        `"${l.actor.name}"`,
        l.actor.role,
        l.actor.ipAddress,
        l.module,
        `"${l.event}"`,
        l.targetEntity.type,
        l.targetEntity.id,
        `"${l.description.replace(/"/g, '""')}"`,
        l.severity,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `helpmate_activity_audit_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 600);
  };

  // Severity styling helper
  const getSeverityBadge = (severity: EventSeverity) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Critical</span>
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Warning</span>
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Success</span>
          </span>
        );
      case "info":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Info className="w-3 h-3 text-sky-500" />
            <span>Info</span>
          </span>
        );
    }
  };

  // Module badge styling
  const getModuleBadge = (module: EventModule) => {
    switch (module) {
      case "Bookings":
        return "bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border-brand-200 dark:border-brand-800";
      case "Partners":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Security & RBAC":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "Billing":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "Customers":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "CMS & Pricing":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  // Actor role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Super Admin":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "Office Admin":
        return "bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 border-brand-200 dark:border-brand-800";
      case "System Bot":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-mono";
      case "Partner":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      default:
        return "bg-slate-50 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
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
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Activity & Audit Trail</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time chronological events, administrative operations, and security audit logs.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Feed Toggle (Secondary button) */}
          <button
            type="button"
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
              isLiveStream
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title={isLiveStream ? "Live feed active: Click to pause auto-updates" : "Click to enable live stream"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveStream ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span>{isLiveStream ? "Live Feed: Active" : "Live Feed: Paused"}</span>
          </button>

          {/* Refresh Secondary Button */}
          <button
            type="button"
            onClick={() => {
              setLogs([...INITIAL_LOGS]);
            }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh activity logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* View Mode Switcher (Secondary buttons) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveView("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "table"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setActiveView("timeline")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "timeline"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Timeline
            </button>
          </div>

          {/* THE ONLY PRIMARY BUTTON ON THIS PAGE (Strictly compliant with .agents/AGENTS.md) */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || filteredLogs.length === 0}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Export Audit CSV"}</span>
          </button>
        </div>
      </div>

      {/* ─── METRIC CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Events (24h)</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {logs.length} Logged
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span>+14.2%</span> <span className="text-slate-400">vs yesterday</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Security & RBAC</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {logs.filter((l) => l.module === "Security & RBAC").length} Critical
          </p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
            1 WAF Block Active
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Booking Operations</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {logs.filter((l) => l.module === "Bookings").length} Mutations
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            100% Audit Verified
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Actors</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {new Set(logs.map((l) => l.actor.name)).size} Operators
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Admins, Partners, Bots
          </span>
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
              placeholder="Search by event, description, actor, target ID (#BK-8942, TECH-449), or IP..."
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

          {/* Quick Custom Select Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Module Filter */}
            <div className="w-44">
              <CustomSelect
                size="sm"
                value={selectedModule}
                onChange={(val) => setSelectedModule(val)}
                options={MODULE_OPTIONS}
                placeholder="All Modules"
              />
            </div>

            {/* Severity Filter */}
            <div className="w-40">
              <CustomSelect
                size="sm"
                value={selectedSeverity}
                onChange={(val) => setSelectedSeverity(val)}
                options={SEVERITY_OPTIONS}
                placeholder="All Severities"
              />
            </div>

            {/* Action Type Filter */}
            <div className="w-40">
              <CustomSelect
                size="sm"
                value={selectedActionType}
                onChange={(val) => setSelectedActionType(val)}
                options={ACTION_TYPE_OPTIONS}
                placeholder="All Actions"
              />
            </div>

            {/* Actor Role Filter */}
            <div className="w-40">
              <CustomSelect
                size="sm"
                value={selectedRole}
                onChange={(val) => setSelectedRole(val)}
                options={ROLE_OPTIONS}
                placeholder="All Roles"
              />
            </div>

            {/* Date Range Filter */}
            <div className="w-36">
              <CustomSelect
                size="sm"
                value={dateRange}
                onChange={(val) => setDateRange(val)}
                options={DATE_RANGE_OPTIONS}
                placeholder="All Time"
              />
            </div>

            {/* Reset Filters (Secondary button) */}
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

      {/* ─── MAIN CONTENT VIEW (TABLE VS TIMELINE) ─── */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            No activity logs matched your criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, switching module scopes, or resetting your active filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : activeView === "table" ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor / Performed By</th>
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Module & Target Entity</th>
                  <th className="py-3 px-4">Description / State Change</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogForDetails(log)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-900 dark:text-white block font-mono text-xs">
                          {log.relativeTime}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-[160px]">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center font-extrabold text-xs shrink-0 border border-brand-200/60 dark:border-brand-800/60">
                          {log.actor.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white truncate block">
                            {log.actor.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border inline-block ${getRoleBadge(
                              log.actor.role
                            )}`}
                          >
                            {log.actor.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Event Action */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {log.event}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {log.actionType}
                        </span>
                      </div>
                    </td>

                    {/* Module & Target Entity */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block ${getModuleBadge(
                            log.module
                          )}`}
                        >
                          {log.module}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                            {log.targetEntity.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Description / State Change */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {log.description}
                        </p>
                        {log.changes && log.changes.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {log.changes.slice(0, 2).map((ch, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                              >
                                {ch.field}: {String(ch.oldValue ?? "none")} → {String(ch.newValue)}
                              </span>
                            ))}
                            {log.changes.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                +{log.changes.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>

                    {/* Actions (Secondary Button) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogForDetails(log);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TIMELINE STREAM VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLogForDetails(log)}
                className="relative group cursor-pointer"
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shrink-0 shadow-xs ${
                    log.severity === "critical"
                      ? "bg-rose-500 text-white"
                      : log.severity === "warning"
                      ? "bg-amber-500 text-white"
                      : log.severity === "success"
                      ? "bg-emerald-500 text-white"
                      : "bg-sky-500 text-white"
                  }`}
                >
                  <Activity className="w-3 h-3" />
                </div>

                {/* Timeline Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 hover:border-brand-500/50 hover:shadow-xs transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {log.event}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getModuleBadge(
                          log.module
                        )}`}
                      >
                        {log.module}
                      </span>
                      {getSeverityBadge(log.severity)}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>{log.relativeTime}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString("en-IN")}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {log.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {log.actor.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({log.actor.role})
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        Target: {log.targetEntity.id}
                      </span>
                    </div>

                    <span className="text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Inspect Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER INSPECTION DRAWER (MODAL / PORTAL) ─── */}
      {selectedLogForDetails && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-xs flex justify-end outline-none animate-in fade-in duration-200">
            <div
              className="absolute inset-0"
              onClick={() => setSelectedLogForDetails(null)}
            />

            <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-brand-600 dark:text-brand-400">
                      {selectedLogForDetails.id}
                    </span>
                    {getSeverityBadge(selectedLogForDetails.severity)}
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedLogForDetails.event}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLogForDetails(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
                {/* 1. Event Overview Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Event Overview
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed">
                    {selectedLogForDetails.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Timestamp (ISO)</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {selectedLogForDetails.timestamp}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Scope Module</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedLogForDetails.module}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Actor Profile & Context */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Actor / Initiator Information
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center font-extrabold text-sm border border-brand-200 dark:border-brand-800">
                      {selectedLogForDetails.actor.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                        {selectedLogForDetails.actor.name}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {selectedLogForDetails.actor.email}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Role</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedLogForDetails.actor.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">IP Address</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedLogForDetails.actor.ipAddress}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Location</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedLogForDetails.actor.location}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Platform / Client</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedLogForDetails.actor.device}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Target Entity Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Target Entity Reference
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white block">
                        {selectedLogForDetails.targetEntity.id}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 text-xs">
                        {selectedLogForDetails.targetEntity.name} ({selectedLogForDetails.targetEntity.type})
                      </span>
                    </div>

                    {selectedLogForDetails.targetEntity.linkUrl && (
                      <Link
                        href={selectedLogForDetails.targetEntity.linkUrl}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Entity</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* 4. State Diff & Mutations */}
                {selectedLogForDetails.changes && selectedLogForDetails.changes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      State Mutation Diff ({selectedLogForDetails.changes.length} fields changed)
                    </span>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase">
                            <th className="p-2.5">Field</th>
                            <th className="p-2.5">Previous Value</th>
                            <th className="p-2.5">New Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                          {selectedLogForDetails.changes.map((diff, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                {diff.field}
                              </td>
                              <td className="p-2.5 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">
                                {String(diff.oldValue ?? "null")}
                              </td>
                              <td className="p-2.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold">
                                {String(diff.newValue ?? "null")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Raw Event JSON Metadata */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Raw Event Payload (JSON)</span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedLogForDetails, null, 2),
                          selectedLogForDetails.id
                        )
                      }
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedId === selectedLogForDetails.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Payload</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-64 border border-slate-800 select-all">
                    {JSON.stringify(selectedLogForDetails, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Drawer Footer (Secondary Button) */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLogForDetails(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
