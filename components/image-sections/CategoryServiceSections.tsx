"use client";

import { useState, useEffect, useRef } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MoveUp,
  MoveDown,
  X,
  Save,
  Check,
  ChevronDown,
  Search,
  Tag,
  Zap,
  Upload,
  Loader2,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import {
  CategorySectionData,
  SimpleServiceCard,
} from "./types";
import { SectionCardImage } from "./SectionCardImage";
import { CategoryModalPackageShimmer } from "./SectionShimmers";
import {
  ApiCategory,
  ApiTrendingCatalogItem,
  getPackagesApi,
  formatImageUrl,
} from "@/lib/api";

interface CategoryServiceSectionsProps {
  categorySections: CategorySectionData[];
  searchQuery: string;
  apiCategories: ApiCategory[];
  isCategoriesLoading: boolean;
  fetchCategories: () => Promise<void>;
  catalogPackages: ApiTrendingCatalogItem[];
  onUpdateCategorySections: (
    updater: (prev: CategorySectionData[]) => CategorySectionData[]
  ) => void;
  onRequestDelete: (id: string, name: string, sectionId?: string) => void;
  onOpenCatalogPickerForSection: (sectionId: string) => void;
  isAddSectionModalOpen?: boolean;
  onCloseAddSectionModal?: () => void;
}

