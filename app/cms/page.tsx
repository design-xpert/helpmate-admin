"use client";

import { useState, useRef, useEffect } from "react";
import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { TableImage } from "@/components/TableImage";
import { Portal } from "@/components/Portal";
import { toast } from "@/components/Toast";
import { ServiceItem, ServiceAddon, VaranasiLocality } from "@/lib/mockData";
import {
  getPackagesApi,
  getPackageByIdApi,
  createPackageApi,
  updatePackageApi,
  deletePackageApi,
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  getAddonsApi,
  getAddonDropdownApi,
  createAddonApi,
  updateAddonApi,
  deleteAddonApi,
  toggleAddonStatusApi,
  getServiceActionsApi,
  getServiceActionDropdownApi,
  createServiceActionApi,
  updateServiceActionApi,
  deleteServiceActionApi,
  getLocalitiesApi,
  ApiCategory,
  ApiAddon,
  ApiServiceAction,
  ApiLocality,
  API_BASE_URL,
  formatImageUrl,
} from "@/lib/api";
import { ShimmerRow, ShimmerCardGrid } from "@/components/ShimmerLoader";
import { Wrench, Plus, CheckCircle2, MapPin, Tag, X, Filter, Sliders, Briefcase, Trash2, Link, Layers, AlertCircle, Edit, ChevronDown, FileImage, Upload, Megaphone, Eye, Flame, Image as ImageIcon, Link as LinkIcon, Copy } from "lucide-react";

function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (typeof val.categoryName === "string") return val.categoryName;
    if (typeof val.name === "string") return val.name;
    if (typeof val.serviceName === "string") return val.serviceName;
    if (typeof val.serviceAction === "string") return val.serviceAction;
    if (typeof val.title === "string") return val.title;
  }
  return "";
}

function safeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const point = item as Record<string, unknown>;
          return [point.text, point.value, point.name, point.title].find(
            (candidate): candidate is string => typeof candidate === "string"
          ) || "";
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [value];
    } catch {
      return [value];
    }
  }
  return [];
}

function cleanPackagePoints(items: string[] = []): string[] {
  return items
    .map((item) => item.trim().replace(/^[•-]\s*/, "").trim())
    .filter(Boolean);
}

interface ServiceOfferingRow {
  id: string;
  title: string;
  subtitle?: string;
  type?: string;
  price: number;
  originalPrice?: number;
  duration: string;
  description?: string;
  includeInPackage?: string[];
  excludeFromPackage?: string[];
  thumbnailUrl?: string;
  imageFile?: File;
  addonIds?: string[];
}

import { CustomSelect } from "@/components/CustomSelect";

