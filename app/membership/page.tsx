"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Crown,
  Sparkles,
  Zap,
  Gift,
  ShieldCheck,
  CheckCircle2,
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  Calendar,
  Percent,
  DollarSign,
  TrendingUp,
  Tag,
  Star,
  Award,
  AlertCircle,
  Megaphone,
  Clock,
  ArrowRight,
  ChevronRight,
  Building,
  UserPlus,
  Sliders,
  Palette,
  Upload,
  Eye,
  MousePointer,
  Image as ImageIcon,
} from "lucide-react";
import {
  initialMembershipPlans,
  initialFreeServiceOffers,
  initialMemberSubscribers,
  initialCategories,
  MembershipPlan,
  FreeServiceOffer,
  MemberSubscriber,
  IncludedServiceRule,
} from "@/lib/mockData";
import { DataTable, Column } from "@/components/DataTable";
import { CustomSelect } from "@/components/CustomSelect";
import { Portal } from "@/components/Portal";

const AVAILABLE_SERVICE_CATEGORIES = [
  "AC & Appliance Servicing",
  "Electrical & Power Maintenance",
  "Plumbing & Water Flow",
  "Home Deep Cleaning",
  "Water Purifier (RO)",
  "Home Painting & Wall Care",
  "Pest Control & Fumigation",
  "Carpentry & Furniture Fixes",
];

const AVAILABLE_VIP_PERKS = [
  "15-Minute Express Priority Partner Allocation",
  "₹0 Convenience & Slot Booking Fee",
  "Extended 30-Day Work Warranty",
  "Free Spare Parts & Material Rate Protection",
  "Dedicated Priority VIP Support Manager",
  "Free Slot Cancellation & Instant Refund",
  "Free Pest Control Inspection Add-on",
];

const THEME_COLOR_OPTIONS = [
  { name: "Gold / Amber", theme: "from-amber-600 via-amber-500 to-yellow-600", preview: "bg-gradient-to-r from-amber-600 to-yellow-500" },
  { name: "Purple / Royal", theme: "from-purple-900 via-purple-700 to-brand-600", preview: "bg-gradient-to-r from-purple-900 to-brand-600" },
  { name: "Emerald / Diamond", theme: "from-emerald-700 via-teal-800 to-slate-900", preview: "bg-gradient-to-r from-emerald-700 to-teal-800" },
  { name: "Midnight / Obsidian", theme: "from-slate-900 via-slate-800 to-slate-950", preview: "bg-gradient-to-r from-slate-900 to-slate-800" },
  { name: "Sapphire / Blue", theme: "from-blue-700 via-indigo-800 to-slate-900", preview: "bg-gradient-to-r from-blue-700 to-indigo-800" },
  { name: "Ruby / Rose", theme: "from-rose-700 via-pink-800 to-slate-900", preview: "bg-gradient-to-r from-rose-700 to-pink-800" },
];

