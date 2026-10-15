"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { initialTechnicians, Technician, initialSettlementRecords, SettlementRecord } from "@/lib/mockData";
import { Portal } from "@/components/Portal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { DataTable, Column } from "@/components/DataTable";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  FileCheck,
  Building,
  User,
  ShieldCheck,
  CreditCard,
  Briefcase,
  Clock,
  Send,
  Download,
  ExternalLink,
  ChevronRight,
  Upload,
  X,
  FileText,
  BadgeCheck,
  Phone,
  Mail,
  MapPin,
  CalendarCheck,
  Receipt,
  Wallet,
  Percent,
  Calendar,
  RotateCcw,
} from "lucide-react";

function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const lower = dateStr.toLowerCase().trim();
  if (lower.includes("today")) return new Date();
  if (lower.includes("yesterday")) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }
  const timestamp = Date.parse(dateStr);
  if (!isNaN(timestamp)) return new Date(timestamp);
  return null;
}

function checkDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
  if (!startDate && !endDate) return true;
  const d = parseFlexibleDate(dateStr);
  if (!d) return true;

  if (startDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    if (d < s) return false;
  }
  if (endDate) {
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    if (d > e) return false;
  }
  return true;
}

function SettlementDetailContent() {
  const router = useRouter();
  const params = useParams();
  const rawId = (params?.id as string) || "SETTL-VAR-951";

  const [commissionRate, setCommissionRate] = useState<number>(25);
  const [gstRate, setGstRate] = useState<number>(18);

  // Find matching settlement record or mock fallback
  const existingRecord = initialSettlementRecords.find(
    (s) => s.id.toLowerCase() === rawId.toLowerCase() || s.technicianId === rawId
  );

  const tech: Technician =
    initialTechnicians.find(
      (t) => t.id === (existingRecord?.technicianId || rawId) || t.name === existingRecord?.technicianName
    ) || initialTechnicians[0];

  const settlement: SettlementRecord = existingRecord || {
    id: rawId.startsWith("SETTL-VAR") ? rawId : `SETTL-VAR-2026-${rawId}`,
    technicianId: tech.id,
    technicianName: tech.name,
    category: tech.category,
    bankAccountName: tech.name,
    bankAccountNumber: "50100299182711",
    ifscCode: "HDFC0001827",
    upiId: `${tech.name.toLowerCase().replace(/\s+/g, ".")}@okhdfcbank`,
    grossAmount: Math.round(tech.totalEarnings / 2),
    commissionDeducted: Math.round((tech.totalEarnings / 2) * 0.25),
    netPayoutAmount: Math.round((tech.totalEarnings / 2) * 0.75),
    paymentMethod: "Manual Bank Transfer (IMPS / NEFT)",
    utrNumber: `UTR-VAR-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
    settlementDate: "12 Aug 2026, 08:30 PM",
    period: "Current Settlement Cycle",
    status: "Completed",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    notes: "Manual weekly payout processed & bank UTR reference verified by finance team",
  };

  const [showManualPayoutDrawer, setShowManualPayoutDrawer] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Calendar Date Range Filter States
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activePreset, setActivePreset] = useState<"all" | "today" | "week" | "month">("all");

  const handleApplyPreset = (preset: "all" | "today" | "week" | "month") => {
    setActivePreset(preset);
    const today = new Date();
    const formatYMD = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const ymd = formatYMD(today);
      setStartDate(ymd);
      setEndDate(ymd);
    } else if (preset === "week") {
      const d = new Date(today);
      const day = d.getDay();
      const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diffToMon));
      setStartDate(formatYMD(monday));
      setEndDate(formatYMD(new Date()));
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatYMD(firstDay));
      setEndDate(formatYMD(new Date()));
    }
  };

  // Line item jobs included in this weekly settlement
  const settlementJobs = [
    {
      id: "BK-VAR-9981",
      customerName: "Alok Verma",
      serviceTitle: tech.category + " - Power Jet Wash & Gas Check",
      locality: tech.locality + ", Varanasi",
      date: "08 Aug 2026",
      grossBill: 2400,
      helpmateFee: 600,
      netShare: 1800,
      status: "Completed",
    },
    {
      id: "BK-VAR-9975",
      customerName: "Rajesh Agrawal",
      serviceTitle: tech.category + " - Filter Cartridge & RO Sanitization",
      locality: "Sigra, Varanasi",
      date: "07 Aug 2026",
      grossBill: 1600,
      helpmateFee: 400,
      netShare: 1200,
      status: "Completed",
    },
    {
      id: "BK-VAR-9968",
      customerName: "Vikram Malhotra",
      serviceTitle: tech.category + " - Full Deep Hydro Wash",
      locality: "Lanka, Varanasi",
      date: "05 Aug 2026",
      grossBill: 3200,
      helpmateFee: 800,
      netShare: 2400,
      status: "Completed",
    },
    {
      id: "BK-VAR-9952",
      customerName: "Deepak Sharma",
      serviceTitle: tech.category + " - Comprehensive Annual Maintenance",
      locality: "Bhelupur, Varanasi",
      date: "03 Aug 2026",
      grossBill: 4000,
      helpmateFee: 1000,
      netShare: 3000,
      status: "Completed",
    },
  ];

  // Filtered jobs by date range
  const filteredJobs = settlementJobs.filter((job) =>
    checkDateInRange(job.date, startDate, endDate)
  );

  const totalGrossBill = filteredJobs.reduce((acc, job) => acc + job.grossBill, 0);
  const totalHelpmateFee = filteredJobs.reduce((acc, job) => acc + job.helpmateFee, 0);
  const totalNetShare = filteredJobs.reduce((acc, job) => acc + job.netShare, 0);

  const jobColumns: Column<any>[] = [
    {
      key: "id",
      header: "Booking ID",
      accessor: (row) => (
        <Link
          href={`/bookings/${row.id}`}
          className="font-mono text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-800 hover:underline inline-flex items-center gap-1"
        >
          <span>#{row.id}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
      sortable: true,
    },
    {
      key: "serviceTitle",
      header: "Service & Customer",
      accessor: (row) => (
        <div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{row.serviceTitle}</h4>
          <span className="text-[10px] text-slate-400 font-bold">Client: {row.customerName} ({row.locality})</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "date",
      header: "Job Date",
      accessor: (row) => <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{row.date}</span>,
      sortable: true,
    },
    {
      key: "grossBill",
      header: "Gross Bill (100%)",
      accessor: (row) => (
        <span className="font-extrabold text-slate-900 dark:text-white font-mono text-xs">
          ₹{row.grossBill.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "helpmateFee",
      header: "Helpmate Fee (25%)",
      accessor: (row) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
          ₹{row.helpmateFee.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "netShare",
      header: "Net Partner Payout (75%)",
      accessor: (row) => (
        <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-xs">
          ₹{row.netShare.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link
              href="/settlements"
              className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-brand-600" />
              <span>Settlement Ledger</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300 font-bold">Partner Settlement</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-brand-600 dark:text-brand-400 font-extrabold font-mono">{settlement.id}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-brand-600" />
              <span>Weekly Payout Statement: {settlement.id}</span>
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-[11px] border border-emerald-200 dark:border-emerald-800">
              ● Official Statement
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Official Helpmate weekly partner settlement voucher, bank UTR transfer audit, and job commission ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Print Payout Statement</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualPayoutDrawer(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Process Manual Settlement</span>
          </button>
        </div>
      </div>

      {/* OFFICIAL FINANCIAL STATEMENT HEADER BANNER (CLEAN THEME) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                  Weekly Settlement Voucher
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                  ● {settlement.status}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
                {settlement.paymentMethod}
              </h2>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Net Bank Payout ({100 - commissionRate}%)</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{settlement.netPayoutAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">Gross Volume (100%)</span>
            <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">₹{settlement.grossAmount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">Commission ({commissionRate}%)</span>
            <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 text-sm">-₹{settlement.commissionDeducted.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">Partner GST ({gstRate}%)</span>
            <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400 text-sm">-₹{Math.round(settlement.commissionDeducted * (gstRate / 100)).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">Bank UTR Token</span>
            <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">{settlement.utrNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px]">Transfer Date</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{settlement.settlementDate}</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (6 Cols): Partner & Bank Info */}
        <div className="lg:col-span-6 space-y-6">
          {/* Beneficiary Partner Info (Minimal - No Personal Details) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <User className="w-5 h-5 text-brand-600" />
                <span>Beneficiary Partner</span>
              </h3>
              <Link
                href={`/technicians/${tech.id}`}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <span>View Full Partner Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 shadow-xs shrink-0">
                {tech.avatar ? (
                  <Image
                    src={tech.avatar}
                    alt={tech.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">{tech.name}</h4>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block">{tech.category}</span>
              </div>
            </div>
          </div>

          {/* Registered Bank Account Specs Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                <span>Verified Payout Bank Account</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-extrabold border border-purple-200">
                Verified Account
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Account Holder Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{settlement.bankAccountName || tech.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Bank Account Number</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">{settlement.bankAccountNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">IFSC Code</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white">{settlement.ifscCode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">UPI ID</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{settlement.upiId || `${tech.name.toLowerCase().replace(/\s+/g, ".")}@okhdfcbank`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (6 Cols): Settlement Audit & UTR Slip */}
        <div className="lg:col-span-6 space-y-6">
          {/* Audit Remarks & Mode */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Finance Audit & Transfer Specs</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-semibold">Settlement Reference ID</span>
                <span className="font-mono font-black text-brand-600 dark:text-brand-400">{settlement.id}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-semibold">Transfer Payment Mode</span>
                <span className="font-bold text-slate-900 dark:text-white">{settlement.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-semibold">Bank UTR Token</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{settlement.utrNumber}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 font-semibold block mb-1">Audit Notes / Remarks</span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                  {settlement.notes || "Manual weekly payout processed & bank UTR reference verified by finance team"}
                </p>
              </div>
            </div>
          </div>

          {/* Receipt Proof Card */}
          {settlement.proofUrl && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span>Bank Transfer UTR Receipt Proof</span>
                </span>
                <a
                  href={settlement.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Image</span>
                </a>
              </h3>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-48 bg-slate-100 dark:bg-slate-800">
                {settlement.proofUrl ? (
                  <Image
                    src={settlement.proofUrl}
                    alt="Bank UTR Receipt Proof"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JOBS INCLUDED IN THIS SETTLEMENT TABLE */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-600" />
              <span>Jobs Included in This Weekly Settlement Cycle</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              Showing {filteredJobs.length} of {settlementJobs.length} Completed Bookings
            </span>
          </div>

          {/* Single Calendar Icon Popover Button */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            align="right"
          />
        </div>

        <DataTable
          columns={jobColumns}
          data={filteredJobs}
          searchPlaceholder="Search job booking ID, customer or service..."
        />

        {/* Ledger Totals Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="font-extrabold text-slate-700 dark:text-slate-300">
            Filtered Ledger Summary ({filteredJobs.length} Jobs)
          </div>
          <div className="flex items-center gap-6 font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">Total Gross:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">₹{totalGrossBill.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Helpmate 25%:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{totalHelpmateFee.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Net Partner 75%:</span>
              <span className="font-black text-amber-600 dark:text-amber-400">₹{totalNetShare.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PROCESS MANUAL SETTLEMENT SLIDING DRAWER */}
      {showManualPayoutDrawer && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowManualPayoutDrawer(false);
                setToasts((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    type: "success",
                    title: "Manual Settlement Processed Successfully!",
                    message: `₹${settlement.netPayoutAmount.toLocaleString()} transferred to ${tech.name} • UTR: ${settlement.utrNumber}`,
                  },
                ]);
              }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-5 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    {tech.avatar ? (
                      <Image
                        src={tech.avatar}
                        alt={tech.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Process Manual Settlement
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{tech.name} • {tech.role}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowManualPayoutDrawer(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Manage Commission & GST Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-brand-600" />
                    <span>Manage Commission & Partner GST</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                    Live Calculation
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Commission Rate (%) */}
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">
                      Helpmate Take Rate (%)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-extrabold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                      />
                      <span className="font-extrabold text-slate-500">%</span>
                    </div>
                  </div>

                  {/* GST Rate (%) Paid by Partner */}
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">
                      Partner GST Rate (%)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={gstRate}
                        onChange={(e) => setGstRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-extrabold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                      />
                      <span className="font-extrabold text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets for Commission */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400">Commission Presets:</span>
                  {[10, 15, 20, 25, 30].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setCommissionRate(rate)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        commissionRate === rate
                          ? "bg-brand-600 text-white shadow-2xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-300"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Earnings & Payment Breakdown Box */}
              {(() => {
                const grossVol = settlement.grossAmount;
                const commAmt = Math.round(grossVol * (commissionRate / 100));
                const gstAmt = Math.round(commAmt * (gstRate / 100));
                const netPayable = grossVol - commAmt - gstAmt;

                return (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Gross Job Volume (100%)</span>
                      <span className="font-mono">₹{grossVol.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                      <span>Helpmate Platform Share ({commissionRate}%)</span>
                      <span className="font-mono">-₹{commAmt.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-purple-600 dark:text-purple-400">
                      <span>GST Paid by Partner ({gstRate}% GST on Commission)</span>
                      <span className="font-mono">-₹{gstAmt.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-amber-200 dark:border-amber-800 pt-2 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                      <span>Net Bank Payable Payout to Partner</span>
                      <span className="text-amber-600 dark:text-amber-400 text-base font-mono">
                        ₹{netPayable.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Form Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Manual Transfer Mode *
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold outline-none focus:border-brand-500 cursor-pointer">
                    <option value="Manual Bank Transfer (IMPS / NEFT)">Manual Bank Transfer (IMPS / NEFT)</option>
                    <option value="Manual UPI Transfer">Manual UPI Transfer</option>
                    <option value="Manual Cash Payout">Manual Cash Payout</option>
                    <option value="Direct Bank Deposit">Direct Bank Deposit (Manual)</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Bank UTR / Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    defaultValue={settlement.utrNumber}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-extrabold outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Upload Manual Payment Receipt (PDF / Image) *
                  </label>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Upload className="w-4 h-4 text-brand-600" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          Manual_Payout_Receipt_UTR.pdf
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Bank Transfer Slip / Payment Screenshot</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-white font-extrabold text-xs cursor-pointer"
                    >
                      Uploaded
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualPayoutDrawer(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-lux cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  Mark Manually Settled
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}



      {/* GLOBAL TOAST NOTIFICATIONS */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}

export default function SettlementDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs font-bold text-slate-500">Loading settlement details...</div>}>
      <SettlementDetailContent />
    </Suspense>
  );
}