export default function CmsPage() {
  const [categorySubcategoriesMap, setCategorySubcategoriesMap] = useState<Record<string, string[]>>({
    "AC Service & Repair": ["Split AC", "Window AC", "Cassette AC / Commercial", "Inverter AC", "Tower AC"],
    "Appliance Repair": ["Washing Machine", "Refrigerator", "Microwave", "Water Purifier (RO)", "Geyser"],
    "Electrical": ["MCB & Switchboard", "Wiring & Fuse", "Fan & Chandelier", "Inverter & Battery"],
    "Plumbing": ["Tap & Mixer", "Toilet & Tank", "Drain Unclogging", "Water Tank Deep Clean"],
    "Home Cleaning": ["Full House Deep Clean", "Bathroom Deep Clean", "Kitchen Degreasing", "Sofa & Carpet Scrub"],
    "Car & Bike Wash": ["Foam Car Wash", "Interior Detailing", "Bike Spa"],
    "Pest Control": ["Cockroach Control", "Termite Treatment", "Bed Bug Extermination"],
    "Home Salon": ["Ayurvedic Spa & Massage", "Facial & Cleanup", "Hair Styling", "Waxing & Threading"],
  });

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [newSubcategoryTag, setNewSubcategoryTag] = useState<string>("");
  const [isManageSubcategoriesOpen, setIsManageSubcategoriesOpen] = useState<boolean>(false);
  const [selectedCategoryForManage, setSelectedCategoryForManage] = useState<string>("AC Service & Repair");

  // Add Category Modal State (both Category & Subcategories can be added together)
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState<boolean>(false);
  const [newCatNameInput, setNewCatNameInput] = useState<string>("");
  const [newCatSubcategories, setNewCatSubcategories] = useState<string[]>([]);
  const [newCatSubInput, setNewCatSubInput] = useState<string>("");

  // Add Subcategory Modal State (Category is unchangeable / read-only)
  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState<boolean>(false);
  const [targetCategoryForSubcategory, setTargetCategoryForSubcategory] = useState<string>("AC Service & Repair");
  const [subCatInputForModal, setSubCatInputForModal] = useState<string>("");

  // API Data State
  const initialCachedCats = getStoredModuleData<ApiCategory[]>("cms_categories_api") || [];
  const initialCachedActions = getStoredModuleData<ApiServiceAction[]>("cms_service_actions") || [];

  const [categoriesFromApi, setCategoriesFromApi] = useState<ApiCategory[]>(() => initialCachedCats);
  const [serviceActionsFromApi, setServiceActionsFromApi] = useState<ApiServiceAction[]>(() => initialCachedActions);
  const [editingActionObj, setEditingActionObj] = useState<ApiServiceAction | null>(null);

  // Add Service Action Modal State
  const [serviceActionsList, setServiceActionsList] = useState<string[]>(() => {
    const names = initialCachedActions.map((a: any) => a.serviceAction || a.name || "").filter(Boolean);
    return Array.from(new Set(names));
  });
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState<boolean>(false);
  const [newActionInput, setNewActionInput] = useState<string>("");
  const [actionImageUrl, setActionImageUrl] = useState<string>("");
  const [targetOfferingIndexForAction, setTargetOfferingIndexForAction] = useState<number | null>(null);
  const [actionCategoryId, setActionCategoryId] = useState<string>("");
  const [actionSubCategoryId, setActionSubCategoryId] = useState<string>("");
  const [actionFormError, setActionFormError] = useState<string>("");
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);
  const [deleteActionModal, setDeleteActionModal] = useState<{ open: boolean; id: string; name: string } | null>(null);

  const handleActionImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setActionImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Enhanced Services state — live API data only (no manual mock data)
  const initialCachedServices = getStoredModuleData<ServiceItem[]>("cms_services");
  const [services, setServices] = useState<ServiceItem[]>(() => initialCachedServices || []);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [localities, setLocalities] = useState<VaranasiLocality[]>([]);
  const [activeTab, setActiveTab] = useState<"services" | "addons" | "pincodes">("services");
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialCachedServices || initialCachedServices.length === 0);

  // Category Filter Flow State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All Categories");
  const [selectedCategoryIdFilter, setSelectedCategoryIdFilter] = useState<string>("");

  const fetchServicesFromBackend = async (
    catsList?: ApiCategory[],
    force: boolean = false,
    categoryId?: string
  ) => {
    const activeCatId = categoryId !== undefined ? categoryId : selectedCategoryIdFilter;
    if (!force && !activeCatId && isModuleCacheFresh("cms_services", 30000) && services.length > 0) {
      setIsLoading(false);
      return;
    }
    // Keep the table mounted during background refreshes so its search and
    // pagination state survive package edits.
    if (services.length === 0 || activeCatId) {
      setIsLoading(true);
    }
    try {
      const catsToUse = (catsList && catsList.length > 0) ? catsList : categoriesFromApi;
      const params: any = { limit: 100, forceRefresh: force || Boolean(activeCatId) };
      if (activeCatId && activeCatId !== "all" && activeCatId !== "") {
        params.categoryId = activeCatId;
      }

      const pkgRes = await getPackagesApi(params);
      const rawPkgList = pkgRes?.data?.packages || (Array.isArray(pkgRes?.data) ? pkgRes.data : (Array.isArray(pkgRes) ? pkgRes : []));

      let rawList = rawPkgList;

      if (Array.isArray(rawList)) {
        if (rawList.length === 0) {
          setServices([]);
        } else {
          const validOffers = rawList.filter((s: any) => {
            const catObj = s.category;
            const subCatObj = catObj?.subCategory;
            const actObj = subCatObj?.serviceAction;
            const catName = safeStr(s.categoryName) || safeStr(catObj?.categoryName) || safeStr(s.category);
            const pkgTitle = safeStr(s.packageName) || safeStr(s.serviceName) || safeStr(actObj?.serviceName) || safeStr(s.title);
            return (catName && catName.trim().length > 0) || (pkgTitle && pkgTitle.trim().length > 0 && pkgTitle !== "Service");
          });

          const mapped: ServiceItem[] = validOffers.map((s: any) => {
            const nestedPackage = s.package && typeof s.package === "object" ? s.package : {};
            const includePoints = s.includeInPackage ?? nestedPackage.includeInPackage;
            const excludePoints = s.excludeFromPackage ?? nestedPackage.excludeFromPackage;
            const actObj = typeof s.serviceActionId === "object" && s.serviceActionId !== null ? s.serviceActionId : (typeof s.serviceAction === "object" && s.serviceAction !== null ? s.serviceAction : null);

            // Extract category & subcategory IDs stored in serviceActionId reference
            let categoryIdStr = typeof actObj?.categoryId === "object" ? (actObj.categoryId?._id || "") : (typeof actObj?.categoryId === "string" ? actObj.categoryId : (s.categoryId?._id || s.categoryId || ""));
            let subCategoryIdStr = typeof actObj?.subCategoryId === "object" ? (actObj.subCategoryId?._id || "") : (typeof actObj?.subCategoryId === "string" ? actObj.subCategoryId : (s.subCategoryId?._id || s.subCategoryId || ""));

            const actionVal = actObj?.serviceAction || actObj?.name || (typeof s.serviceAction === "string" ? s.serviceAction : (s.systemType?.[0] || ""));

            // Fallback lookup via serviceActionsFromApi if categoryIdStr missing
            if (!categoryIdStr && (s.serviceActionId || actionVal)) {
              const saId = typeof s.serviceActionId === "object" ? s.serviceActionId?._id : s.serviceActionId;
              const foundSa = serviceActionsFromApi.find(
                (sa: any) => (saId && sa._id === saId) || (actionVal && (sa.serviceAction === actionVal || sa.name === actionVal))
              );
              if (foundSa) {
                categoryIdStr = typeof foundSa.categoryId === "object" ? (foundSa.categoryId?._id || "") : (typeof foundSa.categoryId === "string" ? foundSa.categoryId : "");
                subCategoryIdStr = typeof foundSa.subCategoryId === "object" ? (foundSa.subCategoryId?._id || "") : (typeof foundSa.subCategoryId === "string" ? foundSa.subCategoryId : "");
              }
            }

            // Match category in catsToUse by ID or Name
            const foundCategory = catsToUse.find(
              (c) => (categoryIdStr && c._id === categoryIdStr) || (c.categoryName && c.categoryName.toLowerCase().trim() === safeStr(actObj?.categoryId?.categoryName || s.categoryName || s.category).toLowerCase().trim())
            );
            const categoryNameStr = foundCategory ? foundCategory.categoryName : (safeStr(actObj?.categoryId?.categoryName) || safeStr(s.categoryName) || safeStr(s.category) || "");

            // Match subcategory in foundCategory by ID or Name
            const foundSub = foundCategory?.subCategories?.find(
              (sub: any) => (subCategoryIdStr && sub._id === subCategoryIdStr) || (sub.name && sub.name.toLowerCase().trim() === safeStr(actObj?.subCategoryId?.name || s.subCategoryName || s.subcategory).toLowerCase().trim())
            );
            const subCategoryNameStr = foundSub ? foundSub.name : (safeStr(actObj?.subCategoryId?.name) || safeStr(s.subCategoryName) || safeStr(s.subcategory) || "");

            const titleStr = (
              safeStr(s.packageName) ||
              safeStr(s.serviceName) ||
              safeStr(actObj?.serviceName) ||
              safeStr(actObj?.serviceAction) ||
              safeStr(s.title) ||
              "Service Package"
            );

            const priceVal = s.price !== undefined ? Number(s.price) : 699;
            const origPriceVal = s.originalPrice !== undefined ? Number(s.originalPrice) : Math.round(priceVal * 1.3);
            const durationVal = typeof s.duration === "number" ? `${s.duration} mins` : (s.duration || "45 mins");
            const subtitleVal = s.subtitle ? safeStr(s.subtitle) : "";
            const descriptionVal = s.description ? safeStr(s.description) : `Expert ${titleStr} service with 30-day HelpMate guarantee`;

            const rawImg = s.imageUrl || s.thumbnailUrl || "";
            const thumbVal = rawImg;

            const rawAddons = s.addons || [];
            const mappedAddons = Array.isArray(rawAddons)
              ? rawAddons.map((a: any) => typeof a === "object" && a !== null ? { id: a._id || a.id, title: a.addonName || a.title || "Spare Part", price: a.price, unit: a.unit, category: a.category, imageUrl: a.imageUrl || a.thumbnailUrl || "", status: a.status ? "Active" : "Inactive" } : { id: String(a), title: "Spare Part", price: 199, unit: "Per Unit", category: "General", imageUrl: "", status: "Active" })
              : [];

            return {
              id: s._id,
              categoryId: categoryIdStr,
              subCategoryId: subCategoryIdStr,
              category: categoryNameStr,
              subcategory: subCategoryNameStr,
              title: titleStr,
              subtitle: subtitleVal,
              description: descriptionVal,
              price: priceVal,
              originalPrice: origPriceVal,
              includeInPackage: safeStringArray(includePoints),
              excludeFromPackage: safeStringArray(excludePoints),
              duration: durationVal,
              rating: 5.0,
              reviewsCount: 1,
              isInspectionBased: false,
              systemType: [actionVal],
              serviceAction: actionVal,
              thumbnailUrl: thumbVal,
              addons: mappedAddons as any,
              status: s.status !== false ? "Active" : "Inactive",
              createdBy: "Admin Coordinator",
              createdDate: "Just Now",
            };
          });
          setServices(mapped);
          if (!activeCatId) {
            setCachedModuleData("cms_services", mapped);
          }
        }
      }
    } catch (err) {
      console.error("fetchServicesFromBackend error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddonsFromBackend = async (catId?: string, subCatId?: string) => {
    try {
      let res;
      if (catId || subCatId) {
        res = await getAddonDropdownApi({ categoryId: catId, subCategoryId: subCatId, forceRefresh: true });
      } else {
        res = await getAddonsApi({ forceRefresh: true });
      }

      let rawList: any[] = [];
      if (res && res.success !== false) {
        if (Array.isArray(res.data)) {
          rawList = res.data;
        } else if (res.data?.addons && Array.isArray(res.data.addons)) {
          rawList = res.data.addons;
        } else if (Array.isArray(res)) {
          rawList = res;
        }
      }

      const mapped: ServiceAddon[] = rawList.map((a: any) => ({
        id: a._id || a.id,
        title: a.addonName || a.title || "Spare Part",
        price: a.price ?? 199,
        unit: a.unit || "Per Unit",
        category: a.category || a.categoryName || (typeof a.categoryId === "object" ? a.categoryId?.categoryName : "General"),
        description: a.description || "",
        imageUrl: a.imageUrl || a.thumbnailUrl || "",
        categoryId: typeof a.categoryId === "object" ? a.categoryId?._id : a.categoryId,
        subCategoryId: a.subCategoryId,
        status: a.status !== false ? "Active" : "Inactive",
      }));
      setAddons(mapped);
    } catch (e) {
      console.error("fetchAddonsFromBackend error:", e);
      setAddons([]);
    }
  };

  const fetchCategoriesFromBackend = async (force: boolean = false): Promise<ApiCategory[]> => {
    if (!force && isModuleCacheFresh("cms_categories_api", 30000) && categoriesFromApi.length > 0) {
      return categoriesFromApi;
    }
    try {
      const res = await getCategoriesApi();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCategoriesFromApi(res.data);
        setCachedModuleData("cms_categories_api", res.data);
        const newMap: Record<string, string[]> = {};
        res.data.forEach((cat: ApiCategory) => {
          newMap[cat.categoryName] = (cat.subCategories || []).map((sub: any) => sub.name);
        });
        setCategorySubcategoriesMap(newMap);
        return res.data;
      }
    } catch (e) {
      console.error("fetchCategoriesFromBackend error:", e);
    }
    return categoriesFromApi;
  };

  const fetchServiceActionsFromBackend = async (catId?: string, subCatId?: string, force: boolean = false) => {
    if (!force && !catId && !subCatId && isModuleCacheFresh("cms_service_actions", 30000) && serviceActionsFromApi.length > 0) {
      return;
    }
    try {
      let res;
      if (catId && subCatId) {
        res = await getServiceActionDropdownApi({ categoryId: catId, subCategoryId: subCatId });
      } else if (catId) {
        res = await getServiceActionDropdownApi({ categoryId: catId });
      } else {
        res = await getServiceActionsApi();
      }
      const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (res && res.success !== false) {
        setServiceActionsFromApi(rawList);
        const names = rawList.map((a: any) => a.serviceAction || a.name || "").filter(Boolean);
        setServiceActionsList(Array.from(new Set(names)));
        if (!catId && !subCatId) {
          setCachedModuleData("cms_service_actions", rawList);
        }
      }
    } catch (e) {
      console.error("fetchServiceActionsFromBackend error:", e);
    }
  };

  const fetchLocalitiesFromBackend = async () => {
    try {
      const res = await getLocalitiesApi({ forceRefresh: true });
      const rawList = res?.data?.localities || (Array.isArray(res?.data) ? res.data : []);
      if (res && res.success !== false) {
        const mapped: VaranasiLocality[] = rawList.map((l: ApiLocality) => ({
          id: l._id,
          name: l.localityName,
          pincode: l.pincode,
          activeBookings: 0,
          activeTechs: 0,
          status: l.status ? "Normal" : "High Demand",
          isServiceable: l.status !== false,
        }));
        setLocalities(mapped);
      }
    } catch (e) {
      console.error("fetchLocalitiesFromBackend error:", e);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      const cats = await fetchCategoriesFromBackend();
      await fetchServiceActionsFromBackend();
      await fetchServicesFromBackend(cats);
      fetchAddonsFromBackend();
      fetchLocalitiesFromBackend();
    };
    loadAllData();
  }, []);

  useEffect(() => {
    if (isAddActionModalOpen && actionCategoryId) {
      fetchServiceActionsFromBackend(actionCategoryId, actionSubCategoryId || undefined);
    }
  }, [isAddActionModalOpen, actionCategoryId, actionSubCategoryId]);

  const confirmDeleteServiceAction = async (id: string) => {
    if (!id) return;
    setDeletingActionId(id);
    try {
      const res = await deleteServiceActionApi(id);
      if (res && res.success !== false) {
        toast.success("Service Action Deleted", res?.message || "Service action deleted successfully.");
        if (editingActionObj?._id === id) {
          setEditingActionObj(null);
          setNewActionInput("");
          setActionCategoryId("");
          setActionSubCategoryId("");
        }
        setServiceActionsList((prev) => prev.filter((a) => a !== deleteActionModal?.name));
        await fetchServiceActionsFromBackend(actionCategoryId || undefined, actionSubCategoryId || undefined);
      } else {
        const errorMsg = res?.message || res?.error || res?.details || "Failed to delete service action.";
        toast.error("Delete Failed", errorMsg);
      }
    } catch (err: any) {
      console.error("Error deleting service action:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete service action.";
      toast.error("Delete Failed", errorMsg);
    } finally {
      setDeletingActionId(null);
      setDeleteActionModal(null);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (serviceId.length === 24) {
      await deletePackageApi(serviceId);
    }
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  const handleToggleServiceStatus = async (serviceId: string, currentStatus?: string) => {
    const newStatusBool = currentStatus !== "Active";
    const newStatusStr = newStatusBool ? "Active" : "Inactive";

    if (serviceId.length === 24) {
      await updatePackageApi(serviceId, { status: newStatusBool });
    }
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, status: newStatusStr } : s))
    );
  };

  const handleDeleteAddon = async (addonId: string) => {
    if (addonId.length === 24) {
      await deleteAddonApi(addonId);
    }
    setAddons((prev) => prev.filter((a) => a.id !== addonId));
  };

  const handleToggleAddonStatus = async (addonId: string, currentStatus?: string) => {
    const newStatusBool = currentStatus !== "Active";
    const newStatusStr: "Active" | "Inactive" = newStatusBool ? "Active" : "Inactive";

    if (addonId.length === 24) {
      await toggleAddonStatusApi(addonId, newStatusBool);
    }
    setAddons((prev) =>
      prev.map((a) => (a.id === addonId ? { ...a, status: newStatusStr } : a))
    );
  };

  // Website Visitor Promo Popup Banner State
  const [isBannerEnabled, setIsBannerEnabled] = useState(true);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [secondBannerIconUrl, setSecondBannerIconUrl] = useState("");
  const [targetLinkUrl, setTargetLinkUrl] = useState("https://helpmate-theta.vercel.app/services/ac");
  const [isBannerPreviewOpen, setIsBannerPreviewOpen] = useState(false);

  // Selected Service Details & Add-ons Modal State
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Category Filter Flow Actions
  const handleSelectCategoryFilter = async (catId: string, catName: string) => {
    setSelectedCategoryIdFilter(catId);
    setSelectedCategoryFilter(catName);
    setIsLoading(true);
    await fetchServicesFromBackend(categoriesFromApi, true, catId);
  };

  const categoriesList = [
    "All Categories",
    ...Array.from(new Set(categoriesFromApi.map((c) => c.categoryName).filter(Boolean))),
  ];

  // Helper to toggle linking an addon to a service
  const handleToggleLinkAddonToService = (serviceId: string, addon: ServiceAddon) => {
    setServices((prevServices) =>
      prevServices.map((srv) => {
        if (srv.id === serviceId) {
          const currentAddons = srv.addons || [];
          const exists = currentAddons.some((a) => a.id === addon.id);
          const updatedAddons = exists
            ? currentAddons.filter((a) => a.id !== addon.id)
            : [...currentAddons, addon];

          const updatedService = { ...srv, addons: updatedAddons };
          if (selectedService && selectedService.id === serviceId) {
            setSelectedService(updatedService);
          }
          return updatedService;
        }
        return srv;
      })
    );
  };

  const handleAddSubcategoryToCategory = async (catName: string, subName: string) => {
    if (!subName.trim()) return;
    const cleanSub = subName.trim();
    const existing = categorySubcategoriesMap[catName] || [];
    if (existing.includes(cleanSub)) return;

    const updated = [...existing, cleanSub];
    setCategorySubcategoriesMap((prev) => ({ ...prev, [catName]: updated }));
    setSelectedSubcategory(cleanSub);
    setNewSubcategoryTag("");

    const matchedCat = categoriesFromApi.find((c) => c.categoryName === catName);
    if (matchedCat && matchedCat._id) {
      try {
        await updateCategoryApi(matchedCat._id, {
          categoryName: matchedCat.categoryName,
          slug: matchedCat.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          subCategories: updated.map((s) => ({ name: s })),
          status: matchedCat.status !== false,
        });
        await fetchCategoriesFromBackend();
      } catch (err) {
        console.error("handleAddSubcategoryToCategory API error:", err);
      }
    }
  };

  const handleRemoveSubcategoryFromCategory = async (catName: string, subName: string) => {
    const existing = categorySubcategoriesMap[catName] || [];
    const updated = existing.filter((s) => s !== subName);
    setCategorySubcategoriesMap((prev) => ({ ...prev, [catName]: updated }));

    const matchedCat = categoriesFromApi.find((c) => c.categoryName === catName);
    if (matchedCat && matchedCat._id) {
      try {
        await updateCategoryApi(matchedCat._id, {
          categoryName: matchedCat.categoryName,
          slug: matchedCat.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          subCategories: updated.map((s) => ({ name: s })),
          status: matchedCat.status !== false,
        });
        await fetchCategoriesFromBackend();
      } catch (err) {
        console.error("handleRemoveSubcategoryFromCategory API error:", err);
      }
    }
  };

  const handleToggleTrending = (serviceId: string) => {
    setServices((prev) =>
      prev.map((srv) => (srv.id === serviceId ? { ...srv, isTrending: !srv.isTrending } : srv))
    );
  };

  const serviceColumns: Column<ServiceItem>[] = [
    {
      key: "thumbnailUrl",
      header: "Thumbnail",
      accessor: (row) => (
        <TableImage
          src={row.thumbnailUrl || (row as any).imageUrl}
          alt={row.title}
          fallbackIcon="wrench"
        />
      ),
    },
    {
      key: "title",
      header: "Service Package Title",
      accessor: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedService(row)}
              className="font-extrabold text-slate-900 dark:text-white hover:text-brand-600 text-left transition-colors"
            >
              {row.title}
            </button>
            <button
              type="button"
              onClick={() => openEditServiceDrawer(row)}
              className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg cursor-pointer transition-colors"
              title="Edit Service Package"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            {row.isTrending && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white shadow-xs">
                🔥 BEST SELLER
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 max-w-xs truncate">{row.subtitle}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category & Subcategory",
      accessor: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="font-extrabold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded text-[10px] border border-brand-200 dark:border-brand-800">
            {row.category}
          </span>
          {row.subcategory && (
            <span className="font-bold text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <Layers className="w-2.5 h-2.5 text-purple-500" />
              {row.subcategory}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "price",
      header: "Price (₹)",
      accessor: (row) => (
        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
          ₹{row.price}
        </span>
      ),
    },
    {
      key: "addons",
      header: "Linked Spare Part Add-ons",
      accessor: (row) => (
        <div className="flex flex-wrap gap-1 items-center">
          {row.addons && row.addons.length > 0 ? (
            row.addons.map((a) => (
              <span
                key={a.id}
                className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-extrabold text-[10px] border border-purple-200 dark:border-purple-800 flex items-center gap-1"
              >
                <Tag className="w-2.5 h-2.5" />
                {a.title} (₹{a.price})
              </span>
            ))
          ) : (
            <button
              type="button"
              onClick={() => setSelectedService(row)}
              className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              <Link className="w-3 h-3" /> + Link Spare Parts
            </button>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3" /> {row.status}
        </span>
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
              onClick: () => handleToggleServiceStatus(row.id, row.status),
            },
            {
              label: row.isTrending ? "Remove Trending" : "Set Trending",
              icon: Flame,
              onClick: () => handleToggleTrending(row.id),
            },
            {
              label: "Edit",
              icon: Edit,
              onClick: () => openEditServiceDrawer(row),
            },
            {
              label: "Add-ons",
              icon: Wrench,
              onClick: () => setSelectedService(row),
            },
            {
              label: "Delete",
              icon: Trash2,
              onClick: () => handleDeleteService(row.id),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const addonColumns: Column<ServiceAddon>[] = [
    {
      key: "imageUrl",
      header: "Image",
      accessor: (row) => (
        <TableImage
          src={row.imageUrl}
          alt={row.title}
          fallbackIcon="image"
          containerClassName="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center relative"
        />
      ),
    },
    {
      key: "title",
      header: "Add-on Title",
      accessor: (row) => <span className="font-extrabold text-slate-900 dark:text-white">{row.title}</span>,
    },
    {
      key: "price",
      header: "Unit Price (₹)",
      accessor: (row) => (
        <span className="font-bold text-slate-900 dark:text-white">
          ₹{row.price} / {row.unit}
        </span>
      ),
    },
    {
      key: "category",
      header: "Associated Category",
      accessor: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-700 dark:text-slate-300">
          {row.category}
        </span>
      ),
    },
    {
      key: "connectedServices",
      header: "Connected Services",
      accessor: (row) => {
        const connected = services.filter((s) => s.addons?.some((a) => a.id === row.id));
        return (
          <div className="flex flex-wrap gap-1 items-center">
            {connected.length > 0 ? (
              connected.map((s) => (
                <span
                  key={s.id}
                  className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold text-[10px] border border-brand-200 dark:border-brand-800"
                >
                  {s.title}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic text-[10px]">Not Linked to Services</span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {row.status}
        </span>
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
              onClick: () => handleToggleAddonStatus(row.id, row.status),
            },
            {
              label: "Edit Add-on",
              icon: Edit,
              onClick: () => openEditAddonDrawer(row),
            },
            {
              label: "Delete Add-on",
              icon: Trash2,
              onClick: () => handleDeleteAddon(row.id),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const pincodeColumns: Column<VaranasiLocality>[] = [
    {
      key: "name",
      header: "Locality / Zone",
      accessor: (row) => <span className="font-extrabold text-slate-900 dark:text-white">{row.name}</span>,
    },
    {
      key: "pincode",
      header: "Pincode",
      accessor: (row) => <span className="font-mono font-bold text-brand-600">{row.pincode}</span>,
    },
    {
      key: "activeBookings",
      header: "Active Booking Load",
      accessor: (row) => <span className="font-bold text-slate-700 dark:text-slate-300">{row.activeBookings} Bookings</span>,
    },
    {
      key: "status",
      header: "Serviceability Status",
      accessor: () => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3" /> Serviceable
        </span>
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
              label: "Edit Locality",
              icon: Edit,
              onClick: () => setIsAddPincodeOpen(true),
            },
            {
              label: "Delete Locality",
              icon: Trash2,
              onClick: () => setLocalities(localities.filter((l) => l.id !== row.id)),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddAddonOpen, setIsAddAddonOpen] = useState(false);
  const [isAddPincodeOpen, setIsAddPincodeOpen] = useState(false);

  // Step 1 State: Master Category & Option to Add New Category
  const [serviceCategory, setServiceCategory] = useState("");
  const [serviceThumbnail, setServiceThumbnail] = useState("");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Top-level Service Action selection in Add/Edit Drawer
  const [selectedServiceAction, setSelectedServiceAction] = useState<string>("");

  // Step 2 State: Multiple Add Sub-Service Offerings with Price & Duration & Package Addons
  const [serviceOfferings, setServiceOfferings] = useState<ServiceOfferingRow[]>([
    {
      id: `offering-${Date.now()}`,
      title: "",
      price: 699,
      duration: "45 mins",
      addonIds: [],
    },
  ]);

  // Inline Add Addon inside Package Card State
  const [inlineAddonPackageIndex, setInlineAddonPackageIndex] = useState<number | null>(null);
  const [inlineAddonTitle, setInlineAddonTitle] = useState("");
  const [inlineAddonPrice, setInlineAddonPrice] = useState("199");
  const [inlineAddonUnit, setInlineAddonUnit] = useState("Per Unit");
  const [inlineAddonDescription, setInlineAddonDescription] = useState("");
  const [inlineAddonImageUrl, setInlineAddonImageUrl] = useState("");

  const handleSaveInlineAddonForPackage = async (packageIndex: number) => {
    if (!inlineAddonTitle.trim()) {
      toast.error("Part Name Required", "Please enter a part name.");
      return;
    }

    const matchedCat = categoriesFromApi.find(
      (c) => c.categoryName === serviceCategory || c._id === serviceCategory
    ) || categoriesFromApi[0];

    const matchedSub = matchedCat?.subCategories?.find(
      (s: any) => s.name === selectedSubcategory || s._id === selectedSubcategory
    ) || matchedCat?.subCategories?.[0];

    const catIdToUse = matchedCat?._id || "";
    const subCatIdToUse = matchedSub?._id || "";

    try {
      const res = await createAddonApi({
        categoryId: catIdToUse,
        subCategoryId: subCatIdToUse,
        addonName: inlineAddonTitle.trim(),
        title: inlineAddonTitle.trim(),
        description: inlineAddonDescription.trim() || `Addon for ${matchedCat?.categoryName || serviceCategory}`,
        price: parseFloat(inlineAddonPrice) || 199,
        unit: inlineAddonUnit || "Per Unit",
        imageUrl: inlineAddonImageUrl.trim(),
        category: matchedCat?.categoryName || serviceCategory,
        status: true,
      });

      const apiData = res.data || res;
      const newAddonItem: ServiceAddon = {
        id: apiData._id || apiData.id || `adn-${Date.now()}`,
        title: apiData.addonName || apiData.title || inlineAddonTitle.trim(),
        price: apiData.price ?? (parseFloat(inlineAddonPrice) || 199),
        unit: apiData.unit || inlineAddonUnit || "Per Unit",
        category: apiData.category || serviceCategory || "General",
        imageUrl: apiData.imageUrl || inlineAddonImageUrl.trim(),
        status: apiData.status !== false ? "Active" : "Inactive",
      };

      await fetchAddonsFromBackend(catIdToUse, subCatIdToUse);

      const currentOffering = serviceOfferings[packageIndex];
      if (currentOffering) {
        const existingIds = currentOffering.addonIds || [];
        if (!existingIds.includes(newAddonItem.id)) {
          handleUpdateOfferingRow(packageIndex, "addonIds", [...existingIds, newAddonItem.id]);
        }
      }

      setInlineAddonTitle("");
      setInlineAddonPrice("199");
      setInlineAddonUnit("Per Unit");
      setInlineAddonDescription("");
      setInlineAddonImageUrl("");
      setInlineAddonPackageIndex(null);
      setInlineAddonPackageIndex(null);
    } catch (err) {
      console.error("Failed to create inline addon:", err);
    }
  };

  // Standalone Add/Edit Addon Form State
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonTitle, setAddonTitle] = useState("");
  const [addonPrice, setAddonPrice] = useState("199");
  const [addonUnit, setAddonUnit] = useState("Per Unit");
  const [addonCategory, setAddonCategory] = useState("");
  const [addonCategoryId, setAddonCategoryId] = useState("");
  const [addonSubCategory, setAddonSubCategory] = useState("");
  const [addonSubCategoryId, setAddonSubCategoryId] = useState("");
  const [addonDescription, setAddonDescription] = useState("");
  const [addonImageUrl, setAddonImageUrl] = useState("");

  const openAddAddonDrawer = (defaultCatId?: string, defaultSubCatId?: string) => {
    setEditingAddonId(null);
    setAddonTitle("");
    setAddonPrice("199");
    setAddonUnit("Per Unit");
    setAddonDescription("");
    setAddonImageUrl("");

    const initialCat = (categoriesFromApi.length > 0 ? categoriesFromApi : []).find(
      (c) => c._id === defaultCatId || c.categoryName === serviceCategory
    ) || categoriesFromApi[0];

    const initialCatName = initialCat?.categoryName || serviceCategory || "";
    setAddonCategory(initialCatName);
    setAddonCategoryId(initialCat?._id || "");

    const initialSub = initialCat?.subCategories?.find(
      (s: any) => s._id === defaultSubCatId || s.name === selectedSubcategory
    ) || initialCat?.subCategories?.[0];

    setAddonSubCategory(initialSub?.name || selectedSubcategory || "");
    setAddonSubCategoryId(initialSub?._id || "");

    setIsAddAddonOpen(true);
  };

  const openEditAddonDrawer = (item: any) => {
    setEditingAddonId(item.id || item._id);
    setAddonTitle(item.title || item.addonName || "");
    setAddonPrice(String(item.price || 199));
    setAddonUnit(item.unit || "Per Unit");
    setAddonDescription(item.description || "");
    setAddonImageUrl(item.imageUrl || "");

    const matchedCat = categoriesFromApi.find(
      (c) => c._id === item.categoryId || c.categoryName === item.category
    );
    const catName = matchedCat ? matchedCat.categoryName : (item.category || "AC Service & Repair");
    setAddonCategory(catName);
    setAddonCategoryId(matchedCat?._id || item.categoryId || "");

    const matchedSub = matchedCat?.subCategories?.find(
      (s: any) => s._id === item.subCategoryId || s.name === item.subcategory
    );
    setAddonSubCategory(matchedSub?.name || "");
    setAddonSubCategoryId(matchedSub?._id || item.subCategoryId || "");

    setIsAddAddonOpen(true);
  };

  // Add Pincode Form State
  const [pincodeLocality, setPincodeLocality] = useState("");
  const [pincodeCode, setPincodeCode] = useState("221005");

  const handleAddOfferingRow = () => {
    setServiceOfferings([
      ...serviceOfferings,
      {
        id: `offering-${Date.now()}`,
        title: "",
        subtitle: "",
        price: 699,
        originalPrice: undefined,
        duration: "45 mins",
        description: "",
        includeInPackage: ["• "],
        excludeFromPackage: ["• "],
        addonIds: [],
      },
    ]);
  };

  const handleUpdateOfferingRow = (index: number, field: keyof ServiceOfferingRow, value: any) => {
    const updated = [...serviceOfferings];
    updated[index] = { ...updated[index], [field]: value };
    setServiceOfferings(updated);
  };

  const handlePackageListEnter = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
    field: "includeInPackage" | "excludeFromPackage"
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertion = value.length === 0 ? "• " : "\n• ";
    const updatedValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
    const updatedItems = updatedValue.split("\n");

    handleUpdateOfferingRow(index, field, updatedItems);
    window.requestAnimationFrame(() => {
      const caretPosition = start + insertion.length;
      textarea.setSelectionRange(caretPosition, caretPosition);
    });
  };

  const handlePackageListChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
    index: number,
    field: "includeInPackage" | "excludeFromPackage"
  ) => {
    const textarea = event.currentTarget;
    const input = textarea.value;
    const caret = textarea.selectionStart;
    const lines = input.split("\n");
    let caretAdjustment = 0;
    let lineStart = 0;

    const updatedItems = lines.map((line) => {
      const needsBullet = line.trim().length > 0 && !/^[•-]\s*/.test(line);
      if (needsBullet && lineStart <= caret) caretAdjustment += 2;
      const updatedLine = needsBullet ? `• ${line}` : line;
      lineStart += line.length + 1;
      return updatedLine;
    });

    if (input.length === 0) updatedItems[0] = "• ";
    handleUpdateOfferingRow(index, field, updatedItems);

    if (caretAdjustment > 0) {
      window.requestAnimationFrame(() => {
        const nextCaret = caret + caretAdjustment;
        textarea.setSelectionRange(nextCaret, nextCaret);
      });
    }
  };

  const handleRemoveOfferingRow = (index: number) => {
    setServiceOfferings(serviceOfferings.filter((_, i) => i !== index));
  };

  const handleDuplicateOfferingRow = (index: number) => {
    const target = serviceOfferings[index];
    if (!target) return;
    const duplicatedRow: ServiceOfferingRow = {
      ...target,
      id: `offering-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${target.title} (Copy)`,
      addonIds: [...(target.addonIds || [])],
    };
    const updated = [...serviceOfferings];
    updated.splice(index + 1, 0, duplicatedRow);
    setServiceOfferings(updated);
    toast.success("Package Duplicated", `Created a copy of "${target.title}".`);
  };

  const handleDuplicateServiceItem = (item: ServiceItem) => {
    openEditServiceDrawer(item);
    setEditingServiceId(null);
    setServiceOfferings((prev) =>
      prev.map((off) => ({
        ...off,
        id: `offering-${Date.now()}`,
        title: `${off.title} (Copy)`,
      }))
    );
    toast.success("Package Duplicated", "Package cloned into creation form for quick update.");
  };

  const toggleDescriptionFormat = (idx: number, formatType: "bold" | "bullet") => {
    const currentText = serviceOfferings[idx]?.description || "";

    if (formatType === "bold") {
      const hasBold = /<b>.*?<\/b>/i.test(currentText) || currentText.includes("**");
      if (hasBold) {
        const stripped = currentText.replace(/<\/?b>/gi, "").replace(/\*\*/g, "");
        handleUpdateOfferingRow(idx, "description", stripped);
      } else {
        if (currentText.trim()) {
          const bolded = `<b>${currentText.trim()}</b>`;
          handleUpdateOfferingRow(idx, "description", bolded);
        } else {
          handleUpdateOfferingRow(idx, "description", "<b>Bold Highlight</b>");
        }
      }
    } else if (formatType === "bullet") {
      const lines = currentText.split("\n");
      const hasBullets = lines.some((l) => l.trim().startsWith("•") || l.trim().startsWith("-"));

      if (hasBullets) {
        const strippedLines = lines.map((l) => l.replace(/^[\s•\-]+/, ""));
        handleUpdateOfferingRow(idx, "description", strippedLines.join("\n"));
      } else {
        if (currentText.trim()) {
          const bulletedLines = lines.map((l) => (l.trim() ? `• ${l.trim().replace(/^•\s*/, "")}` : l));
          handleUpdateOfferingRow(idx, "description", bulletedLines.join("\n"));
        } else {
          handleUpdateOfferingRow(idx, "description", "• ");
        }
      }
    }
  };

  // Unified Edit & Add Service Drawer State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const openAddServiceDrawer = () => {
    fetchServiceActionsFromBackend();
    fetchCategoriesFromBackend();
    fetchAddonsFromBackend();
    setEditingServiceId(null);
    setServiceCategory("");
    setSelectedSubcategory("");
    setSelectedServiceAction("");
    setInlineAddonPackageIndex(null);
    setInlineAddonTitle("");
    setServiceOfferings([
      {
        id: `offering-${Date.now()}`,
        title: "",
        subtitle: "",
        price: 699,
        originalPrice: undefined,
        duration: "45 mins",
        description: "",
        includeInPackage: ["• "],
        excludeFromPackage: ["• "],
        thumbnailUrl: "",
        addonIds: [],
      },
    ]);
    setIsAddServiceOpen(true);
  };

  const openEditServiceDrawer = async (item: ServiceItem) => {
    let packageDetails: Record<string, any> = {};
    if (item.id.length === 24) {
      const packageRes = await getPackageByIdApi(item.id);
      const responseData = packageRes?.data;
      const detail = packageRes?.package
        || responseData?.package
        || responseData?.data?.package
        || responseData?.data
        || responseData;
      if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        packageDetails = detail;
      }
    }
    const packageValues: Record<string, unknown> = { ...item, ...packageDetails };

    fetchServiceActionsFromBackend();
    fetchCategoriesFromBackend();
    fetchAddonsFromBackend();
    setEditingServiceId(item.id);

    // Prefill Category
    const rawCatStr = item.category || "";
    const matchedCategory = categoriesFromApi.find(
      (c) =>
        (item.categoryId && c._id === item.categoryId) ||
        (rawCatStr && c._id === rawCatStr) ||
        (rawCatStr && c.categoryName.toLowerCase().trim() === rawCatStr.toLowerCase().trim()) ||
        (rawCatStr && c.categoryName.toLowerCase().includes(rawCatStr.toLowerCase())) ||
        (rawCatStr && rawCatStr.toLowerCase().includes(c.categoryName.toLowerCase()))
    );

    const categoryNameToSet = matchedCategory ? matchedCategory.categoryName : (rawCatStr || "");
    setServiceCategory(categoryNameToSet);

    // Prefill Subcategory
    const subCategoriesList = matchedCategory?.subCategories || [];
    const rawSubStr = item.subcategory || "";
    const matchedSub = subCategoriesList.find(
      (s: any) =>
        (item.subCategoryId && s._id === item.subCategoryId) ||
        (rawSubStr && s._id === rawSubStr) ||
        (rawSubStr && s.name.toLowerCase().trim() === rawSubStr.toLowerCase().trim()) ||
        (rawSubStr && s.name.toLowerCase().includes(rawSubStr.toLowerCase()))
    );

    const subcategoryNameToSet = matchedSub ? matchedSub.name : (rawSubStr || "");
    setSelectedSubcategory(subcategoryNameToSet);

    // Prefill Top-Level Service Action
    const actionVal = item.serviceAction || item.systemType?.[0] || "";
    setSelectedServiceAction(actionVal);

    if (actionVal) {
      setServiceActionsList((prev) => (prev.includes(actionVal) ? prev : [actionVal, ...prev]));
    }

    const catIdToUse = matchedCategory?._id || item.categoryId;
    const subCatIdToUse = matchedSub?._id || item.subCategoryId;
    fetchAddonsFromBackend(catIdToUse, subCatIdToUse);
    fetchServiceActionsFromBackend(catIdToUse, subCatIdToUse);

    // Prefill Addons & Package Image
    const extractedAddonIds = Array.isArray(packageValues.addons)
      ? packageValues.addons.map((a: any) => (typeof a === "string" ? a : (a.id || a._id))).filter(Boolean)
      : [];

    const packageImage = safeStr(packageValues.thumbnailUrl) || safeStr(packageValues.imageUrl);
    const includedItems = safeStringArray(packageValues.includeInPackage);
    const excludedItems = safeStringArray(packageValues.excludeFromPackage);

    setServiceOfferings([
      {
        id: item.id,
        title: safeStr(packageValues.packageName) || item.title,
        subtitle: safeStr(packageValues.subtitle),
        price: Number(packageValues.price ?? item.price),
        originalPrice: Number(packageValues.originalPrice ?? item.originalPrice),
        duration: typeof packageValues.duration === "number"
          ? `${packageValues.duration} mins`
          : safeStr(packageValues.duration) || item.duration,
        description: safeStr(packageValues.description) || item.description || item.subtitle || "",
        includeInPackage: includedItems.length ? includedItems : ["• "],
        excludeFromPackage: excludedItems.length ? excludedItems : ["• "],
        thumbnailUrl: packageImage,
        addonIds: extractedAddonIds,
      },
    ]);

    if (Array.isArray(packageValues.addons)) {
      const extraAddons: ServiceAddon[] = packageValues.addons
        .filter((a: any) => typeof a === "object" && a !== null && (a.id || a._id))
        .map((a: any) => ({
          id: a._id || a.id,
          title: a.title || "Spare Part",
          price: a.price || 199,
          unit: a.unit || "Per Unit",
          category: a.category || "General",
          status: a.status ? "Active" : "Inactive",
        }));
      if (extraAddons.length > 0) {
        setAddons((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const toAdd = extraAddons.filter((e) => !existingIds.has(e.id));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
      }
    }

    setIsAddServiceOpen(true);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = isAddingNewCategory && newCategoryName.trim()
      ? newCategoryName.trim()
      : serviceCategory;

    if (!finalCategory) {
      toast.error("Category Required", "Please select a Category.");
      return;
    }

    if (!selectedServiceAction) {
      toast.error("Service Action Required", "Please select a Service Action.");
      return;
    }

    const validOfferings = serviceOfferings.filter((off) => off.title.trim().length > 0);
    if (validOfferings.length === 0) {
      toast.error("Package Required", "Please add at least one service package with a title.");
      return;
    }

    const catsRes = await getCategoriesApi({ forceRefresh: true });
    const allCategories: ApiCategory[] = (catsRes && catsRes.success && Array.isArray(catsRes.data) && catsRes.data.length > 0)
      ? catsRes.data
      : categoriesFromApi;

    const matchedCat = allCategories.find(
      (c: ApiCategory) =>
        (c.categoryName && c.categoryName.toLowerCase().trim() === finalCategory.toLowerCase().trim()) ||
        c._id === finalCategory
    ) || allCategories[0];

    const subCatObj = selectedSubcategory
      ? matchedCat?.subCategories?.find(
        (sub: any) =>
          (sub.name && sub.name.toLowerCase().trim() === selectedSubcategory.toLowerCase().trim()) ||
          sub._id === selectedSubcategory
      )
      : undefined;

    const catIdToUse = matchedCat?._id;
    const subCatIdToUse = subCatObj?._id || undefined;

    if (!catIdToUse) {
      toast.error("Category Error", "Unable to resolve category ID. Please check backend categories.");
      return;
    }

    let matchedActionObj = (serviceActionsFromApi || []).find(
      (act: any) =>
        act._id === selectedServiceAction ||
        act.serviceAction === selectedServiceAction ||
        act.name === selectedServiceAction ||
        act.serviceName === selectedServiceAction
    );
    let actionIdToUse = matchedActionObj?._id || (selectedServiceAction?.length === 24 ? selectedServiceAction : undefined);

    if (!actionIdToUse && selectedServiceAction && catIdToUse) {
      const dropRes = await getServiceActionDropdownApi({ categoryId: catIdToUse, subCategoryId: subCatIdToUse || undefined });
      const dropList = Array.isArray(dropRes?.data) ? dropRes.data : [];
      const foundInDrop = dropList.find(
        (act: any) =>
          act._id === selectedServiceAction ||
          act.serviceAction === selectedServiceAction ||
          act.name === selectedServiceAction
      );
      if (foundInDrop?._id) {
        actionIdToUse = foundInDrop._id;
      } else {
        const createActRes = await createServiceActionApi({
          categoryId: catIdToUse,
          subCategoryId: subCatIdToUse || undefined,
          serviceAction: selectedServiceAction,
        });
        if (createActRes?.success && createActRes?.data?._id) {
          actionIdToUse = createActRes.data._id;
        } else {
          const retryDrop = await getServiceActionDropdownApi({ categoryId: catIdToUse, subCategoryId: subCatIdToUse || undefined });
          const retryList = Array.isArray(retryDrop?.data) ? retryDrop.data : [];
          const retryFound = retryList.find(
            (act: any) =>
              (act.serviceAction || act.name || "").toLowerCase().trim() === selectedServiceAction.toLowerCase().trim()
          );
          if (retryFound?._id) {
            actionIdToUse = retryFound._id;
          }
        }
      }
    }

    if (editingServiceId) {
      // EDIT MODE: Update existing package
      const firstOff = validOfferings[0];
      const packageAddonIds = (firstOff.addonIds || []).filter((id) => id.length === 24);

      if (editingServiceId.length === 24) {
        let updatePayload: any;
        if (firstOff.imageFile instanceof File) {
          const form = new FormData();
          form.append("image", firstOff.imageFile);
          form.append("packageName", firstOff.title);
          if (firstOff.subtitle && firstOff.subtitle.trim()) form.append("subtitle", firstOff.subtitle.trim());
          if (firstOff.description && firstOff.description.trim()) form.append("description", firstOff.description.trim());
          form.append("price", String(firstOff.price));
          form.append("duration", String(parseInt(String(firstOff.duration)) || 45));
          form.append("originalPrice", String(firstOff.originalPrice || Math.round((firstOff.price || 699) * 1.3)));
          form.append("includeInPackage", JSON.stringify(cleanPackagePoints(firstOff.includeInPackage)));
          form.append("excludeFromPackage", JSON.stringify(cleanPackagePoints(firstOff.excludeFromPackage)));
          if (packageAddonIds.length > 0) {
            packageAddonIds.forEach((addonId) => form.append("addons", addonId));
          } else {
            form.append("addons", JSON.stringify([]));
          }
          updatePayload = form;
        } else {
          updatePayload = {
            serviceId: actionIdToUse || catIdToUse,
            serviceActionId: actionIdToUse,
            categoryId: catIdToUse,
            subCategoryId: subCatIdToUse,
            serviceAction: selectedServiceAction,
            packageName: firstOff.title,
            subtitle: firstOff.subtitle && firstOff.subtitle.trim() ? firstOff.subtitle.trim() : undefined,
            description: firstOff.description && firstOff.description.trim() ? firstOff.description.trim() : undefined,
            price: firstOff.price,
            duration: parseInt(String(firstOff.duration)) || 45,
            originalPrice: firstOff.originalPrice || Math.round((firstOff.price || 699) * 1.3),
            includeInPackage: cleanPackagePoints(firstOff.includeInPackage),
            excludeFromPackage: cleanPackagePoints(firstOff.excludeFromPackage),
            imageUrl: firstOff.thumbnailUrl || "",
            thumbnailUrl: firstOff.thumbnailUrl || "",
            addons: packageAddonIds,
          };
        }

        const updatePkgRes = await updatePackageApi(editingServiceId, updatePayload);
        if (updatePkgRes && updatePkgRes.success === false) {
          toast.error("Update Package Failed", updatePkgRes.message || "Unknown error");
        } else {
          toast.success("Package Updated", `"${firstOff.title}" package updated successfully.`);
        }
      }

      if (validOfferings.length > 1) {
        if (actionIdToUse && actionIdToUse.length === 24) {
          const extraPackageListPayload = validOfferings.slice(1).map((off) => ({
            packageName: off.title,
            subtitle: off.subtitle && off.subtitle.trim() ? off.subtitle.trim() : undefined,
            description: off.description && off.description.trim() ? off.description.trim() : `${off.title} service`,
            price: off.price,
            originalPrice: off.originalPrice || Math.round((off.price || 699) * 1.3),
            includeInPackage: cleanPackagePoints(off.includeInPackage),
            excludeFromPackage: cleanPackagePoints(off.excludeFromPackage),
            duration: parseInt(String(off.duration)) || 45,
            imageUrl: off.thumbnailUrl || "",
            thumbnailUrl: off.thumbnailUrl || "",
            imageFile: off.imageFile,
            addons: (off.addonIds || []).filter((id) => id.length === 24),
          }));

          const createExtraRes = await createPackageApi({
            serviceActionId: actionIdToUse,
            packages: extraPackageListPayload,
          });

          if (createExtraRes && createExtraRes.success === false) {
            const errMsg = createExtraRes.errors ? createExtraRes.errors.join(", ") : (createExtraRes.message || "Unknown error");
            toast.error("Create Package Failed", errMsg);
          } else {
            toast.success("Additional Packages Created", `Created ${extraPackageListPayload.length} additional package(s).`);
          }
        } else {
          toast.error("Service Action Required", "A valid Service Action ID is required to create additional packages.");
        }
      }

      await fetchServicesFromBackend();
    } else {
      // CREATE MODE: Add new package offers matching POST /api/package schema
      if (!actionIdToUse || actionIdToUse.length !== 24) {
        toast.error("Service Action Required", "A valid Service Action ID is required before creating packages.");
        return;
      }

      const packageListPayload = validOfferings.map((off) => ({
        packageName: off.title,
        subtitle: off.subtitle && off.subtitle.trim() ? off.subtitle.trim() : undefined,
        description: off.description && off.description.trim() ? off.description.trim() : `${off.title} service`,
        price: off.price,
        originalPrice: off.originalPrice || Math.round((off.price || 699) * 1.3),
        includeInPackage: cleanPackagePoints(off.includeInPackage),
        excludeFromPackage: cleanPackagePoints(off.excludeFromPackage),
        duration: parseInt(String(off.duration)) || 45,
        imageUrl: off.thumbnailUrl || "",
        thumbnailUrl: off.thumbnailUrl || "",
        imageFile: off.imageFile,
        addons: (off.addonIds || []).filter((id) => id.length === 24),
      }));

      const createPkgRes = await createPackageApi({
        serviceActionId: actionIdToUse,
        packages: packageListPayload,
      });

      if (createPkgRes && createPkgRes.success === false) {
        const errMsg = createPkgRes.errors ? createPkgRes.errors.join(", ") : (createPkgRes.message || "Unknown error");
        toast.error("Create Package Failed", errMsg);
      } else {
        toast.success("Package Created", `Successfully created ${packageListPayload.length} service package(s).`);
        await fetchServicesFromBackend();
      }
    }

    if (isAddingNewCategory && newCategoryName.trim()) {
      setCustomCategories([...customCategories, newCategoryName.trim()]);
    }

    setEditingServiceId(null);
    setIsAddingNewCategory(false);
    setNewCategoryName("");
    setIsAddServiceOpen(false);
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonTitle.trim()) {
      toast.error("Title Required", "Add-on Item Title is required.");
      return;
    }

    const matchedCat = categoriesFromApi.find(
      (c) => c._id === addonCategoryId || c.categoryName === addonCategory
    ) || categoriesFromApi[0];

    const catIdToUse = matchedCat?._id || addonCategoryId;

    const matchedSub = matchedCat?.subCategories?.find(
      (s: any) => s._id === addonSubCategoryId || s.name === addonSubCategory
    ) || matchedCat?.subCategories?.[0];

    const subCatIdToUse = matchedSub?._id || addonSubCategoryId;

    const payload = {
      categoryId: catIdToUse,
      subCategoryId: subCatIdToUse,
      addonName: addonTitle.trim(),
      title: addonTitle.trim(),
      description: addonDescription.trim(),
      price: parseFloat(addonPrice) || 199,
      unit: addonUnit.trim() || "Per Unit",
      imageUrl: addonImageUrl.trim(),
      category: matchedCat?.categoryName || addonCategory,
      status: true,
    };

    if (editingAddonId && editingAddonId.length === 24) {
      const updateRes = await updateAddonApi(editingAddonId, payload);
      if (updateRes && updateRes.success === false) {
        toast.error("Update Add-on Failed", updateRes.message || "Unknown error");
      } else {
        toast.success("Add-on Updated", `"${addonTitle.trim()}" updated successfully.`);
      }
      await fetchAddonsFromBackend(addonCategoryId, addonSubCategoryId);
    } else {
      const createRes = await createAddonApi(payload);
      if (createRes && createRes.success === false) {
        toast.error("Create Add-on Failed", createRes.message || "Unknown error");
      } else {
        toast.success("Add-on Created", `"${addonTitle.trim()}" created successfully.`);
      }
      await fetchAddonsFromBackend(addonCategoryId, addonSubCategoryId);
    }

    setEditingAddonId(null);
    setAddonTitle("");
    setAddonDescription("");
    setAddonImageUrl("");
    setIsAddAddonOpen(false);
  };

  const handleCreatePincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeLocality) return;

    const newLoc: VaranasiLocality = {
      id: `loc-${Date.now()}`,
      name: pincodeLocality,
      pincode: pincodeCode,
      activeBookings: 0,
      activeTechs: 5,
      status: "Normal",
      isServiceable: true,
    };

    setLocalities([newLoc, ...localities]);
    setPincodeLocality("");
    setIsAddPincodeOpen(false);
  };

  // Dynamic Filtering by Category
  const filteredServices = selectedCategoryIdFilter
    ? services
    : selectedCategoryFilter === "All Categories"
      ? services
      : services.filter((s) => s.category === selectedCategoryFilter);

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-brand-600" />
            <span>Services & Master Pricing Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage fixed service rates, diagnostic inspection charges, spare part add-ons, and Varanasi pincode serviceability rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === "services") openAddServiceDrawer();
            else if (activeTab === "addons") openAddAddonDrawer();
            else setIsAddPincodeOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === "services"
              ? "Create Service Offer"
              : activeTab === "addons"
                ? "Add Spare Component"
                : "Add Varanasi Pincode"}
          </span>
        </button>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 no-scrollbar">
        <div className="flex gap-1.5 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === "services"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Services & Pricing CMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("addons")}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === "addons"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Add-on Parts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pincodes")}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === "pincodes"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Pincode Serviceability
          </button>
        </div>
      </div>

      {/* CATEGORY FLOW SELECTION CHIPS (For Services Tab) */}
      {activeTab === "services" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category Flow:
          </span>
          <button
            type="button"
            onClick={() => handleSelectCategoryFilter("", "All Categories")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              !selectedCategoryIdFilter || selectedCategoryFilter === "All Categories"
                ? "bg-brand-500 text-white shadow-lux"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            All Categories
          </button>
          {categoriesFromApi.map((cat) => {
            const isSelected = selectedCategoryIdFilter === cat._id;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => handleSelectCategoryFilter(isSelected ? "" : cat._id, isSelected ? "All Categories" : cat.categoryName)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-brand-500 text-white shadow-lux"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {cat.iconUrl ? (
                  <img
                    src={cat.iconUrl}
                    alt={cat.categoryName}
                    className="w-3.5 h-3.5 rounded object-contain shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : null}
                <span>{cat.categoryName}</span>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "services" ? (
        isLoading ? (
          <ShimmerRow count={6} />
        ) : (
          <DataTable
            columns={serviceColumns}
            data={filteredServices}
            searchPlaceholder="Search service title or category..."
          />
        )
      ) : activeTab === "addons" ? (
        isLoading ? (
          <ShimmerRow count={5} />
        ) : (
          <DataTable
            columns={addonColumns}
            data={addons}
            searchPlaceholder="Search add-on title..."
          />
        )
      ) : (
        <DataTable
          columns={pincodeColumns}
          data={localities}
          searchPlaceholder="Search locality or pincode..."
        />
      )}

      {/* SERVICE DETAILS & CONNECTED ADD-ONS MODAL */}
      {selectedService && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-lg w-full space-y-4 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {selectedService.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: <span className="font-bold text-brand-600">{selectedService.category}</span> • Base Rate: ₹{selectedService.price}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Connected Add-ons Section */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-purple-600" />
                    Connected Spare Part Add-ons ({selectedService.addons?.length || 0})
                  </span>
                </div>

                <div className="space-y-2">
                  {addons.map((addon) => {
                    const isLinked = selectedService.addons?.some((a) => a.id === addon.id);
                    return (
                      <div
                        key={addon.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${isLinked
                          ? "bg-purple-50/60 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                          }`}
                      >
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            {addon.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ₹{addon.price} / {addon.unit} • Category: {addon.category}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleLinkAddonToService(selectedService.id, addon)}
                          className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1 ${isLinked
                            ? "bg-purple-600 text-white shadow-lux"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                            }`}
                        >
                          {isLinked ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Linked
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Link Add-on
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-lux"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ADD SERVICE DRAWER WITH LINKED ADD-ONS SECTION */}
      {isAddServiceOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
            <div className="absolute inset-0" onClick={() => setIsAddServiceOpen(false)} />
            <form
              onSubmit={handleCreateService}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-3xl w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs"
            >
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {editingServiceId ? "Edit Service" : "Add Service"}
                  </h3>
                  <button type="button" onClick={() => setIsAddServiceOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step 1: Category, Subcategory & Service Action Selection */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Category Dropdown */}
                    <CustomSelect
                      label="Select Category *"
                      value={serviceCategory}
                      placeholder="Select Category..."
                      onChange={(catName) => {
                        setServiceCategory(catName);
                        setSelectedSubcategory("");
                        setSelectedServiceAction("");
                        const matchedCat = categoriesFromApi.find((c) => c.categoryName === catName);
                        fetchAddonsFromBackend(matchedCat?._id, undefined);
                        fetchServiceActionsFromBackend(matchedCat?._id, undefined);
                      }}
                      options={(categoriesFromApi.length > 0
                        ? categoriesFromApi.map((c) => c.categoryName)
                        : Object.keys(categorySubcategoriesMap)
                      ).map((catName) => ({
                        value: catName,
                        label: catName,
                      }))}
                      onAddAction={() => {
                        setNewCatNameInput("");
                        setNewCatSubcategories([]);
                        setNewCatSubInput("");
                        setIsAddCategoryModalOpen(true);
                      }}
                      addActionLabel="Add Category"
                    />

                    {/* Subcategory Dropdown */}
                    <CustomSelect
                      label="Select Subcategory (Optional)"
                      value={selectedSubcategory}
                      disabled={!serviceCategory}
                      placeholder={serviceCategory ? "Select Subcategory (Optional)..." : "Select Category first"}
                      onChange={(sub) => {
                        setSelectedSubcategory(sub);
                        setSelectedServiceAction("");
                        const matchedCat = categoriesFromApi.find((c) => c.categoryName === serviceCategory);
                        const matchedSub = matchedCat?.subCategories?.find((s: any) => s.name === sub);
                        fetchAddonsFromBackend(matchedCat?._id, matchedSub?._id);
                        fetchServiceActionsFromBackend(matchedCat?._id, matchedSub?._id);
                      }}
                      options={(() => {
                        if (!serviceCategory) return [];
                        const matchedCat = categoriesFromApi.find((c) => c.categoryName === serviceCategory);
                        const subs = matchedCat
                          ? (matchedCat.subCategories || []).map((sub: any) => sub.name)
                          : categorySubcategoriesMap[serviceCategory] || [];
                        return subs.map((subName) => ({
                          value: subName,
                          label: subName,
                        }));
                      })()}
                      onAddAction={serviceCategory ? () => {
                        setTargetCategoryForSubcategory(serviceCategory);
                        setSubCatInputForModal("");
                        setIsAddSubcategoryOpen(true);
                      } : undefined}
                      addActionLabel="Add Subcategory"
                    />

                    {/* Service Action Dropdown (OUTSIDE package, at step 1 top-level) */}
                    {(() => {
                      const actionsAvailable = Array.from(
                        new Set([
                          ...(serviceActionsFromApi || []).map((a: any) => a.name || a.serviceAction || "").filter(Boolean),
                          ...serviceActionsList,
                        ])
                      );

                      return (
                        <CustomSelect
                          label="Select Service Action *"
                          value={selectedServiceAction}
                          placeholder={
                            actionsAvailable.length > 0
                              ? "Select Service Action..."
                              : "No Service Action Available"
                          }
                          onChange={(val) => setSelectedServiceAction(val)}
                          options={
                            actionsAvailable.length > 0
                              ? actionsAvailable.map((actionName) => ({
                                value: actionName,
                                label: actionName,
                              }))
                              : [
                                {
                                  value: "",
                                  label: "No Service Action Available",
                                },
                              ]
                          }
                          onAddAction={() => {
                            setTargetOfferingIndexForAction(null);
                            setNewActionInput("");
                            setIsAddActionModalOpen(true);
                          }}
                          addActionLabel="Add Action"
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Step 2: Dynamic Multiple Add Service Packages */}
                <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-200 dark:border-brand-800 pb-1.5">
                    <span className="font-extrabold text-brand-900 dark:text-brand-300 block text-xs">
                      2. Service Packages ({serviceOfferings.length})
                    </span>
                  </div>

                  <div className="space-y-3">
                    {serviceOfferings.length > 0 ? (
                      serviceOfferings.map((off, idx) => (
                        <div
                          key={off.id || idx}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 relative shadow-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                            <span className="font-extrabold text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5" />
                              Package #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDuplicateOfferingRow(idx)}
                                className="px-2 py-1 rounded-lg text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                title="Duplicate / Copy Package for Quick Update"
                              >
                                <Copy className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span>Duplicate</span>
                              </button>
                              {serviceOfferings.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOfferingRow(idx)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
                                  title="Remove Package"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 1. Package Name & 2. Price */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            {/* 1. Package Name */}
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                1. Package Name *
                              </label>
                              <input
                                type="text"
                                value={off.title}
                                onChange={(e) => handleUpdateOfferingRow(idx, "title", e.target.value)}
                                placeholder="e.g. Master Power Jet Foam Cleaning Package"
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
                                required
                              />
                            </div>

                            {/* 2. Price */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                2. Price (₹) *
                              </label>
                              <input
                                type="number"
                                value={off.price}
                                onChange={(e) => handleUpdateOfferingRow(idx, "price", Number(e.target.value))}
                                placeholder="699"
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500 text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                Original Price (₹)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={off.originalPrice ?? ""}
                                onChange={(e) => handleUpdateOfferingRow(idx, "originalPrice", e.target.value ? Number(e.target.value) : undefined)}
                                placeholder={String(Math.round((off.price || 699) * 1.3))}
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500 text-xs"
                              />
                            </div>
                          </div>

                          {/* 3. Subtitle & 4. Service Duration */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* 3. Subtitle */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                3. Subtitle (1-Liner Tagline)
                              </label>
                              <input
                                type="text"
                                value={off.subtitle || ""}
                                onChange={(e) => handleUpdateOfferingRow(idx, "subtitle", e.target.value)}
                                placeholder="e.g. Deep Foam Jet & Anti-Bacterial Spray"
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
                              />
                            </div>

                            {/* 4. Service Duration */}
                            <div>
                              <CustomSelect
                                size="sm"
                                label="4. Service Duration *"
                                value={off.duration}
                                onChange={(val) => handleUpdateOfferingRow(idx, "duration", val)}
                                options={[
                                  { value: "30 mins", label: "30 mins" },
                                  { value: "45 mins", label: "45 mins" },
                                  { value: "60 mins", label: "60 mins" },
                                  { value: "90 mins", label: "90 mins" },
                                  { value: "2 - 3 hrs", label: "2 - 3 hrs" },
                                ]}
                              />
                            </div>
                          </div>

                          {/* 5. Description Editor (Pointwise & Bold Toolbar) */}
                          {(() => {
                            const descText = off.description || "";
                            const isBoldActive = descText.includes("**") || /<b>.*?<\/b>/i.test(descText);
                            const isBulletActive = descText.split("\n").some((l) => l.trim().startsWith("•") || l.trim().startsWith("-"));

                            return (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                                    5. Description (Pointwise & Bold Editor)
                                  </label>

                                  {/* EDITOR TOOLBAR (2 BUTTONS: BOLD & POINT) */}
                                  <div className="flex items-center gap-1.5">
                                    {/* BOLD BUTTON */}
                                    <button
                                      type="button"
                                      onClick={() => toggleDescriptionFormat(idx, "bold")}
                                      className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${isBoldActive
                                        ? "bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-400/30 font-black"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                                        }`}
                                      title={isBoldActive ? "Remove Bold (<b>)" : "Apply Bold (<b>)"}
                                    >
                                      B {isBoldActive && <span className="ml-0.5 text-[9px]">✓</span>}
                                    </button>

                                    {/* POINTWISE BUTTON */}
                                    <button
                                      type="button"
                                      onClick={() => toggleDescriptionFormat(idx, "bullet")}
                                      className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 border ${isBulletActive
                                        ? "bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-400/30 font-black"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                                        }`}
                                      title={isBulletActive ? "Remove Pointwise (•)" : "Apply Pointwise (•)"}
                                    >
                                      <span>• Point</span>
                                      {isBulletActive && <span className="ml-0.5 text-[9px]">✓</span>}
                                    </button>
                                  </div>
                                </div>

                                <textarea
                                  rows={3}
                                  value={off.description || ""}
                                  onChange={(e) => handleUpdateOfferingRow(idx, "description", e.target.value)}
                                  placeholder={"• Deep foam jet cleaning of indoor unit\n• Drain line & filter mesh wash\n• <b>30-Day Service Warranty</b>"}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium outline-none focus:border-brand-500 text-xs resize-y font-mono"
                                />
                                <span className="text-[10px] text-slate-400 italic block">
                                  Click B (Bold) or • Point to toggle formatting on/off. Active format is highlighted in brand color with a ✓ checkmark.
                                </span>
                              </div>
                            );
                          })()}

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                              <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Included in package
                              </label>
                              <textarea
                                rows={3}
                                value={(off.includeInPackage?.length ? off.includeInPackage : ["• "]).join("\n")}
                                onFocus={(e) => {
                                  if (e.currentTarget.value === "• " && e.currentTarget.selectionStart < 2) {
                                    e.currentTarget.setSelectionRange(2, 2);
                                  }
                                }}
                                onKeyDown={(e) => handlePackageListEnter(e, idx, "includeInPackage")}
                                onChange={(e) => handlePackageListChange(e, idx, "includeInPackage")}
                                placeholder={"Complete professional diagnostics & inspection\nBackground verified local experts\nPost-service quality assurance"}
                                className="w-full p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white font-medium outline-none focus:border-emerald-500 text-xs resize-y"
                              />
                              <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Enter one included benefit per line.</span>
                            </div>
                            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
                              <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Excluded from package
                              </label>
                              <textarea
                                rows={3}
                                value={(off.excludeFromPackage?.length ? off.excludeFromPackage : ["• "]).join("\n")}
                                onFocus={(e) => {
                                  if (e.currentTarget.value === "• " && e.currentTarget.selectionStart < 2) {
                                    e.currentTarget.setSelectionRange(2, 2);
                                  }
                                }}
                                onKeyDown={(e) => handlePackageListEnter(e, idx, "excludeFromPackage")}
                                onChange={(e) => handlePackageListChange(e, idx, "excludeFromPackage")}
                                placeholder={"Spare parts and replacement hardware costs\nMajor masonry or structural modifications"}
                                className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white font-medium outline-none focus:border-rose-500 text-xs resize-y"
                              />
                              <span className="text-[10px] text-rose-700/70 dark:text-rose-400/70">Enter one exclusion per line.</span>
                            </div>
                          </div>

                          {/* COMBINED ROW: PACKAGE IMAGE & SPARE PART ADD-ONS DROPDOWN IN SAME LINE */}
                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                              {/* Left Column: Package Image */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                  <span>Package Image</span>
                                  <span className="text-brand-600 font-extrabold text-[9px] uppercase">
                                    {off.thumbnailUrl || off.imageFile ? "Image Attached" : "Upload File"}
                                  </span>
                                </label>
                                {(() => {
                                  const activeImage = off.thumbnailUrl !== undefined ? off.thumbnailUrl : (serviceThumbnail || "");
                                  return (
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        {activeImage ? (
                                          <img
                                            src={activeImage}
                                            alt="Package Thumbnail"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = "none";
                                            }}
                                          />
                                        ) : (
                                          <ImageIcon className="w-4 h-4 text-slate-400" />
                                        )}
                                      </div>

                                      {activeImage || off.imageFile ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateOfferingRow(idx, "thumbnailUrl", "");
                                            handleUpdateOfferingRow(idx, "imageFile", undefined);
                                          }}
                                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer shrink-0 shadow-xs transition-colors"
                                          title="Delete Image"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete Image</span>
                                        </button>
                                      ) : (
                                        <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer shrink-0 shadow-xs transition-colors">
                                          <Upload className="w-3.5 h-3.5 text-brand-600" />
                                          <span>Upload Image</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                handleUpdateOfferingRow(idx, "imageFile", file);
                                                handleUpdateOfferingRow(idx, "thumbnailUrl", URL.createObjectURL(file));
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Right Column: Spare Part Add-ons Dropdown */}
                              <div>
                                <CustomSelect
                                  label={`Spare Part Add-ons (${(off.addonIds || []).length} Selected)`}
                                  value=""
                                  selectedValues={off.addonIds || []}
                                  placeholder={addons.length > 0 ? "Select Spare Part Add-on to link..." : "No spare parts available"}
                                  disabled={addons.length === 0}
                                  menuPlacement="top"
                                  onChange={(selectedAddonId) => {
                                    const currentIds = off.addonIds || [];
                                    if (currentIds.includes(selectedAddonId)) {
                                      handleUpdateOfferingRow(idx, "addonIds", currentIds.filter((id) => id !== selectedAddonId));
                                    } else {
                                      handleUpdateOfferingRow(idx, "addonIds", [...currentIds, selectedAddonId]);
                                    }
                                  }}
                                  options={addons.map((addon) => ({
                                    value: addon.id,
                                    label: `${addon.title} — ₹${addon.price} / ${addon.unit}`,
                                  }))}
                                  onAddAction={() => {
                                    setInlineAddonPackageIndex(inlineAddonPackageIndex === idx ? null : idx);
                                  }}
                                  addActionLabel="+ Add New Add-on"
                                />
                              </div>
                            </div>

                            {/* INLINE ADD-ON ADD FORM (OPENS DIRECTLY BELOW ADDON DROPDOWN) */}
                            {inlineAddonPackageIndex === idx && (
                              <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 space-y-2.5 animate-in fade-in-50 zoom-in-95 duration-150 shadow-xs">
                                <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/60 pb-1.5">
                                  <span className="font-extrabold text-purple-900 dark:text-purple-300 text-[11px] flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                    Create New Spare Part Add-on (Links to Package #{idx + 1})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setInlineAddonPackageIndex(null)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                      Part Name *
                                    </label>
                                    <input
                                      type="text"
                                      value={inlineAddonTitle}
                                      onChange={(e) => setInlineAddonTitle(e.target.value)}
                                      placeholder="e.g. Heavy Duty Copper Piping"
                                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                      Unit Price (₹) *
                                    </label>
                                    <input
                                      type="number"
                                      value={inlineAddonPrice}
                                      onChange={(e) => setInlineAddonPrice(e.target.value)}
                                      placeholder="199"
                                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs"
                                    />
                                  </div>
                                  <CustomSelect
                                    size="sm"
                                    label="Unit *"
                                    value={inlineAddonUnit}
                                    onChange={(val) => setInlineAddonUnit(val)}
                                    options={[
                                      { value: "Per Unit", label: "Per Unit" },
                                      { value: "meter", label: "meter" },
                                      { value: "piece", label: "piece" },
                                      { value: "unit", label: "unit" },
                                    ]}
                                  />
                                </div>

                                {/* Addon Description */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    value={inlineAddonDescription}
                                    onChange={(e) => setInlineAddonDescription(e.target.value)}
                                    placeholder="e.g. Complete AC deep cleaning service"
                                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none text-xs"
                                  />
                                </div>

                                {/* Addon Image Upload */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                    Addon Image
                                  </label>
                                  <div className="flex items-center gap-2">
                                    {inlineAddonImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-purple-200 dark:border-purple-800 shrink-0 bg-white dark:bg-slate-800 flex items-center justify-center">
                                          <img src={inlineAddonImageUrl} alt="Addon Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setInlineAddonImageUrl("")}
                                          className="px-2 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Remove</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="px-3 py-2 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5 cursor-pointer">
                                        <Upload className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Choose Image File...</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onload = (re) => {
                                                setInlineAddonImageUrl(re.target?.result as string);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setInlineAddonPackageIndex(null)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineAddonForPackage(idx)}
                                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                                  >
                                    Save & Attach
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* SELECTED ADD-ON TAG PILLS */}
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {(off.addonIds || []).length > 0 ? (
                                (off.addonIds || []).map((addonId) => {
                                  const addonObj = addons.find((a) => a.id === addonId);
                                  if (!addonObj) return null;
                                  return (
                                    <span
                                      key={addonId}
                                      className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-extrabold text-[11px] flex items-center gap-1.5 shadow-xs"
                                    >
                                      <Wrench className="w-3 h-3 text-purple-500 shrink-0" />
                                      <span>{addonObj.title}</span>
                                      <span className="font-mono text-purple-600 dark:text-purple-400 text-[10px]">
                                        ₹{addonObj.price}/{addonObj.unit}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = (off.addonIds || []).filter((id) => id !== addonId);
                                          handleUpdateOfferingRow(idx, "addonIds", updated);
                                        }}
                                        className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                                        title="Remove Add-on"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No add-ons linked to Package #{idx + 1} yet. Pick from dropdown above.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <p className="text-xs text-slate-500 font-medium">No service packages added yet.</p>
                        <button
                          type="button"
                          onClick={handleAddOfferingRow}
                          className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold border border-brand-200 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add First Package
                        </button>
                      </div>
                    )}

                    {serviceOfferings.length > 0 && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleAddOfferingRow}
                          className="w-full py-2.5 px-4 rounded-xl bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-dashed border-brand-300 dark:border-brand-700 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          <span>+ Add Another Package</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Service Package</span>
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ADD / EDIT ADDON DRAWER */}
      {isAddAddonOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
            <div className="absolute inset-0" onClick={() => setIsAddAddonOpen(false)} />
            <form
              onSubmit={handleSaveAddon}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-md w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {editingAddonId ? "Edit Spare Part Add-on" : "Add Spare Part Add-on"}
                  </h3>
                  <button type="button" onClick={() => setIsAddAddonOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Dropdown */}
                <CustomSelect
                  label="Category *"
                  size="sm"
                  value={addonCategory}
                  onChange={(catName) => {
                    setAddonCategory(catName);
                    const matchedCat = categoriesFromApi.find((c) => c.categoryName === catName);
                    setAddonCategoryId(matchedCat?._id || "");
                    setAddonSubCategory("");
                    setAddonSubCategoryId("");
                  }}
                  options={(categoriesFromApi.length > 0
                    ? categoriesFromApi.map((c) => c.categoryName)
                    : Object.keys(categorySubcategoriesMap)
                  ).map((catName) => ({
                    value: catName,
                    label: catName,
                  }))}
                />

                {/* Subcategory Dropdown */}
                <CustomSelect
                  label="Subcategory *"
                  size="sm"
                  value={addonSubCategory}
                  disabled={!addonCategory}
                  placeholder={addonCategory ? "Select Subcategory..." : "Select Category first"}
                  onChange={(subName) => {
                    setAddonSubCategory(subName);
                    const matchedCat = categoriesFromApi.find((c) => c.categoryName === addonCategory);
                    const matchedSub = matchedCat?.subCategories?.find((s: any) => s.name === subName);
                    setAddonSubCategoryId(matchedSub?._id || "");
                  }}
                  options={(() => {
                    if (!addonCategory) return [];
                    const matchedCat = categoriesFromApi.find((c) => c.categoryName === addonCategory);
                    const subs = matchedCat
                      ? (matchedCat.subCategories || []).map((sub: any) => sub.name)
                      : categorySubcategoriesMap[addonCategory] || [];
                    return subs.map((s) => ({ value: s, label: s }));
                  })()}
                />

                {/* Add-on Name / Title */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Add-on Item Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={addonTitle}
                    onChange={(e) => setAddonTitle(e.target.value)}
                    placeholder="e.g. Deep Cleaning / Heavy Duty Copper Piping"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs"
                  />
                </div>

                {/* Price & Unit */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Unit Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={addonPrice}
                      onChange={(e) => setAddonPrice(e.target.value)}
                      placeholder="199"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs"
                    />
                  </div>

                  <CustomSelect
                    label="Unit Selection *"
                    size="sm"
                    value={addonUnit}
                    onChange={(val) => setAddonUnit(val)}
                    options={[
                      { value: "Per Unit", label: "Per Unit" },
                      { value: "meter", label: "meter" },
                      { value: "piece", label: "piece" },
                      { value: "unit", label: "unit" },
                    ]}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                  <input
                    type="text"
                    value={addonDescription}
                    onChange={(e) => setAddonDescription(e.target.value)}
                    placeholder="e.g. Complete AC deep cleaning service"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none text-xs"
                  />
                </div>

                {/* Image Upload & URL Input */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Add-on Image</label>
                  <div className="space-y-2">
                    <label className="w-full py-2.5 px-4 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAddonImageUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      value={addonImageUrl.startsWith("blob:") || addonImageUrl.startsWith("data:") ? "[Uploaded Image File]" : addonImageUrl}
                      onChange={(e) => setAddonImageUrl(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none text-xs"
                    />
                  </div>

                  {addonImageUrl && (
                    <div className="mt-2.5 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <img
                            src={addonImageUrl}
                            alt="Addon Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Image Preview</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {addonImageUrl.startsWith("blob:") || addonImageUrl.startsWith("data:") ? "Local Image File" : addonImageUrl}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddonImageUrl("")}
                        className="p-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAddonOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-lux"
                >
                  {editingAddonId ? "Update Add-on Item" : "Save Add-on Item"}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ADD PINCODE DRAWER */}
      {isAddPincodeOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
            <div className="absolute inset-0" onClick={() => setIsAddPincodeOpen(false)} />
            <form
              onSubmit={handleCreatePincode}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-md w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Add Serviceable Pincode Zone</h3>
                  <button type="button" onClick={() => setIsAddPincodeOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Locality Name *</label>
                  <input
                    type="text"
                    required
                    value={pincodeLocality}
                    onChange={(e) => setPincodeLocality(e.target.value)}
                    placeholder="e.g. Lanka Bhabha Road"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincodeCode}
                    onChange={(e) => setPincodeCode(e.target.value)}
                    placeholder="221005"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPincodeOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-lux"
                >
                  Save Service Zone
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* MANAGE SUBCATEGORIES MODAL */}
      {isManageSubcategoriesOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-lg w-full space-y-5 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Category Subcategories Manager
                    </h3>
                    <p className="text-xs text-slate-500">
                      Multi-add subcategories (e.g. Split AC, Window AC, Commercial AC)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManageSubcategoriesOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Select Master Category to Manage */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 text-xs block">
                  Select Category to Manage Subcategories
                </label>
                <select
                  value={selectedCategoryForManage}
                  onChange={(e) => setSelectedCategoryForManage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs"
                >
                  {Object.keys(categorySubcategoriesMap).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({(categorySubcategoriesMap[cat] || []).length} Subcategories)
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Subcategories list */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-900 dark:text-purple-300 text-xs">
                    Subcategories for "{selectedCategoryForManage}"
                  </span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded-full">
                    {(categorySubcategoriesMap[selectedCategoryForManage] || []).length} Options
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(categorySubcategoriesMap[selectedCategoryForManage] || []).length > 0 ? (
                    (categorySubcategoriesMap[selectedCategoryForManage] || []).map((sub) => (
                      <span
                        key={sub}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-extrabold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Layers className="w-3 h-3 text-purple-500" />
                        {sub}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategoryFromCategory(selectedCategoryForManage, sub)}
                          className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                          title="Remove subcategory"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No subcategories defined for this category yet.</p>
                  )}
                </div>

                {/* Inline Multi Add Form */}
                <div className="pt-3 border-t border-purple-200 dark:border-purple-800 space-y-1.5">
                  <label className="text-[11px] font-extrabold text-purple-900 dark:text-purple-300 block">
                    + Multi-Add Subcategory (e.g. Split AC, Window AC, Inverter AC, Commercial AC)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubcategoryTag}
                      onChange={(e) => setNewSubcategoryTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubcategoryToCategory(selectedCategoryForManage, newSubcategoryTag);
                        }
                      }}
                      placeholder="Type new subcategory name..."
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSubcategoryToCategory(selectedCategoryForManage, newSubcategoryTag)}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-lux flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Tag
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsManageSubcategoriesOpen(false)}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-lux cursor-pointer"
                >
                  Done & Save
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 1. ADD CATEGORY MODAL (Category Name & Subcategories can both be added together) */}
      {isAddCategoryModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCatNameInput.trim()) return;
                const catName = newCatNameInput.trim();
                const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

                try {
                  const res = await createCategoryApi({
                    categoryName: catName,
                    slug,
                    subCategories: newCatSubcategories.map((subName) => ({ name: subName })),
                    status: true,
                  });
                  if (res.success) {
                    await fetchCategoriesFromBackend();
                  }
                } catch (err) {
                  console.error("Failed to create category API:", err);
                }

                setCategorySubcategoriesMap((prev) => ({
                  ...prev,
                  [catName]: newCatSubcategories,
                }));
                setServiceCategory(catName);
                if (newCatSubcategories.length > 0) {
                  setSelectedSubcategory(newCatSubcategories[0]);
                } else {
                  setSelectedSubcategory("");
                }
                setNewCatNameInput("");
                setNewCatSubcategories([]);
                setNewCatSubInput("");
                setIsAddCategoryModalOpen(false);
              }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-lg w-full space-y-5 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none max-h-[90vh] overflow-y-auto text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Add New Master Category
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add Category Name & Multi-Add Subcategories together
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Field 1: Category Name */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-900 dark:text-white block text-xs">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatNameInput}
                  onChange={(e) => setNewCatNameInput(e.target.value)}
                  placeholder="e.g. Solar Panel Cleaning & Servicing"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500 text-xs"
                />
              </div>

              {/* Field 2: Subcategories Multi-Add */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-1.5">
                  <span className="font-extrabold text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    Subcategories for this Category
                  </span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded-full">
                    Multi-Add Options
                  </span>
                </div>

                {/* Input ABOVE */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-purple-900 dark:text-purple-300 block">
                    + Add Subcategory (e.g. Split AC, Window AC, Commercial AC)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatSubInput}
                      onChange={(e) => setNewCatSubInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newCatSubInput.trim() && !newCatSubcategories.includes(newCatSubInput.trim())) {
                            setNewCatSubcategories([...newCatSubcategories, newCatSubInput.trim()]);
                            setNewCatSubInput("");
                          }
                        }
                      }}
                      placeholder="Type subcategory name..."
                      className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCatSubInput.trim() && !newCatSubcategories.includes(newCatSubInput.trim())) {
                          setNewCatSubcategories([...newCatSubcategories, newCatSubInput.trim()]);
                          setNewCatSubInput("");
                        }
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-lux flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Tag
                    </button>
                  </div>
                </div>

                {/* Tag Pills BELOW */}
                <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/50 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Added Subcategories ({newCatSubcategories.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                    {newCatSubcategories.length > 0 ? (
                      newCatSubcategories.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-extrabold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <Layers className="w-3 h-3 text-purple-500" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => setNewCatSubcategories(newCatSubcategories.filter((t) => t !== tag))}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No subcategories added yet. Type above to add options.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-extrabold text-xs shadow-lux cursor-pointer"
                >
                  Save Category & Subcategories
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* 2. ADD SUBCATEGORY MODAL (Category is UNCHANGEABLE / READ-ONLY) */}
      {isAddSubcategoryOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const catName = targetCategoryForSubcategory;
                const subsList = categorySubcategoriesMap[catName] || [];

                const matchedCat = categoriesFromApi.find((c) => c.categoryName === catName);
                if (matchedCat && matchedCat._id) {
                  try {
                    await updateCategoryApi(matchedCat._id, {
                      categoryName: matchedCat.categoryName,
                      slug: matchedCat.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      subCategories: subsList.map((subName) => ({ name: subName })),
                      status: matchedCat.status !== false,
                    });
                    await fetchCategoriesFromBackend();
                  } catch (err) {
                    console.error("Failed to update category subcategories API:", err);
                  }
                }

                setIsAddSubcategoryOpen(false);
              }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-lg w-full space-y-5 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none max-h-[90vh] overflow-y-auto text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Add Subcategory
                    </h3>
                    <p className="text-xs text-slate-500">
                      Target category is fixed & unchangeable
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSubcategoryOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* UNCHANGEABLE / READ-ONLY CATEGORY FIELD */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block text-xs flex items-center gap-1.5">
                  Category (Locked / Unchangeable)
                </label>
                <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-between cursor-not-allowed">
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-brand-600" />
                    {targetCategoryForSubcategory}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">
                    Locked
                  </span>
                </div>
              </div>

              {/* Subcategories Multi-Add Card */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-1.5">
                  <span className="font-extrabold text-purple-900 dark:text-purple-300 text-xs">
                    Subcategories for "{targetCategoryForSubcategory}"
                  </span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded-full">
                    {(categorySubcategoriesMap[targetCategoryForSubcategory] || []).length} Existing
                  </span>
                </div>

                {/* Input ABOVE */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-purple-900 dark:text-purple-300 block">
                    + Add Subcategory Option (e.g. Split AC, Window AC, Inverter AC)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subCatInputForModal}
                      onChange={(e) => setSubCatInputForModal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (subCatInputForModal.trim()) {
                            handleAddSubcategoryToCategory(targetCategoryForSubcategory, subCatInputForModal);
                            setSubCatInputForModal("");
                          }
                        }
                      }}
                      placeholder="Type subcategory name..."
                      className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (subCatInputForModal.trim()) {
                          handleAddSubcategoryToCategory(targetCategoryForSubcategory, subCatInputForModal);
                          setSubCatInputForModal("");
                        }
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-lux flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Tag
                    </button>
                  </div>
                </div>

                {/* Tag Pills BELOW */}
                <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/50 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Active Subcategories for {targetCategoryForSubcategory}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                    {(categorySubcategoriesMap[targetCategoryForSubcategory] || []).length > 0 ? (
                      (categorySubcategoriesMap[targetCategoryForSubcategory] || []).map((sub) => (
                        <span
                          key={sub}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-extrabold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <Layers className="w-3 h-3 text-purple-500" />
                          {sub}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategoryFromCategory(targetCategoryForSubcategory, sub)}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No subcategories defined for this category yet.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubcategoryOpen(false)}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-lux cursor-pointer"
                >
                  Done & Save
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* 3. ADD / EDIT / DELETE SERVICE ACTION POPUP MODAL */}
      {isAddActionModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setActionFormError("");
                if (!newActionInput.trim()) {
                  setActionFormError("Service Action Name is required.");
                  return;
                }
                if (!actionCategoryId) {
                  setActionFormError("Category selection is mandatory.");
                  return;
                }

                const cleanAction = newActionInput.trim();
                const cleanImg = actionImageUrl.trim() || undefined;
                let res;
                if (editingActionObj) {
                  res = await updateServiceActionApi(editingActionObj._id, {
                    categoryId: actionCategoryId,
                    subCategoryId: actionSubCategoryId || undefined,
                    serviceAction: cleanAction,
                    imageUrl: cleanImg,
                    thumbnailUrl: cleanImg,
                  });
                } else {
                  res = await createServiceActionApi({
                    categoryId: actionCategoryId,
                    subCategoryId: actionSubCategoryId || undefined,
                    serviceAction: cleanAction,
                    imageUrl: cleanImg,
                    thumbnailUrl: cleanImg,
                  });
                }

                if (res && res.success !== false) {
                  toast.success(
                    editingActionObj ? "Service Action Updated" : "Service Action Created",
                    editingActionObj ? "Service action updated successfully." : "Service action created successfully."
                  );
                  fetchServiceActionsFromBackend(actionCategoryId, actionSubCategoryId || undefined);
                  setServiceActionsList((prev) => Array.from(new Set([cleanAction, ...prev])));
                  setSelectedServiceAction(cleanAction);
                  if (targetOfferingIndexForAction !== null) {
                    handleUpdateOfferingRow(targetOfferingIndexForAction, "type", cleanAction);
                  }
                  setNewActionInput("");
                  setActionImageUrl("");
                  setActionCategoryId("");
                  setActionSubCategoryId("");
                  setEditingActionObj(null);
                  setIsAddActionModalOpen(false);
                } else {
                  const errorMsg = res?.message || "Failed to save service action.";
                  setActionFormError(errorMsg);
                  toast.error("Service Action Error", errorMsg);
                }
              }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-lg w-full space-y-5 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none max-h-[90vh] overflow-y-auto text-xs animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {editingActionObj ? "Edit Service Action" : "Manage & Add Service Actions"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Define service action linked to Category & Subcategory
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingActionObj(null);
                    setNewActionInput("");
                    setActionImageUrl("");
                    setActionCategoryId("");
                    setActionSubCategoryId("");
                    setActionFormError("");
                    setIsAddActionModalOpen(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionFormError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 font-extrabold text-xs">
                  {actionFormError}
                </div>
              )}

              {/* Form Grid */}
              <div className="space-y-4">
                {/* 1. Action Name Input */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block text-xs">
                    {editingActionObj ? "Edit Action Name *" : "Service Action Name *"}
                  </label>
                  <input
                    type="text"
                    value={newActionInput}
                    onChange={(e) => setNewActionInput(e.target.value)}
                    placeholder="e.g. Inspection, Deep Cleaning, Installation"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-brand-500"
                    required
                  />
                </div>

                {/* 2. Category Select (Mandatory) */}
                <CustomSelect
                  label="Category *"
                  size="sm"
                  value={actionCategoryId}
                  placeholder="Select Category..."
                  onChange={(catId) => {
                    setActionCategoryId(catId);
                    setActionSubCategoryId("");
                  }}
                  options={categoriesFromApi.map((cat) => ({
                    value: cat._id,
                    label: cat.categoryName,
                  }))}
                />

                {/* 3. Subcategory Select (Optional) */}
                <CustomSelect
                  label="Subcategory (Optional)"
                  size="sm"
                  value={actionSubCategoryId}
                  disabled={!actionCategoryId}
                  placeholder={actionCategoryId ? "Select Subcategory (Optional)..." : "Select Category first"}
                  onChange={(subId) => setActionSubCategoryId(subId)}
                  options={(() => {
                    const matchedCat = categoriesFromApi.find((c) => c._id === actionCategoryId);
                    return (matchedCat?.subCategories || []).map((sub: any) => ({
                      value: sub._id || sub.name,
                      label: sub.name,
                    }));
                  })()}
                />

                {/* 4. Action Image / Thumbnail (Optional) */}
                <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2.5">
                  <span className="text-[11px] font-extrabold text-purple-900 dark:text-purple-300 block">
                    Service Action Image / Icon (Optional)
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Thumbnail Preview */}
                    <div className="relative w-14 h-14 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 group shadow-2xs">
                      {actionImageUrl ? (
                        <>
                          <img
                            src={actionImageUrl}
                            alt="Action Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setActionImageUrl("")}
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

                    {/* File Upload & URL Inputs */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 font-bold text-[11px] transition-colors shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleActionImageUpload(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {actionImageUrl && (
                          <button
                            type="button"
                            onClick={() => setActionImageUrl("")}
                            className="text-[11px] text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={actionImageUrl}
                        onChange={(e) => setActionImageUrl(e.target.value)}
                        placeholder="Or paste action image URL (https://...)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-lux flex items-center justify-center gap-1 cursor-pointer"
                >
                  {editingActionObj ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingActionObj ? "Update Service Action" : "Add Service Action"}</span>
                </button>
                {editingActionObj && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingActionObj(null);
                      setNewActionInput("");
                      setActionImageUrl("");
                      setActionCategoryId("");
                      setActionSubCategoryId("");
                      setActionFormError("");
                    }}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Manage Existing Service Actions from API */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Existing Service Actions ({serviceActionsFromApi.length}):
                </span>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {serviceActionsFromApi.length === 0 ? (
                    <span className="text-xs text-slate-400 italic block py-2 text-center">
                      No service actions found for the selected filter.
                    </span>
                  ) : (
                    serviceActionsFromApi.map((act) => {
                      const actName = act.name || act.serviceAction || "Unnamed Action";
                      const actImg = act.imageUrl || act.thumbnailUrl || (act as any).iconUrl;
                      const catObj = typeof act.categoryId === "object" ? act.categoryId : categoriesFromApi.find((c) => c._id === act.categoryId);
                      const catName = act.categoryName || catObj?.categoryName || "";

                      const subCatObj = typeof act.subCategoryId === "object" ? act.subCategoryId : (
                        categoriesFromApi.flatMap((c) => c.subCategories || []).find((s: any) => String(s._id) === String(act.subCategoryId))
                      );
                      const subCatName = act.subCategoryName || subCatObj?.name || "";

                      return (
                        <div
                          key={act._id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Thumbnail or Icon */}
                            {actImg ? (
                              <img
                                src={actImg}
                                alt={actName}
                                className="w-8 h-8 rounded-lg object-cover border border-purple-200 dark:border-purple-800 shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
                                <Wrench className="w-3.5 h-3.5" />
                              </div>
                            )}

                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                {actName}
                              </span>
                              {catName && (
                                <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/70 text-[10px] font-extrabold border border-brand-200 dark:border-brand-800 shrink-0">
                                  {catName}
                                </span>
                              )}
                              {subCatName && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/70 text-[10px] font-extrabold border border-purple-200 dark:border-purple-800 shrink-0">
                                  {subCatName}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingActionObj(act);
                                setNewActionInput(actName);
                                setActionCategoryId(typeof act.categoryId === "object" ? act.categoryId?._id : (act.categoryId || ""));
                                setActionSubCategoryId(typeof act.subCategoryId === "object" ? act.subCategoryId?._id : (act.subCategoryId || ""));
                                setActionImageUrl(act.imageUrl || act.thumbnailUrl || (act as any).iconUrl || "");
                                setActionFormError("");
                              }}
                              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 rounded-lg cursor-pointer transition-colors"
                              title="Edit Service Action & Image"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteActionModal({ open: true, id: act._id, name: actName })}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                              title="Delete Service Action"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingActionObj(null);
                    setNewActionInput("");
                    setActionImageUrl("");
                    setIsAddActionModalOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* 4. DELETE SERVICE ACTION CONFIRMATION POPUP MODAL */}
      {deleteActionModal?.open && (
        <Portal>
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto border border-red-200 dark:border-red-900">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Delete Service Action?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">"{deleteActionModal.name}"</strong>? This will remove it from dropdowns and catalog options.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteActionModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingActionId === deleteActionModal.id}
                  onClick={() => confirmDeleteServiceAction(deleteActionModal.id)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {deletingActionId === deleteActionModal.id ? "Deleting..." : "Delete Action"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* LIVE PURE IMAGE WEBSITE VISITOR POPUP PREVIEW MODAL */}
      {isBannerPreviewOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 group">
              {/* Close Button at top right */}
              <button
                type="button"
                onClick={() => setIsBannerPreviewOpen(false)}
                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition-colors shadow-lg cursor-pointer"
                title="Close Visitor Modal Preview"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Pure Image Banner Container (No Text, Only Banner Image) */}
              <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] bg-slate-900">
                <img
                  src={bannerImageUrl}
                  alt="Pure Image Visitor Promo Popup Banner"
                  className="w-full h-full object-cover"
                />

                {/* Optional Second Image Icon Overlay Badge at bottom left */}
                {secondBannerIconUrl && (
                  <div className="absolute bottom-4 left-4 z-20 p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/40 flex items-center gap-2 max-w-[200px]">
                    <img
                      src={secondBannerIconUrl}
                      alt="Second Icon Badge"
                      className="w-8 h-8 object-contain rounded-lg shrink-0"
                    />
                    <span className="text-[10px] font-extrabold text-slate-900 dark:text-white leading-tight">
                      Verified Partner Offer
                    </span>
                  </div>
                )}
              </div>

              {/* Action Bar Footer */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-mono truncate max-w-sm">
                  Click Target: {targetLinkUrl}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBannerPreviewOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold cursor-pointer"
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
