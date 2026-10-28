"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  CalendarCheck,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  UserCheck,
  X,
  Zap,
  IndianRupee,
  Star,
  Clock,
  Wrench,
  BarChart3,
  ChevronRight,
  Tag,
  CreditCard,
  Radio,
  ArrowRight,
  Search,
  Filter,
  Layers,
  RefreshCw,
} from "lucide-react";
import {
  analyticsData,
  initialBookings,
  initialTechnicians,
  varanasiLocalities,
  Booking,
} from "@/lib/mockData";
import { Portal } from "@/components/Portal";
import { CustomSelect } from "@/components/CustomSelect";

export default function ExecutiveDashboard() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [selectedLocality, setSelectedLocality] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [chartMode, setChartMode] = useState<"revenue" | "bookings">("revenue");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<Booking | null>(null);
  const [assignedTechId, setAssignedTechId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Hold-to-drag scroll state for dashboard table
  const dashTableRef = useRef<HTMLDivElement>(null);
  const [isDashDragging, setIsDashDragging] = useState(false);
  const [dashStartX, setDashStartX] = useState(0);
  const [dashScrollLeft, setDashScrollLeft] = useState(0);

  const handleDashMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("[role='button']")
    ) {
      return;
    }
    if (!dashTableRef.current) return;
    setIsDashDragging(true);
    setDashStartX(e.pageX - dashTableRef.current.offsetLeft);
    setDashScrollLeft(dashTableRef.current.scrollLeft);
  };

  const handleDashMouseLeave = () => {
    setIsDashDragging(false);
  };

  const handleDashMouseUp = () => {
    setIsDashDragging(false);
  };

  const handleDashMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDashDragging || !dashTableRef.current) return;
    e.preventDefault();
    const x = e.pageX - dashTableRef.current.offsetLeft;
    const walk = (x - dashStartX) * 1.6;
    dashTableRef.current.scrollLeft = dashScrollLeft - walk;
  };

  const [newBooking, setNewBooking] = useState({
    customerName: "",
    customerPhone: "",
    locality: "Sigra",
    address: "",
    serviceTitle: "Split AC Foam Jet Servicing",
    category: "AC Service & Repair",
    price: 599,
  });

  // Computed Metrics
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchLocality =
        selectedLocality === "All" ||
        b.locality.toLowerCase().includes(selectedLocality.toLowerCase());
      const matchStatus =
        selectedStatus === "All" || b.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchSearch =
        searchQuery === "" ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLocality && matchStatus && matchSearch;
    });
  }, [bookings, selectedLocality, selectedStatus, searchQuery]);

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;
  const inProgressCount = bookings.filter((b) => b.status === "In Progress").length;
  const completedCount = bookings.filter((b) => b.status === "Completed").length;
  const totalRevenue = analyticsData.totalRevenue;

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.customerName || !newBooking.customerPhone || !newBooking.address) return;
    const created: Booking = {
      id: `HM-VAR-${Math.floor(8822 + Math.random() * 900)}`,
      customerName: newBooking.customerName,
      customerPhone: newBooking.customerPhone,
      city: "Varanasi",
      locality: newBooking.locality,
      pincode: "221002",
      address: newBooking.address,
      serviceTitle: newBooking.serviceTitle,
      category: "AC",
      basePrice: Number(newBooking.price),
      convenienceFee: 49,
      cgst: Math.round(Number(newBooking.price) * 0.09 * 100) / 100,
      sgst: Math.round(Number(newBooking.price) * 0.09 * 100) / 100,
      totalAmount: Math.round(Number(newBooking.price) * 1.18 + 49),
      invoiceType: "B2C",
      commissionAmount: Math.round(Number(newBooking.price) * 0.25 * 100) / 100,
      partnerEarnings: Math.round(Number(newBooking.price) * 0.75 * 100) / 100,
      status: "Pending",
      date: "Just now",
      timeSlot: "Immediate Assignment",
      paymentMethod: "UPI",
    };
    setBookings([created, ...bookings]);
    setIsAssignModalOpen(false);
    setNewBooking({
      customerName: "",
      customerPhone: "",
      locality: "Sigra",
      address: "",
      serviceTitle: "Split AC Foam Jet Servicing",
      category: "AC Service & Repair",
      price: 599,
    });
  };

  const handleAssignTechnician = () => {
    if (!selectedBookingForAssign || !assignedTechId) return;
    const tech = initialTechnicians.find((t) => t.id === assignedTechId);
    if (!tech) return;
    setBookings(
      bookings.map((b) =>
        b.id === selectedBookingForAssign.id
          ? { ...b, status: "Assigned", technicianName: tech.name, technicianId: tech.id }
          : b
      )
    );
    setSelectedBookingForAssign(null);
    setAssignedTechId("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">

      {/* ─── 1. PAGE HEADER (Strictly ONE Primary Button per AGENTS.md) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-600" />
            <span>Dashboard</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{pendingCount} Pending Assignment</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Order</span>
          </button>
        </div>
      </div>

      {/* ─── 2. EXECUTIVE METRICS GRID (4 HIGH-IMPACT COMPACT CARDS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Gross Monthly Revenue</span>
            <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ₹{(totalRevenue / 100000).toFixed(2)} Lakhs
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{analyticsData.monthlyGrowth}% Growth MoM</span>
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Varanasi Jobs</span>
            <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {analyticsData.activeBookings} Jobs Active
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {inProgressCount} In Field · {pendingCount} Pending
            </div>
          </div>
        </div>

        {/* Verified Service Partners */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Verified Service Partners</span>
            <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {analyticsData.technicianFleet} Techs
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% KYC Verified</span>
            </div>
          </div>
        </div>

        {/* CSAT Rating */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Customer CSAT</span>
            <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {analyticsData.csatRating} / 5.0 Rating
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Based on 2,840 Varanasi orders
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. ANALYTICS & ZONE DENSITY GRID (TOP HALF: 8 vs 4) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (8 Cols): Monthly Performance Graph */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 h-full flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Monthly Performance & Growth Trends</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Varanasi catalog revenue timeline (Jan 2026 – Jul 2026)
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setChartMode("revenue")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === "revenue"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  Revenue (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("bookings")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === "bookings"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  Bookings Count
                </button>
              </div>
            </div>

            {/* Interactive Smooth Spline Area Chart Canvas */}
            <div className="pt-2">
              <div className="flex gap-4">
                {/* Y-Axis Scale */}
                <div className="flex flex-col justify-between text-right shrink-0 py-1" style={{ height: "200px" }}>
                  {chartMode === "revenue"
                    ? ["₹16L", "₹12L", "₹8L", "₹4L", "₹0"].map((l) => (
                      <span key={l} className="text-[10px] font-mono font-bold text-slate-400">{l}</span>
                    ))
                    : ["1,600", "1,200", "800", "400", "0"].map((l) => (
                      <span key={l} className="text-[10px] font-mono font-bold text-slate-400">{l}</span>
                    ))}
                </div>

                {/* Chart Grid with SVG Area Path & Nodes */}
                <div className="flex-1 min-w-0 relative" style={{ height: "200px" }}>
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <div
                      key={pct}
                      className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800/70"
                      style={{ bottom: `${pct}%` }}
                    />
                  ))}

                  {/* SVG Smooth Curved Area Graph - Dynamically Computed for Revenue vs Bookings */}
                  {(() => {
                    const data = analyticsData.monthlyChart;
                    const maxVal = chartMode === "revenue" ? 1600000 : 1600;
                    const pts = data.map((d, i) => {
                      const val = chartMode === "revenue" ? d.revenue : d.bookings;
                      const x = (i / (data.length - 1)) * 700;
                      const y = 190 - (val / maxVal) * 170; // top padding
                      return { x, y };
                    });

                    let lineD = `M ${pts[0].x} ${pts[0].y}`;
                    for (let i = 0; i < pts.length - 1; i++) {
                      const curr = pts[i];
                      const next = pts[i + 1];
                      const cp1x = curr.x + (next.x - curr.x) / 2;
                      const cp1y = curr.y;
                      const cp2x = curr.x + (next.x - curr.x) / 2;
                      const cp2y = next.y;
                      lineD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
                    }
                    const areaD = `${lineD} L 700 200 L 0 200 Z`;

                    return (
                      <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 700 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartMode === "revenue" ? "#4f46e5" : "#10b981"} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={chartMode === "revenue" ? "#4f46e5" : "#10b981"} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        <path d={areaD} fill="url(#chartGradient)" className="transition-all duration-500 ease-in-out" />
                        <path
                          d={lineD}
                          fill="none"
                          stroke={chartMode === "revenue" ? "#4f46e5" : "#10b981"}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="transition-all duration-500 ease-in-out"
                        />
                      </svg>
                    );
                  })()}

                  <div className="absolute inset-0 flex justify-between items-stretch z-20 pointer-events-auto">
                    {analyticsData.monthlyChart.map((m) => {
                      const val = chartMode === "revenue" ? m.revenue : m.bookings;
                      const maxVal = chartMode === "revenue" ? 1600000 : 1600;
                      const pct = Math.min((val / maxVal) * 100, 100);
                      const topPos = 100 - (10 + (pct * 85) / 100); // matches Y-axis 10% to 95% range

                      return (
                        <div key={m.month} className="relative flex-1 group flex flex-col items-center">
                          <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl border border-slate-700 dark:border-slate-200 z-30">
                            {chartMode === "revenue"
                              ? `${m.month}: ₹${(m.revenue / 100000).toFixed(2)} Lakhs (${m.bookings} Bookings)`
                              : `${m.month}: ${m.bookings} Jobs Assigned (₹${(m.revenue / 100000).toFixed(2)}L)`}
                          </div>

                          <div
                            className={`absolute w-3.5 h-3.5 -ml-1.75 -mt-1.75 rounded-full bg-white dark:bg-slate-900 border-2.5 shadow-md group-hover:scale-150 transition-all duration-500 cursor-pointer ${chartMode === "revenue"
                                ? "border-brand-600 group-hover:bg-brand-600 group-hover:border-white"
                                : "border-emerald-600 group-hover:bg-emerald-600 group-hover:border-white"
                              }`}
                            style={{ top: `${topPos}%`, left: "50%" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* X-Axis Month Labels */}
              <div className="flex justify-between gap-3 px-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 ml-12">
                {analyticsData.monthlyChart.map((m) => (
                  <div key={m.month} className="flex-1 text-center">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">{m.month}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium block">
                      {chartMode === "revenue" ? `₹${(m.revenue / 100000).toFixed(1)}L` : `${m.bookings} jobs`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right (4 Cols): Admin Quick Launch */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Admin Quick Launch Console</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Direct Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1 items-center">
              {[
                { label: "Bookings", href: "/bookings", icon: CalendarCheck, color: "text-brand-600" },
                { label: "Partner KYC", href: "/technicians", icon: UserCheck, color: "text-emerald-600" },
                { label: "CRM Clients", href: "/customers", icon: Users, color: "text-blue-600" },
                { label: "Billing & GST", href: "/billing", icon: CreditCard, color: "text-purple-600" },
                { label: "CMS Services", href: "/cms", icon: Wrench, color: "text-amber-600" },
                { label: "RBAC Users", href: "/users", icon: ShieldCheck, color: "text-rose-600" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-brand-300 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
                  >
                    <Icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. BALANCED 3-EQUAL-COLUMN OPERATIONAL ANALYTICS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

        {/* 1. Service Category Market Share */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Service Category Share</h3>
              </div>
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                Market Share
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {analyticsData.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{cat.category}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white ml-2">{cat.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{cat.count} jobs</span>
                    <span>Est. ₹{(cat.count * 899 / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Varanasi Zone Density */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Varanasi Zone Density</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLocality("All")}
                className="text-[10px] font-bold text-slate-500 hover:text-brand-600 transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {varanasiLocalities.map((loc) => {
                const isSelected = selectedLocality === loc.name;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocality(isSelected ? "All" : loc.name)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                        ? "bg-brand-600 text-white border-brand-600 shadow-md"
                        : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-brand-300 text-slate-900 dark:text-white"
                      }`}
                  >
                    <p className={`text-[11px] font-bold truncate ${isSelected ? "text-white" : "text-slate-900 dark:text-white"}`}>
                      {loc.name}
                    </p>
                    <div className="flex items-center justify-between mt-0.5 text-[9px]">
                      <span className={isSelected ? "text-brand-100" : "text-slate-500 dark:text-slate-400"}>
                        {loc.activeBookings} active
                      </span>
                      <span
                        className={`font-extrabold px-1 rounded ${isSelected
                            ? "bg-white/20 text-white"
                            : loc.status === "Peak"
                              ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : loc.status === "High Demand"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                      >
                        {loc.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Certified Service Specialists */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 h-full">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Certified Service Specialists</h3>
                </div>
              </div>
              <a
                href="/technicians"
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-0.5"
              >
                All <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-2 mt-4">
              {initialTechnicians.slice(0, 4).map((tech, idx) => (
                <div
                  key={tech.id}
                  className="p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-brand-300 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {tech.name[0]}
                      </div>
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-900 text-[8px] font-extrabold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{tech.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{tech.role}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end text-[10px] font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 mr-0.5" /> {tech.rating}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">{tech.totalJobs} jobs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>



      {/* ─── 5. FULL-WIDTH STANDALONE LIVE VARANASI ASSIGNMENT FEED CONSOLE ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5 w-full">
        {/* Table Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0">
              <Radio className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Live Varanasi Assignment Feed</h2>
                <span className="text-[10px] font-extrabold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                  {filteredBookings.length} Orders Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time job queue and technician assignment console
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search booking ID, customer or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
              {["All", "Pending", "Assigned", "In Progress", "Completed"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${selectedStatus === st
                      ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Full Width Scrollable Table Container with Fixed Height */}
        <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 relative">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700 shadow-xs">
              <tr>
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Locality & Address</th>
                <th className="py-3.5 px-4">Service Required</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Assigned Technician</th>
                <th className="py-3.5 px-4">Assignment Status</th>
                <th className="py-3.5 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 font-medium">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No Varanasi booking records matching your current filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-brand-600 dark:text-brand-400">{b.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{b.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{b.locality}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{b.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate">{b.serviceTitle}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{b.category}</div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-sm">
                      ₹{b.totalAmount}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between gap-1.5">
                        {b.technicianName ? (
                          <>
                            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{b.technicianName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForAssign(b)}
                              title="Reassign Partner"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              <AlertCircle className="w-3 h-3" /> Unassigned
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForAssign(b)}
                              title="Assign Partner"
                              className="p-1.5 rounded-lg text-brand-600 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 border border-brand-200 dark:border-brand-800 transition-colors cursor-pointer shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-block ${b.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : b.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                              : b.status === "Assigned"
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForAssign(b)}
                          className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          {b.technicianName ? "Reassign" : "Assign Partner"}
                        </button>
                        <Link
                          href={`/bookings/${b.id}`}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center justify-center"
                          title="View Full Booking Console"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ASSIGN TECHNICIAN MODAL ─── */}
      {selectedBookingForAssign && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Assign Service Specialist</h3>
                  <p className="text-xs text-slate-500">
                    Order {selectedBookingForAssign.id} · {selectedBookingForAssign.locality}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForAssign(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Order Service Details</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedBookingForAssign.serviceTitle}</p>
                <p className="text-[11px] text-slate-500">{selectedBookingForAssign.customerName} ({selectedBookingForAssign.address})</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Select Verified Partner</label>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {initialTechnicians.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setAssignedTechId(t.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${assignedTechId === t.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-400"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-xs flex items-center justify-center">
                          {t.name[0]}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${assignedTechId === t.id ? "text-white" : "text-slate-900 dark:text-white"}`}>{t.name}</p>
                          <p className={`text-[10px] ${assignedTechId === t.id ? "text-slate-300" : "text-slate-500"}`}>{t.role} · {t.locality}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-amber-500">★ {t.rating}</p>
                        <p className={`text-[9px] font-medium ${assignedTechId === t.id ? "text-slate-300" : "text-slate-400"}`}>{t.totalJobs} jobs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForAssign(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignTechnician}
                  disabled={!assignedTechId}
                  className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── ASSIGN ORDER MODAL ─── */}
      {isAssignModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateBooking}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Register Varanasi Booking Order</h3>
                  <p className="text-xs text-slate-500">Direct booking creation across all 8 zones</p>
                </div>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={newBooking.customerName}
                    onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98390..."
                    value={newBooking.customerPhone}
                    onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  label="Locality Zone"
                  value={newBooking.locality}
                  onChange={(val) => setNewBooking({ ...newBooking, locality: val })}
                  options={varanasiLocalities.map((loc) => ({
                    value: loc.name,
                    label: `${loc.name} (${loc.pincode})`,
                  }))}
                />
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Service Package</label>
                  <input
                    type="text"
                    value={newBooking.serviceTitle}
                    onChange={(e) => setNewBooking({ ...newBooking, serviceTitle: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Address Details *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="House No, Colony / Landmark in Varanasi..."
                  value={newBooking.address}
                  onChange={(e) => setNewBooking({ ...newBooking, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Confirm & Create Order
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

    </div>
  );
}
