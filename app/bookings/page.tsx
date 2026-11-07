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
  Hash,
  Clock,
  CalendarDays,
  User,
  IndianRupee,
  PhoneCall,
  UserCheck,
  MoreVertical,
  MapPin,
  Table,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { toast } from "@/components/Toast";
import {
  getUnopenedBookingIds,
  addNewBooking,
  addNewBookings,
  markBookingAsOpened,
  subscribeToNewBookings,
} from "@/lib/newBookingTracker";
import { BookingWizardModal } from "@/components/bookings/BookingWizardModal";
import { AssignPartnerModal } from "@/components/bookings/AssignPartnerModal";
import { InspectionFlowModal } from "@/components/bookings/InspectionFlowModal";
import { OtpVerificationModal } from "@/components/bookings/OtpVerificationModal";
import { EditBookingModal } from "@/components/bookings/EditBookingModal";
import { BookingDetailsDrawer } from "@/components/bookings/BookingDetailsDrawer";
import { RescheduleBookingModal } from "@/components/bookings/RescheduleBookingModal";
import { ArchiveBookingModal } from "@/components/bookings/ArchiveBookingModal";
import { CancelBookingModal } from "@/components/bookings/CancelBookingModal";
import { BookingCalendarView } from "@/components/bookings/BookingCalendarView";
import { useRbac } from "@/context/RbacContext";
import { getBookingCategoriesApi, getBookingsApi, completeBookingApi, ApiBookingCategoryStat, archiveBookingApi, restoreBookingApi, cancelBookingApi, pinCategoryApi, formatImageUrl, getCategoriesApi } from "@/lib/api";
import { isImagePreloaded, preloadImage, preloadImages, storeDataUrl, getStoredDataUrl, cacheImageDataUrl } from "@/lib/imageCache";
import { mapApiBooking } from "@/lib/bookingMapper";

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

function areBookingsEqual(a: Booking[], b: Booking[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (!itemA || !itemB) return false;
    if (
      itemA.id !== itemB.id ||
      itemA.status !== itemB.status ||
      itemA.technicianId !== itemB.technicianId ||
      itemA.technicianName !== itemB.technicianName ||
      itemA.date !== itemB.date ||
      itemA.timeSlot !== itemB.timeSlot ||
      Boolean(itemA.isArchived) !== Boolean(itemB.isArchived) ||
      itemA.totalAmount !== itemB.totalAmount ||
      itemA.category !== itemB.category
    ) {
      return false;
    }
  }
  return true;
}

function areCategoryStatsEqual(a: ApiBookingCategoryStat[], b: ApiBookingCategoryStat[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const catA = a[i];
    const catB = b[i];
    if (!catA || !catB) return false;
    if (
      (catA._id || "") !== (catB._id || "") ||
      (catA.categoryName || (catA as any).name || "") !== (catB.categoryName || (catB as any).name || "") ||
      Boolean(catA.isPinned) !== Boolean(catB.isPinned) ||
      Number(catA.totalBookings ?? 0) !== Number(catB.totalBookings ?? 0) ||
      Number(catA.openBookings ?? 0) !== Number(catB.openBookings ?? 0) ||
      Number(catA.activeBookings ?? 0) !== Number(catB.activeBookings ?? 0) ||
      Number(catA.completedBookings ?? 0) !== Number(catB.completedBookings ?? 0) ||
      Number(catA.cancelledBookings ?? 0) !== Number(catB.cancelledBookings ?? 0)
    ) {
      return false;
    }
  }
  return true;
}

function areAllStatsEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Number(a.totalBookings ?? 0) === Number(b.totalBookings ?? 0) &&
    Number(a.openBookings ?? 0) === Number(b.openBookings ?? 0) &&
    Number(a.activeBookings ?? 0) === Number(b.activeBookings ?? 0) &&
    Number(a.completedBookings ?? 0) === Number(b.completedBookings ?? 0) &&
    Number(a.cancelledBookings ?? 0) === Number(b.cancelledBookings ?? 0)
  );
}