export function CategoryServiceSections({
  categorySections,
  searchQuery,
  apiCategories,
  isCategoriesLoading,
  fetchCategories,
  catalogPackages,
  onUpdateCategorySections,
  onRequestDelete,
  onOpenCatalogPickerForSection,
  isAddSectionModalOpen = false,
  onCloseAddSectionModal,
}: CategoryServiceSectionsProps) {
  // Category Section Modal states (Single Multi-Select Dropdown, Max 2)
  const [categorySectionModal, setCategorySectionModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: Partial<CategorySectionData>;
  }>({ open: false, mode: "add", data: {} });

  const [catModalSelectedCategories, setCatModalSelectedCategories] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [catDropdownSearch, setCatDropdownSearch] = useState("");
  const catDropdownRef = useRef<HTMLDivElement>(null);

  const [catModalBadge, setCatModalBadge] = useState<string>("Top Rated");
  const [catModalSortOrder, setCatModalSortOrder] = useState<number>(1);
  const [catModalIsActive, setCatModalIsActive] = useState<boolean>(true);
  const [catModalPackages, setCatModalPackages] = useState<any[]>([]);
  const [catModalSelectedPkgIds, setCatModalSelectedPkgIds] = useState<string[]>([]);
  const [isCatModalPackagesLoading, setIsCatModalPackagesLoading] = useState(false);

  // Individual Service Card Modal states
  const [serviceCardModal, setServiceCardModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    sectionId: string;
    data: Partial<SimpleServiceCard>;
    file?: File | null;
  }>({ open: false, mode: "add", sectionId: "", data: {} });
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isSavingServiceCard, setIsSavingServiceCard] = useState(false);

  // Handle outside click for category dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        catDropdownRef.current &&
        !catDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCatDropdownOpen(false);
      }
    }
    if (isCatDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCatDropdownOpen]);

  // Open Add modal when triggered from top bar
  useEffect(() => {
    if (isAddSectionModalOpen) {
      openAddCategorySectionModal();
      if (onCloseAddSectionModal) {
        onCloseAddSectionModal();
      }
    }
  }, [isAddSectionModalOpen, onCloseAddSectionModal]);

  const fetchPackagesForSelectedCategories = async (
    categoryIds: string[],
    preselectedIds?: string[]
  ) => {
    if (!categoryIds || categoryIds.length === 0) {
      setCatModalPackages([]);
      if (preselectedIds === undefined) {
        setCatModalSelectedPkgIds([]);
      }
      return;
    }
    setIsCatModalPackagesLoading(true);
    try {
      const list: any[] = [];
      for (const catId of categoryIds) {
        const res = await getPackagesApi({ categoryId: catId, limit: 100 });
        if (res && res.success && Array.isArray(res.data)) {
          list.push(...res.data);
        }
      }

      // Also merge with catalogPackages if available
      if (catalogPackages && catalogPackages.length > 0) {
        const matchingCatalog = catalogPackages.filter(
          (cp) =>
            categoryIds.includes(cp.category?.id) &&
            !list.some((p) => (p._id || p.packageId) === cp.packageId)
        );
        matchingCatalog.forEach((cp) => {
          list.push({
            _id: cp.packageId,
            packageId: cp.packageId,
            packageName: cp.packageName,
            price: cp.price,
            originalPrice: cp.originalPrice,
            duration: cp.duration,
            imageUrl: cp.imageUrl,
            thumbnailUrl: cp.thumbnailUrl,
            category: cp.category,
            categoryName: cp.category?.name,
          });
        });
      }

      const unique = Array.from(
        new Map(list.map((p) => [p._id || p.packageId, p])).values()
      );
      setCatModalPackages(unique);

      if (preselectedIds !== undefined) {
        setCatModalSelectedPkgIds(preselectedIds);
      } else {
        // Auto-select all available packages  for new selection
        setCatModalSelectedPkgIds(unique.map((p) => p._id || p.packageId));
      }
    } catch (err) {
      console.error("Failed to load category packages :", err);
      setCatModalPackages([]);
    } finally {
      setIsCatModalPackagesLoading(false);
    }
  };

  const handleToggleCategorySelect = (categoryId: string) => {
    let next: string[];
    if (catModalSelectedCategories.includes(categoryId)) {
      next = catModalSelectedCategories.filter((id) => id !== categoryId);
    } else {
      if (catModalSelectedCategories.length >= 2) {
        return; // Max 2 limit
      }
      next = [...catModalSelectedCategories, categoryId];
    }
    setCatModalSelectedCategories(next);
    fetchPackagesForSelectedCategories(next);
  };

  const handleRemoveCategoryChip = (
    categoryId: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const next = catModalSelectedCategories.filter((id) => id !== categoryId);
    setCatModalSelectedCategories(next);
    fetchPackagesForSelectedCategories(next);
  };

  const openAddCategorySectionModal = () => {
    if (apiCategories.length === 0) {
      fetchCategories();
    }
    setCatModalSelectedCategories([]);
    setIsCatDropdownOpen(false);
    setCatDropdownSearch("");
    setCatModalBadge("Top Rated");
    setCatModalSortOrder(categorySections.length + 1);
    setCatModalIsActive(true);
    setCategorySectionModal({
      open: true,
      mode: "add",
      data: {
        sortOrder: categorySections.length + 1,
        isActive: true,
      },
    });
    setCatModalPackages([]);
    setCatModalSelectedPkgIds([]);
  };

  const openEditCategorySectionModal = (section: CategorySectionData) => {
    if (apiCategories.length === 0) {
      fetchCategories();
    }
    let selectedIds = (section.categoryIds || []).filter(Boolean).slice(0, 2);

    if (selectedIds.length === 0 && apiCategories.length > 0) {
      const match1 = apiCategories.find(
        (c) =>
          section.categorySlug?.toLowerCase().includes(c.slug.toLowerCase()) ||
          section.title.toLowerCase().includes(c.categoryName.toLowerCase())
      );
      if (match1) {
        selectedIds.push(match1._id);
        const match2 = apiCategories.find(
          (c) =>
            c._id !== match1._id &&
            section.title.toLowerCase().includes(c.categoryName.toLowerCase())
        );
        if (match2) selectedIds.push(match2._id);
      }
    }

    setCatModalSelectedCategories(selectedIds);
    setIsCatDropdownOpen(false);
    setCatDropdownSearch("");
    setCatModalBadge(section.badge || "");
    setCatModalSortOrder(section.sortOrder || 1);
    setCatModalIsActive(section.isActive ?? true);

    const existingPkgIds = (section.services || []).map(
      (s) => s.packageId || s.id
    );
    setCatModalSelectedPkgIds(existingPkgIds);

    setCategorySectionModal({
      open: true,
      mode: "edit",
      data: { ...section },
    });

    if (selectedIds.length > 0) {
      fetchPackagesForSelectedCategories(selectedIds, existingPkgIds);
    }
  };

  const saveCategorySection = () => {
    if (isSavingSection) return;
    if (catModalSelectedCategories.length === 0) {
      alert("Please select at least one category from the API (maximum 2).");
      return;
    }
    const selectedCats = apiCategories.filter((c) =>
      catModalSelectedCategories.includes(c._id)
    );
    if (selectedCats.length === 0) {
      alert("Selected categories not found in API list.");
      return;
    }

    setIsSavingSection(true);
    try {
      const cat1 = selectedCats[0];
      const cat2 = selectedCats[1] || null;

    const derivedTitle = cat2
      ? `${cat1.categoryName} & ${cat2.categoryName}`
      : cat1.categoryName;
    const derivedSlug = cat2 ? `${cat1.slug}-${cat2.slug}` : cat1.slug;
    const derivedSubtitle = `Verified ${selectedCats
      .map((c) => c.categoryName)
      .join(" & ")} packages & doorstep repair solutions in Varanasi`;
    const derivedSeeAllUrl = `/search?view=packages&category=${encodeURIComponent(
      cat1.categoryName
    )}&categoryId=${cat1._id}`;

    // Map selected API packages
    const selectedServices: SimpleServiceCard[] = catModalPackages
      .filter((pkg) => {
        const id = pkg._id || pkg.packageId;
        return catModalSelectedPkgIds.includes(id);
      })
      .map((pkg) => {
        const pkgId = pkg._id || pkg.packageId;
        return {
          id: pkgId,
          packageId: pkgId,
          title: pkg.packageName,
          image:
            formatImageUrl(pkg.imageUrl || pkg.thumbnailUrl, pkgId) ||
            `/api/media/package/${pkgId}/image`,
          targetUrl: `/services/${cat1.slug}?packageId=${pkgId}`,
          price: String(pkg.price || 0),
          originalPrice: String(pkg.originalPrice || 0),
          duration: pkg.duration || 30,
        };
      });

    if (categorySectionModal.mode === "add") {
      const newSec: CategorySectionData = {
        id: `catsec-${Date.now()}`,
        title: derivedTitle,
        subtitle: derivedSubtitle,
        badge: catModalBadge.trim(),
        categoryIds: catModalSelectedCategories,
        categorySlug: derivedSlug,
        seeAllUrl: derivedSeeAllUrl,
        isActive: catModalIsActive,
        sortOrder: Number(catModalSortOrder) || categorySections.length + 1,
        services: selectedServices,
      };
      onUpdateCategorySections((prev) => [...prev, newSec]);
    } else {
      const targetId = categorySectionModal.data.id;
      onUpdateCategorySections((prev) =>
        prev.map((sec) =>
          sec.id === targetId
            ? {
                ...sec,
                title: derivedTitle,
                subtitle: derivedSubtitle,
                badge: catModalBadge.trim(),
                categoryIds: catModalSelectedCategories,
                categorySlug: derivedSlug,
                seeAllUrl: derivedSeeAllUrl,
                isActive: catModalIsActive,
                sortOrder: Number(catModalSortOrder) || sec.sortOrder,
                services:
                  selectedServices.length > 0 ? selectedServices : sec.services,
              }
            : sec
        )
      );
    }
    setCategorySectionModal({ open: false, mode: "add", data: {} });
  } finally {
    setIsSavingSection(false);
  }
};

  const moveCategorySection = (index: number, direction: "up" | "down") => {
    onUpdateCategorySections((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((sec, i) => ({ ...sec, sortOrder: i + 1 }));
    });
  };

  const toggleCategorySection = (id: string) => {
    onUpdateCategorySections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, isActive: !sec.isActive } : sec))
    );
  };

  const saveServiceCard = () => {
    if (isSavingServiceCard) return;
    const { sectionId, data: d, mode } = serviceCardModal;
    if (!sectionId) {
      alert("Please select a target category section.");
      return;
    }
    if (!d.title?.trim()) {
      alert("Service title is required.");
      return;
    }

    setIsSavingServiceCard(true);
    try {

    if (mode === "add") {
      const newCard: SimpleServiceCard = {
        id: `svc-${Date.now()}`,
        title: d.title.trim(),
        image: d.image?.trim() || "",
        targetUrl: d.targetUrl?.trim() || "/services",
      };
      onUpdateCategorySections((prev) =>
        prev.map((sec) =>
          sec.id === sectionId
            ? { ...sec, services: [...sec.services, newCard] }
            : sec
        )
      );
    } else {
      onUpdateCategorySections((prev) =>
        prev.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                services: sec.services.map((s) =>
                  s.id === d.id
                    ? {
                        ...s,
                        title: d.title?.trim() || s.title,
                        image: d.image !== undefined ? d.image.trim() : s.image,
                        targetUrl: d.targetUrl?.trim() || s.targetUrl,
                      }
                    : s
                ),
              }
            : sec
        )
      );
    }
    setServiceCardModal({ open: false, mode: "add", sectionId: "", data: {} });
  } finally {
    setIsSavingServiceCard(false);
  }
};

  const moveServiceCard = (
    sectionId: string,
    index: number,
    direction: "left" | "right"
  ) => {
    onUpdateCategorySections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const targetIndex = direction === "left" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sec.services.length) return sec;
        const copy = [...sec.services];
        const temp = copy[index];
        copy[index] = copy[targetIndex];
        copy[targetIndex] = temp;
        return { ...sec, services: copy };
      })
    );
  };

  const filteredCategorySections = categorySections.filter(
    (sec) =>
      !searchQuery ||
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.categorySlug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.services.some((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest uppercase bg-brand-500/30 text-brand-300 border border-brand-400/30 px-2 py-0.5 rounded-md">
            WEBSITE CORE SLIDERS
          </span>
          <h2 className="text-xl font-black mt-1 text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <span>Category Service Sections</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
            Horizontal multi-service sliders shown on the Varanasi home page.
            Manage category rows, titles, and individual service cards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            suppressHydrationWarning
            className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15"
          >
            {categorySections.length} Categories •{" "}
            {categorySections.reduce((acc, s) => acc + s.services.length, 0)} Total
            Services
          </span>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {filteredCategorySections.map((section, secIdx) => (
          <div
            key={section.id}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          >
            {/* Section Top Header Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/60 text-white">
                    #{section.sortOrder || secIdx + 1}
                  </span>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {section.title}
                  </h3>
                  {section.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {section.badge}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                      section.isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-400 text-white"
                    }`}
                  >
                    {section.isActive ? "LIVE ROW" : "HIDDEN ROW"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {section.subtitle}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                  <span>
                    Slug:{" "}
                    <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                      {section.categorySlug}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    See all:{" "}
                    <span className="text-brand-600 truncate max-w-xs">
                      {section.seeAllUrl}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {section.services.length} Services
                  </span>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    setServiceCardModal({
                      open: true,
                      mode: "add",
                      sectionId: section.id,
                      data: {
                        title: "",
                        image: "",
                        targetUrl: `/services/${section.categorySlug}`,
                      },
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCatalogPickerForSection(section.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pick From Catalog</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditCategorySectionModal(section)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                  title="Edit Category Section"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={secIdx === 0}
                  onClick={() => moveCategorySection(secIdx, "up")}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Move Row Up"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={secIdx === categorySections.length - 1}
                  onClick={() => moveCategorySection(secIdx, "down")}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Move Row Down"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleCategorySection(section.id)}
                  className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                    section.isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                  title={section.isActive ? "Hide Section" : "Show Section"}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRequestDelete(section.id, section.title)
                  }
                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Track for this Section's Services */}
            <div className="p-4 sm:p-5">
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                {section.services.map((svc, svcIdx) => (
                  <div
                    key={svc.id || svcIdx}
                    className="group/svc relative w-48 sm:w-56 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    {/* Service Thumbnail with SectionCardImage */}
                    <div className="relative h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <SectionCardImage
                        src={svc.image}
                        packageId={svc.packageId || svc.id}
                        title={svc.title}
                        badgeSize="w-11 h-11 text-lg"
                        fallback="S"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        #{svcIdx + 1}
                      </div>
                    </div>

                    {/* Title & Link */}
                    <div className="p-3">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {svc.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        {svc.targetUrl}
                      </p>
                    </div>

                    {/* Action buttons footer */}
                    <div className="px-3 pb-2.5 pt-1 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={svcIdx === 0}
                          onClick={() => moveServiceCard(section.id, svcIdx, "left")}
                          className="p-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Move Left"
                        >
                          <MoveUp className="w-3.5 h-3.5 -rotate-90" />
                        </button>
                        <button
                          type="button"
                          disabled={svcIdx === section.services.length - 1}
                          onClick={() => moveServiceCard(section.id, svcIdx, "right")}
                          className="p-1 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Move Right"
                        >
                          <MoveDown className="w-3.5 h-3.5 -rotate-90" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setServiceCardModal({
                              open: true,
                              mode: "edit",
                              sectionId: section.id,
                              data: svc,
                            })
                          }
                          className="p-1 hover:text-brand-600 cursor-pointer"
                          title="Edit Service Card"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onRequestDelete(svc.id, svc.title, section.id)
                          }
                          className="p-1 hover:text-rose-600 cursor-pointer"
                          title="Remove Service Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quick Add Card at End of Track */}
                <button
                  type="button"
                  onClick={() =>
                    setServiceCardModal({
                      open: true,
                      mode: "add",
                      sectionId: section.id,
                      data: {
                        title: "",
                        image: "",
                        targetUrl: `/services/${section.categorySlug}`,
                      },
                    })
                  }
                  className="w-40 sm:w-48 shrink-0 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-400 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 transition-all flex flex-col items-center justify-center gap-2 p-4 cursor-pointer text-slate-400 hover:text-brand-600"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-slate-500" />
                  </div>
                  <span className="text-xs font-bold text-center">Add Service Card</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── CATEGORY SECTION MODAL (API-DRIVEN CATEGORIES & PACKAGES) ─── */}
      {categorySectionModal.open && (() => {
        const selectedCats = apiCategories.filter((c) =>
          catModalSelectedCategories.includes(c._id)
        );
        const selectedCat1Obj = selectedCats[0] || null;
        const selectedCat2Obj = selectedCats[1] || null;
        const derivedTitle = selectedCat1Obj
          ? selectedCat2Obj
            ? `${selectedCat1Obj.categoryName} & ${selectedCat2Obj.categoryName}`
            : selectedCat1Obj.categoryName
          : "";
        const derivedSlug = selectedCat1Obj
          ? selectedCat2Obj
            ? `${selectedCat1Obj.slug}-${selectedCat2Obj.slug}`
            : selectedCat1Obj.slug
          : "";
        const derivedSubtitle =
          selectedCats.length > 0
            ? `Verified ${selectedCats
                .map((c) => c.categoryName)
                .join(" & ")} packages & doorstep service in Varanasi`
            : "";
        const derivedSeeAllUrl = selectedCat1Obj
          ? `/search?view=packages&category=${encodeURIComponent(
              selectedCat1Obj.categoryName
            )}&categoryId=${selectedCat1Obj._id}`
          : "/search?view=packages";

        const filteredDropdownCategories = apiCategories.filter(
          (cat) =>
            !catDropdownSearch.trim() ||
            cat.categoryName
              .toLowerCase()
              .includes(catDropdownSearch.toLowerCase())
        );

        return (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900 dark:text-white text-base">
                        {categorySectionModal.mode === "add"
                          ? "Create Category Section"
                          : "Edit Category Section"}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Select up to 2 categories and choose packages to showcase
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCategorySectionModal({ open: false, mode: "add", data: {} })
                    }
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  {/* Single Multi-Select Category Dropdown (Limit: Maximum 2) */}
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                        <span>Select Categories(Maximum 2) *</span>
                      </label>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          catModalSelectedCategories.length === 2
                            ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700"
                            : "bg-white/80 dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800"
                        }`}
                      >
                        {catModalSelectedCategories.length}/2 Categories Selected
                      </span>
                    </div>

                    {/* Single Multi-Select Dropdown Container */}
                    <div ref={catDropdownRef} className="relative">
                      {/* Dropdown Trigger Box */}
                      <div
                        onClick={() => setIsCatDropdownOpen((prev) => !prev)}
                        className={`w-full min-h-[46px] p-2 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer flex items-center justify-between gap-2 shadow-xs transition-all ${
                          isCatDropdownOpen
                            ? "border-brand-600 ring-2 ring-brand-500/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap flex-1">
                          {catModalSelectedCategories.length === 0 ? (
                            <span className="text-xs text-slate-400 select-none pl-1">
                              {isCategoriesLoading
                                ? "Loading categories ..."
                                : "Click to select up to 2 categories ..."}
                            </span>
                          ) : (
                            selectedCats.map((cat) => (
                              <span
                                key={cat._id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 animate-in fade-in zoom-in-95 duration-150"
                              >
                                <span>{cat.categoryName}</span>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleRemoveCategoryChip(cat._id, e)
                                  }
                                  className="w-4 h-4 rounded-full hover:bg-brand-200 dark:hover:bg-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-300 cursor-pointer transition-colors"
                                  title={`Remove ${cat.categoryName}`}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-slate-400 pr-1">
                          {catModalSelectedCategories.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCatModalSelectedCategories([]);
                                fetchPackagesForSelectedCategories([]);
                              }}
                              className="text-[11px] font-bold text-slate-400 hover:text-red-500 px-1 py-0.5 rounded transition-colors cursor-pointer"
                              title="Clear selected categories"
                            >
                              Clear
                            </button>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isCatDropdownOpen ? "rotate-180 text-brand-600" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Dropdown Popover List */}
                      {isCatDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 space-y-2 max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                          {/* Search Filter */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={catDropdownSearch}
                              onChange={(e) =>
                                setCatDropdownSearch(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                            />
                          </div>

                          <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-1.5">
                            <span>API Categories (Select max 2)</span>
                            <div className="flex items-center gap-2">
                              {catModalSelectedCategories.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCatModalSelectedCategories([]);
                                    fetchPackagesForSelectedCategories([]);
                                  }}
                                  className="text-slate-400 hover:text-red-500 font-bold transition-colors cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                              <span
                                className={
                                  catModalSelectedCategories.length >= 2
                                    ? "text-amber-600 font-extrabold"
                                    : ""
                                }
                              >
                                {catModalSelectedCategories.length}/2 Selected{" "}
                                {catModalSelectedCategories.length >= 2
                                  ? "(Limit Reached)"
                                  : ""}
                              </span>
                            </div>
                          </div>

                          {/* Options List */}
                          <div className="overflow-y-auto space-y-1 pr-1 flex-1 no-scrollbar max-h-40">
                            {filteredDropdownCategories.length === 0 ? (
                              <div className="text-center py-4 text-xs text-slate-400">
                                No matching categories found.
                              </div>
                            ) : (
                              filteredDropdownCategories.map((cat) => {
                                const isSelected =
                                  catModalSelectedCategories.includes(cat._id);
                                const isMaxReached =
                                  catModalSelectedCategories.length >= 2 &&
                                  !isSelected;

                                return (
                                  <div
                                    key={cat._id}
                                    onClick={() => {
                                      if (!isMaxReached) {
                                        handleToggleCategorySelect(cat._id);
                                      }
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all select-none ${
                                      isSelected
                                        ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 cursor-pointer"
                                        : isMaxReached
                                        ? "opacity-40 bg-slate-50 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed border border-transparent"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer border border-transparent"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] font-bold ${
                                          isSelected
                                            ? "bg-brand-600 border-brand-600 text-white"
                                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        }`}
                                      >
                                        {isSelected && (
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        )}
                                      </div>
                                      <span>{cat.categoryName}</span>
                                      {cat.subCategories?.length > 0 && (
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          ({cat.subCategories.length} sub-categories)
                                        </span>
                                      )}
                                    </div>
                                    {isMaxReached ? (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                                        Max 2 Reached
                                      </span>
                                    ) : isSelected ? (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                                        Selected
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Auto-Generated Section Preview (Read-Only Info Cards, No Free-Text Input) */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Auto-Derived Section Metadata (Generated from Category API)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">
                          Section Title:
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {derivedTitle || (
                            <span className="text-slate-400 font-normal italic">
                              Select Category 1 above
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">
                          Category Slug:
                        </span>
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                          {derivedSlug || "-"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-semibold block text-[11px]">
                          Subtitle:
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {derivedSubtitle || "-"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-semibold block text-[11px]">
                          See All URL:
                        </span>
                        <span className="text-brand-600 font-mono text-[11px] truncate block">
                          {derivedSeeAllUrl || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section Settings: Badge, Sort Order & Active */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Section Badge
                      </label>
                      <select
                        value={catModalBadge}
                        onChange={(e) => setCatModalBadge(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">None</option>
                        <option value="Top Rated">Top Rated</option>
                        <option value="Bestseller">Bestseller</option>
                        <option value="Varanasi Special">Varanasi Special</option>
                        <option value="Popular">Popular</option>
                        <option value="Doorstep Express">Doorstep Express</option>
                        <option value="Summer Special">Summer Special</option>
                        <option value="Urgent 15-30 Min">Urgent 15-30 Min</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={catModalSortOrder}
                        onChange={(e) =>
                          setCatModalSortOrder(Number(e.target.value))
                        }
                        className={inputCls}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="catsec-modal-active"
                        checked={catModalIsActive}
                        onChange={(e) => setCatModalIsActive(e.target.checked)}
                        className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                      />
                      <label
                        htmlFor="catsec-modal-active"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Show on website (Active)
                      </label>
                    </div>
                  </div>

                  {/* API Packages for Selected Category/Categories */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>
                            Packages  ({catModalSelectedPkgIds.length} of{" "}
                            {catModalPackages.length} selected)
                          </span>
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Packages loaded dynamically from backend API for chosen category
                        </p>
                      </div>

                      {catModalPackages.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setCatModalSelectedPkgIds(
                                catModalPackages.map((p) => p._id || p.packageId)
                              )
                            }
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setCatModalSelectedPkgIds([])}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            Deselect All
                          </button>
                        </div>
                      )}
                    </div>

                    {isCatModalPackagesLoading ? (
                      <CategoryModalPackageShimmer count={4} />
                    ) : catModalSelectedCategories.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        Please select up to 2 categories from the dropdown above to view packages from the API.
                      </div>
                    ) : catModalPackages.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        No active packages found in the API for the selected category. The section can still be saved.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                        {catModalPackages.map((pkg) => {
                          const pkgId = pkg._id || pkg.packageId;
                          const isChecked = catModalSelectedPkgIds.includes(pkgId);
                          const togglePkg = () => {
                            setCatModalSelectedPkgIds((prev) =>
                              prev.includes(pkgId)
                                ? prev.filter((id) => id !== pkgId)
                                : [...prev, pkgId]
                            );
                          };

                          return (
                            <div
                              key={pkgId}
                              onClick={togglePkg}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                                isChecked
                                  ? "border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 shadow-xs"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={togglePkg}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded accent-brand-600 cursor-pointer shrink-0"
                                />
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                  <SectionCardImage
                                    src={pkg.imageUrl || pkg.thumbnailUrl}
                                    packageId={pkgId}
                                    title={pkg.packageName}
                                    badgeSize="w-7 h-7 text-[10px]"
                                    fallback="PK"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                                      {pkg.packageName}
                                    </h5>
                                    {pkg.categoryName && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        {pkg.categoryName}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                                      ₹{pkg.price}
                                    </span>
                                    {pkg.originalPrice &&
                                      pkg.originalPrice > pkg.price && (
                                        <span className="text-slate-400 line-through text-[10px]">
                                          ₹{pkg.originalPrice}
                                        </span>
                                      )}
                                    {pkg.duration && (
                                      <span className="text-slate-400 text-[10px]">
                                        • {pkg.duration} mins
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 text-right">
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    isChecked
                                      ? "bg-brand-600 text-white"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {isChecked ? "Selected" : "Add"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isSavingSection}
                    onClick={() =>
                      setCategorySectionModal({ open: false, mode: "add", data: {} })
                    }
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingSection}
                    onClick={saveCategorySection}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-colors shadow-lux"
                  >
                    {isSavingSection ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {categorySectionModal.mode === "add"
                            ? "Adding Section..."
                            : "Updating Section..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>
                          {categorySectionModal.mode === "add"
                            ? "Save Section"
                            : "Update Section"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        );
      })()}

      {/* ─── INDIVIDUAL SERVICE CARD MODAL ─── */}
      {serviceCardModal.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 dark:text-white text-base">
                      {serviceCardModal.mode === "add"
                        ? "Add Service Card"
                        : "Edit Service Card"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Add a service item into the horizontal slider
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setServiceCardModal({
                      open: false,
                      mode: "add",
                      sectionId: "",
                      data: {},
                      file: null,
                    })
                  }
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto">
                {/* Target Section Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Category Section *
                  </label>
                  <select
                    value={serviceCardModal.sectionId}
                    onChange={(e) =>
                      setServiceCardModal({
                        ...serviceCardModal,
                        sectionId: e.target.value,
                      })
                    }
                    className={inputCls}
                  >
                    <option value="" disabled>
                      Select a Category Section...
                    </option>
                    {categorySections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title} ({sec.services.length} services)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Package Selector from Catalog */}
                {catalogPackages && catalogPackages.length > 0 && (
                  <div className="p-3 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-800/60 rounded-2xl">
                    <label className="text-[11px] font-black text-brand-700 dark:text-brand-300 block mb-1">
                      ⚡ Quick Pick Catalog (Optional)
                    </label>
                    <select
                      className={inputCls}
                      onChange={(e) => {
                        const selected = catalogPackages.find(
                          (p) => p.packageId === e.target.value
                        );
                        if (selected) {
                          setServiceCardModal({
                            ...serviceCardModal,
                            data: {
                              ...serviceCardModal.data,
                              packageId: selected.packageId,
                              title: selected.packageName,
                              image:
                                formatImageUrl(
                                  selected.imageUrl || selected.thumbnailUrl,
                                  selected.packageId
                                ) ||
                                `/api/media/package/${selected.packageId}/image`,
                              targetUrl: `/services?packageId=${selected.packageId}`,
                              price: String(selected.price || 0),
                              originalPrice: String(selected.originalPrice || 0),
                              duration: selected.duration,
                            },
                          });
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        -- Select Package from Catalog --
                      </option>
                      {catalogPackages.map((pkg) => (
                        <option key={pkg.packageId} value={pkg.packageId}>
                          {pkg.packageName} ({pkg.category?.name || "Service"} • ₹
                          {pkg.price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Service Title */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bathroom Cleaning"
                    value={serviceCardModal.data.title || ""}
                    onChange={(e) =>
                      setServiceCardModal({
                        ...serviceCardModal,
                        data: {
                          ...serviceCardModal.data,
                          title: e.target.value,
                        },
                      })
                    }
                    className={inputCls}
                  />
                </div>

                {/* Target Route */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Route / URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /services?item=bathroom-cleaning"
                    value={serviceCardModal.data.targetUrl || ""}
                    onChange={(e) =>
                      setServiceCardModal({
                        ...serviceCardModal,
                        data: {
                          ...serviceCardModal.data,
                          targetUrl: e.target.value,
                        },
                      })
                    }
                    className={inputCls}
                  />
                </div>

                {/* Image Upload or URL */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Service Image
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold cursor-pointer hover:bg-purple-100 transition-colors w-full">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setServiceCardModal({
                                ...serviceCardModal,
                                file,
                                data: {
                                  ...serviceCardModal.data,
                                  image: reader.result as string,
                                },
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={serviceCardModal.data.image || ""}
                      onChange={(e) =>
                        setServiceCardModal({
                          ...serviceCardModal,
                          data: {
                            ...serviceCardModal.data,
                            image: e.target.value,
                          },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Card Visual Preview */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">
                    Live Thumbnail Preview
                  </span>
                  <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                      <SectionCardImage
                        src={serviceCardModal.data.image}
                        packageId={
                          serviceCardModal.data.packageId ||
                          serviceCardModal.data.id
                        }
                        title={serviceCardModal.data.title || "Service"}
                        badgeSize="w-10 h-10 text-base rounded-xl"
                        fallback="SC"
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {serviceCardModal.data.title || "Service Title Preview"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-xs">
                        {serviceCardModal.data.targetUrl || "/services"}
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                        {serviceCardModal.data.image
                          ? "Custom Image"
                          : "Title Initials Badge"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSavingServiceCard}
                  onClick={() =>
                    setServiceCardModal({
                      open: false,
                      mode: "add",
                      sectionId: "",
                      data: {},
                      file: null,
                    })
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingServiceCard}
                  onClick={saveServiceCard}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-colors shadow-lux"
                >
                  {isSavingServiceCard ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {serviceCardModal.mode === "add"
                          ? "Adding Card..."
                          : "Updating Card..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>
                        {serviceCardModal.mode === "add"
                          ? "Save Service Card"
                          : "Update Service Card"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
