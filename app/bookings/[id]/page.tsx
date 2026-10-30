"use client";

import React, { useState, use, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Booking, Technician, SelectedAddOnItem } from "@/lib/mockData";
import { mapApiBooking } from "../page";
import { getBookingDetailsApi, getBookingsApi, archiveBookingApi, restoreBookingApi, cancelBookingApi } from "@/lib/api";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Wrench,
  KeyRound,
  Edit2,
  Printer,
  AlertCircle,
  Mail,
  UserPlus,
  Activity,
  FileCheck,
  ExternalLink,
  UserCheck,
  Package,
  Archive,
  ArchiveRestore,
  Ban,
} from "lucide-react";
import { AssignPartnerModal } from "@/components/bookings/AssignPartnerModal";
import { InspectionFlowModal } from "@/components/bookings/InspectionFlowModal";
import { OtpVerificationModal } from "@/components/bookings/OtpVerificationModal";
import { EditBookingModal } from "@/components/bookings/EditBookingModal";
import { RescheduleBookingModal } from "@/components/bookings/RescheduleBookingModal";
import { ArchiveBookingModal } from "@/components/bookings/ArchiveBookingModal";
import { CancelBookingModal } from "@/components/bookings/CancelBookingModal";
import { Portal } from "@/components/Portal";
import { useRbac } from "@/context/RbacContext";

interface StoredBookingDetail {
  raw: any;
  mapped: Booking;
}

const bookingDetailsMemoryStore = new Map<string, StoredBookingDetail>();

function getStoredBookingDetail(id: string): StoredBookingDetail | null {
  if (!id) return null;
  const key = id.toLowerCase().trim();
  const cacheKey = `booking_detail_${key}`;

  if (bookingDetailsMemoryStore.has(cacheKey)) {
    return bookingDetailsMemoryStore.get(cacheKey)!;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.mapped || parsed.raw)) {
          bookingDetailsMemoryStore.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return null;
}

