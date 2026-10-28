"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { initialBookings, initialCustomers, Booking, Customer } from "@/lib/mockData";
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Wallet,
  CreditCard,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { CustomerSearchPicker } from "@/components/CustomerSearchPicker";
import { getAdminInvoicePdfBlobApi } from "@/lib/api";

export default function BillingPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Unpaid" | "Refunded" | "Cancelled">("All");

  // Drawer & Modal States
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Booking | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Booking | null>(null);

  // Invoice Form States (For New & Edit)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invCustomerName, setInvCustomerName] = useState("");
  const [invCustomerPhone, setInvCustomerPhone] = useState("");
  const [invCustomerEmail, setInvCustomerEmail] = useState("");
  const [invAddress, setInvAddress] = useState("");
  const [invType, setInvType] = useState<"B2C" | "B2B">("B2C");
  const [invGstin, setInvGstin] = useState("");
  const [invServiceName, setInvServiceName] = useState("AC Master Servicing");
  const [invCategory, setInvCategory] = useState("AC Servicing & Repair");
  const [invBasePrice, setInvBasePrice] = useState("1499");
  const [invConvenienceFee, setInvConvenienceFee] = useState("49");

  // Filtered Bookings for Table
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "Paid") return b.status === "Completed" || b.status === "Confirmed" || b.status === "In Progress" || b.status === "Assigned" || b.status === "Partner Accepted";
    if (statusFilter === "Unpaid") return b.status === "Pending" || b.status === "Draft" || b.status === "Waiting For Assignment";
    if (statusFilter === "Refunded") return b.status === "Refunded";
    if (statusFilter === "Cancelled") return b.status === "Cancelled" || b.status === "Rejected";
    return true;
  });

  // Handler for selecting customer via CustomerSearchPicker
  const handleSelectCustomerForInvoice = (c: Customer, isNew?: boolean) => {
    if (isNew) {
      setCustomers([c, ...customers]);
    }
    setSelectedCustomer(c);
    setInvCustomerName(c.name);
    setInvCustomerPhone(c.phone);
    setInvCustomerEmail(c.email || "");
    setInvAddress(c.address || `${c.locality}, Varanasi`);
  };

  // Open Edit Invoice Drawer
  const handleOpenEdit = (b: Booking) => {
    setEditInvoice(b);
    setInvCustomerName(b.customerName);
    setInvCustomerPhone(b.customerPhone);
    setInvCustomerEmail(b.customerEmail || "");
    setInvAddress(b.address || "Sigra Colony, Varanasi");
    setInvType(b.invoiceType);
    setInvGstin(b.customerGstin || "");
    setInvServiceName(b.serviceName || b.serviceTitle);
    setInvCategory(b.category);
    setInvBasePrice(b.basePrice.toString());
    setInvConvenienceFee(b.convenienceFee.toString());
  };

  // Delete Invoice Handler
  const handleConfirmDelete = () => {
    if (!deleteInvoice) return;
    setBookings(bookings.filter((b) => b.id !== deleteInvoice.id));
    setDeleteInvoice(null);
  };

  const formatInvoiceNumber = (id: string) => {
    if (!id) return "INV-2026-001";
    const cleanId = id.replace(/^(INV-)?(bk-)?/gi, "");
    if (cleanId.length > 5 && !isNaN(Number(cleanId))) {
      return `INV-${cleanId.slice(-5)}`;
    }
    return `INV-${cleanId.toUpperCase()}`;
  };

  // Columns Matching Standardized Page Design Across Helpmate Admin
  const columns: Column<Booking>[] = [
    {
      key: "id",
      header: "Invoice Ref & Type",
      accessor: (row) => (
        <div className="flex flex-col">
          <Link
            href={`/billing/${row.id}`}
            className="font-mono font-extrabold text-brand-600 text-xs hover:underline flex items-center gap-1"
          >
            <Receipt className="w-3.5 h-3.5" /> {formatInvoiceNumber(row.id)}
          </Link>
          <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {row.invoiceType} Tax Invoice
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "customerName",
      header: "Billed Customer & Contact",
      accessor: (row) => (
        <div className="flex flex-col text-[11px]">
          <span className="font-bold text-slate-900 dark:text-white">{row.customerName}</span>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Phone className="w-2.5 h-2.5 text-brand-600" /> {row.customerPhone}
          </span>
          {row.customerGstin ? (
            <span className="font-mono text-[9px] text-brand-600 font-bold mt-0.5">
              GSTIN: {row.customerGstin}
            </span>
          ) : (
            <span className="text-[9px] text-slate-400">B2C Retail Customer</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "serviceTitle",
      header: "Service & Locality",
      accessor: (row) => (
        <div className="flex flex-col max-w-xs text-[11px]">
          <span className="font-bold text-slate-900 dark:text-white truncate">
            {row.serviceName || row.serviceTitle}
          </span>
          <span className="text-[10px] text-brand-600 font-semibold flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-brand-600 shrink-0" /> {row.locality}, Varanasi
          </span>
        </div>
      ),
    },
    {
      key: "basePrice",
      header: "Base + Fee",
      accessor: (row) => (
        <div className="flex flex-col text-xs font-semibold">
          <span className="text-slate-900 dark:text-white font-bold">₹{row.basePrice}</span>
          <span className="text-[10px] text-slate-500">+ ₹{row.convenienceFee} Fee</span>
        </div>
      ),
    },
    {
      key: "cgst",
      header: "CGST (9%) + SGST (9%)",
      accessor: (row) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold">
          ₹{row.cgst} + ₹{row.sgst}
        </span>
      ),
    },
    {
      key: "status",
      header: "Payment Status",
      accessor: (row) => {
        let badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200";
        let statusText = "Paid";
        let IconComponent = CheckCircle2;

        if (row.status === "Refunded") {
          badgeClass = "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200";
          statusText = "Refunded";
          IconComponent = RotateCcw;
        } else if (row.status === "Cancelled" || row.status === "Rejected") {
          badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200";
          statusText = "Not Paid";
          IconComponent = X;
        } else if (row.status === "Pending" || row.status === "Draft" || row.status === "Waiting For Assignment") {
          badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200";
          statusText = "Pending";
          IconComponent = Clock;
        }

        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit border ${badgeClass}`}>
            <IconComponent className="w-3 h-3 shrink-0" />
            <span>{statusText}</span>
          </span>
        );
      },
    },
    {
      key: "totalAmount",
      header: "Gross Total (₹)",
      accessor: (row) => (
        <span className="font-black text-slate-900 dark:text-white text-sm">₹{row.totalAmount}</span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: "View Invoice",
              icon: Eye,
              href: `/billing/${row.id}`,
            },
            {
              label: "Download PDF",
              icon: Download,
              onClick: async () => {
                const blob = await getAdminInvoicePdfBlobApi(row.id);
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${formatInvoiceNumber(row.id)}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } else {
                  window.open(`/billing/${row.id}`, "_self");
                }
              },
            },
            {
              label: "Edit",
              icon: Edit,
              onClick: () => handleOpenEdit(row),
            },
            {
              label: "Print",
              icon: Printer,
              onClick: () => window.print(),
            },
            {
              label: "Delete",
              icon: Trash2,
              onClick: () => setDeleteInvoice(row),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  // Quick Executive Metric Calculations
  const totalBilledRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalCgst = bookings.reduce((sum, b) => sum + (b.cgst || 0), 0);
  const totalSgst = bookings.reduce((sum, b) => sum + (b.sgst || 0), 0);
  const totalGstCollected = totalCgst + totalSgst;

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            <span>Billing & GST</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedCustomer(null);
            setInvCustomerName("");
            setInvCustomerPhone("");
            setInvCustomerEmail("");
            setIsAddInvoiceOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New GST Invoice</span>
        </button>
      </div>

      {/* 4 Executive Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Gross Billed Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Billed Revenue
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{(totalBilledRevenue + 482900).toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600 inline" /> Gross revenue processed in Varanasi
          </p>
        </div>

        {/* Card 2: Paid Invoices Status */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Paid Invoices Ratio
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800 shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              184 / 210 Paid
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 inline" /> 94.2% Settlement Rate
          </p>
        </div>

        {/* Card 3: Total 18% GST Collected */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total 18% GST Collected
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 border border-purple-200 dark:border-purple-800 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{(totalGstCollected + 73660).toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            CGST 9% (₹36.8k) + SGST 9% (₹36.8k)
          </p>
        </div>

        {/* Card 4: Pending / Overdue Collections */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Collections
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 dark:border-amber-800 shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ₹32,450
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            12 B2B invoices pending 7-day payment
          </p>
        </div>
      </div>

      {/* Status Filter Tabs & Table Container */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "All", label: "All Invoices" },
            { id: "Paid", label: "Paid" },
            { id: "Unpaid", label: "Pending" },
            { id: "Refunded", label: "Refunded" },
            { id: "Cancelled", label: "Not Paid" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filteredBookings}
          searchPlaceholder="Search invoice ref, customer, or GSTIN..."
        />
      </div>

      {/* 1. SLIDE-OVER GENERATE NEW GST INVOICE DRAWER */}
      {isAddInvoiceOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200 dark:border-brand-800 shadow-sm">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Generate New GST Tax Invoice
                    </h3>
                    <p className="text-xs text-slate-500">
                      Search customer by Name / Phone, or Add New Customer on the fly
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!invCustomerName.trim()) return;

                  const base = parseFloat(invBasePrice) || 0;
                  const fee = parseFloat(invConvenienceFee) || 0;
                  const cgstVal = Math.round(base * 0.09);
                  const sgstVal = Math.round(base * 0.09);
                  const grandTotal = base + fee + cgstVal + sgstVal;

                  const newBooking: Booking = {
                    id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
                    customerName: invCustomerName,
                    customerPhone: invCustomerPhone || "+91 99350 12345",
                    serviceTitle: invServiceName,
                    serviceName: invServiceName,
                    city: "Varanasi",
                    pincode: "221002",
                    category: invCategory,
                    locality: "Sigra",
                    date: "Today",
                    timeSlot: "11:00 AM",
                    scheduledDate: "Today",
                    scheduledTime: "11:00 AM",
                    status: "Confirmed",
                    basePrice: base,
                    convenienceFee: fee,
                    cgst: cgstVal,
                    sgst: sgstVal,
                    totalAmount: grandTotal,
                    commissionAmount: Math.round(base * 0.25),
                    partnerEarnings: Math.round(base * 0.75),
                    paymentMethod: "UPI",
                    invoiceType: invType,
                    customerGstin: invType === "B2B" ? invGstin || "09AAACH8819Q1ZM" : undefined,
                    address: invAddress || "Sigra Colony, Varanasi",
                  };

                  setBookings([newBooking, ...bookings]);
                  setIsAddInvoiceOpen(false);
                }}
                className="flex-1 p-6 overflow-y-auto space-y-6"
              >
                {/* SECTION 1: SEARCHABLE CUSTOMER PICKER */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <CustomerSearchPicker
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={handleSelectCustomerForInvoice}
                    label="1. Billed Customer Selection (Search Name or Mobile Phone Number)"
                  />
                </div>

                {/* SECTION 2: INVOICE TYPE & B2B CORPORATE GSTIN */}
                <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800 pb-2">
                    <span className="font-extrabold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider">
                      2. Invoice Category & Corporate GST Tax Rules
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setInvType("B2C")}
                      className={`py-2 rounded-lg font-extrabold transition-all ${
                        invType === "B2C"
                          ? "bg-brand-500 text-white shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      B2C Retail Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvType("B2B")}
                      className={`py-2 rounded-lg font-extrabold transition-all ${
                        invType === "B2B"
                          ? "bg-brand-500 text-white shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      B2B Corporate Invoice
                    </button>
                  </div>

                  {invType === "B2B" && (
                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Customer Corporate GSTIN Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={invGstin}
                        onChange={(e) => setInvGstin(e.target.value)}
                        placeholder="09AAACH8819Q1ZM"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold uppercase text-brand-600 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* SECTION 3: SERVICE CATALOG & PRICING ENGINE */}
                <div className="p-5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                    <span className="font-extrabold text-purple-900 dark:text-purple-300 text-xs uppercase tracking-wider">
                      3. Service Rate Card & Price Calculation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Service Name *
                      </label>
                      <select
                        value={invServiceName}
                        onChange={(e) => setInvServiceName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                      >
                        <option value="AC Master Servicing">AC Master Servicing</option>
                        <option value="AC Jet Pump Deep Clean">AC Jet Pump Deep Clean</option>
                        <option value="Deep House Sanitation & Cleaning">Deep House Sanitation & Cleaning</option>
                        <option value="Full Home Electrical Safety Audit">Full Home Electrical Safety Audit</option>
                        <option value="Plumbing Drain Unclogging">Plumbing Drain Unclogging</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Varanasi Category Zone
                      </label>
                      <input
                        type="text"
                        value={invCategory}
                        onChange={(e) => setInvCategory(e.target.value)}
                        placeholder="AC Servicing & Repair"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Base Service Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={invBasePrice}
                        onChange={(e) => setInvBasePrice(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Convenience Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={invConvenienceFee}
                        onChange={(e) => setInvConvenienceFee(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: LIVE GST TAX LEDGER CARD */}
                <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2 font-semibold text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Base Service Price</span>
                    <span className="font-mono font-bold">₹{parseFloat(invBasePrice) || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Platform Convenience Fee</span>
                    <span className="font-mono font-bold">₹{parseFloat(invConvenienceFee) || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>CGST (9% Split)</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      ₹{Math.round((parseFloat(invBasePrice) || 0) * 0.09)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SGST (9% Split)</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      ₹{Math.round((parseFloat(invBasePrice) || 0) * 0.09)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-black pt-2 border-t border-amber-200 dark:border-amber-800 text-sm">
                    <span>Gross Invoice Grand Total</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      ₹
                      {(parseFloat(invBasePrice) || 0) +
                        (parseFloat(invConvenienceFee) || 0) +
                        Math.round((parseFloat(invBasePrice) || 0) * 0.18)}
                    </span>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddInvoiceOpen(false)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Generate GST Invoice</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* 2. SLIDE-OVER EDIT INVOICE DRAWER */}
      {editInvoice && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 dark:border-amber-800 shadow-sm">
                    <Edit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Edit Tax Invoice INV-{editInvoice.id}
                    </h3>
                    <p className="text-xs text-slate-500">Update GST rate, Customer info, or Base price</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditInvoice(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();

                  const base = parseFloat(invBasePrice) || 0;
                  const fee = parseFloat(invConvenienceFee) || 0;
                  const cgstVal = Math.round(base * 0.09);
                  const sgstVal = Math.round(base * 0.09);
                  const grandTotal = base + fee + cgstVal + sgstVal;

                  setBookings(
                    bookings.map((b) =>
                      b.id === editInvoice.id
                        ? {
                            ...b,
                            customerName: invCustomerName,
                            customerPhone: invCustomerPhone,
                            customerEmail: invCustomerEmail,
                            serviceTitle: invServiceName,
                            serviceName: invServiceName,
                            basePrice: base,
                            convenienceFee: fee,
                            cgst: cgstVal,
                            sgst: sgstVal,
                            totalAmount: grandTotal,
                            invoiceType: invType,
                            customerGstin: invType === "B2B" ? invGstin || "09AAACH8819Q1ZM" : undefined,
                          }
                        : b
                    )
                  );
                  setEditInvoice(null);
                }}
                className="flex-1 p-6 overflow-y-auto space-y-4 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Billed Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={invCustomerName}
                    onChange={(e) => setInvCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Customer Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={invCustomerPhone}
                      onChange={(e) => setInvCustomerPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Invoice Type
                    </label>
                    <select
                      value={invType}
                      onChange={(e) => setInvType(e.target.value as "B2C" | "B2B")}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                    >
                      <option value="B2C">B2C Retail Invoice</option>
                      <option value="B2B">B2B Corporate Invoice</option>
                    </select>
                  </div>
                </div>

                {invType === "B2B" && (
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      value={invGstin}
                      onChange={(e) => setInvGstin(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-brand-600 outline-none uppercase"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={invServiceName}
                    onChange={(e) => setInvServiceName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={invBasePrice}
                      onChange={(e) => setInvBasePrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Convenience Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={invConvenienceFee}
                      onChange={(e) => setInvConvenienceFee(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditInvoice(null)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* 3. DELETE INVOICE POPUP MODAL */}
      {deleteInvoice && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Delete Invoice Ref INV-{deleteInvoice.id}?
                  </h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  Customer: {deleteInvoice.customerName}
                </div>
                <div className="text-slate-500 font-mono">
                  Total Billed Amount: ₹{deleteInvoice.totalAmount} ({deleteInvoice.invoiceType} Tax Invoice)
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteInvoice(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lux"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
