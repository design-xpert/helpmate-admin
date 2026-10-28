"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/DataTable";
import { Portal } from "@/components/Portal";
import { initialTransactions, TransactionItem } from "@/lib/mockData";
import {
  CreditCard,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Eye,
  Download,
  X,
  Receipt,
  AlertCircle,
  Clock,
  ArrowLeft,
  FileText,
  Building,
  Sparkles,
  Filter,
} from "lucide-react";

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions);
  const [selectedTxn, setSelectedTxn] = useState<TransactionItem | null>(null);
  const [selectedMethodFilter, setSelectedMethodFilter] = useState("All Methods");

  const totalVolume = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const successCount = transactions.filter((t) => t.status === "Success").length;

  const filteredTransactions = transactions.filter((t) => {
    if (selectedMethodFilter === "All Methods") return true;
    return t.paymentMethod.toLowerCase().includes(selectedMethodFilter.toLowerCase());
  });

  const columns: Column<TransactionItem>[] = [
    {
      key: "id",
      header: "Transaction ID",
      accessor: (row) => (
        <div className="flex flex-col items-start gap-0.5 text-left">
          <button
            type="button"
            onClick={() => setSelectedTxn(row)}
            className="font-mono font-extrabold text-brand-600 dark:text-brand-400 text-xs hover:underline text-left"
          >
            {row.id}
          </button>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {row.date}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "bookingId",
      header: "Booking Reference",
      accessor: (row) => (
        <span className="inline-flex items-center font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 whitespace-nowrap shadow-2xs">
          {row.bookingId}
        </span>
      ),
      sortable: true,
    },
    {
      key: "customerName",
      header: "Customer",
      accessor: (row) => (
        <button
          type="button"
          onClick={() => setSelectedTxn(row)}
          className="font-bold text-slate-900 dark:text-white text-xs hover:text-brand-600 text-left transition-colors whitespace-nowrap"
        >
          {row.customerName}
        </button>
      ),
      sortable: true,
    },
    {
      key: "amount",
      header: "Amount Paid (₹)",
      accessor: (row) => (
        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
          ₹{row.amount.toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          {row.paymentMethod}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
            row.status === "Success"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : row.status === "Refunded"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {row.status === "Success" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          {row.status === "Refunded" && <RefreshCw className="w-3 h-3 text-amber-600" />}
          {row.status === "Failed" && <AlertCircle className="w-3 h-3 text-red-600" />}
          <span>{row.status}</span>
        </span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTxn(row)}
            title="View Payment Receipt & Details"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => alert(`Downloading Tax Invoice PDF for ${row.id}...`)}
            title="Download Tax Invoice PDF"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {row.status === "Success" && (
            <button
              type="button"
              onClick={() => {
                const updated = transactions.map((t) => (t.id === row.id ? { ...t, status: "Refunded" as const } : t));
                setTransactions(updated);
              }}
              title="Issue Instant Customer Refund"
              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-600" />
            <span>Payments</span>
          </h1>
        </div>
      </div>

      {/* 4 Executive Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payments Volume</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{(totalVolume + 1485000).toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +24.8%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block">Varanasi Operations Settlements</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prepaid UPI & Cards</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">82% Prepaid</span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block">Instant Digital Gateway Settlement</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passed Rate</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950 dark:border-purple-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {successCount} / {transactions.length} Passed
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold block">96.4% Success Rate</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Refunds Processed</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹4,250</span>
          </div>
          <span className="text-[11px] text-amber-600 font-bold block">Instant Razorpay Auto-Refunds</span>
        </div>
      </div>

      {/* Main DataTable with Payment Method Filter & Export CSV in Toolbar */}
      <DataTable
        columns={columns}
        data={filteredTransactions}
        searchPlaceholder="Search transaction ID, customer name or booking ref..."
        extraFilters={
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <CreditCard className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Payment Method:</span>
            <select
              value={selectedMethodFilter}
              onChange={(e) => setSelectedMethodFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="All Methods">All Payment Methods</option>
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cash">Cash on Service</option>
              <option value="Wallet">Helpmate Wallet</option>
              <option value="Credit Card">Credit Card</option>
              <option value="NetBanking">NetBanking</option>
            </select>
          </div>
        }
      />

      {/* PAYMENT RECEIPT DETAILS MODAL */}
      {selectedTxn && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-lg w-full space-y-5 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none max-h-[90vh] overflow-y-auto">
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200 dark:border-brand-800 shadow-lux">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Payment Receipt & Invoice</h3>
                    <p className="font-mono text-xs text-brand-600 dark:text-brand-400 font-bold">
                      {selectedTxn.id} • Ref: {selectedTxn.bookingId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Body Details */}
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Customer Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{selectedTxn.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Payment Method</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{selectedTxn.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Gateway Reference</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      pg_rzp_99182470
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Timestamp</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTxn.date}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 space-y-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Base Service Price</span>
                    <span className="font-bold">₹{Math.round(selectedTxn.amount * 0.82)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Convenience & Booking Fee</span>
                    <span className="font-bold">₹49</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>GST (CGST 9% + SGST 9%)</span>
                    <span className="font-bold">₹{Math.round(selectedTxn.amount * 0.14)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-brand-200 dark:border-brand-800 pt-2 text-slate-900 dark:text-white">
                    <span>Total Amount Paid</span>
                    <span className="text-brand-600 dark:text-brand-400">₹{selectedTxn.amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => alert(`Downloading Official GST Invoice PDF for ${selectedTxn.id}...`)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-extrabold text-xs shadow-lux"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
