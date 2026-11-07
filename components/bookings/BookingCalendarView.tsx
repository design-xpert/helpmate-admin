"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Booking, BookingStatus } from "@/lib/mockData";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  MapPin,
  Tag,
  Search,
  Filter,
  Eye,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ChevronDown,
  Wind,
  Hammer,
  Droplets,
  Paintbrush,
  ShieldAlert,
  Tv,
  Sparkles,
  Zap,
  Car,
  Wrench,
} from "lucide-react";
import { CustomSelect, CustomSelectOption } from "@/components/CustomSelect";
import { getUnopenedBookingIds, subscribeToNewBookings } from "@/lib/newBookingTracker";

export type CalendarViewMode = "month" | "week" | "day";

interface BookingCalendarViewProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onAssignPartner?: (booking: Booking) => void;
  onCreateBooking?: () => void;
  categories?: { name: string; count: number }[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
}

// Helper to determine status color styling
function getStatusTheme(status: BookingStatus | string) {
  const s = (status || "").toLowerCase();
  if (s.includes("completed") || s.includes("done")) {
    return {
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      card: "border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200",
      label: "Completed",
    };
  }
  if (s.includes("progress") || s.includes("assigned") || s.includes("accepted")) {
    return {
      dot: "bg-blue-500",
      badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      card: "border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200",
      label: "Active",
    };
  }
  if (s.includes("cancel") || s.includes("reject")) {
    return {
      dot: "bg-rose-500",
      badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      card: "border-l-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200",
      label: "Cancelled",
    };
  }
  // Pending / Draft / Open
  return {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    card: "border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200",
    label: "Pending",
  };
}

// Category icon helper
function getCategoryIcon(cat: string, className = "w-3.5 h-3.5") {
  const c = (cat || "").toLowerCase();
  if (c.includes("ac")) return <Wind className={`${className} text-cyan-500`} />;
  if (c.includes("carpenter")) return <Hammer className={`${className} text-amber-600`} />;
  if (c.includes("clean")) return <Sparkles className={`${className} text-emerald-500`} />;
  if (c.includes("electric")) return <Zap className={`${className} text-amber-500`} />;
  if (c.includes("paint")) return <Paintbrush className={`${className} text-purple-500`} />;
  if (c.includes("pest")) return <ShieldAlert className={`${className} text-rose-500`} />;
  if (c.includes("plumb")) return <Droplets className={`${className} text-blue-500`} />;
  if (c.includes("appliance")) return <Tv className={`${className} text-indigo-500`} />;
  if (c.includes("car")) return <Car className={`${className} text-sky-500`} />;
  return <Wrench className={`${className} text-slate-500`} />;
}

// Parse scheduled hour from timeSlot or default to 10
function parseBookingHour(timeStr?: string): number {
  if (!timeStr) return 10;
  const lower = timeStr.toLowerCase();
  const match = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) {
    if (lower.includes("morning")) return 9;
    if (lower.includes("afternoon")) return 14;
    if (lower.includes("evening")) return 17;
    return 10;
  }
  let hour = parseInt(match[1], 10);
  const isPM = match[3] === "pm" || lower.includes("pm");
  const isAM = match[3] === "am" || lower.includes("am");
  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;
  return hour;
}