function setStoredBookingDetail(id: string, data: StoredBookingDetail): void {
  if (!id || !data) return;
  const keysToStore = new Set<string>();
  keysToStore.add(id.toLowerCase().trim());
  if (data.raw?._id) keysToStore.add(String(data.raw._id).toLowerCase().trim());
  if (data.raw?.bookingNumber) keysToStore.add(String(data.raw.bookingNumber).toLowerCase().trim());
  if (data.mapped?.id) keysToStore.add(String(data.mapped.id).toLowerCase().trim());
  if (data.mapped?.bookingNumber) keysToStore.add(String(data.mapped.bookingNumber).toLowerCase().trim());

  keysToStore.forEach((k) => {
    const cacheKey = `booking_detail_${k}`;
    bookingDetailsMemoryStore.set(cacheKey, data);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // Ignore quota/private mode errors
      }
    }
  });
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const bookingId = resolvedParams.id;
  const { role } = useRbac();
  const isOfficeAdmin = role === "Office Admin";

  const initialCached = useMemo(() => getStoredBookingDetail(bookingId), [bookingId]);

  const [bookings, setBookings] = useState<Booking[]>(() => (initialCached?.mapped ? [initialCached.mapped] : []));
  const [rawBooking, setRawBooking] = useState<any>(() => initialCached?.raw || null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialCached);

  useEffect(() => {
    let isMounted = true;
    const cached = getStoredBookingDetail(bookingId);
    if (cached && (cached.mapped || cached.raw)) {
      if (isMounted) {
        if (cached.raw) setRawBooking(cached.raw);
        if (cached.mapped) setBookings([cached.mapped]);
        setIsLoading(false);
      }
      return; // DO NOT CALL API WHEN REVISITING SAME DETAIL PAGE
    }

    const fetchBooking = async () => {
      setIsLoading(true);
      try {
        const detailsRes = await getBookingDetailsApi(bookingId);
        const bookingObj =
          detailsRes?.data ||
          detailsRes?.booking ||
          (detailsRes && (detailsRes._id || detailsRes.bookingNumber) ? detailsRes : null);

        if (isMounted && bookingObj) {
          const mapped = mapApiBooking(bookingObj);
          setRawBooking(bookingObj);
          setBookings([mapped]);
          setStoredBookingDetail(bookingId, { raw: bookingObj, mapped });
        } else {
          const listRes = await getBookingsApi();
          if (isMounted && listRes && listRes.success && Array.isArray(listRes.data)) {
            const found = listRes.data.find(
              (b: any) =>
                (b._id && String(b._id).toLowerCase() === bookingId.toLowerCase()) ||
                (b.bookingNumber && String(b.bookingNumber).toLowerCase() === bookingId.toLowerCase())
            );
            if (found) {
              const mapped = mapApiBooking(found);
              setRawBooking(found);
              setBookings([mapped]);
              setStoredBookingDetail(bookingId, { raw: found, mapped });
            } else {
              const mappedList = listRes.data.map(mapApiBooking);
              setBookings(mappedList);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching booking details:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchBooking();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const currentBooking = useMemo(() => {
    if (bookings.length === 0) return null;
    return (
      bookings.find(
        (b) =>
          b.id?.toLowerCase() === bookingId.toLowerCase() ||
          (b.bookingNumber && b.bookingNumber.toLowerCase() === bookingId.toLowerCase())
      ) || bookings[0]
    );
  }, [bookings, bookingId]);

  // Synchronize any updates (e.g. partner assigned, rescheduling, quotes) back into the cache store
  useEffect(() => {
    if (currentBooking) {
      setStoredBookingDetail(bookingId, { raw: rawBooking, mapped: currentBooking });
    }
  }, [currentBooking, rawBooking, bookingId]);

  // Modals
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleArchive = async () => {
    if (!currentBooking) return;
    setIsArchiving(true);
    try {
      const res = await archiveBookingApi(currentBooking.id);
      if (res && res.success) {
        const updated: Booking = {
          ...currentBooking,
          isArchived: true,
          archivedAt: new Date().toISOString(),
        };
        setBookings([updated]);
        setStoredBookingDetail(bookingId, {
          raw: { ...rawBooking, isArchived: true, archivedAt: updated.archivedAt },
          mapped: updated,
        });
        setIsArchiveModalOpen(false);
        setToastMessage({ text: "Booking archived successfully", type: "success" });
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage({ text: res?.message || "Failed to archive booking", type: "error" });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error archiving booking:", err);
      setToastMessage({ text: "Error archiving booking", type: "error" });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async () => {
    if (!currentBooking) return;
    setIsArchiving(true);
    try {
      const res = await restoreBookingApi(currentBooking.id);
      if (res && res.success) {
        const updated: Booking = {
          ...currentBooking,
          isArchived: false,
          archivedAt: undefined,
        };
        setBookings([updated]);
        setStoredBookingDetail(bookingId, {
          raw: { ...rawBooking, isArchived: false, archivedAt: null },
          mapped: updated,
        });
        setToastMessage({ text: "Booking restored successfully", type: "success" });
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage({ text: res?.message || "Failed to restore booking", type: "error" });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error restoring booking:", err);
      setToastMessage({ text: "Error restoring booking", type: "error" });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleConfirmCancel = async (booking: Booking, reason: string) => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const targetId = booking.rawId || booking.id;
      const res = await cancelBookingApi(targetId, reason);
      if (res && res.success) {
        const updated: Booking = {
          ...booking,
          status: "Cancelled",
          notes: reason,
        };
        setBookings([updated]);
        setStoredBookingDetail(bookingId, {
          raw: { ...rawBooking, status: "cancelled", cancellation: { reason, cancelledAt: new Date() } },
          mapped: updated,
        });
        setIsCancelModalOpen(false);
        setToastMessage({ text: "Booking cancelled successfully", type: "success" });
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage({ text: res?.message || "Failed to cancel booking", type: "error" });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setToastMessage({ text: "Error cancelling booking", type: "error" });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReschedule = (
    id: string,
    newDate: string,
    newTimeSlot: string,
    technicianId?: string,
    technicianName?: string
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            date: newDate,
            timeSlot: newTimeSlot,
            technicianId: technicianId || b.technicianId,
            technicianName: technicianName || b.technicianName,
            status: technicianName ? (b.status === "Pending" || b.status === "Waiting For Assignment" ? "Assigned" : b.status) : b.status,
          };
        }
        return b;
      })
    );
  };

  const handlePartnerAssigned = (id: string, tech: Technician | null) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: tech ? (b.status === "Pending" || b.status === "Waiting For Assignment" ? "Assigned" : b.status) : "Pending",
              technicianName: tech ? tech.name : undefined,
              technicianId: tech ? tech.id : undefined,
            }
          : b
      )
    );
  };

  const handleInspectionApproved = (id: string, quote: number, remarks: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              basePrice: quote,
              totalAmount: Math.round(quote * 1.18 + (b.convenienceFee || 0)),
              inspectionRemarks: remarks,
              status: "Customer Approval Pending",
            }
          : b
      )
    );
  };

  const handleJobCompleted = (
    id: string,
    addOns?: SelectedAddOnItem[],
    addOnsBaseTotal?: number,
    addOnsGstTotal?: number,
    addOnsFinalTotal?: number
  ) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              isOtpVerified: true,
              status: "Completed",
              completedAddOns: addOns || b.completedAddOns,
              addOnsBaseTotal: addOnsBaseTotal ?? b.addOnsBaseTotal,
              addOnsGstTotal: addOnsGstTotal ?? b.addOnsGstTotal,
              addOnsFinalTotal: addOnsFinalTotal ?? b.addOnsFinalTotal,
              totalAmount: (b.totalAmount || 0) + (addOnsFinalTotal || 0),
            }
          : b
      )
    );
  };

  const handleBookingUpdated = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const formatInvoiceNumber = (id: string) => {
    if (!id) return "";
    const cleanId = id.replace(/^(INV-)?(bk-)?/gi, "");
    if (cleanId.length > 5 && !isNaN(Number(cleanId))) {
      return `INV-${cleanId.slice(-5)}`;
    }
    return `INV-${cleanId.toUpperCase()}`;
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Helper extracted fields from API data (No hardcoded values)
  const customerName = currentBooking?.customerName || rawBooking?.customer?.name || "";
  const customerPhone = currentBooking?.customerPhone || rawBooking?.customer?.mobile || "";
  const customerEmail = currentBooking?.customerEmail || rawBooking?.customer?.email || "";
  const customerGstin = currentBooking?.customerGstin || rawBooking?.customer?.gstin || "";
  const customerId = currentBooking?.customerId || rawBooking?.customer?.customerId || rawBooking?.customer?._id || "";
  const customerBookingCount = currentBooking?.customerBookingCount ?? rawBooking?.customerBookingCount;

  const scheduledDate = currentBooking?.date || (rawBooking?.schedule?.bookingDate ? new Date(rawBooking.schedule.bookingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");
  const scheduledTimeSlot = currentBooking?.timeSlot || rawBooking?.schedule?.timeSlot || "";

  const locality = currentBooking?.locality || rawBooking?.address?.localityName || "";
  const city = currentBooking?.city || rawBooking?.address?.city || "";
  const pincode = currentBooking?.pincode || rawBooking?.address?.pincode || "";
  const fullAddress = currentBooking?.address || rawBooking?.address?.serviceAddress || "";

  const technicianName = currentBooking?.technicianName || rawBooking?.assignment?.partnerId?.name || rawBooking?.assignment?.partnerName || "";
  const technicianPhone = currentBooking?.technicianPhone || rawBooking?.assignment?.partnerId?.mobile || "";

  const notes = currentBooking?.notes || rawBooking?.notes || "";
  const inspectionRemarks = currentBooking?.inspectionRemarks || rawBooking?.inspectionRemarks || "";
  const otpCode = currentBooking?.otpCode || rawBooking?.customer?.otp || rawBooking?.otp || "";

  const callingPerson = currentBooking?.callingPerson || rawBooking?.callingPerson || "";
  const handledBy = currentBooking?.handledBy || (typeof rawBooking?.createdBy === "object" ? rawBooking?.createdBy?.name : (typeof rawBooking?.assignment?.assignedBy === "object" ? rawBooking?.assignment?.assignedBy?.name : "")) || "";
  const callingDate = currentBooking?.callingDate || (rawBooking?.createdAt ? new Date(rawBooking.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");

  const paymentMethod = currentBooking?.paymentMethod || rawBooking?.billing?.payment?.paymentMethod || "";
  const paymentStatus = currentBooking?.paymentStatus || rawBooking?.billing?.payment?.paymentStatus || "";
  const paymentTransactionId = rawBooking?.billing?.payment?.paymentId || rawBooking?.billing?.payment?.transactionId || "";

  // Financial Calculations directly from API values
  const base = currentBooking?.basePrice !== undefined ? currentBooking.basePrice : (rawBooking?.billing?.sellingPrice ?? rawBooking?.billing?.mrp ?? 0);
  const convenienceFee = currentBooking?.convenienceFee !== undefined ? currentBooking.convenienceFee : (rawBooking?.billing?.platformFee ?? 0);
  const discount = currentBooking?.discountAmount || rawBooking?.billing?.discount || 0;
  const gst = currentBooking?.gst !== undefined ? currentBooking.gst : (rawBooking?.billing?.gst ?? 0);
  const finalTotal = currentBooking?.totalAmount !== undefined ? currentBooking.totalAmount : (rawBooking?.billing?.totalAmount ?? (base + convenienceFee + gst - discount));

  const rawPaymentStatus = (paymentStatus || "").toLowerCase().trim();
  const isPaid = rawPaymentStatus === "paid" || rawPaymentStatus === "success" || currentBooking?.status === "Completed";
  const paymentStatusLabel = isPaid
    ? "Paid"
    : rawPaymentStatus === "pending"
      ? "Payment Pending"
      : rawPaymentStatus
        ? rawPaymentStatus.charAt(0).toUpperCase() + rawPaymentStatus.slice(1)
        : "Payment Pending";

  // Customer order badges
  const orderNumber = customerBookingCount;
  const isNewCustomer = orderNumber === 1;
  const orderOrdinalText = orderNumber && orderNumber > 0 ? `${getOrdinalSuffix(orderNumber)} Order` : "";

  interface DisplayAddonItem {
    id?: string;
    name?: string;
    price?: number;
    gstAmount?: number;
    totalPrice?: number;
    isUnlisted?: boolean;
  }

  // Completed or selected addons from API
  const displayAddons = useMemo<DisplayAddonItem[]>(() => {
    if (currentBooking?.completedAddOns && currentBooking.completedAddOns.length > 0) {
      return currentBooking.completedAddOns;
    }
    const itemAddons = (rawBooking?.items || []).flatMap((it: any) => it.selectedAddons || []);
    if (itemAddons.length > 0) {
      return itemAddons.map((a: any, idx: number) => ({
        id: a._id || a.addonId || String(idx),
        name: a.name || "Add-on Item",
        price: a.unitPrice || a.price || 0,
        gstAmount: 0,
        totalPrice: a.totalPrice || ((a.unitPrice || a.price || 0) * (a.quantity || 1)) || 0,
        isUnlisted: false,
      }));
    }
    return [];
  }, [currentBooking, rawBooking]);

  // Section visibility checks: If API has no data for a section, do not show it
  const hasInspectionData = Boolean(
    inspectionRemarks ||
    currentBooking?.initialInspectionQuote ||
    (currentBooking?.inspectionImages && currentBooking.inspectionImages.length > 0)
  );

  const hasAuditData = Boolean(callingPerson || handledBy || callingDate || otpCode);

  if (isLoading) {
    return (
      <div className="w-full space-y-6 pb-12 animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6"></div>
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6"></div>
          <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6"></div>
        </div>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="w-full space-y-6 pb-12">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link
            href="/bookings"
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600" />
            <span>Back</span>
          </Link>
        </div>
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Booking Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The booking with ID &quot;{bookingId}&quot; could not be found or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300 print:p-0 print:m-0">
      {/* Embedded Strict Single-Page Print CSS for Official Tax Invoice */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body > * {
            display: none !important;
          }
          body > #printable-tax-invoice-portal {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          #printable-tax-invoice-portal * {
            visibility: visible !important;
          }
        }
      `}</style>

      {isOfficeAdmin ? (
        <div className="space-y-6 max-w-4xl mx-auto px-1 sm:px-0">
          {/* Clean Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Link
              href={currentBooking.category ? `/bookings?category=${encodeURIComponent(currentBooking.category)}` : "/bookings"}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-brand-600" />
              <span>Back</span>
            </Link>

            <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-xl border border-brand-200 dark:border-brand-800 w-fit break-all">
              BOOKING NO: {currentBooking.bookingNumber || currentBooking.id}
            </span>
          </div>

          {/* Office Admin Minimal Booking Status Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Office Admin Booking Overview</span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 break-words">{currentBooking.serviceTitle}</h2>
              </div>
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-xs shrink-0 w-fit ${
                  currentBooking.status === "Completed"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                    : currentBooking.status === "In Progress" || currentBooking.status === "Assigned"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current inline-block animate-pulse" />
                <span>Status: {currentBooking.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block break-words">{customerName}</span>
                {customerPhone && <span className="text-slate-500 font-medium font-mono block break-all">{customerPhone}</span>}
              </div>

              {(scheduledDate || scheduledTimeSlot) && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled Working Date & Time</span>
                  {scheduledDate && <span className="font-extrabold text-slate-900 dark:text-white text-sm block">{scheduledDate}</span>}
                  {scheduledTimeSlot && <span className="text-slate-500 font-medium block">{scheduledTimeSlot}</span>}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Service Partner</span>
                {technicianName ? (
                  <div>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm block flex items-center gap-1.5 break-words">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      {technicianName}
                    </span>
                    {technicianPhone && (
                      <span className="text-slate-500 font-mono font-bold mt-0.5 block break-all">
                        {technicianPhone}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-200 inline-block mt-1">
                    Unassigned
                  </span>
                )}
              </div>

              {(fullAddress || locality) && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Location Address</span>
                  {fullAddress && <span className="font-bold text-slate-900 dark:text-white text-xs block leading-relaxed break-words">{fullAddress}</span>}
                  {locality && <span className="text-slate-500 font-medium block mt-0.5">{locality}{city ? `, ${city}` : ""}</span>}
                </div>
              )}
            </div>

            {/* Visual Booking Lifecycle Progress Tracker */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Current Booking Status Tracking</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 text-[11px] block">1. Booking Placed</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block break-words">
                    {currentBooking.createdBy ? `Created by ${currentBooking.createdBy}` : "Customer Request Confirmed"}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  technicianName
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                }`}>
                  <span className="font-extrabold text-[11px] block">2. Partner Status</span>
                  <span className="text-[10px] block break-words">{technicianName ? `Assigned (${technicianName})` : "Awaiting Partner Assignment"}</span>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  currentBooking.status === "In Progress" || currentBooking.status === "Completed"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500"
                }`}>
                  <span className="font-extrabold text-[11px] block">3. Service Execution</span>
                  <span className="text-[10px] block break-words">{currentBooking.status === "In Progress" ? "In Progress On-Site" : currentBooking.status === "Completed" ? "Service Completed" : "Pending On-Site Visit"}</span>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  currentBooking.status === "Completed"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500"
                }`}>
                  <span className="font-extrabold text-[11px] block">4. Final Settlement</span>
                  <span className="text-[10px] block break-words">{currentBooking.status === "Completed" ? "Completed & Closed" : "Pending Job Completion"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ─── TOP BAR: STRICTLY ONLY ONE PRIMARY BUTTON ─── */}
          <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={currentBooking.category ? `/bookings?category=${encodeURIComponent(currentBooking.category)}` : "/bookings"}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-brand-600" />
                <span>Back</span>
              </Link>

              <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-xl border border-brand-200 dark:border-brand-800 shrink-0">
                BOOKING NO: {currentBooking.bookingNumber || currentBooking.id}
              </span>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                  {currentBooking.serviceTitle}
                </h1>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs shrink-0 ${currentBooking.status === "Completed"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : currentBooking.status === "In Progress" || currentBooking.status === "Assigned"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current inline-block animate-pulse" />
                  <span>{currentBooking.status}</span>
                </span>

                {currentBooking.isArchived && (
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 shadow-xs shrink-0">
                    <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Archived</span>
                  </span>
                )}

                {/* Real Order Count Badge only if present from API */}
                {isNewCustomer ? (
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs flex items-center gap-1.5 shrink-0">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>New Customer • 1st Order</span>
                  </span>
                ) : orderOrdinalText ? (
                  <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1.5 shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{orderOrdinalText}</span>
                  </span>
                ) : null}
              </div>

              {/* Action Buttons: Strictly ONLY ONE PRIMARY BUTTON (Single Main Action), all others Secondary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:flex-wrap items-center gap-2 w-full xl:w-auto">
                {/* Single Primary Action Button */}
                {technicianName ? (
                  <button
                    type="button"
                    onClick={() => setIsAssignOpen(true)}
                    className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Reassign Partner</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAssignOpen(true)}
                    className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Assign Partner</span>
                  </button>
                )}

                {/* Secondary Actions */}
                {currentBooking.status !== "Completed" && (
                  <button
                    type="button"
                    onClick={() => setIsInspectionOpen(true)}
                    className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Wrench className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span>Diagnostic Quote</span>
                  </button>
                )}

                {!currentBooking.isOtpVerified && currentBooking.status !== "Completed" && (
                  <button
                    type="button"
                    onClick={() => setIsOtpOpen(true)}
                    className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <KeyRound className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span>Verify Job OTP</span>
                  </button>
                )}

                {!isOfficeAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Printer className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Print Tax Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRescheduleOpen(true)}
                      className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <CalendarCheck className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span>Reschedule Job</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditOpen(true)}
                      className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Edit2 className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Edit Booking</span>
                    </button>

                    {currentBooking.isArchived ? (
                      <button
                        type="button"
                        onClick={handleRestore}
                        disabled={isArchiving}
                        className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <ArchiveRestore className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{isArchiving ? "Restoring..." : "Restore Booking"}</span>
                      </button>
                    ) : (
                      <>
                        {currentBooking.status !== "Completed" && currentBooking.status !== "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => setIsCancelModalOpen(true)}
                            disabled={isCancelling}
                            className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-700 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                          >
                            <Ban className="w-4 h-4 text-slate-500 hover:text-rose-600 shrink-0" />
                            <span>Cancel Booking</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsArchiveModalOpen(true)}
                          disabled={isArchiving}
                          className="w-full xl:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-700 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Archive className="w-4 h-4 text-slate-500 hover:text-rose-600 shrink-0" />
                          <span>Archive Booking</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ─── ARCHIVE BANNER ─── */}
          {currentBooking.isArchived && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 print:hidden">
              <div className="flex items-center gap-2.5 font-bold">
                <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-black uppercase tracking-wider block text-[10px] text-amber-700 dark:text-amber-400">
                    Archived Booking
                  </span>
                  <span>
                    This booking is currently archived{currentBooking.archivedAt ? ` (${new Date(currentBooking.archivedAt).toLocaleDateString("en-GB")})` : ""}. It is hidden from active operations.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRestore}
                disabled={isArchiving}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
              >
                <ArchiveRestore className="w-4 h-4" />
                <span>{isArchiving ? "Restoring..." : "Restore Booking"}</span>
              </button>
            </div>
          )}

          {/* ─── VISUAL BOOKING LIFECYCLE PROGRESS TRACKER BANNER ─── */}
          {/* <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 sm:gap-4">
              <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Booking Lifecycle Status Track</span>
              </span>
              <span className="text-slate-500 font-semibold text-[11px]">
                {locality ? `${locality} • ` : ""}
                {scheduledDate ? (
                  <>
                    Scheduled: <strong className="text-slate-900 dark:text-white">{scheduledDate}</strong>
                  </>
                ) : null}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs pt-1">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1. Booking Placed</span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium break-words">
                  {currentBooking.createdBy ? `Created by ${currentBooking.createdBy}` : "Customer Request Confirmed"}
                </span>
              </div>

              <div className={`p-3 rounded-2xl border space-y-1 ${technicianName
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                }`}>
                <div className="flex items-center gap-1.5 font-extrabold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>2. Service Partner</span>
                </div>
                <span className="text-[10px] font-medium block break-words">
                  {technicianName ? `Assigned to ${technicianName}` : "Awaiting Partner Match"}
                </span>
              </div>

              <div className={`p-3 rounded-2xl border space-y-1 ${base > 0
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                }`}>
                <div className="flex items-center gap-1.5 font-extrabold text-[11px]">
                  <Wrench className="w-3.5 h-3.5 shrink-0" />
                  <span>3. Inspection & Quote</span>
                </div>
                <span className="text-[10px] font-medium block break-words">
                  {base > 0 ? `Rate: ₹${base} Base Verified` : "Standard Catalog Rate"}
                </span>
              </div>

              <div className={`p-3 rounded-2xl border space-y-1 ${currentBooking.status === "In Progress" || currentBooking.status === "Completed"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                }`}>
                <div className="flex items-center gap-1.5 font-extrabold text-[11px]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>4. Service Execution</span>
                </div>
                <span className="text-[10px] font-medium block break-words">
                  {currentBooking.status === "In Progress" ? "In Progress On-Site" : currentBooking.status === "Completed" ? "Service Completed" : "Pending On-Site Visit"}
                </span>
              </div>

              <div className={`p-3 rounded-2xl border space-y-1 sm:col-span-2 lg:col-span-1 ${currentBooking.isOtpVerified || currentBooking.status === "Completed"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                }`}>
                <div className="flex items-center gap-1.5 font-extrabold text-[11px]">
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span>5. OTP & Settled</span>
                </div>
                <span className="text-[10px] font-medium block break-words">
                  {currentBooking.isOtpVerified || currentBooking.status === "Completed"
                    ? "Job Closed & Settled"
                    : otpCode
                      ? `Security Code: ${otpCode}`
                      : "Pending OTP Verification"}
                </span>
              </div>
            </div>
          </div> */}

          {/* ─── 2-COLUMN RECORD DETAIL LAYOUT ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 Cols): Specifications, Line Items, Add-ons, Partner, Inspection */}
            <div className="lg:col-span-7 space-y-6">

              {/* Card 1: Order Specifications */}
              <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-brand-600 shrink-0" /> Booking Specifications & Location
                  </span>
                  {currentBooking.category && (
                    <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-800 w-fit">
                      {currentBooking.category}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Package</span>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm break-words">{currentBooking.serviceTitle}</div>
                    {(currentBooking.subCategory || currentBooking.packageTitle) && (
                      <div className="text-slate-500 font-semibold break-words">{currentBooking.subCategory || currentBooking.packageTitle}</div>
                    )}
                  </div>

                  {(scheduledDate || scheduledTimeSlot || locality) && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Schedule Slot & Location</span>
                      {scheduledDate && (
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 flex-wrap">
                          <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                          <span>{scheduledDate} {scheduledTimeSlot ? `• ${scheduledTimeSlot}` : ""}</span>
                        </div>
                      )}
                      {(locality || city) && (
                        <div className="text-slate-500 font-semibold break-words">
                          {locality}{locality && city ? `, ${city}` : city}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Destination Service Address & Recipient Details */}
                {(fullAddress || locality) && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Delivery / Service Address</span>
                      {currentBooking.addressRecipientType && (
                        <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-300 w-fit">
                          Recipient: {currentBooking.addressRecipientType}
                        </span>
                      )}
                    </div>

                    {currentBooking.addressRecipientType && currentBooking.addressRecipientType !== "Self" && currentBooking.recipientName && (
                      <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="break-words">👤 Recipient Contact: {currentBooking.recipientName}</span>
                        {currentBooking.recipientPhone && <span className="font-mono break-all">{currentBooking.recipientPhone}</span>}
                      </div>
                    )}

                    <div className="font-bold text-slate-900 dark:text-white flex items-start gap-2 text-sm leading-relaxed">
                      <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-1" />
                      <div className="break-words">
                        <div>{fullAddress || locality}</div>
                        {(locality || pincode) && (
                          <div className="text-xs text-slate-500 font-semibold mt-0.5">
                            {[locality, city, pincode].filter(Boolean).join(" - ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {notes && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
                    <span className="font-extrabold text-amber-800 dark:text-amber-300 block flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Special Customer Request Notes:
                    </span>
                    <p className="text-amber-900 dark:text-amber-200 font-medium break-words">{notes}</p>
                  </div>
                )}
              </div>

              {/* Card 2: Itemized Line Items */}
              <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Itemized Service Line Items ({currentBooking.servicesList?.length || 1})
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {currentBooking.servicesList && currentBooking.servicesList.length > 0 ? (
                    currentBooking.servicesList.map((item, idx) => (
                      <div key={item.id || idx} className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2 flex-wrap">
                            <span className="break-words">{idx + 1}. {item.title}</span>
                            {item.category && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shrink-0">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">Qty: {item.quantity} • ₹{item.price} each</p>
                        </div>
                        <div className="text-left sm:text-right font-black text-slate-900 dark:text-white text-sm font-mono shrink-0">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2 flex-wrap">
                          <span className="break-words">1. {currentBooking.serviceTitle}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">1 Unit</p>
                      </div>
                      <div className="text-left sm:text-right font-black text-slate-900 dark:text-white text-sm font-mono shrink-0">
                        ₹{base}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Job Completion Add-On Products & Services (Rendered only if Add-ons exist in API) */}
              {displayAddons.length > 0 && (
                <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600 shrink-0" /> Completed Job Add-On Products & Spares ({displayAddons.length})
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {displayAddons.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2 flex-wrap">
                            <span className="break-words">{item.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">Price: ₹{item.price}</p>
                        </div>
                        <div className="text-left sm:text-right font-black text-emerald-700 dark:text-emerald-300 text-sm font-mono shrink-0">
                          ₹{item.totalPrice}
                        </div>
                      </div>
                    ))}

                    <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-extrabold text-xs mt-2">
                      <span>Total Add-On Charges:</span>
                      <span className="font-mono text-emerald-400 text-sm">
                        ₹{currentBooking.addOnsFinalTotal || displayAddons.reduce((acc: number, i: any) => acc + (i.totalPrice || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 4: Assigned Service Partner */}
              <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Service Partner
                  </span>
                  {technicianName && (
                    <button
                      type="button"
                      onClick={() => setIsAssignOpen(true)}
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer w-fit"
                    >
                      Change Partner
                    </button>
                  )}
                </div>

                {technicianName ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shadow-xs shrink-0">
                          {technicianName[0]}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-1.5 flex-wrap">
                            <span>{technicianName}</span>
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          </h4>
                          {currentBooking.category && (
                            <p className="text-xs text-slate-500 font-medium">{currentBooking.category} Service Partner</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                        {technicianPhone && (
                          <a
                            href={`tel:${technicianPhone}`}
                            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>Call Partner</span>
                          </a>
                        )}
                        <Link
                          href="/technicians"
                          className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <span>Partners Directory</span>
                        </Link>
                      </div>
                    </div>

                    {locality && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-[10px] text-slate-400 block font-semibold">Service Operating Zone</span>
                        <span className="font-bold text-slate-900 dark:text-white">{locality}{city ? `, ${city}` : ""}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <div>
                      <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">No Partner Assigned</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Please assign an active partner to execute this booking.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAssignOpen(true)}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Assign Partner Now
                    </button>
                  </div>
                )}
              </div>

              {/* Card 5: Diagnostic Inspection Report (Rendered ONLY if inspection data exists in API) */}
              {hasInspectionData && (
                <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-blue-600 shrink-0" /> Diagnostic Inspection Details
                    </span>
                  </div>

                  {inspectionRemarks && (
                    <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-2">
                      <span className="font-extrabold text-blue-900 dark:text-blue-300 block">Inspection Remarks:</span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed break-words">
                        {inspectionRemarks}
                      </p>
                    </div>
                  )}

                  {currentBooking.initialInspectionQuote !== undefined && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold">Initial Inspection Quote</span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white">₹{currentBooking.initialInspectionQuote}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column (5 Cols): Customer CRM, Payment Ledger, Audit */}
            <div className="lg:col-span-5 space-y-6">

              {/* Card 1: Customer Profile */}
              {!isOfficeAdmin && (
                <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Customer Profile
                    </span>
                    {isNewCustomer ? (
                      <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit">
                        New Customer (1st Order)
                      </span>
                    ) : orderOrdinalText ? (
                      <span className="text-[10px] font-extrabold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded-xl border border-purple-300 dark:border-purple-800 w-fit">
                        {orderOrdinalText}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black flex items-center justify-center text-lg shadow-xs shrink-0">
                      {customerName ? customerName[0] : "C"}
                    </div>
                    <div className="min-w-0 flex-1">
                      {customerId ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/customers/${customerId}?from=${encodeURIComponent(`/bookings/${currentBooking.id}`)}`)}
                          className="font-extrabold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 hover:underline text-base text-left cursor-pointer flex items-center gap-1.5 break-words max-w-full"
                          title={`View ${customerName} details`}
                        >
                          <span className="break-words">{customerName}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        </button>
                      ) : (
                        <span className="font-extrabold text-slate-900 dark:text-white text-base break-words block">
                          {customerName}
                        </span>
                      )}
                      {(locality || city) && (
                        <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                          {locality}{locality && city ? `, ${city}` : city}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs pt-1">
                    {customerPhone && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <span className="flex items-center gap-2 text-slate-500 font-semibold"><Phone className="w-4 h-4 text-brand-600 shrink-0" /> Mobile Phone</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white font-mono break-all">{customerPhone}</span>
                          <a
                            href={`tel:${customerPhone}`}
                            className="p-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 font-bold shrink-0"
                          >
                            Call
                          </a>
                        </div>
                      </div>
                    )}

                    {customerEmail && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <span className="flex items-center gap-2 text-slate-500 font-semibold shrink-0"><Mail className="w-4 h-4 text-brand-600 shrink-0" /> Email Address</span>
                        <span className="font-bold text-slate-900 dark:text-white select-all break-all text-left sm:text-right">
                          {customerEmail}
                        </span>
                      </div>
                    )}

                    {customerGstin && (
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <span className="text-purple-700 dark:text-purple-300 font-semibold text-[11px]">B2B Customer GSTIN</span>
                        <span className="font-mono font-bold text-purple-900 dark:text-purple-200 break-all">{customerGstin}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card 2: Payment Details */}
              <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Payment Details
                  </span>
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded border w-fit ${
                    isPaid
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
                      : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                  }`}>
                    ● {paymentStatusLabel}
                  </span>
                </div>

                {/* Real Payment Method & Transaction Info */}
                {(paymentMethod || paymentTransactionId) && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                    {paymentMethod && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Payment Method</span>
                        <span className="font-bold text-slate-900 dark:text-white uppercase">{paymentMethod}</span>
                      </div>
                    )}

                    {paymentTransactionId && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Transaction ID</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px] break-all">
                          {paymentTransactionId}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Base Service Amount</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">₹{base.toLocaleString()}</span>
                  </div>

                  {convenienceFee > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Platform Convenience Fee</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">₹{convenienceFee.toLocaleString()}</span>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Discount</span>
                      <span className="font-mono">-₹{discount.toLocaleString()}</span>
                    </div>
                  )}

                  {gst > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>GST</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">₹{gst.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                    <span>Grand Total</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-base font-mono">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/billing/${currentBooking.id}`)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>Open Tax Invoice Details</span>
                </button>
              </div>

              {/* Card 3: Operations & Calling Audit Log (Rendered ONLY if audit data exists in API) */}
              {/* {hasAuditData && (
                <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs text-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Operations & Calling Audit Log
                  </span>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    {callingPerson && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-400 font-semibold">Calling Agent</span>
                        <span className="font-bold text-slate-900 dark:text-white break-words">{callingPerson}</span>
                      </div>
                    )}
                    {handledBy && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-400 font-semibold">Handled By</span>
                        <span className="font-bold text-slate-900 dark:text-white break-words">{handledBy}</span>
                      </div>
                    )}
                    {callingDate && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-400 font-semibold">Booking / Calling Date</span>
                        <span className="font-bold text-slate-900 dark:text-white">{callingDate}</span>
                      </div>
                    )}
                    {otpCode && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-400 font-semibold">Job Security OTP</span>
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 text-[11px] w-fit">
                          {otpCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )} */}

            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <AssignPartnerModal
        booking={isAssignOpen ? currentBooking : null}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onPartnerAssigned={handlePartnerAssigned}
      />

      <InspectionFlowModal
        booking={isInspectionOpen ? currentBooking : null}
        isOpen={isInspectionOpen}
        onClose={() => setIsInspectionOpen(false)}
        onInspectionApproved={handleInspectionApproved}
      />

      <OtpVerificationModal
        booking={isOtpOpen ? currentBooking : null}
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        onJobCompleted={handleJobCompleted}
      />

      <EditBookingModal
        booking={isEditOpen ? currentBooking : null}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onBookingUpdated={handleBookingUpdated}
      />

      <RescheduleBookingModal
        booking={isRescheduleOpen ? currentBooking : null}
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onReschedule={handleReschedule}
      />

      <ArchiveBookingModal
        isOpen={isArchiveModalOpen}
        booking={currentBooking}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchive}
        isLoading={isArchiving}
      />

      <CancelBookingModal
        isOpen={isCancelModalOpen}
        booking={currentBooking}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />

      {/* ─── HIDDEN PRINT CANVAS: OFFICIAL GST TAX INVOICE ─── */}
      <Portal>
        <div
          id="printable-tax-invoice-portal"
          className="hidden print:block p-0 rounded-3xl bg-white text-black space-y-4 w-full"
        >
          {/* Invoice Header */}
          <div className="flex flex-row items-start justify-between gap-2 border-b border-slate-300 pb-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-xl bg-white border border-slate-300 shrink-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="HelpMate Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-xl text-black tracking-tight leading-none">
                    HelpMate
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end text-right space-y-1 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-black font-extrabold text-[10px] border border-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                <span>OFFICIAL GST TAX INVOICE</span>
              </div>

              <div className="font-mono text-xs font-black text-black bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                Invoice No: <span className="text-black font-extrabold">{formatInvoiceNumber(currentBooking.bookingNumber || currentBooking.id)}</span>
              </div>

              {scheduledDate && (
                <div className="text-[10px] text-slate-600 font-semibold">
                  Invoice Date: <span className="font-bold text-black">{scheduledDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer & Billing Address Information */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">
                Billed To (Customer Details)
              </span>
              <div className="font-extrabold text-black text-xs">
                {customerName}
              </div>
              {fullAddress && (
                <div className="text-slate-800 font-medium text-[10px]">
                  {fullAddress}
                </div>
              )}
              {customerPhone && (
                <div className="font-bold text-slate-900 text-[10px]">
                  Phone: {customerPhone}
                </div>
              )}
              {customerGstin && (
                <div className="font-mono font-bold text-black bg-slate-100 p-0.5 rounded border border-slate-300 text-[9px] w-fit">
                  B2B GSTIN: {customerGstin}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">
                Service & Payment Details
              </span>
              <div className="font-extrabold text-black text-xs">
                Service: {currentBooking.serviceTitle}
              </div>
              {currentBooking.category && (
                <div className="text-slate-800 font-medium text-[10px]">
                  Category: {currentBooking.category}
                </div>
              )}
              {paymentMethod && (
                <div className="font-bold text-slate-900 text-[10px]">
                  Payment Method: {paymentMethod}
                </div>
              )}
              <div className="font-bold text-emerald-700 flex items-center gap-1 text-[10px]">
                ✓ Payment Status: {paymentStatusLabel}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase text-[9px]">
                  <th className="pb-1.5">Item / Description</th>
                  <th className="pb-1.5 text-right">Base Amount</th>
                  {gst > 0 && <th className="pb-1.5 text-right">GST</th>}
                  <th className="pb-1.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-black">
                <tr>
                  <td className="py-2">
                    <div className="font-extrabold text-xs">{currentBooking.serviceTitle}</div>
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-xs">₹{base}</td>
                  {gst > 0 && <td className="py-2 text-right font-mono text-slate-700 text-xs">₹{gst}</td>}
                  <td className="py-2 text-right font-mono font-extrabold text-black text-xs">
                    ₹{base + gst}
                  </td>
                </tr>
                {displayAddons.map((addon: any, aIdx: number) => (
                  <tr key={addon.id || aIdx}>
                    <td className="py-2">
                      <div className="font-bold text-xs">{addon.name}</div>
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-xs">₹{addon.price}</td>
                    {gst > 0 && <td className="py-2 text-right font-mono text-slate-700 text-xs">₹{addon.gstAmount || 0}</td>}
                    <td className="py-2 text-right font-mono font-extrabold text-black text-xs">₹{addon.totalPrice}</td>
                  </tr>
                ))}
                {convenienceFee > 0 && (
                  <tr>
                    <td className="py-2">
                      <div className="font-bold text-xs">Platform Convenience Fee</div>
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-xs">₹{convenienceFee}</td>
                    {gst > 0 && <td className="py-2 text-right font-mono text-slate-700 text-xs">₹0</td>}
                    <td className="py-2 text-right font-mono font-bold text-xs">₹{convenienceFee}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Total Box */}
          <div className="flex flex-row justify-end items-start gap-4 border-t border-slate-300 pt-3">
            <div className="w-60 p-2.5 rounded-xl bg-slate-50 border border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between py-0.5 border-b border-slate-300 text-slate-800 text-[11px]">
                <span>Base Subtotal</span>
                <span className="font-mono font-bold">₹{base + convenienceFee + (currentBooking.addOnsBaseTotal || 0)}</span>
              </div>
              {gst > 0 && (
                <div className="flex justify-between py-0.5 border-b border-slate-300 text-slate-800 text-[11px]">
                  <span>GST Amount</span>
                  <span className="font-mono font-bold">₹{gst + (currentBooking.addOnsGstTotal || 0)}</span>
                </div>
              )}
              <div className="flex justify-between py-0.5 text-xs font-black text-black">
                <span>Grand Total</span>
                <span className="font-mono text-emerald-700 font-bold text-xs">₹{finalTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </Portal>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl shadow-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 animate-in slide-in-from-bottom-5 border border-slate-800 dark:border-slate-200">
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 dark:text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
