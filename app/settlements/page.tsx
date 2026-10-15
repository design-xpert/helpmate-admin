"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { Portal } from "@/components/Portal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  initialTechnicians,
  Technician,
  initialSettlementRecords,
  SettlementRecord,
} from "@/lib/mockData";
import {
  DollarSign,
  CheckCircle2,
  Upload,
  FileCheck,
  ShieldCheck,
  CreditCard,
  Building,
  Clock,
  Send,
  X,
  Plus,
  BadgeAlert,
  Eye,
  Percent,
  Calendar,
  CalendarDays,
  RotateCcw,
  TrendingUp,
  Sun,
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

export default function SettlementsPage() {
  const [techs, setTechs] = useState<Technician[]>(initialTechnicians);
  const [settlementLogs, setSettlementLogs] = useState<SettlementRecord[]>(
    initialSettlementRecords
  );
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Calendar Date Range Filter States
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filtered History & Dynamic Calculations
  const filteredHistoryLogs = settlementLogs.filter((s) =>
    checkDateInRange(s.settlementDate, startDate, endDate)
  );

  const todayStrYMD = new Date().toISOString().split("T")[0];
  const dailySettledAmount = settlementLogs
    .filter((s) => {
      const d = parseFlexibleDate(s.settlementDate);
      if (!d) return s.settlementDate.toLowerCase().includes("today");
      return d.toISOString().split("T")[0] === todayStrYMD || s.settlementDate.toLowerCase().includes("today");
    })
    .reduce((sum, s) => sum + (s.netPayoutAmount || 0), 0);

  const totalDisbursedFiltered = filteredHistoryLogs.reduce((sum, s) => sum + (s.netPayoutAmount || 0), 0);
  const totalCommissionFiltered = filteredHistoryLogs.reduce((sum, s) => sum + (s.commissionDeducted || 0), 0);
  const totalPendingPayout = techs.reduce((sum, t) => sum + (t.pendingPayout || 0), 0);
  const pendingTechsCount = techs.filter((t) => (t.pendingPayout || 0) > 0).length;
  // Process Manual Settlement Payout Modal State
  const [selectedTechForPayout, setSelectedTechForPayout] = useState<Technician | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(25);
  const [gstRate, setGstRate] = useState<number>(18);
  const [payoutMethod, setPayoutMethod] = useState<
    "Manual Bank Transfer (IMPS / NEFT)" | "Manual UPI Transfer" | "Manual Cash Payout" | "Direct Bank Deposit"
  >("Manual Bank Transfer (IMPS / NEFT)");
  const [utrNumberInput, setUtrNumberInput] = useState<string>("");
  const [settlementDateInput, setSettlementDateInput] = useState<string>("Today, 08:30 PM");
  const [proofUploaded, setProofUploaded] = useState<boolean>(true);
  const [proofUrlInput, setProofUrlInput] = useState<string>(
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80"
  );
  const [notesInput, setNotesInput] = useState<string>("Manual weekly payout processed & UTR reference verified");

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleOpenPayoutModal = (tech: Technician) => {
    setSelectedTechForPayout(tech);
    setCommissionRate(25);
    setGstRate(18);
    setUtrNumberInput(`UTR-VAR-2026-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setNotesInput("Manual weekly payout processed & UTR reference verified");
    setProofUploaded(true);
  };

  const handleConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechForPayout || !utrNumberInput.trim()) return;

    const payoutAmount = selectedTechForPayout.pendingPayout;
    const grossVal = Math.round(payoutAmount / 0.75);
    const commVal = Math.round(grossVal * 0.25);

    // 1. Create new manual settlement record
    const newRecord: SettlementRecord = {
      id: `SETTL-VAR-${Math.floor(950 + Math.random() * 50)}`,
      technicianId: selectedTechForPayout.id,
      technicianName: selectedTechForPayout.name,
      category: selectedTechForPayout.category,
      bankAccountName: selectedTechForPayout.bankAccountName || selectedTechForPayout.name,
      bankAccountNumber: selectedTechForPayout.bankAccountNumber || "9820-1049-8120",
      ifscCode: selectedTechForPayout.ifscCode || "SBIN0001240",
      upiId: selectedTechForPayout.upiId || `${selectedTechForPayout.name.toLowerCase().replace(/\s+/g, ".")}@okaxis`,
      grossAmount: grossVal,
      commissionDeducted: commVal,
      netPayoutAmount: payoutAmount,
      paymentMethod: payoutMethod,
      utrNumber: utrNumberInput.trim(),
      settlementDate: settlementDateInput || "Today",
      period: "Current Weekly Cycle",
      status: "Completed",
      proofUrl: proofUrlInput,
      notes: notesInput,
    };

    // 2. Update technician balance
    setTechs(
      techs.map((t) =>
        t.id === selectedTechForPayout.id
          ? {
              ...t,
              commissionPaid: t.commissionPaid + commVal,
              pendingPayout: 0,
              lastPayoutDate: "Just Now (Manual)",
              payoutProofUrl: proofUrlInput,
            }
          : t
      )
    );

    setSettlementLogs([newRecord, ...settlementLogs]);
    setSelectedTechForPayout(null);

    // 3. Add visual Toast notification!
    setToasts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "success",
        title: "Manual Settlement Processed Successfully!",
        message: `₹${payoutAmount.toLocaleString()} transferred to ${selectedTechForPayout.name} • UTR: ${utrNumberInput.trim()}`,
      },
    ]);
  };

  // PENDING PAYOUTS COLUMNS
  const pendingColumns: Column<Technician>[] = [
    {
      key: "name",
      header: "Partner",
      accessor: (row) => (
        <Link
          href={`/settlements/${row.id}`}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            {row.avatar ? (
              <Image
                src={row.avatar}
                alt={row.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{row.name}</span>
            <span className="text-[10px] text-slate-400">{row.role} ({row.locality})</span>
          </div>
        </Link>
      ),
      sortable: true,
    },
    { key: "category", header: "Category", sortable: true },
    {
      key: "lastPayoutDate",
      header: "Settlement Cycle Date",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs">
            {row.lastPayoutDate || "14 Aug 2026"}
          </span>
          <span className="text-[10px] text-amber-600 font-bold">Weekly Cycle Payout</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "totalEarnings",
      header: "Gross Revenue (100%)",
      accessor: (row) => (
        <span className="font-bold text-slate-900 dark:text-white">
          ₹{(row?.totalEarnings ?? 0).toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "commissionPaid",
      header: "Helpmate Fee (25%)",
      accessor: (row) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          ₹{(row?.commissionPaid ?? 0).toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "pendingPayout",
      header: "Net Payable (75%)",
      accessor: (row) => (
        <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
          ₹{(row?.pendingPayout ?? 0).toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Manual Settlement Action",
      accessor: (row) => (
        <div>
          {(row?.pendingPayout ?? 0) > 0 ? (
            <button
              type="button"
              onClick={() => handleOpenPayoutModal(row)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-xs border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-amber-600" /> Process Manual Settlement
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Manually Settled
            </span>
          )}
        </div>
      ),
    },
  ];

  // COMPLETED SETTLEMENT HISTORY COLUMNS
  const historyColumns: Column<SettlementRecord>[] = [
    {
      key: "id",
      header: "Settlement ID",
      accessor: (row) => (
        <Link
          href={`/settlements/${row?.id}`}
          className="font-mono font-extrabold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>{row?.id}</span>
        </Link>
      ),
      sortable: true,
    },
    {
      key: "technicianName",
      header: "Partner & Category",
      accessor: (row) => (
        <Link
          href={`/settlements/${row?.id}`}
          className="flex flex-col group cursor-pointer"
        >
          <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{row?.technicianName}</span>
          <span className="text-[10px] text-slate-400">{row?.category}</span>
        </Link>
      ),
      sortable: true,
    },
    {
      key: "paymentMethod",
      header: "Manual Mode & UTR Ref",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 dark:text-slate-200">{row?.paymentMethod}</span>
          <span className="font-mono text-[10px] text-brand-600 dark:text-brand-400 font-extrabold">
            {row?.utrNumber}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "netPayoutAmount",
      header: "Net Amount Paid",
      accessor: (row) => (
        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
          ₹{(row?.netPayoutAmount ?? 0).toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    { key: "settlementDate", header: "Date Settled", sortable: true },
    {
      key: "proofUrl",
      header: "Manual Receipt Proof",
      accessor: (row) => (
        <div>
          {row.proofUrl ? (
            <a
              href={row.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold text-[11px] hover:underline flex items-center gap-1 w-fit border border-slate-200 dark:border-slate-700"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> View UTR Receipt
            </a>
          ) : (
            <span className="text-slate-400 text-[10px] italic">No receipt</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: "View",
              icon: Eye,
              href: `/settlements/${row?.id}`,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Manual Settlement Badge & Add Settlement Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-brand-600" />
              <span>Partner Manual Settlement Ledger</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <BadgeAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Manual Settlement Active</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Process manual partner weekly settlements, enter bank UTR numbers, and upload manual payment receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const firstPending = techs.find((t) => (t.pendingPayout || 0) > 0) || techs[0];
            handleOpenPayoutModal(firstPending);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Process Manual Settlement</span>
        </button>
      </div>

      {/* 4 EXECUTIVE SUMMARY CARDS IN ONE SINGLE LINE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Payout Volume */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs hover:border-emerald-300 transition-all">
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {startDate || endDate ? "Filtered Total Settled" : "Total Payout Volume"}
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{totalDisbursedFiltered.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] font-bold text-slate-400 block">
              {filteredHistoryLogs.length} Settlements Processed
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Daily Payout Volume */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs hover:border-blue-300 transition-all">
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Daily Payout (Today)</span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              ₹{dailySettledAmount.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
              Today's Disbursed Volume
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800 shrink-0">
            <Sun className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Pending Payouts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs hover:border-amber-300 transition-all">
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Manual Payouts</span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              ₹{totalPendingPayout.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
              {pendingTechsCount} Partners Pending
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 dark:border-amber-800 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Helpmate Platform Commission */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs hover:border-purple-300 transition-all">
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Platform Take Rate (25%)</span>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
              ₹{totalCommissionFiltered.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 block">
              Helpmate Commission Earned
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 border border-purple-200 dark:border-purple-800 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Single Calendar Popover Filter Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit text-xs font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Pending Manual Payouts ({pendingTechsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Completed Settlement Ledger ({filteredHistoryLogs.length})
          </button>
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

      {/* Data Table */}
      {activeTab === "pending" ? (
        <DataTable
          columns={pendingColumns}
          data={techs}
          searchPlaceholder="Search technician partner..."
        />
      ) : (
        <DataTable
          columns={historyColumns}
          data={filteredHistoryLogs}
          searchPlaceholder="Search settlement ID, partner name, UTR number..."
        />
      )}

      {/* PROCESS MANUAL SETTLEMENT SLIDING DRAWER */}
      {selectedTechForPayout && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <form
              onSubmit={handleConfirmPayout}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-5 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    {selectedTechForPayout.avatar ? (
                      <Image
                        src={selectedTechForPayout.avatar}
                        alt={selectedTechForPayout.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Process Manual Settlement: {selectedTechForPayout.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedTechForPayout.role} • {selectedTechForPayout.locality}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTechForPayout(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
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
                const grossVolume = Math.round(selectedTechForPayout.pendingPayout / 0.75);
                const commissionAmount = Math.round(grossVolume * (commissionRate / 100));
                const gstAmount = Math.round(commissionAmount * (gstRate / 100));
                const netPayable = grossVolume - commissionAmount - gstAmount;

                return (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Gross Job Volume (100%)</span>
                      <span className="font-mono">₹{grossVolume.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                      <span>Helpmate Platform Share ({commissionRate}%)</span>
                      <span className="font-mono">-₹{commissionAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-purple-600 dark:text-purple-400">
                      <span>GST Paid by Partner ({gstRate}% GST on Commission)</span>
                      <span className="font-mono">-₹{gstAmount.toLocaleString()}</span>
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

              {/* Partner Bank Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Verified Bank Account Details
                </span>
                <div className="grid grid-cols-2 gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Account Holder</span>
                    <span>{selectedTechForPayout.bankAccountName || selectedTechForPayout.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Account Number</span>
                    <span className="font-mono">{selectedTechForPayout.bankAccountNumber || "9820-1049-8120"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">IFSC Code</span>
                    <span className="font-mono">{selectedTechForPayout.ifscCode || "SBIN0001240"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">UPI ID</span>
                    <span className="font-mono text-brand-600 dark:text-brand-400">
                      {selectedTechForPayout.upiId || `${selectedTechForPayout.name.toLowerCase().replace(/\s+/g, ".")}@okaxis`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manual Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Manual Payout Method *
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold outline-none focus:border-brand-500 cursor-pointer"
                  >
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
                    value={utrNumberInput}
                    onChange={(e) => setUtrNumberInput(e.target.value)}
                    placeholder="e.g. UTR-VAR-2026-98124018"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-extrabold outline-none focus:border-brand-500"
                    required
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
                          {proofUploaded ? "Manual_Payout_Receipt_UTR.pdf" : "Choose File"}
                        </span>
                        <span className="text-[10px] text-slate-400">Bank Transfer Slip / Payment Screenshot</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofUploaded(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-white font-extrabold text-xs cursor-pointer"
                    >
                      {proofUploaded ? "Uploaded" : "Browse"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Finance Audit Notes / Remarks
                  </label>
                  <input
                    type="text"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Remarks..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTechForPayout(null)}
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
