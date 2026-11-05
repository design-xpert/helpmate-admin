"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  AlertCircle,
  Ban,
  Clock,
  Layers,
  Tag,
  Package,
  ShieldAlert,
  Sparkles,
  Wind,
  Hammer,
  Droplets,
  Paintbrush,
  Tv,
  Zap,
  Car,
  Wrench,
  Info,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { ServiceItem } from "@/lib/mockData";
import { ApiCategory } from "@/lib/api";

export interface DayOffRule {
  id: string;
  scope: "all" | "category" | "package";
  targetId?: string;
  targetName: string;
  categoryName?: string;
  date: string; // "YYYY-MM-DD"
  endDate?: string; // Optional multi-day end date "YYYY-MM-DD"
  timeSlot: "all" | "morning" | "afternoon" | "evening";
  reason: string;
  isActive: boolean;
  createdAt: string;
}

const STORAGE_KEY = "helpmate_cms_dayoff_rules_v1";

// ─── DEFAULT REALISTIC BLACKOUT / DAY-OFF RULES FOR VARANASI MARKET ───
const defaultDayOffRules: DayOffRule[] = [
  {
    id: "off-1",
    scope: "all",
    targetName: "All Services & Packages",
    date: "2026-11-07",
    timeSlot: "all",
    reason: "Public Holiday - Chhath Puja Ghat Gatherings",
    isActive: true,
    createdAt: "2026-11-01T10:00:00Z",
  },
  {
    id: "off-2",
    scope: "category",
    targetId: "cat-ac",
    targetName: "AC Services",
    date: "2026-11-12",
    timeSlot: "all",
    reason: "AC Specialist Fleet Winter Calibration Training",
    isActive: true,
    createdAt: "2026-11-02T11:00:00Z",
  },
  {
    id: "off-3",
    scope: "package",
    targetId: "srv-1",
    targetName: "Split AC Foam Jet Deep Clean & Gas Top-up",
    categoryName: "AC Services",
    date: "2026-11-15",
    timeSlot: "all",
    reason: "Power Jet Pump Machinery Maintenance & Upgrades",
    isActive: true,
    createdAt: "2026-11-02T12:00:00Z",
  },
  {
    id: "off-4",
    scope: "category",
    targetId: "cat-paint",
    targetName: "Painting",
    date: "2026-11-18",
    timeSlot: "all",
    reason: "Monsoon Dew & High Humidity Advisory",
    isActive: true,
    createdAt: "2026-11-03T09:00:00Z",
  },
  {
    id: "off-5",
    scope: "package",
    targetId: "srv-2",
    targetName: "Full Home Deep Scrubbing & Anti-Bacterial Sanitization",
    categoryName: "Cleaning",
    date: "2026-11-20",
    timeSlot: "morning",
    reason: "Morning Shift Crew Relocated to Bhelupur High-Priority Site",
    isActive: true,
    createdAt: "2026-11-03T14:00:00Z",
  },
  {
    id: "off-6",
    scope: "all",
    targetName: "All Services & Packages",
    date: "2026-11-24",
    timeSlot: "all",
    reason: "Annual Helpmate Varanasi Technicians Convocation",
    isActive: true,
    createdAt: "2026-11-04T08:00:00Z",
  },
  {
    id: "off-7",
    scope: "category",
    targetId: "cat-plumb",
    targetName: "Plumbing",
    date: "2026-11-28",
    timeSlot: "evening",
    reason: "Evening Pipeline Pressure Testing by Municipal Corporation",
    isActive: true,
    createdAt: "2026-11-04T09:00:00Z",
  },
];

// Fallback categories if none passed
const fallbackCategories = [
  { id: "cat-ac", name: "AC Services" },
  { id: "cat-carp", name: "Carpenter" },
  { id: "cat-clean", name: "Cleaning" },
  { id: "cat-elec", name: "Electrician" },
  { id: "cat-paint", name: "Painting" },
  { id: "cat-pest", name: "Pest Control" },
  { id: "cat-plumb", name: "Plumbing" },
  { id: "cat-app", name: "Appliances" },
  { id: "cat-car", name: "Car Washing" },
];

