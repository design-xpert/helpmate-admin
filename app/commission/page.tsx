"use client";

import { useState } from "react";
import Image from "next/image";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { Portal } from "@/components/Portal";
import {
  initialTechnicians,
  Technician,
  initialBookings,
  Booking,
  initialCategoryCommissionRules,
  CategoryCommissionRule,
} from "@/lib/mockData";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Wallet,
  Wrench,
  Percent,
  Edit2,
  CheckCircle2,
  X,
  Plus,
  Sliders,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function CommissionPage() {
  const [techs, setTechs] = useState<Technician[]>(initialTechnicians);
  const [commissionRules, setCommissionRules] = useState<CategoryCommissionRule[]>(
    initialCategoryCommissionRules
  );
  const [bookings] = useState<Booking[]>(initialBookings);

  const [activeTab, setActiveTab] = useState<"orders" | "rules" | "partners">("orders");

  // Edit Commission Rule Modal State
  const [editingRule, setEditingRule] = useState<CategoryCommissionRule | null>(null);
  const [editRateInput, setEditRateInput] = useState<number>(25);
  const [editFloorInput, setEditFloorInput] = useState<number>(100);

  const totalEarnings = techs.reduce((sum, t) => sum + (t.totalEarnings || 0), 0);
  const totalCommission = techs.reduce((sum, t) => sum + (t.commissionPaid || 0), 0);
  const totalPending = techs.reduce((sum, t) => sum + (t.pendingPayout || 0), 0);
  const avgTakeRate = (
    commissionRules.reduce((sum, r) => sum + r.commissionPercentage, 0) /
    (commissionRules.length || 1)
  ).toFixed(1);

  const handleSaveCommissionRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setCommissionRules(
      commissionRules.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              commissionPercentage: editRateInput,
              minimumCommissionFloor: editFloorInput,
            }
          : r
      )
    );
    setEditingRule(null);
  };

  // 1. ORDER-LEVEL COMMISSION COLUMNS
  const orderColumns: Column<Booking>[] = [
    {
      key: "id",
      header: "Booking ID",
      accessor: (row) => (
        <span className="font-mono font-extrabold text-brand-600 dark:text-brand-400">
          {row.id}
        </span>
      ),
      sortable: true,
    },
    {
      key: "customerName",
      header: "Customer & City",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">{row.customerName}</span>
          <span className="text-[10px] text-slate-400">{row.locality}, Varanasi</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "category",
      header: "Service Category",
      accessor: (row) => (
        <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
          {row.category}
        </span>
      ),
      sortable: true,
    },
    {
      key: "totalAmount",
      header: "Gross Booking Fare",
      accessor: (row) => (
        <span className="font-extrabold text-slate-900 dark:text-white">
          ₹{(row?.totalAmount ?? 0).toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "commissionAmount",
      header: "Helpmate Take Share (25%)",
      accessor: (row) => (
        <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>₹{row?.commissionAmount || Math.round((row?.basePrice ?? 0) * 0.25)}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "partnerEarnings",
      header: "Partner Net Earnings (75%)",
      accessor: (row) => (
        <span className="font-bold text-purple-600 dark:text-purple-400">
          ₹{row?.partnerEarnings || Math.round((row?.basePrice ?? 0) * 0.75)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Commission Status",
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Earned & Accrued
        </span>
      ),
    },
  ];

  // 2. CATEGORY COMMISSION RULES COLUMNS
  const ruleColumns: Column<CategoryCommissionRule>[] = [
    {
      key: "categoryName",
      header: "Service Category",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-xs">
            <Wrench className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">{row?.categoryName}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "commissionPercentage",
      header: "Platform Commission Rate",
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-black text-sm text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-xl border border-brand-200 dark:border-brand-800">
            {row?.commissionPercentage}%
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            (Partner keeps {100 - (row?.commissionPercentage ?? 0)}%)
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "minimumCommissionFloor",
      header: "Minimum Commission Floor",
      accessor: (row) => (
        <span className="font-bold text-slate-900 dark:text-white">
          ₹{row?.minimumCommissionFloor} per job
        </span>
      ),
    },
    {
      key: "status",
      header: "Rule Status",
      accessor: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
          {row?.status}
        </span>
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
              label: "Adjust Rate",
              icon: Edit2,
              onClick: () => {
                setEditingRule(row);
                setEditRateInput(row.commissionPercentage);
                setEditFloorInput(row.minimumCommissionFloor);
              },
            },
          ]}
        />
      ),
    },
  ];

  // 3. PARTNER EARNINGS COLUMNS
  const partnerColumns: Column<Technician>[] = [
    {
      key: "name",
      header: "Partner Specialist",
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            {row?.avatar ? (
              <Image
                src={row.avatar}
                alt={row?.name || "avatar"}
                fill
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 dark:text-white">{row?.name}</span>
            <span className="text-[10px] text-slate-400">{row?.locality}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    { key: "category", header: "Trade Category", sortable: true },
    {
      key: "totalEarnings",
      header: "Gross Booking Volume",
      accessor: (row) => (
        <span className="font-extrabold text-slate-900 dark:text-white">
          ₹{(row?.totalEarnings ?? 0).toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "commissionPaid",
      header: "Helpmate Fee (25%)",
      accessor: (row) => (
        <span className="font-bold text-brand-600 dark:text-brand-400">
          ₹{(row?.commissionPaid ?? 0).toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "pendingPayout",
      header: "Net Payable Balance",
      accessor: (row) => (
        <span className="font-extrabold text-purple-600 dark:text-purple-400">
          ₹{(row?.pendingPayout ?? 0).toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    { key: "lastPayoutDate", header: "Last Settlement", sortable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-brand-600" />
            <span>Commission & Revenue Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Real-time per-order commission breakdown, category-wise take-rate rules, and partner payout balance management.
          </p>
        </div>
      </div>

      {/* Quick Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Gross Booking Volume</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{totalEarnings.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Helpmate Take Revenue</span>
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200 dark:border-brand-800 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
            ₹{totalCommission.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Net Payouts</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 border border-purple-200 dark:border-purple-800 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
            ₹{totalPending.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Platform Take Rate</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {avgTakeRate}% Avg
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit text-xs font-bold shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "orders"
              ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Order-Level Commission Audit
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "rules"
              ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Category Commission Rules ({commissionRules.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("partners")}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "partners"
              ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Partner Earnings Breakdown
        </button>
      </div>

      {/* Tab Data Table Display */}
      {activeTab === "orders" ? (
        <DataTable
          columns={orderColumns}
          data={bookings}
          searchPlaceholder="Search booking ID or customer..."
        />
      ) : activeTab === "rules" ? (
        <DataTable
          columns={ruleColumns}
          data={commissionRules}
          searchPlaceholder="Search service category..."
        />
      ) : (
        <DataTable
          columns={partnerColumns}
          data={techs}
          searchPlaceholder="Search technician partner..."
        />
      )}

      {/* ADJUST COMMISSION RULE POPUP MODAL */}
      {editingRule && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <form
              onSubmit={handleSaveCommissionRule}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full space-y-5 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none text-xs animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Adjust Category Rate
                    </h3>
                    <p className="text-xs text-slate-500">{editingRule.categoryName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Platform Commission Rate (%) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={editRateInput}
                      onChange={(e) => setEditRateInput(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-sm outline-none focus:border-brand-500"
                      required
                    />
                    <span className="font-black text-base text-slate-400">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Partner will keep <strong className="text-brand-600">{100 - editRateInput}%</strong> of job fare.
                  </p>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Minimum Commission Floor (₹) *
                  </label>
                  <input
                    type="number"
                    value={editFloorInput}
                    onChange={(e) => setEditFloorInput(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Guarantees minimum platform fee even on low-value jobs.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-extrabold shadow-lux cursor-pointer"
                >
                  Update Rate
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}
    </div>
  );
}
