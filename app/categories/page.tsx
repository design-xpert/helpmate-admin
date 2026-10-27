"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { Portal } from "@/components/Portal";
import { TableImage } from "@/components/TableImage";
import {
  initialCategories,
  CategoryItem,
} from "@/lib/mockData";
import {
  getCategoriesApi,
  getSubcategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  toggleCategoryStatusApi,
  ApiCategory,
  formatImageUrl,
} from "@/lib/api";
import { CustomSelect } from "@/components/CustomSelect";
import { StatusDropdown } from "@/components/StatusDropdown";
import { ShimmerRow, ShimmerCardGrid } from "@/components/ShimmerLoader";
import {
  Sliders,
  Plus,
  CheckCircle2,
  X,
  Wrench,
  Edit,
  Layers,
  Upload,
  ArrowRight,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react";

function CategoryIconDisplay({ iconUrl, name, sizeClassName = "w-full h-full" }: { iconUrl?: string; name: string; sizeClassName?: string }) {
  return (
    <TableImage
      src={iconUrl}
      alt={name || "Category Icon"}
      containerClassName={`${sizeClassName} flex items-center justify-center relative overflow-hidden`}
      className="w-full h-full object-contain"
      fallbackIcon="image"
    />
  );
}

import { getCachedModuleData, getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";

export default function CategoriesPage() {
  // Tab State: "masterTable" is 1st tab & default active
  const [activeCategoryTab, setActiveCategoryTab] = useState<"masterTable" | "serviceIcons">("masterTable");

  const initialCached = getStoredModuleData<CategoryItem[]>("categories");
  const [categories, setCategories] = useState<CategoryItem[]>(() => initialCached || []);
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !(isModuleCacheFresh("categories", 30000) && initialCached && initialCached.length > 0)
  );

  // Fetch Categories from Backend API
  const fetchCategoriesFromBackend = async (force: boolean = false) => {
    // If cache is fresh (< 30s) and not forced, DO NOT CALL API AT ALL!
    if (!force && isModuleCacheFresh("categories", 30000)) {
      const cached = getStoredModuleData<CategoryItem[]>("categories");
      if (cached && cached.length > 0) {
        setCategories(cached);
        setIsLoading(false);
        return;
      }
    }

    if (categories.length === 0 && (!initialCached || initialCached.length === 0)) {
      setIsLoading(true);
    }
    try {
      const res = await getCategoriesApi({ forceRefresh: force });
      if (res && res.success !== false && res.data && Array.isArray(res.data)) {
        const mapped: CategoryItem[] = res.data.map((c: ApiCategory) => {
          const apiIcon = c.iconUrl || (c as any).icon || (c._id ? `/api/media/category/${c._id}/icon` : "");
          return {
            id: c._id,
            name: c.categoryName,
            slug: c.slug,
            icon: "Wrench",
            iconUrl: apiIcon,
            subcategories: c.subCategories ? c.subCategories.map((sub) => sub.name) : [],
            subCategoriesObj: c.subCategories || [],
            subcategoriesCount: c.subCategories ? c.subCategories.length : 0,
            servicesCount: 0,
            status: c.status ? "Active" : "Inactive",
          };
        });
        setCategories(mapped);
        setCachedModuleData("categories", mapped);
      }
    } catch (err) {
      console.error("fetchCategoriesFromBackend error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isModuleCacheFresh("categories", 30000) && initialCached && initialCached.length > 0) {
      setIsLoading(false);
      return;
    }
    fetchCategoriesFromBackend();
  }, []);

  // Add / Edit Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; cat: CategoryItem } | null>(null);

  const handleDeleteCategory = (cat: CategoryItem) => {
    setDeleteModal({ open: true, cat });
  };

  const confirmDeleteCategory = async () => {
    if (!deleteModal) return;
    const catToDelete = deleteModal.cat;

    if (catToDelete.id.length === 24) {
      await deleteCategoryApi(catToDelete.id);
    }
    setCategories((prev) => prev.filter((c) => c.id !== catToDelete.id));
    if (editingCategory?.id === catToDelete.id) {
      setIsDrawerOpen(false);
    }
    setDeleteModal(null);
  };

  const [updatingCatStatusId, setUpdatingCatStatusId] = useState<string | null>(null);

  const handleToggleCategoryStatus = async (cat: CategoryItem, targetStatusBool?: boolean) => {
    const newStatusBool =
      typeof targetStatusBool === "boolean" ? targetStatusBool : cat.status !== "Active";
    const newStatusStr: "Active" | "Inactive" = newStatusBool ? "Active" : "Inactive";

    setUpdatingCatStatusId(cat.id);
    try {
      if (cat.id.length === 24) {
        await toggleCategoryStatusApi(cat.id, newStatusBool);
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, status: newStatusStr } : c))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingCatStatusId(null);
    }
  };

  // Form States
  const [catName, setCatName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("Wrench");
  const [primaryIconUrl, setPrimaryIconUrl] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  // Subcategories Multi-Add & Edit Form State
  const [subcategoriesList, setSubcategoriesList] = useState<Array<{ _id?: string; name: string; imageUrl?: string; iconUrl?: string }>>([]);
  const [subCategoryInput, setSubCategoryInput] = useState("");
  const [subCategoryImageUrl, setSubCategoryImageUrl] = useState("");
  const [editingSubcatIndex, setEditingSubcatIndex] = useState<number | null>(null);
  const [editingSubcatName, setEditingSubcatName] = useState("");
  const [editingSubcatImageUrl, setEditingSubcatImageUrl] = useState("");
  const [isSubcategoryLoading, setIsSubcategoryLoading] = useState<boolean>(false);

  const handleSubcategoryImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSubCategoryImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubcategoryImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setEditingSubcatImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubcategoryTag = () => {
    if (!subCategoryInput.trim()) return;
    const tag = subCategoryInput.trim();
    const img = subCategoryImageUrl.trim();
    if (!subcategoriesList.some((s) => s.name.toLowerCase() === tag.toLowerCase())) {
      setSubcategoriesList([...subcategoriesList, { name: tag, imageUrl: img || undefined, iconUrl: img || undefined }]);
    }
    setSubCategoryInput("");
    setSubCategoryImageUrl("");
  };

  const handleRemoveSubcategoryTag = (index: number) => {
    setSubcategoriesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartEditSubcategory = (index: number) => {
    setEditingSubcatIndex(index);
    setEditingSubcatName(subcategoriesList[index]?.name || "");
    setEditingSubcatImageUrl(subcategoriesList[index]?.imageUrl || subcategoriesList[index]?.iconUrl || "");
  };

  const handleSaveSubcategoryInline = (index: number) => {
    if (!editingSubcatName.trim()) {
      setEditingSubcatIndex(null);
      setEditingSubcatName("");
      setEditingSubcatImageUrl("");
      return;
    }
    const updated = [...subcategoriesList];
    const img = editingSubcatImageUrl.trim();
    updated[index] = {
      ...updated[index],
      name: editingSubcatName.trim(),
      imageUrl: img || undefined,
      iconUrl: img || undefined,
    };
    setSubcategoriesList(updated);
    setEditingSubcatIndex(null);
    setEditingSubcatName("");
    setEditingSubcatImageUrl("");
  };

  const fetchSubcategoriesForCategory = async (catId: string) => {
    if (!catId || catId.length !== 24) return;
    setIsSubcategoryLoading(true);
    try {
      const subRes = await getSubcategoriesApi(catId, true);
      if (subRes && subRes.success && Array.isArray(subRes.data)) {
        const fetchedSubs: Array<{ _id?: string; name: string; imageUrl?: string; iconUrl?: string }> = subRes.data.map((item: any) => ({
          _id: item._id || item.id,
          name: item.name || item.subCategoryName || "",
          imageUrl: item.imageUrl || item.iconUrl || item.icon || "",
          iconUrl: item.iconUrl || item.imageUrl || item.icon || "",
        }));
        setSubcategoriesList(fetchedSubs);
      }
    } catch (err) {
      console.error("Error fetching subcategories via API:", err);
    } finally {
      setIsSubcategoryLoading(false);
    }
  };

  const openAddDrawer = () => {
    setEditingCategory(null);
    setCatName("");
    setSlug("");
    setIcon("Wrench");
    setPrimaryIconUrl("");
    setStatus("Active");
    setSubcategoriesList([]);
    setSubCategoryInput("");
    setSubCategoryImageUrl("");
    setEditingSubcatIndex(null);
    setEditingSubcatName("");
    setEditingSubcatImageUrl("");
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || "Wrench");
    setPrimaryIconUrl(cat.iconUrl || "");
    setStatus(cat.status);
    setEditingSubcatIndex(null);
    setEditingSubcatName("");
    setEditingSubcatImageUrl("");
    setSubCategoryImageUrl("");

    const initialSubs: Array<{ _id?: string; name: string; imageUrl?: string; iconUrl?: string }> = (cat as any).subCategoriesObj && (cat as any).subCategoriesObj.length > 0
      ? (cat as any).subCategoriesObj.map((s: any) =>
          typeof s === "string"
            ? { name: s }
            : {
                _id: s._id,
                name: s.name || s.subCategoryName || "",
                imageUrl: s.imageUrl || s.iconUrl || "",
                iconUrl: s.iconUrl || s.imageUrl || "",
              }
        )
      : (cat.subcategories || []).map((s) => (typeof s === "string" ? { name: s } : { name: (s as any).name, imageUrl: (s as any).imageUrl, iconUrl: (s as any).iconUrl }));

    setSubcategoriesList(initialSubs);
    setSubCategoryInput("");
    setIsDrawerOpen(true);

    if (cat.id && cat.id.length === 24) {
      fetchSubcategoriesForCategory(cat.id);
    }
  };

  const handleIconUpload = (catId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId
            ? {
              ...c,
              iconUrl: result,
            }
            : c
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingCategory) return;
    if (!catName.trim()) return;

    setIsSavingCategory(true);
    try {
      let updatedSubs = [...subcategoriesList];
      if (editingSubcatIndex !== null && editingSubcatIndex >= 0 && editingSubcatIndex < updatedSubs.length) {
        if (editingSubcatName.trim()) {
          const img = editingSubcatImageUrl.trim();
          updatedSubs[editingSubcatIndex] = {
            ...updatedSubs[editingSubcatIndex],
            name: editingSubcatName.trim(),
            imageUrl: img || undefined,
            iconUrl: img || undefined,
          };
        }
      }

      if (subCategoryInput.trim()) {
        const tag = subCategoryInput.trim();
        const img = subCategoryImageUrl.trim();
        if (!updatedSubs.some((s) => s.name.toLowerCase() === tag.toLowerCase())) {
          updatedSubs.push({ name: tag, imageUrl: img || undefined, iconUrl: img || undefined });
        }
      }

      const finalSlug = slug.trim() || catName.trim().toLowerCase().replace(/\s+/g, "-");
      const subCatsPayload = updatedSubs
        .filter((item) => item.name && item.name.trim())
        .map((item) => ({
          ...(item._id ? { _id: item._id } : {}),
          name: item.name.trim(),
          ...(item.imageUrl ? { imageUrl: item.imageUrl.trim() } : {}),
          ...(item.iconUrl ? { iconUrl: item.iconUrl.trim() } : {}),
        }));

      if (editingCategory) {
        if (editingCategory.id.length === 24) {
          await updateCategoryApi(editingCategory.id, {
            categoryName: catName.trim(),
            slug: finalSlug,
            iconUrl: primaryIconUrl,
            subCategories: subCatsPayload,
            status: status === "Active",
          });
          await fetchCategoriesFromBackend();
        } else {
          const updatedList = categories.map((c) =>
            c.id === editingCategory.id
              ? {
                ...c,
                name: catName,
                slug: finalSlug,
                icon,
                iconUrl: primaryIconUrl,
                status,
                subcategories: subCatsPayload.map((s) => s.name),
                subCategoriesObj: subCatsPayload,
                subcategoriesCount: subCatsPayload.length,
              }
              : c
          );
          setCategories(updatedList);
        }
      } else {
        const apiRes = await createCategoryApi({
          categoryName: catName.trim(),
          slug: finalSlug,
          iconUrl: primaryIconUrl,
          subCategories: subCatsPayload,
          status: status === "Active",
        });

        if (apiRes.success && apiRes.data) {
          await fetchCategoriesFromBackend();
        } else {
          const newCat: CategoryItem = {
            id: `cat-${Date.now()}`,
            name: catName,
            slug: finalSlug,
            icon,
            iconUrl: primaryIconUrl,
            subcategories: subCatsPayload.map((s) => s.name),
            subCategoriesObj: subCatsPayload,
            subcategoriesCount: subCatsPayload.length,
            servicesCount: 0,
            status,
          };
          setCategories([newCat, ...categories]);
        }
      }

      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Save category error:", err);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const catColumns: Column<CategoryItem>[] = [
    {
      key: "name",
      header: "Category Title & Primary Icon",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <TableImage
            src={row.iconUrl || (row.id && row.id.length === 24 ? `/api/media/category/${row.id}/icon` : "")}
            alt={row.name}
            containerClassName="w-10 h-10 rounded-2xl overflow-hidden border-2 border-purple-500 bg-slate-50 dark:bg-slate-800 shadow-sm shrink-0 flex items-center justify-center p-0.5 relative group"
            fallbackIcon="image"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 dark:text-white text-xs">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">slug: /{row.slug}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "subcategories",
      header: "Subcategories",
      accessor: (row) => {
        const subsObj = (row.subCategoriesObj && row.subCategoriesObj.length > 0)
          ? row.subCategoriesObj
          : (row.subcategories || []).map((s) => ({ name: s }));
        if (subsObj.length === 0) {
          return <span className="text-xs text-slate-400 italic">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5 items-center max-w-sm">
            {subsObj.map((sub, idx) => {
              const imgUrl = (sub as any).imageUrl || (sub as any).iconUrl;
              return (
                <span
                  key={(sub as any)._id || sub.name || idx}
                  className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-extrabold text-[10px] border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 shadow-2xs"
                >
                  {imgUrl ? (
                    <div className="relative w-3.5 h-3.5 rounded overflow-hidden border border-purple-300 dark:border-purple-700 shrink-0">
                      <Image
                        src={imgUrl}
                        alt={sub.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Layers className="w-2.5 h-2.5 shrink-0" />
                  )}
                  <span>{sub.name}</span>
                </span>
              );
            })}
          </div>
        );
      },
    },

    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <StatusDropdown
          status={row.status || "Active"}
          isUpdating={updatingCatStatusId === row.id}
          onChange={(newStatus) =>
            handleToggleCategoryStatus(row, newStatus === "Active")
          }
          title="Click to change category status"
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: row.status === "Active" ? "Set Inactive" : "Set Active",
              icon: CheckCircle2,
              onClick: () => handleToggleCategoryStatus(row),
            },
            {
              label: "Edit",
              icon: Edit,
              onClick: () => openEditDrawer(row),
            },
            // {
            //   label: "Delete",
            //   icon: Trash2,
            //   onClick: () => handleDeleteCategory(row),
            //   danger: true,
            // },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-600" />
            <span>Category </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            View the Master Category Table or manage custom dual-tone SVG/image icons for Air Conditioner, Appliances, Cleaning, Plumbing, Electrician, Carpenter, Painting & Pest Control.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddDrawer}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* TABS BAR: 1st Tab = "Master Category Table", 2nd Tab = "Main Service Icons" */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold w-fit">
        <button
          type="button"
          onClick={() => setActiveCategoryTab("masterTable")}
          className={`px-5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeCategoryTab === "masterTable"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          <Sliders className="w-4 h-4 text-brand-600" />
          <span>Master Category Table</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategoryTab("serviceIcons")}
          className={`px-5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${activeCategoryTab === "serviceIcons"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          <ImageIcon className="w-4 h-4 text-purple-600" />
          <span>Main Service Icons</span>
        </button>
      </div>

      {/* FIRST TAB: MASTER CATEGORY TABLE */}
      {activeCategoryTab === "masterTable" && (
        <div className="space-y-3">
          {isLoading ? (
            <ShimmerRow count={6} />
          ) : (
            <DataTable
              columns={catColumns}
              data={categories}
              searchPlaceholder="Search category title or slug..."
              disableDelete={true}
            />
          )}
        </div>
      )}

      {/* SECOND TAB: MAIN SERVICE ICONS (Visual 8-Card Grid matching Screenshot) */}
      {activeCategoryTab === "serviceIcons" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Main Service Icons Visual Manager
                </h2>
                <p className="text-xs text-slate-400">
                  Matches your app home screen cards layout. Upload custom SVG or PNG icons directly per category card!
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              {categories.length} Primary Icons
            </span>
          </div>

          {/* 4x2 Responsive Category Card Grid matching user's screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-slate-50/70 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between hover:shadow-2xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 relative group min-h-[260px]"
              >
                {/* TOP DUAL-TONE VECTOR / UPLOADED ICON PREVIEW BOX */}
                <div className="relative w-full h-36 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-4 shadow-xs group-hover:scale-103 transition-transform">
                  <CategoryIconDisplay iconUrl={cat.iconUrl} name={cat.name} sizeClassName="w-20 h-20" />
                </div>

                {/* PROMINENT ICON UPLOAD BAR */}
                <div className="pt-3 pb-2 flex items-center">
                  <label className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Icon</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIconUpload(cat.id, file);
                      }}
                    />
                  </label>
                </div>

                {/* BOTTOM TITLE AND ARROW */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {cat.name}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditDrawer(cat)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit Category Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLIDE-OVER ADD/EDIT CATEGORY DRAWER */}
      {isDrawerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <form
              onSubmit={handleSaveCategory}
              className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200 dark:border-brand-800 shadow-sm">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingCategory ? "Edit Category" : "Add Category"}
                    </h3>
                    <p className="text-xs text-slate-500">Configure category titles, custom primary icon, and 2nd image icon</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm block border-b border-slate-200 dark:border-slate-700 pb-2">
                    1. Master Category Details
                  </span>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Category Title *
                      </label>
                      <input
                        type="text"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        placeholder="e.g. Air Conditioner"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Slug URL
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="e.g. ac"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-brand-500"
                      />
                    </div>

                    <CustomSelect
                      label="Status *"
                      value={status}
                      onChange={(val) => setStatus(val as any)}
                      options={[
                        { value: "Active", label: "Active (Live on Website)" },
                        { value: "Inactive", label: "Inactive (Disabled)" },
                      ]}
                    />
                  </div>
                </div>

                {/* PRIMARY CATEGORY ICON & SECOND IMAGE ICON UPLOADS */}
                <div className="p-5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 space-y-4">
                  <span className="font-extrabold text-brand-900 dark:text-brand-300 text-sm block border-b border-brand-200 dark:border-brand-800 pb-2">
                    2. Primary Category Icon & Second Image Icon
                  </span>

                  {/* Primary Icon Upload */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Primary Category Icon Image</span>
                      <span className="text-brand-600 font-extrabold text-[10px] uppercase">Upload or URL</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1">
                        <CategoryIconDisplay iconUrl={primaryIconUrl} name={catName || editingCategory?.name || ""} />
                      </div>
                      <label className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer shrink-0 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Icon</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setPrimaryIconUrl(ev.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={primaryIconUrl.startsWith("blob:") || primaryIconUrl.startsWith("data:") ? "[Uploaded Icon File]" : primaryIconUrl}
                        onChange={(e) => setPrimaryIconUrl(e.target.value)}
                        placeholder="Icon image URL..."
                        className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[10px] outline-none"
                      />
                    </div>
                  </div>


                </div>

                {/* Subcategories Multi-Add & Edit Section */}
                <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                    <span className="font-extrabold text-purple-900 dark:text-purple-300 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Category Subcategories
                    </span>

                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-extrabold text-purple-900 dark:text-purple-300 block">
                      + Add New Subcategory
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subCategoryInput}
                          onChange={(e) => setSubCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSubcategoryTag();
                            }
                          }}
                          placeholder="Type subcategory name (e.g. Split AC)..."
                          className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubcategoryTag}
                          className="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/70 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-xl font-extrabold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>

                      {/* Subcategory Image Upload / URL Option */}
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-purple-100 dark:border-purple-900/40 space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Subcategory Image / Icon (Optional)
                        </span>
                        <div className="flex items-center gap-3">
                          {/* Preview Box */}
                          <div className="relative w-12 h-12 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center overflow-hidden shrink-0 group">
                            {subCategoryImageUrl ? (
                              <>
                                <Image
                                  src={subCategoryImageUrl}
                                  alt="Subcategory preview"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSubCategoryImageUrl("")}
                                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                  title="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <ImageIcon className="w-5 h-5 text-purple-400" />
                            )}
                          </div>

                          {/* Upload File & URL Inputs */}
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] transition-colors">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload File</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleSubcategoryImageUpload(file);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                              {subCategoryImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setSubCategoryImageUrl("")}
                                  className="text-[11px] text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  Clear
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={subCategoryImageUrl}
                              onChange={(e) => setSubCategoryImageUrl(e.target.value)}
                              placeholder="Or paste image URL (https://...)"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-purple-200/60 dark:border-purple-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Subcategories ({subcategoriesList.length}):
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium italic">
                        Click edit to customize name or image
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[36px]">
                      {subcategoriesList.length > 0 ? (
                        subcategoriesList.map((item, idx) => (
                          <div
                            key={item._id || `${item.name}-${idx}`}
                            className="w-full sm:w-auto inline-flex items-center"
                          >
                            {editingSubcatIndex === idx ? (
                              <div className="w-full sm:min-w-[320px] p-3 bg-white dark:bg-slate-800 border-2 border-purple-500 rounded-2xl shadow-sm space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-extrabold text-purple-900 dark:text-purple-300">
                                    Edit Subcategory
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSubcategoryInline(idx)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Save"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Save</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSubcatIndex(null);
                                        setEditingSubcatName("");
                                        setEditingSubcatImageUrl("");
                                      }}
                                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  value={editingSubcatName}
                                  onChange={(e) => setEditingSubcatName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSaveSubcategoryInline(idx);
                                    } else if (e.key === "Escape") {
                                      setEditingSubcatIndex(null);
                                      setEditingSubcatName("");
                                      setEditingSubcatImageUrl("");
                                    }
                                  }}
                                  autoFocus
                                  placeholder="Subcategory Name..."
                                  className="w-full p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                                />

                                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <div className="relative w-9 h-9 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center overflow-hidden shrink-0">
                                    {editingSubcatImageUrl ? (
                                      <Image
                                        src={editingSubcatImageUrl}
                                        alt="Editing preview"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                      />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-purple-400" />
                                    )}
                                  </div>

                                  <div className="flex-1 flex items-center gap-1.5">
                                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] shrink-0 transition-colors">
                                      <Upload className="w-3 h-3" />
                                      <span>Change</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleEditSubcategoryImageUpload(file);
                                          e.target.value = "";
                                        }}
                                      />
                                    </label>
                                    <input
                                      type="text"
                                      value={editingSubcatImageUrl}
                                      onChange={(e) => setEditingSubcatImageUrl(e.target.value)}
                                      placeholder="Or paste URL..."
                                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[10px] outline-none focus:border-purple-500"
                                    />
                                    {editingSubcatImageUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setEditingSubcatImageUrl("")}
                                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                        title="Remove image"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-extrabold text-xs flex items-center gap-2 shadow-xs group">
                                {item.imageUrl || item.iconUrl ? (
                                  <div className="relative w-5 h-5 rounded-md overflow-hidden border border-purple-200 dark:border-purple-700 shrink-0">
                                    <Image
                                      src={(item.imageUrl || item.iconUrl)!}
                                      alt={item.name}
                                      fill
                                      unoptimized
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                )}
                                <span>{item.name}</span>

                                <button
                                  type="button"
                                  onClick={() => handleStartEditSubcategory(idx)}
                                  className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors ml-0.5 cursor-pointer"
                                  title="Edit subcategory name & image"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubcategoryTag(idx)}
                                  className="text-slate-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                                  title="Remove subcategory"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No subcategories added yet. Type above to add subcategories.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-2.5 bg-slate-50 dark:bg-slate-800/40 shrink-0">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(editingCategory)}
                    className="p-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs transition-colors flex items-center justify-center cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={isSavingCategory}
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-extrabold text-xs shadow-lux transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingCategory ? "Updating Category..." : "Adding Category..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingCategory ? "Edit Category" : "Add Category"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal?.open && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Delete Category?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to delete <strong>{deleteModal.cat.name}</strong>? This action will remove it from your master category catalog.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCategory}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md cursor-pointer transition-colors"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
