"use client";

import { useState, useMemo } from "react";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import {
  initialCityPricing,
  CityPricingItem,
  initialRateCards,
  RateCardItem,
} from "@/lib/mockData";
import {
  Tag,
  Plus,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
  MapPin,
  Zap,
  Search,
  Edit2,
  Trash2,
  Percent,
  Sliders,
  ShieldCheck,
  Calculator,
  Clock,
  Sparkles,
  IndianRupee,
  Check,
  HelpCircle,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
  CheckSquare,
  Type,
  LayoutGrid,
  ListPlus,
  ShieldAlert,
  Save,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Portal } from "@/components/Portal";

interface CalcLayoutItem {
  id: string;
  code: string;
  label: string;
  price: number;
  durationMins: number;
}

interface CalcAddonItem {
  id: string;
  title: string;
  durationText: string;
  durationMins: number;
  price: number;
  isChecked?: boolean;
}

interface ServiceModelItem {
  id: string;
  name: string;
}

interface GuaranteeItem {
  id: string;
  text: string;
}

export default function PricingPage() {
  // Default active tab is "calculatorCms" for immediate access to Interactive Pricing Calculator CMS!
  const [activeTab, setActiveTab] = useState<"calculatorCms" | "fixed" | "inspection" | "city">("calculatorCms");

  // Data States
  const [rateCards, setRateCards] = useState<RateCardItem[]>(initialRateCards);
  const [cityPricings, setCityPricings] = useState<CityPricingItem[]>(initialCityPricing);

  // Inspection Engine State
  const [inspectionRules, setInspectionRules] = useState({
    baseInspectionFee: 99,
    creditOnApproval: true,
    hourlyLaborRate: 249,
    sparePartsMarkupCap: 15,
    autoApproveThreshold: 1500,
  });

  // ──── INTERACTIVE PRICING CALCULATOR FULL CMS STATE (MATCHING USER'S SCREENSHOT) ────

  // 1. PAGE HEADER CONFIG
  const [calcPageHeader, setCalcPageHeader] = useState({
    title: "Interactive Pricing Calculator",
    subtitle: "Choose a service model below, select your layout or checklist, and get an instant price before booking."
  });

  // 2. SERVICE MODEL TABS (Add, Edit, Delete)
  const [serviceModels, setServiceModels] = useState<ServiceModelItem[]>([
    { id: "mod-1", name: "Premium Deep Cleaning" },
    { id: "mod-2", name: "Daily Hourly Chores" },
  ]);
  const [activeModelId, setActiveModelId] = useState("mod-1");

  // 3. INFORMATION BANNER CONFIG
  const [calcBanner, setCalcBanner] = useState({
    title: "What is Premium Deep Cleaning?",
    description: "A comprehensive, 3+ hour intense scrub-down of your home by verified experts. Includes specialized machines, bathroom descaling, deep kitchen degreasing, and eco-sanitization. Ideal for monthly refreshers or moving in."
  });

  // 4. HOME LAYOUT SIZES SECTION (Section Heading + Add/Edit/Delete Tiers)
  const [layoutSectionTitle, setLayoutSectionTitle] = useState("SELECT HOME LAYOUT SIZE");
  const [calcLayouts, setCalcLayouts] = useState<CalcLayoutItem[]>([
    { id: "lay-1", code: "1bhk", label: "1bhk", price: 1899, durationMins: 180 },
    { id: "lay-2", code: "2bhk", label: "2bhk", price: 2899, durationMins: 240 },
    { id: "lay-3", code: "3bhk", label: "3bhk", price: 3899, durationMins: 300 },
    { id: "lay-4", code: "4bhk", label: "4bhk", price: 4899, durationMins: 360 },
  ]);

  // 5. ADD-ON INTENSIVE CARE CHECKLIST SECTION (Section Heading + Add/Edit/Delete Items)
  const [addonSectionTitle, setAddonSectionTitle] = useState("ADD-ON INTENSIVE CARE CHECKLIST");
  const [calcAddons, setCalcAddons] = useState<CalcAddonItem[]>([
    { id: "cad-1", title: "Kitchen Degreasing", durationText: "+60 mins", durationMins: 60, price: 599, isChecked: false },
    { id: "cad-2", title: "Bathroom Intensive Descaling", durationText: "+45 mins", durationMins: 45, price: 399, isChecked: false },
    { id: "cad-3", title: "Balcony Scrubbing", durationText: "+30 mins", durationMins: 30, price: 299, isChecked: false },
    { id: "cad-4", title: "Fridge Interior Sanitizing", durationText: "+20 mins", durationMins: 20, price: 199, isChecked: false },
  ]);

  // 6. PRICING SUMMARY CARD CONFIG (All Headers, Badges, Guarantees List with Add/Edit/Delete, CTA, Footer)
  const [summaryCardConfig, setSummaryCardConfig] = useState({
    cardHeader: "PRICING SUMMARY",
    activeProsBadgeText: "5 Pros Active",
    baseFareLabel: "Base Fare ({layout} Deep Clean)",
    estimatedEffortLabel: "Estimated Effort",
    totalLabel: "TOTAL (ALL INCLUSIVE)",
    ctaButtonText: "Book Verified Pro Now →",
    footerNoticeText: "No registration charge. Cancel or reschedule anytime up to 2 hours before."
  });

  const [guaranteesList, setGuaranteesList] = useState<GuaranteeItem[]>([
    { id: "gua-1", text: "₹1,000 No-Show Penalty: If our Pro is late or cancels, we refund ₹1,000 instantly." },
    { id: "gua-2", text: "3-Tier Vetting: Providers pass criminal check, Aadhaar matches, and local background audits." },
  ]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Custom Modal States for Add & Edit (No browser prompt/confirm!)
  const [modelModal, setModelModal] = useState<{ isOpen: boolean; item: ServiceModelItem | null }>({ isOpen: false, item: null });
  const [modelInputName, setModelInputName] = useState("");

  const [layoutModal, setLayoutModal] = useState<{ isOpen: boolean; item: CalcLayoutItem | null }>({ isOpen: false, item: null });
  const [layoutForm, setLayoutForm] = useState({ code: "", price: 1899, durationMins: 180 });

  const [addonModal, setAddonModal] = useState<{ isOpen: boolean; item: CalcAddonItem | null }>({ isOpen: false, item: null });
  const [addonForm, setAddonForm] = useState({ title: "", durationText: "+30 mins", durationMins: 30, price: 299 });

  const [guaranteeModal, setGuaranteeModal] = useState<{ isOpen: boolean; item: GuaranteeItem | null }>({ isOpen: false, item: null });
  const [guaranteeInputText, setGuaranteeInputText] = useState("");

  // Custom Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "model" | "layout" | "addon" | "guarantee" | null;
    id: string;
    name: string;
  }>({ isOpen: false, type: null, id: "", name: "" });

  // Simulator Active States
  const [simSelectedLayoutId, setSimSelectedLayoutId] = useState("lay-2");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals / Drawers
  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<RateCardItem | null>(null);

  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityPricingItem | null>(null);

  // Rate Form State
  const [rateForm, setRateForm] = useState({
    serviceTitle: "",
    category: "AC Servicing",
    basePrice: 599,
    memberPrice: 499,
    convenienceFee: 49,
    gstPercentage: 18,
    commissionPercentage: 25,
    surgeMultiplier: 1.0,
  });

  // City Form State
  const [cityForm, setCityForm] = useState({
    cityName: "Varanasi Metro",
    locality: "",
    state: "Uttar Pradesh",
    baseFareMultiplier: 1.0,
    peakHourSurge: 1.25,
    nightSurgeMultiplier: 1.2,
    weatherSurge: 1.3,
  });

  // Filtered Rate Cards
  const filteredRateCards = useMemo(() => {
    return rateCards.filter((rc) => {
      const matchCategory = selectedCategory === "All" || rc.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        rc.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rc.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [rateCards, selectedCategory, searchQuery]);

  // Filtered City Surge Rules
  const filteredCityPricings = useMemo(() => {
    return cityPricings.filter((cp) => {
      return (
        searchQuery === "" ||
        cp.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cp.locality && cp.locality.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [cityPricings, searchQuery]);

  // Dynamic Calculation for Interactive Pricing Calculator Simulator
  const activeLayout = useMemo(() => {
    return calcLayouts.find((l) => l.id === simSelectedLayoutId) || calcLayouts[0];
  }, [calcLayouts, simSelectedLayoutId]);

  const activeAddonsSum = useMemo(() => {
    return calcAddons.filter((a) => a.isChecked).reduce((sum, item) => sum + item.price, 0);
  }, [calcAddons]);

  const activeAddonsDurationMins = useMemo(() => {
    return calcAddons.filter((a) => a.isChecked).reduce((sum, item) => sum + item.durationMins, 0);
  }, [calcAddons]);

  const simTotalPrice = (activeLayout?.price || 0) + activeAddonsSum;
  const simTotalDuration = (activeLayout?.durationMins || 0) + activeAddonsDurationMins;

  // Save All Calculator Changes Handler
  const handleSaveCalculatorSettings = () => {
    showToast("✨ Interactive Pricing Calculator Saved! Synchronized live with helpmate-theta.vercel.app");
  };

  // Custom Modal Submit Handlers
  const handleSaveModelModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelInputName.trim()) return;
    if (modelModal.item) {
      setServiceModels(serviceModels.map((m) => (m.id === modelModal.item!.id ? { ...m, name: modelInputName } : m)));
      showToast(`Updated Service Model Tab '${modelInputName}'`);
    } else {
      const newMod = { id: `mod-${Date.now()}`, name: modelInputName };
      setServiceModels([...serviceModels, newMod]);
      setActiveModelId(newMod.id);
      showToast(`Added New Service Model Tab '${modelInputName}'`);
    }
    setModelModal({ isOpen: false, item: null });
  };

  const handleSaveLayoutModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!layoutForm.code.trim()) return;
    if (layoutModal.item) {
      setCalcLayouts(
        calcLayouts.map((l) =>
          l.id === layoutModal.item!.id
            ? { ...l, code: layoutForm.code, label: layoutForm.code, price: layoutForm.price, durationMins: layoutForm.durationMins }
            : l
        )
      );
      showToast(`Updated Layout Size Tier '${layoutForm.code}'`);
    } else {
      const newLay = {
        id: `lay-${Date.now()}`,
        code: layoutForm.code,
        label: layoutForm.code,
        price: layoutForm.price,
        durationMins: layoutForm.durationMins,
      };
      setCalcLayouts([...calcLayouts, newLay]);
      setSimSelectedLayoutId(newLay.id);
      showToast(`Added New Layout Size Tier '${layoutForm.code}'`);
    }
    setLayoutModal({ isOpen: false, item: null });
  };

  const handleSaveAddonModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonForm.title.trim()) return;
    if (addonModal.item) {
      setCalcAddons(
        calcAddons.map((a) =>
          a.id === addonModal.item!.id ? { ...a, ...addonForm } : a
        )
      );
      showToast(`Updated Add-on Item '${addonForm.title}'`);
    } else {
      const newAddon = {
        id: `cad-${Date.now()}`,
        ...addonForm,
        isChecked: false,
      };
      setCalcAddons([...calcAddons, newAddon]);
      showToast(`Added New Add-on Item '${addonForm.title}'`);
    }
    setAddonModal({ isOpen: false, item: null });
  };

  const handleSaveGuaranteeModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guaranteeInputText.trim()) return;
    if (guaranteeModal.item) {
      setGuaranteesList(
        guaranteesList.map((g) => (g.id === guaranteeModal.item!.id ? { ...g, text: guaranteeInputText } : g))
      );
      showToast("Updated Guarantee Bullet");
    } else {
      setGuaranteesList([...guaranteesList, { id: `gua-${Date.now()}`, text: guaranteeInputText }]);
      showToast("Added New Guarantee Bullet");
    }
    setGuaranteeModal({ isOpen: false, item: null });
  };

  // Custom Delete Confirm Execution
  const handleExecuteDelete = () => {
    if (!deleteConfirm.type || !deleteConfirm.id) return;
    if (deleteConfirm.type === "model") {
      setServiceModels(serviceModels.filter((m) => m.id !== deleteConfirm.id));
      showToast(`Deleted Service Model '${deleteConfirm.name}'`);
    } else if (deleteConfirm.type === "layout") {
      setCalcLayouts(calcLayouts.filter((l) => l.id !== deleteConfirm.id));
      showToast(`Deleted Layout Tier '${deleteConfirm.name}'`);
    } else if (deleteConfirm.type === "addon") {
      setCalcAddons(calcAddons.filter((a) => a.id !== deleteConfirm.id));
      showToast(`Deleted Add-on Item '${deleteConfirm.name}'`);
    } else if (deleteConfirm.type === "guarantee") {
      setGuaranteesList(guaranteesList.filter((g) => g.id !== deleteConfirm.id));
      showToast("Deleted Guarantee Bullet");
    }
    setDeleteConfirm({ isOpen: false, type: null, id: "", name: "" });
  };

  // Handlers for Rate Cards
  const handleSaveRateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.serviceTitle.trim()) return;

    if (editingRate) {
      setRateCards(
        rateCards.map((rc) =>
          rc.id === editingRate.id ? { ...rc, ...rateForm } : rc
        )
      );
      showToast(`Updated Rate Card '${rateForm.serviceTitle}'`);
      setEditingRate(null);
    } else {
      const newRc: RateCardItem = {
        id: `rc-${Date.now()}`,
        ...rateForm,
        status: "Active",
      };
      setRateCards([newRc, ...rateCards]);
      showToast(`Added New Rate Card '${rateForm.serviceTitle}'`);
    }

    setIsAddRateOpen(false);
    setRateForm({
      serviceTitle: "",
      category: "AC Servicing",
      basePrice: 599,
      memberPrice: 499,
      convenienceFee: 49,
      gstPercentage: 18,
      commissionPercentage: 25,
      surgeMultiplier: 1.0,
    });
  };

  const handleToggleRateStatus = (id: string) => {
    setRateCards(
      rateCards.map((rc) =>
        rc.id === id ? { ...rc, status: rc.status === "Active" ? "Inactive" : "Active" } : rc
      )
    );
  };

  const handleDeleteRateCard = (id: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: "model", // using confirm dialog pattern
      id: id,
      name: rateCards.find((rc) => rc.id === id)?.serviceTitle || "Rate Card",
    });
  };

  const catColumns: Column<RateCardItem>[] = [
    {
      key: "serviceTitle",
      header: "Service Package",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-white text-xs">{row.serviceTitle}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.category}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "basePrice",
      header: "Base Price",
      accessor: (row) => <span className="font-semibold text-slate-900 dark:text-white">₹{row.basePrice}</span>,
      sortable: true,
    },
    {
      key: "memberPrice",
      header: "Member Price",
      accessor: (row) => <span className="font-semibold text-brand-600 dark:text-brand-400">₹{row.memberPrice}</span>,
      sortable: true,
    },
    {
      key: "convenienceFee",
      header: "Tech Fee",
      accessor: (row) => <span className="font-medium text-slate-600 dark:text-slate-400">₹{row.convenienceFee}</span>,
    },
    {
      key: "gstPercentage",
      header: "GST Tax",
      accessor: (row) => <span className="font-medium text-slate-600 dark:text-slate-400">{row.gstPercentage}%</span>,
    },
    {
      key: "commissionPercentage",
      header: "Commission",
      accessor: (row) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{row.commissionPercentage}%</span>,
    },
    {
      key: "surgeMultiplier",
      header: "Surge Multiplier",
      accessor: (row) => (
        <span className={`font-medium px-2 py-0.5 rounded text-[10px] ${row.surgeMultiplier > 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
          {row.surgeMultiplier}x
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <button
          type="button"
          onClick={() => handleToggleRateStatus(row.id)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${row.status === "Active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
        >
          {row.status}
        </button>
      ),
    },
    {
      key: "id",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: "Edit",
              icon: Edit2,
              onClick: () => {
                setEditingRate(row);
                setRateForm({
                  serviceTitle: row.serviceTitle,
                  category: row.category,
                  basePrice: row.basePrice,
                  memberPrice: row.memberPrice,
                  convenienceFee: row.convenienceFee,
                  gstPercentage: row.gstPercentage,
                  commissionPercentage: row.commissionPercentage,
                  surgeMultiplier: row.surgeMultiplier,
                });
                setIsAddRateOpen(true);
              },
            },
            {
              label: "Delete",
              icon: Trash2,
              onClick: () => {
                setRateCards(rateCards.filter((rc) => rc.id !== row.id));
                showToast(`Deleted Rate Card '${row.serviceTitle}'`);
              },
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6  relative">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-600" />
            <span>Pricing Engine</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSaveCalculatorSettings}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Calculator Settings</span>
        </button>
      </div>

      {/* TABS BAR: "Interactive Pricing Calculator CMS", "Fixed Rate Cards", "Inspection Engine Rules", "City Surge Matrix" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("calculatorCms")}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === "calculatorCms"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <Calculator className="w-4 h-4 text-purple-600" />
            <span>Interactive Calculator CMS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fixed")}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === "fixed"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Fixed Rate Cards
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inspection")}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === "inspection"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Inspection Engine Rules
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("city")}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeTab === "city"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            City Surge Matrix
          </button>
        </div>

        {/* Search bar */}
        {activeTab !== "inspection" && activeTab !== "calculatorCms" && (
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === "fixed" ? "Search service package..." : "Search city or zone..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        )}
      </div>

      {/* ─── TAB 1: INTERACTIVE PRICING CALCULATOR CMS (Full Add / Edit / Delete Manager with Custom Modals) ─── */}
      {activeTab === "calculatorCms" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div>
                <span className="font-extrabold text-purple-900 dark:text-purple-300 block">
                  Interactive Calculator Content & Dynamic Pricing Manager
                </span>
                <span className="text-purple-700 dark:text-purple-400 text-[11px]">
                  All custom modals, add/edit drawers, and sticky real-time website simulator ready.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveCalculatorSettings}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lux flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Save Calculator</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            {/* LEFT 7 COLS: ALL CMS EDITORS */}
            <div className="lg:col-span-7 space-y-6">

              {/* 1. PAGE TITLE & SUBTITLE EDITOR */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Type className="w-4 h-4 text-purple-600" />
                  1. Main Page Heading & Subtitle
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Main Title Header
                    </label>
                    <input
                      type="text"
                      value={calcPageHeader.title}
                      onChange={(e) => setCalcPageHeader({ ...calcPageHeader, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Subtitle / Instructions Text
                    </label>
                    <textarea
                      rows={2}
                      value={calcPageHeader.subtitle}
                      onChange={(e) => setCalcPageHeader({ ...calcPageHeader, subtitle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. SERVICE MODEL TABS MANAGER (Add/Edit Custom Modal Popup) */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-600" />
                    2. Service Model Selection Tabs ({serviceModels.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setModelInputName("");
                      setModelModal({ isOpen: true, item: null });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Model Tab
                  </button>
                </div>

                <div className="space-y-3">
                  {serviceModels.map((mod) => (
                    <div
                      key={mod.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{mod.name}</span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setModelInputName(mod.name);
                            setModelModal({ isOpen: true, item: mod });
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Edit Service Model Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {serviceModels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirm({ isOpen: true, type: "model", id: mod.id, name: mod.name });
                            }}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 transition-colors"
                            title="Delete Service Model Tab"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. INFORMATION BANNER EDITOR */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  3. Information Box / Highlight Banner Editor
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Information Box Headline
                    </label>
                    <input
                      type="text"
                      value={calcBanner.title}
                      onChange={(e) => setCalcBanner({ ...calcBanner, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Information Box Description
                    </label>
                    <textarea
                      rows={3}
                      value={calcBanner.description}
                      onChange={(e) => setCalcBanner({ ...calcBanner, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. HOME LAYOUT SIZES SECTION (Custom Add/Edit Layout Modal) */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-purple-600" />
                    4. Select Home Layout Sizes ({calcLayouts.length} Tiers)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setLayoutForm({ code: "5bhk", price: 5899, durationMins: 420 });
                      setLayoutModal({ isOpen: true, item: null });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Layout Tier
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-xs block">
                    Section Heading Text
                  </label>
                  <input
                    type="text"
                    value={layoutSectionTitle}
                    onChange={(e) => setLayoutSectionTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {calcLayouts.map((lay) => (
                    <div
                      key={lay.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white text-xs uppercase">{lay.label}</span>
                        <span className="text-purple-600 font-extrabold">₹{lay.price} • {lay.durationMins} mins</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setLayoutForm({ code: lay.code, price: lay.price, durationMins: lay.durationMins });
                            setLayoutModal({ isOpen: true, item: lay });
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Edit Layout Tier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirm({ isOpen: true, type: "layout", id: lay.id, name: lay.label });
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Delete Layout Tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. ADD-ON INTENSIVE CARE CHECKLIST SECTION (Custom Add/Edit Addon Modal) */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-purple-600" />
                    5. Add-on Intensive Care Checklist Items ({calcAddons.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setAddonForm({ title: "", durationText: "+30 mins", durationMins: 30, price: 299 });
                      setAddonModal({ isOpen: true, item: null });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Checklist Item
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-xs block">
                    Section Heading Text
                  </label>
                  <input
                    type="text"
                    value={addonSectionTitle}
                    onChange={(e) => setAddonSectionTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase outline-none"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  {calcAddons.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">{item.title}</span>
                        <span className="text-[11px] text-slate-400 font-bold">{item.durationText} • +₹{item.price}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAddonForm({ title: item.title, durationText: item.durationText, durationMins: item.durationMins, price: item.price });
                            setAddonModal({ isOpen: true, item });
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Edit Add-on Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirm({ isOpen: true, type: "addon", id: item.id, name: item.title });
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Delete Add-on Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. PRICING SUMMARY CARD CONFIG & GUARANTEES BULLETS LIST */}
              <div className="p-6 rounded-3xl bg-purple-950 text-white space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-purple-800 pb-3">
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-purple-300" />
                    6. Pricing Summary Dark Card & Guarantees Config
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setGuaranteeInputText("");
                      setGuaranteeModal({ isOpen: true, item: null });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer border border-purple-600"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Guarantee Bullet
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-purple-200 block mb-1">Pricing Summary Header</label>
                    <input
                      type="text"
                      value={summaryCardConfig.cardHeader}
                      onChange={(e) => setSummaryCardConfig({ ...summaryCardConfig, cardHeader: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-purple-900 border border-purple-700 text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-200 block mb-1">Active Pros Badge Text</label>
                    <input
                      type="text"
                      value={summaryCardConfig.activeProsBadgeText}
                      onChange={(e) => setSummaryCardConfig({ ...summaryCardConfig, activeProsBadgeText: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-purple-900 border border-purple-700 text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-200 block mb-1">Total Label Text</label>
                    <input
                      type="text"
                      value={summaryCardConfig.totalLabel}
                      onChange={(e) => setSummaryCardConfig({ ...summaryCardConfig, totalLabel: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-purple-900 border border-purple-700 text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-purple-200 block mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={summaryCardConfig.ctaButtonText}
                      onChange={(e) => setSummaryCardConfig({ ...summaryCardConfig, ctaButtonText: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-purple-900 border border-purple-700 text-white font-bold outline-none"
                    />
                  </div>
                </div>

                {/* GUARANTEES BULLET LIST CMS */}
                <div className="space-y-3 pt-3 border-t border-purple-900">
                  <span className="font-extrabold text-xs text-purple-200 block">
                    Guarantees & Vetting Bullet Points ({guaranteesList.length})
                  </span>

                  {guaranteesList.map((gua) => (
                    <div key={gua.id} className="p-3 rounded-2xl bg-purple-900 border border-purple-700 flex items-center justify-between gap-3 text-xs">
                      <span className="text-purple-100 font-medium leading-tight flex-1">{gua.text}</span>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setGuaranteeInputText(gua.text);
                            setGuaranteeModal({ isOpen: true, item: gua });
                          }}
                          className="p-1.5 rounded-lg bg-purple-950 text-purple-300 hover:text-white border border-purple-800 transition-colors"
                          title="Edit Guarantee Bullet"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirm({ isOpen: true, type: "guarantee", id: gua.id, name: "Guarantee Bullet" });
                          }}
                          className="p-1.5 rounded-lg bg-purple-950 text-purple-300 hover:text-red-400 border border-purple-800 transition-colors"
                          title="Delete Guarantee Bullet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="font-bold text-purple-200 block mb-1 text-xs">Footer Terms / Reschedule Notice</label>
                  <input
                    type="text"
                    value={summaryCardConfig.footerNoticeText}
                    onChange={(e) => setSummaryCardConfig({ ...summaryCardConfig, footerNoticeText: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-purple-900 border border-purple-700 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* SAVE BUTTON BOTTOM BAR */}
              <button
                type="button"
                onClick={handleSaveCalculatorSettings}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white font-black text-sm shadow-lux transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                <span>Save Interactive Pricing Calculator Configuration</span>
              </button>
            </div>

            {/* RIGHT 5 COLS: STICKY LIVE PREVIEW */}
            <div className="lg:col-span-5 sticky self-start z-30" style={{ top: "calc(5rem + 1.5rem)" }}>
              {/* Outer shell: rounded-3xl + overflow-hidden clips children to perfect corners */}
              <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
                {/* Scrollable inner */}
                <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: "calc(100vh - 7rem)" }}>
                  {/* Header bar — top corners clipped by outer shell */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-purple-50/90 dark:bg-purple-950/90 backdrop-blur-md border-b border-purple-200 dark:border-purple-800">
                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      Live Website Calculator Preview
                    </span>
                  </div>

                  {/* SIMULATED WEBPAGE CALCULATOR COMPONENT */}
                  <div className="p-4 sm:p-5 bg-white dark:bg-slate-950 space-y-4 text-xs pb-5">
                    {/* Header */}
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        {calcPageHeader.title}
                      </h2>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                        {calcPageHeader.subtitle}
                      </p>
                    </div>

                    {/* Service Model Tabs */}
                    <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit text-[11px] font-bold overflow-x-auto no-scrollbar">
                      {serviceModels.map((mod) => (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => setActiveModelId(mod.id)}
                          className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeModelId === mod.id
                              ? "bg-purple-900 text-white font-black shadow-xs"
                              : "text-slate-500"
                            }`}
                        >
                          {mod.name}
                        </button>
                      ))}
                    </div>

                    {/* Information Box */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-purple-900 dark:text-purple-300">
                        <span>{calcBanner.title}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 leading-relaxed line-clamp-2">
                        {calcBanner.description}
                      </p>
                    </div>

                    {/* SELECT HOME LAYOUT SIZE */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        {layoutSectionTitle}
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {calcLayouts.map((lay) => (
                          <button
                            key={lay.id}
                            type="button"
                            onClick={() => setSimSelectedLayoutId(lay.id)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${simSelectedLayoutId === lay.id
                                ? "bg-purple-900 text-white border-purple-900 shadow-sm scale-102 font-black"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                              }`}
                          >
                            <span className="block text-xs uppercase">{lay.label}</span>
                            <span className="block text-[9px] opacity-80">₹{lay.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ADD-ON INTENSIVE CARE CHECKLIST */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        {addonSectionTitle}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {calcAddons.map((item) => (
                          <label
                            key={item.id}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-1.5 cursor-pointer transition-all ${item.isChecked
                                ? "bg-purple-50 border-purple-300 text-purple-900 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-200"
                                : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-extrabold text-[10px] truncate">{item.title}</span>
                              <span className="text-[8.5px] text-slate-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {item.durationText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-black text-[10px] text-purple-700 dark:text-purple-300">+₹{item.price}</span>
                              <input
                                type="checkbox"
                                checked={item.isChecked || false}
                                onChange={() => {
                                  setCalcAddons(
                                    calcAddons.map((a) => (a.id === item.id ? { ...a, isChecked: !a.isChecked } : a))
                                  );
                                }}
                                className="w-3.5 h-3.5 rounded accent-purple-600 cursor-pointer"
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* PRICING SUMMARY DARK CONTAINER */}
                    <div className="p-4 rounded-2xl bg-purple-950 text-white space-y-3 shadow-xl relative overflow-hidden text-[11px]">
                      <div className="flex items-center justify-between border-b border-purple-800/80 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                          {summaryCardConfig.cardHeader}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-900 text-emerald-400 font-bold text-[9px] flex items-center gap-1 border border-purple-700">
                          <UserCheck className="w-2.5 h-2.5" />
                          {summaryCardConfig.activeProsBadgeText}
                        </span>
                      </div>

                      <div className="space-y-1 text-[10.5px]">
                        <div className="flex justify-between items-center text-purple-200">
                          <span>Base Fare ({activeLayout?.label.toUpperCase()} Deep Clean)</span>
                          <span className="font-black text-white">₹{activeLayout?.price}</span>
                        </div>
                        <div className="flex justify-between items-center text-purple-200">
                          <span>{summaryCardConfig.estimatedEffortLabel}</span>
                          <span className="font-bold text-white flex items-center gap-1 text-[10px]">
                            <Clock className="w-3 h-3 text-purple-400" />
                            {Math.floor(simTotalDuration / 60)} Hours ({simTotalDuration} min)
                          </span>
                        </div>
                      </div>

                      {/* VALUE GUARANTEES */}
                      <div className="p-2.5 rounded-xl bg-purple-900/60 border border-purple-800/80 space-y-1 text-[9px] text-purple-200">
                        {guaranteesList.map((gua) => (
                          <div key={gua.id} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{gua.text}</span>
                          </div>
                        ))}
                      </div>

                      {/* TOTAL */}
                      <div className="pt-1.5 border-t border-purple-800/80 flex items-baseline justify-between">
                        <span className="text-[10px] font-extrabold text-purple-300">{summaryCardConfig.totalLabel}</span>
                        <span className="text-2xl font-black tracking-tight text-white">
                          ₹{simTotalPrice}
                        </span>
                      </div>

                      {/* CTA BUTTON */}
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>{summaryCardConfig.ctaButtonText}</span>
                      </button>

                      <p className="text-[8.5px] text-purple-400 text-center line-clamp-1">
                        {summaryCardConfig.footerNoticeText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: FIXED RATE CARDS ─── */}
      {activeTab === "fixed" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["All", "AC Servicing", "Deep Cleaning", "Electrician", "Plumbing", "Home Salon", "Car Wash"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${selectedCategory === cat
                      ? "bg-brand-500 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingRate(null);
                setRateForm({
                  serviceTitle: "",
                  category: "AC Servicing",
                  basePrice: 599,
                  memberPrice: 499,
                  convenienceFee: 49,
                  gstPercentage: 18,
                  commissionPercentage: 25,
                  surgeMultiplier: 1.0,
                });
                setIsAddRateOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rate Card</span>
            </button>
          </div>

          <DataTable columns={catColumns} data={filteredRateCards} />
        </div>
      )}

      {/* ─── TAB 3: INSPECTION & DIAGNOSTIC QUOTING ENGINE ─── */}
      {activeTab === "inspection" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Inspection Engine Config Rules
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Base Inspection Fee (₹)</label>
                <input
                  type="number"
                  value={inspectionRules.baseInspectionFee}
                  onChange={(e) => setInspectionRules({ ...inspectionRules, baseInspectionFee: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hourly Labor Rate (₹/hr)</label>
                <input
                  type="number"
                  value={inspectionRules.hourlyLaborRate}
                  onChange={(e) => setInspectionRules({ ...inspectionRules, hourlyLaborRate: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: CITY SURGE MATRIX ─── */}
      {activeTab === "city" && (
        <div className="space-y-4">
          <DataTable
            columns={[
              { key: "cityName", header: "City", accessor: (r) => r.cityName },
              { key: "locality", header: "Locality", accessor: (r) => r.locality || "All" },
              { key: "baseFareMultiplier", header: "Base Multiplier", accessor: (r) => `${r.baseFareMultiplier}x` },
              { key: "peakHourSurge", header: "Peak Surge", accessor: (r) => `${r.peakHourSurge}x` },
              { key: "nightSurgeMultiplier", header: "Night Surge", accessor: (r) => `${r.nightSurgeMultiplier}x` },
              { key: "weatherSurge", header: "Weather Surge", accessor: (r) => `${r.weatherSurge}x` },
            ]}
            data={filteredCityPricings}
          />
        </div>
      )}

      {/* ─── CUSTOM TOAST NOTIFICATION ─── */}
      {toastMessage && (
        <Portal>
          <div className="fixed top-6 right-6 z-[999999] animate-in slide-in-from-top-5 duration-300">
            <div className="px-5 py-3.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs shadow-2xl border border-purple-500/40 flex items-center gap-3 backdrop-blur-md">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── CUSTOM MODAL: ADD / EDIT SERVICE MODEL TAB ─── */}
      {modelModal.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSaveModelModal} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  {modelModal.item ? "Edit Service Model Tab" : "Add Service Model Tab"}
                </h3>
                <button type="button" onClick={() => setModelModal({ isOpen: false, item: null })} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Service Model Name *
                </label>
                <input
                  type="text"
                  required
                  value={modelInputName}
                  onChange={(e) => setModelInputName(e.target.value)}
                  placeholder="e.g. Daily Hourly Chores"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModelModal({ isOpen: false, item: null })} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lux">
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ─── CUSTOM MODAL: ADD / EDIT LAYOUT TIER ─── */}
      {layoutModal.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSaveLayoutModal} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-purple-600" />
                  {layoutModal.item ? "Edit Layout Size Tier" : "Add New Layout Size Tier"}
                </h3>
                <button type="button" onClick={() => setLayoutModal({ isOpen: false, item: null })} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Layout Code / Label (e.g. 1bhk, Villa) *
                  </label>
                  <input
                    type="text"
                    required
                    value={layoutForm.code}
                    onChange={(e) => setLayoutForm({ ...layoutForm, code: e.target.value })}
                    placeholder="e.g. 5bhk"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold uppercase outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={layoutForm.price}
                      onChange={(e) => setLayoutForm({ ...layoutForm, price: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-purple-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      required
                      value={layoutForm.durationMins}
                      onChange={(e) => setLayoutForm({ ...layoutForm, durationMins: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setLayoutModal({ isOpen: false, item: null })} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lux">
                  Save Layout Tier
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ─── CUSTOM MODAL: ADD / EDIT ADD-ON ITEM ─── */}
      {addonModal.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSaveAddonModal} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-purple-600" />
                  {addonModal.item ? "Edit Add-on Item" : "Add New Add-on Item"}
                </h3>
                <button type="button" onClick={() => setAddonModal({ isOpen: false, item: null })} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Add-on Item Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={addonForm.title}
                    onChange={(e) => setAddonForm({ ...addonForm, title: e.target.value })}
                    placeholder="e.g. Carpet Shampoo Wash"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Duration Label</label>
                    <input
                      type="text"
                      required
                      value={addonForm.durationText}
                      onChange={(e) => setAddonForm({ ...addonForm, durationText: e.target.value })}
                      placeholder="e.g. +45 mins"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={addonForm.price}
                      onChange={(e) => setAddonForm({ ...addonForm, price: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-purple-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setAddonModal({ isOpen: false, item: null })} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lux">
                  Save Add-on Item
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ─── CUSTOM MODAL: ADD / EDIT GUARANTEE BULLET ─── */}
      {guaranteeModal.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSaveGuaranteeModal} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  {guaranteeModal.item ? "Edit Guarantee Bullet" : "Add New Guarantee Bullet"}
                </h3>
                <button type="button" onClick={() => setGuaranteeModal({ isOpen: false, item: null })} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Guarantee Bullet Text *
                </label>
                <textarea
                  rows={3}
                  required
                  value={guaranteeInputText}
                  onChange={(e) => setGuaranteeInputText(e.target.value)}
                  placeholder="e.g. 100% Damage Protection Insurance Covered"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setGuaranteeModal({ isOpen: false, item: null })} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lux">
                  Save Guarantee
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ─── CUSTOM CONFIRMATION DELETE MODAL ─── */}
      {deleteConfirm.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Confirm Deletion</h3>
                  <p className="text-[11px] text-slate-500">This item will be permanently removed.</p>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Are you sure you want to delete <strong className="font-black text-slate-900 dark:text-white">&quot;{deleteConfirm.name}&quot;</strong>?
              </p>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: "", name: "" })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── ADD / EDIT FIXED RATE CARD MODAL ─── */}
      {(isAddRateOpen || editingRate !== null) && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSaveRateCard} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Tag className="w-5 h-5 text-brand-600" />
                  <span>{editingRate ? "Edit Fixed Rate Card" : "Add New Fixed Rate Card"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddRateOpen(false);
                    setEditingRate(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Service Package Title */}
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Service Package Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={rateForm.serviceTitle}
                    onChange={(e) => setRateForm({ ...rateForm, serviceTitle: e.target.value })}
                    placeholder="e.g. Split AC Foam Wash & Pressure Jet"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>

                {/* Service Category */}
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Service Category *
                  </label>
                  <select
                    value={rateForm.category}
                    onChange={(e) => setRateForm({ ...rateForm, category: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  >
                    {["AC Servicing", "Deep Cleaning", "Electrician", "Plumbing", "Home Salon", "Car Wash"].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Base Price & Member Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Base Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={rateForm.basePrice}
                      onChange={(e) => setRateForm({ ...rateForm, basePrice: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-extrabold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Member Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={rateForm.memberPrice}
                      onChange={(e) => setRateForm({ ...rateForm, memberPrice: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-extrabold text-brand-600 dark:text-brand-400 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Tech Fee & GST Percentage */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Tech / Convenience Fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={rateForm.convenienceFee}
                      onChange={(e) => setRateForm({ ...rateForm, convenienceFee: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">GST Tax (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={28}
                      value={rateForm.gstPercentage}
                      onChange={(e) => setRateForm({ ...rateForm, gstPercentage: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Commission Percentage & Surge Multiplier */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Partner Commission (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rateForm.commissionPercentage}
                      onChange={(e) => setRateForm({ ...rateForm, commissionPercentage: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-emerald-600 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Surge Multiplier</label>
                    <input
                      type="number"
                      step={0.05}
                      min={1.0}
                      max={3.0}
                      value={rateForm.surgeMultiplier}
                      onChange={(e) => setRateForm({ ...rateForm, surgeMultiplier: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-amber-600 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddRateOpen(false);
                    setEditingRate(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingRate ? "Update Rate Card" : "Save Rate Card"}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}
    </div>
  );
}
