"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  GripVertical,
  MoveUp,
  MoveDown,
  Check,
  ExternalLink,
  Search,
  ChevronDown,
  Tag,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import {
  SpotlightBanner,
  SpotlightHeader,
  GRADIENT_PRESETS,
  BADGE_COLOR_PRESETS,
  initialSpotlightHeader,
} from "./types";
import { SectionCardImage } from "./SectionCardImage";
import {
  ApiPackageItem,
  getPackagesApi,
  spotlightBadges,
  createSpotlightApi,
  updateSpotlightApi,
  formatImageUrl,
} from "@/lib/api";

interface SpotlightSectionProps {
  spotlightBanners: SpotlightBanner[];
  searchQuery: string;
  onUpdateSpotlightBanners: (
    updater: (prev: SpotlightBanner[]) => SpotlightBanner[]
  ) => void;
  onRequestDelete: (id: string, name: string) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  catalogPackages?: any[];
  onRefreshSpotlight?: () => Promise<void>;
}

export function SpotlightSection({
  spotlightBanners,
  searchQuery,
  onUpdateSpotlightBanners,
  onRequestDelete,
  isAddModalOpen = false,
  onCloseAddModal,
  catalogPackages,
  onRefreshSpotlight,
}: SpotlightSectionProps) {
  const [spotlightHeader, setSpotlightHeader] = useState<SpotlightHeader>(
    initialSpotlightHeader
  );
  const [editingSpotlightHeader, setEditingSpotlightHeader] = useState(false);
  const [spotlightHeaderDraft, setSpotlightHeaderDraft] =
    useState<SpotlightHeader>(initialSpotlightHeader);

  const [previewSpotlight, setPreviewSpotlight] = useState<SpotlightBanner | null>(
    null
  );

  // Available packages for the searchable dropdown fetched from /api/package?limit=100
  const [availablePackages, setAvailablePackages] = useState<ApiPackageItem[]>([]);
  const [isPackagesLoading, setIsPackagesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<ApiPackageItem | null>(null);
  const packageDropdownRef = useRef<HTMLDivElement>(null);

  const [spotlightModal, setSpotlightModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: Partial<SpotlightBanner>;
  }>({
    open: false,
    mode: "add",
    data: {},
  });

  // Fetch packages from /api/package?limit=100
  const fetchPackages = async (search: string = "") => {
    setIsPackagesLoading(true);
    try {
      const res = await getPackagesApi({ search: search.trim() || undefined, limit: 100 });
      if (res && res.success && Array.isArray(res.data)) {
        if (!search.trim()) {
          setAvailablePackages(res.data);
        } else {
          setAvailablePackages((prev) => {
            const map = new Map<string, ApiPackageItem>();
            prev.forEach((p) => map.set(p._id || p.packageId || "", p));
            res.data.forEach((p: ApiPackageItem) => map.set(p._id || p.packageId || "", p));
            return Array.from(map.values());
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch packages from /api/package:", err);
    } finally {
      setIsPackagesLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Debounced remote search when user types in the dropdown search box
  useEffect(() => {
    if (!packageDropdownOpen || !packageSearch.trim()) return;
    const timer = setTimeout(() => {
      fetchPackages(packageSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [packageSearch, packageDropdownOpen]);

  // Close package dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        packageDropdownRef.current &&
        !packageDropdownRef.current.contains(event.target as Node)
      ) {
        setPackageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync selectedPackage when editing if packages finish loading afterwards
  useEffect(() => {
    if (spotlightModal.open && !selectedPackage && availablePackages.length > 0) {
      const banner = spotlightModal.data;
      const matched = availablePackages.find(
        (p) =>
          (banner.packageId && (p._id === banner.packageId || p.packageId === banner.packageId)) ||
          (banner.title && p.packageName && p.packageName.toLowerCase() === banner.title.toLowerCase())
      );
      if (matched) {
        setSelectedPackage(matched);
      }
    }
  }, [spotlightModal.open, availablePackages, selectedPackage, spotlightModal.data]);

  const handleOpenAddModal = () => {
    setSelectedPackage(null);
    setPackageSearch("");
    setPackageDropdownOpen(false);
    if (availablePackages.length === 0) {
      fetchPackages();
    }
    setSpotlightModal({
      open: true,
      mode: "add",
      data: {
        badge: "new-launch",
        badgeBg: "#801C6E",
        ctaText: "Book now",
        ctaTheme: "white",
        overlayGradient: GRADIENT_PRESETS[0].value,
        isActive: true,
        sortOrder: spotlightBanners.length + 1,
      },
    });
  };

  const handleOpenEditModal = (banner: SpotlightBanner) => {
    const matched = availablePackages.find(
      (p) =>
        (banner.packageId && (p._id === banner.packageId || p.packageId === banner.packageId)) ||
        (banner.title && p.packageName && p.packageName.toLowerCase() === banner.title.toLowerCase())
    );
    setSelectedPackage(matched || null);
    setPackageSearch("");
    setPackageDropdownOpen(false);
    if (availablePackages.length === 0) {
      fetchPackages();
    }
    setSpotlightModal({
      open: true,
      mode: "edit",
      data: {
        ...banner,
        badge: banner.badge || "new-launch",
      },
    });
  };

  const handleSelectPackage = (pkg: ApiPackageItem) => {
    const pkgId = pkg._id || pkg.packageId || "";
    setSelectedPackage(pkg);

    const serviceName =
      (typeof pkg.serviceActionId === "object" && pkg.serviceActionId?.serviceAction) ||
      (typeof pkg.serviceActionId === "object" && (pkg.serviceActionId as any)?.name) ||
      pkg.serviceAction?.name ||
      pkg.category?.name ||
      "";

    const subtitleText =
      pkg.subtitle ||
      pkg.description ||
      (serviceName
        ? `Professional doorstep ${serviceName} in Varanasi (₹${pkg.price})`
        : `Doorstep service starting at ₹${pkg.price}`);

    const pkgImg = pkg.imageUrl || pkg.thumbnailUrl || "";

    setSpotlightModal((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        packageId: pkgId,
        title: pkg.packageName,
        subtitle: subtitleText,
        image: formatImageUrl(pkgImg, pkgId) || "",
        targetUrl: `/services?package=${pkgId}`,
        ctaText: prev.data.ctaText || "Book now",
        ctaTheme: prev.data.ctaTheme || "white",
        overlayGradient: prev.data.overlayGradient || GRADIENT_PRESETS[0].value,
        packageName: pkg.packageName,
        price: typeof pkg.price === "number" ? pkg.price : Number(pkg.price) || undefined,
        originalPrice:
          typeof pkg.originalPrice === "number"
            ? pkg.originalPrice
            : Number(pkg.originalPrice) || undefined,
        duration:
          typeof pkg.duration === "number" ? pkg.duration : Number(pkg.duration) || undefined,
        description: pkg.description || "",
        imageUrl: pkg.imageUrl || "",
        thumbnailUrl: pkg.thumbnailUrl || "",
      },
    }));
  };

  // Listen for parent's top Add button trigger
  useEffect(() => {
    if (isAddModalOpen) {
      handleOpenAddModal();
      if (onCloseAddModal) {
        onCloseAddModal();
      }
    }
  }, [isAddModalOpen, spotlightBanners.length, onCloseAddModal]);

  const filteredSpotlight = spotlightBanners.filter(
    (b) =>
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.badge && b.badge.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPackages = availablePackages.filter((pkg) => {
    if (!packageSearch.trim()) return true;
    const q = packageSearch.toLowerCase().trim();
    const serviceName =
      (typeof pkg.serviceActionId === "object" && pkg.serviceActionId?.serviceAction) ||
      (typeof pkg.serviceActionId === "object" && (pkg.serviceActionId as any)?.name) ||
      pkg.serviceAction?.name ||
      pkg.category?.name ||
      "";
    return (
      (pkg.packageName && pkg.packageName.toLowerCase().includes(q)) ||
      (serviceName && serviceName.toLowerCase().includes(q)) ||
      (pkg.subtitle && pkg.subtitle.toLowerCase().includes(q)) ||
      (pkg.description && pkg.description.toLowerCase().includes(q))
    );
  });

  const saveSpotlightHeader = () => {
    setSpotlightHeader(spotlightHeaderDraft);
    setEditingSpotlightHeader(false);
  };

  const moveSpotlightBanner = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= spotlightBanners.length) return;
    const copy = [...spotlightBanners];
    const currentItem = copy[index];
    const targetItem = copy[targetIndex];

    copy[index] = targetItem;
    copy[targetIndex] = currentItem;
    const updated = copy.map((b, i) => ({ ...b, sortOrder: i + 1 }));
    onUpdateSpotlightBanners(() => updated);

    try {
      if (currentItem.id && !currentItem.id.startsWith("spotlight-")) {
        await updateSpotlightApi(currentItem.id, { displayOrder: targetIndex + 1 });
      }
      if (targetItem.id && !targetItem.id.startsWith("spotlight-")) {
        await updateSpotlightApi(targetItem.id, { displayOrder: index + 1 });
      }
    } catch (err) {
      console.error("Failed to update banner order:", err);
    }
  };

  const toggleSpotlightBanner = async (id: string) => {
    const banner = spotlightBanners.find((b) => b.id === id);
    if (!banner) return;
    const newStatus = !banner.isActive;
    onUpdateSpotlightBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: newStatus } : b))
    );
    try {
      if (id && !id.startsWith("spotlight-")) {
        await updateSpotlightApi(id, { status: newStatus });
      }
    } catch (err) {
      console.error("Failed to toggle spotlight banner status:", err);
    }
  };

  const saveSpotlightBanner = async () => {
    if (isSaving) return;
    const d = spotlightModal.data;
    if (!selectedPackage && !d.packageId) {
      alert("Please select a package for the spotlight banner.");
      return;
    }

    const pkgId = selectedPackage?._id || selectedPackage?.packageId || d.packageId;
    if (!pkgId) {
      alert("Please select a valid package.");
      return;
    }

    const badge = d.badge || "new-launch";
    const displayOrder = Number(d.sortOrder) || spotlightBanners.length + 1;
    const title = selectedPackage?.packageName || d.title || "Featured Package";
    const subtitle =
      selectedPackage?.subtitle ||
      selectedPackage?.description ||
      d.subtitle ||
      (selectedPackage ? `Special service starting at ₹${selectedPackage.price}` : "");
    const rawImage =
      selectedPackage?.imageUrl ||
      selectedPackage?.thumbnailUrl ||
      d.image ||
      "";
    const image = formatImageUrl(rawImage, pkgId) || "";
    const packageId = pkgId;
    const targetUrl = `/services?package=${packageId}`;
    const price =
      selectedPackage?.price !== undefined
        ? Number(selectedPackage.price)
        : d.price;
    const originalPrice =
      selectedPackage?.originalPrice !== undefined
        ? Number(selectedPackage.originalPrice)
        : d.originalPrice;
    const duration =
      selectedPackage?.duration !== undefined
        ? Number(selectedPackage.duration)
        : d.duration;
    const description =
      selectedPackage?.description || d.description || "";

    setIsSaving(true);
    try {
      if (spotlightModal.mode === "add") {
        const res = await createSpotlightApi({
          packageId,
          badge,
          displayOrder,
        });

        if (res && res.success) {
          const created = res.data;
          const badgePresetColors: Record<string, string> = {
            "new-launch": "#801C6E",
            "best-seller": "#B45309",
            "summer-special": "#0284C7",
          };
          const newBanner: SpotlightBanner = {
            id: created?._id || `spotlight-${Date.now()}`,
            packageId,
            title,
            subtitle,
            badge,
            badgeBg: d.badgeBg || badgePresetColors[badge] || "#801C6E",
            ctaText: "Book now",
            ctaTheme: "white",
            overlayGradient: GRADIENT_PRESETS[0].value,
            image,
            targetUrl,
            isActive: true,
            sortOrder: displayOrder,
            packageName: title,
            price,
            originalPrice,
            duration,
            description,
          };
          onUpdateSpotlightBanners((prev) => [...prev, newBanner]);
          if (onRefreshSpotlight) {
            await onRefreshSpotlight();
          }
          setSpotlightModal({ open: false, mode: "add", data: {} });
          setSelectedPackage(null);
        } else {
          alert(res?.message || "Failed to add package to spotlight.");
        }
      } else {
        const bannerId = d.id;
        if (!bannerId) return;

        const res = await updateSpotlightApi(bannerId, {
          packageId,
          badge,
          displayOrder,
          status: d.isActive ?? true,
        });

        if (res && res.success) {
          onUpdateSpotlightBanners((prev) =>
            prev.map((b) =>
              b.id === bannerId
                ? {
                    ...b,
                    packageId,
                    title,
                    subtitle,
                    badge,
                    badgeBg: d.badgeBg || b.badgeBg,
                    image,
                    targetUrl,
                    isActive: d.isActive ?? b.isActive,
                    sortOrder: displayOrder,
                    packageName: title,
                    price,
                    originalPrice,
                    duration,
                    description,
                  }
                : b
            )
          );
          if (onRefreshSpotlight) {
            await onRefreshSpotlight();
          }
          setSpotlightModal({ open: false, mode: "edit", data: {} });
          setSelectedPackage(null);
        } else {
          alert(res?.message || "Failed to update spotlight item.");
        }
      }
    } catch (err: any) {
      console.error("saveSpotlightBanner error:", err);
      alert(err?.message || "Failed to save spotlight banner.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500";

  return (
    <div className="space-y-6">
      {/* Header Banner - Editable */}
      <div className="bg-gradient-to-r from-[#48073d] via-[#610c52] to-[#801C6E] text-white p-5 rounded-2xl shadow-sm border border-purple-900/30">
        {editingSpotlightHeader ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={spotlightHeaderDraft.badge}
                  onChange={(e) =>
                    setSpotlightHeaderDraft({
                      ...spotlightHeaderDraft,
                      badge: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                  Main Title
                </label>
                <input
                  type="text"
                  value={spotlightHeaderDraft.title}
                  onChange={(e) =>
                    setSpotlightHeaderDraft({
                      ...spotlightHeaderDraft,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                Subtitle
              </label>
              <input
                type="text"
                value={spotlightHeaderDraft.subtitle}
                onChange={(e) =>
                  setSpotlightHeaderDraft({
                    ...spotlightHeaderDraft,
                    subtitle: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                  View All CTA Text
                </label>
                <input
                  type="text"
                  value={spotlightHeaderDraft.viewAllText}
                  onChange={(e) =>
                    setSpotlightHeaderDraft({
                      ...spotlightHeaderDraft,
                      viewAllText: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                  View All Link URL
                </label>
                <input
                  type="text"
                  value={spotlightHeaderDraft.viewAllLink}
                  onChange={(e) =>
                    setSpotlightHeaderDraft({
                      ...spotlightHeaderDraft,
                      viewAllLink: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setEditingSpotlightHeader(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSpotlightHeader}
                className="px-3 py-1.5 rounded-lg bg-white text-brand-900 text-xs font-black cursor-pointer shadow-sm hover:bg-purple-50"
              >
                Save Header
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-md text-purple-100">
                {spotlightHeader.badge}
              </span>
              <h2 className="text-xl font-black mt-1 text-white tracking-tight">
                {spotlightHeader.title}
              </h2>
              <p className="text-xs text-purple-100/90 mt-0.5 max-w-xl">
                {spotlightHeader.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSpotlightHeaderDraft(spotlightHeader);
                  setEditingSpotlightHeader(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer border border-white/20"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Header</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Spotlight Banners ({spotlightBanners.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Flagship banner carousel cards on Varanasi home page
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSpotlight.map((banner, index) => (
            <div
              key={banner.id}
              className={`rounded-3xl border overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all ${
                banner.isActive
                  ? "border-slate-200 dark:border-slate-800"
                  : "border-dashed border-slate-300 dark:border-slate-700 opacity-60"
              }`}
            >
              {/* Card Visual Preview (matching website card exactly) */}
              <div className="relative h-52 overflow-hidden select-none group/card">
                {/* Background image / letters fallback */}
                <div className="absolute inset-0">
                  <SectionCardImage
                    src={banner.image || banner.imageUrl}
                    packageId={banner.packageId}
                    title={banner.title.replace(/\n/g, " ")}
                    badgeSize="w-16 h-16 text-2xl"
                    className="w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-500"
                    fallback="SP"
                  />
                </div>
                {/* Gradient Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: banner.overlayGradient }}
                />

                {/* Top status badges */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      banner.isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-500 text-white"
                    }`}
                  >
                    {banner.isActive ? "LIVE" : "HIDDEN"}
                  </span>
                </div>

                {/* Content text */}
                <div className="relative z-10 h-full p-5 flex flex-col justify-between max-w-[68%] text-white">
                  <div>
                    {banner.badge && (
                      <div className="mb-2">
                        <span
                          className="inline-block text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-wide shadow-xs border border-white/20"
                          style={{ backgroundColor: banner.badgeBg || "#801C6E" }}
                        >
                          {spotlightBadges.find((b) => b.value === banner.badge)?.label || banner.badge}
                        </span>
                      </div>
                    )}
                    <h3 className="font-extrabold text-lg leading-tight whitespace-pre-line tracking-tight text-white drop-shadow-xs">
                      {banner.title}
                    </h3>
                    <p className="text-xs font-medium mt-1 leading-snug text-pink-100/90 line-clamp-2">
                      {banner.subtitle}
                    </p>

                    {/* Price and duration pill on card */}
                    {(banner.price !== undefined || banner.duration !== undefined) && (
                      <div className="flex items-center gap-2 mt-2">
                        {banner.price !== undefined && (
                          <span className="text-sm font-black text-white drop-shadow-xs">
                            ₹{banner.price}
                          </span>
                        )}
                        {banner.originalPrice && banner.originalPrice > (banner.price || 0) && (
                          <span className="text-xs text-pink-200/80 line-through">
                            ₹{banner.originalPrice}
                          </span>
                        )}
                        {banner.duration && (
                          <span className="text-[10px] font-bold bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded text-white/95 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {banner.duration}m
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA button visual preview */}
                  <div>
                    <span className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-extrabold tracking-tight bg-white text-[#48073d] shadow-sm">
                      {banner.ctaText || "Book now"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions Bottom Bar */}
              <div className="p-3.5 space-y-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2 min-w-0">
                    {banner.price !== undefined && (
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        ₹{banner.price}
                      </span>
                    )}
                    {banner.originalPrice && banner.originalPrice > (banner.price || 0) && (
                      <span className="line-through text-slate-400 text-[10px]">
                        ₹{banner.originalPrice}
                      </span>
                    )}
                    <span
                      className="font-mono text-[11px] truncate max-w-[150px] text-slate-400"
                      title={banner.targetUrl}
                    >
                      {banner.targetUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSpotlightBanner(banner.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      banner.isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {banner.isActive ? "Active (Click to Hide)" : "Hidden (Click to Show)"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSpotlightBanner(index, "up")}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Move Left/Earlier in carousel"
                    >
                      <MoveUp className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={index === spotlightBanners.length - 1}
                      onClick={() => moveSpotlightBanner(index, "down")}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Move Right/Later in carousel"
                    >
                      <MoveDown className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewSpotlight(banner)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(banner)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onRequestDelete(
                          banner.id,
                          banner.title.replace(/\n/g, " ")
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SPOTLIGHT BANNER ADD/EDIT MODAL ─── */}
      {spotlightModal.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 dark:text-white text-base">
                      {spotlightModal.mode === "add"
                        ? "Create In the Spotlight Banner"
                        : "Edit In the Spotlight Banner"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Configure flagship promotional banner with live overlay
                      gradient & CTA button
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSpotlightModal({ open: false, mode: "add", data: {} })
                  }
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: 2-column layout (Form on Left, Live Preview on Right) */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form Fields (7 cols) - ONLY Package, Badge, Badge Color, Status */}
                <div className="lg:col-span-7 space-y-5">
                  {/* 1. Select Package Dropdown with Search */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                        <span>Select Package from Catalog *</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {availablePackages.length} packages available
                      </span>
                    </div>

                    <div ref={packageDropdownRef} className="relative">
                      {/* Trigger Box */}
                      <div
                        onClick={() => setPackageDropdownOpen((prev) => !prev)}
                        className={`w-full min-h-[50px] p-2.5 rounded-2xl border bg-white dark:bg-slate-900 cursor-pointer flex items-center justify-between gap-2.5 shadow-2xs transition-all ${
                          packageDropdownOpen
                            ? "border-brand-600 ring-2 ring-brand-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        {selectedPackage ? (
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                              <SectionCardImage
                                src={selectedPackage.imageUrl || selectedPackage.thumbnailUrl}
                                packageId={selectedPackage._id || selectedPackage.packageId}
                                title={selectedPackage.packageName}
                                badgeSize="w-10 h-10 text-xs"
                                fallback="SP"
                              />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <span className="text-xs font-black text-slate-900 dark:text-white block truncate leading-tight">
                                {selectedPackage.packageName}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">
                                {(typeof selectedPackage.serviceActionId === "object" && selectedPackage.serviceActionId?.serviceAction) ||
                                  (typeof selectedPackage.serviceActionId === "object" && (selectedPackage.serviceActionId as any)?.name) ||
                                  selectedPackage.serviceAction?.name ||
                                  selectedPackage.category?.name ||
                                  "Service"}{" "}
                                • ₹{selectedPackage.price}
                              </span>
                            </div>
                          </div>
                        ) : spotlightModal.data.title ? (
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                              <SectionCardImage
                                src={spotlightModal.data.image}
                                packageId={spotlightModal.data.packageId}
                                title={spotlightModal.data.title}
                                badgeSize="w-10 h-10 text-xs"
                                fallback="SP"
                              />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <span className="text-xs font-black text-slate-900 dark:text-white block truncate leading-tight">
                                {spotlightModal.data.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">
                                {spotlightModal.data.price !== undefined
                                  ? `₹${spotlightModal.data.price}${
                                      spotlightModal.data.duration ? ` • ${spotlightModal.data.duration}m` : ""
                                    }`
                                  : spotlightModal.data.packageId
                                  ? `ID: ${spotlightModal.data.packageId}`
                                  : "Linked Package"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 pl-1.5 text-xs">
                            <Search className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>Click to search &amp; select package from catalog...</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 pr-1">
                          {(selectedPackage || spotlightModal.data.title) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPackage(null);
                                setSpotlightModal((prev) => ({
                                  ...prev,
                                  data: {
                                    ...prev.data,
                                    packageId: undefined,
                                    title: "",
                                    subtitle: "",
                                    image: "",
                                    targetUrl: "/services",
                                  },
                                }));
                              }}
                              className="text-[11px] font-bold text-slate-400 hover:text-red-500 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              title="Clear selection"
                            >
                              Clear
                            </button>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              packageDropdownOpen ? "rotate-180 text-brand-600" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Dropdown Popover List */}
                      {packageDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 space-y-2 max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search package name, service..."
                              value={packageSearch}
                              onChange={(e) => setPackageSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                            />
                            {packageSearch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPackageSearch("");
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Package Options */}
                          <div className="overflow-y-auto space-y-1 max-h-52 pr-0.5">
                            {isPackagesLoading && availablePackages.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                <span>Loading packages...</span>
                              </div>
                            ) : filteredPackages.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400">
                                {packageSearch
                                  ? `No packages found matching "${packageSearch}"`
                                  : "No packages available"}
                              </div>
                            ) : (
                              filteredPackages.map((pkg) => {
                                const pkgId = pkg._id || pkg.packageId || "";
                                const currentSelectedId =
                                  selectedPackage?._id ||
                                  selectedPackage?.packageId ||
                                  spotlightModal.data.packageId;
                                const isSelected =
                                  !!currentSelectedId && currentSelectedId === pkgId;
                                const serviceLabel =
                                  (typeof pkg.serviceActionId === "object" &&
                                    pkg.serviceActionId?.serviceAction) ||
                                  (typeof pkg.serviceActionId === "object" &&
                                    (pkg.serviceActionId as any)?.name) ||
                                  pkg.serviceAction?.name ||
                                  pkg.category?.name ||
                                  "Service";

                                return (
                                  <div
                                    key={pkgId || pkg.packageName}
                                    onClick={() => {
                                      handleSelectPackage(pkg);
                                      setPackageDropdownOpen(false);
                                      setPackageSearch("");
                                    }}
                                    className={`p-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                                        <SectionCardImage
                                          src={pkg.imageUrl || pkg.thumbnailUrl}
                                          packageId={pkgId}
                                          title={pkg.packageName}
                                          badgeSize="w-8 h-8 text-[10px]"
                                          fallback="SP"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1 text-left">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate leading-tight">
                                          {pkg.packageName}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                          {serviceLabel}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                                        ₹{pkg.price}
                                      </span>
                                      {isSelected && (
                                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Badge Selection (Enum: new-launch, best-seller, summer-special) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                        Badge *
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Select promotional badge
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {spotlightBadges.map((badgeItem) => {
                        const currentVal = spotlightModal.data.badge || "new-launch";
                        const isSelected = currentVal === badgeItem.value;
                        const badgePresetColors: Record<string, string> = {
                          "new-launch": "#801C6E",
                          "best-seller": "#B45309",
                          "summer-special": "#0284C7",
                        };
                        return (
                          <button
                            key={badgeItem.value}
                            type="button"
                            onClick={() =>
                              setSpotlightModal((prev) => ({
                                ...prev,
                                data: {
                                  ...prev.data,
                                  badge: badgeItem.value,
                                  badgeBg:
                                    prev.data.badgeBg ||
                                    badgePresetColors[badgeItem.value] ||
                                    "#801C6E",
                                },
                              }))
                            }
                            className={`px-3 py-2.5 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-500 shadow-xs ring-2 ring-purple-500/20"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            )}
                            <span>{badgeItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Badge Color */}
                  <div>
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1.5">
                      Badge Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={spotlightModal.data.badgeBg || "#801C6E"}
                        onChange={(e) =>
                          setSpotlightModal({
                            ...spotlightModal,
                            data: { ...spotlightModal.data, badgeBg: e.target.value },
                          })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 p-0.5 bg-transparent"
                        title="Pick custom color"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap flex-1">
                        {BADGE_COLOR_PRESETS.map((colorItem) => (
                          <button
                            key={colorItem.value}
                            type="button"
                            onClick={() =>
                              setSpotlightModal({
                                ...spotlightModal,
                                data: {
                                  ...spotlightModal.data,
                                  badgeBg: colorItem.value,
                                },
                              })
                            }
                            className={`w-7 h-7 rounded-lg border transition-transform cursor-pointer ${
                              (spotlightModal.data.badgeBg || "#801C6E") ===
                              colorItem.value
                                ? "scale-110 border-white ring-2 ring-purple-500 shadow-sm"
                                : "border-transparent opacity-80 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: colorItem.value }}
                            title={colorItem.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Status Toggle */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          Status
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {(spotlightModal.data.isActive ?? true)
                            ? "Live on website (Visible in carousel)"
                            : "Hidden draft (Not displayed to customers)"}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={spotlightModal.data.isActive ?? true}
                          onChange={(e) =>
                            setSpotlightModal({
                              ...spotlightModal,
                              data: { ...spotlightModal.data, isActive: e.target.checked },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live High-Fidelity Website Preview (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-start">
                  <div className="sticky top-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-purple-600" />
                        Live Website Card Preview
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        1:1 Website Replica
                      </span>
                    </div>

                    {/* Spotlight Card Replica */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 shadow-xl relative h-64 select-none">
                      {/* Background Image or Letters Fallback */}
                      <div className="absolute inset-0">
                        <SectionCardImage
                          src={spotlightModal.data.image || spotlightModal.data.imageUrl}
                          packageId={selectedPackage?._id || selectedPackage?.packageId || spotlightModal.data.packageId}
                          title={spotlightModal.data.title || "In the Spotlight"}
                          badgeSize="w-20 h-20 text-3xl"
                          className="w-full h-full object-cover object-right"
                          fallback="SP"
                        />
                      </div>

                      {/* Live Gradient Overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none transition-all duration-300"
                        style={{
                          background:
                            spotlightModal.data.overlayGradient ||
                            GRADIENT_PRESETS[0].value,
                        }}
                      />

                      {/* Content Overlay */}
                      <div className="relative z-10 h-full p-6 flex flex-col justify-between max-w-[75%] text-white">
                        <div>
                          {/* Badge */}
                          {spotlightModal.data.badge && (
                            <div className="mb-2">
                              <span
                                className="inline-block text-white text-[10px] font-black px-2.5 py-0.5 rounded-md tracking-wide shadow-xs border border-white/20"
                                style={{
                                  backgroundColor:
                                    spotlightModal.data.badgeBg || "#801C6E",
                                }}
                              >
                                {spotlightBadges.find((b) => b.value === spotlightModal.data.badge)?.label ||
                                  spotlightModal.data.badge}
                              </span>
                            </div>
                          )}

                          {/* Headline */}
                          <h3 className="font-extrabold text-xl leading-tight whitespace-pre-line tracking-tight text-white drop-shadow-sm">
                            {spotlightModal.data.title || "Select a package to preview"}
                          </h3>

                          {/* Subtitle */}
                          <p className="text-xs font-medium mt-1.5 leading-snug text-pink-100/90 line-clamp-2">
                            {spotlightModal.data.subtitle || "Spotless homes at ₹1200"}
                          </p>

                          {/* Price & Duration */}
                          {(spotlightModal.data.price !== undefined || spotlightModal.data.duration !== undefined) && (
                            <div className="flex items-center gap-2 mt-2">
                              {spotlightModal.data.price !== undefined && (
                                <span className="text-sm font-black text-white">
                                  ₹{spotlightModal.data.price}
                                </span>
                              )}
                              {spotlightModal.data.originalPrice && spotlightModal.data.originalPrice > (spotlightModal.data.price || 0) && (
                                <span className="text-xs text-pink-200/70 line-through">
                                  ₹{spotlightModal.data.originalPrice}
                                </span>
                              )}
                              {spotlightModal.data.duration && (
                                <span className="text-[10px] font-bold bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded text-white flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {spotlightModal.data.duration}m
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CTA button */}
                        <div>
                          <span
                            className={`inline-block px-4 py-2 rounded-xl text-xs font-extrabold tracking-tight shadow-md ${
                              spotlightModal.data.ctaTheme === "accent"
                                ? "bg-[#801C6E] text-white"
                                : "bg-white text-[#48073d]"
                            }`}
                          >
                            {spotlightModal.data.ctaText || "Book now"}
                          </span>
                        </div>
                      </div>

                      {/* Live indicator tag */}
                      <div className="absolute top-3 right-3 z-20">
                        <span
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                            spotlightModal.data.isActive ?? true
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-600 text-white"
                          }`}
                        >
                          {spotlightModal.data.isActive ?? true ? "ACTIVE" : "HIDDEN"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Target Route:</span>
                        <span className="font-mono text-purple-600 font-bold truncate max-w-[180px]">
                          {spotlightModal.data.targetUrl || "/services"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Selected Package:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold truncate max-w-[180px]">
                          {selectedPackage?.packageName || spotlightModal.data.title || "None selected"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    setSpotlightModal({ open: false, mode: "add", data: {} })
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={saveSpotlightBanner}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-colors shadow-lux"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {spotlightModal.mode === "add"
                          ? "Adding Banner..."
                          : "Updating Banner..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>
                        {spotlightModal.mode === "add"
                          ? "Save Spotlight Banner"
                          : "Update Banner"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── SPOTLIGHT BANNER PREVIEW MODAL ─── */}
      {previewSpotlight && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">
                    In the Spotlight — Website Preview
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewSpotlight(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                <div className="rounded-3xl overflow-hidden bg-slate-900 shadow-xl relative h-72 select-none border border-slate-200 dark:border-slate-800">
                  <div className="absolute inset-0">
                    <SectionCardImage
                      src={previewSpotlight.image || previewSpotlight.imageUrl}
                      packageId={previewSpotlight.packageId}
                      title={previewSpotlight.title.replace(/\n/g, " ")}
                      badgeSize="w-20 h-20 text-3xl"
                      className="w-full h-full object-cover object-right"
                      fallback="SP"
                    />
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: previewSpotlight.overlayGradient }}
                  />

                  <div className="relative z-10 h-full p-6 flex flex-col justify-between max-w-[70%] text-white">
                    <div>
                      {previewSpotlight.badge && (
                        <div className="mb-2.5">
                          <span
                            className="inline-block text-white text-[11px] font-black px-2.5 py-0.5 rounded-md tracking-wide shadow-xs border border-white/20"
                            style={{
                              backgroundColor:
                                previewSpotlight.badgeBg || "#801C6E",
                            }}
                          >
                            {spotlightBadges.find((b) => b.value === previewSpotlight.badge)?.label ||
                              previewSpotlight.badge}
                          </span>
                        </div>
                      )}
                      <h3 className="font-black text-2xl leading-tight whitespace-pre-line tracking-tight text-white drop-shadow-md">
                        {previewSpotlight.title}
                      </h3>
                      <p className="text-xs font-medium mt-2 leading-snug text-pink-100/90 line-clamp-3">
                        {previewSpotlight.subtitle}
                      </p>

                      {/* Price & Duration */}
                      {(previewSpotlight.price !== undefined || previewSpotlight.duration !== undefined) && (
                        <div className="flex items-center gap-2.5 mt-2.5">
                          {previewSpotlight.price !== undefined && (
                            <span className="text-base font-extrabold text-white">
                              ₹{previewSpotlight.price}
                            </span>
                          )}
                          {previewSpotlight.originalPrice && previewSpotlight.originalPrice > (previewSpotlight.price || 0) && (
                            <span className="text-xs text-pink-200/80 line-through">
                              ₹{previewSpotlight.originalPrice}
                            </span>
                          )}
                          {previewSpotlight.duration && (
                            <span className="text-[11px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-white/95 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {previewSpotlight.duration} mins
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <span
                        className={`inline-block px-4 py-2 rounded-xl text-xs font-extrabold tracking-tight shadow-lg ${
                          previewSpotlight.ctaTheme === "accent"
                            ? "bg-[#801C6E] text-white"
                            : "bg-white text-[#48073d]"
                        }`}
                      >
                        {previewSpotlight.ctaText || "Book now"}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 z-20">
                    <span
                      className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                        previewSpotlight.isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-600 text-white"
                      }`}
                    >
                      {previewSpotlight.isActive
                        ? "LIVE ON HOMEPAGE"
                        : "HIDDEN DRAFT"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Destination Route:</span>
                  <span className="font-mono font-bold text-purple-600 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {previewSpotlight.targetUrl}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewSpotlight(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