const PRESET_MEMBERSHIP_BANNERS = [
  { label: "16:9 VIP Gold Hero Banner", dimensions: "1200 x 675 px", format: "16:9 Hero (1200x675)", url: "https://images.unsplash.com/photo-1556742049-0a670f4a4591?w=1200&h=675&auto=format&fit=crop&q=80" },
  { label: "4:1 Crown Leaderboard Banner", dimensions: "1200 x 300 px", format: "4:1 Wide Leaderboard (1200x300)", url: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1200&h=300&auto=format&fit=crop&q=80" },
  { label: "1:1 Member Pass Square", dimensions: "800 x 800 px", format: "1:1 Square Mobile (800x800)", url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=800&auto=format&fit=crop&q=80" },
  { label: "3:1 Priority Pass Strip", dimensions: "900 x 300 px", format: "3:1 Category Strip (900x300)", url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&h=300&auto=format&fit=crop&q=80" },
  { label: "9:16 VIP Story Banner", dimensions: "720 x 1280 px", format: "9:16 Vertical Story (720x1280)", url: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=720&h=1280&auto=format&fit=crop&q=80" },
];

export default function MembershipManagementPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>(initialMembershipPlans);
  const [freeOffers, setFreeOffers] = useState<FreeServiceOffer[]>(initialFreeServiceOffers);
  const [subscribers, setSubscribers] = useState<MemberSubscriber[]>(initialMemberSubscribers);

  // MEMBERSHIP MARKETING BANNERS STATE (SHOWING DEMO IMAGES FOR ALL 5 SIZES)
  const [membershipBanners, setMembershipBanners] = useState([
    {
      id: "mb-2",
      bannerFormat: "4:1 Wide Leaderboard (1200x300)",
      dimensions: "1200 x 300 px",
      imageUrl: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1200&h=300&auto=format&fit=crop&q=80",
      targetUrl: "https://helpmate-theta.vercel.app/membership",
      status: "Active",
      clicksCount: 1890,
    },
    {
      id: "mb-3",
      bannerFormat: "1:1 Square Mobile (800x800)",
      dimensions: "800 x 800 px",
      imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=800&auto=format&fit=crop&q=80",
      targetUrl: "https://helpmate-theta.vercel.app/membership",
      status: "Active",
      clicksCount: 950,
    },
    {
      id: "mb-4",
      bannerFormat: "3:1 Category Strip (900x300)",
      dimensions: "900 x 300 px",
      imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&h=300&auto=format&fit=crop&q=80",
      targetUrl: "https://helpmate-theta.vercel.app/membership",
      status: "Active",
      clicksCount: 1240,
    },
    {
      id: "mb-5",
      bannerFormat: "9:16 Vertical Story (720x1280)",
      dimensions: "720 x 1280 px",
      imageUrl: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=720&h=1280&auto=format&fit=crop&q=80",
      targetUrl: "https://helpmate-theta.vercel.app/membership",
      status: "Active",
      clicksCount: 780,
    },
  ]);

  const [isAddMbBannerOpen, setIsAddMbBannerOpen] = useState(false);
  const [newMbFormat, setNewMbFormat] = useState("16:9 Hero (1200x675)");
  const [newMbDimensions, setNewMbDimensions] = useState("1200 x 675 px");
  const [newMbImageUrl, setNewMbImageUrl] = useState("https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1200&h=300&auto=format&fit=crop&q=80");
  const [newMbTargetUrl, setNewMbTargetUrl] = useState("https://helpmate-theta.vercel.app/membership");

  const handleCreateMembershipBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMbImageUrl) return;

    const newMb = {
      id: `mb-${Date.now()}`,
      bannerFormat: newMbFormat,
      dimensions: newMbDimensions,
      imageUrl: newMbImageUrl,
      targetUrl: newMbTargetUrl,
      status: "Active",
      clicksCount: 0,
    };

    setMembershipBanners([newMb, ...membershipBanners]);
    setIsAddMbBannerOpen(false);
  };

  const [activeTab, setActiveTab] = useState<"plans" | "free_services" | "subscribers" | "marketing">("plans");

  // Filter States for Subscribers
  const [searchSubscriber, setSearchSubscriber] = useState("");
  const [filterPlanId, setFilterPlanId] = useState("all");
  const [filterSubscriberStatus, setFilterSubscriberStatus] = useState("all");

  // Drawer / Slider States
  const [isPlanDrawerOpen, setIsPlanDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  const [isFreeServiceDrawerOpen, setIsFreeServiceDrawerOpen] = useState(false);
  const [editingFreeOffer, setEditingFreeOffer] = useState<FreeServiceOffer | null>(null);

  // Edit/Create Plan Form State
  const [planFormName, setPlanFormName] = useState("");
  const [planFormPrice, setPlanFormPrice] = useState(999);
  const [planFormOrigPrice, setPlanFormOrigPrice] = useState(1999);
  const [planFormDiscount, setPlanFormDiscount] = useState(15);
  const [planFormFreeQuota, setPlanFormFreeQuota] = useState(3);
  const [planFormBadge, setPlanFormBadge] = useState("Popular");
  const [planFormTagline, setPlanFormTagline] = useState("");
  const [planFormBillingCycle, setPlanFormBillingCycle] = useState<"Annual" | "Quarterly" | "Monthly">("Annual");
  const [planFormColorTheme, setPlanFormColorTheme] = useState("from-amber-600 via-amber-500 to-yellow-600");
  const [planFormIncludedServices, setPlanFormIncludedServices] = useState<IncludedServiceRule[]>([
    {
      id: "s1",
      serviceTitle: "AC & Appliance Servicing",
      category: "AC Servicing & Repair",
      serviceType: "Split AC",
      benefitType: "Free",
      discountPercent: 100,
      usageLimit: "2 / year",
    },
    {
      id: "s2",
      serviceTitle: "Electrical & Power Maintenance",
      category: "Electrical & Wiring",
      serviceType: "Electrical Circuit",
      benefitType: "PercentDiscount",
      discountPercent: 15,
      usageLimit: "Unlimited",
    },
    {
      id: "s3",
      serviceTitle: "Plumbing & Water Flow",
      category: "Plumbing Services",
      serviceType: "Plumbing",
      benefitType: "PercentDiscount",
      discountPercent: 15,
      usageLimit: "Unlimited",
    },
  ]);
  const [planFormPerks, setPlanFormPerks] = useState<string[]>([
    "15-Minute Express Priority Partner Allocation",
    "₹0 Convenience & Slot Booking Fee",
    "Extended 30-Day Work Warranty",
  ]);

  // Wizard Step for creating/editing membership tier: 1 | 2 | 3 | 4
  const [planWizardStep, setPlanWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 2 Form States matching exact 4-field user selection component + Per-Service Benefit Options
  const [step2Category, setStep2Category] = useState("AC Servicing & Repair");
  const [step2ServiceType, setStep2ServiceType] = useState("Split AC");
  const [step2ServiceAction, setStep2ServiceAction] = useState("All Actions (Servicing, Repair, Install)");
  const [step2SelectedPackageTitle, setStep2SelectedPackageTitle] = useState("");

  // Per-Service Discount / Free Service Benefit Selector states
  const [step2BenefitType, setStep2BenefitType] = useState<"Free" | "PercentDiscount" | "FixedDiscount">("Free");
  const [step2DiscountPercent, setStep2DiscountPercent] = useState<number>(20);
  const [step2DiscountAmount, setStep2DiscountAmount] = useState<number>(150);
  const [step2UsageLimit, setStep2UsageLimit] = useState<string>("Unlimited");

  // All sub-services extracted from categories
  const allSubServices = useMemo(() => {
    const list: { id: string; category: string; title: string; type: string; price: number; duration?: string }[] = [];
    initialCategories.forEach((cat) => {
      (cat.subServices || []).forEach((sub) => {
        list.push({
          id: sub.id,
          category: cat.name,
          title: sub.title,
          type: sub.type,
          price: sub.price,
          duration: sub.duration || "45 mins",
        });
      });
    });
    return list;
  }, []);

  // Filtered packages for Step 2 dropdown 4
  const filteredPackages = useMemo(() => {
    return allSubServices.filter((pkg) => {
      const matchCat =
        !step2Category ||
        pkg.category.toLowerCase().includes(step2Category.toLowerCase().slice(0, 4)) ||
        step2Category === "All Categories";

      const matchAction =
        step2ServiceAction === "All Actions (Servicing, Repair, Install)" ||
        pkg.type.toLowerCase().includes(step2ServiceAction.toLowerCase()) ||
        step2ServiceAction.toLowerCase().includes(pkg.type.toLowerCase());

      return matchCat && matchAction;
    });
  }, [allSubServices, step2Category, step2ServiceAction]);

  // Sync selected package title cleanly to prevent state thrashing/lag during re-renders
  React.useEffect(() => {
    if (filteredPackages.length > 0) {
      if (!filteredPackages.some((p) => p.title === step2SelectedPackageTitle)) {
        setStep2SelectedPackageTitle(filteredPackages[0].title);
      }
    } else {
      setStep2SelectedPackageTitle("");
    }
  }, [filteredPackages]);

  // Add package with configured benefit rule to service list
  const handleAddServiceFromStep2 = () => {
    const targetTitle = step2SelectedPackageTitle || (filteredPackages[0] ? filteredPackages[0].title : "");
    if (!targetTitle) return;

    const matchedPkg = allSubServices.find((s) => s.title === targetTitle);

    const newRule: IncludedServiceRule = {
      id: `${targetTitle}-${Date.now()}`,
      serviceTitle: targetTitle,
      category: matchedPkg?.category || step2Category,
      serviceType: matchedPkg?.type || step2ServiceType,
      benefitType: step2BenefitType,
      discountPercent: step2BenefitType === "Free" ? 100 : step2DiscountPercent,
      discountAmount: step2DiscountAmount,
      usageLimit: step2UsageLimit,
    };

    setPlanFormIncludedServices((prev) => {
      const existsIndex = prev.findIndex((s) => s.serviceTitle === targetTitle);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = newRule;
        return updated;
      }
      return [...prev, newRule];
    });
  };

  // Helper to update specific fields for an added service rule directly in the included services list
  const updateIncludedServiceRule = (
    serviceTitle: string,
    updatedFields: Partial<IncludedServiceRule>
  ) => {
    setPlanFormIncludedServices((prev) =>
      prev.map((item) =>
        item.serviceTitle === serviceTitle ? { ...item, ...updatedFields } : item
      )
    );
  };

  // Custom Perk Input state in Step 3:
  const [customPerkInput, setCustomPerkInput] = useState("");

  // Custom Color Picker states in Step 4:
  const [isUsingCustomColors, setIsUsingCustomColors] = useState(false);
  const [customPrimaryColor, setCustomPrimaryColor] = useState("#9333ea");
  const [customSecondaryColor, setCustomSecondaryColor] = useState("#4f46e5");

  // Free Service Form State
  const [freeTitle, setFreeTitle] = useState("");
  const [freeCategory, setFreeCategory] = useState("AC Servicing & Repair");
  const [freeValue, setFreeValue] = useState(699);
  const [freeQuota, setFreeQuota] = useState(2);

  // Toggle included service
  const toggleIncludedService = (category: string) => {
    const exists = planFormIncludedServices.some((s) => s.serviceTitle === category);
    if (exists) {
      setPlanFormIncludedServices(planFormIncludedServices.filter((s) => s.serviceTitle !== category));
    } else {
      setPlanFormIncludedServices([
        ...planFormIncludedServices,
        {
          id: `${category}-${Date.now()}`,
          serviceTitle: category,
          benefitType: "PercentDiscount",
          discountPercent: 15,
          usageLimit: "Unlimited",
        },
      ]);
    }
  };

  // Toggle VIP Perk
  const toggleVipPerk = (perk: string) => {
    if (planFormPerks.includes(perk)) {
      setPlanFormPerks(planFormPerks.filter((p) => p !== perk));
    } else {
      setPlanFormPerks([...planFormPerks, perk]);
    }
  };

  // Summary Metrics
  const totalSubscribers = useMemo(() => {
    return plans.reduce((acc, p) => acc + p.activeSubscribersCount, 0);
  }, [plans]);

  const totalARR = useMemo(() => {
    return plans.reduce((acc, p) => acc + p.price * p.activeSubscribersCount, 0);
  }, [plans]);

  const totalFreeClaimed = useMemo(() => {
    return freeOffers.reduce((acc, o) => acc + o.totalClaimedCount, 0);
  }, [freeOffers]);

  // Handle Plan Toggle Active
  const togglePlanStatus = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const newStatus = p.status === "Active" ? "Draft" : "Active";
        return { ...p, status: newStatus };
      })
    );
  };

  // Handle Free Offer Toggle Status
  const toggleOfferStatus = (offerId: string) => {
    setFreeOffers((prev) =>
      prev.map((o) => {
        if (o.id !== offerId) return o;
        return { ...o, status: o.status === "Active" ? "Paused" : "Active" };
      })
    );
  };

  // Open Plan Drawer for Edit or Create
  const handleOpenPlanDrawer = (plan?: MembershipPlan) => {
    setPlanWizardStep(1);
    if (plan) {
      setEditingPlan(plan);
      setPlanFormName(plan.name);
      setPlanFormPrice(plan.price);
      setPlanFormOrigPrice(plan.originalPrice);
      setPlanFormDiscount(plan.discountPercent);
      setPlanFormFreeQuota(plan.freeServicesCount);
      setPlanFormBadge(plan.badge);
      setPlanFormTagline(plan.tagline);
      setPlanFormBillingCycle(plan.billingCycle || "Annual");
      setPlanFormColorTheme(plan.colorTheme || "from-amber-600 via-amber-500 to-yellow-600");
      if (plan.customPrimaryColor) {
        setIsUsingCustomColors(true);
        setCustomPrimaryColor(plan.customPrimaryColor);
        setCustomSecondaryColor(plan.customSecondaryColor || "#4f46e5");
      } else {
        setIsUsingCustomColors(false);
      }
      setPlanFormIncludedServices(
        (
          plan.includedServices || [
            "Power Jet Deep Foam Servicing",
            "Anti-Bacterial Hydro Coil Cleaning",
            "Bathroom Hydro Cleaning & Descaling",
          ]
        ).map((item) => {
          if (typeof item === "string") {
            const isFree = item.toLowerCase().includes("free");
            return {
              id: item,
              serviceTitle: item,
              benefitType: isFree ? "Free" : "PercentDiscount",
              discountPercent: isFree ? 100 : plan.discountPercent || 15,
              discountAmount: 0,
              usageLimit: isFree ? "2 / year" : "Unlimited",
            };
          }
          return item;
        })
      );
      setPlanFormPerks(
        plan.perks && plan.perks.length > 0
          ? plan.perks
          : [
              "15-Minute Express Priority Partner Allocation",
              "₹0 Convenience & Slot Booking Fee",
              "Extended 30-Day Work Warranty",
            ]
      );
    } else {
      setEditingPlan(null);
      setPlanFormName("HelpMate Platinum VIP");
      setPlanFormPrice(1499);
      setPlanFormOrigPrice(2999);
      setPlanFormDiscount(18);
      setPlanFormFreeQuota(4);
      setPlanFormBadge("VIP Elite");
      setPlanFormTagline("Premium all-inclusive annual home care pass");
      setPlanFormBillingCycle("Annual");
      setPlanFormColorTheme("from-purple-900 via-purple-700 to-brand-600");
      setIsUsingCustomColors(false);
      setPlanFormIncludedServices([
        {
          id: "s1",
          serviceTitle: "Power Jet Deep Foam Servicing",
          category: "AC Servicing & Repair",
          serviceType: "Split AC",
          benefitType: "Free",
          discountPercent: 100,
          usageLimit: "2 / year",
        },
        {
          id: "s2",
          serviceTitle: "Split AC Complete Installation",
          category: "AC Servicing & Repair",
          serviceType: "Split AC",
          benefitType: "PercentDiscount",
          discountPercent: 20,
          usageLimit: "1 / year",
        },
        {
          id: "s3",
          serviceTitle: "Full Home Deep Cleaning (3BHK)",
          category: "Home Cleaning",
          serviceType: "Full Home",
          benefitType: "PercentDiscount",
          discountPercent: 15,
          usageLimit: "Unlimited",
        },
        {
          id: "s4",
          serviceTitle: "Smart MCB Box & Circuit Fitting",
          category: "Electrical & Wiring",
          serviceType: "Electrical Circuit",
          benefitType: "FixedDiscount",
          discountPercent: 0,
          discountAmount: 200,
          usageLimit: "Unlimited",
        },
      ]);
      setPlanFormPerks([
        "15-Minute Express Priority Partner Allocation",
        "₹0 Convenience & Slot Booking Fee",
        "Extended 30-Day Work Warranty",
        "Free Spare Parts & Material Rate Protection",
        "Dedicated Priority VIP Support Manager",
      ]);
    }
    setIsPlanDrawerOpen(true);
  };

  // Save Plan from Drawer
  const handleSavePlanDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    const finalColorTheme = isUsingCustomColors
      ? `from-[${customPrimaryColor}] to-[${customSecondaryColor}]`
      : planFormColorTheme;

    if (editingPlan) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === editingPlan.id
            ? {
                ...p,
                name: planFormName,
                price: Number(planFormPrice),
                originalPrice: Number(planFormOrigPrice),
                discountPercent: Number(planFormDiscount),
                freeServicesCount: Number(planFormFreeQuota),
                badge: planFormBadge,
                tagline: planFormTagline,
                billingCycle: planFormBillingCycle,
                colorTheme: finalColorTheme,
                customPrimaryColor: isUsingCustomColors ? customPrimaryColor : undefined,
                customSecondaryColor: isUsingCustomColors ? customSecondaryColor : undefined,
                includedServices: planFormIncludedServices,
                perks: planFormPerks,
              }
            : p
        )
      );
    } else {
      const newPlan: MembershipPlan = {
        id: `plan-${Date.now()}`,
        name: planFormName,
        slug: planFormName.toLowerCase().replace(/\s+/g, "-"),
        tagline: planFormTagline,
        price: Number(planFormPrice),
        originalPrice: Number(planFormOrigPrice),
        billingCycle: planFormBillingCycle,
        badge: planFormBadge,
        discountPercent: Number(planFormDiscount),
        freeServicesCount: Number(planFormFreeQuota),
        convenienceFeeWaiver: true,
        priorityDispatchMinutes: 15,
        freeCancellation: true,
        dedicatedManager: true,
        activeSubscribersCount: 0,
        status: "Active",
        colorTheme: finalColorTheme,
        customPrimaryColor: isUsingCustomColors ? customPrimaryColor : undefined,
        customSecondaryColor: isUsingCustomColors ? customSecondaryColor : undefined,
        includedServices: planFormIncludedServices,
        perks: planFormPerks,
      };
      setPlans([...plans, newPlan]);
    }
    setIsPlanDrawerOpen(false);
  };

  // Save Free Service from Drawer
  const handleSaveFreeServiceDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeTitle) return;
    const newOffer: FreeServiceOffer = {
      id: `free-srv-${Date.now()}`,
      serviceTitle: freeTitle,
      category: freeCategory,
      eligiblePlans: ["plan-gold", "plan-crown-elite"],
      annualQuota: Number(freeQuota),
      unitValue: Number(freeValue),
      totalClaimedCount: 0,
      status: "Active",
    };
    setFreeOffers([...freeOffers, newOffer]);
    setFreeTitle("");
    setIsFreeServiceDrawerOpen(false);
  };

  // Filtered Subscribers List
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const q = searchSubscriber.toLowerCase();
      const matchSearch =
        !q ||
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.toLowerCase().includes(q) ||
        s.locality.toLowerCase().includes(q);

      const matchPlan = filterPlanId === "all" || s.planId === filterPlanId;
      const matchStatus = filterSubscriberStatus === "all" || s.status.toLowerCase() === filterSubscriberStatus.toLowerCase();

      return matchSearch && matchPlan && matchStatus;
    });
  }, [subscribers, searchSubscriber, filterPlanId, filterSubscriberStatus]);

  // Subscribers Table Columns
  const subscriberColumns: Column<MemberSubscriber>[] = [
    {
      key: "customerName",
      header: "Member Customer",
      accessor: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold flex items-center justify-center text-xs shrink-0 border border-purple-200 dark:border-purple-800">
            <Crown className="w-4 h-4 text-purple-600" />
          </div>
          <div className="space-y-0.5">
            <div className="font-extrabold text-slate-900 dark:text-white text-xs">{s.customerName}</div>
            <div className="text-[10px] text-slate-500">{s.customerPhone} • {s.locality}</div>
          </div>
        </div>
      ),
    },
    {
      key: "planName",
      header: "VIP Plan Tier",
      accessor: (s) => (
        <span
          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border flex items-center gap-1 w-fit ${
            s.planId === "plan-crown-elite"
              ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
              : s.planId === "plan-gold"
              ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
          }`}
        >
          <Crown className="w-3 h-3" />
          {s.planName}
        </span>
      ),
    },
    {
      key: "freeServicesUsed",
      header: "Free Services Claimed",
      accessor: (s) => (
        <div className="space-y-1 text-xs">
          <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
            <span>{s.freeServicesUsed} of {s.freeServicesTotal} Claimed</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              {Math.round((s.freeServicesUsed / s.freeServicesTotal) * 100)}%
            </span>
          </div>
          <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(s.freeServicesUsed / s.freeServicesTotal) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "totalSavingsAmount",
      header: "Member Savings",
      accessor: (s) => (
        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
          ₹{s.totalSavingsAmount.toLocaleString("en-IN")} Saved
        </span>
      ),
    },
    {
      key: "status",
      header: "Validity Status",
      accessor: (s) => (
        <div className="space-y-0.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
              s.status === "Active"
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
            }`}
          >
            {s.status} ({s.daysRemaining} Days Left)
          </span>
          <div className="text-[10px] text-slate-400">Expires: {s.expiryDate}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full px-6 space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            HelpMate Membership & Free Services Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure VIP membership plans, free complimentary services, member discounts, and subscriber CRM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* RULE: Strictly ONLY ONE Primary Button per page/view */}
          <button
            type="button"
            onClick={() => handleOpenPlanDrawer()}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-lux cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Membership Plan</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">Active VIP Members</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalSubscribers.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% this month
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">Annual Membership ARR</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{(totalARR / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Recurring Subscription Revenue</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">Free Services Claimed</span>
            <Gift className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalFreeClaimed.toLocaleString("en-IN")} Jobs
          </div>
          <div className="text-[10px] text-amber-600 font-extrabold">100% Free Complimentary Jobs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">Average Member Savings</span>
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₹2,450 / yr
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Discounts + Free Services</div>
        </div>
      </div>

      {/* Main Tabbed Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "plans"
              ? "bg-purple-600 text-white shadow-lux"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Membership Tiers ({plans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("free_services")}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "free_services"
              ? "bg-purple-600 text-white shadow-lux"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Free Services Rules ({freeOffers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscribers")}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "subscribers"
              ? "bg-purple-600 text-white shadow-lux"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Subscriber Directory ({subscribers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("marketing")}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "marketing"
              ? "bg-purple-600 text-white shadow-lux"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Marketing & Banners</span>
        </button>
      </div>

      {/* TAB 1: MEMBERSHIP TIER PLANS (FULL WIDTH & ALL 3 CARDS 100% VISIBLE) */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const isActive = plan.status === "Active";

              // Distinct high-contrast card header background gradients for Card 1, 2, and 3
              const headerGradient =
                index === 0
                  ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900"
                  : index === 1
                  ? "bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-600"
                  : "bg-gradient-to-br from-purple-950 via-purple-800 to-indigo-950";

              return (
                <div
                  key={plan.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between transition-all bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-800"
                >
                  {/* Card Header Banner */}
                  <div className={`p-6 bg-gradient-to-br ${plan.colorTheme || 'from-amber-600 via-amber-500 to-yellow-600'} text-white space-y-3 relative`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-300" />
                        {plan.badge}
                      </span>

                      <button
                        type="button"
                        onClick={() => togglePlanStatus(plan.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                          isActive
                            ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/50"
                            : "bg-slate-700/60 text-slate-300 border border-slate-500"
                        }`}
                      >
                        {isActive ? "🟢 LIVE ON APP" : "⏸️ PAUSED"}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{plan.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-3xl font-black text-white">₹{plan.price}</span>
                      <span className="text-sm line-through text-slate-300">₹{plan.originalPrice}</span>
                      <span className="text-xs text-white font-bold">/ {plan.billingCycle || "Annual"}</span>
                    </div>
                  </div>

                  {/* Body Specs */}
                  <div className="p-6 space-y-5 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-4">
                      <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                        <span className="font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <Percent className="w-4 h-4 text-purple-600" /> Flat Service Discount
                        </span>
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                          {plan.discountPercent}% OFF
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                        <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-amber-600" /> Free Services Quota
                        </span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                          {plan.freeServicesCount} Free Jobs / {plan.billingCycle || "yr"}
                        </span>
                      </div>

                      {/* Included Covered Service Categories */}
                      {plan.includedServices && plan.includedServices.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                            Included Service Offers & Discounts
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {plan.includedServices.map((item, idx) => {
                              const title = typeof item === "string" ? item : item.serviceTitle;
                              const bType = typeof item === "string" ? (item.toLowerCase().includes("free") ? "Free" : "PercentDiscount") : item.benefitType;
                              const label = typeof item === "string" ? (item.toLowerCase().includes("free") ? "100% FREE" : `${plan.discountPercent || 15}% OFF`) : bType === "Free" ? "100% FREE" : bType === "PercentDiscount" ? `${item.discountPercent}% OFF` : `₹${item.discountAmount} OFF`;

                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                                >
                                  <span>{title}</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                      bType === "Free"
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                        : bType === "PercentDiscount"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    }`}
                                  >
                                    {label}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* VIP Included Perks */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                          VIP Included Perks
                        </span>
                        <ul className="space-y-2">
                          {plan.perks.map((perk, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-500 font-bold">
                        {plan.activeSubscribersCount} Active Subscribers
                      </span>

                      {/* EDIT OPENS SLIDE-OVER DRAWER */}
                      <button
                        type="button"
                        onClick={() => handleOpenPlanDrawer(plan)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-extrabold text-xs cursor-pointer transition-colors flex items-center gap-1 border border-purple-200 dark:border-purple-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Tier (Slider)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FREE COMPLIMENTARY SERVICES RULES */}
      {activeTab === "free_services" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-amber-600" />
              <div>
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Free Service Allocation Rules Engine
                </h4>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Define which high-value services are offered 100% FREE to Gold and Crown VIP members.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFreeServiceDrawerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add Free Service Offer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freeOffers.map((offer) => {
              const isOfferActive = offer.status === "Active";

              return (
                <div
                  key={offer.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {offer.category}
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
                        {offer.serviceTitle}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleOfferStatus(offer.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                        isOfferActive
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {isOfferActive ? "ACTIVE" : "PAUSED"}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Retail Value</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{offer.unitValue} FREE
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Annual Quota</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {offer.annualQuota} Jobs / Member
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Claimed</span>
                      <span className="font-extrabold text-purple-600 dark:text-purple-400">
                        {offer.totalClaimedCount} Times
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      Eligible Tiers: {offer.eligiblePlans.join(", ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: VIP SUBSCRIBERS DIRECTORY (CRM) */}
      {activeTab === "subscribers" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchSubscriber}
                  onChange={(e) => setSearchSubscriber(e.target.value)}
                  placeholder="Search subscriber name, phone, locality..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <CustomSelect
                  value={filterPlanId}
                  onChange={setFilterPlanId}
                  options={[
                    { value: "all", label: "All VIP Tiers" },
                    { value: "plan-silver", label: "HelpMate Silver Pass" },
                    { value: "plan-gold", label: "HelpMate Gold Club" },
                    { value: "plan-crown-elite", label: "Crown Elite VIP" },
                  ]}
                  placeholder="Filter Plan"
                  className="w-44 text-xs"
                />

                <CustomSelect
                  value={filterSubscriberStatus}
                  onChange={setFilterSubscriberStatus}
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "active", label: "Active Members" },
                    { value: "expired", label: "Expired Members" },
                  ]}
                  placeholder="Filter Status"
                  className="w-40 text-xs"
                />
              </div>
            </div>

            {/* Subscribers Table */}
            <DataTable columns={subscriberColumns} data={filteredSubscribers} />
          </div>
        </div>
      )}

      {/* TAB 4: MARKETING BANNERS & CHECKOUT PROMOTION */}
      {activeTab === "marketing" && (
        <div className="space-y-6">
          {/* Header Banner & Format Badge Bar - Clean Standard Page Container */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase tracking-wider">
                    Multi-Format Banners Engine
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                    Multi-Size Adaptive Display
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">App & Web VIP Marketing Banners</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-medium">
                  Manage promotional membership banners with multi-size aspect ratios (16:9, 4:1, 1:1, 3:1, 9:16) and direct image uploads.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMbBannerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add Membership Banner
              </button>
            </div>

            {/* Supported Formats Pills */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 self-center mr-1">Supported Formats:</span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700">16:9 Hero (1200x675)</span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700">4:1 Leaderboard (1200x300)</span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700">1:1 Square Mobile (800x800)</span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700">3:1 Strip (900x300)</span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700">9:16 Vertical Story (720x1280)</span>
            </div>
          </div>

          {/* Membership Promotional Pure Image Banners Grid with Mixed Width Layout (Full Width, Half Width, One-Third) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {membershipBanners.map((banner) => {
              const format = banner.bannerFormat;

              // Column width grid layout (Full Width, Half/2-Third Width, One-Third Width)
              const colSpanClass = format.includes("4:1")
                ? "col-span-full" // Full width (spans 3 columns)
                : format.includes("3:1")
                ? "col-span-1 md:col-span-2" // Half / 2-third width (spans 2 columns)
                : format.includes("16:9")
                ? "col-span-1 md:col-span-2" // Half width (spans 2 columns)
                : "col-span-1"; // One-third width (spans 1 column for 1:1 and 9:16)

              const aspectClass = format.includes("4:1")
                ? "aspect-[4/1]"
                : format.includes("1:1")
                ? "aspect-square max-h-72"
                : format.includes("3:1")
                ? "aspect-[3/1]"
                : format.includes("9:16")
                ? "aspect-[9/16] max-h-96"
                : "aspect-[16/9]";

              return (
                <div
                  key={banner.id}
                  className={`${colSpanClass} rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all`}
                >
                  <div>
                    {/* Dynamic Aspect-Ratio Banner Container displaying image in its exact size */}
                    <div className={`relative ${aspectClass} bg-slate-100 dark:bg-slate-800 overflow-hidden w-full mx-auto`}>
                      {banner.imageUrl ? (
                        <Image
                          src={banner.imageUrl}
                          alt="Membership Banner Image"
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : null}

                      <div className="absolute top-3 left-3 z-10 flex gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 ${
                          banner.status === "Active"
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-900/80 text-white backdrop-blur-md"
                        }`}>
                          <CheckCircle2 className="w-3 h-3" /> {banner.status}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-lg bg-black/75 text-white backdrop-blur-md text-[10px] font-mono font-bold shadow-md">
                          📐 {banner.dimensions}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                          {banner.bannerFormat}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <MousePointer className="w-3 h-3 text-purple-500" /> {banner.clicksCount} Clicks
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {banner.targetUrl}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setMembershipBanners((prev) =>
                          prev.map((b) => (b.id === banner.id ? { ...b, status: b.status === "Active" ? "Inactive" : "Active" } : b))
                        )
                      }
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                        banner.status === "Active"
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {banner.status === "Active" ? "Pause Banner" : "Activate Banner"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMembershipBanners(membershipBanners.filter((b) => b.id !== banner.id))}
                      className="p-1.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UPLOAD MEMBERSHIP BANNER IMAGE MODAL (ONLY IMAGE UPLOAD) */}
      {isAddMbBannerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Upload Membership Banner Image</h3>
                </div>
                <button type="button" onClick={() => setIsAddMbBannerOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMembershipBanner} className="space-y-4 text-xs">
                {/* Upload Image Dropzone & Preview Box */}
                <div className="space-y-3">
                  {newMbImageUrl && (
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm">
                      <Image
                        src={newMbImageUrl}
                        alt="Uploaded Banner Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                        Live Preview
                      </div>
                    </div>
                  )}

                  <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 cursor-pointer transition-colors text-center space-y-2">
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-extrabold text-purple-900 dark:text-purple-300 text-xs block">
                        Click to Upload Image File
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, WEBP formats</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (re) => setNewMbImageUrl(re.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <div className="flex gap-2 items-center pt-1">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">Image URL:</span>
                    <input
                      type="url"
                      value={newMbImageUrl}
                      onChange={(e) => setNewMbImageUrl(e.target.value)}
                      placeholder="Paste image URL..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[10px] bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddMbBannerOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md cursor-pointer transition-colors"
                  >
                    Save Banner Image
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* EXTRA WIDE SLIDE-OVER DRAWER: CREATE / EDIT MEMBERSHIP TIER */}
      {isPlanDrawerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 flex justify-end">
            <div className="absolute inset-0" onClick={() => setIsPlanDrawerOpen(false)} />
            <div className="relative max-w-4xl w-full h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-250 ease-out z-10 flex flex-col justify-between">
              {/* Stepper Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-slate-50/60 dark:bg-slate-850/60">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 w-fit">
                    <Crown className="w-3.5 h-3.5 text-purple-600" />
                    <span>Step {planWizardStep} of 4 </span>
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {editingPlan ? `Edit ${editingPlan.name}` : "Create New Membership Tier"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlanDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Navigation Bar */}
              <div className="grid grid-cols-4 gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPlanWizardStep(1);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    planWizardStep === 1
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs font-bold"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">Step 1</div>
                  <div className="text-xs font-black truncate">General & Pricing</div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPlanWizardStep(2);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    planWizardStep === 2
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs font-bold"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">Step 2</div>
                  <div className="text-xs font-black truncate">Service Select ({planFormIncludedServices.length})</div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPlanWizardStep(3);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    planWizardStep === 3
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs font-bold"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">Step 3</div>
                  <div className="text-xs font-black truncate">VIP Perks ({planFormPerks.length})</div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPlanWizardStep(4);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    planWizardStep === 4
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs font-bold"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">Step 4</div>
                  <div className="text-xs font-black truncate">Colors & Preview</div>
                </button>
              </div>

              {/* Scrollable Wizard Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <form
                  id="plan-drawer-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (planWizardStep === 4) {
                      handleSavePlanDrawer(e);
                    } else {
                      setPlanWizardStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : 4));
                    }
                  }}
                >
                  {/* STEP 1: GENERAL & PRICING */}
                  {planWizardStep === 1 && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          General Tier Information & Pricing Setup
                        </h4>
                        <p className="text-xs text-slate-500">
                          Set the title, marketing slogan, billing cycle, pricing, and discount quotas.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Plan Name
                          </label>
                          <input
                            type="text"
                            required
                            value={planFormName}
                            onChange={(e) => setPlanFormName(e.target.value)}
                            placeholder="e.g. HelpMate Platinum VIP"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Promotional Badge Text
                          </label>
                          <input
                            type="text"
                            value={planFormBadge}
                            onChange={(e) => setPlanFormBadge(e.target.value)}
                            placeholder="e.g. 🔥 Most Popular"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Marketing Tagline / Subtitle Slogan
                        </label>
                        <input
                          type="text"
                          value={planFormTagline}
                          onChange={(e) => setPlanFormTagline(e.target.value)}
                          placeholder="e.g. Our most popular VIP plan with free AC servicing & zero convenience fee"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Billing Cycle
                          </label>
                          <CustomSelect
                            value={planFormBillingCycle}
                            onChange={(val) => setPlanFormBillingCycle(val as any)}
                            options={[
                              { value: "Annual", label: "Annual (Per Year)" },
                              { value: "Quarterly", label: "Quarterly (Per 3 Months)" },
                              { value: "Monthly", label: "Monthly (Per Month)" },
                            ]}
                            placeholder="Select Billing Cycle"
                            className="w-full text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Offer Price (₹)
                          </label>
                          <input
                            type="number"
                            required
                            value={planFormPrice}
                            onChange={(e) => setPlanFormPrice(Number(e.target.value))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-brand-600"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Original Retail Price (₹)
                          </label>
                          <input
                            type="number"
                            required
                            value={planFormOrigPrice}
                            onChange={(e) => setPlanFormOrigPrice(Number(e.target.value))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40">
                        <div>
                          <label className="font-bold text-purple-900 dark:text-purple-200 block mb-1">
                            Flat Category Service Discount (%)
                          </label>
                          <input
                            type="number"
                            required
                            value={planFormDiscount}
                            onChange={(e) => setPlanFormDiscount(Number(e.target.value))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-amber-900 dark:text-amber-200 block mb-1">
                            Free Service Quota / Cycle
                          </label>
                          <input
                            type="number"
                            required
                            value={planFormFreeQuota}
                            onChange={(e) => setPlanFormFreeQuota(Number(e.target.value))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CATEGORY & SERVICE SELECTION */}
                  {planWizardStep === 2 && (
                    <div className="space-y-5 text-xs">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Service Selection & Package Configuration
                        </h4>
                        <p className="text-xs text-slate-500">
                          Filter by category, type, and action to select specific included packages for this membership tier, with custom percent discount or free service offer for each.
                        </p>
                      </div>

                      {/* 4-Field Selection Panel + Per-Service Benefit Configurator */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
                        {/* Top Row: 3 Custom Dropdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* 1. Service Category * */}
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              1. Service Category *
                            </label>
                            <CustomSelect
                              value={step2Category}
                              onChange={setStep2Category}
                              options={initialCategories.map((c) => ({ value: c.name, label: c.name }))}
                              searchable
                              placeholder="Select Category..."
                              className="w-full text-xs font-bold"
                            />
                          </div>

                          {/* 2. Service Type * */}
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              2. Service Type *
                            </label>
                            <CustomSelect
                              value={step2ServiceType}
                              onChange={setStep2ServiceType}
                              options={[
                                { value: "Split AC", label: "Split AC" },
                                { value: "Window AC", label: "Window AC" },
                                { value: "Full Home", label: "Full Home" },
                                { value: "Bathroom & Kitchen", label: "Bathroom & Kitchen" },
                                { value: "Electrical Circuit", label: "Electrical Circuit" },
                                { value: "RO System", label: "RO System" },
                                { value: "All Service Types", label: "All Service Types" },
                              ]}
                              placeholder="Select Service Type..."
                              className="w-full text-xs font-bold"
                            />
                          </div>

                          {/* 3. Service Action * */}
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              3. Service Action *
                            </label>
                            <CustomSelect
                              value={step2ServiceAction}
                              onChange={setStep2ServiceAction}
                              options={[
                                { value: "All Actions (Servicing, Repair, Install)", label: "All Actions (Servicing, Repair, Install)" },
                                { value: "Servicing", label: "Servicing & Maintenance" },
                                { value: "Repair", label: "Repair & Troubleshooting" },
                                { value: "Installation", label: "Installation & Fitting" },
                                { value: "Uninstallation", label: "Uninstallation" },
                              ]}
                              placeholder="Select Action..."
                              className="w-full text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div className="border-b border-slate-200 dark:border-slate-700 my-1" />

                        {/* Row 2: Select Package */}
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            4. Select Package (Type to Search) *
                          </label>
                          <CustomSelect
                            value={step2SelectedPackageTitle}
                            onChange={setStep2SelectedPackageTitle}
                            options={
                              filteredPackages.length > 0
                                ? filteredPackages.map((pkg) => ({
                                    value: pkg.title,
                                    label: `${pkg.title} — ₹${pkg.price} (${pkg.duration}) [${pkg.type}]`,
                                  }))
                                : [{ value: "", label: "No matching packages found" }]
                            }
                            searchable
                            placeholder="Search or Select Package..."
                            className="w-full text-xs font-bold"
                          />
                        </div>

                        <div className="border-b border-slate-200 dark:border-slate-700 my-1" />

                        {/* Per-Service Benefit & Discount Options Selector */}
                        <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span>5. Service Benefit Option (Free Service or Discount for Each) *</span>
                            </span>
                            <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full font-bold">
                              Per-Service Member Offer
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* 1. Benefit Type */}
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Benefit Type *
                              </label>
                              <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStep2BenefitType("Free");
                                    setStep2DiscountPercent(100);
                                  }}
                                  className={`py-1.5 text-[10px] font-black rounded-lg transition-all ${
                                    step2BenefitType === "Free"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  🎁 100% Free
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStep2BenefitType("PercentDiscount");
                                    if (step2DiscountPercent === 100) setStep2DiscountPercent(20);
                                  }}
                                  className={`py-1.5 text-[10px] font-black rounded-lg transition-all ${
                                    step2BenefitType === "PercentDiscount"
                                      ? "bg-purple-600 text-white shadow-xs"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  % Discount
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStep2BenefitType("FixedDiscount");
                                  }}
                                  className={`py-1.5 text-[10px] font-black rounded-lg transition-all ${
                                    step2BenefitType === "FixedDiscount"
                                      ? "bg-blue-600 text-white shadow-xs"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  ₹ Flat Off
                                </button>
                              </div>
                            </div>

                            {/* 2. Value Configuration */}
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                {step2BenefitType === "Free"
                                  ? "Benefit Value"
                                  : step2BenefitType === "PercentDiscount"
                                  ? "Discount Percentage (%)"
                                  : "Flat Savings Amount (₹)"}
                              </label>
                              {step2BenefitType === "Free" ? (
                                <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] flex items-center gap-1.5 h-[38px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>100% Free Job (₹0 Member Cost)</span>
                                </div>
                              ) : step2BenefitType === "PercentDiscount" ? (
                                <div className="flex items-center gap-1.5 h-[38px]">
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={step2DiscountPercent}
                                    onChange={(e) => setStep2DiscountPercent(Number(e.target.value))}
                                    className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs text-purple-600 dark:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                  <span className="font-black text-slate-700 dark:text-slate-300 text-xs">% OFF</span>
                                  <div className="flex items-center gap-1">
                                    {[10, 15, 20, 25, 50].map((p) => (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => setStep2DiscountPercent(p)}
                                        className={`px-1.5 py-1 text-[10px] font-extrabold rounded-md border ${
                                          step2DiscountPercent === p
                                            ? "bg-purple-600 text-white border-purple-600"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                        }`}
                                      >
                                        {p}%
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 h-[38px]">
                                  <span className="font-black text-slate-700 dark:text-slate-300 text-xs">₹</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={step2DiscountAmount}
                                    onChange={(e) => setStep2DiscountAmount(Number(e.target.value))}
                                    className="w-24 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="font-black text-slate-700 dark:text-slate-300 text-xs">OFF</span>
                                </div>
                              )}
                            </div>

                            {/* 3. Usage Quota / Limit */}
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Usage Limit / Quota *
                              </label>
                              <CustomSelect
                                value={step2UsageLimit}
                                onChange={setStep2UsageLimit}
                                options={[
                                  { value: "Unlimited", label: "Unlimited Usage / Year" },
                                  { value: "1 / year", label: "1 Job / Member / Year" },
                                  { value: "2 / year", label: "2 Jobs / Member / Year" },
                                  { value: "3 / year", label: "3 Jobs / Member / Year" },
                                  { value: "4 / year", label: "4 Jobs / Member / Year" },
                                  { value: "6 / year", label: "6 Jobs / Member / Year" },
                                  { value: "12 / year", label: "12 Jobs / Member / Year" },
                                ]}
                                className="w-full text-xs font-bold"
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleAddServiceFromStep2}
                              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span>+ Add Service Offer to Tier List</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Included Services List with Enhanced Interactive Row Controls */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            Configured Service Offers & Discounts List ({planFormIncludedServices.length})
                          </span>

                          {planFormIncludedServices.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setPlanFormIncludedServices([])}
                              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        {planFormIncludedServices.length === 0 ? (
                          <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 text-xs">
                            No services added yet. Select a service category/package and configure percent discount or free service benefit above.
                          </div>
                        ) : (
                          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {planFormIncludedServices.map((rule, idx) => {
                                const matchedPkg = allSubServices.find((s) => s.title === rule.serviceTitle);

                                return (
                                  <div
                                    key={idx}
                                    className="p-3.5 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      {/* Left Info */}
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                                          {idx + 1}
                                        </div>
                                        <div>
                                          <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2 flex-wrap">
                                            <span>{rule.serviceTitle}</span>
                                            {/* Benefit Badge */}
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                rule.benefitType === "Free"
                                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                                  : rule.benefitType === "PercentDiscount"
                                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                                              }`}
                                            >
                                              {rule.benefitType === "Free"
                                                ? "🎁 100% FREE"
                                                : rule.benefitType === "PercentDiscount"
                                                ? `⚡ ${rule.discountPercent}% OFF`
                                                : `🏷️ ₹${rule.discountAmount} OFF`}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                              Quota: {rule.usageLimit}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-slate-400 mt-0.5">
                                            {matchedPkg
                                              ? `${matchedPkg.category} • ${matchedPkg.type} • ${matchedPkg.duration}`
                                              : `${rule.category || "General"} Service`}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right Action: Delete */}
                                      <div className="flex items-center gap-2 self-end sm:self-center">
                                        {matchedPkg && (
                                          <span className="font-extrabold text-slate-500 dark:text-slate-400 text-xs">
                                            Retail: ₹{matchedPkg.price}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPlanFormIncludedServices(
                                              planFormIncludedServices.filter((s) => s.serviceTitle !== rule.serviceTitle)
                                            )
                                          }
                                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                                          title="Remove from included list"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Inline Interactive Row Controls */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/80 dark:bg-slate-800/30 p-2 rounded-xl">
                                      {/* Mode Switcher */}
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Offer:</span>
                                        <select
                                          value={rule.benefitType}
                                          onChange={(e) =>
                                            updateIncludedServiceRule(rule.serviceTitle, {
                                              benefitType: e.target.value as any,
                                              discountPercent: e.target.value === "Free" ? 100 : rule.discountPercent || 20,
                                            })
                                          }
                                          className="text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-slate-800 dark:text-slate-200"
                                        >
                                          <option value="Free">🎁 100% Free Service</option>
                                          <option value="PercentDiscount">⚡ Percent Discount (%)</option>
                                          <option value="FixedDiscount">🏷️ Fixed Amount Off (₹)</option>
                                        </select>
                                      </div>

                                      {/* Value Input */}
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Value:</span>
                                        {rule.benefitType === "Free" ? (
                                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">100% Complimentary</span>
                                        ) : rule.benefitType === "PercentDiscount" ? (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              min="1"
                                              max="100"
                                              value={rule.discountPercent}
                                              onChange={(e) =>
                                                updateIncludedServiceRule(rule.serviceTitle, {
                                                  discountPercent: Number(e.target.value),
                                                })
                                              }
                                              className="w-14 px-1.5 py-0.5 text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-purple-600 dark:text-purple-400"
                                            />
                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">% OFF</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">₹</span>
                                            <input
                                              type="number"
                                              min="1"
                                              value={rule.discountAmount || 150}
                                              onChange={(e) =>
                                                updateIncludedServiceRule(rule.serviceTitle, {
                                                  discountAmount: Number(e.target.value),
                                                })
                                              }
                                              className="w-16 px-1.5 py-0.5 text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-blue-600 dark:text-blue-400"
                                            />
                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">OFF</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Quota Limit */}
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Quota:</span>
                                        <select
                                          value={rule.usageLimit}
                                          onChange={(e) =>
                                            updateIncludedServiceRule(rule.serviceTitle, {
                                              usageLimit: e.target.value,
                                            })
                                          }
                                          className="text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-slate-800 dark:text-slate-200"
                                        >
                                          <option value="Unlimited">Unlimited Usage</option>
                                          <option value="1 / year">1 Job / Year</option>
                                          <option value="2 / year">2 Jobs / Year</option>
                                          <option value="3 / year">3 Jobs / Year</option>
                                          <option value="4 / year">4 Jobs / Year</option>
                                          <option value="6 / year">6 Jobs / Year</option>
                                          <option value="12 / year">12 Jobs / Year</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: VIP INCLUDED PERKS & CUSTOM ADD */}
                  {planWizardStep === 3 && (
                    <div className="space-y-5 text-xs">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          VIP Included Privileges & Custom Perks
                        </h4>
                        <p className="text-xs text-slate-500">
                          Select standard VIP membership perks or add your own custom privilege text.
                        </p>
                      </div>

                      {/* Section 1: Standard Perks */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Standard Privileges
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {AVAILABLE_VIP_PERKS.map((perk) => {
                            const isChecked = planFormPerks.includes(perk);
                            return (
                              <button
                                key={perk}
                                type="button"
                                onClick={() => toggleVipPerk(perk)}
                                className={`text-left p-3 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-3 border ${
                                  isChecked
                                    ? "bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-100 font-bold"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                                  isChecked ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300"
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span>{perk}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: Add Custom Perk */}
                      <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 space-y-3">
                        <span className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-purple-600" />
                          <span>+ Add Custom VIP Perk</span>
                        </span>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customPerkInput}
                            onChange={(e) => setCustomPerkInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (customPerkInput.trim()) {
                                  if (!planFormPerks.includes(customPerkInput.trim())) {
                                    setPlanFormPerks([...planFormPerks, customPerkInput.trim()]);
                                  }
                                  setCustomPerkInput("");
                                }
                              }
                            }}
                            placeholder="e.g. Free Annual Water TDS Test Kit or 24/7 Dedicated Support Line"
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              if (customPerkInput.trim()) {
                                if (!planFormPerks.includes(customPerkInput.trim())) {
                                  setPlanFormPerks([...planFormPerks, customPerkInput.trim()]);
                                }
                                setCustomPerkInput("");
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            Add Perk
                          </button>
                        </div>

                        {/* Selected Perks List */}
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Active Perks List ({planFormPerks.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {planFormPerks.map((p, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs font-bold shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{p}</span>
                                <button
                                  type="button"
                                  onClick={() => setPlanFormPerks(planFormPerks.filter((pk) => pk !== p))}
                                  className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: CUSTOM COLORS & LIVE PREVIEW */}
                  {planWizardStep === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      {/* Left: Color Controls */}
                      <div className="space-y-5">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Custom Color Theme & Gradient Palette
                          </h4>
                          <p className="text-xs text-slate-500">
                            Choose a preset theme or pick custom hex gradient colors.
                          </p>
                        </div>

                        {/* Presets */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Quick Preset Themes
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {THEME_COLOR_OPTIONS.map((opt) => {
                              const isSelected = !isUsingCustomColors && planFormColorTheme === opt.theme;
                              return (
                                <button
                                  key={opt.name}
                                  type="button"
                                  onClick={() => {
                                    setIsUsingCustomColors(false);
                                    setPlanFormColorTheme(opt.theme);
                                  }}
                                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-purple-600 ring-2 ring-purple-500/30 bg-purple-50 dark:bg-purple-950/60 font-bold"
                                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full ${opt.preview} shrink-0 shadow-xs`} />
                                  <span className="text-xs truncate">{opt.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Picker */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Palette className="w-4 h-4 text-purple-600" />
                              <span>Custom Gradient Color Picker</span>
                            </span>

                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isUsingCustomColors}
                                onChange={(e) => setIsUsingCustomColors(e.target.checked)}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                              />
                              <span>Enable Custom Picker</span>
                            </label>
                          </div>

                          {isUsingCustomColors && (
                            <div className="grid grid-cols-2 gap-4 pt-1">
                              <div>
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                  Primary Start Color
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={customPrimaryColor}
                                    onChange={(e) => setCustomPrimaryColor(e.target.value)}
                                    className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={customPrimaryColor}
                                    onChange={(e) => setCustomPrimaryColor(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                  Secondary End Color
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={customSecondaryColor}
                                    onChange={(e) => setCustomSecondaryColor(e.target.value)}
                                    className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={customSecondaryColor}
                                    onChange={(e) => setCustomSecondaryColor(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Real-time Live Tier Card Preview */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                          Real-Time Customer App Live Preview
                        </span>

                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xl">
                          <div
                            className={`p-6 text-white space-y-3 relative ${
                              !isUsingCustomColors ? `bg-gradient-to-br ${planFormColorTheme}` : ""
                            }`}
                            style={
                              isUsingCustomColors
                                ? { background: `linear-gradient(135deg, ${customPrimaryColor}, ${customSecondaryColor})` }
                                : {}
                            }
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-300" />
                                {planFormBadge || "VIP Plan"}
                              </span>
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-500/30 text-emerald-200 border border-emerald-400/50">
                                🟢 LIVE PREVIEW
                              </span>
                            </div>

                            <div>
                              <h3 className="text-xl font-black text-white">{planFormName || "HelpMate Membership"}</h3>
                              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{planFormTagline || "VIP Pass"}</p>
                            </div>

                            <div className="flex items-baseline gap-2 pt-1">
                              <span className="text-3xl font-black text-white">₹{planFormPrice}</span>
                              <span className="text-sm line-through text-slate-300">₹{planFormOrigPrice}</span>
                              <span className="text-xs text-white font-bold">/ {planFormBillingCycle}</span>
                            </div>
                          </div>

                          <div className="p-5 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/40">
                                <span className="text-[10px] text-slate-400 block font-bold">Discount</span>
                                <span className="font-extrabold text-purple-600 dark:text-purple-400 text-sm">{planFormDiscount}% OFF</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40">
                                <span className="text-[10px] text-slate-400 block font-bold font-mono">Free Quota</span>
                                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">{planFormFreeQuota} Free Jobs</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Covered Services ({planFormIncludedServices.length})</span>
                              <div className="flex flex-wrap gap-1">
                                {planFormIncludedServices.slice(0, 4).map((rule, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                    <span>{rule.serviceTitle}</span>
                                    <span className="px-1 py-0.2 bg-purple-200 dark:bg-purple-900 rounded text-[9px] font-black">
                                      {rule.benefitType === "Free"
                                        ? "FREE"
                                        : rule.benefitType === "PercentDiscount"
                                        ? `${rule.discountPercent}% OFF`
                                        : `₹${rule.discountAmount} OFF`}
                                    </span>
                                  </span>
                                ))}
                                {planFormIncludedServices.length > 4 && (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                                    +{planFormIncludedServices.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Fixed Footer with Controls */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between">
                {/* Left: Previous Step (Secondary Button) */}
                <button
                  type="button"
                  disabled={planWizardStep === 1}
                  onClick={() => setPlanWizardStep((prev) => (prev > 1 ? (prev - 1) as any : 1))}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    planWizardStep === 1
                      ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  ← Previous Step
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlanDrawerOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </button>

                  {/* STRICT AGENTS.md RULE: STRICTLY ONLY ONE PRIMARY BUTTON PER VIEW */}
                  {planWizardStep < 4 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPlanWizardStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : 4));
                      }}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-lux cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Next: {planWizardStep === 1 ? "Service Selection" : planWizardStep === 2 ? "VIP Perks" : "Colors & Preview"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      form="plan-drawer-form"
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-lux cursor-pointer flex items-center gap-1.5"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Save Membership Tier</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* SLIDE-OVER DRAWER 2: ADD FREE SERVICE OFFER */}
      {isFreeServiceDrawerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex justify-end">
            <div className="absolute inset-0" onClick={() => setIsFreeServiceDrawerOpen(false)} />
            <div className="relative max-w-lg w-full h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 z-10 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      Complimentary Free Service
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      Add Free Service Offer Rule
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFreeServiceDrawerOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form id="free-drawer-form" onSubmit={handleSaveFreeServiceDrawer} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Service Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AC Jet Cleaning Service"
                      value={freeTitle}
                      onChange={(e) => setFreeTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={freeCategory}
                      onChange={(e) => setFreeCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Retail Unit Value (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={freeValue}
                        onChange={(e) => setFreeValue(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Annual Quota per Member
                      </label>
                      <input
                        type="number"
                        required
                        value={freeQuota}
                        onChange={(e) => setFreeQuota(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFreeServiceDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>

                {/* SINGLE PRIMARY BUTTON IN DRAWER ACCORDING TO RULE */}
                <button
                  type="submit"
                  form="free-drawer-form"
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-lux cursor-pointer"
                >
                  Save Free Service Rule
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
