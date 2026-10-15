"use client";

import { useState, useEffect, useRef } from "react";
import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh, clearModuleCache } from "@/lib/moduleCache";
import {
  Plus,
  Camera,
  Flame,
  Search,
  MapPin,
  Zap,
  Sparkles,
  Layers,
} from "lucide-react";

import {
  TabType,
  ZoneCard,
  TrendingServiceCard,
  SpotlightBanner,
  CategorySectionData,
  initialSpotlightBanners,
  initialCategorySections,
} from "@/components/image-sections/types";

import { WhereWeServeSection } from "@/components/image-sections/WhereWeServeSection";
import { TrendingServicesSection } from "@/components/image-sections/TrendingServicesSection";
import { QuickServicesSection } from "@/components/image-sections/QuickServicesSection";
import { SpotlightSection } from "@/components/image-sections/SpotlightSection";
import { CategoryServiceSections } from "@/components/image-sections/CategoryServiceSections";
import { CatalogPickerModal } from "@/components/image-sections/CatalogPickerModal";
import { DeleteConfirmModal } from "@/components/image-sections/DeleteConfirmModal";

import {
  getAdminTrendingPackagesApi,
  getTrendingCatalogPackagesApi,
  addTrendingPackageApi,
  removeTrendingPackageApi,
  ApiTrendingPackage,
  ApiTrendingCatalogItem,
  getAdminQuickServicesApi,
  updateAdminQuickServicesApi,
  ApiQuickServiceItem,
  getWebsiteZonesApi,
  deleteWebsiteZoneApi,
  ApiWebsiteZone,
  getCategoriesApi,
  ApiCategory,
  formatImageUrl,
  getAdminSpotlightApi,
  deleteSpotlightApi,
} from "@/lib/api";

