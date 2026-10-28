"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  UserCheck,
  Wrench,
  ArrowUpRight,
  BarChart3,
  Sparkles,
  Calendar,
  Layers,
  Percent,
  CheckCircle,
  Clock,
  Activity,
  Award,
  Zap,
  DollarSign,
} from "lucide-react";

export default function AnalyticsPage() {
  const [activeMetric, setActiveMetric] = useState<"revenue" | "customer" | "partner" | "service">("revenue");
  const [timePeriod, setTimePeriod] = useState("this_month");

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-600" />
            <span>Executive Analytics</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
          >
            <option value="this_month">This Month (July 2026)</option>
            <option value="last_month">Last Month (June 2026)</option>
            <option value="quarter">This Quarter (Q3 2026)</option>
            <option value="year">FY 2026-27 Full Year</option>
          </select>
        </div>
      </div>

      {/* Pill Section Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "revenue", label: "Revenue & Profit Velocity", icon: TrendingUp },
          { id: "customer", label: "Customer Retention Telemetry", icon: Users },
          { id: "partner", label: "Partner Productivity", icon: UserCheck },
          { id: "service", label: "Service Demand Distribution", icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMetric(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeMetric === tab.id
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Visual Telemetry Chart & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Chart Column (8 Cols) */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-600" />
                <span>{activeMetric} Velocity & Dynamic Telemetry Curve</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time daily booking volume across Varanasi Metro zones</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl text-xs font-extrabold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
              +24.8% Growth Rate
            </span>
          </div>

          {/* Interactive Visual Chart Bars */}
          <div className="h-64 flex items-end justify-between gap-2.5 pt-8 pb-3 px-2 border-b border-slate-100 dark:border-slate-800">
            {[45, 60, 52, 78, 85, 92, 70, 88, 95, 110, 105, 125].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                <div
                  style={{ height: `${height}%` }}
                  className="w-full bg-gradient-to-t from-brand-600 via-brand-500 to-purple-500 rounded-t-xl group-hover:brightness-125 transition-all relative shadow-xs"
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono font-bold py-1 px-2 rounded-lg whitespace-nowrap shadow-md pointer-events-none transition-opacity">
                    ₹{(height * 1480).toLocaleString("en-IN")}
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 font-mono">M{i + 1}</span>
              </div>
            ))}
          </div>

          {/* Chart Metrics Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Peak Single Day Volume</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">₹1,25,000</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Avg Order Basket Value</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">₹1,380</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Repeat Customer Rate</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">64.2%</span>
            </div>
          </div>
        </div>

        {/* Top Demands Breakdown Column (4 Cols) */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" />
              <span>Top Category Share</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Varanasi revenue distribution by service category</p>
          </div>

          <div className="space-y-4 text-xs">
            {[
              { name: "AC Servicing & Repair", share: "38%", amount: "₹6,90,000", color: "bg-brand-600" },
              { name: "Full Home Deep Cleaning", share: "24%", amount: "₹4,32,000", color: "bg-emerald-600" },
              { name: "Smart Home Electrician", share: "18%", amount: "₹3,24,000", color: "bg-purple-600" },
              { name: "RO Water Filter Installation", share: "12%", amount: "₹2,16,000", color: "bg-amber-600" },
              { name: "Hydro Jet Plumbing", share: "8%", amount: "₹1,44,000", color: "bg-blue-600" },
            ].map((svc, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between font-extrabold text-slate-900 dark:text-white text-xs">
                  <span>{svc.name}</span>
                  <span className="font-mono text-brand-600 dark:text-brand-400">{svc.amount}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full ${svc.color} rounded-full transition-all duration-500`} style={{ width: svc.share }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>Share: {svc.share}</span>
                  <span>Varanasi Metro</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
