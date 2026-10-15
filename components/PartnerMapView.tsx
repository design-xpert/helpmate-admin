"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Technician, varanasiLocalities } from "@/lib/mockData";
import {
  MapPin,
  Search,
  Filter,
  Navigation,
  Phone,
  Star,
  CheckCircle2,
  ExternalLink,
  Zap,
  Activity,
  Layers,
  Compass,
  Crosshair,
  User,
  ShieldCheck,
  ChevronRight,
  X,
  Building,
  Wrench,
  Clock,
  Battery,
  Maximize2,
} from "lucide-react";

interface PartnerMapViewProps {
  technicians: Technician[];
  onSelectTechnician?: (tech: Technician) => void;
}

// Fixed coordinate map simulation for Varanasi localities
const VARANASI_MAP_COORDINATES: Record<
  string,
  { x: number; y: number; lat: string; lng: string }
> = {
  Sigra: { x: 42, y: 48, lat: "25.3176° N", lng: "82.9868° E" },
  Lanka: { x: 38, y: 72, lat: "25.2818° N", lng: "82.9902° E" },
  Mahmoorganj: { x: 32, y: 42, lat: "25.3112° N", lng: "82.9754° E" },
  Bhelupur: { x: 50, y: 62, lat: "25.2954° N", lng: "82.9981° E" },
  Godowlia: { x: 64, y: 52, lat: "25.3108° N", lng: "83.0076° E" },
  Chowk: { x: 68, y: 44, lat: "25.3135° N", lng: "83.0112° E" },
  Pandeypur: { x: 58, y: 22, lat: "25.3412° N", lng: "83.0015° E" },
  "Cantt / Junction": { x: 35, y: 32, lat: "25.3265° N", lng: "82.9842° E" },
  Sarnath: { x: 76, y: 15, lat: "25.3762° N", lng: "83.0227° E" },
  Shivpur: { x: 22, y: 20, lat: "25.3589° N", lng: "82.9512° E" },
  Nadesar: { x: 45, y: 35, lat: "25.3301° N", lng: "82.9899° E" },
  Chetganj: { x: 54, y: 44, lat: "25.3167° N", lng: "82.9978° E" },
};

