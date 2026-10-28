"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Bell,
  MessageSquare,
  ShieldCheck,
  Save,
  Database,
  Sliders,
  Smartphone,
  Mail,
  FileSpreadsheet,
  IndianRupee,
  Receipt,
  Percent,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  HelpCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { getPlatformSettingsApi, updatePlatformSettingsApi } from "@/lib/api";
import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "platform-fee" | "general" | "notifications" | "data" | "security"
  >("platform-fee");

  const initialCachedSettings = getStoredModuleData<any>("platform_settings");

  // Platform Fee & GST State
  const [platformFee, setPlatformFee] = useState<number | string>(() => initialCachedSettings?.platformConvenienceFee ?? 49);
  const [gstRate, setGstRate] = useState<number | string>(() => initialCachedSettings?.gstRate ?? 18);
  const [gstinNumber, setGstinNumber] = useState("09AAACH1234F1Z5");
  const [sacCode, setSacCode] = useState("998714");
  const [gstCalculationType, setGstCalculationType] = useState<"exclusive" | "inclusive">("exclusive");
  const [sampleAmount, setSampleAmount] = useState<number | string>(500);

  // API Status & Loading State
  const [loading, setLoading] = useState(() => !(isModuleCacheFresh("platform_settings") && initialCachedSettings));
  const [saving, setSaving] = useState(false);
  const [updatedBy, setUpdatedBy] = useState<{ name?: string; email?: string } | null>(() => initialCachedSettings?.updatedBy || null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => initialCachedSettings?.updatedAt || null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // General Settings State
  const [appName, setAppName] = useState("HelpMate Varanasi HQ");
  const [assignmentRadius, setAssignmentRadius] = useState("15 km");
  const [commissionRate, setCommissionRate] = useState("25%");
  const [supportPhone, setSupportPhone] = useState("+91 542 2200 999");
  const [supportEmail, setSupportEmail] = useState("support@helpmate.net.in");
  const [cancellationFee, setCancellationFee] = useState("₹150");

  // Notifications State
  const [whatsappConfirmations, setWhatsappConfirmations] = useState(true);
  const [otpNotifications, setOtpNotifications] = useState(true);
  const [assignmentAlerts, setAssignmentAlerts] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);

  // Fetch initial platform fee and GST from backend API
  const fetchSettings = async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("platform_settings")) {
      const cached = getStoredModuleData<any>("platform_settings");
      if (cached) {
        if (typeof cached.platformConvenienceFee === "number") setPlatformFee(cached.platformConvenienceFee);
        if (typeof cached.gstRate === "number") setGstRate(cached.gstRate);
        if (cached.updatedBy) setUpdatedBy(cached.updatedBy);
        if (cached.updatedAt) setUpdatedAt(cached.updatedAt);
        setLoading(false);
        return;
      }
    }
    if (!initialCachedSettings) {
      setLoading(true);
    }
    try {
      const res = await getPlatformSettingsApi(force);
      if (res && res.success && res.data) {
        if (typeof res.data.platformConvenienceFee === "number") {
          setPlatformFee(res.data.platformConvenienceFee);
        }
        if (typeof res.data.gstRate === "number") {
          setGstRate(res.data.gstRate);
        }
        if (res.data.updatedBy) {
          setUpdatedBy(res.data.updatedBy);
        }
        if (res.data.updatedAt) {
          setUpdatedAt(res.data.updatedAt);
        }
        setCachedModuleData("platform_settings", res.data);
      }
    } catch (err) {
      console.error("Failed to load platform settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModuleCacheFresh("platform_settings") && initialCachedSettings) {
      setLoading(false);
      return;
    }
    fetchSettings();
  }, []);

  // Save Settings Handler
  const handleSaveSettings = async () => {
    setSaving(true);
    setToast(null);

    const parsedFee = Number(platformFee);
    const parsedGst = Number(gstRate);

    if (isNaN(parsedFee) || parsedFee < 0) {
      setToast({ type: "error", message: "Platform fee must be a valid non-negative number." });
      setSaving(false);
      return;
    }

    if (isNaN(parsedGst) || parsedGst < 0 || parsedGst > 100) {
      setToast({ type: "error", message: "GST rate must be a valid percentage between 0 and 100." });
      setSaving(false);
      return;
    }

    try {
      const res = await updatePlatformSettingsApi({
        platformConvenienceFee: parsedFee,
        gstRate: parsedGst,
      });

      if (res && res.success) {
        setToast({
          type: "success",
          message: res.message || "Platform Fee and GST settings saved successfully!",
        });
        if (res.data) {
          if (typeof res.data.platformConvenienceFee === "number") {
            setPlatformFee(res.data.platformConvenienceFee);
          }
          if (typeof res.data.gstRate === "number") {
            setGstRate(res.data.gstRate);
          }
          if (res.data.updatedBy) {
            setUpdatedBy(res.data.updatedBy);
          }
          if (res.data.updatedAt) {
            setUpdatedAt(res.data.updatedAt);
          }
          setCachedModuleData("platform_settings", res.data);
        }
      } else {
        setToast({
          type: "error",
          message: res?.message || "Failed to update platform settings.",
        });
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setToast({ type: "error", message: "Network error occurred while saving settings." });
    } finally {
      setSaving(false);
    }
  };

  // Live Invoice Calculator Math
  const basePrice = Math.max(0, Number(sampleAmount) || 0);
  const feeVal = Math.max(0, Number(platformFee) || 0);
  const gstVal = Math.max(0, Number(gstRate) || 0);

  let subtotal = 0;
  let taxAmount = 0;
  let finalTotal = 0;
  let cgst = 0;
  let sgst = 0;

  if (gstCalculationType === "exclusive") {
    subtotal = basePrice + feeVal;
    taxAmount = (subtotal * gstVal) / 100;
    cgst = taxAmount / 2;
    sgst = taxAmount / 2;
    finalTotal = subtotal + taxAmount;
  } else {
    finalTotal = basePrice + feeVal;
    taxAmount = finalTotal - finalTotal / (1 + gstVal / 100);
    cgst = taxAmount / 2;
    sgst = taxAmount / 2;
    subtotal = finalTotal - taxAmount;
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification Header Banner */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3 text-xs font-semibold">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-600" />
            <span>General Settings</span>
          </h1>
        </div>

        {/* Strictly ONLY ONE Primary Button on the page */}
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
        </button>
      </div>

      {/* Navigation Tabs (Styled as Secondary Pill Buttons) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "platform-fee", label: "Platform Fee & GST", icon: Receipt },
          { id: "general", label: "General", icon: Sliders },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "data", label: "Data Export", icon: Database },
          { id: "security", label: "Security", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-xs ${
                isActive
                  ? "bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-slate-700 font-bold"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {/* TAB 1: PLATFORM FEE & GST SETTINGS */}
      {activeTab === "platform-fee" && (
        <div className="space-y-6">
          {/* Shimmer Loading Skeleton */}
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
                  <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
                </div>
                <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />
              </div>
            </div>
          ) : (
            <>
              {/* Feature Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Financial Controls & Taxes</span>
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Platform Convenience Fee & GST Config
                    </h2>
                    <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
                      Configure convenience fees applied at checkout and standard Goods & Services Tax (GST) rates for customer invoicing.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchSettings(true)}
                    title="Reload from Server"
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm cursor-pointer transition-all shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Grid: Config Inputs + Live Calculator Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 Cols): Form Sections */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Card 1: Platform Fee Configuration */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
                          <IndianRupee className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            Platform Convenience Fee
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Fixed fee added to customer bookings during checkout
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                        Active Rule
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 text-xs block mb-1.5">
                          Convenience Fee Amount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={platformFee}
                            onChange={(e) => setPlatformFee(e.target.value)}
                            placeholder="49"
                            className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-brand-500 transition-all"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Fee is added to total cart price before applying GST.</span>
                        </p>
                      </div>

                      {/* Quick Presets */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
                          Quick Presets:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[0, 29, 49, 79, 99, 149].map((preset) => {
                            const isSelected = Number(platformFee) === preset;
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setPlatformFee(preset)}
                                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700 font-bold"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                              >
                                ₹{preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Goods & Services Tax (GST) Configuration */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                          <Percent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            Goods & Services Tax (GST) Configuration
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Set statutory tax percentages and GSTIN invoicing details
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                        Statutory Tax
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      {/* GST Rate (%) */}
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                          Standard GST Rate (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={gstRate}
                            onChange={(e) => setGstRate(e.target.value)}
                            placeholder="18"
                            className="w-full pl-4 pr-9 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-brand-500 transition-all"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            %
                          </span>
                        </div>
                      </div>

                      {/* Tax Calculation Mode */}
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                          GST Calculation Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setGstCalculationType("exclusive")}
                            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer font-bold ${
                              gstCalculationType === "exclusive"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            Exclusive (Added)
                          </button>
                          <button
                            type="button"
                            onClick={() => setGstCalculationType("inclusive")}
                            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer font-bold ${
                              gstCalculationType === "inclusive"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            Inclusive (Embedded)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tax Rate Presets */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
                        Common Tax Slabs:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { rate: 0, label: "0% (Exempt)" },
                          { rate: 5, label: "5% (Reduced)" },
                          { rate: 12, label: "12% (Medium)" },
                          { rate: 18, label: "18% (Standard Services)" },
                          { rate: 28, label: "28% (Luxury)" },
                        ].map((slab) => {
                          const isSelected = Number(gstRate) === slab.rate;
                          return (
                            <button
                              key={slab.rate}
                              type="button"
                              onClick={() => setGstRate(slab.rate)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-bold"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {slab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Additional Tax Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Company GSTIN Number
                        </label>
                        <input
                          type="text"
                          value={gstinNumber}
                          onChange={(e) => setGstinNumber(e.target.value)}
                          placeholder="09AAACH1234F1Z5"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase text-xs outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          SAC Code (Services Accounting Code)
                        </label>
                        <input
                          type="text"
                          value={sacCode}
                          onChange={(e) => setSacCode(e.target.value)}
                          placeholder="998714"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (1 Col): Interactive Live Simulator & Audit Details */}
                <div className="space-y-6">
                  {/* Live Invoice Breakdown Card */}
                  <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-5 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-extrabold text-white text-sm">
                          Live Bill Simulator
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                        REALTIME PREVIEW
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Test how platform fee and GST will be itemized on customer checkout screens & tax invoices.
                    </p>

                    {/* Interactive Sample Amount Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Sample Package Price (₹)
                      </label>
                      <input
                        type="number"
                        value={sampleAmount}
                        onChange={(e) => setSampleAmount(e.target.value)}
                        placeholder="500"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Breakdown List */}
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Base Package Price</span>
                        <span className="font-mono font-semibold">₹{basePrice.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1">
                          <span>Platform Fee</span>
                          <span className="text-[10px] text-brand-400 font-mono">(₹{feeVal})</span>
                        </span>
                        <span className="font-mono font-semibold">+₹{feeVal.toFixed(2)}</span>
                      </div>

                      <div className="border-t border-slate-700 pt-2 flex items-center justify-between text-slate-200 font-bold">
                        <span>Subtotal (Taxable Value)</span>
                        <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>CGST ({(gstVal / 2).toFixed(1)}%)</span>
                          <span className="font-mono">₹{cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>SGST ({(gstVal / 2).toFixed(1)}%)</span>
                          <span className="font-mono">₹{sgst.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-700 pt-2.5 flex items-center justify-between text-emerald-400 font-extrabold text-sm">
                        <span>Total Customer Bill</span>
                        <span className="font-mono text-base">₹{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Mode: {gstCalculationType.toUpperCase()} GST calculation</span>
                    </div>
                  </div>

                  {/* Audit Trail Metadata Card */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                      Rule Audit Information
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                        <UserCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Last Modified By</div>
                          <div className="text-[11px]">
                            {updatedBy ? `${updatedBy.name || "Admin"} (${updatedBy.email || ""})` : "System Default"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Last Updated Timestamp</div>
                          <div className="text-[11px] font-mono">
                            {updatedAt ? new Date(updatedAt).toLocaleString("en-IN") : "Never modified"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: GENERAL SETTINGS */}
      {activeTab === "general" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            General Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Application Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Service Area Radius Limit
              </label>
              <input
                type="text"
                value={assignmentRadius}
                onChange={(e) => setAssignmentRadius(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Platform Commission Rate
              </label>
              <input
                type="text"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Cancellation Fee Policy
              </label>
              <input
                type="text"
                value={cancellationFee}
                onChange={(e) => setCancellationFee(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Support Phone
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Support Email
              </label>
              <input
                type="text"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            Notification Rules
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    WhatsApp Customer Booking Receipts
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Send WhatsApp receipt upon booking creation
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={whatsappConfirmations}
                onChange={(e) => setWhatsappConfirmations(e.target.checked)}
                className="w-5 h-5 accent-brand-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Job Closure SMS OTP Verification
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Require customer 4-digit OTP to complete jobs
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={otpNotifications}
                onChange={(e) => setOtpNotifications(e.target.checked)}
                className="w-5 h-5 accent-brand-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Partner Job Push Alerts
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Notify technicians when a new order is assigned
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={assignmentAlerts}
                onChange={(e) => setAssignmentAlerts(e.target.checked)}
                className="w-5 h-5 accent-brand-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Email Tax Invoice Receipts
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Email GST invoices to customers automatically
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailReceipts}
                onChange={(e) => setEmailReceipts(e.target.checked)}
                className="w-5 h-5 accent-brand-600 rounded"
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: DATA EXPORT */}
      {activeTab === "data" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            Data Export & Backups
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() =>
                setToast({ type: "success", message: "Exporting Bookings CSV..." })
              }
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left hover:border-brand-500 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-6 h-6 text-brand-600 mb-2" />
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                Export Bookings Log (CSV)
              </div>
              <div className="text-[11px] text-slate-500">Download complete order history</div>
            </button>

            <button
              type="button"
              onClick={() =>
                setToast({ type: "success", message: "Exporting Partner Directory CSV..." })
              }
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left hover:border-purple-500 transition-all cursor-pointer"
            >
              <Database className="w-6 h-6 text-purple-600 mb-2" />
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                Export Partner Directory (CSV)
              </div>
              <div className="text-[11px] text-slate-500">
                Download technician partner directory
              </div>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === "security" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            Security Status
          </h3>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
            <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>RBAC & Security Policy Active</span>
            </div>
            <p className="text-emerald-700 dark:text-emerald-400">
              All administrative actions are encrypted with AES-256 and logged to audit trails.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
