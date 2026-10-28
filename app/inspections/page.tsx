"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Eye,
  Edit,
  Search,
  ArrowLeft,
  FileText,
  DollarSign,
  Check,
  X,
  Clock,
  User,
  Phone,
  MapPin,
  Sparkles,
  Upload,
  ImageIcon,
  Download,
  AlertTriangle,
  Receipt,
  Briefcase,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { initialBookings, Booking } from "@/lib/mockData";
import { Portal } from "@/components/Portal";

export default function InspectionsPage() {
  const [bookings, setBookings] = useState<Booking[]>(
    initialBookings.filter((b) => b.isInspectionBased || b.updatedInspectionQuote || b.initialInspectionQuote)
  );

  const [selectedInspection, setSelectedInspection] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "customer" | "partner" | "audit">("overview");

  // Filter Tab State
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "approved" | "completed">("all");

  // Validate Quote Modal States
  const [validateModalBooking, setValidateModalBooking] = useState<Booking | null>(null);
  const [materialCost, setMaterialCost] = useState<number>(950);
  const [labourCost, setLabourCost] = useState<number>(500);
  const [technicianRemarks, setTechnicianRemarks] = useState<string>("");

  // OTP Verification Modal States
  const [otpModalBooking, setOtpModalBooking] = useState<Booking | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");

  // Filtered Inspections
  const filteredBookings = bookings.filter((b) => {
    if (filterTab === "pending") return !b.inspectionApprovedByCustomer && b.status !== "Completed";
    if (filterTab === "approved") return b.inspectionApprovedByCustomer && !b.isOtpVerified;
    if (filterTab === "completed") return b.isOtpVerified || b.status === "Completed";
    return true;
  });

  // Action: Open Validate Quote Modal
  const openValidateModal = (booking: Booking) => {
    setValidateModalBooking(booking);
    setMaterialCost(booking.materialCost || 800);
    setLabourCost(booking.labourCost || 450);
    setTechnicianRemarks(booking.inspectionRemarks || "Site diagnosis completed. Copper pipe welding & component repair required.");
  };

  // Action: Save Validated Quote
  const handleSaveValidatedQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateModalBooking) return;

    const totalQuote = Number(materialCost) + Number(labourCost);

    const updated = bookings.map((b) => {
      if (b.id === validateModalBooking.id) {
        return {
          ...b,
          materialCost: Number(materialCost),
          labourCost: Number(labourCost),
          updatedInspectionQuote: totalQuote,
          totalAmount: totalQuote + (b.convenienceFee || 49),
          inspectionRemarks: technicianRemarks,
          inspectionApprovedByCustomer: true, // Auto-mark approved upon admin validation
          status: "In Progress" as const,
        };
      }
      return b;
    });

    setBookings(updated);
    if (selectedInspection && selectedInspection.id === validateModalBooking.id) {
      setSelectedInspection({
        ...selectedInspection,
        materialCost: Number(materialCost),
        labourCost: Number(labourCost),
        updatedInspectionQuote: totalQuote,
        totalAmount: totalQuote + (selectedInspection.convenienceFee || 49),
        inspectionRemarks: technicianRemarks,
        inspectionApprovedByCustomer: true,
        status: "In Progress" as const,
      });
    }
    setValidateModalBooking(null);
  };

  // Action: Verify OTP Code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalBooking) return;

    const correctOtp = otpModalBooking.otpCode || "8821";
    if (enteredOtp.trim() !== correctOtp) {
      setOtpError(`Invalid OTP code entered. Correct OTP for customer is ${correctOtp}.`);
      return;
    }

    const updated = bookings.map((b) => {
      if (b.id === otpModalBooking.id) {
        return {
          ...b,
          isOtpVerified: true,
          status: "Completed" as const,
        };
      }
      return b;
    });

    setBookings(updated);
    if (selectedInspection && selectedInspection.id === otpModalBooking.id) {
      setSelectedInspection({
        ...selectedInspection,
        isOtpVerified: true,
        status: "Completed" as const,
      });
    }

    setOtpModalBooking(null);
    setEnteredOtp("");
    setOtpError("");
  };

  // DataTable Columns
  const columns: Column<Booking>[] = [
    {
      key: "id",
      header: "Inspection Ref ID",
      accessor: (row) => (
        <div className="flex flex-col">
          <button
            onClick={() => setSelectedInspection(row)}
            className="font-mono font-extrabold text-brand-600 dark:text-brand-400 text-xs hover:underline text-left"
          >
            {row.id}
          </button>
          <span className="text-[10px] text-slate-400">{row.date}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "customerName",
      header: "Customer Details",
      accessor: (row) => (
        <div className="flex flex-col text-xs">
          <button
            onClick={() => setSelectedInspection(row)}
            className="font-bold text-slate-900 dark:text-white hover:text-brand-600 text-left transition-colors"
          >
            {row.customerName}
          </button>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Phone className="w-2.5 h-2.5 text-brand-500" /> {row.customerPhone}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-slate-400" /> {row.locality}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "serviceTitle",
      header: "Inspection Service & System",
      accessor: (row) => (
        <div className="flex flex-col max-w-xs text-xs">
          <span className="font-bold text-slate-900 dark:text-white truncate">{row.serviceTitle}</span>
          <span className="text-[10px] text-brand-600 font-semibold">{row.systemType || "Standard Appliance Check"}</span>
        </div>
      ),
    },
    {
      key: "technicianName",
      header: "Assigned Technician",
      accessor: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {row.technicianName || "Unassigned"}
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            On-Site Partner
          </span>
        </div>
      ),
    },
    {
      key: "updatedInspectionQuote",
      header: "Diagnostic Quote (₹)",
      accessor: (row) => (
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              ₹{row.updatedInspectionQuote || row.basePrice}
            </span>
            {row.initialInspectionQuote && (
              <span className="text-[10px] text-slate-400 line-through font-mono">
                ₹{row.initialInspectionQuote}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Mat: ₹{row.materialCost || 0} | Lab: ₹{row.labourCost || 0}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "inspectionApprovedByCustomer",
      header: "Consent Status",
      accessor: (row) => (
        <div>
          {row.inspectionApprovedByCustomer ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1 w-fit border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Customer Approved
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] flex items-center gap-1 w-fit border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Quote Pending Approval
            </span>
          )}
        </div>
      ),
    },
    {
      key: "otpCode",
      header: "OTP Job Closure",
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono font-black text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
            {row.otpCode || "8821"}
          </span>
          {row.isOtpVerified ? (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
            </span>
          ) : (
            <button
              onClick={() => {
                setOtpModalBooking(row);
                setEnteredOtp("");
                setOtpError("");
              }}
              className="text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              Verify OTP
            </button>
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
              label: "View Inspection Details",
              icon: Eye,
              onClick: () => setSelectedInspection(row),
            },
            {
              label: "Validate Diagnostic Quote",
              icon: Wrench,
              onClick: () => openValidateModal(row),
            },
          ]}
        />
      ),
    },
  ];

  // ==========================================
  // 1. IN-PAGE FULL INSPECTION DETAILS VIEW
  // ==========================================
  if (selectedInspection) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Header Navigation & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSelectedInspection(null)}
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors shrink-0"
              title="Return to Inspections Queue"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-brand-600 text-white font-black text-xl flex items-center justify-center shadow-lux shrink-0">
                <Wrench className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white truncate">
                    Inspection Ref: {selectedInspection.id}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                    {selectedInspection.category || "Diagnostic Service"}
                  </span>
                  {selectedInspection.isOtpVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Job Completed & Closed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Work In Progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-2 mt-1 truncate">
                  <span>Service: {selectedInspection.serviceTitle}</span>
                  <span>•</span>
                  <span>System: {selectedInspection.systemType || "Appliance Diagnostic"}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => openValidateModal(selectedInspection)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lux transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Validate & Update Quote</span>
            </button>
            {!selectedInspection.isOtpVerified && (
              <button
                type="button"
                onClick={() => {
                  setOtpModalBooking(selectedInspection);
                  setEnteredOtp("");
                  setOtpError("");
                }}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lux transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Verify OTP Job Closure</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Initial Inspection Base Fee</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{selectedInspection.initialInspectionQuote || selectedInspection.basePrice}
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Standard Site Diagnosis Fee</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Validated Repair Quote</span>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
              ₹{selectedInspection.updatedInspectionQuote || selectedInspection.basePrice}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Mat: ₹{selectedInspection.materialCost || 0} + Lab: ₹{selectedInspection.labourCost || 0}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer Consent Status</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {selectedInspection.inspectionApprovedByCustomer ? "Approved by Customer" : "Pending Customer Approval"}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Quote Verified & Locked
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">OTP Security Closure Code</span>
            <div className="text-xl font-mono font-black text-brand-600 dark:text-brand-400 tracking-wider">
              {selectedInspection.otpCode || "8821"}
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">
              Status: {selectedInspection.isOtpVerified ? "Verified Complete" : "Pending 4-Digit Code"}
            </span>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-brand-500 text-white shadow-lux"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>1. Diagnostic Findings & Quote Break-up</span>
          </button>

          <button
            onClick={() => setActiveTab("customer")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "customer"
                ? "bg-brand-500 text-white shadow-lux"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>2. Customer & Location Details</span>
          </button>

          <button
            onClick={() => setActiveTab("partner")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "partner"
                ? "bg-brand-500 text-white shadow-lux"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>3. On-Site Technician & Execution</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-brand-500 text-white shadow-lux"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>4. Inspection Audit History</span>
          </button>
        </div>

        {/* TAB 1: DIAGNOSTIC REPORT & QUOTE */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Diagnostic Report */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-900 dark:text-white font-extrabold text-sm">
                <FileText className="w-4 h-4 text-brand-600" />
                <span>On-Site Inspection Findings & Diagnosis</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Technician Site Remarks</span>
                  <p className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold leading-relaxed border border-slate-200 dark:border-slate-700">
                    {selectedInspection.inspectionRemarks || "Site diagnosis completed by technician. Hardware replacement & component testing verified clean."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Material & Parts Cost</span>
                    <div className="font-extrabold text-slate-900 dark:text-white text-base">
                      ₹{selectedInspection.materialCost || 800}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Labour & Service Fee</span>
                    <div className="font-extrabold text-slate-900 dark:text-white text-base">
                      ₹{selectedInspection.labourCost || 450}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex justify-between items-center text-sm pt-3">
                  <span className="font-extrabold text-slate-900 dark:text-white">Total Validated Quote</span>
                  <span className="font-black text-brand-600 dark:text-brand-400 text-lg">
                    ₹{selectedInspection.updatedInspectionQuote || selectedInspection.basePrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Photo Attachments & Proofs */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-900 dark:text-white font-extrabold text-sm">
                <ImageIcon className="w-4 h-4 text-brand-600" />
                <span>Inspection Photo Proofs & Attachments</span>
              </div>

              {selectedInspection.inspectionImages && selectedInspection.inspectionImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedInspection.inspectionImages.map((img, idx) => (
                    <div key={idx} className="h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 relative group">
                      {img ? (
                        <Image
                          src={img}
                          alt={`Inspection Proof ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-lux flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Photo
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs italic text-center space-y-2">
                  <Upload className="w-6 h-6 mx-auto text-slate-400" />
                  <p>Standard Site Inspection. Photo attachments uploaded to cloud ledger.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER & LOCATION DETAILS */}
        {activeTab === "customer" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-900 dark:text-white font-extrabold text-sm">
                <User className="w-4 h-4 text-brand-600" />
                <span>Customer Profile</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400 font-bold">Full Name</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{selectedInspection.customerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400 font-bold">Mobile Phone</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Phone className="w-3 h-3 text-brand-600" /> {selectedInspection.customerPhone}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-bold">City Hub</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">Varanasi Operations</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-900 dark:text-white font-extrabold text-sm">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Inspection Delivery Site Address</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400 font-bold">Varanasi Zone Locality</span>
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">{selectedInspection.locality}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Street Address</span>
                  <p className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                    {selectedInspection.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGNED PARTNER & EXECUTION */}
        {activeTab === "partner" && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm max-w-2xl">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-900 dark:text-white font-extrabold text-sm">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <span>Assigned On-Site Technician Partner</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-bold">Technician Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {selectedInspection.technicianName || "Ramesh Yadav"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 font-bold">Technician ID</span>
                <span className="font-mono font-bold text-brand-600">
                  {selectedInspection.technicianId || "tech-101"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold">Job Status</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 font-bold">
                  {selectedInspection.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TIMELINE */}
        {activeTab === "audit" && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm max-w-2xl">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Inspection Activity Audit Trail</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pl-8 text-xs">
              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                <span className="font-bold text-slate-900 dark:text-white block">Technician Site Diagnosis Completed</span>
                <span className="text-slate-400 text-[10px]">Initial Base Fee ₹{selectedInspection.initialInspectionQuote || 199} updated to ₹{selectedInspection.updatedInspectionQuote || selectedInspection.basePrice}</span>
              </div>
              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                <span className="font-bold text-slate-900 dark:text-white block">Customer Approved Quote</span>
                <span className="text-slate-400 text-[10px]">Customer accepted repair estimate & gave consent.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  // ==========================================
  // 2. MAIN DATATABLE INSPECTIONS LIST VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-brand-600" />
            <span>Inspections</span>
          </h1>
        </div>
      </div>

      {/* Filter Tabs Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === "all"
              ? "bg-amber-600 text-white shadow-lux"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          All Inspections ({bookings.length})
        </button>

        <button
          onClick={() => setFilterTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === "pending"
              ? "bg-amber-600 text-white shadow-lux"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          Pending Customer Approval ({bookings.filter((b) => !b.inspectionApprovedByCustomer && b.status !== "Completed").length})
        </button>

        <button
          onClick={() => setFilterTab("approved")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === "approved"
              ? "bg-amber-600 text-white shadow-lux"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          Customer Approved ({bookings.filter((b) => b.inspectionApprovedByCustomer && !b.isOtpVerified).length})
        </button>

        <button
          onClick={() => setFilterTab("completed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterTab === "completed"
              ? "bg-amber-600 text-white shadow-lux"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          Completed Jobs ({bookings.filter((b) => b.isOtpVerified || b.status === "Completed").length})
        </button>
      </div>

      {/* Main DataTable without duplicate headers */}
      <DataTable
        columns={columns}
        data={filteredBookings}
        searchPlaceholder="Search inspection ref ID, customer name or phone..."
      />

      {/* MODAL 1: VALIDATE TECHNICIAN DIAGNOSTIC QUOTE */}
      {validateModalBooking && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <form
              onSubmit={handleSaveValidatedQuote}
              className="bg-white dark:bg-slate-900 ring-1 ring-slate-900/10 dark:ring-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 outline-none"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Admin Price Validation
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    Validate Diagnostic Repair Quote
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ref: <span className="font-bold text-slate-900 dark:text-white">{validateModalBooking.id}</span> • {validateModalBooking.serviceTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValidateModalBooking(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Technician Site Diagnosis Remarks *
                  </label>
                  <textarea
                    rows={3}
                    value={technicianRemarks}
                    onChange={(e) => setTechnicianRemarks(e.target.value)}
                    placeholder="Enter technician site findings, broken components, parts required..."
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Spare Parts / Material Cost (₹) *
                    </label>
                    <input
                      type="number"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Labour & Service Fee (₹) *
                    </label>
                    <input
                      type="number"
                      value={labourCost}
                      onChange={(e) => setLabourCost(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-slate-900 dark:text-white">Calculated Total Repair Quote</span>
                  <span className="font-black text-brand-600 dark:text-brand-400 text-lg">
                    ₹{Number(materialCost) + Number(labourCost)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setValidateModalBooking(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-lux flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validate Quote & Mark Approved</span>
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* MODAL 2: OTP SECURITY JOB CLOSURE */}
      {otpModalBooking && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <form
              onSubmit={handleVerifyOtp}
              className="bg-white dark:bg-slate-900 ring-1 ring-slate-900/10 dark:ring-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 outline-none"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-brand-600">
                  <KeyRound className="w-5 h-5" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Verify 4-Digit OTP Security Code
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpModalBooking(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Enter the 4-digit security code provided by customer <strong>{otpModalBooking.customerName}</strong> to verify job completion.
                </p>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    4-Digit Security OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder={`e.g. ${otpModalBooking.otpCode || "8821"}`}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono font-black text-2xl tracking-widest text-brand-600 outline-none focus:border-brand-500"
                    required
                  />
                </div>

                {otpError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold text-xs flex items-center gap-1.5 border border-red-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOtpModalBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP & Complete Job</span>
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}
    </div>
  );
}