// Parse booking date into Date object
function getBookingDate(booking: Booking): Date | null {
  if (booking.workingDateRaw) {
    const parts = booking.workingDateRaw.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
  }
  if (booking.scheduledDate) {
    const d = new Date(booking.scheduledDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (booking.date) {
    if (booking.date.toLowerCase() === "today") return new Date();
    if (booking.date.toLowerCase() === "tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    }
    const d = new Date(booking.date);
    if (!isNaN(d.getTime())) return d;
  }
  if (booking.bookingDate) {
    const d = new Date(booking.bookingDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (booking.createdAt) {
    const d = new Date(booking.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (booking.rawTimestamp) {
    return new Date(booking.rawTimestamp);
  }
  return null;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function BookingCalendarView({
  bookings,
  onSelectBooking,
  onAssignPartner,
  onCreateBooking,
  categories = [],
  selectedCategory,
  onSelectCategory,
}: BookingCalendarViewProps) {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("booking_calendar_date");
      if (saved) {
        const parsed = new Date(saved);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    return new Date();
  });
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("booking_calendar_view_mode");
      if (saved === "month" || saved === "week" || saved === "day") return saved;
    }
    return "month";
  });
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [unopenedBookingIds, setUnopenedBookingIds] = useState<Set<string>>(() => getUnopenedBookingIds());

  useEffect(() => {
    setUnopenedBookingIds(getUnopenedBookingIds());
    return subscribeToNewBookings(() => {
      setUnopenedBookingIds(getUnopenedBookingIds());
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("booking_calendar_view_mode", viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("booking_calendar_date", currentDate.toISOString());
    }
  }, [currentDate]);

  const today = useMemo(() => new Date(), []);

  // Custom Dropdown Options for Category
  const categoryOptions: CustomSelectOption[] = useMemo(() => {
    const list: CustomSelectOption[] = [
      {
        value: "All",
        label: "All Categories",
        icon: <Layers className="w-3.5 h-3.5 text-slate-400" />,
      },
    ];
    categories.forEach((c) => {
      list.push({
        value: c.name,
        label: `${c.name} (${c.count})`,
        icon: getCategoryIcon(c.name, "w-3.5 h-3.5"),
      });
    });
    return list;
  }, [categories]);

  // Custom Dropdown Options for Status
  const statusOptions: CustomSelectOption[] = useMemo(
    () => [
      {
        value: "All",
        label: "All Statuses",
        icon: <Filter className="w-3.5 h-3.5 text-slate-400" />,
      },
      {
        value: "Pending",
        label: "Pending",
        icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
      },
      {
        value: "Active",
        label: "Active / In Field",
        icon: <AlertCircle className="w-3.5 h-3.5 text-blue-500" />,
      },
      {
        value: "Completed",
        label: "Completed",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      },
      {
        value: "Cancelled",
        label: "Cancelled",
        icon: <X className="w-3.5 h-3.5 text-rose-500" />,
      },
    ],
    []
  );

  // Filtered Bookings according to category, status, and search
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Category filter
      if (selectedCategory && selectedCategory !== "All") {
        if (b.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== "All") {
        const statusTheme = getStatusTheme(b.status);
        if (statusTheme.label !== statusFilter) {
          return false;
        }
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (b.bookingNumber || b.id || "").toLowerCase().includes(q);
        const matchesCustomer = (b.customerName || "").toLowerCase().includes(q);
        const matchesPhone = (b.customerPhone || "").toLowerCase().includes(q);
        const matchesService = (b.serviceTitle || b.serviceName || "").toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesPhone && !matchesService) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, selectedCategory, statusFilter, searchQuery]);

  // Map of date string (YYYY-MM-DD) -> Array of bookings
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    filteredBookings.forEach((b) => {
      const d = getBookingDate(b);
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const existing = map.get(key) || [];
        existing.push(b);
        map.set(key, existing);
      }
    });
    return map;
  }, [filteredBookings]);

  // Navigate forward/back
  const navigatePrevious = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 1);
      }
      return next;
    });
  };

  const navigateNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 1);
      }
      return next;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Header Title for current period
  const periodTitle = useMemo(() => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    if (viewMode === "month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewMode === "week") {
      // Find start of week (Sunday)
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const startMonth = start.toLocaleDateString("en-US", { month: "short" });
      const endMonth = end.toLocaleDateString("en-US", { month: "short" });
      if (start.getMonth() === end.getMonth()) {
        return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }
    // Day view
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [currentDate, viewMode]);

  // Days for Month View Grid (42 cells: 6 weeks x 7 days)
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Last day of current month
    const lastDay = new Date(year, month + 1, 0);

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateKey: string;
      bookings: Booking[];
    }[] = [];

    // Previous month padding
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDay(d, today),
        dateKey,
        bookings: bookingsByDate.get(dateKey) || [],
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: isSameDay(d, today),
        dateKey,
        bookings: bookingsByDate.get(dateKey) || [],
      });
    }

    // Next month padding to fill out 35 or 42 cells
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDay(d, today),
        dateKey,
        bookings: bookingsByDate.get(dateKey) || [],
      });
    }

    return days;
  }, [currentDate, today, bookingsByDate]);

  // Days for Week View (7 days)
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days: {
      date: Date;
      isToday: boolean;
      dateKey: string;
      bookings: Booking[];
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        isToday: isSameDay(d, today),
        dateKey,
        bookings: bookingsByDate.get(dateKey) || [],
      });
    }
    return days;
  }, [currentDate, today, bookingsByDate]);

  // Working hours for week and day view (08:00 AM to 08:00 PM)
  const hoursRange = useMemo(() => {
    return Array.from({ length: 13 }, (_, idx) => idx + 8); // 8 to 20 (8 AM to 8 PM)
  }, []);

  // Format hour label
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  };

  // Day View Bookings
  const currentDayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  const dayBookings = bookingsByDate.get(currentDayKey) || [];

  return (
    <div className="space-y-4 select-none animate-in fade-in duration-200">
      {/* ─── GOOGLE CALENDAR HEADER CONTROLS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Left: Today, Prev/Next, Period Title */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Today Button */}
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Today
          </button>

          {/* Prev / Next Arrows */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={navigatePrevious}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={navigateNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Period Title */}
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight pl-1">
              {periodTitle}
            </h2>
            {viewMode === "day" && (
              <div className="flex items-center gap-2 pl-1 mt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"} scheduled
                </span>
                {dayBookings.length > 0 && (
                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                    {dayBookings.slice(0, 5).map((b, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full ${getStatusTheme(b.status).dot}`}
                        title={`${b.customerName || "Booking"} (${b.status})`}
                      />
                    ))}
                    {dayBookings.length > 5 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        +{dayBookings.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: Search, Status Filter, Category Filter & View Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative min-w-[140px] sm:min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search booking..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter CustomSelect */}
          {categories.length > 0 && onSelectCategory && (
            <div className="w-[170px] sm:w-[195px]">
              <CustomSelect
                value={selectedCategory || "All"}
                onChange={(val) => onSelectCategory(val === "All" ? null : val)}
                options={categoryOptions}
                size="sm"
                searchable={true}
                searchPlaceholder="Search category..."
                placeholder="All Categories"
              />
            </div>
          )}

          {/* Status Filter CustomSelect */}
          <div className="w-[145px] sm:w-[165px]">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={statusOptions}
              size="sm"
              searchable={false}
              placeholder="All Statuses"
            />
          </div>

          {/* Google Calendar View Switcher: Day | Week | Month */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === "day"
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === "week"
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === "month"
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* ─── STATUS LEGEND BAR (WITH DOTS) ─── */}
      <div className="flex items-center justify-between gap-4 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto">
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Status Dots:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>Pending / Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span>Assigned / Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span>Cancelled</span>
          </div>
        </div>

      </div>

      {/* ─── VIEW 1: MONTH CALENDAR GRID ─── */}
      {viewMode === "month" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2 text-[11px] font-black uppercase tracking-wider ${
                  idx === 0 || idx === 6
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 42-Cell Month Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
            {monthGridDays.map((cell) => {
              const dayBookingsList = cell.bookings;
              const hasBookings = dayBookingsList.length > 0;

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => {
                    setCurrentDate(cell.date);
                    if (hasBookings) {
                      setViewMode("day");
                    }
                  }}
                  className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col transition-colors group cursor-pointer ${
                    !cell.isCurrentMonth
                      ? "bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {/* Top Bar of Cell: Day Number + Booking Indicator Dots */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    {/* Day Number */}
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                        cell.isToday
                          ? "bg-brand-600 text-white font-black shadow-xs"
                          : cell.isCurrentMonth
                          ? "text-slate-900 dark:text-white group-hover:text-brand-600"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {/* ─── DOTS ON DATE THAT HAVE BOOKINGS ─── */}
                    {hasBookings && (
                      <div
                        className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
                        title={`${dayBookingsList.length} booking(s) on this date`}
                      >
                        {/* Dynamic dots reflecting statuses */}
                        {dayBookingsList.slice(0, 3).map((b, bIdx) => {
                          const theme = getStatusTheme(b.status);
                          return (
                            <span
                              key={bIdx}
                              className={`w-1.5 h-1.5 rounded-full ${theme.dot} shrink-0 animate-in fade-in`}
                            />
                          );
                        })}
                        {dayBookingsList.length > 3 && (
                          <span className="text-[9px] font-extrabold text-slate-600 dark:text-slate-300 leading-none">
                            +{dayBookingsList.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Booking Event Pills inside Cell */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    {dayBookingsList.slice(0, 2).map((booking) => {
                      const theme = getStatusTheme(booking.status);
                      const isNew =
                        unopenedBookingIds.has(String(booking.id)) ||
                        (booking.bookingNumber && unopenedBookingIds.has(String(booking.bookingNumber))) ||
                        ((booking as any)._id && unopenedBookingIds.has(String((booking as any)._id)));
                      return (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(booking);
                          }}
                          className={`px-1.5 py-0.5 rounded-lg border-l-2 text-[10px] font-semibold truncate transition-all cursor-pointer ${theme.card} hover:scale-[1.02] flex items-center justify-between gap-1`}
                          title={`#${booking.bookingNumber || booking.id} • ${booking.customerName} • ${booking.serviceTitle} (${booking.timeSlot})`}
                        >
                          <div className="flex items-center min-w-0 truncate">
                            <span className="font-extrabold mr-1 shrink-0">{booking.timeSlot?.split("-")[0]?.trim()}</span>
                            <span className="truncate">{booking.customerName}</span>
                          </div>
                          {isNew && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
                              title="New Booking Received"
                            />
                          )}
                        </div>
                      );
                    })}

                    {dayBookingsList.length > 2 && (
                      <span className="text-[9px] font-extrabold text-brand-600 dark:text-brand-400 pl-1 block hover:underline">
                        +{dayBookingsList.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── VIEW 2: WEEK CALENDAR VIEW ─── */}
      {viewMode === "week" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Weekdays Header Column */}
          <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
            {/* Time Slot column header */}
            <div className="py-2.5 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase border-r border-slate-200 dark:border-slate-800">
              Time
            </div>

            {/* 7 Day Columns Header with DOTS */}
            {weekDays.map((colDay) => {
              const dayBookingsList = colDay.bookings;
              const hasBookings = dayBookingsList.length > 0;

              return (
                <div
                  key={colDay.dateKey}
                  onClick={() => {
                    setCurrentDate(colDay.date);
                    setViewMode("day");
                  }}
                  className={`py-2 px-1 border-r border-slate-200 dark:border-slate-800 transition-colors cursor-pointer hover:bg-brand-50/40 dark:hover:bg-brand-950/20 ${
                    colDay.isToday ? "bg-brand-50/50 dark:bg-brand-950/30" : ""
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                    {colDay.date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>

                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                        colDay.isToday
                          ? "bg-brand-600 text-white shadow-xs"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {colDay.date.getDate()}
                    </span>

                    {/* ─── DOTS ON DATE THAT HAVE BOOKINGS ─── */}
                    {hasBookings && (
                      <div
                        className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded-full"
                        title={`${dayBookingsList.length} bookings`}
                      >
                        {dayBookingsList.slice(0, 2).map((b, idx) => (
                          <span
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${getStatusTheme(b.status).dot}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hourly Timeline Grid */}
          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {hoursRange.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[64px] divide-x divide-slate-100 dark:divide-slate-800">
                {/* Time Label */}
                <div className="p-2 text-[10px] font-semibold font-mono text-slate-400 text-right pr-3 select-none">
                  {formatHour(hour)}
                </div>

                {/* Day Cells for this Hour */}
                {weekDays.map((colDay) => {
                  // Find bookings falling in this hour
                  const hourBookings = colDay.bookings.filter((b) => {
                    const bHour = parseBookingHour(b.timeSlot || b.scheduledTime);
                    return bHour === hour;
                  });

                  return (
                    <div
                      key={colDay.dateKey}
                      className="p-1 space-y-1 relative hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {hourBookings.map((b) => {
                        const theme = getStatusTheme(b.status);
                        const isNew =
                          unopenedBookingIds.has(String(b.id)) ||
                          (b.bookingNumber && unopenedBookingIds.has(String(b.bookingNumber))) ||
                          ((b as any)._id && unopenedBookingIds.has(String((b as any)._id)));
                        return (
                          <div
                            key={b.id}
                            onClick={() => onSelectBooking(b)}
                            className={`p-1.5 rounded-xl border-l-2 text-[10px] shadow-2xs transition-all cursor-pointer ${theme.card} hover:scale-[1.02]`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold truncate flex items-center gap-1">
                                <span className="truncate">{b.customerName}</span>
                                {isNew && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
                                    title="New Booking Received"
                                  />
                                )}
                              </span>
                              <span className="font-mono text-[9px] opacity-80">₹{b.totalAmount}</span>
                            </div>
                            <span className="truncate block opacity-90 text-[9.5px]">
                              {b.serviceTitle}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── VIEW 3: DAY VIEW ─── */}
      {viewMode === "day" && (
        <div className="space-y-4">
          {/* Day Timeline */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {hoursRange.map((hour) => {
              const hourBookings = dayBookings.filter((b) => {
                const bHour = parseBookingHour(b.timeSlot || b.scheduledTime);
                return bHour === hour;
              });

              return (
                <div key={hour} className="flex flex-col sm:flex-row sm:items-start p-3 sm:p-4 gap-3 sm:gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Time Badge */}
                  <div className="sm:w-28 shrink-0 flex items-center gap-1.5 text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatHour(hour)}</span>
                  </div>

                  {/* Bookings for this Hour */}
                  <div className="flex-1 space-y-2">
                    {hourBookings.length === 0 ? (
                      <div className="h-6 flex items-center text-[11px] text-slate-300 dark:text-slate-600 italic">
                        No appointments scheduled
                      </div>
                    ) : (
                      hourBookings.map((booking) => {
                        const theme = getStatusTheme(booking.status);
                        const isNew =
                          unopenedBookingIds.has(String(booking.id)) ||
                          (booking.bookingNumber && unopenedBookingIds.has(String(booking.bookingNumber))) ||
                          ((booking as any)._id && unopenedBookingIds.has(String((booking as any)._id)));
                        return (
                          <div
                            key={booking.id}
                            className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${theme.card} flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:shadow-md transition-all`}
                          >
                            {/* Left: Info */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>#{booking.bookingNumber || booking.id}</span>
                                  {isNew && (
                                    <span
                                      className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-xs"
                                      title="New Booking Received"
                                    />
                                  )}
                                </span>
                                <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                  {booking.status}
                                </span>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  • {booking.timeSlot}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {booking.serviceTitle}
                              </h4>

                              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{booking.customerName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{booking.customerPhone}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="truncate max-w-[200px]">{booking.locality || booking.address}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Partner + Price + Actions */}
                            <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white block font-mono">
                                  ₹{booking.totalAmount}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold block">
                                  {booking.technicianName || "Unassigned"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {onAssignPartner && !booking.technicianName && (
                                  <button
                                    type="button"
                                    onClick={() => onAssignPartner(booking)}
                                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 cursor-pointer"
                                    title="Assign Partner"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onSelectBooking(booking)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

