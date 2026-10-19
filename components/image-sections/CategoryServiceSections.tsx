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
  getQuickServiceSectionOptionsApi,
  updateQuickServiceSectionsApi,
  ApiQuickServiceSectionSectionPayload,
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
  onSaveSectionsToBackend?: (
    sections: CategorySectionData[]
  ) => Promise<{ success: boolean; message?: string }>;
  onRefreshSections?: () => Promise<void>;
  isCategorySectionsLoading?: boolean;
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
  onSaveSectionsToBackend,
  onRefreshSections,
  isCategorySectionsLoading = false,
}: CategoryServiceSectionsProps) {
  // Category Section Modal states (Single Multi-Select Dropdown, Max 2)
  const [categorySectionModal, setCategorySectionModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: Partial<CategorySectionData>;
  }>({ open: false, mode: "add", data: {} });

  const [catModalSelectedCategoryId, setCatModalSelectedCategoryId] = useState<string>("");
  const [catModalTitle, setCatModalTitle] = useState<string>("");
  const [catModalSubtitle, setCatModalSubtitle] = useState<string>("");
  const [catModalBadge, setCatModalBadge] = useState<string>("Top Rated");
  const [catModalSortOrder, setCatModalSortOrder] = useState<number>(1);
  const [catModalIsActive, setCatModalIsActive] = useState<boolean>(true);
  const [catModalPackages, setCatModalPackages] = useState<any[]>([]);
  const [catModalSelectedPkgIds, setCatModalSelectedPkgIds] = useState<string[]>([]);
  const [catModalPackageSearch, setCatModalPackageSearch] = useState<string>("");
  const [isCatModalPackagesLoading, setIsCatModalPackagesLoading] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [catDropdownSearch, setCatDropdownSearch] = useState("");
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // Add Package Modal states (Show Packages on Add Service Card)
  const [addPackageModal, setAddPackageModal] = useState<{
    open: boolean;
    sectionId: string;
  }>({ open: false, sectionId: "" });
  const [addModalPackages, setAddModalPackages] = useState<any[]>([]);
  const [isAddModalPackagesLoading, setIsAddModalPackagesLoading] = useState(false);
  const [addModalSearch, setAddModalSearch] = useState("");
  const [isAddingPackageId, setIsAddingPackageId] = useState<string | null>(null);
  const [isSavingSection, setIsSavingSection] = useState(false);

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

  const fetchPackagesForCategory = async (
    categoryId: string,
    preselectedIds?: string[]
  ) => {
    if (!categoryId) {
      setCatModalPackages([]);
      if (preselectedIds === undefined) {
        setCatModalSelectedPkgIds([]);
      }
      return;
    }
    setIsCatModalPackagesLoading(true);
    try {
      // Fetch options directly from GET /api/quick-service-sections/options?categoryIds=...
      const res = await getQuickServiceSectionOptionsApi([categoryId], true);
      const list: any[] = [];
      if (res && res.success && Array.isArray(res.data)) {
        for (const group of res.data) {
          const cat = group.category || {};
          const pkgs = Array.isArray(group.packages) ? group.packages : [];
          for (const p of pkgs) {
            list.push({
              _id: p._id,
              packageId: p._id,
              packageName: p.packageName,
              price: p.price,
              originalPrice: p.originalPrice,
              duration: p.duration,
              imageUrl: p.imageUrl,
              thumbnailUrl: p.imageUrl,
              categoryId: cat._id,
              categoryName: cat.categoryName,
              serviceAction: p.serviceAction,
              category: cat,
            });
          }
        }
      }

      // If options returned no packages, fallback to getPackagesApi
      if (list.length === 0) {
        const fallbackRes = await getPackagesApi({ categoryId, limit: 100 });
        if (fallbackRes && fallbackRes.success && Array.isArray(fallbackRes.data)) {
          list.push(...fallbackRes.data);
        }
      }

      // Also merge with catalogPackages if available
      if (catalogPackages && catalogPackages.length > 0) {
        const matchingCatalog = catalogPackages.filter(
          (cp) =>
            cp.category?.id === categoryId &&
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
            categoryId: cp.category?.id,
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
        // Auto-select all available packages for new selection
        setCatModalSelectedPkgIds(unique.map((p) => p._id || p.packageId));
      }
    } catch (err) {
      console.error("Failed to load category packages :", err);
      setCatModalPackages([]);
    } finally {
      setIsCatModalPackagesLoading(false);
    }
  };

  const handleSelectCategory = (cat: ApiCategory) => {
    setCatModalSelectedCategoryId(cat._id);
    setIsCatDropdownOpen(false);
    setCatDropdownSearch("");

    const prevCat = apiCategories.find((c) => c._id === catModalSelectedCategoryId);
    if (!catModalTitle || (prevCat && catModalTitle === prevCat.categoryName)) {
      setCatModalTitle(cat.categoryName);
    }
    setCatModalSubtitle(
      `Verified ${cat.categoryName} packages & doorstep repair solutions in Varanasi`
    );
    fetchPackagesForCategory(cat._id);
  };

  const openAddCategorySectionModal = () => {
    if (apiCategories.length === 0) {
      fetchCategories();
    }
    if (categorySections.length >= 2) {
      alert(
        "Maximum 2 Category Service Sections are supported on the home page. Please edit an existing section or delete one to add a new category."
      );
      return;
    }

    const usedCatIds = categorySections.map(
      (s) => (s.categoryIds && s.categoryIds[0]) || s.id
    );
    const availableCategory =
      apiCategories.find((c) => !usedCatIds.includes(c._id)) || apiCategories[0] || null;

    const chosenCatId = availableCategory ? availableCategory._id : "";
    setCatModalSelectedCategoryId(chosenCatId);
    setCatModalTitle(availableCategory ? availableCategory.categoryName : "");
    setCatModalSubtitle(
      availableCategory
        ? `Verified ${availableCategory.categoryName} packages & doorstep repair solutions in Varanasi`
        : ""
    );
    setCatModalBadge("Top Rated");
    setCatModalSortOrder(categorySections.length + 1);
    setCatModalIsActive(true);
    setCatModalPackageSearch("");
    setIsCatDropdownOpen(false);
    setCatDropdownSearch("");
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

    if (chosenCatId) {
      fetchPackagesForCategory(chosenCatId);
    }
  };

  const openEditCategorySectionModal = (section: CategorySectionData) => {
    if (apiCategories.length === 0) {
      fetchCategories();
    }
    let catId = (section.categoryIds && section.categoryIds[0]) || section.id;
    if (catId.startsWith("catsec-") && apiCategories.length > 0) {
      const match = apiCategories.find(
        (c) =>
          section.categorySlug?.toLowerCase().includes(c.slug.toLowerCase()) ||
          section.title.toLowerCase().includes(c.categoryName.toLowerCase())
      );
      if (match) catId = match._id;
    }

    setCatModalSelectedCategoryId(catId);
    setCatModalTitle(section.title);
    setCatModalSubtitle(
      section.subtitle ||
        `Verified ${section.title} packages & doorstep repair solutions in Varanasi`
    );
    setCatModalBadge(section.badge || "Top Rated");
    setCatModalSortOrder(section.sortOrder || 1);
    setCatModalIsActive(section.isActive ?? true);
    setCatModalPackageSearch("");
    setIsCatDropdownOpen(false);
    setCatDropdownSearch("");

    const existingPkgIds = (section.services || []).map(
      (s) => s.packageId || s.id
    ).filter(Boolean);
    setCatModalSelectedPkgIds(existingPkgIds);

    setCategorySectionModal({
      open: true,
      mode: "edit",
      data: { ...section },
    });

    if (catId) {
      fetchPackagesForCategory(catId, existingPkgIds);
    }
  };

  const saveCategorySection = async () => {
    if (isSavingSection) return;
    if (!catModalSelectedCategoryId) {
      alert("Please select a category from the API.");
      return;
    }
    const selectedCat = apiCategories.find((c) => c._id === catModalSelectedCategoryId);
    if (!selectedCat) {
      alert("Selected category not found in API list.");
      return;
    }

    setIsSavingSection(true);
    try {
      let sectionsPayload: ApiQuickServiceSectionSectionPayload[] = [];

      if (categorySectionModal.mode === "add") {
        if (categorySections.length >= 2) {
          alert(
            "Maximum 2 Category Service Sections are allowed by the backend schema. Please edit or delete an existing section."
          );
          setIsSavingSection(false);
          return;
        }

        const existingSections = categorySections
          .filter(
            (s) =>
              s.id !== catModalSelectedCategoryId &&
              s.categoryIds?.[0] !== catModalSelectedCategoryId
          )
          .map((s) => ({
            categoryId: s.categoryIds?.[0] || s.id,
            packageIds: s.services
              .map((svc) => svc.packageId || svc.id)
              .filter(Boolean),
          }))
          .filter((s) => s.categoryId && !s.categoryId.startsWith("catsec-"));

        sectionsPayload = [
          ...existingSections,
          { categoryId: catModalSelectedCategoryId, packageIds: catModalSelectedPkgIds },
        ].slice(0, 2);
      } else {
        const editingId = categorySectionModal.data.id;
        sectionsPayload = categorySections
          .map((sec) => {
            if (sec.id === editingId) {
              return {
                categoryId: catModalSelectedCategoryId,
                packageIds: catModalSelectedPkgIds,
              };
            }
            return {
              categoryId: sec.categoryIds?.[0] || sec.id,
              packageIds: sec.services
                .map((svc) => svc.packageId || svc.id)
                .filter(Boolean),
            };
          })
          .filter((s) => s.categoryId && !s.categoryId.startsWith("catsec-"))
          .slice(0, 2);
      }

      const res = await updateQuickServiceSectionsApi(sectionsPayload);
      if (res && res.success) {
        if (onRefreshSections) {
          await onRefreshSections();
        }
        setCategorySectionModal({ open: false, mode: "add", data: {} });
      } else {
        alert(res?.message || "Failed to save category service sections to backend.");
      }
    } catch (err: any) {
      console.error("Failed to save section:", err);
      alert(err?.message || "An error occurred while saving.");
    } finally {
      setIsSavingSection(false);
    }
  };

  const moveCategorySection = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categorySections.length) return;
    const copy = [...categorySections];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    const reordered = copy.map((sec, i) => ({ ...sec, sortOrder: i + 1 }));
    onUpdateCategorySections(() => reordered);

    if (onSaveSectionsToBackend) {
      await onSaveSectionsToBackend(reordered);
    }
  };

  const toggleCategorySection = (id: string) => {
    onUpdateCategorySections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, isActive: !sec.isActive } : sec))
    );
  };

  const fetchPackagesForAddModal = async (sectionId: string) => {
    const targetSec = categorySections.find((s) => s.id === sectionId);
    if (!targetSec) return;

    let catId = (targetSec.categoryIds && targetSec.categoryIds[0]) || targetSec.id;
    if (catId.startsWith("catsec-") && apiCategories.length > 0) {
      const match = apiCategories.find(
        (c) =>
          targetSec.categorySlug?.toLowerCase().includes(c.slug.toLowerCase()) ||
          targetSec.title.toLowerCase().includes(c.categoryName.toLowerCase())
      );
      if (match) catId = match._id;
    }

    setIsAddModalPackagesLoading(true);
    try {
      const res = await getQuickServiceSectionOptionsApi([catId], true);
      const list: any[] = [];
      if (res && res.success && Array.isArray(res.data)) {
        for (const group of res.data) {
          const cat = group.category || {};
          const pkgs = Array.isArray(group.packages) ? group.packages : [];
          for (const p of pkgs) {
            list.push({
              _id: p._id,
              packageId: p._id,
              packageName: p.packageName,
              price: p.price,
              originalPrice: p.originalPrice,
              duration: p.duration,
              imageUrl: p.imageUrl,
              thumbnailUrl: p.imageUrl,
              categoryId: cat._id,
              categoryName: cat.categoryName,
              serviceAction: p.serviceAction,
            });
          }
        }
      }

      if (list.length === 0) {
        const fallbackRes = await getPackagesApi({ categoryId: catId, limit: 100 });
        if (fallbackRes && fallbackRes.success && Array.isArray(fallbackRes.data)) {
          list.push(...fallbackRes.data);
        }
      }

      if (catalogPackages && catalogPackages.length > 0) {
        const matchingCatalog = catalogPackages.filter(
          (cp) =>
            cp.category?.id === catId &&
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
            categoryId: cp.category?.id,
            categoryName: cp.category?.name,
          });
        });
      }

      const unique = Array.from(
        new Map(list.map((p) => [p._id || p.packageId, p])).values()
      );
      setAddModalPackages(unique);
    } catch (err) {
      console.error("Failed to load packages for add modal:", err);
      setAddModalPackages([]);
    } finally {
      setIsAddModalPackagesLoading(false);
    }
  };

  const openAddPackageModal = (sectionId: string) => {
    setAddPackageModal({ open: true, sectionId });
    setAddModalSearch("");
    fetchPackagesForAddModal(sectionId);
  };

  const handleTogglePackageInSection = async (pkg: any) => {
    const targetSectionId = addPackageModal.sectionId;
    const targetSec = categorySections.find((s) => s.id === targetSectionId);
    if (!targetSec) return;

    const pkgId = pkg._id || pkg.packageId;
    const isAlreadyIn = targetSec.services.some(
      (s) => (s.packageId || s.id) === pkgId
    );

    setIsAddingPackageId(pkgId);
    try {
      let updatedSections: CategorySectionData[];
      if (isAlreadyIn) {
        updatedSections = categorySections.map((sec) =>
          sec.id === targetSectionId
            ? {
                ...sec,
                services: sec.services.filter(
                  (s) => (s.packageId || s.id) !== pkgId
                ),
              }
            : sec
        );
      } else {
        const newService: SimpleServiceCard = {
          id: pkgId,
          packageId: pkgId,
          title: pkg.packageName,
          image:
            formatImageUrl(pkg.imageUrl || pkg.thumbnailUrl, pkgId) ||
            `/api/media/package/${pkgId}/image`,
          targetUrl: `/services/${targetSec.categorySlug || "services"}?packageId=${pkgId}`,
          price: String(pkg.price || 0),
          originalPrice: String(pkg.originalPrice || 0),
          duration: pkg.duration || 30,
        };
        updatedSections = categorySections.map((sec) =>
          sec.id === targetSectionId
            ? { ...sec, services: [...sec.services, newService] }
            : sec
        );
      }

      onUpdateCategorySections(() => updatedSections);

      if (onSaveSectionsToBackend) {
        await onSaveSectionsToBackend(updatedSections);
      }
    } catch (err) {
      console.error("Failed to toggle package in section:", err);
    } finally {
      setIsAddingPackageId(null);
    }
  };

  const moveServiceCard = async (
    sectionId: string,
    index: number,
    direction: "left" | "right"
  ) => {
    const sec = categorySections.find((s) => s.id === sectionId);
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (!sec || targetIndex < 0 || targetIndex >= sec.services.length) return;

    const copyServices = [...sec.services];
    const temp = copyServices[index];
    copyServices[index] = copyServices[targetIndex];
    copyServices[targetIndex] = temp;

    const updated = categorySections.map((s) =>
      s.id === sectionId ? { ...s, services: copyServices } : s
    );
    onUpdateCategorySections(() => updated);

    if (onSaveSectionsToBackend) {
      await onSaveSectionsToBackend(updated);
    }
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
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest uppercase bg-brand-500/30 text-brand-300 border border-brand-400/30 px-2 py-0.5 rounded-md">
              WEBSITE CORE SLIDERS
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Backend API
            </span>
          </div>
          <h2 className="text-xl font-black mt-1 text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <span>Category Service Sections</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
            Horizontal multi-service sliders shown on the Varanasi home page.
            Persisted via <code className="text-brand-300 font-mono text-[11px]">/api/quick-service-sections</code> (Max 2 Categories).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            suppressHydrationWarning
            className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15"
          >
            {categorySections.length}/2 Categories •{" "}
            {categorySections.reduce((acc, s) => acc + s.services.length, 0)} Total Services
          </span>
          {onRefreshSections && (
            <button
              type="button"
              onClick={onRefreshSections}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Refresh sections from backend"
            >
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Sections List or Loading / Empty states */}
      {isCategorySectionsLoading && categorySections.length === 0 ? (
        <div className="space-y-4">
          <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-800" />
          <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-800" />
        </div>
      ) : filteredCategorySections.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No Category Service Sections Configured
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Select up to 2 categories and choose packages to showcase as horizontal sliders on the home page.
          </p>
          <button
            type="button"
            onClick={openAddCategorySectionModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Configure Category Sections</span>
          </button>
        </div>
      ) : (
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
                  onClick={() => openAddPackageModal(section.id)}
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

                    {/* Action buttons footer: Move Left, Move Right, Remove (No Edit option in package) */}
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
                  onClick={() => openAddPackageModal(section.id)}
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
      )}

      {/* ─── CATEGORY SECTION MODAL (SINGLE CATEGORY & PACKAGE SELECTION) ─── */}
      {categorySectionModal.open && (() => {
        const selectedCat = apiCategories.find(
          (c) => c._id === catModalSelectedCategoryId
        ) || null;

        const filteredDropdownCategories = apiCategories.filter(
          (cat) =>
            !catDropdownSearch.trim() ||
            cat.categoryName
              .toLowerCase()
              .includes(catDropdownSearch.toLowerCase()) ||
            cat.slug.toLowerCase().includes(catDropdownSearch.toLowerCase())
        );

        const displayedPackages = catModalPackages.filter((pkg: any) => {
          if (!catModalPackageSearch.trim()) return true;
          const q = catModalPackageSearch.toLowerCase();
          return (
            pkg.packageName?.toLowerCase().includes(q) ||
            pkg.serviceAction?.serviceAction?.toLowerCase().includes(q) ||
            pkg.subtitle?.toLowerCase().includes(q)
          );
        });

        const derivedSeeAllUrl = selectedCat
          ? `/search?view=packages&category=${encodeURIComponent(
              catModalTitle || selectedCat.categoryName
            )}&categoryId=${selectedCat._id}`
          : "/search?view=packages";

        const usedCategoriesInOtherSections = categorySections
          .filter(
            (sec) =>
              categorySectionModal.mode === "add" ||
              sec.id !== categorySectionModal.data.id
          )
          .map((sec) => (sec.categoryIds && sec.categoryIds[0]) || sec.id);

        return (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-50 to-purple-100 dark:from-brand-950/60 dark:to-purple-950/40 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-300 shadow-xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                        <span>
                          {categorySectionModal.mode === "add"
                            ? "Add Category Service Section"
                            : "Edit Category Service Section"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Single Category
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select a category and choose which packages appear in the home page horizontal slider
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
                <div className="p-6 space-y-5 overflow-y-auto">
                  {/* ─── 1. SINGLE CATEGORY SELECTION ─── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-brand-600" />
                        <span>Select Service Category *</span>
                      </label>
                      <span className="text-[10px] font-bold text-slate-400">
                        1 Category per Slider Section
                      </span>
                    </div>

                    {/* Selected Category Card Preview OR Selector Button */}
                    {selectedCat && !isCatDropdownOpen ? (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/70 via-brand-50/40 to-slate-50 dark:from-purple-950/30 dark:via-brand-950/20 dark:to-slate-800/40 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-white dark:bg-slate-800 border border-purple-200/60 dark:border-purple-700/60 flex items-center justify-center shadow-xs">
                            {selectedCat.iconUrl ? (
                              <img
                                src={selectedCat.iconUrl}
                                alt={selectedCat.categoryName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-brand-600 to-purple-600 text-white font-black text-sm flex items-center justify-center">
                                {selectedCat.categoryName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                {selectedCat.categoryName}
                              </h4>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                {selectedCat.slug}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                              <span>
                                {selectedCat.subCategories?.length || 0} sub-categories
                              </span>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> Active Selection
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsCatDropdownOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Change Category</span>
                        </button>
                      </div>
                    ) : (
                      /* Category Picker Popover */
                      <div ref={catDropdownRef} className="relative">
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-brand-500 ring-2 ring-brand-500/10 shadow-md space-y-2.5">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Search category by name or slug..."
                              value={catDropdownSearch}
                              onChange={(e) => setCatDropdownSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                            />
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                            {filteredDropdownCategories.length === 0 ? (
                              <div className="text-center py-4 text-xs text-slate-400">
                                No categories match your search.
                              </div>
                            ) : (
                              filteredDropdownCategories.map((cat) => {
                                const isSelected = cat._id === catModalSelectedCategoryId;
                                const isUsedInOther = usedCategoriesInOtherSections.includes(cat._id);

                                return (
                                  <div
                                    key={cat._id}
                                    onClick={() => handleSelectCategory(cat)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer ${
                                      isSelected
                                        ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-brand-600">
                                        {cat.iconUrl ? (
                                          <img
                                            src={cat.iconUrl}
                                            alt={cat.categoryName}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          cat.categoryName.slice(0, 2).toUpperCase()
                                        )}
                                      </div>
                                      <div>
                                        <span>{cat.categoryName}</span>
                                        <span className="text-[10px] text-slate-400 font-normal ml-2">
                                          ({cat.subCategories?.length || 0} sub-cats)
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {isUsedInOther && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                          In Other Section
                                        </span>
                                      )}
                                      {isSelected ? (
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-brand-600 text-white flex items-center gap-1">
                                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {selectedCat && (
                            <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => setIsCatDropdownOpen(false)}
                                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                              >
                                Keep Current ({selectedCat.categoryName})
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── 2. PACKAGE SELECT OPTION FOR THIS CATEGORY ─── */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Package Select Option</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                            {catModalSelectedPkgIds.length} of {catModalPackages.length} selected
                          </span>
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Choose active packages from this category to feature as cards in the slider
                        </p>
                      </div>

                      {catModalPackages.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const ids = displayedPackages.map(
                                (p: any) => p._id || p.packageId
                              );
                              setCatModalSelectedPkgIds((prev) =>
                                Array.from(new Set([...prev, ...ids]))
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const idsSet = new Set(
                                displayedPackages.map((p: any) => p._id || p.packageId)
                              );
                              setCatModalSelectedPkgIds((prev) =>
                                prev.filter((id) => !idsSet.has(id))
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            Deselect All
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Package Search Bar (if more than 3 packages) */}
                    {catModalPackages.length > 3 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Filter packages by name..."
                          value={catModalPackageSearch}
                          onChange={(e) => setCatModalPackageSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    )}

                    {/* Package List or Shimmer */}
                    {isCatModalPackagesLoading ? (
                      <CategoryModalPackageShimmer count={4} />
                    ) : !catModalSelectedCategoryId ? (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        Please select a category above to load its packages.
                      </div>
                    ) : catModalPackages.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-600 dark:text-slate-300">
                          No active packages found in this category
                        </p>
                        <p className="text-[11px]">
                          Add packages in the Services manager to display them here.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                        {displayedPackages.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400">
                            No packages match &ldquo;{catModalPackageSearch}&rdquo;.
                          </div>
                        ) : (
                          displayedPackages.map((pkg: any) => {
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
                                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                                  isChecked
                                    ? "border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 shadow-xs"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={togglePkg}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded accent-brand-600 cursor-pointer shrink-0"
                                  />
                                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                    <SectionCardImage
                                      src={pkg.imageUrl || pkg.thumbnailUrl}
                                      packageId={pkgId}
                                      title={pkg.packageName}
                                      badgeSize="w-8 h-8 text-[11px]"
                                      fallback="PK"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                                      {pkg.packageName}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
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
                                      {pkg.serviceAction?.serviceAction && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                          {pkg.serviceAction.serviceAction}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <span
                                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors ${
                                      isChecked
                                        ? "bg-brand-600 text-white shadow-xs"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    {isChecked ? "Selected" : "Add"}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* ─── 3. SECTION PRESENTATION & SETTINGS ─── */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-black text-slate-900 dark:text-white block">
                      Slider Presentation Details
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Slider Headline / Title *
                        </label>
                        <input
                          type="text"
                          placeholder={selectedCat?.categoryName || "e.g. AC Repair & Service"}
                          value={catModalTitle}
                          onChange={(e) => setCatModalTitle(e.target.value)}
                          className={inputCls}
                        />
                      </div>

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

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          placeholder="Verified packages & doorstep solutions in Varanasi"
                          value={catModalSubtitle}
                          onChange={(e) => setCatModalSubtitle(e.target.value)}
                          className={inputCls}
                        />
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

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="catsec-modal-active"
                          checked={catModalIsActive}
                          onChange={(e) => setCatModalIsActive(e.target.checked)}
                          className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                        />
                        <label
                          htmlFor="catsec-modal-active"
                          className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          Show on home page (Active Slider)
                        </label>
                      </div>
                    </div>

                    {/* Live See All Route Preview */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                      <span>Target See All Route:</span>
                      <span className="font-mono font-bold text-brand-600 truncate max-w-xs">
                        {derivedSeeAllUrl}
                      </span>
                    </div>
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
                            ? "Saving Slider..."
                            : "Updating Slider..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>
                          {categorySectionModal.mode === "add"
                            ? "Save Category Section"
                            : "Update Category Section"}
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

      {/* ─── ADD PACKAGES MODAL (SHOW PACKAGES ON ADD SERVICE CARD) ─── */}
      {addPackageModal.open && (() => {
        const targetSec =
          categorySections.find((s) => s.id === addPackageModal.sectionId) ||
          null;
        const currentServiceIds = new Set(
          (targetSec?.services || []).map((s) => s.packageId || s.id)
        );

        const displayedAddPackages = addModalPackages.filter((pkg: any) => {
          if (!addModalSearch.trim()) return true;
          const q = addModalSearch.toLowerCase();
          return (
            pkg.packageName?.toLowerCase().includes(q) ||
            pkg.serviceAction?.serviceAction?.toLowerCase().includes(q) ||
            pkg.subtitle?.toLowerCase().includes(q)
          );
        });

        return (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-50 to-purple-100 dark:from-brand-950/60 dark:to-purple-950/40 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-300 shadow-xs">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                        <span>Add Packages to Slider</span>
                        {targetSec && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {targetSec.title}
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select active packages from this category to display in the Varanasi home page slider
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddPackageModal({ open: false, sectionId: "" })}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  {/* Category Section Switcher if more than 1 section */}
                  {categorySections.length > 1 && (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Target Section:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {categorySections.map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              setAddPackageModal({ open: true, sectionId: sec.id });
                              fetchPackagesForAddModal(sec.id);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              sec.id === addPackageModal.sectionId
                                ? "bg-brand-600 text-white shadow-xs font-black"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {sec.title} ({sec.services.length})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search packages by name or service action..."
                      value={addModalSearch}
                      onChange={(e) => setAddModalSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Packages List */}
                  {isAddModalPackagesLoading ? (
                    <CategoryModalPackageShimmer count={4} />
                  ) : addModalPackages.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-6 space-y-2">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No packages found for this category
                      </p>
                      <p className="text-xs text-slate-500">
                        Add packages to this category under the Services catalog first.
                      </p>
                    </div>
                  ) : displayedAddPackages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No packages match &ldquo;{addModalSearch}&rdquo;.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                      {displayedAddPackages.map((pkg: any) => {
                        const pkgId = pkg._id || pkg.packageId;
                        const isAlreadyIn = currentServiceIds.has(pkgId);
                        const isBusy = isAddingPackageId === pkgId;

                        return (
                          <div
                            key={pkgId}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isAlreadyIn
                                ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                <SectionCardImage
                                  src={pkg.imageUrl || pkg.thumbnailUrl}
                                  packageId={pkgId}
                                  title={pkg.packageName}
                                  badgeSize="w-8 h-8 text-xs"
                                  fallback="PK"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                                  {pkg.packageName}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    ₹{pkg.price}
                                  </span>
                                  {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                    <span className="text-slate-400 line-through text-[10px]">
                                      ₹{pkg.originalPrice}
                                    </span>
                                  )}
                                  {pkg.duration && (
                                    <span className="text-slate-400 text-[10px]">
                                      • {pkg.duration} mins
                                    </span>
                                  )}
                                  {pkg.serviceAction?.serviceAction && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      {pkg.serviceAction.serviceAction}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isAlreadyIn ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleTogglePackageInSection(pkg)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-600 dark:bg-emerald-950/40 dark:hover:bg-rose-950/40 dark:text-emerald-300 dark:hover:text-rose-300 border border-emerald-200 hover:border-rose-200 dark:border-emerald-800 dark:hover:border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 group/btn"
                                  title="Click to remove from slider"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[3] group-hover/btn:hidden" />
                                      <Trash2 className="w-3.5 h-3.5 hidden group-hover/btn:inline" />
                                    </>
                                  )}
                                  <span className="group-hover/btn:hidden">Added</span>
                                  <span className="hidden group-hover/btn:inline">Remove</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleTogglePackageInSection(pkg)}
                                  className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:border-brand-300"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                  )}
                                  <span>Add to Slider</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-500">
                    {targetSec?.services.length || 0} packages currently in this slider
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAddPackageModal({ open: false, sectionId: "" })}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-brand-600 hover:bg-brand-700 cursor-pointer transition-colors shadow-lux"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Portal>
        );
      })()}
    </div>
  );
}
