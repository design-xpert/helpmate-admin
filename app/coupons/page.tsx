"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { initialCoupons, CouponItem } from "@/lib/mockData";
import {
  Tag,
  Plus,
  CheckCircle2,
  Percent,
  CreditCard,
  Building2,
  Gift,
  Sparkles,
  Calendar,
  Layers,
  Wrench,
  Clock,
  Trash2,
  Edit2,
  X,
  Copy,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { CustomSelect } from "@/components/CustomSelect";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);

  // Drawer / Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Form States
  const [code, setCode] = useState("VARANASI200");
  const [discountType, setDiscountType] = useState<
    "Fixed" | "Percentage" | "Bank Offer" | "First Booking"
  >("Fixed");
  const [discountValue, setDiscountValue] = useState("200");
  const [minOrderValue, setMinOrderValue] = useState("599");
  const [maxDiscountCap, setMaxDiscountCap] = useState("300");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [targetCategory, setTargetCategory] = useState("All Categories");
  const [description, setDescription] = useState("Flat ₹200 Instant Discount on Varanasi Services");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [status, setStatus] = useState<"Active" | "Expired" | "Disabled">("Active");

  // Helper to open Add Drawer
  const handleOpenAddModal = () => {
    setEditingCoupon(null);
    setCode("VARANASI200");
    setDiscountType("Fixed");
    setDiscountValue("200");
    setMinOrderValue("599");
    setMaxDiscountCap("300");
    setBankName("HDFC Bank");
    setTargetCategory("All Categories");
    setDescription("Flat ₹200 Instant Discount on Varanasi Services");
    setExpiryDate("2026-12-31");
    setStatus("Active");
    setIsAddOpen(true);
  };

  // Helper to open Edit Drawer
  const handleOpenEditModal = (coup: CouponItem) => {
    setEditingCoupon(coup);
    setCode(coup.code);
    setDiscountType(coup.discountType);
    setDiscountValue(coup.discountValue.toString());
    setMinOrderValue(coup.minOrderValue.toString());
    setMaxDiscountCap(coup.maxDiscountCap ? coup.maxDiscountCap.toString() : "300");
    setBankName(coup.bankName || "HDFC Bank");
    setTargetCategory("All Categories");
    setDescription(coup.description || "");
    setExpiryDate(coup.expiryDate || "2026-12-31");
    setStatus(coup.status);
    setIsAddOpen(true);
  };

  // Quick Code Generator
  const handleGenerateCode = () => {
    const prefixes = ["HELPMATE", "VARANASI", "KASHI", "FESTIVE", "CROWN", "VIP"];
    const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = [100, 150, 200, 250, 300, 500][Math.floor(Math.random() * 6)];
    setCode(`${randPrefix}${randNum}`);
  };

  // Delete Coupon
  const handleDeleteCoupon = (id: string) => {
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const cleanCode = code.trim().toUpperCase();

    if (editingCoupon) {
      setCoupons(
        coupons.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                code: cleanCode,
                discountType,
                discountValue: parseFloat(discountValue) || 100,
                minOrderValue: parseFloat(minOrderValue) || 499,
                maxDiscountCap:
                  discountType === "Percentage" || discountType === "Bank Offer"
                    ? parseFloat(maxDiscountCap)
                    : undefined,
                bankName: discountType === "Bank Offer" ? bankName : undefined,
                description:
                  description || `${discountType} coupon code ${cleanCode}`,
                expiryDate,
                status,
              }
            : c
        )
      );
    } else {
      const newItem: CouponItem = {
        id: `cpn-${Date.now()}`,
        code: cleanCode,
        discountType,
        discountValue: parseFloat(discountValue) || 100,
        minOrderValue: parseFloat(minOrderValue) || 499,
        maxDiscountCap:
          discountType === "Percentage" || discountType === "Bank Offer"
            ? parseFloat(maxDiscountCap)
            : undefined,
        bankName: discountType === "Bank Offer" ? bankName : undefined,
        description:
          description || `${discountType} coupon code ${cleanCode}`,
        usageCount: 0,
        expiryDate: expiryDate || "31 Dec 2026",
        status: "Active",
      };

      setCoupons([newItem, ...coupons]);
    }

    setIsAddOpen(false);
  };

  const columns: Column<CouponItem>[] = [
    {
      key: "code",
      header: "Coupon Code & Issuer",
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-brand-600 dark:text-brand-400 font-mono text-xs tracking-wider">
              {row.code}
            </span>
            {row.bankName ? (
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> {row.bankName}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Universal Helpmate Voucher</span>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "discountType",
      header: "Offer Type",
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold ${
            row.discountType === "Bank Offer"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              : row.discountType === "First Booking"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
          }`}
        >
          {row.discountType}
        </span>
      ),
      sortable: true,
    },
    {
      key: "discountValue",
      header: "Discount Savings",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 dark:text-white text-sm">
            {row.discountType === "Percentage" ? `${row.discountValue}% OFF` : `₹${row.discountValue} OFF`}
          </span>
          {row.maxDiscountCap && (
            <span className="text-[10px] text-slate-400 font-medium">Cap: ₹{row.maxDiscountCap}</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "minOrderValue",
      header: "Min Order Value",
      accessor: (row) => (
        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
          ₹{row.minOrderValue.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "usageCount",
      header: "Total Redemptions",
      accessor: (row) => (
        <span className="font-extrabold text-brand-600 dark:text-brand-400">
          {(row.usageCount || 0).toLocaleString()} uses
        </span>
      ),
      sortable: true,
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      accessor: (row) => (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" /> {row.expiryDate}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            row.status === "Active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200"
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
              label: "Edit",
              icon: Edit2,
              onClick: () => handleOpenEditModal(row),
            },
            {
              label: "Delete",
              icon: Trash2,
              onClick: () => handleDeleteCoupon(row.id),
              danger: true,
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-600" />
            <span>Coupons</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Coupon</span>
        </button>
      </div>

      {/* 4 Executive KPI Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Campaigns</span>
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200 dark:border-brand-800 shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {coupons.filter((c) => c.status === "Active").length} Live Vouchers
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Bank Partnerships</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 border border-purple-200 dark:border-purple-800 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {coupons.filter((c) => c.discountType === "Bank Offer").length} Active Offers
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Redemptions</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0).toLocaleString()} Uses
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Customer Savings</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800 shadow-xs">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            ₹165 / Order
          </span>
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={coupons}
        searchPlaceholder="Search coupon code or bank offer..."
      />

      {/* PREMIUM COUPON CREATOR & EDITOR DRAWER */}
      {isAddOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
            <div className="absolute inset-0" onClick={() => setIsAddOpen(false)} />
            <form
              onSubmit={handleSaveCoupon}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs"
            >
              <div className="space-y-5 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {editingCoupon ? "Edit Coupon" : "Add Coupon"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configure discount rates, min orders, and bank partnerships
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 🎨 LIVE DYNAMIC TICKET VOUCHER PREVIEW CARD */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800 text-white shadow-lg space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-200 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      ⚡ Live Voucher Preview
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Helpmate Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="font-mono text-xl font-black tracking-widest uppercase text-yellow-300">
                        {code || "YOURCODE"}
                      </div>
                      <p className="text-[11px] text-brand-100 mt-0.5 max-w-xs line-clamp-1">
                        {description || `Save big on your next Helpmate booking`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-white">
                        {discountType === "Percentage" ? `${discountValue || "10"}%` : `₹${discountValue || "100"}`}
                      </div>
                      <span className="text-[9px] font-bold text-brand-200 uppercase">OFF</span>
                    </div>
                  </div>

                  <div className="border-t border-white/20 pt-2 flex items-center justify-between text-[10px] text-brand-100 font-semibold">
                    <span>Min. Order: ₹{minOrderValue || "0"}</span>
                    {discountType === "Bank Offer" && <span>Bank: {bankName}</span>}
                    <span>Expires: {expiryDate}</span>
                  </div>
                </div>

                {/* 1. COUPON CODE INPUT & AUTO-GENERATE */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Coupon Code *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="text-brand-600 dark:text-brand-400 font-bold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" /> Auto-Generate Code
                      </button>
                    </div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. VARANASI200"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-sm uppercase tracking-wider outline-none focus:border-brand-500"
                      required
                    />
                  </div>

                  {/* Offer Type CustomSelect */}
                  <CustomSelect
                    label="Offer Category Type *"
                    value={discountType}
                    onChange={(val) => setDiscountType(val as any)}
                    options={[
                      { value: "Fixed", label: "Flat Cash Discount (Fixed ₹ Off)" },
                      { value: "Bank Offer", label: "Credit Card / Bank Offer (HDFC, ICICI, Axis)" },
                      { value: "Percentage", label: "Percentage Discount (% Off)" },
                      { value: "First Booking", label: "First Booking Special (New Customer)" },
                    ]}
                  />

                  {/* Conditional Bank Name CustomSelect */}
                  {discountType === "Bank Offer" && (
                    <CustomSelect
                      label="Partner Bank *"
                      value={bankName}
                      onChange={(val) => setBankName(val)}
                      options={[
                        { value: "HDFC Bank", label: "HDFC Bank Credit & Debit Cards" },
                        { value: "ICICI Bank", label: "ICICI Bank Cards & NetBanking" },
                        { value: "Axis Bank", label: "Axis Bank Credit Cards" },
                        { value: "SBI Card", label: "SBI Credit Cards" },
                        { value: "Kotak Mahindra", label: "Kotak Mahindra Bank" },
                      ]}
                    />
                  )}
                </div>

                {/* 2. DISCOUNT VALUES & MIN ORDER */}
                <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-extrabold text-slate-900 dark:text-white text-xs block mb-1">
                        Discount Value ({discountType === "Percentage" ? "%" : "₹"}) *
                      </label>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="200"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-sm outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-900 dark:text-white text-xs block mb-1">
                        Min Order Value (₹) *
                      </label>
                      <input
                        type="number"
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(e.target.value)}
                        placeholder="599"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>

                  {(discountType === "Percentage" || discountType === "Bank Offer") && (
                    <div>
                      <label className="font-extrabold text-slate-900 dark:text-white text-xs block mb-1">
                        Max Discount Cap Limit (₹)
                      </label>
                      <input
                        type="number"
                        value={maxDiscountCap}
                        onChange={(e) => setMaxDiscountCap(e.target.value)}
                        placeholder="300"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:border-brand-500"
                      />
                    </div>
                  )}
                </div>

                {/* 3. DESCRIPTION & EXPIRY */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="font-extrabold text-slate-900 dark:text-white text-xs block mb-1">
                      Offer Banner Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Flat ₹200 Instant Discount on Varanasi Services"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-extrabold text-slate-900 dark:text-white text-xs block mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    <CustomSelect
                      label="Offer Status"
                      value={status}
                      onChange={(val) => setStatus(val as any)}
                      options={[
                        { value: "Active", label: "Active & Live" },
                        { value: "Expired", label: "Expired" },
                        { value: "Disabled", label: "Disabled / Paused" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCoupon ? "Edit Coupon" : "Add Coupon"}</span>
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}
    </div>
  );
}