function preStoreBookingDetail(b: Booking) {
  if (typeof window !== "undefined") {
    try {
      const keys = [b.id, b.bookingNumber, (b as any)._id, (b as any).jobId].filter(Boolean);
      const payload = JSON.stringify({ mapped: b, raw: (b as any).rawApiBooking || b });
      keys.forEach((k) => {
        sessionStorage.setItem(`booking_detail_${String(k).toLowerCase().trim()}`, payload);
      });
    } catch {}
  }
}

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("category");
  const bookingTypeParam = searchParams?.get("bookingType");
  const statusParam = searchParams?.get("status");
  const viewParam = searchParams?.get("view");
  const tabParam = searchParams?.get("tab");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => categoryParam || null);

  useEffect(() => {
    setSelectedCategory(categoryParam || null);
  }, [categoryParam]);
  const { role, canView, canCreate, canEdit, canDelete } = useRbac();
  const isOfficeAdmin = role === "Office Admin";

  const cacheKey = `bookings:${bookingTypeParam || ""}:${statusParam || ""}`;
  const initialCachedBookings = getStoredModuleData<Booking[]>(cacheKey) || getStoredModuleData<Booking[]>("bookings");
  const initialCachedCats = getStoredModuleData<ApiBookingCategoryStat[]>("booking_categories");
  const initialCachedAllStats = getStoredModuleData<any>("booking_categories_all");
  const initialCachedArchivedBookings = getStoredModuleData<Booking[]>("archived_bookings");
  const [bookings, setBookings] = useState<Booking[]>(() => initialCachedBookings || []);
  const bookingsRef = useRef<Booking[]>(bookings);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  // Track unopened/new bookings
  const [unopenedBookingIds, setUnopenedBookingIds] = useState<Set<string>>(() => getUnopenedBookingIds());

  useEffect(() => {
    setUnopenedBookingIds(getUnopenedBookingIds());
    return subscribeToNewBookings(() => {
      setUnopenedBookingIds(getUnopenedBookingIds());
    });
  }, []);

  // Set of category names / IDs (lowercased) that currently have unopened new bookings
  const categoriesWithUnopened = useMemo(() => {
    if (unopenedBookingIds.size === 0) return new Set<string>();
    const set = new Set<string>();
    bookings.forEach((b) => {
      const isUnopened =
        unopenedBookingIds.has(String(b.id)) ||
        (b.bookingNumber && unopenedBookingIds.has(String(b.bookingNumber))) ||
        ((b as any)._id && unopenedBookingIds.has(String((b as any)._id)));
      if (isUnopened) {
        if (b.category) {
          set.add(b.category.toLowerCase().trim());
        }
        if ((b as any).categoryName) {
          set.add(String((b as any).categoryName).toLowerCase().trim());
        }
        if ((b as any).categoryId) {
          set.add(String((b as any).categoryId).toLowerCase().trim());
        }
      }
    });
    return set;
  }, [bookings, unopenedBookingIds]);
  const [apiCategories, setApiCategories] = useState<ApiBookingCategoryStat[]>(() => initialCachedCats || []);
  const [allCategoryStats, setAllCategoryStats] = useState<any>(() => initialCachedAllStats || null);
  const [isLoadingData, setIsLoadingData] = useState(() => !(
    (isModuleCacheFresh("booking_categories") && initialCachedCats && initialCachedCats.length > 0) ||
    ((isModuleCacheFresh(cacheKey) || isModuleCacheFresh("bookings")) && initialCachedBookings && initialCachedBookings.length > 0)
  ));
  const [viewArchiveMode, setViewArchiveMode] = useState<boolean>(() => tabParam === "archive");
  const [isCalendarView, setIsCalendarView] = useState<boolean>(() => viewParam === "calendar");
  const [archivedBookings, setArchivedBookings] = useState<Booking[]>(() => initialCachedArchivedBookings || []);
  const [isLoadingArchived, setIsLoadingArchived] = useState<boolean>(false);
  const [archiveTargetBooking, setArchiveTargetBooking] = useState<Booking | null>(null);
  const [cancelTargetBooking, setCancelTargetBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setIsCalendarView(viewParam === "calendar");
  }, [viewParam]);

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
    if (selectedCategory) {
      params.set("category", selectedCategory);
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

  const fetchArchivedBookings = useCallback(async (force: boolean = false) => {
    // If not forced and already fresh in moduleCache, use cached data and DO NOT call API
    if (!force && isModuleCacheFresh("archived_bookings")) {
      const cached = getStoredModuleData<Booking[]>("archived_bookings");
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setArchivedBookings((prev) => (areBookingsEqual(prev, cached) ? prev : cached));
        setIsLoadingArchived(false);
        return;
      }
    }

    if (archivedBookings.length === 0 && !isModuleCacheFresh("archived_bookings")) {
      setIsLoadingArchived(true);
    }
    try {
      const res = await getBookingsApi({ archived: true, forceRefresh: force });
      if (res && res.success && Array.isArray(res.data)) {
        const mappedList: Booking[] = res.data.map(mapApiBooking);
        setCachedModuleData("archived_bookings", mappedList);
        setArchivedBookings((prev) => (areBookingsEqual(prev, mappedList) ? prev : mappedList));
      }
    } catch (err) {
      console.error("Error fetching archived bookings:", err);
    } finally {
      setIsLoadingArchived(false);
    }
  }, [archivedBookings.length]);

  useEffect(() => {
    const isArchived = tabParam === "archive";
    setViewArchiveMode(isArchived);
    if (isArchived && !isModuleCacheFresh("archived_bookings")) {
      fetchArchivedBookings(false);
    }
  }, [tabParam, fetchArchivedBookings]);

  const getReturnUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      if (isCalendarView) {
        search.set("view", "calendar");
      } else {
        search.delete("view");
      }
      if (selectedCategory) {
        search.set("category", selectedCategory);
      }
      if (viewArchiveMode) {
        search.set("tab", "archive");
      } else {
        search.delete("tab");
      }
      const query = search.toString();
      return `/bookings${query ? `?${query}` : ""}`;
    }
    const params = new URLSearchParams();
    if (isCalendarView) params.set("view", "calendar");
    if (selectedCategory) params.set("category", selectedCategory);
    if (viewArchiveMode) params.set("tab", "archive");
    const query = params.toString();
    return `/bookings${query ? `?${query}` : ""}`;
  }, [isCalendarView, selectedCategory, viewArchiveMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("helpmate_last_admin_path", getReturnUrl());
      } catch {}
    }
  }, [getReturnUrl]);

  const handleToggleViewMode = (calendar: boolean) => {
    setIsCalendarView(calendar);
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (calendar) {
      params.set("view", "calendar");
    } else {
      params.delete("view");
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/bookings${query}`, { scroll: false });
  };

  const handleToggleArchiveMode = () => {
    const nextMode = !viewArchiveMode;
    setViewArchiveMode(nextMode);
    if (nextMode && !isModuleCacheFresh("archived_bookings")) {
      fetchArchivedBookings(false);
    }
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (nextMode) {
      params.set("tab", "archive");
    } else {
      params.delete("tab");
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/bookings${query}`, { scroll: false });
  };

  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  const checkAndSyncBookings = useCallback(
    async (isSilent: boolean = true, force: boolean = false) => {
      const now = Date.now();
      if (isSyncingRef.current) return;
      // Throttle: don't call if non-forced call happened less than 4 seconds ago
      if (!force && now - lastSyncTimeRef.current < 4000) return;
      isSyncingRef.current = true;
      lastSyncTimeRef.current = now;

      try {
        if (!isSilent && bookingsRef.current.length === 0) {
          setIsLoadingData(true);
        }
        const bookingsRes = await getBookingsApi({
          status: statusParam || undefined,
          forceRefresh: true,
        });
        if (bookingsRes && bookingsRes.success && Array.isArray(bookingsRes.data)) {
          const mappedList: Booking[] = bookingsRes.data.map(mapApiBooking);
          const prev = bookingsRef.current;

          // Merge any recent locally created bookings that server doesn't have yet so they are not wiped out
          const serverIdSet = new Set(mappedList.map((b) => String(b.id || (b as any)._id || b.jobId)));
          const serverBookingNumbers = new Set(mappedList.map((b) => String(b.bookingNumber || "")));

          const unsyncedLocalBookings = prev.filter((b) => {
            const idStr = String(b.id || (b as any)._id || b.jobId || "");
            const numStr = String(b.bookingNumber || "");
            const isKnownByServer = serverIdSet.has(idStr) || (numStr && serverBookingNumbers.has(numStr));
            if (isKnownByServer) return false;
            return (b as any).isLocalOptimistic || idStr.startsWith("HB-") || idStr.startsWith("MANUAL-") || idStr.startsWith("BK-");
          });

          const mergedList: Booking[] = [...unsyncedLocalBookings, ...mappedList];

          // "when change in data then change"
          if (!areBookingsEqual(prev, mergedList)) {
            setCachedModuleData(cacheKey, mergedList);
            setCachedModuleData("bookings", mergedList);
            setBookings(mergedList);

            const prevIds = new Set(prev.map((b) => b.id));
            const newBookings = mergedList.filter((b) => !prevIds.has(b.id) && !(b as any).isLocalOptimistic);

            if (newBookings.length > 0 && prev.length > 0) {
              const newIds = newBookings.flatMap((b) =>
                [
                  String(b.id),
                  b.bookingNumber ? String(b.bookingNumber) : null,
                  (b as any)._id ? String((b as any)._id) : null,
                ].filter(Boolean) as string[]
              );
              addNewBookings(newIds);
              toast.dismissAll();
              toast.success(
                "New Booking Received",
                `${newBookings.length} new booking${newBookings.length > 1 ? "s" : ""} added to list.`
              );
            }
          }

          // Quiet background sync of categories ONLY if forced or missing
          if (force || !isModuleCacheFresh("booking_categories")) {
            getBookingCategoriesApi(force)
              .then((catRes) => {
                const rawCatList = Array.isArray(catRes?.data?.categories)
                  ? catRes.data.categories
                  : Array.isArray(catRes?.categories)
                  ? catRes.categories
                  : Array.isArray(catRes?.data)
                  ? catRes.data
                  : [];
                if (rawCatList.length > 0) {
                  setApiCategories((prevCats) => {
                    if (areCategoryStatsEqual(prevCats, rawCatList)) {
                      return prevCats;
                    }
                    setCachedModuleData("booking_categories", rawCatList);
                    return rawCatList;
                  });
                }
                const allStatsObj = catRes?.data?.all || catRes?.data?.allServices || null;
                if (allStatsObj) {
                  setAllCategoryStats((prevAll: any) => {
                    if (areAllStatsEqual(prevAll, allStatsObj)) {
                      return prevAll;
                    }
                    setCachedModuleData("booking_categories_all", allStatsObj);
                    return allStatsObj;
                  });
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error checking for new bookings:", err);
      } finally {
        isSyncingRef.current = false;
        setIsLoadingData(false);
      }
    },
    [cacheKey, statusParam]
  );

  const refreshBookingsFromBackend = async () => {
    setIsLoadingData(true);
    await Promise.all([
      checkAndSyncBookings(false, true),
      fetchArchivedBookings(true),
    ]);
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const hasStoredCats = isModuleCacheFresh("booking_categories") && initialCachedCats && initialCachedCats.length > 0;
      const hasStoredBookings = bookingsRef.current.length > 0 || ((isModuleCacheFresh(cacheKey) || isModuleCacheFresh("bookings")) && initialCachedBookings && initialCachedBookings.length > 0);

      // ON "BACK" OR REVISITING: show cached data immediately without spinner, then silently sync in background
      if (hasStoredBookings && hasStoredCats) {
        setIsLoadingData(false);
        checkAndSyncBookings(true, false);
        return;
      }

      // If categories missing from cache, fetch once
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
        } catch (err) {
          console.error("Error loading categories:", err);
        }
      }

      // If bookings missing from cache, fetch once
      if (!hasStoredBookings) {
        setIsLoadingData(true);
        await checkAndSyncBookings(false, false);
      } else {
        setIsLoadingData(false);
        checkAndSyncBookings(true, false);
      }

      // If archived bookings missing from cache, fetch once silently
      if (!isModuleCacheFresh("archived_bookings")) {
        fetchArchivedBookings(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [bookingTypeParam, statusParam, checkAndSyncBookings, fetchArchivedBookings, cacheKey]);

  // Auto-sync silently in background when user returns to this browser tab (e.g. from Postman or another app, no timer)
  useEffect(() => {
    const handleTabFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        checkAndSyncBookings(true, false);
      }
    };

    window.addEventListener("focus", handleTabFocus);
    document.addEventListener("visibilitychange", handleTabFocus);

    return () => {
      window.removeEventListener("focus", handleTabFocus);
      document.removeEventListener("visibilitychange", handleTabFocus);
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
    setSelectedCategory(catName);

    // When a category card is opened, mark all unopened bookings in this category as opened
    if (catName && catName !== "All") {
      const catLower = catName.toLowerCase().trim();
      const idsToMark = bookings
        .filter((b) => {
          const bCat = (b.category || (b as any).categoryName || "").toLowerCase().trim();
          const bCatId = String((b as any).categoryId || "").toLowerCase().trim();
          return bCat === catLower || (bCatId && bCatId === catLower);
        })
        .flatMap((b) => [
          String(b.id),
          b.bookingNumber ? String(b.bookingNumber) : null,
          (b as any)._id ? String((b as any)._id) : null,
        ])
        .filter(Boolean) as string[];

      idsToMark.forEach((id) => markBookingAsOpened(id));
    }

    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (catName) {
      params.set("category", catName);
    } else {
      params.delete("category");
    }
    if (isCalendarView) {
      params.set("view", "calendar");
    } else {
      params.delete("view");
    }
    if (viewArchiveMode) {
      params.set("tab", "archive");
    } else {
      params.delete("tab");
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.push(`/bookings${query}`, { scroll: false });
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
    setBookings((prev) => {
      const nextList = prev.map((b) => {
        if (b.id === bookingId) {
          const updated: Booking = {
            ...b,
            date: newDate,
            bookingDate: newDate,
            scheduledDate: newDate,
            workingDateRaw: newDate,
            timeSlot: newTimeSlot,
            technicianId: technicianId || b.technicianId,
            technicianName: technicianName || b.technicianName,
            status: technicianName ? (b.status === "Pending" || b.status === "Waiting For Assignment" ? "Assigned" : b.status) : b.status,
          };
          setCreatedBookingToast(updated);
          return updated;
        }
        return b;
      });
      setCachedModuleData(cacheKey, nextList);
      setCachedModuleData("bookings", nextList);
      return nextList;
    });
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

  const handleArchiveBooking = (row: Booking) => {
    setArchiveTargetBooking(row);
  };

  const handleConfirmArchive = async (row: Booking) => {
    try {
      const res = await archiveBookingApi(row.id);
      if (res && res.success) {
        setBookings((prev) => prev.filter((b) => b.id !== row.id));
        const archivedItem: Booking = { ...row, isArchived: true, archivedAt: new Date().toISOString() };
        setArchivedBookings((prev) => {
          const updated = [archivedItem, ...prev.filter((b) => b.id !== row.id)];
          setCachedModuleData("archived_bookings", updated);
          return updated;
        });
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
        setArchivedBookings((prev) => {
          const updated = prev.filter((b) => b.id !== row.id);
          setCachedModuleData("archived_bookings", updated);
          return updated;
        });
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
      return source.filter((b) => (b.createdBy && b.createdBy.toLowerCase().includes("office")) || (b as any).isLocalOptimistic);
    }
    return source;
  }, [bookings, archivedBookings, viewArchiveMode, isOfficeAdmin]);

  // Compute Category Level Statistics dynamically from API Categories and actual bookings
  const categoryStatsList = useMemo(() => {
    const catMap: Record<
      string,
      { id?: string; name: string; iconUrl?: string; count: number; unassigned: number; inProgress: number; completed: number; cancelled: number; isPinned?: boolean }
    > = {};

    // 1. Initialize strictly from API Categories using the counts provided by categories API
    if (apiCategories.length > 0) {
      apiCategories.forEach((apiCat: any) => {
        const name = (apiCat.categoryName || apiCat.name || "Category").trim();
        if (name && name !== "All Service Categories") {
          catMap[name] = {
            id: apiCat._id,
            name,
            iconUrl: apiCat.iconUrl !== undefined && apiCat.iconUrl !== null ? apiCat.iconUrl : (apiCat.icon || (apiCat._id ? `/api/media/category/${apiCat._id}/icon` : "")),
            count: Number(apiCat.totalBookings ?? apiCat.count ?? 0),
            unassigned: Number(apiCat.openBookings ?? apiCat.unassigned ?? 0),
            inProgress: Number(apiCat.activeBookings ?? apiCat.inProgress ?? 0),
            completed: Number(apiCat.completedBookings ?? apiCat.completed ?? 0),
            cancelled: Number(apiCat.cancelledBookings ?? apiCat.cancelled ?? 0),
            isPinned: Boolean(apiCat.isPinned),
          };
        }
      });
    }

    // 2. Include any custom category from bookings that isn't already in apiCategories
    if (roleFilteredBookings.length > 0) {
      roleFilteredBookings.forEach((b) => {
        const rawCat = (b.category || "General").trim();
        if (!rawCat) return;

        const exists = Object.keys(catMap).some((k) => k.toLowerCase() === rawCat.toLowerCase());
        if (!exists) {
          catMap[rawCat] = {
            id: undefined,
            name: rawCat,
            iconUrl: "",
            count: 0,
            unassigned: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            isPinned: false,
          };
        }
      });
    }

    // 3. Dynamically reflect live bookings count so new bookings show immediately without waiting for API
    const liveCounts: Record<string, { total: number; unassigned: number; inProgress: number; completed: number; cancelled: number }> = {};
    roleFilteredBookings.forEach((b) => {
      const catKey = (b.category || "General").trim();
      const matchedKey = Object.keys(catMap).find((k) => k.toLowerCase() === catKey.toLowerCase()) || catKey;
      if (!liveCounts[matchedKey]) {
        liveCounts[matchedKey] = { total: 0, unassigned: 0, inProgress: 0, completed: 0, cancelled: 0 };
      }
      liveCounts[matchedKey].total += 1;
      const s = (b.status || "").toLowerCase();
      if (!b.technicianName || s.includes("pending") || s.includes("open")) liveCounts[matchedKey].unassigned += 1;
      if (s.includes("progress") || s.includes("assigned")) liveCounts[matchedKey].inProgress += 1;
      if (s.includes("completed")) liveCounts[matchedKey].completed += 1;
      if (s.includes("cancel") || s.includes("reject")) liveCounts[matchedKey].cancelled += 1;
    });

    Object.keys(catMap).forEach((name) => {
      const live = liveCounts[name];
      if (live) {
        catMap[name].count = Math.max(catMap[name].count, live.total);
        catMap[name].unassigned = Math.max(catMap[name].unassigned, live.unassigned);
        catMap[name].inProgress = Math.max(catMap[name].inProgress, live.inProgress);
        catMap[name].completed = Math.max(catMap[name].completed, live.completed);
        catMap[name].cancelled = Math.max(catMap[name].cancelled, live.cancelled);
      }
    });

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

    // Maintain natural serial order as returned by backend API
    return list;
  }, [categoryBookings, cardFilter, activeStatusFilter, channelFilter]);

  const handleBookingCreated = (newBooking: Booking) => {
    const bookingWithFlag: Booking = {
      ...newBooking,
      isLocalOptimistic: true,
      createdBy: newBooking.createdBy || (role ? String(role) : "Admin"),
    } as any;

    setBookings((prev) => {
      const updated = [bookingWithFlag, ...prev.filter((b) => b.id !== bookingWithFlag.id)];
      setCachedModuleData(cacheKey, updated);
      setCachedModuleData("bookings", updated);
      return updated;
    });

    // Update allCategoryStats in-memory immediately so KPI cards reflect the new count without API delay
    setAllCategoryStats((prev: any) => {
      const current = prev || { totalBookings: 0, openBookings: 0, activeBookings: 0, completedBookings: 0, cancelledBookings: 0 };
      const isAssigned = Boolean(bookingWithFlag.technicianName || bookingWithFlag.technicianId || bookingWithFlag.status === "Assigned");
      const updatedStats = {
        ...current,
        totalBookings: Number(current.totalBookings || 0) + 1,
        openBookings: isAssigned ? Number(current.openBookings || 0) : Number(current.openBookings || 0) + 1,
        activeBookings: isAssigned ? Number(current.activeBookings || 0) + 1 : Number(current.activeBookings || 0),
      };
      setCachedModuleData("booking_categories_all", updatedStats);
      return updatedStats;
    });

    // Update apiCategories in-memory immediately
    if (bookingWithFlag.category) {
      setApiCategories((prevCats) => {
        const catNameLower = bookingWithFlag.category.toLowerCase().trim();
        const exists = prevCats.some((c: any) => (c.categoryName || c.name || "").toLowerCase().trim() === catNameLower);
        const isAssigned = Boolean(bookingWithFlag.technicianName || bookingWithFlag.technicianId || bookingWithFlag.status === "Assigned");
        let updatedCats: ApiBookingCategoryStat[];
        if (exists) {
          updatedCats = prevCats.map((c: any) => {
            if ((c.categoryName || c.name || "").toLowerCase().trim() === catNameLower) {
              return {
                ...c,
                totalBookings: Number(c.totalBookings || 0) + 1,
                count: Number(c.count || c.totalBookings || 0) + 1,
                openBookings: isAssigned ? Number(c.openBookings || 0) : Number(c.openBookings || 0) + 1,
                unassigned: isAssigned ? Number(c.unassigned || c.openBookings || 0) : Number(c.unassigned || c.openBookings || 0) + 1,
                activeBookings: isAssigned ? Number(c.activeBookings || 0) + 1 : Number(c.activeBookings || 0),
                inProgress: isAssigned ? Number(c.inProgress || c.activeBookings || 0) + 1 : Number(c.inProgress || c.activeBookings || 0),
              };
            }
            return c;
          });
        } else {
          updatedCats = [
            ...prevCats,
            {
              _id: `cat_local_${Date.now()}`,
              categoryName: bookingWithFlag.category,
              name: bookingWithFlag.category,
              totalBookings: 1,
              count: 1,
              openBookings: isAssigned ? 0 : 1,
              unassigned: isAssigned ? 0 : 1,
              activeBookings: isAssigned ? 1 : 0,
              inProgress: isAssigned ? 1 : 0,
              completedBookings: 0,
              cancelledBookings: 0,
            } as any,
          ];
        }
        setCachedModuleData("booking_categories", updatedCats);
        return updatedCats;
      });
    }

    // Ensure table view is active and switches to the created booking's category or "All" so the new booking is immediately visible
    const targetCat = bookingWithFlag.category || "All";
    setSelectedCategory(targetCat);
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    params.set("category", targetCat);
    router.replace(`/bookings?${params.toString()}`, { scroll: false });

    // Reset conflicting filters so the new booking is immediately visible
    if (cardFilter === "COMPLETED" || cardFilter === "CANCELLED") {
      setCardFilter("ALL");
    }
    if (channelFilter === "ONLINE") {
      setChannelFilter("ALL");
    }

    preStoreBookingDetail(bookingWithFlag);
    if (bookingWithFlag.id) addNewBooking(String(bookingWithFlag.id));
    if (bookingWithFlag.bookingNumber) addNewBooking(String(bookingWithFlag.bookingNumber));
    if ((bookingWithFlag as any)._id) addNewBooking(String((bookingWithFlag as any)._id));
    setIsWizardOpen(false);
    setCreatedBookingToast(bookingWithFlag);

    // Silent background sync after 500ms to reconcile backend ID and official booking number
    setTimeout(() => {
      checkAndSyncBookings(true, true);
    }, 500);
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

    setBookings((prev) => {
      const nextList = prev.map(update);
      setCachedModuleData(cacheKey, nextList);
      setCachedModuleData("bookings", nextList);
      return nextList;
    });
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

    setBookings((prev) => {
      const nextList = prev.map(update);
      setCachedModuleData(cacheKey, nextList);
      setCachedModuleData("bookings", nextList);
      return nextList;
    });
    setDrawerBooking((prev) => (prev && prev.id === bookingId ? update(prev) : prev));
  };

  const handleInspectionApproved = (bookingId: string, updatedQuote: number, remarks: string) => {
    setBookings((prev) => {
      const nextList: Booking[] = prev.map((b) => {
        if (b.id === bookingId) {
          const updated: Booking = {
            ...b,
            basePrice: updatedQuote,
            totalAmount: Math.round(updatedQuote * 1.18 + 49),
            inspectionRemarks: remarks,
            status: "Customer Approval Pending",
          };
          return updated;
        }
        return b;
      });
      setCachedModuleData(cacheKey, nextList);
      setCachedModuleData("bookings", nextList);
      return nextList;
    });
  };

  const handleJobCompleted = (
    bookingId: string,
    addOns?: SelectedAddOnItem[],
    addOnsBaseTotal?: number,
    addOnsGstTotal?: number,
    addOnsFinalTotal?: number
  ) => {
    setBookings((prev) => {
      const nextList: Booking[] = prev.map((b) => {
        if (b.id === bookingId) {
          const updated: Booking = {
            ...b,
            isOtpVerified: true,
            status: "Completed",
            completedAddOns: addOns || b.completedAddOns,
            addOnsBaseTotal: addOnsBaseTotal ?? b.addOnsBaseTotal,
            addOnsGstTotal: addOnsGstTotal ?? b.addOnsGstTotal,
            addOnsFinalTotal: addOnsFinalTotal ?? b.addOnsFinalTotal,
            totalAmount: b.totalAmount + (addOnsFinalTotal || 0),
          };
          return updated;
        }
        return b;
      });
      setCachedModuleData(cacheKey, nextList);
      setCachedModuleData("bookings", nextList);
      return nextList;
    });
    router.push(`/billing/${bookingId}`);
  };

  const handleBookingUpdated = (updated: Booking) => {
    setBookings((prev) => {
      const nextList = prev.map((b) => (b.id === updated.id ? updated : b));
      setCachedModuleData(cacheKey, nextList);
      setCachedModuleData("bookings", nextList);
      return nextList;
    });
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
        key: "bookingId",
        header: "Booking ID",
        icon: Hash,
        locked: true,
        fixedPosition: "first",
        sticky: "left",
        stickyLeftOffset: 44,
        className: "w-[140px] min-w-[140px] max-w-[140px]",
        accessor: (row) => {
          const displayId = row.bookingNumber || row.jobId || row.id;
          const isNew =
            unopenedBookingIds.has(String(row.id)) ||
            (row.bookingNumber && unopenedBookingIds.has(String(row.bookingNumber))) ||
            ((row as any)._id && unopenedBookingIds.has(String((row as any)._id)));
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  markBookingAsOpened(row.id);
                  if (row.bookingNumber) markBookingAsOpened(row.bookingNumber);
                  if ((row as any)._id) markBookingAsOpened((row as any)._id);
                  preStoreBookingDetail(row);
                  router.push(`/bookings/${row.id}?from=${encodeURIComponent(getReturnUrl())}`);
                }}
                className="font-mono font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer text-xs"
              >
                {displayId}
              </button>
              {isNew && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-xs"
                  title="New Booking Received"
                />
              )}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "origin",
        header: "Origin",
        icon: Globe,
        className: "w-[120px] min-w-[120px] max-w-[120px]",
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
        key: "assignPartner",
        header: "Assign Partner",
        icon: UserCheck,
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
        key: "workingDate",
        header: "Working date",
        icon: Calendar,
        className: "w-[140px] min-w-[140px] whitespace-nowrap px-4",
        accessor: (row) => (
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatWorkingDate(row.date)}
          </span>
        ),
        sortable: true,
      },
      {
        key: "time",
        header: "Time",
        icon: Clock,
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
        icon: CalendarDays,
        accessor: (row) => <span className="text-slate-500 dark:text-slate-400 font-medium">{row.callingDate || "-"}</span>,
        sortable: true,
      },
      {
        key: "customerName",
        header: "Customer Name",
        icon: User,
        className: "w-[170px] min-w-[170px] max-w-[170px]",
        accessor: (row: Booking) => {
          if (isOfficeAdmin) {
            return (
              <div className="space-y-0.5 max-w-[150px]">
                <span className="font-semibold text-slate-900 dark:text-white text-xs truncate block">
                  {row.customerName}
                </span>
                {row.customerPhone && (
                  <span className="font-mono text-[11px] text-slate-500 font-medium block">
                    {row.customerPhone}
                  </span>
                )}
              </div>
            );
          }
          const targetPath = row.customerId
            ? `/customers/${row.customerId}?from=${encodeURIComponent("/bookings")}`
            : `/customers?search=${encodeURIComponent(row.customerPhone || row.customerName)}`;
          return (
            <div className="space-y-0.5 max-w-[150px]">
              <button
                type="button"
                onClick={() => router.push(targetPath)}
                className="font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 hover:underline text-left truncate block cursor-pointer"
                title={`View ${row.customerName} details`}
              >
                {row.customerName}
              </button>
              {row.customerPhone && (
                <span className="font-mono text-[11px] text-slate-500 font-medium block">
                  {row.customerPhone}
                </span>
              )}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "serviceAddressLocation",
        header: "Service Address Location",
        icon: MapPin,
        accessor: (row) => (
          <div className="max-w-[200px] truncate text-slate-700 dark:text-slate-300 font-medium" title={row.address || `${row.locality}, Varanasi`}>
            {row.address || `${row.locality}, Varanasi`}
          </div>
        ),
        sortable: true,
      },
      {
        key: "multipleServicesItemCodes",
        header: "Multiple Services & Item Codes",
        icon: Layers,
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
        key: "amount",
        header: "Amount",
        icon: IndianRupee,
        accessor: (row) => <span className="font-semibold text-slate-900 dark:text-white">₹{row.totalAmount}</span>,
        sortable: true,
      },
      {
        key: "callingPerson",
        header: "Calling Person",
        icon: PhoneCall,
        accessor: (row) => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.callingPerson || "-"}</span>,
        sortable: true,
      },
      {
        key: "remark",
        header: "Remark",
        icon: FileText,
        accessor: (row) => (
          <div className="max-w-[170px] truncate text-slate-500 italic" title={row.notes || row.inspectionRemarks || "-"}>
            {row.notes || row.inspectionRemarks || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bookingStatus",
        header: "Booking Status",
        icon: CheckCircle2,
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
        key: "handleBy",
        header: "Handle By",
        icon: ShieldCheck,
        accessor: (row) => <span className="text-slate-600 dark:text-slate-400 font-medium">{row.handledBy || "-"}</span>,
        sortable: true,
      },
      {
        key: "actions",
        header: "Actions",
        icon: MoreVertical,
        sticky: "right",
        locked: true,
        fixedPosition: "last",
        accessor: (row) => (
          <RowActionMenu
            actions={
              isOfficeAdmin
                ? [
                  {
                    label: "View Details",
                    icon: Eye,
                    onClick: () => {
                      markBookingAsOpened(row.id);
                      if (row.bookingNumber) markBookingAsOpened(row.bookingNumber);
                      if ((row as any)._id) markBookingAsOpened((row as any)._id);
                      preStoreBookingDetail(row);
                      router.push(`/bookings/${row.id}?from=${encodeURIComponent(getReturnUrl())}`);
                    },
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
                  ...(canView("bookings")
                    ? [
                        {
                          label: "View",
                          icon: Eye,
                          onClick: () => {
                            markBookingAsOpened(row.id);
                            if (row.bookingNumber) markBookingAsOpened(row.bookingNumber);
                            if ((row as any)._id) markBookingAsOpened((row as any)._id);
                            preStoreBookingDetail(row);
                            router.push(`/bookings/${row.id}?from=${encodeURIComponent(getReturnUrl())}`);
                          },
                        },
                      ]
                    : []),
                  ...(!row.isArchived && canEdit("bookings")
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
                      ...(canDelete("bookings") && row.status !== "Completed" && row.status !== "Cancelled"
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
  }, [isOfficeAdmin, selectedCategory, router, getReturnUrl, unopenedBookingIds]);

  const showTableView = Boolean(selectedCategory || bookingTypeParam || statusParam);

  const selectedCatStat = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") return null;
    return categoryStatsList.find(
      (c) => c.name.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
    );
  }, [selectedCategory, categoryStatsList]);

  const isChannelFiltered = channelFilter !== "ALL";

  const allCategoryStatsFallback = useMemo(() => {
    if (allCategoryStats) return allCategoryStats;
    const totals = {
      totalBookings: 0,
      openBookings: 0,
      activeBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
    };
    apiCategories.forEach((c: any) => {
      totals.totalBookings += Number(c.totalBookings ?? 0);
      totals.openBookings += Number(c.openBookings ?? 0);
      totals.activeBookings += Number(c.activeBookings ?? 0);
      totals.completedBookings += Number(c.completedBookings ?? 0);
      totals.cancelledBookings += Number(c.cancelledBookings ?? 0);
    });
    return totals;
  }, [allCategoryStats, apiCategories]);

  const totalCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.length;
    }
    if (selectedCatStat) {
      return Math.max(selectedCatStat.count, categoryBookings.length);
    }
    const apiTotal = Number(allCategoryStats?.totalBookings ?? allCategoryStatsFallback.totalBookings ?? 0);
    return Math.max(apiTotal, roleFilteredBookings.length);
  }, [isChannelFiltered, filteredBookings.length, selectedCatStat, categoryBookings.length, allCategoryStats, allCategoryStatsFallback, roleFilteredBookings.length]);

  const unassignedCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.filter((b) => !b.technicianName).length;
    }
    if (selectedCatStat) {
      const liveUnassigned = categoryBookings.filter((b) => !b.technicianName).length;
      return Math.max(selectedCatStat.unassigned, liveUnassigned);
    }
    const apiOpen = Number(allCategoryStats?.openBookings ?? allCategoryStatsFallback.openBookings ?? 0);
    const liveOpen = roleFilteredBookings.filter((b) => !b.technicianName).length;
    return Math.max(apiOpen, liveOpen);
  }, [isChannelFiltered, filteredBookings, selectedCatStat, categoryBookings, allCategoryStats, allCategoryStatsFallback, roleFilteredBookings]);

  const inProgressCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.filter((b) => b.status === "In Progress" || b.status === "Assigned" || b.status === "Partner Accepted").length;
    }
    if (selectedCatStat) {
      const liveInProgress = categoryBookings.filter((b) => b.status === "In Progress" || b.status === "Assigned" || b.status === "Partner Accepted").length;
      return Math.max(selectedCatStat.inProgress, liveInProgress);
    }
    const apiActive = Number(allCategoryStats?.activeBookings ?? allCategoryStatsFallback.activeBookings ?? 0);
    const liveActive = roleFilteredBookings.filter((b) => b.status === "In Progress" || b.status === "Assigned" || b.status === "Partner Accepted").length;
    return Math.max(apiActive, liveActive);
  }, [isChannelFiltered, filteredBookings, selectedCatStat, categoryBookings, allCategoryStats, allCategoryStatsFallback, roleFilteredBookings]);

  const completedCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.filter((b) => b.status === "Completed").length;
    }
    if (selectedCatStat) {
      const liveCompleted = categoryBookings.filter((b) => b.status === "Completed").length;
      return Math.max(selectedCatStat.completed, liveCompleted);
    }
    const apiCompleted = Number(allCategoryStats?.completedBookings ?? allCategoryStatsFallback.completedBookings ?? 0);
    const liveCompleted = roleFilteredBookings.filter((b) => b.status === "Completed").length;
    return Math.max(apiCompleted, liveCompleted);
  }, [isChannelFiltered, filteredBookings, selectedCatStat, categoryBookings, allCategoryStats, allCategoryStatsFallback, roleFilteredBookings]);

  const cancelledCardCount = useMemo(() => {
    if (isChannelFiltered) {
      return filteredBookings.filter((b) => b.status === "Cancelled" || b.status === "Rejected").length;
    }
    if (selectedCatStat) {
      const liveCancelled = categoryBookings.filter((b) => b.status === "Cancelled" || b.status === "Rejected").length;
      return Math.max(selectedCatStat.cancelled, liveCancelled);
    }
    const apiCancelled = Number(allCategoryStats?.cancelledBookings ?? allCategoryStatsFallback.cancelledBookings ?? 0);
    const liveCancelled = roleFilteredBookings.filter((b) => b.status === "Cancelled" || b.status === "Rejected").length;
    return Math.max(apiCancelled, liveCancelled);
  }, [isChannelFiltered, filteredBookings, selectedCatStat, categoryBookings, allCategoryStats, allCategoryStatsFallback, roleFilteredBookings]);

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
      {!showTableView && !isCalendarView ? (
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
                onClick={() => setIsCalendarView(true)}
                className="px-3.5 py-2.5 rounded-xl font-semibold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              >
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Calendar View</span>
              </button>

              {canCreate("bookings") && (
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Booking</span>
                </button>
              )}
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
                  <span>Open Table</span>
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
                  const isCatUnopened =
                    categoriesWithUnopened.has((cat.name || "").toLowerCase().trim()) ||
                    (cat.id ? categoriesWithUnopened.has(String(cat.id).toLowerCase().trim()) : false);

                  return (
                    <div
                      key={cat.name}
                      onClick={() => handleSelectCategory(cat.name)}
                      className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
                        isPinned
                          ? "bg-gradient-to-br from-amber-50/30 via-white to-white dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-700/70 hover:border-amber-500 hover:shadow-md shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md"
                      }`}
                    >
                      {/* Indicator dot at right side top corner, half outside */}
                      {isCatUnopened && (
                        <span
                          className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 z-10"
                          title="New Booking in this Category"
                        >
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-md" />
                        </span>
                      )}

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
                  onClick={() => {
                    setIsCalendarView(false);
                    if (selectedCategory) {
                      handleSelectCategory(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-brand-600" />
                  <span>Back</span>
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
                                  {allCategoryStats?.totalBookings ?? allCategoryStatsFallback.totalBookings} Total Orders
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
                                    {categoriesWithUnopened.has((cat.name || "").toLowerCase().trim()) && (
                                      <span
                                        className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-xs"
                                        title="New Booking Received"
                                      />
                                    )}
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
              {/* Segmented View Mode Toggle: Table / Calendar */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleToggleViewMode(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    !isCalendarView
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleViewMode(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isCalendarView
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleArchiveMode}
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

              {canCreate("bookings") && (
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Booking</span>
                </button>
              )}
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
                onClick={() => {
                  setViewArchiveMode(false);
                  const params = new URLSearchParams(searchParams?.toString() || "");
                  params.delete("tab");
                  const query = params.toString() ? `?${params.toString()}` : "";
                  router.replace(`/bookings${query}`, { scroll: false });
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-extrabold cursor-pointer transition-colors shrink-0"
              >
                Return to Active Bookings
              </button>
            </div>
          )}

          {isCalendarView ? (
            <BookingCalendarView
              bookings={categoryBookings}
              categories={categoryStatsList}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onSelectBooking={(b) => {
                const targetId = b.id || (b as any)._id;
                markBookingAsOpened(targetId);
                if (b.bookingNumber) markBookingAsOpened(b.bookingNumber);
                if (b.id) markBookingAsOpened(b.id);
                preStoreBookingDetail(b);
                router.push(`/bookings/${targetId}?from=${encodeURIComponent(getReturnUrl())}`);
              }}
              onAssignPartner={(b) => setAssignBooking(b)}
              onCreateBooking={() => setIsWizardOpen(true)}
            />
          ) : (
            <>
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
            enableColumnCustomization={true}
            tableKey="booking"
            columnStorageKey="helpmate_booking_columns_view"
            onRefresh={refreshBookingsFromBackend}
            isRefreshing={isLoadingData}
            pinnedColumnsNotice="Booking ID & Actions are pinned"
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
          </>
          )}
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
            color: #0f172a !important;
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
            className="hidden print:block p-0 rounded-3xl bg-white text-slate-900 space-y-4 w-full"
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
                    <h1 className="font-extrabold text-xl text-slate-900 tracking-tight leading-none">
                      HelpMate
                    </h1>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-300">
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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 font-extrabold text-[10px] border border-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 inline-block" />
                  <span>OFFICIAL GST TAX INVOICE</span>
                </div>

                <div className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                  Invoice No: <span className="text-slate-900 font-extrabold">{formatInvoiceNumber(printTargetBooking.bookingNumber || printTargetBooking.id)}</span>
                </div>

                <div className="text-[10px] text-slate-600 font-semibold">
                  Invoice Date: <span className="font-bold text-slate-900">{printTargetBooking.date || "Today"}</span>
                </div>
              </div>
            </div>

            {/* Customer & Billing Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">
                  Billed To (Customer Details)
                </span>
                <div className="font-extrabold text-slate-900 text-xs">
                  {printTargetBooking.customerName}
                </div>
                <div className="text-slate-800 font-medium text-[10px]">
                  {printTargetBooking.address || `${printTargetBooking.locality}, Varanasi`}
                </div>
                <div className="font-bold text-slate-900 text-[10px]">
                  Phone: {printTargetBooking.customerPhone}
                </div>
                {printTargetBooking.customerGstin && (
                  <div className="font-mono font-bold text-slate-900 bg-slate-100 p-0.5 rounded border border-slate-300 text-[9px] w-fit">
                    B2B GSTIN: {printTargetBooking.customerGstin}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">
                  Service & Payment Details
                </span>
                <div className="font-extrabold text-slate-900 text-xs">
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
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-900">
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
                    <td className="py-2 text-right font-mono font-extrabold text-slate-900 text-xs">
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
                <span className="font-extrabold text-slate-900 block text-xs">Terms & Conditions</span>
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
                <div className="flex justify-between py-0.5 text-xs font-black text-slate-900">
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
