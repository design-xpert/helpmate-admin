"use client";

import { Wallet, DollarSign, TrendingUp } from "lucide-react";

export default function PartnerWalletPage() {
  return (
    <div className="space-y-6 pb-12 select-none opacity-90">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand-600" />
            <span>Wallet</span>
          </h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-600">Available Wallet Cashout</span>
          <h3 className="text-xl font-black text-emerald-600">₹ 14,850</h3>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-indigo-600">Total Completed Earnings</span>
          <h3 className="text-xl font-black text-indigo-600">₹ 84,200</h3>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold text-amber-600">Security Reserve Balance</span>
          <h3 className="text-xl font-black text-amber-600">₹ 5,000</h3>
        </div>
      </div>

      {/* Table Placeholder */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-48"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl w-full flex items-center justify-between px-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