// Fallback packages if none passed
const fallbackPackages = [
  { id: "srv-1", title: "Split AC Foam Jet Deep Clean & Gas Top-up", category: "AC Services", price: 1899 },
  { id: "srv-2", title: "Full Home Deep Scrubbing & Anti-Bacterial Sanitization", category: "Cleaning", price: 3450 },
  { id: "srv-3", title: "Inverter & Switchboard MCB Wiring Repair", category: "Electrician", price: 799 },
  { id: "srv-4", title: "Bathroom Concealed Pipe Leakage & Valve Fix", category: "Plumbing", price: 1150 },
  { id: "srv-5", title: "Main Door Mortise Lock & Modular Hinge Alignment", category: "Carpenter", price: 649 },
  { id: "srv-6", title: "Herbal Bed Bug & Cockroach Gel Treatment", category: "Pest Control", price: 2200 },
  { id: "srv-7", title: "Waterproofing & Living Room Acrylic Emulsion", category: "Painting", price: 4800 },
  { id: "srv-8", title: "Front Load Washing Machine Drum Balancing", category: "Appliances", price: 1450 },
  { id: "srv-9", title: "Sedan Foam Wash, Interior Vacuum & Tyre Polish", category: "Car Washing", price: 899 },
];

function getCategoryIcon(cat: string, className = "w-3.5 h-3.5") {
  const c = cat.toLowerCase();
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

interface ServiceAvailabilityCalendarProps {
  categories?: (ApiCategory | { _id?: string; id?: string; categoryName?: string; name?: string })[];
  services?: ServiceItem[];
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export function ServiceAvailabilityCalendar({
  categories = [],
  services = [],
  isAddModalOpen = false,
  onCloseAddModal,
}: ServiceAvailabilityCalendarProps) {
  // Calendar month state (November 2026 default)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 1)); // Nov 2026

  // Rules list state with localStorage persistence
  const [rules, setRules] = useState<DayOffRule[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.error("Failed to load stored day off rules:", err);
      }
    }
    return defaultDayOffRules;
  });

  // Save rules to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
      } catch (err) {
        console.error("Failed to save day off rules:", err);
      }
    }
  }, [rules]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "platform" | "category" | "package">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Selected date for detailed view
  const [selectedDate, setSelectedDate] = useState<string>("2026-11-07");
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);

  // Internal Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DayOffRule | null>(null);

  // Sync with parent props
  useEffect(() => {
    if (isAddModalOpen) {
      setIsModalOpen(true);
      setEditingRule(null);
    }
  }, [isAddModalOpen]);

  // Form Fields State
  const [formScope, setFormScope] = useState<"all" | "category" | "package">("all");
  const [formTargetId, setFormTargetId] = useState("");
  const [formTargetName, setFormTargetName] = useState("All Services & Packages");
  const [formCategoryName, setFormCategoryName] = useState("");
  const [formDate, setFormDate] = useState(selectedDate || "2026-11-10");
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [formEndDate, setFormEndDate] = useState("");
  const [formTimeSlot, setFormTimeSlot] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [formReason, setFormReason] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Modal Package / Category Search
  const [modalSearch, setModalSearch] = useState("");

  // Categories normalized list
  const normalizedCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c: any) => ({
        id: c._id || c.id || String(c.categoryName || c.name),
        name: c.categoryName || c.name || "General Category",
      }));
    }
    return fallbackCategories;
  }, [categories]);

  // Packages normalized list
  const normalizedPackages = useMemo(() => {
    if (services && services.length > 0) {
      return services.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category || "General",
        price: s.price || 0,
      }));
    }
    return fallbackPackages;
  }, [services]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 1)); // Default to Nov 2026 mock timeline
    setSelectedDate("2026-11-04");
  };

  // Calendar Days Calculation (Monday start)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const startDayOffset = (firstDayIndex + 6) % 7; // 0 for Monday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Prev month padding
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === "2026-11-04",
      });
    }

    // Current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === "2026-11-04",
      });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === "2026-11-04",
      });
    }

    return days;
  }, [year, month]);

  // Check if a rule applies to a specific date (handles single date and date range)
  const isRuleOnDate = (rule: DayOffRule, dateStr: string) => {
    if (!rule.endDate) {
      return rule.date === dateStr;
    }
    return dateStr >= rule.date && dateStr <= rule.endDate;
  };

  // Filtered Rules by Search & Scope
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      // Scope Filter
      if (scopeFilter === "platform" && r.scope !== "all") return false;
      if (scopeFilter === "category" && r.scope !== "category") return false;
      if (scopeFilter === "package" && r.scope !== "package") return false;

      // Status Filter
      if (statusFilter === "active" && !r.isActive) return false;
      if (statusFilter === "inactive" && r.isActive) return false;

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTarget = r.targetName.toLowerCase().includes(q);
        const matchCategory = r.categoryName ? r.categoryName.toLowerCase().includes(q) : false;
        const matchReason = r.reason.toLowerCase().includes(q);
        const matchDate = r.date.includes(q) || (r.endDate && r.endDate.includes(q));
        if (!matchTarget && !matchCategory && !matchReason && !matchDate) return false;
      }

      return true;
    });
  }, [rules, scopeFilter, statusFilter, searchQuery]);

  // Map of rules by date for quick lookup in calendar cells
  const rulesByDateMap = useMemo(() => {
    const map = new Map<string, DayOffRule[]>();
    filteredRules.forEach((rule) => {
      if (!rule.endDate) {
        const arr = map.get(rule.date) || [];
        arr.push(rule);
        map.set(rule.date, arr);
      } else {
        // Multi-day range: populate each day
        calendarDays.forEach((cd) => {
          if (cd.dateStr >= rule.date && cd.dateStr <= (rule.endDate || rule.date)) {
            const arr = map.get(cd.dateStr) || [];
            arr.push(rule);
            map.set(cd.dateStr, arr);
          }
        });
      }
    });
    return map;
  }, [filteredRules, calendarDays]);

  // Monthly Quick Stats
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthStats = useMemo(() => {
    const monthRules = rules.filter((r) => r.date.startsWith(currentMonthPrefix) && r.isActive);
    const platformDays = monthRules.filter((r) => r.scope === "all").length;
    const categoryDays = monthRules.filter((r) => r.scope === "category").length;
    const packageDays = monthRules.filter((r) => r.scope === "package").length;

    // Unique blackout dates count in this month
    const blackoutDates = new Set<string>();
    monthRules.forEach((r) => {
      blackoutDates.add(r.date);
    });

    return {
      totalDates: blackoutDates.size,
      platformDays,
      categoryDays,
      packageDays,
    };
  }, [rules, currentMonthPrefix]);

  // Open modal to add day off for a specific date
  const handleOpenAddForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setFormDate(dateStr);
    setFormEndDate("");
    setIsMultiDay(false);
    setFormScope("all");
    setFormTargetName("All Services & Packages");
    setFormTargetId("");
    setFormCategoryName("");
    setFormTimeSlot("all");
    setFormReason("");
    setFormIsActive(true);
    setEditingRule(null);
    setIsModalOpen(true);
  };

  // Open edit modal for an existing rule
  const handleOpenEdit = (rule: DayOffRule) => {
    setEditingRule(rule);
    setFormScope(rule.scope);
    setFormTargetId(rule.targetId || "");
    setFormTargetName(rule.targetName);
    setFormCategoryName(rule.categoryName || "");
    setFormDate(rule.date);
    setIsMultiDay(Boolean(rule.endDate));
    setFormEndDate(rule.endDate || "");
    setFormTimeSlot(rule.timeSlot);
    setFormReason(rule.reason);
    setFormIsActive(rule.isActive);
    setIsModalOpen(true);
  };

  // Delete a rule
  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Toggle active status
  const handleToggleRuleStatus = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  // Save rule (Create or Update)
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();

    let targetName = formTargetName;
    let targetId = formTargetId;
    let categoryName = formCategoryName;

    if (formScope === "all") {
      targetName = "All Services & Packages";
      targetId = "";
      categoryName = "";
    } else if (formScope === "category") {
      const found = normalizedCategories.find((c) => c.id === formTargetId);
      targetName = found ? found.name : formTargetName || "Service Category";
      categoryName = targetName;
    } else if (formScope === "package") {
      const found = normalizedPackages.find((p) => p.id === formTargetId);
      targetName = found ? found.title : formTargetName || "Custom Package";
      categoryName = found ? found.category : formCategoryName || "General";
    }

    if (editingRule) {
      // Update
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                scope: formScope,
                targetId,
                targetName,
                categoryName,
                date: formDate,
                endDate: isMultiDay && formEndDate ? formEndDate : undefined,
                timeSlot: formTimeSlot,
                reason: formReason.trim() || "Service Blackout / Unavailable",
                isActive: formIsActive,
              }
            : r
        )
      );
    } else {
      // Create new
      const newRule: DayOffRule = {
        id: `off-${Date.now()}`,
        scope: formScope,
        targetId,
        targetName,
        categoryName,
        date: formDate,
        endDate: isMultiDay && formEndDate ? formEndDate : undefined,
        timeSlot: formTimeSlot,
        reason: formReason.trim() || "Service Blackout / Unavailable",
        isActive: formIsActive,
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [newRule, ...prev]);
    }

    setIsModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  // Filtered packages for modal selector
  const filteredModalPackages = useMemo(() => {
    if (!modalSearch.trim()) return normalizedPackages;
    const q = modalSearch.toLowerCase().trim();
    return normalizedPackages.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [normalizedPackages, modalSearch]);

  // Filtered categories for modal selector
  const filteredModalCategories = useMemo(() => {
    if (!modalSearch.trim()) return normalizedCategories;
    const q = modalSearch.toLowerCase().trim();
    return normalizedCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [normalizedCategories, modalSearch]);

  // Rules for currently selected date
  const selectedDateRules = useMemo(() => {
    return rules.filter((r) => isRuleOnDate(r, selectedDate));
  }, [rules, selectedDate]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ─── 1. TOP STATS RIBBON ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stat 1: Total Blackout Dates */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Blackout Dates ({monthNames[month]})
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {monthStats.totalDates} Days
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Bookings restricted</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <Ban className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Entire Platform Day Offs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Full Platform Day Offs
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {monthStats.platformDays} Days
            </div>
            <span className="text-[10px] text-slate-400 font-medium">All services suspended</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Layers className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        {/* Stat 3: Category Day Offs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Category Blackouts
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {monthStats.categoryDays} Rules
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Specific trade day offs</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4: Custom Package Offs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Package Bookings Off
            </span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {monthStats.packageDays} Rules
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Individual package paused</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── 2. SEARCH & FILTER TOOLBAR ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar for Package or Category */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search package or category to check day off rules (e.g., 'AC', 'Plumbing', 'Chhath')..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scope Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <span className="text-[11px] font-extrabold text-slate-400 mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-brand-600" /> Filter:
            </span>
            {[
              { id: "all", label: "All Rules" },
              { id: "platform", label: "Full Day Off" },
              { id: "category", label: "Category Off" },
              { id: "package", label: "Package Off" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setScopeFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  scopeFilter === f.id
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-300 dark:border-brand-700 shadow-2xs font-extrabold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Add Day Off */}
          <button
            type="button"
            onClick={() => handleOpenAddForDate(selectedDate || "2026-11-10")}
            className="px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs"
          >
            <Plus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Add Day Off</span>
          </button>
        </div>

        {searchQuery && (
          <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-bold bg-brand-50/50 dark:bg-brand-950/40 px-3 py-1.5 rounded-xl border border-brand-100 dark:border-brand-900/60">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              Highlighting days with blackout rules matching &quot;{searchQuery}&quot; ({filteredRules.length} matches found)
            </span>
          </div>
        )}
      </div>

      {/* ─── 3. MAIN SPLIT: INTERACTIVE CALENDAR GRID (8 COLS) + UPCOMING DAY OFFS (4 COLS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (8 Cols): Monthly Calendar View */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Calendar Month Header & Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {monthNames[month]} {year}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Click any date cell to configure service availability or schedule a day off
                </p>
              </div>
            </div>

            {/* Navigation Controls: Secondary Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-[11px] text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-rose-500">Sat</span>
            <span className="text-rose-500">Sun</span>
          </div>

          {/* 7x5 or 7x6 Date Cell Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell) => {
              const dayRules = rulesByDateMap.get(cell.dateStr) || [];
              const hasPlatformDayOff = dayRules.some((r) => r.scope === "all" && r.isActive);
              const hasCategoryOff = dayRules.some((r) => r.scope === "category" && r.isActive);
              const hasPackageOff = dayRules.some((r) => r.scope === "package" && r.isActive);
              const isSelected = selectedDate === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    setIsDayDetailOpen(true);
                  }}
                  className={`min-h-[96px] sm:min-h-[110px] p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                    !cell.isCurrentMonth
                      ? "opacity-35 bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/60"
                      : hasPlatformDayOff
                      ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/70 hover:shadow-xs"
                      : isSelected
                      ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 shadow-2xs ring-1 ring-brand-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-brand-300 dark:hover:border-slate-700 hover:shadow-xs"
                  }`}
                >
                  {/* Top: Day Number & Today indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        cell.isToday
                          ? "w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs"
                          : hasPlatformDayOff
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick indicator icon */}
                    {hasPlatformDayOff ? (
                      <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-0.5">
                        <Ban className="w-3 h-3" />
                      </span>
                    ) : dayRules.length > 0 ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    ) : null}
                  </div>

                  {/* Middle: Badges for Day-Off Rules */}
                  <div className="space-y-1 my-1 flex-1 overflow-hidden">
                    {hasPlatformDayOff ? (
                      <div className="bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-black px-1.5 py-0.5 rounded-lg truncate border border-rose-200 dark:border-rose-900">
                        🛑 Full Day Off
                      </div>
                    ) : null}

                    {dayRules
                      .filter((r) => r.scope !== "all")
                      .slice(0, hasPlatformDayOff ? 1 : 2)
                      .map((r) => {
                        const isCat = r.scope === "category";
                        return (
                          <div
                            key={r.id}
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg truncate border ${
                              isCat
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                                : "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900"
                            }`}
                          >
                            {isCat ? "🏷️ " : "📦 "}
                            {r.targetName} Off
                          </div>
                        );
                      })}

                    {dayRules.length > (hasPlatformDayOff ? 2 : 2) && (
                      <span className="text-[9px] font-extrabold text-slate-400 pl-1">
                        +{dayRules.length - (hasPlatformDayOff ? 2 : 2)} more
                      </span>
                    )}
                  </div>

                  {/* Bottom: Quick Add trigger on hover */}
                  <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 hover:underline">
                      Configure →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-300 dark:bg-rose-950 dark:border-rose-800"></span>
              <span>Full Day Off (All Services)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300 dark:bg-amber-950 dark:border-amber-800"></span>
              <span>Category Day Off</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-100 border border-purple-300 dark:bg-purple-950 dark:border-purple-800"></span>
              <span>Package Booking Off</span>
            </div>
          </div>
        </div>

        {/* Right (4 Cols): Agenda List of Blackouts & Day Details */}
        <div className="lg:col-span-4 space-y-4">
          {/* Box 1: Selected Day Details Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-brand-600" />
                  <span>Selected Date: {selectedDate}</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  {selectedDateRules.length} blackout rule(s) configured for this date
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddForDate(selectedDate)}
                className="px-2.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Add</span>
              </button>
            </div>

            {selectedDateRules.length === 0 ? (
              <div className="py-6 text-center text-slate-400 space-y-1">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Fully Available For Bookings
                </p>
                <p className="text-[10px]">
                  All categories and packages can be booked normally on this date.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAddForDate(selectedDate)}
                  className="mt-2 text-xs font-extrabold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set day off for this date</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {selectedDateRules.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      r.scope === "all"
                        ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                        : r.scope === "category"
                        ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                        : "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          r.scope === "all"
                            ? "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                            : r.scope === "category"
                            ? "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            : "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        }`}
                      >
                        {r.scope === "all" ? "Full Platform Off" : r.scope === "category" ? "Category Off" : "Package Off"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                          title="Edit rule"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(r.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1.5">
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        {r.scope === "category" && getCategoryIcon(r.targetName)}
                        <span>{r.targetName}</span>
                      </h5>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        {r.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {r.timeSlot === "all" ? "All Day" : `${r.timeSlot} slots`}
                        </span>
                        <span>•</span>
                        <span className={r.isActive ? "text-emerald-600 font-bold" : "text-slate-400 font-bold"}>
                          {r.isActive ? "Enforced" : "Paused"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Box 2: All Upcoming Day-Offs List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-rose-600" />
                  <span>Upcoming Blackout Schedule</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  {filteredRules.length} total scheduled rules
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {filteredRules.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic text-xs">
                  No day off rules match current filters.
                </div>
              ) : (
                filteredRules.map((rule) => {
                  return (
                    <div
                      key={rule.id}
                      className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 transition-all flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-black text-brand-600 dark:text-brand-400">
                          {rule.date} {rule.endDate ? `to ${rule.endDate}` : ""}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            rule.scope === "all"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : rule.scope === "category"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          {rule.scope === "all" ? "All Services" : rule.scope === "category" ? "Category" : "Package"}
                        </span>
                      </div>

                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {rule.targetName}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {rule.reason}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleToggleRuleStatus(rule.id)}
                          className={`font-bold cursor-pointer hover:underline ${
                            rule.isActive ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {rule.isActive ? "● Active (Click to Pause)" : "○ Paused (Click to Enable)"}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(rule)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. MODAL: SET DAY OFF / SERVICE UNAVAILABLE ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingRule ? "Edit Day-Off / Blackout Rule" : "Set Day Off / Service Unavailable"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Control booking availability for holidays, categories, or custom packages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseAddModal) onCloseAddModal();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              {/* Scope Selector: 3 Visual Cards */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-900 dark:text-white block">
                  Select Unavailability Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => {
                      setFormScope("all");
                      setFormTargetName("All Services & Packages");
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-center ${
                      formScope === "all"
                        ? "bg-rose-50 dark:bg-rose-950/50 border-rose-500 shadow-2xs font-extrabold text-rose-700 dark:text-rose-300"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Ban className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                    <span>All Services (Full Day Off)</span>
                  </div>

                  <div
                    onClick={() => {
                      setFormScope("category");
                      if (normalizedCategories.length > 0 && !formTargetId) {
                        setFormTargetId(normalizedCategories[0].id);
                        setFormTargetName(normalizedCategories[0].name);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-center ${
                      formScope === "category"
                        ? "bg-amber-50 dark:bg-amber-950/50 border-amber-500 shadow-2xs font-extrabold text-amber-700 dark:text-amber-300"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Tag className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span>Category Day Off</span>
                  </div>

                  <div
                    onClick={() => {
                      setFormScope("package");
                      if (normalizedPackages.length > 0 && !formTargetId) {
                        setFormTargetId(normalizedPackages[0].id);
                        setFormTargetName(normalizedPackages[0].title);
                        setFormCategoryName(normalizedPackages[0].category);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-center ${
                      formScope === "package"
                        ? "bg-purple-50 dark:bg-purple-950/50 border-purple-500 shadow-2xs font-extrabold text-purple-700 dark:text-purple-300"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Package className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span>Custom Package Off</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Target Selection: Category */}
              {formScope === "category" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="font-extrabold text-slate-900 dark:text-white block">
                    Choose Service Category to Pause
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search category (e.g. AC, Cleaning, Electrician)..."
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-1 divide-y divide-slate-100 dark:divide-slate-800 no-scrollbar">
                      {filteredModalCategories.map((c) => {
                        const isSelected = formTargetId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setFormTargetId(c.id);
                              setFormTargetName(c.name);
                              setFormCategoryName(c.name);
                            }}
                            className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 font-extrabold"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {getCategoryIcon(c.name)}
                              <span>{c.name}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Target Selection: Package */}
              {formScope === "package" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="font-extrabold text-slate-900 dark:text-white block">
                    Choose Specific Package / Offering to Pause
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search service package title..."
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-1 divide-y divide-slate-100 dark:divide-slate-800 no-scrollbar">
                      {filteredModalPackages.map((p) => {
                        const isSelected = formTargetId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setFormTargetId(p.id);
                              setFormTargetName(p.title);
                              setFormCategoryName(p.category);
                            }}
                            className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-200 font-extrabold"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold truncate">{p.title}</p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {p.category} • ₹{p.price}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Date Selection & Multi-Day Range Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 dark:text-white">
                    Blackout Date
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500 font-medium">
                    <input
                      type="checkbox"
                      checked={isMultiDay}
                      onChange={(e) => setIsMultiDay(e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span>Multi-Day Range?</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      {isMultiDay ? "Start Date" : "Date"}
                    </span>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                    />
                  </div>

                  {isMultiDay && (
                    <div className="animate-in fade-in duration-150">
                      <span className="text-[10px] text-slate-400 block mb-0.5">End Date</span>
                      <input
                        type="date"
                        required={isMultiDay}
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        min={formDate}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Time Slot Scope */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-900 dark:text-white block">
                  Time Slot Blackout
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "all", label: "All Day" },
                    { id: "morning", label: "Morning" },
                    { id: "afternoon", label: "Afternoon" },
                    { id: "evening", label: "Evening" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormTimeSlot(s.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                        formTimeSlot === s.id
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-900 dark:text-white block">
                  Reason for Unavailability / Blackout
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {[
                    "Festival / Public Holiday",
                    "Specialist Team Training",
                    "Heavy Rain / Monsoon Advisory",
                    "Machinery Maintenance",
                    "Capacity Full / Overbooked",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormReason(preset)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Diwali celebration - technicians off duty"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">
                    Enforce Rule Immediately
                  </span>
                  <span className="text-[10px] text-slate-400">
                    When active, customers will see this day/package marked unavailable during booking
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {/* Modal Actions: Strictly Single Primary Button */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onCloseAddModal) onCloseAddModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRule ? "Save Rule Changes" : "Create Blackout Rule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