export default function ImageSectionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("zones");
  const [searchQuery, setSearchQuery] = useState("");

  const initialCachedZones = getStoredModuleData<ZoneCard[]>("website_zones") || [];
  const initialCachedTrending = getStoredModuleData<TrendingServiceCard[]>("website_trending") || [];
  const initialCachedQuick = getStoredModuleData<TrendingServiceCard[]>("website_quick") || [];
  const initialCachedSpotlight = getStoredModuleData<SpotlightBanner[]>("website_spotlight") || initialSpotlightBanners;
  const initialCachedCategories = getStoredModuleData<ApiCategory[]>("website_categories") || [];

  // Server-safe initial states (rehydrated in useEffect from localStorage / cache)
  const [zones, setZones] = useState<ZoneCard[]>(() => initialCachedZones);
  const [trendingServices, setTrendingServices] = useState<TrendingServiceCard[]>(() => initialCachedTrending);
  const [quickServices, setQuickServices] = useState<TrendingServiceCard[]>(() => initialCachedQuick);
  const [spotlightBanners, setSpotlightBanners] = useState<SpotlightBanner[]>(() => initialCachedSpotlight);
  const [categorySections, setCategorySections] = useState<CategorySectionData[]>(initialCategorySections);

  // Loading states
  const [isZonesLoading, setIsZonesLoading] = useState(() => !(isModuleCacheFresh("website_zones", 30000) && initialCachedZones.length > 0));
  const [isTrendingLoading, setIsTrendingLoading] = useState(() => !(isModuleCacheFresh("website_trending", 30000) && initialCachedTrending.length > 0));
  const [isQuickLoading, setIsQuickLoading] = useState(() => !(isModuleCacheFresh("website_quick", 30000) && initialCachedQuick.length > 0));
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  // Categories & Catalog data
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>(() => initialCachedCategories);
  const [catalogPackages, setCatalogPackages] = useState<ApiTrendingCatalogItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [targetCatalogSectionId, setTargetCatalogSectionId] = useState<string | null>(null);

  // Triggers for Add modals from top bar
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [isAddSpotlightModalOpen, setIsAddSpotlightModalOpen] = useState(false);
  const [isAddCategorySectionModalOpen, setIsAddCategorySectionModalOpen] = useState(false);

  // Shared Delete Confirm Modal
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: string;
    type: TabType;
    name: string;
    sectionId?: string;
  } | null>(null);

  // Rehydrate localStorage & cached module data safely on client mount
  useEffect(() => {
    try {
      const storedCat = localStorage.getItem("helpmate_admin_website_category_sections");
      if (storedCat) {
        const parsed = JSON.parse(storedCat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategorySections(parsed);
        }
      }
    } catch (e) {}

    try {
      const storedSpotlight = localStorage.getItem("helpmate_admin_website_spotlight");
      if (storedSpotlight) {
        const parsed = JSON.parse(storedSpotlight);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSpotlightBanners(parsed);
        }
      }
    } catch (e) {}

    // Initial API fetches — only call if not fresh in cache!
    if (!isModuleCacheFresh("website_zones", 30000) || initialCachedZones.length === 0) fetchZones();
    if (!isModuleCacheFresh("website_trending", 30000) || initialCachedTrending.length === 0) fetchTrendingPackages();
    if (!isModuleCacheFresh("website_quick", 30000) || initialCachedQuick.length === 0) fetchQuickServices();
    if (!isModuleCacheFresh("website_categories", 30000) || initialCachedCategories.length === 0) fetchCategories();
    if (!isModuleCacheFresh("website_spotlight", 30000)) fetchSpotlightItems();
  }, []);

  // Fetch data on active tab switch
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (activeTab === "zones") {
      if (!isModuleCacheFresh("website_zones", 30000)) fetchZones();
    } else if (activeTab === "trending") {
      if (!isModuleCacheFresh("website_trending", 30000)) fetchTrendingPackages();
    } else if (activeTab === "quick") {
      if (!isModuleCacheFresh("website_quick", 30000)) fetchQuickServices();
    } else if (activeTab === "spotlight") {
      if (!isModuleCacheFresh("website_spotlight", 30000)) fetchSpotlightItems();
    }
  }, [activeTab]);

  // Debounced search for catalog packages
  useEffect(() => {
    if (isCatalogPickerOpen) {
      const timer = setTimeout(() => {
        fetchCatalogPackages(catalogSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCatalogPickerOpen, catalogSearch]);

  const fetchSpotlightItems = async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("website_spotlight", 30000)) {
      const cached = getStoredModuleData<SpotlightBanner[]>("website_spotlight");
      if (cached && cached.length > 0) {
        setSpotlightBanners(cached);
        return;
      }
    }
    try {
      const res = await getAdminSpotlightApi(force);
      if (res && res.success && Array.isArray(res.data)) {
        const badgeColors: Record<string, string> = {
          "new-launch": "#801C6E",
          "best-seller": "#B45309",
          "summer-special": "#0284C7",
        };
        const mapped: SpotlightBanner[] = res.data.map((item: any, index: number) => {
          const pkg = typeof item.packageId === "object" ? item.packageId : null;
          const pkgId = pkg?._id || (typeof item.packageId === "string" ? item.packageId : "");
          const pkgImg = pkg?.imageUrl || pkg?.thumbnailUrl || "";
          const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/api\/?$/, "");
          const resolvedImageUrl =
            formatImageUrl(pkgImg, pkgId) ||
            (pkgId && apiOrigin ? `${apiOrigin}/api/media/package/${pkgId}/image` : "");
          const cleanDesc = (pkg?.description || "")
            .replace(/<[^>]*>/g, "")
            .replace(/\n+/g, " • ")
            .trim();

          return {
            id: item._id,
            packageId: pkgId,
            badge: item.badge || "new-launch",
            badgeBg: badgeColors[item.badge] || "#801C6E",
            title: pkg?.packageName || "Featured Service",
            subtitle:
              pkg?.subtitle ||
              cleanDesc ||
              (pkg?.price ? `Professional doorstep service in Varanasi (₹${pkg.price})` : "Professional doorstep service in Varanasi"),
            ctaText: "Book now",
            ctaTheme: "white" as const,
            overlayGradient:
              "linear-gradient(90deg, #48073d 0%, #48073d 44%, rgba(72, 7, 61, 0.92) 62%, rgba(72, 7, 61, 0) 100%)",
            image: resolvedImageUrl,
            targetUrl: pkgId ? `/services?package=${pkgId}` : "/services",
            isActive: item.status ?? true,
            sortOrder: item.displayOrder ?? index + 1,
            packageName: pkg?.packageName || "",
            price: typeof pkg?.price === "number" ? pkg.price : Number(pkg?.price) || undefined,
            originalPrice: typeof pkg?.originalPrice === "number" ? pkg.originalPrice : Number(pkg?.originalPrice) || undefined,
            duration: typeof pkg?.duration === "number" ? pkg.duration : Number(pkg?.duration) || undefined,
            description: cleanDesc,
            imageUrl: resolvedImageUrl,
            thumbnailUrl: pkg?.thumbnailUrl || "",
          };
        });
        setSpotlightBanners(mapped);
        setCachedModuleData("website_spotlight", mapped);
      }
    } catch (err) {
      console.error("Failed to fetch spotlight items:", err);
    }
  };

  const fetchCategories = async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("website_categories", 30000)) {
      const cached = getStoredModuleData<ApiCategory[]>("website_categories");
      if (cached && cached.length > 0) {
        setApiCategories(cached);
        return;
      }
    }
    setIsCategoriesLoading(true);
    try {
      const res = await getCategoriesApi({ limit: 100, forceRefresh: force });
      if (res && res.success && Array.isArray(res.data)) {
        setApiCategories(res.data);
        setCachedModuleData("website_categories", res.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const fetchZones = async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("website_zones", 30000)) {
      const cached = getStoredModuleData<ZoneCard[]>("website_zones");
      if (cached && cached.length > 0) {
        setZones(cached);
        setIsZonesLoading(false);
        return;
      }
    }
    if (zones.length === 0 && (!initialCachedZones || initialCachedZones.length === 0)) {
      setIsZonesLoading(true);
    }
    try {
      const res = await getWebsiteZonesApi({ forceRefresh: force });
      if (res && res.success && Array.isArray(res.data)) {
        const mapped: ZoneCard[] = res.data.map((item: ApiWebsiteZone, index: number) => ({
          id: item._id,
          name: item.zoneName,
          city: item.city,
          proCount: item.proCount || 0,
          imageUrl: formatImageUrl(item.imageUrl) || "",
          isActive: item.status ?? true,
          areas: item.areasCovered || [],
          sortOrder: item.sortOrder ?? index + 1,
        }));
        setZones(mapped);
        setCachedModuleData("website_zones", mapped);
      }
    } catch (err) {
      console.error("Failed to fetch website zones:", err);
    } finally {
      setIsZonesLoading(false);
    }
  };

  const fetchTrendingPackages = async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("website_trending", 30000)) {
      const cached = getStoredModuleData<TrendingServiceCard[]>("website_trending");
      if (cached && cached.length > 0) {
        setTrendingServices(cached);
        setIsTrendingLoading(false);
        return;
      }
    }
    if (trendingServices.length === 0 && (!initialCachedTrending || initialCachedTrending.length === 0)) {
      setIsTrendingLoading(true);
    }
    try {
      const res = await getAdminTrendingPackagesApi(force);
      if (res && res.success && Array.isArray(res.data)) {
        const mapped: TrendingServiceCard[] = res.data.map((item: ApiTrendingPackage, index: number) => {
          const pkg = typeof item.packageId === "object" ? item.packageId : null;
          const pkgId = pkg ? pkg._id : (typeof item.packageId === "string" ? item.packageId : item._id);
          const originalPrice = pkg?.originalPrice ?? 0;
          const price = pkg?.price ?? 0;
          const discountPercentage =
            originalPrice > price && originalPrice > 0
              ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`
              : "BESTSELLER";

          return {
            id: item._id,
            packageId: pkgId,
            title: pkg?.packageName || "Trending Package",
            category: pkg?.subtitle || "Trending Service",
            durationMins: pkg?.duration || 60,
            rating: 4.9,
            reviewsCount: 120,
            description: pkg?.description || pkg?.subtitle || "",
            discountPercentage,
            price: String(price),
            originalPrice: String(originalPrice),
            imageUrl:
              formatImageUrl(pkg?.imageUrl || pkg?.thumbnailUrl, pkgId) ||
              (pkgId ? `/api/media/package/${pkgId}/image` : ""),
            bookCtaText: "Book Now →",
            bookCtaLink: "/services",
            isActive: item.status ?? true,
            sortOrder: item.displayOrder ?? index + 1,
          };
        });
        setTrendingServices(mapped);
        setCachedModuleData("website_trending", mapped);
      }
    } catch (err) {
      console.error("Failed to fetch trending packages:", err);
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const fetchCatalogPackages = async (search: string = "") => {
    setIsCatalogLoading(true);
    try {
      const res = await getTrendingCatalogPackagesApi({ search, limit: 50 });
      if (res && res.success && Array.isArray(res.data)) {
        setCatalogPackages(res.data);
      } else {
        setCatalogPackages([]);
      }
    } catch (err) {
      console.error("Failed to fetch catalog packages:", err);
      setCatalogPackages([]);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const fetchQuickServices = async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("website_quick", 30000)) {
      const cached = getStoredModuleData<TrendingServiceCard[]>("website_quick");
      if (cached && cached.length > 0) {
        setQuickServices(cached);
        setIsQuickLoading(false);
        return;
      }
    }
    if (quickServices.length === 0 && (!initialCachedQuick || initialCachedQuick.length === 0)) {
      setIsQuickLoading(true);
    }
    try {
      const res = await getAdminQuickServicesApi(force);
      if (res && res.success && Array.isArray(res.data)) {
        let catalogList: ApiTrendingCatalogItem[] = catalogPackages;
        if (!catalogList || catalogList.length === 0) {
          const catRes = await getTrendingCatalogPackagesApi({ limit: 100 });
          if (catRes && catRes.success && Array.isArray(catRes.data)) {
            catalogList = catRes.data;
            setCatalogPackages(catRes.data);
          }
        }
        const catalogMap = new Map((catalogList || []).map((c) => [c.packageId, c]));

        const mapped: TrendingServiceCard[] = res.data.slice(0, 6).map((item: ApiQuickServiceItem, index: number) => {
          const pkgId = item.packageId || item._id || (item as any).id;
          const catItem = catalogMap.get(pkgId);
          const originalPrice = item.originalPrice || catItem?.originalPrice || item.price || 0;
          const price = item.price || 0;
          const discountPercentage =
            originalPrice > price && originalPrice > 0
              ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`
              : "EXPRESS";

          return {
            id: pkgId,
            packageId: pkgId,
            title: item.packageName || catItem?.packageName || "Quick Service",
            category:
              (typeof item.serviceActionId === "object" && item.serviceActionId?.name) ||
              catItem?.category?.name ||
              "Quick Service",
            durationMins: item.duration || catItem?.duration || 30,
            rating: 4.9,
            reviewsCount: 100,
            description:
              item.description ||
              catItem?.description ||
              `Express 15-30 min doorstep service for ${
                item.packageName || catItem?.packageName || "this package"
              }.`,
            discountPercentage,
            price: String(price),
            originalPrice: String(originalPrice),
            imageUrl:
              formatImageUrl(item.imageUrl || catItem?.imageUrl || catItem?.thumbnailUrl, pkgId) ||
              (pkgId ? `/api/media/package/${pkgId}/image` : ""),
            bookCtaText: "Book Now →",
            bookCtaLink: "/services",
            isActive: true,
            sortOrder: index + 1,
          };
        });
        setQuickServices(mapped);
        setCachedModuleData("website_quick", mapped);
      }
    } catch (err) {
      console.error("Failed to fetch quick services:", err);
    } finally {
      setIsQuickLoading(false);
    }
  };

  const handleAddPackageToTrending = async (packageId: string) => {
    try {
      const res = await addTrendingPackageApi(packageId);
      if (res && res.success) {
        await fetchTrendingPackages();
      } else {
        alert(res?.message || "Failed to add package to trending.");
      }
    } catch (err) {
      console.error("Error adding package to trending:", err);
    }
  };

  const handleRemovePackageFromTrending = async (packageId: string) => {
    try {
      const res = await removeTrendingPackageApi(packageId);
      if (res && res.success) {
        await fetchTrendingPackages();
      } else {
        alert(res?.message || "Failed to remove package from trending.");
      }
    } catch (err) {
      console.error("Error removing package from trending:", err);
    }
  };

  const handleAddPackageToQuickServices = async (catItem: ApiTrendingCatalogItem) => {
    const currentPkgIds = quickServices.map((q) => q.packageId || q.id).filter(Boolean);
    if (currentPkgIds.includes(catItem.packageId)) return;
    if (currentPkgIds.length >= 6) {
      alert("Maximum 6 quick services are allowed. Please remove a service to add a new one.");
      return;
    }

    try {
      const updatedIds = [...currentPkgIds, catItem.packageId].slice(0, 6);
      const res = await updateAdminQuickServicesApi(updatedIds);
      if (res && res.success) {
        await fetchQuickServices();
      } else {
        alert(res?.message || "Failed to add package to quick services.");
      }
    } catch (err) {
      console.error("Error adding package to quick services:", err);
    }
  };

  const handleRemovePackageFromQuickServices = async (packageId: string) => {
    try {
      const currentPkgIds = quickServices
        .map((q) => q.packageId || q.id)
        .filter((id) => id && id !== packageId);
      const res = await updateAdminQuickServicesApi(currentPkgIds);
      if (res && res.success) {
        await fetchQuickServices();
      } else {
        alert(res?.message || "Failed to remove package from quick services.");
      }
    } catch (err) {
      console.error("Error removing package from quick services:", err);
    }
  };

  const updateSpotlightBannersState = (updater: (prev: SpotlightBanner[]) => SpotlightBanner[]) => {
    setSpotlightBanners((prev) => {
      const updated = updater(prev);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("helpmate_admin_website_spotlight", JSON.stringify(updated));
        } catch (e) {}
      }
      setCachedModuleData("website_spotlight", updated);
      return updated;
    });
  };

  const updateCategorySectionsState = (
    updater: (prev: CategorySectionData[]) => CategorySectionData[]
  ) => {
    setCategorySections((prev) => {
      const updated = updater(prev);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("helpmate_admin_website_category_sections", JSON.stringify(updated));
        } catch (e) {}
      }
      setCachedModuleData("website_category_sections", updated);
      return updated;
    });
  };

  const handleAddPackageToCategorySection = (catItem: ApiTrendingCatalogItem) => {
    if (!targetCatalogSectionId) return;
    updateCategorySectionsState((prev) =>
      prev.map((sec) => {
        if (sec.id === targetCatalogSectionId) {
          if (sec.services.some((s) => s.id === catItem.packageId)) {
            alert("This service is already in this section.");
            return sec;
          }
          return {
            ...sec,
            services: [
              ...sec.services,
              {
                id: catItem.packageId,
                title: catItem.packageName,
                image: formatImageUrl(catItem.imageUrl || catItem.thumbnailUrl),
                targetUrl: `/services?item=${catItem.packageId}`,
              },
            ],
          };
        }
        return sec;
      })
    );
  };

  const handleRemovePackageFromCategorySection = (sectionId: string, packageId: string) => {
    updateCategorySectionsState((prev) =>
      prev.map((sec) =>
        sec.id === sectionId
          ? { ...sec, services: sec.services.filter((s) => s.id !== packageId) }
          : sec
      )
    );
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    if (deleteModal.type === "zones") {
      try {
        const res = await deleteWebsiteZoneApi(deleteModal.id);
        if (res && res.success) {
          await fetchZones();
        } else {
          alert(res?.message || "Failed to delete zone.");
        }
      } catch (err) {
        console.error("Error deleting zone:", err);
      }
    }
    if (deleteModal.type === "trending") {
      const item = trendingServices.find(
        (t) => t.id === deleteModal.id || t.packageId === deleteModal.id
      );
      const targetPkgId = item?.packageId || deleteModal.id;
      await handleRemovePackageFromTrending(targetPkgId);
    }
    if (deleteModal.type === "quick") {
      const item = quickServices.find(
        (q) => q.id === deleteModal.id || q.packageId === deleteModal.id
      );
      const targetPkgId = item?.packageId || deleteModal.id;
      await handleRemovePackageFromQuickServices(targetPkgId);
    }
    if (deleteModal.type === "spotlight") {
      try {
        await deleteSpotlightApi(deleteModal.id);
        updateSpotlightBannersState((prev) => prev.filter((b) => b.id !== deleteModal.id));
      } catch (e) {
        console.error("Failed to delete spotlight item:", e);
      }
    }
    if (deleteModal.type === "categorySections") {
      if (deleteModal.sectionId) {
        updateCategorySectionsState((prev) =>
          prev.map((sec) =>
            sec.id === deleteModal.sectionId
              ? { ...sec, services: sec.services.filter((s) => s.id !== deleteModal.id) }
              : sec
          )
        );
      } else {
        updateCategorySectionsState((prev) => prev.filter((sec) => sec.id !== deleteModal.id));
      }
    }
    setDeleteModal(null);
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { id: "zones", label: "Where We Serve (Zones)", icon: MapPin, count: zones.length },
    { id: "trending", label: "Trending Best Sellers", icon: Flame, count: trendingServices.length },
    { id: "quick", label: "Quick Services", icon: Zap, count: quickServices.length },
    { id: "spotlight", label: "In the Spotlight", icon: Sparkles, count: spotlightBanners.length },
    { id: "categorySections", label: "Category Service Sliders", icon: Layers, count: categorySections.length },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Camera className="w-6 h-6 text-brand-600" />
            <span>Website Sections CMS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage neighborhood zones, trending best-sellers, quick services, spotlight banners, and category sliders.
          </p>
        </div>
      </div>

      {/* Tab Nav + Search + Top Add Action Button */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-x-auto no-scrollbar flex-nowrap w-full xl:w-auto shrink-0 scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-brand-600 text-white shadow-md font-black"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span
                  suppressHydrationWarning
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                    active ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end">
          <div className="relative flex-1 xl:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 w-full sm:w-56 xl:w-44"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (activeTab === "zones") setIsAddZoneModalOpen(true);
              else if (activeTab === "spotlight") setIsAddSpotlightModalOpen(true);
              else if (activeTab === "categorySections") setIsAddCategorySectionModalOpen(true);
              else setIsCatalogPickerOpen(true);
            }}
            disabled={activeTab === "quick" && quickServices.length >= 6}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs transition-colors shrink-0 whitespace-nowrap ${
              activeTab === "quick" && quickServices.length >= 6
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                : "bg-brand-600 hover:bg-brand-700 text-white cursor-pointer shadow-sm"
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {activeTab === "zones"
                ? "Add Zone"
                : activeTab === "spotlight"
                ? "Add Spotlight Banner"
                : activeTab === "categorySections"
                ? "Add Category Section"
                : activeTab === "quick"
                ? quickServices.length >= 6
                  ? "Max 6 Slots Filled"
                  : "Select Quick Service"
                : "Select Service from Catalog"}
            </span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 1: WHERE WE SERVE (NEIGHBORHOOD ZONES) ─── */}
      {activeTab === "zones" && (
        <WhereWeServeSection
          zones={zones}
          searchQuery={searchQuery}
          isZonesLoading={isZonesLoading}
          fetchZones={fetchZones}
          onRequestDelete={(id, name) =>
            setDeleteModal({ open: true, id, type: "zones", name })
          }
          isAddModalOpen={isAddZoneModalOpen}
          onCloseAddModal={() => setIsAddZoneModalOpen(false)}
        />
      )}

      {/* ─── SECTION 2: TRENDING SERVICES (BEST SELLERS) ─── */}
      {activeTab === "trending" && (
        <TrendingServicesSection
          trendingServices={trendingServices}
          searchQuery={searchQuery}
          isTrendingLoading={isTrendingLoading}
          onUpdateTrendingServices={(updater) => {
            setTrendingServices((prev) => {
              const updated = updater(prev);
              setCachedModuleData("website_trending", updated);
              return updated;
            });
          }}
          onRequestDelete={(id, name) =>
            setDeleteModal({ open: true, id, type: "trending", name })
          }
          onOpenCatalogPicker={() => setIsCatalogPickerOpen(true)}
        />
      )}

      {/* ─── SECTION 3: QUICK SERVICES ─── */}
      {activeTab === "quick" && (
        <QuickServicesSection
          quickServices={quickServices}
          searchQuery={searchQuery}
          isQuickLoading={isQuickLoading}
          onRequestDelete={(id, name) =>
            setDeleteModal({ open: true, id, type: "quick", name })
          }
          onOpenCatalogPicker={() => setIsCatalogPickerOpen(true)}
        />
      )}

      {/* ─── SECTION 4: IN THE SPOTLIGHT ─── */}
      {activeTab === "spotlight" && (
        <SpotlightSection
          spotlightBanners={spotlightBanners}
          searchQuery={searchQuery}
          onUpdateSpotlightBanners={updateSpotlightBannersState}
          onRefreshSpotlight={fetchSpotlightItems}
          onRequestDelete={(id, name) =>
            setDeleteModal({ open: true, id, type: "spotlight", name })
          }
          isAddModalOpen={isAddSpotlightModalOpen}
          onCloseAddModal={() => setIsAddSpotlightModalOpen(false)}
          catalogPackages={catalogPackages}
        />
      )}

      {/* ─── SECTION 5: CATEGORY SERVICE SECTIONS ─── */}
      {activeTab === "categorySections" && (
        <CategoryServiceSections
          categorySections={categorySections}
          searchQuery={searchQuery}
          apiCategories={apiCategories}
          isCategoriesLoading={isCategoriesLoading}
          fetchCategories={fetchCategories}
          catalogPackages={catalogPackages}
          onUpdateCategorySections={updateCategorySectionsState}
          onRequestDelete={(id, name, sectionId) =>
            setDeleteModal({
              open: true,
              id,
              type: "categorySections",
              name,
              sectionId,
            })
          }
          onOpenCatalogPickerForSection={(sectionId) => {
            setTargetCatalogSectionId(sectionId);
            setIsCatalogPickerOpen(true);
          }}
          isAddSectionModalOpen={isAddCategorySectionModalOpen}
          onCloseAddSectionModal={() => setIsAddCategorySectionModalOpen(false)}
        />
      )}

      {/* ─── SHARED CATALOG PICKER MODAL ─── */}
      <CatalogPickerModal
        isOpen={isCatalogPickerOpen}
        onClose={() => {
          setIsCatalogPickerOpen(false);
          setTargetCatalogSectionId(null);
        }}
        activeTab={activeTab}
        targetCatalogSectionId={targetCatalogSectionId}
        quickServices={quickServices}
        trendingServices={trendingServices}
        categorySections={categorySections}
        catalogPackages={catalogPackages}
        isCatalogLoading={isCatalogLoading}
        catalogSearch={catalogSearch}
        setCatalogSearch={setCatalogSearch}
        onAddTrending={handleAddPackageToTrending}
        onRemoveTrending={handleRemovePackageFromTrending}
        onAddQuick={handleAddPackageToQuickServices}
        onRemoveQuick={handleRemovePackageFromQuickServices}
        onAddCategorySectionPackage={handleAddPackageToCategorySection}
        onRemoveCategorySectionPackage={handleRemovePackageFromCategorySection}
      />

      {/* ─── SHARED DELETE CONFIRMATION MODAL ─── */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteModal?.open)}
        name={deleteModal?.name || ""}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
