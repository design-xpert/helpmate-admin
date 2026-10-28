"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  CalendarCheck,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  KeyRound,
  FileSpreadsheet,
  Eye,
  LayoutDashboard,
} from "lucide-react";
import { initialBookings, Booking } from "@/lib/mockData";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [partnerBookings, setPartnerBookings] = useState<Booking[]>(
    initialBookings.filter((b) => b.technicianName?.includes("Amit") || b.status === "Pending" || b.status === "Assigned")
  );

  const pendingCount = partnerBookings.filter((b) => b.status === "Pending" || b.status === "Assigned").length;

  const columns: Column<Booking>[] = [
    {
      key: "id",
      header: "Booking ID",
      accessor: (row) => (
        <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{row.id}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer Name",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">{row.customerName}</span>
          <span className="text-[10px] text-slate-500">{row.customerPhone}</span>
        </div>
      ),
    },
    { key: "serviceTitle", header: "Service Title" },
    {
      key: "locality",
      header: "Locality",
      accessor: (row) => (
        <div className="flex items-center gap-1 font-semibold">
          <MapPin className="w-3 h-3 text-brand-600 shrink-0" />
          <span>{row.locality}</span>
        </div>
      ),
    },
    {
      key: "partnerEarnings",
      header: "Your Share (₹)",
      accessor: (row) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
          ₹{row.partnerEarnings || Math.round(row.totalAmount * 0.75)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            row.status === "Completed"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          {row.status}
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
              label: "View Job Details",
              icon: Eye,
              href: `/partner/bookings`,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-600" />
            <span>My Dashboard</span>
          </h1>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">This Month Earnings</span>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹24,850</h3>
          <span className="text-[10px] font-bold text-slate-400">75% Net Share Paid Weekly</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-amber-600">Assigned New Jobs</span>
          <h3 className="text-2xl font-black text-amber-600">{pendingCount} Pending</h3>
          <span className="text-[10px] font-bold text-amber-600">Requires OTP Verification</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-blue-600">Authorized Services</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">4 Categories</h3>
          <span className="text-[10px] font-bold text-slate-400">HVAC, Gas Charge, Repair</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-purple-600">Coverage Zone</span>
          <h3 className="text-2xl font-black text-purple-600">Varanasi South</h3>
          <span className="text-[10px] font-bold text-slate-400">Sigra, Lanka, Bhelupur</span>
        </div>
      </div>

      {/* Main Jobs DataTable without duplicate headers */}
      <DataTable
        columns={columns}
        data={partnerBookings}
      />
    </div>
  );
}
