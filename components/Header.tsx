"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  MapPin,
  Bell,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  X,
  PhoneCall,
  Sun,
  Moon,
  UserCheck,
  User,
  Settings,
  LogOut,
  Wrench,
  DollarSign,
  CalendarCheck,
  Menu,
  Calendar,
  FileText,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { varanasiLocalities, initialBookings, initialCustomers, initialTechnicians } from "@/lib/mockData";
import { useTheme } from "@/context/ThemeContext";
import { useRbac, RoleType } from "@/context/RbacContext";
import { Portal } from "@/components/Portal";

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { role, setRole } = useRbac();

  const [selectedZone, setSelectedZone] = useState("All Varanasi");
  const [isZoneOpen, setIsZoneOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSearchCategory, setActiveSearchCategory] = useState("All");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const headerRef = useRef<HTMLElement>(null);

  // Auto-close search modal when page changes
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  // Close header dropdowns when user clicks outside the header
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsZoneOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K or Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute global search matches across Bookings, Customers, Partners, and Invoices
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { bookings: [], customers: [], technicians: [], invoices: [] };

    // 1. Match Bookings
    const matchedBookings = initialBookings
      .filter((b) => {
        const bId = (b.id || "").toLowerCase();
        const cust = (b.customerName || "").toLowerCase();
        const phone = (b.customerPhone || "").toLowerCase();
        const service = (b.serviceTitle || b.serviceName || "").toLowerCase();
        const tech = (b.technicianName || "").toLowerCase();
        const category = (b.category || "").toLowerCase();
        return bId.includes(q) || cust.includes(q) || phone.includes(q) || service.includes(q) || tech.includes(q) || category.includes(q);
      })
      .slice(0, 4);

    // 2. Match Customers
    const matchedCustomers = initialCustomers
      .filter((c) => {
        const name = (c.name || "").toLowerCase();
        const phone = (c.phone || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const locality = (c.locality || "").toLowerCase();
        const cId = (c.id || "").toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q) || locality.includes(q) || cId.includes(q);
      })
      .slice(0, 4);

    // 3. Match Technicians / Partners
    const matchedTechnicians = initialTechnicians
      .filter((t) => {
        const name = (t.name || "").toLowerCase();
        const category = (t.category || "").toLowerCase();
        const phone = (t.phone || "").toLowerCase();
        const locality = (t.locality || "").toLowerCase();
        const role = (t.role || "").toLowerCase();
        const tId = (t.id || "").toLowerCase();
        return name.includes(q) || category.includes(q) || phone.includes(q) || locality.includes(q) || role.includes(q) || tId.includes(q);
      })
      .slice(0, 4);

    // 4. Match Invoices & Billing
    const matchedInvoices = initialBookings
      .filter((b) => {
        const invId = `inv-${(b.id || "").replace(/^(bk-)?/gi, "")}`.toLowerCase();
        const origId = (b.id || "").toLowerCase();
        const service = (b.serviceTitle || "").toLowerCase();
        const cust = (b.customerName || "").toLowerCase();
        const total = `${b.totalAmount || ""}`;
        return invId.includes(q) || (q.startsWith("inv") && origId.includes(q.replace(/^inv-?/i, ""))) || service.includes(q) || cust.includes(q) || total.includes(q);
      })
      .slice(0, 4);

    return {
      bookings: matchedBookings,
      customers: matchedCustomers,
      technicians: matchedTechnicians,
      invoices: matchedInvoices,
    };
  }, [searchQuery]);

  const totalResultsCount =
    searchResults.bookings.length +
    searchResults.customers.length +
    searchResults.technicians.length +
    searchResults.invoices.length;

  const isPartner = role === "Service Partner";

  const adminRoles: RoleType[] = [
    "Super Admin",
    "Office Admin",
    "Varanasi Operations Coordinator",
    "Quality Inspector",
    "Billing & Finance Manager",
    "Support Agent",
  ];

  const notifications = [
    {
      id: "n-1",
      jobStatus: "Assigned",
      title: isPartner ? "New Assigned Booking #BK-VAR-8821" : "Job #BK-VAR-8821 Assigned",
      desc: isPartner
        ? "Split AC Power Jet requested at Sigra, Varanasi (Customer: Rajesh Agrawal)"
        : "Assigned Ramesh Yadav to Split AC Jet Wash at Sigra, Varanasi",
      time: "2 mins ago",
    },
    {
      id: "n-2",
      jobStatus: "En Route",
      title: "Partner En Route to Location",
      desc: "Partner Ramesh Yadav is traveling to customer site at Sigra, Varanasi (Est. arrival: 12 mins)",
      time: "8 mins ago",
    },
    {
      id: "n-3",
      jobStatus: "In Progress",
      title: "Work Started on Site",
      desc: "Partner reached site and started Split AC Foam Jet Wash for Alok Verma (#BK-VAR-8819)",
      time: "20 mins ago",
    },
    {
      id: "n-4",
      jobStatus: "Completed",
      title: "Job Completed & OTP Verified",
      desc: "4-Digit closure OTP 8821 verified for Sunita Devi. Receipt generated.",
      time: "35 mins ago",
    },
  ];

  const handleLinkClick = (href: string) => {
    if (pathname === href) {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header
      ref={headerRef}
      className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200 shadow-xs shrink-0"
    >
      {/* Mobile Hamburger & Header Breadcrumbs / Brand Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 min-w-0 shrink max-w-[52%] sm:max-w-[58%] md:max-w-xs lg:max-w-sm xl:max-w-md">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open Mobile Menu"
          className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Mark (shown on phones < md) */}
        <Link
          href={isPartner ? "/partner" : "/"}
          className="flex items-center gap-1.5 sm:gap-2 md:hidden min-w-0 group shrink"
        >
          <Image
            src="/logo.png"
            alt="HelpMate"
            width={28}
            height={28}
            className="h-6 sm:h-7 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight truncate leading-tight">
              HelpMate
            </span>
            <span className="text-[9px] font-semibold text-brand-600 dark:text-brand-400 truncate leading-tight hidden min-[360px]:inline">
              {isPartner ? "Partner" : "Admin HQ"}
            </span>
          </div>
        </Link>

        {/* Desktop / Tablet Breadcrumbs (shown on >= md) */}
        <div className="min-w-0 overflow-hidden hidden md:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Center: Global Search Launcher Button (Desktop & Tablet >= md) */}
      <div className="flex-1 max-w-[170px] sm:max-w-[210px] md:max-w-[240px] lg:max-w-xs xl:max-w-md mx-2 lg:mx-4 relative hidden md:block">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full pl-9 pr-12 lg:pr-14 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-between transition-all shadow-2xs group cursor-pointer relative"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors absolute left-3 top-1/2 -translate-y-1/2" />
          <span className="truncate">
            {searchQuery.trim() ? searchQuery : "Search anything..."}
          </span>
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 pointer-events-none shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons & Controls */}
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-2.5 shrink-0 ml-auto">
        {/* Mobile Search Toggle Button (shown on phones < md) */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Open Search"
          className="md:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Toggle Button (Light/Dark Mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer shrink-0"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Varanasi Zone Filter - HIDDEN on Mobile (< md breakpoint) */}
        <div className="hidden md:block relative">
          <button
            type="button"
            onClick={() => {
              setIsZoneOpen(!isZoneOpen);
              setIsNotificationsOpen(false);
              setIsProfileOpen(false);
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="max-w-[70px] lg:max-w-[120px] xl:max-w-none truncate">
              {typeof selectedZone === "string" ? selectedZone : (selectedZone as any)?.name || "All Varanasi"}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {isZoneOpen && (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50 max-h-80 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedZone("All Varanasi");
                  setIsZoneOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                All Varanasi (All Partners)
              </button>
              {varanasiLocalities.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setSelectedZone(loc.name);
                    setIsZoneOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {loc.name} ({loc.pincode})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Drawer Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsZoneOpen(false);
              setIsProfileOpen(false);
            }}
            aria-label="Open Notifications"
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 relative cursor-pointer shrink-0 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-brand-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {isNotificationsOpen && (
            <div className="fixed inset-x-3 sm:inset-x-auto sm:absolute sm:right-0 top-16 sm:top-full mt-2 sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-in zoom-in-95 duration-150 space-y-3 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Live Operations Alerts</h4>
                  <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white font-extrabold text-[10px]">
                    3 New
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-brand-600 underline"
                  >
                    Mark read
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left space-y-1 hover:border-brand-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${n.jobStatus === "Assigned"
                            ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                            : n.jobStatus === "En Route"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                              : n.jobStatus === "In Progress"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : n.jobStatus === "Completed"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          }`}
                      >
                        {n.jobStatus || "ORDER UPDATE"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block leading-tight">
                      {n.title}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/notifications"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-extrabold text-xs text-center block transition-colors"
                >
                  View All System Alerts & Broadcast Logs →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsZoneOpen(false);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div
              className={`w-7 sm:w-8 h-7 sm:h-8 rounded-xl ${isPartner
                ? "bg-gradient-to-tr from-emerald-600 to-teal-600"
                : "bg-gradient-to-tr from-brand-600 to-purple-600"
                } flex items-center justify-center font-bold text-white text-xs shadow-xs`}
            >
              {isPartner ? "RY" : "AV"}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {isPartner ? "Ramesh Yadav" : "Aman Verma"}
              </span>
              <span className="text-[9px] font-semibold text-brand-600 dark:text-brand-400">{role}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 sm:w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in zoom-in-95 duration-150 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${isPartner ? "bg-emerald-600" : "bg-brand-500"
                    } text-white font-black text-sm flex items-center justify-center shrink-0 shadow-lux`}
                >
                  {isPartner ? "RY" : "AV"}
                </div>
                <div className="truncate text-left">
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate block">
                    {isPartner ? "Ramesh Yadav" : "Aman Verma"}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block font-mono">
                    {isPartner ? "ramesh.hvac@helpmate.in" : "admin@helpmate.net.in"}
                  </span>
                  <span className="text-[9px] font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-1.5 py-0.2 rounded border border-brand-200 dark:border-brand-800 inline-block mt-0.5">
                    {role}
                  </span>
                </div>
              </div>

              <div className="p-1 space-y-0.5 text-xs font-bold">
                {isPartner ? (
                  <>
                    <Link
                      href="/partner"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 transition-colors"
                    >
                      <User className="w-4 h-4 text-emerald-500" />
                      <span>Partner Dashboard</span>
                    </Link>

                    <Link
                      href="/partner/bookings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4 text-brand-500" />
                      <span>My Assigned Jobs</span>
                    </Link>

                    <Link
                      href="/partner/services"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Wrench className="w-4 h-4 text-purple-500" />
                      <span>My Services & Rates</span>
                    </Link>

                    <Link
                      href="/partner/payouts"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>My Earnings & Wallet</span>
                    </Link>

                  </>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      <User className="w-4 h-4 text-brand-500" />
                      <span>My Profile Account</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </Link>

                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    localStorage.removeItem("helpmate_active_user_id");
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors font-bold text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── ANIMATED COMMAND PALETTE SEARCH OVERLAY MODAL ─── */}
      {isSearchOpen && (
        <Portal>
          {/* Outer Centering Backdrop Container */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsSearchOpen(false);
              }
            }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-3 sm:pt-14 px-2.5 sm:px-4 overflow-y-auto animate-in fade-in duration-150"
          >
            {/* Floating Spotlight Modal Card */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl z-10 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-150 my-2 sm:my-0"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Spotlight Input Header */}
                <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 sm:gap-3 relative bg-slate-50/60 dark:bg-slate-800/40">
                  <Search className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 ml-1" />
                  <div className="relative flex-1 flex items-center">
                    <input
                      ref={searchInputRef}
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search customer, partner, booking ID (e.g. BK000001), invoice..."
                      className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 font-extrabold outline-none pr-8"
                    />
                    {searchQuery && (
                      <button
                        key="clear-search-btn"
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSearchQuery("");
                          setTimeout(() => searchInputRef.current?.focus(), 10);
                        }}
                        className="absolute right-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title="Clear search query"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    key="esc-close-btn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsSearchOpen(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold cursor-pointer shrink-0 transition-colors flex items-center gap-1"
                    title="Close modal"
                  >
                    <span className="sm:hidden font-sans font-bold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Close
                    </span>
                    <span className="hidden sm:inline">ESC</span>
                  </button>
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-100/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
                  {["All", "Bookings", "Customers", "Service Partners", "Invoices"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveSearchCategory(cat);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        activeSearchCategory === cat
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Results & Quick Actions Body */}
                <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                  {!searchQuery.trim() ? (
                    <div className="space-y-3 py-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block px-1">
                        ⚡ Quick Navigation & Shortcuts
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Link
                          href="/bookings"
                          onClick={() => handleLinkClick("/bookings")}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50 dark:hover:bg-brand-950/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 text-left transition-colors cursor-pointer group"
                        >
                          <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-300 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                              All Bookings & Jobs
                            </span>
                            <span className="text-[11px] text-slate-500">View and manage active requests</span>
                          </div>
                        </Link>

                        <Link
                          href="/technicians/new"
                          onClick={() => handleLinkClick("/technicians/new")}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 text-left transition-colors cursor-pointer group"
                        >
                          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                              Add New Partner
                            </span>
                            <span className="text-[11px] text-slate-500">Register technician or vendor</span>
                          </div>
                        </Link>

                        <Link
                          href="/customers"
                          onClick={() => handleLinkClick("/customers")}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 text-left transition-colors cursor-pointer group"
                        >
                          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                              Customer Directory
                            </span>
                            <span className="text-[11px] text-slate-500">Customer contacts and addresses</span>
                          </div>
                        </Link>

                         <Link
                          href="/technicians"
                          onClick={() => handleLinkClick("/technicians")}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 text-left transition-colors cursor-pointer group"
                        >
                          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                              Partner Directory & Map
                            </span>
                            <span className="text-[11px] text-slate-500">Live partner tracking and list</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  ) : totalResultsCount === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No matches found for &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Try searching by Booking ID (e.g. BK000001), Customer Name, Mobile Number, or Partner Name.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 1. Bookings Results */}
                      {(activeSearchCategory === "All" || activeSearchCategory === "Bookings") && searchResults.bookings.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="px-2 text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Bookings & Jobs ({searchResults.bookings.length})
                          </div>
                          {searchResults.bookings.map((b) => (
                            <Link
                              key={b.id}
                              href={`/bookings/${b.id}`}
                              onClick={() => handleLinkClick(`/bookings/${b.id}`)}
                              className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[11px] font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-lg border border-brand-200 dark:border-brand-800">
                                    {b.id}
                                  </span>
                                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                    {b.customerName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">{b.serviceTitle || b.serviceName}</p>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                {b.status}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* 2. Customers Results */}
                      {(activeSearchCategory === "All" || activeSearchCategory === "Customers") && searchResults.customers.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="px-2 text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Customers ({searchResults.customers.length})
                          </div>
                          {searchResults.customers.map((c) => (
                            <Link
                              key={c.id}
                              href={`/customers/${c.id}`}
                              onClick={() => handleLinkClick(`/customers/${c.id}`)}
                              className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                    {c.name}
                                  </span>
                                  <span className="font-mono text-[10px] font-bold text-slate-400">
                                    ({c.id})
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono">{c.phone} • {c.locality}, Varanasi</p>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                                Profile
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* 3. Service Partners Results */}
                      {(activeSearchCategory === "All" || activeSearchCategory === "Service Partners") && searchResults.technicians.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="px-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5" /> Service Partners ({searchResults.technicians.length})
                          </div>
                          {searchResults.technicians.map((t) => (
                            <Link
                              key={t.id}
                              href={`/technicians/${t.id}`}
                              onClick={() => handleLinkClick(`/technicians/${t.id}`)}
                              className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                    {t.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    ★ {t.rating}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">{t.category} • {t.locality}</p>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                {t.status}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* 4. Invoices Results */}
                      {(activeSearchCategory === "All" || activeSearchCategory === "Invoices") && searchResults.invoices.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="px-2 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Invoices & Billing ({searchResults.invoices.length})
                          </div>
                          {searchResults.invoices.map((inv) => (
                            <Link
                              key={`inv-${inv.id}`}
                              href={`/billing/${inv.id}`}
                              onClick={() => handleLinkClick(`/billing/${inv.id}`)}
                              className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    INV-{inv.id.replace(/^(bk-)?/gi, "").toUpperCase()}
                                  </span>
                                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                    {inv.customerName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">{inv.serviceTitle}</p>
                              </div>
                              <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white shrink-0">
                                ₹{(inv.totalAmount || 873).toLocaleString("en-IN")}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Keyboard Hints */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-3">
                    <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">ESC</kbd> to close</span>
                  </span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">HelpMate Admin Command Center</span>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </header>
  );
}
