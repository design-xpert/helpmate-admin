"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileText,
  FileSpreadsheet,
  Database,
  TrendingUp,
  CreditCard,
  Receipt,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"booking" | "revenue" | "gst" | "commission" | "refund">("booking");
  const [dateRange, setDateRange] = useState("this_month");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadReport = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const reportsSummary = [
    { title: "Total Bookings Generated", value: "1,420 Jobs", change: "+14.2% MoM", icon: BarChart3, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400" },
    { title: "Gross Platform Revenue", value: "₹18,45,000", change: "+18.5% MoM", icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
    { title: "Net GST Collected (18%)", value: "₹2,81,440", change: "+12.0% Tax Compliant", icon: Receipt, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
    { title: "25% Helpmate Commission", value: "₹4,61,250", change: "+15.8% Platform Net", icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            <span>Reports & Exports</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
          >
            <option value="this_month">This Month (July 2026)</option>
            <option value="last_month">Last Month (June 2026)</option>
            <option value="quarter">This Quarter (Q3 2026)</option>
            <option value="year">FY 2026-27 Full Year</option>
          </select>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{downloadSuccess ? "CSV Report Downloaded!" : "Download CSV Report"}</span>
          </button>
        </div>
      </div>

      {/* Report Selection Sub-tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "booking", label: "Bookings Audit Log" },
          { id: "revenue", label: "Gross Revenue Ledger" },
          { id: "gst", label: "GST 18% Tax Filing" },
          { id: "commission", label: "HelpMate 25% Platform Fee" },
          { id: "refund", label: "Refunds & Credits" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all capitalize whitespace-nowrap cursor-pointer ${
              reportType === tab.id
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Report Breakdown Table Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-600" />
              <span>{reportType} Weekly Telemetry Breakdown (Varanasi Zone)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Itemized transaction audit under CGST & SGST Act 2017</p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-bold shrink-0">
            Report ID: RPT-VAR-202607
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Reporting Period</th>
                <th className="pb-3">Total Job Volume</th>
                <th className="pb-3">Gross Amount</th>
                <th className="pb-3">GST Component (18%)</th>
                <th className="pb-3">Net Platform Revenue</th>
                <th className="pb-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {[
                { period: "Week 1 (July 01 - July 07)", volume: "350 Jobs", gross: 420000, tax: 64074, net: 105000 },
                { period: "Week 2 (July 08 - July 14)", volume: "380 Jobs", gross: 465000, tax: 70932, net: 116250 },
                { period: "Week 3 (July 15 - July 21)", volume: "410 Jobs", gross: 510000, tax: 77796, net: 127500 },
                { period: "Week 4 (July 22 - July 28)", volume: "280 Jobs", gross: 450000, tax: 68644, net: 112500 },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-4 font-extrabold text-slate-900 dark:text-white text-sm">{row.period}</td>
                  <td className="py-4 text-slate-600 dark:text-slate-300 font-mono">{row.volume}</td>
                  <td className="py-4 font-mono font-bold text-slate-900 dark:text-white">₹{row.gross.toLocaleString("en-IN")}</td>
                  <td className="py-4 font-mono font-bold text-purple-600 dark:text-purple-400">₹{row.tax.toLocaleString("en-IN")}</td>
                  <td className="py-4 font-mono font-black text-emerald-600 dark:text-emerald-400">₹{row.net.toLocaleString("en-IN")}</td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Exported CSV dataset for ${row.period}`)}
                      className="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 hover:bg-brand-100 font-extrabold text-[11px] border border-brand-200 dark:border-brand-800 transition-colors cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2 Quick Export Dataset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-brand-500 transition-all group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Full Bookings & Orders Dataset</h4>
              <p className="text-xs text-slate-400">Complete itemized booking assignments with address & PIN codes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadReport()}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Bookings CSV (Varanasi HQ)</span>
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-purple-500 transition-all group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Partner Directory & KYC Audit</h4>
              <p className="text-xs text-slate-400">Technician biometric KYC, police PCC clearance, and payout ledgers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadReport()}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Partner Directory CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
