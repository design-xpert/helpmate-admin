"use client";

import { useState, useMemo, Suspense, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { Booking, BookingStatus, Technician, initialTechnicians, SelectedAddOnItem, BroadcastPartnerOffer } from "@/lib/mockData";
import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Phone,
  FileText,
  ShieldCheck,
  Wrench,
  Eye,
  Edit2,
  UserPlus,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Layers,
  Zap,
  SprayCan,
  Droplets,
  Grid,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Search,
  Pin,
  PinOff,
  Globe,
  Building2,
  RefreshCw,
  Archive,
  ArchiveRestore,
  Ban,
  Loader2,
  Hammer,
  Paintbrush,
  Bug,
  Car,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { toast } from "@/components/Toast";
import { BookingWizardModal } from "@/components/bookings/BookingWizardModal";
import { AssignPartnerModal } from "@/components/bookings/AssignPartnerModal";
import { InspectionFlowModal } from "@/components/bookings/InspectionFlowModal";
import { OtpVerificationModal } from "@/components/bookings/OtpVerificationModal";
import { EditBookingModal } from "@/components/bookings/EditBookingModal";
import { BookingDetailsDrawer } from "@/components/bookings/BookingDetailsDrawer";
import { RescheduleBookingModal } from "@/components/bookings/RescheduleBookingModal";
import { ArchiveBookingModal } from "@/components/bookings/ArchiveBookingModal";
import { CancelBookingModal } from "@/components/bookings/CancelBookingModal";
import { useRbac } from "@/context/RbacContext";
import { getBookingCategoriesApi, getBookingsApi, completeBookingApi, getBookingDashboardStatsApi, ApiBookingCategoryStat, archiveBookingApi, restoreBookingApi, cancelBookingApi, pinCategoryApi, formatImageUrl, getCategoriesApi } from "@/lib/api";
import { isImagePreloaded, preloadImage, preloadImages, storeDataUrl, getStoredDataUrl, cacheImageDataUrl } from "@/lib/imageCache";

export function mapApiBooking(b: any): Booking {
  const item0 = b.items?.[0];
  const catName =
    (typeof item0?.category === "object"
      ? item0?.category?.name || item0?.category?.categoryName
      : typeof item0?.category === "string"
      ? item0.category
      : "") ||
    b.category ||
    b.categoryName ||
    "General";
  const subCatName = item0?.subCategory?.name || (typeof item0?.subCategory === "string" ? item0.subCategory : "") || "";
  const serviceActionName = item0?.serviceAction?.name || "";
  const pkgTitle = item0?.package?.name || item0?.package?.packageName || serviceActionName || "Service Package";

  const rawOrigin = b.origin || b.bookingSource || "";
  const originStr = String(rawOrigin).toLowerCase();
  const isOnline =
    originStr === "website" ||
    originStr === "app" ||
    originStr === "online" ||
    b.bookingType === "online" ||
    (typeof b.bookingNumber === "string" && b.bookingNumber.startsWith("WEB-"));

  const createdByStr = isOnline
    ? "Customer Online"
    : b.createdBy?.name
      ? b.createdBy.name
      : b.handledBy?.name
        ? b.handledBy.name
        : originStr === "admin"
          ? "Super Admin (HQ)"
          : "Customer Online";

  const workingDateRaw = b.schedule?.bookingDate || b.workingDate || "";
  const rawWorkingDate = workingDateRaw ? workingDateRaw.split("T")[0] : "";
  const formattedWorkingDate = rawWorkingDate
    ? new Date(workingDateRaw).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Today";

  const callingDateRaw = b.callingDate || b.createdAt || "";
  const rawCallingDate = callingDateRaw ? callingDateRaw.split("T")[0] : "";
  const formattedCallingDate = callingDateRaw
    ? new Date(callingDateRaw).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const bookingIdDisplay = b.bookingNumber || (b._id ? `BK-${b._id.slice(-6).toUpperCase()}` : "BK-UNKNOWN");

  // Map all items into servicesList
  const servicesList = (b.items || []).map((item: any, idx: number) => {
    const itemTitle = item.package?.name || item.package?.packageName || item.serviceAction?.name || "Service";
    return {
      id: item.package?.id || item.package?._id || item.serviceAction?.id || item._id || String(idx),
      serviceCode: `${bookingIdDisplay}-${String(idx + 1).padStart(2, "0")}`,
      title: itemTitle,
      price: item.totalPrice || item.unitPrice || item.package?.price || 0,
      quantity: item.quantity || 1,
      category: item.category?.name,
      duration: item.package?.duration ? `${item.package.duration} mins` : undefined,
    };
  });

  // Strictly map status from API response (b.bookingStatus || b.status)
  let status: BookingStatus = "Pending";
  const rawStatus = b.status || b.bookingStatus || "";
  const statusStr = rawStatus.toLowerCase().trim();

  if (statusStr === "completed") {
    status = "Completed";
  } else if (statusStr === "cancelled") {
    status = "Cancelled";
  } else if (statusStr === "rejected") {
    status = "Rejected";
  } else if (statusStr === "in_progress" || statusStr === "in progress" || statusStr === "on_the_way") {
    status = "In Progress";
  } else if (statusStr === "assigned" || statusStr === "partner_assigned" || statusStr === "partner assigned") {
    status = "Assigned";
  } else if (statusStr === "accepted" || statusStr === "partner_accepted" || statusStr === "partner accepted") {
    status = "Partner Accepted";
  } else if (statusStr === "pending") {
    status = "Pending";
  } else if (statusStr === "draft") {
    status = "Draft";
  } else if (rawStatus) {
    status = rawStatus
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase()) as BookingStatus;
  }

  // Address mapping
  const addrObj = b.address || b.serviceAddress || {};
  const fullAddress = [
    addrObj.serviceAddress || addrObj.address,
    addrObj.landmark ? `Near ${addrObj.landmark}` : "",
    addrObj.localityName,
    addrObj.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "Varanasi, UP";

  // Financial / Billing mapping
  const billingObj = b.billing || {};
  const basePriceVal = billingObj.sellingPrice ?? billingObj.mrp ?? item0?.totalPrice ?? item0?.unitPrice ?? b.amount ?? 0;
  const convenienceFeeVal = billingObj.platformFee ?? b.convenienceFee ?? 49;
  const totalAmountVal = billingObj.totalAmount ?? b.amount ?? (basePriceVal + convenienceFeeVal);
  const gstVal = billingObj.gst ?? (basePriceVal + convenienceFeeVal) * 0.18;
  const cgstVal = Number((gstVal / 2).toFixed(2));
  const sgstVal = Number((gstVal - cgstVal).toFixed(2));

  const paymentObj = billingObj.payment || {};
  const rawPayMethod = paymentObj.paymentMethod || b.paymentMethod || "";
  const paymentMethodVal = rawPayMethod.toLowerCase() === "upi" ? "UPI" : rawPayMethod || (isOnline ? "Online" : "Cash on Service");
  const paymentStatusVal = paymentObj.paymentStatus || (status === "Completed" ? "paid" : "pending");

  // Partner / Assignment mapping
  const assignmentObj = b.assignment || {};
  const partnerObj =
    (typeof assignmentObj.partnerId === "object" && assignmentObj.partnerId !== null ? assignmentObj.partnerId : null) ||
    b.assignedPartner ||
    b.partner ||
    assignmentObj.partner ||
    {};

  const partnerNameVal =
    partnerObj.name ||
    partnerObj.partnerName ||
    assignmentObj.partnerName ||
    (typeof b.assignedPartner === "string" ? b.assignedPartner : undefined);

  const partnerPhoneVal =
    partnerObj.mobile ||
    partnerObj.phone ||
    assignmentObj.partnerPhone ||
    (typeof assignmentObj.partnerId === "object" ? assignmentObj.partnerId?.mobile || assignmentObj.partnerId?.phone : undefined);

  const partnerIdVal =
    partnerObj._id ||
    partnerObj.id ||
    partnerObj.partnerId ||
    (typeof assignmentObj.partnerId === "string" ? assignmentObj.partnerId : undefined);

  const rawCallingDateStr = b.createdAt || b.workingDate || "";
  const rawTimestampVal = rawCallingDateStr ? new Date(rawCallingDateStr).getTime() : 0;
  const rawBookingNumVal = parseInt((b.bookingNumber || "").replace(/\D/g, ""), 10) || 0;

  return {
    id: b._id || b.bookingNumber,
    rawId: b._id || b.bookingNumber || "",
    rawTimestamp: rawTimestampVal,
    rawBookingNumber: rawBookingNumVal,
    jobId: bookingIdDisplay,
    bookingNumber: b.bookingNumber || bookingIdDisplay,
    customerId: b.customer?.customerId || b.customer?._id,
    customerBookingCount: b.customerBookingCount ?? b.customer?.bookingCount ?? undefined,
    createdBy: createdByStr,
    origin: isOnline ? "online" : "manual",
    bookingSource: rawOrigin || (isOnline ? "website" : "admin"),
    isOnline: isOnline,
    customerName: b.customer?.name || "Customer",
    customerPhone: b.customer?.mobile || b.customer?.phone || "",
    customerEmail: b.customer?.email || "",
    city: "Varanasi",
    locality: addrObj.localityName || "Varanasi Zone",
    pincode: addrObj.pincode || "221002",
    address: fullAddress,
    serviceTitle: pkgTitle,
    serviceName: serviceActionName || pkgTitle,
    scheduledDate: formattedWorkingDate,
    scheduledTime: b.schedule?.timeSlot || b.time || "12:00 PM",
    category: catName,
    subCategory: subCatName,
    packageTitle: pkgTitle,
    addons: (item0?.selectedAddons || []).map((a: any) => a.name || a.title || "Addon"),
    servicesList: servicesList,
    basePrice: basePriceVal,
    convenienceFee: convenienceFeeVal,
    discountAmount: billingObj.discount || 0,
    gst: gstVal,
    cgst: cgstVal,
    sgst: sgstVal,
    totalAmount: totalAmountVal,
    finalAmount: totalAmountVal,
    commissionAmount: Math.round(basePriceVal * 0.25),
    partnerEarnings: Math.round(basePriceVal * 0.75),
    invoiceType: "B2C",
    paymentMethod: paymentMethodVal,
    paymentStatus: paymentStatusVal,
    status: status,
    technicianId: partnerIdVal,
    technicianName: partnerNameVal,
    technicianPhone: partnerPhoneVal,
    bookingDate: formattedCallingDate || formattedWorkingDate,
    callingDate: formattedCallingDate || rawCallingDate,
    callingPerson: b.createdBy?.name || b.handledBy?.name || (isOnline ? "Online Direct" : "HQ Admin"),
    handledBy: b.createdBy?.name || b.handledBy?.name || (isOnline ? "Website Direct" : "HQ Admin"),
    date: formattedWorkingDate,
    timeSlot: b.schedule?.timeSlot || b.time || "12:00 PM",
    isArchived: Boolean(b.isArchived || b.archived),
    archivedAt: b.archivedAt ? String(b.archivedAt) : undefined,
  };
}

function CategoryCardsShimmer() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-2">
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-64"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-96"></div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-36"></div>
      </div>

      {/* Top Strip Shimmer (All Service Categories) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3.5 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 w-full md:w-auto">
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-10 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>

      {/* Grid of Slim Cards Shimmer */}
      <div className="space-y-3">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                  <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableShimmer() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
          <div className="h-3.5 w-80 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-32"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-20"></div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-4">
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-64"></div>
          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingCategoryIcon({
  iconUrl,
  name,
  className = "w-8 h-8 rounded-xl",
  imgClassName = "w-full h-full object-contain p-1",
}: {
  iconUrl?: string;
  name: string;
  className?: string;
  imgClassName?: string;
  fallbackIconSize?: string;
}) {
  const nameKey = (name || "").toLowerCase().trim();
  const formattedUrl = formatImageUrl(iconUrl);

  const resolveImmediateSrc = (url?: string, nKey?: string) => {
    if (!url && !nKey) return "";
    if (url && (url.startsWith("data:") || url.startsWith("blob:"))) return url;
    const memUrl = (url ? getStoredDataUrl(url) : null) || (nKey ? getStoredDataUrl(`booking_cat_${nKey}`) : null);
    if (memUrl) return memUrl;

    if (typeof window !== "undefined") {
      const storedMap = getStoredModuleData<Record<string, string>>("booking_category_data_urls");
      if (storedMap) {
        if (url && storedMap[url]) return storedMap[url];
        if (nKey && storedMap[nKey]) return storedMap[nKey];
      }
    }
    return url || "";
  };

  const [imgSrc, setImgSrc] = useState<string>(() => resolveImmediateSrc(formattedUrl, nameKey));
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const formatted = formatImageUrl(iconUrl);
    const immediate = resolveImmediateSrc(formatted, nameKey);
    setImgSrc(immediate);
    setImgError(false);

    if (formatted) {
      if (!immediate || (!immediate.startsWith("data:") && !immediate.startsWith("blob:"))) {
        preloadImage(formatted).then((loaded) => {
          if (loaded) {
            cacheImageDataUrl(formatted, `booking_cat_${nameKey}`).then((dataUrl) => {
              if (dataUrl) {
                setImgSrc(dataUrl);
                const curMap = getStoredModuleData<Record<string, string>>("booking_category_data_urls") || {};
                curMap[formatted] = dataUrl;
                if (nameKey) curMap[nameKey] = dataUrl;
                setCachedModuleData("booking_category_data_urls", curMap);
              }
            });
          }
        });
      }
    }
  }, [iconUrl, nameKey]);

  return (
    <div
      className={`${className} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden relative`}
    >
      {imgSrc && !imgError ? (
        <img
          src={imgSrc}
          alt={name}
          className={imgClassName}
          onError={() => setImgError(true)}
          loading="eager"
          decoding="async"
        />
      ) : (
        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter select-none">
          {name ? name.trim().slice(0, 2) : "CA"}
        </span>
      )}
    </div>
  );
}

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("category");
  const bookingTypeParam = searchParams?.get("bookingType");
  const statusParam = searchParams?.get("status");
  const selectedCategory = categoryParam || null;
  const { role } = useRbac();
  const isOfficeAdmin = role === "Office Admin";

  const cacheKey = `bookings:${bookingTypeParam || ""}:${statusParam || ""}`;
  const initialCachedBookings = getStoredModuleData<Booking[]>(cacheKey) || getStoredModuleData<Booking[]>("bookings");
  const initialCachedCats = getStoredModuleData<ApiBookingCategoryStat[]>("booking_categories");
  const initialCachedAllStats = getStoredModuleData<any>("booking_categories_all");
  const [bookings, setBookings] = useState<Booking[]>(() => initialCachedBookings || []);
  const bookingsRef = useRef<Booking[]>(bookings);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);
  const [apiCategories, setApiCategories] = useState<ApiBookingCategoryStat[]>(() => initialCachedCats || []);
  const initialCachedStats = getStoredModuleData<any>("booking_dashboard_stats");
  const [allCategoryStats, setAllCategoryStats] = useState<any>(() => initialCachedAllStats || null);
  const [dashboardStats, setDashboardStats] = useState<any | null>(() => initialCachedStats || null);
  const [isLoadingData, setIsLoadingData] = useState(() => !(
    (isModuleCacheFresh("booking_categories") && initialCachedCats && initialCachedCats.length > 0) ||
    ((isModuleCacheFresh(cacheKey) || isModuleCacheFresh("bookings")) && initialCachedBookings && initialCachedBookings.length > 0)
  ));
  const [viewArchiveMode, setViewArchiveMode] = useState<boolean>(false);
  const [archivedBookings, setArchivedBookings] = useState<Booking[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState<boolean>(false);
  const [archiveTargetBooking, setArchiveTargetBooking] = useState<Booking | null>(null);
  const [cancelTargetBooking, setCancelTargetBooking] = useState<Booking | null>(null);

  // Pinned Categories State (strictly max 3, purely driven by backend isPinned)
  const [pinnedCategories, setPinnedCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("helpmate_pinned_categories");
      } catch {}
    }
    if (initialCachedCats && initialCachedCats.length > 0) {
      return initialCachedCats
        .filter((c: any) => Boolean(c.isPinned))
        .map((c: any) => c.categoryName || c.name)
        .slice(0, 3);
    }
    return [];
  });

  const [pinLoadingCat, setPinLoadingCat] = useState<string | null>(null);

  // Category switch dropdown state on Table view
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  const togglePinCategory = async (catName: string, e?: React.MouseEvent, catIdParam?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Resolve category ID from parameter or apiCategories
    const catObj = apiCategories.find(
      (c: any) => (c.categoryName || c.name || "").toLowerCase().trim() === catName.toLowerCase().trim()
    );
    const categoryId = catIdParam || catObj?._id;

    const isAlreadyPinned = Boolean(
      catObj ? catObj.isPinned : pinnedCategories.some((name) => name.toLowerCase().trim() === catName.toLowerCase().trim())
    );

    const currentPinnedCount = apiCategories.filter((c: any) => Boolean(c.isPinned)).length;

    if (!isAlreadyPinned && currentPinnedCount >= 3) {
      toast.dismissAll();
      toast.error("Pin Limit Reached", "Only 3 categories can be pinned. Unpin one first to pin another.");
      return;
    }

    const nextPinState = !isAlreadyPinned;

    // Optimistically update apiCategories and pinnedCategories
    setApiCategories((prev) =>
      prev.map((c: any) =>
        (categoryId && c._id === categoryId) || (c.categoryName || c.name) === catName
          ? { ...c, isPinned: nextPinState }
          : c
      )
    );
    setPinnedCategories((prev) =>
      nextPinState
        ? [...prev.filter((n) => n.toLowerCase().trim() !== catName.toLowerCase().trim()), catName].slice(0, 3)
        : prev.filter((n) => n.toLowerCase().trim() !== catName.toLowerCase().trim())
    );

    if (categoryId) {
      setPinLoadingCat(catName);
      try {
        const res = await pinCategoryApi(categoryId, nextPinState);
        if (res && res.success) {
          toast.dismissAll();
          toast.success(
            nextPinState ? "Category Pinned" : "Category Unpinned",
            res.message || (nextPinState ? `"${catName}" pinned to top successfully.` : `"${catName}" unpinned successfully.`)
          );

          getBookingCategoriesApi(true).then((freshRes) => {
            const freshList = freshRes?.data?.categories || freshRes?.categories || freshRes?.data || [];
            if (Array.isArray(freshList)) {
              setApiCategories(freshList);
              setCachedModuleData("booking_categories", freshList);
              const freshPinned = freshList
                .filter((c: any) => Boolean(c.isPinned))
                .map((c: any) => c.categoryName || c.name)
                .slice(0, 3);
              setPinnedCategories(freshPinned);
            }
          }).catch(() => {});
        } else {
          // Revert optimistic update
          setApiCategories((prev) =>
            prev.map((c: any) =>
              (categoryId && c._id === categoryId) || (c.categoryName || c.name) === catName
                ? { ...c, isPinned: isAlreadyPinned }
                : c
            )
          );
          setPinnedCategories((prev) =>
            isAlreadyPinned
              ? [...prev.filter((n) => n.toLowerCase().trim() !== catName.toLowerCase().trim()), catName].slice(0, 3)
              : prev.filter((n) => n.toLowerCase().trim() !== catName.toLowerCase().trim())
          );
          toast.dismissAll();
          toast.error("Pin Update Failed", res?.message || "Failed to update pin status.");
        }
      } catch (err) {
        console.error("Error pinning category:", err);
        // Revert optimistic update
        setApiCategories((prev) =>
          prev.map((c: any) =>
            (categoryId && c._id === categoryId) || (c.categoryName || c.name) === catName
              ? { ...c, isPinned: isAlreadyPinned }
              : c
          )
        );
        setPinnedCategories((prev) =>
          isAlreadyPinned
            ? [...prev.filter((n) => n.toLowerCase().trim() !== catName.toLowerCase().trim()), catName].slice(0, 3)
            : prev.filter((n) => n.toLowerCase().trim() !== catName.toLowerCase().trim())
        );
        toast.dismissAll();
        toast.error("Network Error", "Network error while updating pin status.");
      } finally {
        setPinLoadingCat(null);
      }
    } else {
      toast.dismissAll();
      toast.error("Error", `Could not find category ID for "${catName}".`);
    }
  };

  const updateBookingFilters = (newType?: string | null, newStatus?: string | null) => {
    const params = new URLSearchParams();
    if (categoryParam) {
      params.set("category", categoryParam);
    }
    if (newType !== undefined) {
      if (newType) {
        params.set("bookingType", newType);
      }
    } else if (bookingTypeParam) {
      params.set("bookingType", bookingTypeParam);
    }
    if (newStatus !== undefined) {
      if (newStatus) {
        params.set("status", newStatus);
      }
    } else if (statusParam) {
      params.set("status", statusParam);
    }
    const queryStr = params.toString();
    router.push(`/bookings${queryStr ? `?${queryStr}` : ""}`);
  };

  const checkAndSyncBookings = useCallback(
    async (isSilent: boolean = true) => {
      try {
        const bookingsRes = await getBookingsApi({
          status: statusParam || undefined,
          forceRefresh: true,
        });
        if (bookingsRes && bookingsRes.success && Array.isArray(bookingsRes.data)) {
          const mappedList: Booking[] = bookingsRes.data.map(mapApiBooking);
          const prev = bookingsRef.current;
          const prevIds = new Set(prev.map((b) => b.id));
          const newBookings = mappedList.filter((b) => !prevIds.has(b.id));

          let hasChanges = newBookings.length > 0 || mappedList.length !== prev.length;
          if (!hasChanges) {
            const prevMap = new Map(prev.map((b) => [b.id, b]));
            for (const b of mappedList) {
              const existing = prevMap.get(b.id);
              if (
                !existing ||
                existing.status !== b.status ||
                existing.technicianId !== b.technicianId ||
                existing.totalAmount !== b.totalAmount ||
                existing.paymentStatus !== b.paymentStatus
              ) {
                hasChanges = true;
                break;
              }
            }
          }

          if (hasChanges) {
            setCachedModuleData(cacheKey, mappedList);
            setCachedModuleData("bookings", mappedList);
            setBookings(mappedList);

            if (newBookings.length > 0 && prev.length > 0) {
              toast.dismissAll();
              toast.success(
                "New Booking Received",
                `${newBookings.length} new booking${newBookings.length > 1 ? "s" : ""} added to list.`
              );
            }
          }

          // Refresh dashboard stats quietly
          getBookingDashboardStatsApi({ bookingType: bookingTypeParam || undefined })
            .then((statsRes) => {
              if (statsRes && (statsRes.data || statsRes.success || statsRes.totalBookings || statsRes.total)) {
                const statsObj = statsRes.data || statsRes;
                setDashboardStats(statsObj);
                setCachedModuleData("booking_dashboard_stats", statsObj);
              }
            })
            .catch(() => {});

          // Refresh category stats quietly
          getBookingCategoriesApi(true)
            .then((catRes) => {
              const rawCatList = Array.isArray(catRes?.data?.categories)
                ? catRes.data.categories
                : Array.isArray(catRes?.categories)
                ? catRes.categories
                : Array.isArray(catRes?.data)
                ? catRes.data
                : [];
              if (rawCatList.length > 0) {
                setApiCategories(rawCatList);
                setCachedModuleData("booking_categories", rawCatList);
              }
              const allStatsObj = catRes?.data?.all || catRes?.data?.allServices || null;
              if (allStatsObj) {
                setAllCategoryStats(allStatsObj);
                setCachedModuleData("booking_categories_all", allStatsObj);
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error("Error checking for new bookings:", err);
      } finally {
        if (!isSilent) {
          setIsLoadingData(false);
        }
      }
    },
    [cacheKey, statusParam, bookingTypeParam]
  );

  const refreshBookingsFromBackend = async () => {
    setIsLoadingData(true);
    await checkAndSyncBookings(false);
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const hasStoredCats = isModuleCacheFresh("booking_categories") && initialCachedCats && initialCachedCats.length > 0;
      const hasStoredBookings = (isModuleCacheFresh(cacheKey) || isModuleCacheFresh("bookings")) && initialCachedBookings && initialCachedBookings.length > 0;

      if (!hasStoredCats) {
        try {
          const catRes = await getBookingCategoriesApi();
          const rawCatList = Array.isArray(catRes?.data?.categories)
            ? catRes.data.categories
            : Array.isArray(catRes?.categories)
            ? catRes.categories
            : Array.isArray(catRes?.data)
            ? catRes.data
            : [];
          if (isMounted && rawCatList.length > 0) {
            setApiCategories(rawCatList);
            setCachedModuleData("booking_categories", rawCatList);
            const serverPinned = rawCatList
              .filter((c: any) => Boolean(c.isPinned))
              .map((c: any) => c.categoryName || c.name)
              .slice(0, 3);
            setPinnedCategories(serverPinned);
          }
          const allStatsObj = catRes?.data?.all || catRes?.data?.allServices || null;
          if (isMounted && allStatsObj) {
            setAllCategoryStats(allStatsObj);
            setCachedModuleData("booking_categories_all", allStatsObj);
          }

          const statsRes = await getBookingDashboardStatsApi({ bookingType: bookingTypeParam || undefined });
          if (isMounted && statsRes && (statsRes.data || statsRes.success || statsRes.totalBookings || statsRes.total)) {
            const statsObj = statsRes.data || statsRes;
            setDashboardStats(statsObj);
            setCachedModuleData("booking_dashboard_stats", statsObj);
          }
        } catch (err) {
          console.error("Error loading categories:", err);
        }
      }

      if (hasStoredBookings) {
        setIsLoadingData(false);
        // Silently sync in background without showing loader or shimmer
        checkAndSyncBookings(true);
        return;
      }

      if (bookings.length === 0 && (!initialCachedBookings || initialCachedBookings.length === 0)) {
        setIsLoadingData(true);
      }
      await checkAndSyncBookings(false);
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [bookingTypeParam, statusParam, categoryParam, checkAndSyncBookings]);

  // Automated background sync on tab/window focus (Event-driven, NO 15-second polling interval)
  useEffect(() => {
    let lastSyncTime = Date.now();

    const handleFocusSync = () => {
      const now = Date.now();
      // Cooldown: only trigger if tab is visible and at least 30 seconds have passed since last sync
      if (now - lastSyncTime > 30000 && typeof document !== "undefined" && document.visibilityState === "visible") {
        lastSyncTime = now;
        checkAndSyncBookings(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocusSync);
      document.addEventListener("visibilitychange", handleFocusSync);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocusSync);
        document.removeEventListener("visibilitychange", handleFocusSync);
      }
    };
  }, [checkAndSyncBookings]);

  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");
  const [cardFilter, setCardFilter] = useState<"ALL" | "UNASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("ALL");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "ONLINE" | "MANUAL">("ALL");

  useEffect(() => {
    if (bookingTypeParam === "manual") {
      setChannelFilter("MANUAL");
    } else if (bookingTypeParam === "online") {
      setChannelFilter("ONLINE");
    } else {
      setChannelFilter("ALL");
    }

    if (statusParam === "pending") {
      setCardFilter("UNASSIGNED");
    } else if (statusParam === "partner_assigned") {
      setCardFilter("IN_PROGRESS");
    } else if (statusParam === "completed") {
      setCardFilter("COMPLETED");
    } else if (statusParam === "cancelled") {
      setCardFilter("CANCELLED");
    } else {
      setCardFilter("ALL");
    }
  }, [bookingTypeParam, statusParam]);

  const isOnlineBooking = (b: Booking) => {
    if (typeof b.isOnline === "boolean") return b.isOnline;
    if (b.origin) {
      const o = String(b.origin).toLowerCase();
      if (o === "online" || o === "website" || o === "app") return true;
      if (o === "manual" || o === "admin") return false;
    }
    if (b.bookingSource) {
      const bs = String(b.bookingSource).toLowerCase();
      if (bs === "website" || bs === "app" || bs === "online") return true;
      if (bs === "admin" || bs === "manual") return false;
    }
    if (b.createdBy) {
      const lower = b.createdBy.toLowerCase();
      if (lower.includes("online") || lower.includes("website") || lower.includes("app") || lower.includes("direct")) {
        return true;
      }
      if (lower.includes("admin") || lower.includes("office") || lower.includes("hq") || lower.includes("super admin")) {
        return false;
      }
    }
    return b.paymentMethod === "Online" || b.paymentMethod === "Card";
  };

  const handleSelectCategory = (catName: string | null) => {
    setCardFilter("ALL");
    setChannelFilter("ALL");
    setActiveStatusFilter("All");
    if (catName) {
      router.push(`/bookings?category=${encodeURIComponent(catName)}`);
    } else {
      router.push("/bookings");
    }
  };

  // Modals & Toasts
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [createdBookingToast, setCreatedBookingToast] = useState<Booking | null>(null);
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null);
  const [inspectionBooking, setInspectionBooking] = useState<Booking | null>(null);
  const [otpBooking, setOtpBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [drawerBooking, setDrawerBooking] = useState<Booking | null>(null);
  const [printTargetBooking, setPrintTargetBooking] = useState<Booking | null>(null);

  const handleRescheduleBooking = (
    bookingId: string,
    newDate: string,
    newTimeSlot: string,
    technicianId?: string,
    technicianName?: string
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated: Booking = {
            ...b,
            date: newDate,
            timeSlot: newTimeSlot,
            technicianId: technicianId || b.technicianId,
            technicianName: technicianName || b.technicianName,
            status: technicianName ? (b.status === "Pending" || b.status === "Waiting For Assignment" ? "Assigned" : b.status) : b.status,
          };
          setCreatedBookingToast(updated);
          return updated;
        }
        return b;
      })
    );
  };

  const handleMarkBookingCompleted = async (row: Booking) => {
    try {
      const res = await completeBookingApi(row.id);
      if (res && res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === row.id ? { ...b, status: "Completed" } : b))
        );
        setDrawerBooking((prev) => (prev && prev.id === row.id ? { ...prev, status: "Completed" } : prev));
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === row.id ? { ...b, status: "Completed" } : b))
        );
        setDrawerBooking((prev) => (prev && prev.id === row.id ? { ...prev, status: "Completed" } : prev));
      }
    } catch (err) {
      console.error("Error completing booking:", err);
      setBookings((prev) =>
        prev.map((b) => (b.id === row.id ? { ...b, status: "Completed" } : b))
      );
      setDrawerBooking((prev) => (prev && prev.id === row.id ? { ...prev, status: "Completed" } : prev));
    }
  };

  const handleDirectPrint = (row: Booking) => {
    setPrintTargetBooking(row);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const fetchArchivedBookings = async () => {
    setIsLoadingArchived(true);
    try {
      const res = await getBookingsApi({ archived: true, forceRefresh: true });
      if (res && res.success && Array.isArray(res.data)) {
        const mappedList: Booking[] = res.data.map(mapApiBooking);
        setArchivedBookings(mappedList);
      }
    } catch (err) {
      console.error("Error fetching archived bookings:", err);
    } finally {
      setIsLoadingArchived(false);
    }
  };

  const handleArchiveBooking = (row: Booking) => {
    setArchiveTargetBooking(row);
  };

  const handleConfirmArchive = async (row: Booking) => {
    try {
      const res = await archiveBookingApi(row.id);
      if (res && res.success) {
        setBookings((prev) => prev.filter((b) => b.id !== row.id));
        const archivedItem: Booking = { ...row, isArchived: true, archivedAt: new Date().toISOString() };
        setArchivedBookings((prev) => [archivedItem, ...prev.filter((b) => b.id !== row.id)]);
        toast.dismissAll();
        toast.success("Booking Archived", `Booking #${row.bookingNumber || row.id} archived successfully.`);
        setArchiveTargetBooking(null);
        refreshBookingsFromBackend();
      } else {
        toast.dismissAll();
        toast.error("Archive Failed", res?.message || "Failed to archive booking");
      }
    } catch (err) {
      console.error("Error archiving booking:", err);
      toast.dismissAll();
      toast.error("Archive Failed", "Failed to archive booking");
    }
  };

  const handleCancelBooking = (row: Booking) => {
    setCancelTargetBooking(row);
  };

  const handleConfirmCancel = async (row: Booking, reason: string) => {
    try {
      const targetId = row.rawId || row.id;
      const res = await cancelBookingApi(targetId, reason);
      if (res && res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === row.id ? { ...b, status: "Cancelled", notes: reason } : b))
        );
        setDrawerBooking((prev) => (prev && prev.id === row.id ? { ...prev, status: "Cancelled" } : prev));
        toast.dismissAll();
        toast.success("Booking Cancelled", `Booking #${row.bookingNumber || row.id} cancelled successfully.`);
        setCancelTargetBooking(null);
        refreshBookingsFromBackend();
      } else {
        toast.dismissAll();
        toast.error("Cancellation Failed", res?.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.dismissAll();
      toast.error("Cancellation Failed", "Failed to cancel booking");
    }
  };

  const handleRestoreBooking = async (row: Booking) => {
    try {
      const res = await restoreBookingApi(row.id);
      if (res && res.success) {
        setArchivedBookings((prev) => prev.filter((b) => b.id !== row.id));
        const restoredItem: Booking = { ...row, isArchived: false, archivedAt: undefined };
        setBookings((prev) => [restoredItem, ...prev.filter((b) => b.id !== row.id)]);
        toast.dismissAll();
        toast.success("Booking Restored", `Booking #${row.bookingNumber || row.id} restored successfully.`);
        refreshBookingsFromBackend();
      } else {
        toast.dismissAll();
        toast.error("Restore Failed", res?.message || "Failed to restore booking");
      }
    } catch (err) {
      console.error("Error restoring booking:", err);
      toast.dismissAll();
      toast.error("Restore Failed", "Failed to restore booking");
    }
  };

  const formatInvoiceNumber = (id: string) => {
    if (!id) return "INV-0000";
    const cleanId = id.replace(/^(INV-)?(bk-)?/gi, "");
    if (cleanId.length > 5 && !isNaN(Number(cleanId))) {
      return `INV-${cleanId.slice(-5)}`;
    }
    return `INV-${cleanId.toUpperCase()}`;
  };

  const formatWorkingDate = (dateStr?: string) => {
    if (!dateStr) return "Today";
    const cleanDate = dateStr.split(",")[0].split("T")[0].trim();
    return cleanDate || "Today";
  };

  // Base role-filtered bookings list
  const roleFilteredBookings = useMemo(() => {
    const source = viewArchiveMode ? archivedBookings : bookings;
    if (isOfficeAdmin) {
      return source.filter((b) => b.createdBy && b.createdBy.toLowerCase().includes("office"));
    }
    return source;
  }, [bookings, archivedBookings, viewArchiveMode, isOfficeAdmin]);

  // Compute Category Level Statistics dynamically from API Categories and actual bookings
  const categoryStatsList = useMemo(() => {
    const catMap: Record<
      string,
      { id?: string; name: string; iconUrl?: string; count: number; unassigned: number; inProgress: number; completed: number; cancelled: number; isPinned?: boolean }
    > = {};

    // 1. Initialize from API Categories if available
    if (apiCategories.length > 0) {
      apiCategories.forEach((apiCat: any) => {
        const name = (apiCat.categoryName || apiCat.name || "Category").trim();
        if (name && name !== "All Service Categories") {
          catMap[name] = {
            id: apiCat._id,
            name,
            iconUrl: apiCat.iconUrl !== undefined && apiCat.iconUrl !== null ? apiCat.iconUrl : (apiCat.icon || (apiCat._id ? `/api/media/category/${apiCat._id}/icon` : "")),
            count: 0,
            unassigned: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            isPinned: Boolean(apiCat.isPinned),
          };
        }
      });
    }

    // 2. Count actual bookings from roleFilteredBookings
    if (roleFilteredBookings.length > 0) {
      roleFilteredBookings.forEach((b) => {
        const rawCat = (b.category || "General").trim();
        if (!rawCat) return;

        // Try exact match first
        let matchedKey = Object.keys(catMap).find(
          (k) => k.toLowerCase() === rawCat.toLowerCase()
        );

        // Try partial match if not exact
        if (!matchedKey) {
          matchedKey = Object.keys(catMap).find(
            (k) =>
              k.toLowerCase().includes(rawCat.toLowerCase()) ||
              rawCat.toLowerCase().includes(k.toLowerCase())
          );
        }

        // If not found in catMap, add new category dynamically
        if (!matchedKey) {
          matchedKey = rawCat;
          const matchedApiCat = apiCategories.find(
            (c: any) => (c.categoryName || c.name || "").toLowerCase().trim() === rawCat.toLowerCase().trim()
          );
          catMap[matchedKey] = {
            id: matchedApiCat?._id,
            name: rawCat,
            iconUrl: matchedApiCat?.iconUrl !== undefined && matchedApiCat?.iconUrl !== null ? matchedApiCat.iconUrl : ((matchedApiCat as any)?.icon || ""),
            count: 0,
            unassigned: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
          };
        }

        const item = catMap[matchedKey];
        item.count++;

        const st = (b.status || "").toLowerCase().trim();
        const hasTech = Boolean(b.technicianName && b.technicianName.trim());

        if (!hasTech && st !== "completed" && st !== "cancelled") {
          item.unassigned++;
        }
        if (st.includes("progress") || st.includes("assigned") || st === "in_progress") {
          item.inProgress++;
        }
        if (st === "completed") {
          item.completed++;
        }
        if (st === "cancelled" || st === "rejected") {
          item.cancelled++;
        }
      });
    } else if (apiCategories.length > 0) {
      // Fallback only if no bookings are loaded yet
      apiCategories.forEach((apiCat: any) => {
        const name = (apiCat.categoryName || apiCat.name || "Category").trim();
        if (catMap[name]) {
          catMap[name].count = Number(apiCat.totalBookings || apiCat.count) || 0;
          catMap[name].unassigned = Number(apiCat.openBookings || apiCat.unassigned) || 0;
          catMap[name].inProgress = Number(apiCat.activeBookings || apiCat.inProgress) || 0;
          catMap[name].completed = Number(apiCat.completedBookings || apiCat.completed) || 0;
          catMap[name].cancelled = Number(apiCat.cancelledBookings || apiCat.cancelled) || 0;
        }
      });
    }

    return Object.values(catMap);
  }, [apiCategories, roleFilteredBookings]);

  // 1. Filter by selected category
  const categoryBookings = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") return roleFilteredBookings;
    const sel = selectedCategory.toLowerCase().trim();
    return roleFilteredBookings.filter((b) => {
      const bCat = (b.category || "General").toLowerCase().trim();
      return bCat === sel || bCat.includes(sel) || sel.includes(bCat);
    });
  }, [roleFilteredBookings, selectedCategory]);

  // 2. Filter by card status & dropdown status
  const filteredBookings = useMemo(() => {
    const list = categoryBookings.filter((b) => {
      if (activeStatusFilter !== "All" && b.status.toLowerCase() !== activeStatusFilter.toLowerCase()) {
        return false;
      }
      if (cardFilter === "UNASSIGNED") {
        return !b.technicianName;
      }
      if (cardFilter === "IN_PROGRESS") {
        return b.status === "In Progress" || b.status === "Assigned";
      }
      if (cardFilter === "COMPLETED") {
        return b.status === "Completed";
      }
      if (cardFilter === "CANCELLED") {
        if (b.status !== "Cancelled" && b.status !== "Rejected") return false;
      }

      // Origin Channel Filter (Table Level)
      if (channelFilter === "ONLINE") {
        return isOnlineBooking(b);
      }
      if (channelFilter === "MANUAL") {
        return !isOnlineBooking(b);
      }

      return true;
    });

    // Sort list so newest / current booking is on TOP!
    return [...list].sort((a, b) => {
      if (a.rawTimestamp && b.rawTimestamp && a.rawTimestamp !== b.rawTimestamp) {
        return b.rawTimestamp - a.rawTimestamp;
      }
      if (a.rawBookingNumber && b.rawBookingNumber && a.rawBookingNumber !== b.rawBookingNumber) {
        return b.rawBookingNumber - a.rawBookingNumber;
      }
      return (b.rawId || b.id).localeCompare(a.rawId || a.id);
    });
  }, [categoryBookings, cardFilter, activeStatusFilter, channelFilter]);

  const handleBookingCreated = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
    setIsWizardOpen(false);
    setCreatedBookingToast(newBooking);
    refreshBookingsFromBackend();
  };

  const handlePartnerAssigned = (
    bookingId: string,
    technician: Technician | null,
    broadcastOffers?: BroadcastPartnerOffer[]
  ) => {
    const update = (b: Booking): Booking => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: technician
          ? b.status === "Pending" || b.status === "Waiting For Assignment"
            ? "Assigned"
            : b.status
          : broadcastOffers && broadcastOffers.length > 0
            ? "Assigned"
            : "Pending",
        technicianName: technician ? technician.name : broadcastOffers?.[0]?.technicianName,
        technicianId: technician ? technician.id : broadcastOffers?.[0]?.technicianId,
        broadcastOffers: broadcastOffers || b.broadcastOffers,
      };
    };

    setBookings((prev) => prev.map(update));
    setDrawerBooking((prev) => (prev && prev.id === bookingId ? update(prev) : prev));
  };

  const handleSimulatePartnerAcceptance = (bookingId: string, techId: string) => {
    const acceptingTech = initialTechnicians.find((t) => t.id === techId);
    const techName = acceptingTech?.name || "Partner";

    const update = (b: Booking): Booking => {
      if (b.id !== bookingId) return b;

      const updatedOffers = (b.broadcastOffers || []).map((offer) => {
        if (offer.technicianId === techId) {
          return { ...offer, status: "Accepted" as const, acceptedAt: "Just now" };
        }
        return {
          ...offer,
          status: "Offer Closed" as const,
        };
      });

      return {
        ...b,
        status: "Assigned",
        technicianId: techId,
        technicianName: techName,
        broadcastOffers: updatedOffers,
      };
    };

    setBookings((prev) => prev.map(update));
    setDrawerBooking((prev) => (prev && prev.id === bookingId ? update(prev) : prev));
  };

  const handleInspectionApproved = (bookingId: string, updatedQuote: number, remarks: string) => {
    setBookings(
      bookings.map((b) =>
        b.id === bookingId
          ? {
            ...b,
            basePrice: updatedQuote,
            totalAmount: Math.round(updatedQuote * 1.18 + 49),
            inspectionRemarks: remarks,
            status: "Customer Approval Pending",
          }
          : b
      )
    );
  };

  const handleJobCompleted = (
    bookingId: string,
    addOns?: SelectedAddOnItem[],
    addOnsBaseTotal?: number,
    addOnsGstTotal?: number,
    addOnsFinalTotal?: number
  ) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
            ...b,
            isOtpVerified: true,
            status: "Completed",
            completedAddOns: addOns || b.completedAddOns,
            addOnsBaseTotal: addOnsBaseTotal ?? b.addOnsBaseTotal,
            addOnsGstTotal: addOnsGstTotal ?? b.addOnsGstTotal,
            addOnsFinalTotal: addOnsFinalTotal ?? b.addOnsFinalTotal,
            totalAmount: b.totalAmount + (addOnsFinalTotal || 0),
          }
          : b
      )
    );
    router.push(`/billing/${bookingId}`);
  };

  const handleBookingUpdated = (updated: Booking) => {
    setBookings(bookings.map((b) => (b.id === updated.id ? updated : b)));
    setDrawerBooking((prev) => (prev && prev.id === updated.id ? updated : prev));
  };

  const formatSingleTimeSlot = (timeStr?: string) => {
    if (!timeStr) return "08:00 AM";
    const startPart = timeStr.split(/[-–—]| to /i)[0].trim();
    return startPart;
  };

  const columns = useMemo<Column<Booking>[]>(() => {
    const baseCols: Column<Booking>[] = [
      {
        key: "id",
        header: "Booking ID",
        sticky: "left",
        stickyLeftOffset: 44,
        className: "w-[140px] min-w-[140px] max-w-[140px]",
        accessor: (row) => {
          const catQuery = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : "";
          const displayId = row.bookingNumber || row.jobId || row.id;
          return (
            <button
              type="button"
              onClick={() => router.push(`/bookings/${row.id}${catQuery}`)}
              className="font-mono font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer text-xs"
            >
              {displayId}
            </button>
          );
        },
        sortable: true,
      },
      {
        key: "originChannel",
        header: "Origin",
        accessor: (row: Booking) => {
          const isOnline = isOnlineBooking(row);
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${isOnline
                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300"
                }`}
            >
              {isOnline ? <Globe className="w-3 h-3 text-purple-600" /> : <Building2 className="w-3 h-3 text-slate-500" />}
              <span>{isOnline ? "Online" : "Manual"}</span>
            </span>
          );
        },
        sortable: true,
      },
      {
        key: "technicianName",
        header: "Assign Partner",
        accessor: (row) => {
          return (
            <div className="flex items-center justify-between gap-2 max-w-[200px]">
              {row.technicianName ? (
                <>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 truncate" title={row.technicianName}>
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{row.technicianName}</span>
                    </div>
                    {row.technicianPhone && (
                      <div className="font-mono text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{row.technicianPhone}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setAssignBooking(row)}
                    title="Reassign Partner"
                    className="p-1.5 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                    Unassigned
                  </span>

                  <button
                    type="button"
                    onClick={() => setAssignBooking(row)}
                    title="Assign Partner"
                    className="p-1.5 rounded-xl text-brand-600 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/80 border border-brand-200 dark:border-brand-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </>
              )}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "date",
        header: "Working date",
        className: "w-[140px] min-w-[140px] whitespace-nowrap px-4",
        accessor: (row) => (
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatWorkingDate(row.date)}
          </span>
        ),
        sortable: true,
      },
      {
        key: "timeSlot",
        header: "Time",
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
            {formatSingleTimeSlot(row.timeSlot)}
          </span>
        ),
        sortable: true,
      },
      {
        key: "callingDate",
        header: "Calling date",
        accessor: (row) => <span className="text-slate-500 dark:text-slate-400 font-medium">{row.callingDate || "-"}</span>,
        sortable: true,
      },
      {
        key: "customerName",
        header: "Customer Name",
        className: "w-[170px] min-w-[170px] max-w-[170px]",
        accessor: (row: Booking) => {
          if (isOfficeAdmin) {
            return (
              <span className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[150px] block">
                {row.customerName}
              </span>
            );
          }
          const targetPath = row.customerId
            ? `/customers/${row.customerId}?from=${encodeURIComponent("/bookings")}`
            : `/customers?search=${encodeURIComponent(row.customerPhone || row.customerName)}`;
          return (
            <button
              type="button"
              onClick={() => router.push(targetPath)}
              className="font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 hover:underline text-left truncate max-w-[150px] block cursor-pointer"
              title={`View ${row.customerName} details`}
            >
              {row.customerName}
            </button>
          );
        },
        sortable: true,
      },
      {
        key: "customerPhone",
        header: "Contact no",
        accessor: (row: Booking) => <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">{row.customerPhone}</span>,
        sortable: true,
      },
      {
        key: "address",
        header: "Service Address Location",
        accessor: (row) => (
          <div className="max-w-[200px] truncate text-slate-700 dark:text-slate-300 font-medium" title={row.address || `${row.locality}, Varanasi`}>
            {row.address || `${row.locality}, Varanasi`}
          </div>
        ),
        sortable: true,
      },
      {
        key: "serviceTitle",
        header: "Multiple Services & Item Codes",
        accessor: (row) => (
          <div className="max-w-[240px] space-y-1 py-1" title={row.serviceTitle}>
            <div className="truncate font-semibold text-slate-900 dark:text-white text-xs">
              {row.serviceTitle}
            </div>
            {row.servicesList && row.servicesList.length > 0 ? (
              <div className="space-y-1">
                {row.servicesList.map((s, idx) => (
                  <div key={s.id || idx} className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-mono font-medium bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-200 shrink-0">
                      {s.serviceCode || `${row.bookingNumber || row.id}-${String(idx + 1).padStart(2, "0")}`}
                    </span>
                    <span className="truncate text-slate-600 dark:text-slate-300 font-medium">
                      {s.title} (x{s.quantity})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[10px] font-mono font-medium bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-1.5 py-0.2 rounded border border-brand-200">
                {row.bookingNumber || row.id}-01
              </span>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        key: "totalAmount",
        header: "Amount",
        accessor: (row) => <span className="font-semibold text-slate-900 dark:text-white">₹{row.totalAmount}</span>,
        sortable: true,
      },
      {
        key: "callingPerson",
        header: "Calling Person",
        accessor: (row) => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.callingPerson || "-"}</span>,
        sortable: true,
      },
      {
        key: "notes",
        header: "Remark",
        accessor: (row) => (
          <div className="max-w-[170px] truncate text-slate-500 italic" title={row.notes || row.inspectionRemarks || "-"}>
            {row.notes || row.inspectionRemarks || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "status",
        header: "Booking Status",
        accessor: (row) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider inline-flex items-center gap-1 ${row.status === "Completed"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                : row.status === "In Progress" || row.status === "Assigned"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                  : row.status === "Cancelled"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{row.status}</span>
            </span>
            {row.isArchived && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Archive className="w-2.5 h-2.5" />
                <span>Archived</span>
              </span>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        key: "handledBy",
        header: "Handel By",
        accessor: (row) => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.handledBy || "-"}</span>,
        sortable: true,
      },
      {
        key: "actions",
        header: "Actions",
        sticky: "right",
        accessor: (row) => (
          <RowActionMenu
            actions={
              isOfficeAdmin
                ? [
                  {
                    label: "View Details",
                    icon: Eye,
                    href: `/bookings/${row.id}${selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ""}`,
                  },
                  ...(row.isArchived
                    ? [
                      {
                        label: "Restore Booking",
                        icon: ArchiveRestore,
                        onClick: () => handleRestoreBooking(row),
                      },
                    ]
                    : []),
                ]
                : [
                  ...(row.isArchived
                    ? [
                      {
                        label: "Restore Booking",
                        icon: ArchiveRestore,
                        onClick: () => handleRestoreBooking(row),
                      },
                    ]
                    : [
                      {
                        label: row.technicianName ? "Reassign Partner" : "Assign Partner",
                        icon: UserPlus,
                        onClick: () => setAssignBooking(row),
                      },
                      {
                        label: "Reschedule",
                        icon: CalendarCheck,
                        onClick: () => setReschedulingBooking(row),
                      },
                      {
                        label: "Invoice",
                        icon: FileText,
                        href: `/billing/${row.id}`,
                      },
                    ]),
                  {
                    label: "View",
                    icon: Eye,
                    href: `/bookings/${row.id}${selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ""}`,
                  },
                  ...(!row.isArchived
                    ? [
                      {
                        label: "Edit",
                        icon: Edit2,
                        onClick: () => setEditingBooking(row),
                      },
                      ...(row.status === "Assigned" || row.status === "In Progress"
                        ? [
                          {
                            label: "Mark Completed",
                            icon: CheckCircle2,
                            onClick: () => handleMarkBookingCompleted(row),
                          },
                        ]
                        : []),
                      ...(row.status !== "Completed" && row.status !== "Cancelled"
                        ? [
                          {
                            label: "Cancel Booking",
                            icon: Ban,
                            onClick: () => handleCancelBooking(row),
                          },
                        ]
                        : []),
                      {
                        label: "Archive Booking",
                        icon: Archive,
                        onClick: () => handleArchiveBooking(row),
                      },
                    ]
                    : []),
                ]
            }
          />
        ),
        sortable: false,
      },
    ];
    return baseCols;
  }, [isOfficeAdmin, selectedCategory, router]);

  const showTableView = Boolean(selectedCategory || bookingTypeParam || statusParam);

  const selectedCatStat = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") return null;
    return categoryStatsList.find(
      (c) => c.name.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
    );
  }, [selectedCategory, categoryStatsList]);

  const isChannelFiltered = channelFilter !== "ALL";

  const totalCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.length;
    }
    if (selectedCatStat) {
      return selectedCatStat.count;
    }
    return roleFilteredBookings.length > 0
      ? roleFilteredBookings.length
      : (allCategoryStats?.totalBookings ?? dashboardStats?.totalBookings ?? dashboardStats?.total ?? categoryBookings.length);
  }, [isChannelFiltered, filteredBookings.length, selectedCatStat, roleFilteredBookings.length, allCategoryStats, dashboardStats, categoryBookings.length]);

  const unassignedCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.filter((b) => !b.technicianName).length;
    }
    if (selectedCatStat) {
      return selectedCatStat.unassigned;
    }
    return (
      allCategoryStats?.openBookings ??
      dashboardStats?.pendingBookings ??
      dashboardStats?.openBookings ??
      dashboardStats?.unassigned ??
      dashboardStats?.waitingPartner ??
      dashboardStats?.pending ??
      categoryBookings.filter((b) => !b.technicianName).length
    );
  }, [isChannelFiltered, filteredBookings, selectedCatStat, allCategoryStats, dashboardStats, categoryBookings]);

  const inProgressCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.filter((b) => b.status === "In Progress" || b.status === "Assigned" || b.status === "Partner Accepted").length;
    }
    if (selectedCatStat) {
      return selectedCatStat.inProgress;
    }
    return (
      allCategoryStats?.activeBookings ??
      dashboardStats?.partnerAssignedBookings ??
      dashboardStats?.activeBookings ??
      dashboardStats?.inProgress ??
      dashboardStats?.active ??
      categoryBookings.filter((b) => b.status === "In Progress" || b.status === "Assigned" || b.status === "Partner Accepted").length
    );
  }, [isChannelFiltered, filteredBookings, selectedCatStat, allCategoryStats, dashboardStats, categoryBookings]);

  const completedCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.filter((b) => b.status === "Completed").length;
    }
    if (selectedCatStat) {
      return selectedCatStat.completed;
    }
    return (
      allCategoryStats?.completedBookings ??
      dashboardStats?.completedBookings ??
      dashboardStats?.completed ??
      dashboardStats?.closed ??
      categoryBookings.filter((b) => b.status === "Completed").length
    );
  }, [isChannelFiltered, filteredBookings, selectedCatStat, allCategoryStats, dashboardStats, categoryBookings]);

  const cancelledCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.filter((b) => b.status === "Cancelled" || b.status === "Rejected").length;
    }
    if (selectedCatStat) {
      return selectedCatStat.cancelled;
    }
    return (
      allCategoryStats?.cancelledBookings ??
      dashboardStats?.cancelledBookings ??
      dashboardStats?.cancelled ??
      dashboardStats?.rejected ??
      categoryBookings.filter((b) => b.status === "Cancelled" || b.status === "Rejected").length
    );
  }, [isChannelFiltered, filteredBookings, selectedCatStat, allCategoryStats, dashboardStats, categoryBookings]);

  const filteredDropdownCategories = useMemo(() => {
    const q = dropdownSearch.toLowerCase().trim();
    return categoryStatsList
      .slice()
      .sort((a, b) => {
        const aIsPinned = Boolean(a.isPinned);
        const bIsPinned = Boolean(b.isPinned);
        if (aIsPinned && bIsPinned) return 0;
        if (aIsPinned) return -1;
        if (bIsPinned) return 1;
        return a.name.localeCompare(b.name);
      })
      .filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [categoryStatsList, dropdownSearch]);

  return (
    <div className="space-y-6">
      {!showTableView ? (
        isLoadingData && categoryStatsList.length === 0 ? (
          <CategoryCardsShimmer />
        ) : (
          /* ─── VIEW 1: CATEGORY SELECTION HUB (ONLY CATEGORIES SHOWN) ─── */
          <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-brand-600" />
                <span>Bookings</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             

              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Booking</span>
              </button>
            </div>
          </div>

          {/* ─── TOP STRIP: ALL SERVICE CATEGORIES ─── */}
          <div
            onClick={() => handleSelectCategory("All")}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Icon + Title + Description */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Grid className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                      All Service Categories
                    </h2>
                    <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {totalCardCount} Total Orders
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle / Right: 4-Stat Pills + Direct Open Action */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="py-1 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] font-medium uppercase text-amber-600 dark:text-amber-400 block leading-tight tracking-wide">
                      Open
                    </span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {unassignedCardCount}
                    </span>
                  </div>
                  <div className="py-1 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] font-medium uppercase text-blue-600 dark:text-blue-400 block leading-tight tracking-wide">
                      Active
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {inProgressCardCount}
                    </span>
                  </div>
                  <div className="py-1 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] font-medium uppercase text-emerald-600 dark:text-emerald-400 block leading-tight tracking-wide">
                      Done
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {completedCardCount}
                    </span>
                  </div>
                  <div className="py-1 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] font-medium uppercase text-rose-600 dark:text-rose-400 block leading-tight tracking-wide">
                      Cancel
                    </span>
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {cancelledCardCount}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform pl-2">
                  <span>Open Master Table</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION 2: SERVICE CATEGORIES (REARRANGED ACCORDING TO PIN - MAX 3 PINNED) ─── */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Service Categories
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {categoryStatsList.length} Categories
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {categoryStatsList.filter((c) => Boolean(c.isPinned)).length}/3 Pinned (rearranged on top)
                  </span>
                </span>
              </div>
            </div>

            {/* Grid of slim category cards rearranged according to pin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryStatsList
                .slice()
                .sort((a, b) => {
                  const aIsPinned = Boolean(a.isPinned);
                  const bIsPinned = Boolean(b.isPinned);

                  if (aIsPinned && bIsPinned) {
                    const aPinnedIndex = pinnedCategories.indexOf(a.name);
                    const bPinnedIndex = pinnedCategories.indexOf(b.name);
                    if (aPinnedIndex !== -1 && bPinnedIndex !== -1) {
                      return aPinnedIndex - bPinnedIndex;
                    }
                    return 0;
                  }
                  if (aIsPinned) return -1;
                  if (bIsPinned) return 1;
                  return 0;
                })
                .map((cat) => {
                  const isPinned = Boolean(cat.isPinned);

                  return (
                    <div
                      key={cat.name}
                      onClick={() => handleSelectCategory(cat.name)}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                        isPinned
                          ? "bg-gradient-to-br from-amber-50/30 via-white to-white dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-700/70 hover:border-amber-500 hover:shadow-md shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md"
                      }`}
                    >
                      <div>
                        {/* Header Row: Icon + Title/Pinned (in place of Service Category to reduce space) & Orders Count + Pin Button */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <BookingCategoryIcon
                              iconUrl={cat.iconUrl}
                              name={cat.name}
                              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80"
                              imgClassName="w-full h-full object-contain p-1"
                            />
                            <div className="min-w-0 flex-1">
                              <h3
                                className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors truncate"
                                title={cat.name}
                              >
                                {cat.name}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                                isPinned
                                  ? "bg-amber-100/60 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {cat.count} Orders
                            </span>

                            <button
                              type="button"
                              disabled={pinLoadingCat === cat.name}
                              onClick={(e) => togglePinCategory(cat.name, e, cat.id)}
                              title={
                                pinLoadingCat === cat.name
                                  ? "Updating pin..."
                                  : isPinned
                                  ? "Unpin category"
                                  : categoryStatsList.filter((c) => Boolean(c.isPinned)).length >= 3
                                  ? "Pin limit reached (max 3)"
                                  : "Pin to top (max 3)"
                              }
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isPinned
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/80 border border-amber-300/80 dark:border-amber-700"
                                  : "text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100"
                              } disabled:opacity-50`}
                            >
                              {pinLoadingCat === cat.name ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              ) : (
                                <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-current" : ""}`} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Status indicators (slim 4-pill row) */}
                        <div className="grid grid-cols-4 gap-1.5 text-center mt-3">
                          <div className="py-1 px-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[8px] font-medium text-amber-600 dark:text-amber-400 block uppercase leading-none tracking-wide">
                              Open
                            </span>
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5 block">
                              {cat.unassigned}
                            </span>
                          </div>
                          <div className="py-1 px-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[8px] font-medium text-blue-600 dark:text-blue-400 block uppercase leading-none tracking-wide">
                              Active
                            </span>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 block">
                              {cat.inProgress}
                            </span>
                          </div>
                          <div className="py-1 px-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400 block uppercase leading-none tracking-wide">
                              Done
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                              {cat.completed}
                            </span>
                          </div>
                          <div className="py-1 px-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[8px] font-medium text-rose-600 dark:text-rose-400 block uppercase leading-none tracking-wide">
                              Cancel
                            </span>
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block">
                              {cat.cancelled}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Open {cat.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        )
      ) : (
        /* ─── VIEW 2: SELECTED CATEGORY OPERATIONS TABLE (NEXT PAGE VIEW) ─── */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectCategory(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-brand-600" />
                  <span>Back to Hub</span>
                </button>

                {/* CATEGORY SWITCH DROPDOWN TRIGGER ON TITLE */}
                <div className="relative inline-block" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen((prev) => !prev);
                      setDropdownSearch("");
                    }}
                    className="inline-flex items-center gap-2 px-2.5 py-1 -ml-1 rounded-xl text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 select-none"
                    title="Click to switch category without leaving table"
                  >
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                      {!selectedCategory || selectedCategory === "All"
                        ? "All Bookings Directory"
                        : `${selectedCategory} Operations`}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-transform duration-200 shrink-0 ${
                        isCategoryDropdownOpen ? "rotate-180 text-brand-600" : ""
                      }`}
                    />
                  </button>

                  {/* FLOATING CATEGORY DROPDOWN MENU */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* Search box inside dropdown */}
                      <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            placeholder="Filter categories..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Dropdown Options List */}
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 no-scrollbar">
                        {/* Option 1: All Service Categories */}
                        {(!dropdownSearch || "all service categories".includes(dropdownSearch.toLowerCase()) || "all bookings".includes(dropdownSearch.toLowerCase())) && (
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectCategory("All");
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-xs font-bold transition-colors cursor-pointer ${
                              !selectedCategory || selectedCategory === "All"
                                ? "bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <Grid className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 truncate">
                                <span className="block truncate font-extrabold">All Service Categories</span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {totalCardCount} Total Orders
                                </span>
                              </div>
                            </div>
                            {(!selectedCategory || selectedCategory === "All") && (
                              <Check className="w-4 h-4 text-brand-600 shrink-0" />
                            )}
                          </button>
                        )}

                        {/* Category items */}
                        {filteredDropdownCategories.map((cat) => {
                          const isSelected = selectedCategory === cat.name;
                          const isPinned = Boolean(cat.isPinned);
                          return (
                            <button
                              key={cat.name}
                              type="button"
                              onClick={() => {
                                handleSelectCategory(cat.name);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-xs font-bold transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300"
                                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg ${
                                    cat.name.toLowerCase().includes("ac")
                                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
                                      : cat.name.toLowerCase().includes("electr")
                                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                      : cat.name.toLowerCase().includes("plumb")
                                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                                      : cat.name.toLowerCase().includes("clean")
                                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                      : "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                                  } flex items-center justify-center shrink-0`}
                                >
                                  {cat.name.toLowerCase().includes("ac") ? (
                                    <Wrench className="w-3.5 h-3.5" />
                                  ) : cat.name.toLowerCase().includes("electr") ? (
                                    <Zap className="w-3.5 h-3.5" />
                                  ) : cat.name.toLowerCase().includes("plumb") ? (
                                    <Droplets className="w-3.5 h-3.5" />
                                  ) : cat.name.toLowerCase().includes("clean") ? (
                                    <SprayCan className="w-3.5 h-3.5" />
                                  ) : (
                                    <Calendar className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div className="min-w-0 truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate font-semibold">{cat.name}</span>
                                    {isPinned && (
                                      <span title="Pinned Category">
                                        <Pin className="w-2.5 h-2.5 text-amber-500 fill-current shrink-0" />
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {cat.count} orders {cat.unassigned > 0 ? `• ${cat.unassigned} open` : ""}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-brand-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}

                        {filteredDropdownCategories.length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No matching categories found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const nextMode = !viewArchiveMode;
                  setViewArchiveMode(nextMode);
                  if (nextMode) fetchArchivedBookings();
                }}
                className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto ${
                  viewArchiveMode
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                {viewArchiveMode ? (
                  <>
                    <ArchiveRestore className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>View Active Bookings</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>View Archived ({archivedBookings.length})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Booking</span>
              </button>
            </div>
          </div>

          {/* ARCHIVE NOTICE BANNER */}
          {viewArchiveMode && (
            <div className="p-3.5 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5 font-bold">
                <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Viewing Archived Bookings ({categoryBookings.length}). Archived bookings are hidden from active dispatches and metrics.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewArchiveMode(false)}
                className="px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-extrabold cursor-pointer transition-colors shrink-0"
              >
                Return to Active Bookings
              </button>
            </div>
          )}

          {/* 5 KPI Status Summary Cards for the active category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              type="button"
              onClick={() => {
                setCardFilter("ALL");
                setActiveStatusFilter("All");
                updateBookingFilters("", "");
              }}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${cardFilter === "ALL"
                ? "bg-indigo-500/10 dark:bg-indigo-950/40 border-2 border-indigo-500 shadow-md scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Total Bookings</span>
                {cardFilter === "ALL" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500 text-white">Active</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {totalCardCount} Orders
              </h3>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextStatus = statusParam === "pending" ? "" : "pending";
                updateBookingFilters(undefined, nextStatus);
              }}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${cardFilter === "UNASSIGNED"
                ? "bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500 shadow-md scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Waiting Partner</span>
                {cardFilter === "UNASSIGNED" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500 text-white">Filtered</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {unassignedCardCount} Unassigned
              </h3>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextStatus = statusParam === "partner_assigned" ? "" : "partner_assigned";
                updateBookingFilters(undefined, nextStatus);
              }}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${cardFilter === "IN_PROGRESS"
                ? "bg-blue-500/10 dark:bg-blue-950/40 border-2 border-blue-500 shadow-md scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">In Progress</span>
                {cardFilter === "IN_PROGRESS" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500 text-white">Filtered</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {inProgressCardCount} Jobs
              </h3>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextStatus = statusParam === "completed" ? "" : "completed";
                updateBookingFilters(undefined, nextStatus);
              }}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${cardFilter === "COMPLETED"
                ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-md scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed Jobs</span>
                {cardFilter === "COMPLETED" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500 text-white">Filtered</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {completedCardCount} Closed
              </h3>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextStatus = statusParam === "cancelled" ? "" : "cancelled";
                updateBookingFilters(undefined, nextStatus);
              }}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${cardFilter === "CANCELLED"
                ? "bg-rose-500/10 dark:bg-rose-950/40 border-2 border-rose-500 shadow-md scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 hover:shadow-sm"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Cancelled Jobs</span>
                {cardFilter === "CANCELLED" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500 text-white">Filtered</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {cancelledCardCount} Cancelled
              </h3>
            </button>
          </div>

          {/* Main DataTable with Table-Level Origin Filter */}
          <DataTable
            columns={columns}
            data={filteredBookings}
            isLoading={isLoadingData}
            searchPlaceholder="Search order #, customer, partner, or phone..."
            extraFilters={
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Origin Channels */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => updateBookingFilters("", undefined)}
                    className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${channelFilter === "ALL"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                      }`}
                  >
                    All Origins ({categoryBookings.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => updateBookingFilters(bookingTypeParam === "online" ? "" : "online", undefined)}
                    className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${channelFilter === "ONLINE"
                      ? "bg-purple-600 text-white shadow-xs font-semibold"
                      : "text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 font-medium"
                      }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Online Booking ({categoryBookings.filter(isOnlineBooking).length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateBookingFilters(bookingTypeParam === "manual" ? "" : "manual", undefined)}
                    className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${channelFilter === "MANUAL"
                      ? "bg-slate-800 text-white shadow-xs font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
                      }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Manual Booking ({categoryBookings.filter((b) => !isOnlineBooking(b)).length})</span>
                  </button>
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* MODALS */}
      <BookingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onBookingCreated={handleBookingCreated}
      />

      <AssignPartnerModal
        booking={assignBooking}
        isOpen={!!assignBooking}
        onClose={() => setAssignBooking(null)}
        onPartnerAssigned={handlePartnerAssigned}
        onSimulateAcceptance={handleSimulatePartnerAcceptance}
      />

      <InspectionFlowModal
        booking={inspectionBooking}
        isOpen={!!inspectionBooking}
        onClose={() => setInspectionBooking(null)}
        onInspectionApproved={handleInspectionApproved}
      />

      <OtpVerificationModal
        booking={otpBooking}
        isOpen={!!otpBooking}
        onClose={() => setOtpBooking(null)}
        onJobCompleted={handleJobCompleted}
      />

      <EditBookingModal
        isOpen={Boolean(editingBooking)}
        booking={editingBooking}
        onClose={() => setEditingBooking(null)}
        onBookingUpdated={handleBookingUpdated}
      />

      <RescheduleBookingModal
        isOpen={Boolean(reschedulingBooking)}
        booking={reschedulingBooking}
        onClose={() => setReschedulingBooking(null)}
        onReschedule={handleRescheduleBooking}
      />

      <BookingDetailsDrawer
        booking={drawerBooking}
        isOpen={!!drawerBooking}
        onClose={() => setDrawerBooking(null)}
        onAssignPartner={(b) => setAssignBooking(b)}
      />

      <ArchiveBookingModal
        isOpen={Boolean(archiveTargetBooking)}
        booking={archiveTargetBooking}
        onClose={() => setArchiveTargetBooking(null)}
        onConfirm={handleConfirmArchive}
      />

      <CancelBookingModal
        isOpen={Boolean(cancelTargetBooking)}
        booking={cancelTargetBooking}
        onClose={() => setCancelTargetBooking(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* RIGHT BOTTOM POPUP: CREATED BOOKING INVOICE TOAST */}
      {createdBookingToast && (
        <Portal>
          <div className="fixed bottom-6 right-6 z-[9999999] max-w-sm w-full bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-slate-800 ring-1 ring-slate-700/50 animate-in slide-in-from-bottom-5 duration-300 outline-none">
            <button
              type="button"
              onClick={() => setCreatedBookingToast(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>

              <div className="space-y-1.5 pr-6 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Booking Confirmed
                  </span>
                  <span className="font-mono text-[11px] font-extrabold text-slate-300">
                    {createdBookingToast.bookingNumber || createdBookingToast.id}
                  </span>
                </div>

                <h4 className="font-extrabold text-xs text-white truncate">
                  {createdBookingToast.customerName}
                </h4>

                <p className="text-[11px] text-slate-400">
                  {createdBookingToast.serviceTitle} •{" "}
                  <strong className="text-emerald-400 font-extrabold">
                    ₹{(createdBookingToast.totalAmount || 0).toLocaleString()}
                  </strong>
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const bId = createdBookingToast.id;
                      setCreatedBookingToast(null);
                      router.push(`/billing/${bId}`);
                    }}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl shadow-lux flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>See Invoice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── HIDDEN PRINT CANVAS ─── */}
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

      {printTargetBooking && (
        <Portal>
          <div
            id="printable-tax-invoice-portal"
            className="hidden print:block p-0 rounded-3xl bg-white text-black space-y-4 w-full"
          >
            {/* Header */}
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
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-black border border-slate-300">
                      Varanasi HQ
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-700 font-medium">
                    Sigra Main Road, Near Cantt Railway Station, Varanasi - 221002
                  </p>
                  <p className="text-[10px] font-mono text-slate-700 font-bold">
                    GSTIN: 09AAACH8819Q1ZM • Support: +91 99350 98765
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end text-right space-y-1 shrink-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-black font-extrabold text-[10px] border border-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                  <span>OFFICIAL GST TAX INVOICE</span>
                </div>

                <div className="font-mono text-xs font-black text-black bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                  Invoice No: <span className="text-black font-extrabold">{formatInvoiceNumber(printTargetBooking.bookingNumber || printTargetBooking.id)}</span>
                </div>

                <div className="text-[10px] text-slate-600 font-semibold">
                  Invoice Date: <span className="font-bold text-black">{printTargetBooking.date || "Today"}</span>
                </div>
              </div>
            </div>

            {/* Customer & Billing Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">
                  Billed To (Customer Details)
                </span>
                <div className="font-extrabold text-black text-xs">
                  {printTargetBooking.customerName}
                </div>
                <div className="text-slate-800 font-medium text-[10px]">
                  {printTargetBooking.address || `${printTargetBooking.locality}, Varanasi`}
                </div>
                <div className="font-bold text-slate-900 text-[10px]">
                  Phone: {printTargetBooking.customerPhone}
                </div>
                {printTargetBooking.customerGstin && (
                  <div className="font-mono font-bold text-black bg-slate-100 p-0.5 rounded border border-slate-300 text-[9px] w-fit">
                    B2B GSTIN: {printTargetBooking.customerGstin}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">
                  Service & Payment Details
                </span>
                <div className="font-extrabold text-black text-xs">
                  Service: {printTargetBooking.serviceTitle}
                </div>
                <div className="text-slate-800 font-medium text-[10px]">
                  Category: {printTargetBooking.category}
                </div>
                <div className="font-bold text-slate-900 text-[10px]">
                  Payment Method: {printTargetBooking.paymentMethod || "UPI / Digital Prepaid"}
                </div>
                <div className="font-bold text-emerald-700 flex items-center gap-1 text-[10px]">
                  ✓ Payment Status: {printTargetBooking.paymentStatus || "Paid"}
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
                    <th className="pb-1.5 text-right">CGST (9%)</th>
                    <th className="pb-1.5 text-right">SGST (9%)</th>
                    <th className="pb-1.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-black">
                  <tr>
                    <td className="py-2">
                      <div className="font-extrabold text-xs">{printTargetBooking.serviceTitle}</div>
                      <div className="text-[10px] text-slate-600 font-normal">
                        Standard Varanasi Home Service Rate Card
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-xs">₹{printTargetBooking.basePrice || 699}</td>
                    <td className="py-2 text-right font-mono text-slate-700 text-xs">₹{printTargetBooking.cgst || Math.round((printTargetBooking.basePrice || 699) * 0.09)}</td>
                    <td className="py-2 text-right font-mono text-slate-700 text-xs">₹{printTargetBooking.sgst || Math.round((printTargetBooking.basePrice || 699) * 0.09)}</td>
                    <td className="py-2 text-right font-mono font-extrabold text-black text-xs">
                      ₹{(printTargetBooking.basePrice || 699) + (printTargetBooking.cgst || Math.round((printTargetBooking.basePrice || 699) * 0.09)) + (printTargetBooking.sgst || Math.round((printTargetBooking.basePrice || 699) * 0.09))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">
                      <div className="font-bold text-xs">Platform Convenience & Safety Insurance Fee</div>
                      <div className="text-[10px] text-slate-600 font-normal">
                        HelpMate Safety Insurance & Tech Assignment
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-xs">₹{printTargetBooking.convenienceFee || 49}</td>
                    <td className="py-2 text-right font-mono text-slate-700 text-xs">₹0</td>
                    <td className="py-2 text-right font-mono text-slate-700 text-xs">₹0</td>
                    <td className="py-2 text-right font-mono font-bold text-xs">₹{printTargetBooking.convenienceFee || 49}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax Summary & Total Box */}
            <div className="flex flex-row justify-between items-start gap-4 border-t border-slate-300 pt-3">
              <div className="text-[10px] text-slate-600 space-y-0.5 max-w-sm">
                <span className="font-extrabold text-black block text-xs">Terms & Conditions</span>
                <p>1. Invoice generated under GST Act 2017 for Varanasi Jurisdiction.</p>
                <p>2. Standard terms apply to Home Maintenance & Repair Services.</p>
              </div>

              <div className="w-60 p-2.5 rounded-xl bg-slate-50 border border-slate-300 space-y-1 text-xs">
                <div className="flex justify-between py-0.5 border-b border-slate-300 text-slate-800 text-[11px]">
                  <span>Base Subtotal</span>
                  <span className="font-mono font-bold">₹{(printTargetBooking.basePrice || 699) + (printTargetBooking.convenienceFee || 49)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-300 text-slate-800 text-[11px]">
                  <span>CGST (9%)</span>
                  <span className="font-mono font-bold">₹{printTargetBooking.cgst || Math.round((printTargetBooking.basePrice || 699) * 0.09)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-300 text-slate-800 text-[11px]">
                  <span>SGST (9%)</span>
                  <span className="font-mono font-bold">₹{printTargetBooking.sgst || Math.round((printTargetBooking.basePrice || 699) * 0.09)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-xs font-black text-black">
                  <span>Grand Total</span>
                  <span className="font-mono text-emerald-700 font-bold text-xs">₹{printTargetBooking.totalAmount || 873}</span>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ARCHIVE / RESTORE TOAST NOTIFICATION: Handled by unified top ToastContainer */}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<TableShimmer />}>
      <BookingsPageContent />
    </Suspense>
  );
}