export function PartnerMapView({ technicians, onSelectTechnician }: PartnerMapViewProps) {
  const [selectedLocality, setSelectedLocality] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePartner, setActivePartner] = useState<Technician | null>(technicians[0] || null);
  const [mapTheme, setMapTheme] = useState<"dark" | "satellite">("dark");
  const [showSidePanel, setShowSidePanel] = useState(true);

  // Filtered Technicians
  const filteredTechs = technicians.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.phone.includes(searchQuery) ||
      tech.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.pincode.includes(searchQuery);

    const matchesLocality =
      selectedLocality === "all" ||
      tech.locality.toLowerCase().includes(selectedLocality.toLowerCase()) ||
      tech.pincode === selectedLocality;

    const matchesCategory =
      selectedCategory === "all" || tech.category.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "Available" && (tech.status === "Available" || tech.status === "Working" || tech.status === "Approved")) ||
      (selectedStatus === "On Job" && tech.status === "In Transit") ||
      tech.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesLocality && matchesCategory && matchesStatus;
  });

  // Calculate status counts
  const availableCount = technicians.filter(
    (t) => t.status === "Working" || t.status === "Available" || t.status === "Approved"
  ).length;
  const onJobCount = technicians.filter((t) => t.status === "In Transit").length;
  const offlineCount = technicians.filter((t) => t.status === "Absent" || t.status === "Offline").length;

  return (
    <div className="space-y-4">
      {/* MAP FILTER TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner by name, mobile number, locality, or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-brand-500"
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Locality Dropdown */}
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
            >
              <option value="all">📍 All Varanasi Localities</option>
              {varanasiLocalities.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name} ({loc.pincode})
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
            >
              <option value="all">🛠️ All Categories</option>
              <option value="AC Service">AC Service & Repair</option>
              <option value="Electrician">Electrician Services</option>
              <option value="Plumber">Plumbing Services</option>
              <option value="Cleaning">Cleaning & Hygiene</option>
              <option value="Appliance">Appliance Repair</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
            >
              <option value="all">🟢 Live Status (All)</option>
              <option value="Available">🟢 Available & Active ({availableCount})</option>
              <option value="On Job">🔵 On Active Job ({onJobCount})</option>
              <option value="Absent">⚪ Offline ({offlineCount})</option>
            </select>

            {/* Map Style Switcher */}
            <button
              type="button"
              onClick={() => setMapTheme(mapTheme === "dark" ? "satellite" : "dark")}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              <span>{mapTheme === "dark" ? "Dark Vector" : "Satellite Aerial"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN MAP INTERACTIVE STAGE & DISPATCH FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* MAP CONTAINER (8 COLS ON DESKTOP) */}
        <div
          className={`relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg min-h-[580px] h-[580px] flex flex-col ${
            showSidePanel ? "lg:col-span-8" : "lg:col-span-12"
          }`}
        >
          {/* MAP CANVAS / SVG GRAPHICAL VIEW OF VARANASI */}
          <div
            className={`absolute inset-0 transition-colors duration-500 select-none overflow-hidden ${
              mapTheme === "dark"
                ? "bg-slate-950 text-slate-300"
                : "bg-slate-900 text-slate-200"
            }`}
          >
            {/* Grid Mesh Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />

            {/* Simulated River Ganges Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <path
                d="M 500 0 C 450 150, 600 300, 550 580"
                fill="none"
                stroke="#0284c7"
                strokeWidth="28"
                strokeLinecap="round"
              />
              <path
                d="M 500 0 C 450 150, 600 300, 550 580"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <text x="520" y="320" fill="#38bdf8" fontSize="10" fontWeight="900" letterSpacing="3">
                RIVER GANGES (VARANASI)
              </text>
            </svg>

            {/* Simulated Varanasi Main Ring Roads & Highways */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
              <circle cx="45%" cy="50%" r="220" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6,6" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#475569" strokeWidth="2" />
              <line x1="45%" y1="0" x2="45%" y2="100%" stroke="#475569" strokeWidth="2" />
            </svg>

            {/* Varanasi Key Landmark Labels */}
            {Object.entries(VARANASI_MAP_COORDINATES).map(([locName, coords]) => (
              <div
                key={locName}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600/60 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500/80 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                  {locName}
                </span>
              </div>
            ))}

            {/* GPS CENTER MARKER FOR HQ */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-extrabold text-white shadow-md">
              <Compass className="w-4 h-4 text-brand-400 animate-spin-slow" />
              <span>Varanasi Central Dispatch HQ (25.3176° N, 82.9868° E)</span>
            </div>

            {/* SIDE PANEL TOGGLE & COUNT */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{filteredTechs.length} Technicians Live</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSidePanel(!showSidePanel)}
                className="p-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 backdrop-blur-md cursor-pointer transition-all"
                title="Toggle Side List Panel"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* PARTNER PINS DISTRIBUTED ON MAP */}
            {filteredTechs.map((tech, idx) => {
              const coords = VARANASI_MAP_COORDINATES[tech.locality] || {
                x: 40 + (idx % 5) * 10,
                y: 35 + (idx % 4) * 12,
                lat: "25.3100° N",
                lng: "82.9800° E",
              };

              const isSelected = activePartner?.id === tech.id;
              const isWorking = tech.status === "Working" || tech.status === "Available" || tech.status === "Approved";
              const isOnJob = tech.status === "In Transit";

              return (
                <div
                  key={tech.id}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300 cursor-pointer group ${
                    isSelected ? "scale-125 z-30" : "hover:scale-110"
                  }`}
                  onClick={() => {
                    setActivePartner(tech);
                    if (onSelectTechnician) onSelectTechnician(tech);
                  }}
                >
                  {/* Pulsing Status Outer Halo Ring */}
                  <div
                    className={`absolute -inset-2 rounded-full animate-ping opacity-30 ${
                      isOnJob
                        ? "bg-blue-500"
                        : isWorking
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                  />

                  {/* Marker Card Container */}
                  <div
                    className={`relative p-1 rounded-2xl flex items-center gap-1.5 shadow-xl transition-all border ${
                      isSelected
                        ? "bg-brand-600 text-white border-white scale-110 ring-4 ring-brand-500/40"
                        : isWorking
                        ? "bg-slate-900 text-white border-emerald-500/60 hover:border-emerald-400"
                        : isOnJob
                        ? "bg-slate-900 text-white border-blue-500/60 hover:border-blue-400"
                        : "bg-slate-900 text-slate-300 border-slate-700"
                    }`}
                  >
                    <div className="relative">
                      <div className="relative w-7 h-7 rounded-xl overflow-hidden border border-white/20">
                        {tech.avatar ? (
                          <Image
                            src={tech.avatar}
                            alt={tech.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                          isOnJob
                            ? "bg-blue-500"
                            : isWorking
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                    </div>
                    <div className="pr-1.5 hidden sm:block">
                      <span className="font-extrabold text-[10px] block leading-tight truncate max-w-[80px]">
                        {tech.name.split(" ")[0]}
                      </span>
                      <span className="text-[9px] opacity-80 block truncate max-w-[80px]">
                        {tech.locality}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ACTIVE PARTNER SELECTED OVERLAY CARD (FLOATING AT BOTTOM OF MAP) */}
            {activePartner && (
              <div className="absolute bottom-4 left-4 right-4 z-40 max-w-lg mx-auto bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 text-white text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-brand-500 shadow-md shrink-0">
                      {activePartner.avatar ? (
                        <Image
                          src={activePartner.avatar}
                          alt={activePartner.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-white">{activePartner.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          {activePartner.role}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300 mt-1">
                        <span className="flex items-center gap-1 font-bold text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{activePartner.rating}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span>{activePartner.locality} ({activePartner.pincode})</span>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Phone className="w-3 h-3" />
                          <span>{activePartner.phone}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePartner(null)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Live Status</span>
                    <span
                      className={`font-black flex items-center gap-1 mt-0.5 ${
                        activePartner.status === "In Transit"
                          ? "text-blue-400"
                          : activePartner.status === "Absent"
                          ? "text-slate-400"
                          : "text-emerald-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activePartner.status === "In Transit"
                            ? "bg-blue-400"
                            : activePartner.status === "Absent"
                            ? "bg-slate-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span>{activePartner.status === "In Transit" ? "On Active Job" : activePartner.status}</span>
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Jobs Completed</span>
                    <span className="font-mono font-black text-white mt-0.5 block">{activePartner.totalJobs} Orders</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Pending Payout</span>
                    <span className="font-mono font-black text-purple-400 mt-0.5 block">₹{activePartner.pendingPayout.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-3">
                  <Link
                    href={`/technicians/${activePartner.id}`}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View Partner Full Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDE LIST FEED OF ON-FIELD PARTNERS (4 COLS ON DESKTOP) */}
        {showSidePanel && (
          <div className="lg:col-span-4 space-y-3">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Varanasi Live Partner Telemetry</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {filteredTechs.length} Active
                </span>
              </div>

              {/* Scrollable List of Partners */}
              <div className="space-y-2.5 max-h-[510px] overflow-y-auto pr-1">
                {filteredTechs.map((tech) => {
                  const coords = VARANASI_MAP_COORDINATES[tech.locality] || {
                    lat: "25.3176° N",
                    lng: "82.9868° E",
                  };
                  const isSelected = activePartner?.id === tech.id;

                  return (
                    <div
                      key={tech.id}
                      onClick={() => setActivePartner(tech)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? "bg-brand-50/60 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 shadow-xs"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70 hover:border-brand-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                            {tech.avatar ? (
                              <Image
                                src={tech.avatar}
                                alt={tech.name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate block">
                              {tech.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block truncate">
                              {tech.role} • {tech.locality} ({tech.pincode})
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            tech.status === "In Transit"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : tech.status === "Absent"
                              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {tech.status === "In Transit" ? "On Job" : tech.status}
                        </span>
                      </div>

                      {/* GPS Telemetry Meta Bar */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-500 font-medium">
                        <div className="flex items-center gap-1 font-mono">
                          <Crosshair className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{coords.lat}, {coords.lng}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          <Battery className="w-3 h-3 text-emerald-500" />
                          <span>88% Battery</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
