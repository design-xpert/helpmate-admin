"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh, clearModuleCache } from "@/lib/moduleCache";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { TableImage } from "@/components/TableImage";
import { Portal } from "@/components/Portal";
import { toast } from "@/components/Toast";
import { ServiceItem, ServiceAddon } from "@/lib/mockData";
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
  calculateDurationInMinutes,
  formatDurationLabel,
  formatHoursOnly,
  ApiCategory,
  ApiAddon,
  ApiServiceAction,
  API_BASE_URL,
  formatImageUrl,
} from "@/lib/api";
import { ShimmerRow, ShimmerCardGrid } from "@/components/ShimmerLoader";
import { Wrench, Plus, CheckCircle2, Check, Search, MapPin, Tag, X, Filter, Sliders, Briefcase, Trash2, Link, Layers, AlertCircle, Edit, ChevronDown, FileImage, Upload, Megaphone, Eye, Flame, Image as ImageIcon, Link as LinkIcon, Copy, Loader2, Clock, Lock } from "lucide-react";

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
  imageRemoved?: boolean;
  addonIds?: string[];
}

const DURATION_PRESETS = [
  { value: "15 mins", label: "15 mins" },
  { value: "30 mins", label: "30 mins" },
  { value: "45 mins", label: "45 mins" },
  { value: "60 mins", label: "60 mins (1 hr)" },
  { value: "75 mins", label: "75 mins (1 hr 15 mins)" },
  { value: "90 mins", label: "90 mins (1.5 hrs)" },
  { value: "120 mins", label: "120 mins (2 hrs)" },
  { value: "150 mins", label: "150 mins (2.5 hrs)" },
  { value: "180 mins", label: "180 mins (3 hrs)" },
  { value: "210 mins", label: "210 mins (3.5 hrs)" },
  { value: "240 mins", label: "240 mins (4 hrs)" },
  { value: "300 mins", label: "300 mins (5 hrs)" },
  { value: "2 - 3 hrs", label: "150 mins (2 - 3 hrs)" },
  { value: "3 - 4 hrs", label: "210 mins (3 - 4 hrs)" },
  { value: "4 - 5 hrs", label: "270 mins (4 - 5 hrs)" },
];

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
  const initialCachedServices = getStoredModuleData<ServiceItem[]>("cms_services") || [];
  const initialCachedAddons = getStoredModuleData<ServiceAddon[]>("cms_addons") || [];

  const [services, setServices] = useState<ServiceItem[]>(() => initialCachedServices);
  const [addons, setAddons] = useState<ServiceAddon[]>(() => initialCachedAddons);
  const [activeTab, setActiveTab] = useState<"services" | "addons">("services");
  
  // If cache is fresh (< 30s), don't show any loader at all! Exact data shows with 0 delay
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !(isModuleCacheFresh("cms_services", 30000) && initialCachedServices.length > 0);
  });

  // Category Filter Flow State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All Categories");
  const [selectedCategoryIdFilter, setSelectedCategoryIdFilter] = useState<string>("");
  const [servicesTablePage, setServicesTablePage] = useState<number>(1);
  const [servicesTotalRecords, setServicesTotalRecords] = useState<number>(0);
  const [servicesTotalPages, setServicesTotalPages] = useState<number>(1);
  const [servicesSearch, setServicesSearch] = useState<string>("");

  const activeFetchIdRef = useRef(0);

  const fetchServicesFromBackend = async (
    catsList?: ApiCategory[],
    force: boolean = false,
    categoryId?: string,
    page: number = 1,
    limit: number = 10,
    searchQuery?: string
  ) => {
    const fetchId = ++activeFetchIdRef.current;
    const activeCatId = categoryId !== undefined ? categoryId : selectedCategoryIdFilter;
    const activeSearch = searchQuery !== undefined ? searchQuery : servicesSearch;
    const cacheKey = activeCatId
      ? `cms_services_${activeCatId}_p${page}_l${limit}_s${(activeSearch || "").trim()}`
      : `cms_services_p${page}_l${limit}_s${(activeSearch || "").trim()}`;

    if (!force && isModuleCacheFresh(cacheKey, 30000)) {
      const cached = getStoredModuleData<{
        items: ServiceItem[];
        totalRecords: number;
        totalPages: number;
      }>(cacheKey);
      if (cached && cached.items && cached.items.length > 0) {
        setServices(cached.items);
        setServicesTotalRecords(cached.totalRecords || cached.items.length);
        setServicesTotalPages(cached.totalPages || 1);
        setServicesTablePage(page);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);

    try {
      const catsToUse = (catsList && catsList.length > 0) ? catsList : categoriesFromApi;
      const params: any = { page, limit: 10, forceRefresh: force };
      if (activeCatId && activeCatId !== "all" && activeCatId !== "") {
        params.categoryId = activeCatId;
      }
      if (activeSearch && activeSearch.trim()) {
        params.search = activeSearch.trim();
      }

      const pkgRes = await getPackagesApi(params);
      if (fetchId !== activeFetchIdRef.current) return;

      const rawPkgList = pkgRes?.data?.packages || (Array.isArray(pkgRes?.data) ? pkgRes.data : (Array.isArray(pkgRes) ? pkgRes : []));
      const paginationInfo = pkgRes?.pagination || pkgRes?.data?.pagination || {};
      const totalRecs = Number(paginationInfo.totalRecords ?? (paginationInfo.total ?? rawPkgList.length));
      const totalPgs = Number(paginationInfo.totalPages ?? Math.ceil(totalRecs / 10) ?? 1);

      setServicesTotalRecords(totalRecs);
      setServicesTotalPages(Math.max(totalPgs, 1));
      setServicesTablePage(page);

      let rawList = rawPkgList;

      if (Array.isArray(rawList)) {
        if (rawList.length === 0) {
          setServices([]);
          setCachedModuleData(cacheKey, { items: [], totalRecords: 0, totalPages: 1 });
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

            let serviceActionIdStr = "";
            if (actObj?._id) {
              serviceActionIdStr = String(actObj._id);
            } else if (typeof s.serviceActionId === "string" && /^[0-9a-fA-F]{24}$/.test(s.serviceActionId)) {
              serviceActionIdStr = s.serviceActionId;
            } else if (typeof s.serviceAction === "string" && /^[0-9a-fA-F]{24}$/.test(s.serviceAction)) {
              serviceActionIdStr = s.serviceAction;
            }

            // Extract category & subcategory IDs stored in serviceActionId reference
            let categoryIdStr = "";
            if (actObj?.categoryId) {
              categoryIdStr = typeof actObj.categoryId === "object"
                ? String(actObj.categoryId._id || actObj.categoryId)
                : String(actObj.categoryId);
            }
            if (!categoryIdStr && (s.categoryId?._id || s.categoryId)) {
              categoryIdStr = typeof s.categoryId === "object"
                ? String(s.categoryId._id || s.categoryId)
                : String(s.categoryId);
            }
            if (!categoryIdStr && activeCatId) {
              categoryIdStr = activeCatId;
            }

            let subCategoryIdStr = "";
            if (actObj?.subCategoryId) {
              subCategoryIdStr = typeof actObj.subCategoryId === "object"
                ? String(actObj.subCategoryId._id || actObj.subCategoryId)
                : String(actObj.subCategoryId);
            }
            if (!subCategoryIdStr && (s.subCategoryId?._id || s.subCategoryId)) {
              subCategoryIdStr = typeof s.subCategoryId === "object"
                ? String(s.subCategoryId._id || s.subCategoryId)
                : String(s.subCategoryId);
            }

            const actionVal = actObj?.serviceAction || actObj?.name || (typeof s.serviceAction === "string" ? s.serviceAction : (s.systemType?.[0] || ""));

            // Fallback lookup via serviceActionsFromApi if categoryIdStr missing
            if (!categoryIdStr && (s.serviceActionId || actionVal)) {
              const saId = typeof s.serviceActionId === "object" ? s.serviceActionId?._id : s.serviceActionId;
              const foundSa = serviceActionsFromApi.find(
                (sa: any) => (saId && sa._id === saId) || (actionVal && (sa.serviceAction === actionVal || sa.name === actionVal))
              );
              if (foundSa) {
                categoryIdStr = typeof foundSa.categoryId === "object" ? String(foundSa.categoryId?._id || foundSa.categoryId) : String(foundSa.categoryId || "");
                subCategoryIdStr = typeof foundSa.subCategoryId === "object" ? String(foundSa.subCategoryId?._id || foundSa.subCategoryId) : String(foundSa.subCategoryId || "");
              }
            }

            // Match category in catsToUse by ID or Name
            const foundCategory = catsToUse.find(
              (c) => (categoryIdStr && String(c._id) === String(categoryIdStr)) || (c.categoryName && c.categoryName.toLowerCase().trim() === safeStr(actObj?.categoryId?.categoryName || s.categoryName || s.category).toLowerCase().trim())
            );
            const categoryNameStr = foundCategory ? foundCategory.categoryName : (safeStr(actObj?.categoryId?.categoryName) || safeStr(s.categoryName) || safeStr(s.category) || "");

            // Match subcategory in foundCategory by ID or Name
            const foundSub = foundCategory?.subCategories?.find(
              (sub: any) => (subCategoryIdStr && String(sub._id) === String(subCategoryIdStr)) || (sub.name && sub.name.toLowerCase().trim() === safeStr(actObj?.subCategoryId?.name || s.subCategoryName || s.subcategory).toLowerCase().trim())
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
            const durationMinutes = calculateDurationInMinutes(s.duration);
            const durationVal = formatDurationLabel(durationMinutes);
            const subtitleVal = s.subtitle ? safeStr(s.subtitle) : "";
            const descriptionVal = s.description ? safeStr(s.description) : `Expert ${titleStr} service with 30-day HelpMate guarantee`;

            const rawImg = s.imageUrl || s.thumbnailUrl || "";
            const thumbVal = rawImg
              ? (rawImg.startsWith("data:") || rawImg.startsWith("blob:")
                  ? rawImg
                  : `${rawImg}${rawImg.includes("?") ? "&" : "?"}v=${s.updatedAt ? new Date(s.updatedAt).getTime() : Date.now()}`)
              : "";

            const rawAddons = s.addons || [];
            const mappedAddons = Array.isArray(rawAddons)
              ? rawAddons.map((a: any) => typeof a === "object" && a !== null ? { id: a._id || a.id, title: a.addonName || a.title || "Spare Part", price: a.price, unit: a.unit, category: a.category, imageUrl: a.imageUrl || a.thumbnailUrl || "", status: a.status ? "Active" : "Inactive" } : { id: String(a), title: "Spare Part", price: 199, unit: "Per Unit", category: "General", imageUrl: "", status: "Active" })
              : [];

            return {
              id: s._id,
              categoryId: categoryIdStr,
              subCategoryId: subCategoryIdStr,
              serviceActionId: serviceActionIdStr,
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
              imageUrl: thumbVal,
              addons: mappedAddons as any,
              status: s.status !== false ? "Active" : "Inactive",
              createdBy: "Admin Coordinator",
              createdDate: "Just Now",
            };
          });

          if (fetchId !== activeFetchIdRef.current) return;
          setServices(mapped);
          setCachedModuleData(cacheKey, {
            items: mapped,
            totalRecords: totalRecs,
            totalPages: Math.max(totalPgs, 1),
          });
        }
      }
    } catch (err) {
      console.error("fetchServicesFromBackend error:", err);
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const fetchAddonsFromBackend = async (catId?: string, subCatId?: string, force: boolean = false) => {
    if (!force && !catId && !subCatId && isModuleCacheFresh("cms_addons", 30000)) {
      const cached = getStoredModuleData<ServiceAddon[]>("cms_addons");
      if (cached && cached.length > 0) {
        setAddons(cached);
        return;
      }
    }
    try {
      let res;
      if (catId || subCatId) {
        res = await getAddonDropdownApi({ categoryId: catId, subCategoryId: subCatId, forceRefresh: force });
      } else {
        res = await getAddonsApi({ forceRefresh: force });
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

      const catsList = categoriesFromApi.length > 0 ? categoriesFromApi : (getStoredModuleData<ApiCategory[]>("cms_categories_api") || []);
      const mapped: ServiceAddon[] = rawList.map((a: any) => {
        const catIdVal = typeof a.categoryId === "object" ? a.categoryId?._id : a.categoryId;
        const subCatIdVal = typeof a.subCategoryId === "object" ? a.subCategoryId?._id : a.subCategoryId;
        const matchedCat = catsList.find(
          (c) => (catIdVal && c._id === catIdVal) || (a.category && c.categoryName.toLowerCase().trim() === a.category.toLowerCase().trim())
        );
        const matchedSub = matchedCat?.subCategories?.find(
          (s: any) => (subCatIdVal && s._id === subCatIdVal) || (a.subcategory && s.name.toLowerCase().trim() === a.subcategory.toLowerCase().trim())
        );
        const resolvedCatName = matchedCat?.categoryName || (typeof a.categoryId === "object" ? a.categoryId?.categoryName : a.category) || a.categoryName || "General";
        const resolvedSubName = matchedSub?.name || (typeof a.subCategoryId === "object" ? a.subCategoryId?.name : a.subcategory) || a.subCategoryName || "";

        return {
          id: a._id || a.id,
          title: a.addonName || a.title || "Spare Part",
          price: a.price ?? 199,
          unit: a.unit || "Per Unit",
          category: resolvedCatName,
          subcategory: resolvedSubName,
          description: a.description || "",
          imageUrl: a.imageUrl || a.thumbnailUrl || "",
          categoryId: catIdVal || matchedCat?._id,
          subCategoryId: subCatIdVal || matchedSub?._id,
          status: a.status !== false ? "Active" : "Inactive",
        };
      });
      setAddons(mapped);
      if (!catId && !subCatId) {
        setCachedModuleData("cms_addons", mapped);
      }
    } catch (e) {
      console.error("fetchAddonsFromBackend error:", e);
      setAddons([]);
    }
  };

  const fetchCategoriesFromBackend = async (force: boolean = false): Promise<ApiCategory[]> => {
    if (!force && isModuleCacheFresh("cms_categories_api", 30000)) {
      const cached = getStoredModuleData<ApiCategory[]>("cms_categories_api");
      if (cached && cached.length > 0) {
        setCategoriesFromApi(cached);
        return cached;
      }
    }
    try {
      const res = await getCategoriesApi({ forceRefresh: force });
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
    // Only call this API when category or subcategory is selected
    if (!catId) {
      setServiceActionsFromApi([]);
      setServiceActionsList([]);
      return;
    }
    try {
      const res = await getServiceActionDropdownApi({
        categoryId: catId,
        subCategoryId: subCatId || undefined,
        forceRefresh: force,
      });
      const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (res && res.success !== false) {
        setServiceActionsFromApi(rawList);
        const names = rawList.map((a: any) => a.serviceAction || a.name || "").filter(Boolean);
        setServiceActionsList(Array.from(new Set(names)));
      }
    } catch (e) {
      console.error("fetchServiceActionsFromBackend error:", e);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      // Check if all module data is fresh (within 30 seconds)
      const hasFreshServices = isModuleCacheFresh("cms_services", 30000) && initialCachedServices.length > 0;
      const hasFreshCats = isModuleCacheFresh("cms_categories_api", 30000) && initialCachedCats.length > 0;
      const hasFreshAddons = isModuleCacheFresh("cms_addons", 30000) && initialCachedAddons.length > 0;

      // If all data was loaded within 30 seconds, DO NOT CALL ANY APIS! Show exact data with zero load!
      if (hasFreshServices && hasFreshCats && hasFreshAddons) {
        setIsLoading(false);
        return;
      }

      try {
        const [cats] = await Promise.all([
          fetchCategoriesFromBackend(),
          fetchAddonsFromBackend(),
        ]);
        await fetchServicesFromBackend(cats, false, "", 1, 10);
      } catch (e) {
        console.error("loadAllData error:", e);
      }
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
    setServices((prev) => {
      const updated = prev.filter((s) => s.id !== serviceId);
      setCachedModuleData("cms_services", updated);
      return updated;
    });
  };

  const handleToggleServiceStatus = async (serviceId: string, currentStatus?: string) => {
    const newStatusBool = currentStatus !== "Active";
    const newStatusStr: "Active" | "Inactive" = newStatusBool ? "Active" : "Inactive";

    if (serviceId.length === 24) {
      await updatePackageApi(serviceId, { status: newStatusBool });
    }
    setServices((prev) => {
      const updated = prev.map((s) => (s.id === serviceId ? { ...s, status: newStatusStr } : s));
      setCachedModuleData("cms_services", updated);
      return updated;
    });
  };

  // Add-ons Management Modal State
  const [isAddonsModalOpen, setIsAddonsModalOpen] = useState(false);
  const [offeringAddonModalIndex, setOfferingAddonModalIndex] = useState<number | null>(null);
  const [addonModalSearch, setAddonModalSearch] = useState("");
  const [addonModalCategoryFilter, setAddonModalCategoryFilter] = useState("All");
  const [addonModalSubCategoryFilter, setAddonModalSubCategoryFilter] = useState("All");
  const [addonModalViewFilter, setAddonModalViewFilter] = useState<"all" | "linked">("all");
  const [addonToDelete, setAddonToDelete] = useState<ServiceAddon | null>(null);
  const [isDeletingAddon, setIsDeletingAddon] = useState(false);

  // Selected Service Details & Add-ons Modal State
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const handleOpenAddonsModal = (service?: ServiceItem | null) => {
    setSelectedService(service || null);
    setOfferingAddonModalIndex(null);
    setAddonModalSearch("");
    setAddonModalViewFilter("all");
    setAddonToDelete(null);

    if (!service && categoriesFromApi.length > 0) {
      const firstCat = categoriesFromApi[0];
      setAddonModalCategoryFilter(firstCat.categoryName);
      const firstSub = firstCat.subCategories?.[0];
      setAddonModalSubCategoryFilter(firstSub?.name || "All");
    } else {
      setAddonModalCategoryFilter("All");
      setAddonModalSubCategoryFilter("All");
    }

    setIsAddonsModalOpen(true);
  };

  const addonModalCategories = useMemo(() => {
    const set = new Set<string>();
    addons.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ["All", ...Array.from(set)];
  }, [addons]);

  const handleDeleteAddon = async (addonId: string) => {
    try {
      setIsDeletingAddon(true);
      if (addonId.length === 24) {
        await deleteAddonApi(addonId);
      }
      setAddons((prev) => {
        const updated = prev.filter((a) => a.id !== addonId);
        setCachedModuleData("cms_addons", updated);
        return updated;
      });
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          addons: s.addons ? s.addons.filter((a) => a.id !== addonId) : [],
        }))
      );
      setSelectedService((prev) =>
        prev ? { ...prev, addons: prev.addons ? prev.addons.filter((a) => a.id !== addonId) : [] } : null
      );
      setServiceOfferings((prev) =>
        prev.map((off) => ({
          ...off,
          addonIds: off.addonIds ? off.addonIds.filter((id) => id !== addonId) : [],
        }))
      );
      setAddonToDelete(null);
      toast.success("Add-on Deleted", "Add-on deleted successfully.");
    } catch (err: any) {
      console.error("handleDeleteAddon error:", err);
      toast.error("Delete Error", err?.message || "Failed to delete add-on.");
    } finally {
      setIsDeletingAddon(false);
    }
  };

  const handleToggleAddonStatus = async (addonId: string, currentStatus?: string) => {
    const newStatusBool = currentStatus !== "Active";
    const newStatusStr: "Active" | "Inactive" = newStatusBool ? "Active" : "Inactive";

    if (addonId.length === 24) {
      await toggleAddonStatusApi(addonId, newStatusBool);
    }
    setAddons((prev) => {
      const updated = prev.map((a) => (a.id === addonId ? { ...a, status: newStatusStr } : a));
      setCachedModuleData("cms_addons", updated);
      return updated;
    });
    setServices((prev) =>
      prev.map((s) => ({
        ...s,
        addons: s.addons ? s.addons.map((a) => (a.id === addonId ? { ...a, status: newStatusStr } : a)) : [],
      }))
    );
    setSelectedService((prev) =>
      prev
        ? {
            ...prev,
            addons: prev.addons ? prev.addons.map((a) => (a.id === addonId ? { ...a, status: newStatusStr } : a)) : [],
          }
        : null
    );
  };

  // Website Visitor Promo Popup Banner State
  const [isBannerEnabled, setIsBannerEnabled] = useState(true);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [secondBannerIconUrl, setSecondBannerIconUrl] = useState("");
  const [targetLinkUrl, setTargetLinkUrl] = useState("https://helpmate-theta.vercel.app/services/ac");
  const [isBannerPreviewOpen, setIsBannerPreviewOpen] = useState(false);

  // Called only when typing has stopped in DataTable (or on Enter / clear)
  const handleServicesSearchChange = (val: string) => {
    setServicesSearch(val);
    setServicesTablePage(1);
    fetchServicesFromBackend(categoriesFromApi, true, selectedCategoryIdFilter, 1, 10, val);
  };

  // Category Filter Flow Actions - fetches from /api/package?categoryId=${catId}&page=1&limit=10
  const handleSelectCategoryFilter = async (catId: string, catName: string) => {
    setSelectedCategoryIdFilter(catId);
    setSelectedCategoryFilter(catName);
    setServicesTablePage(1);
    await fetchServicesFromBackend(categoriesFromApi, true, catId, 1, 10, servicesSearch);
  };

  const handleServicesPageChange = async (newPage: number) => {
    setServicesTablePage(newPage);
    await fetchServicesFromBackend(categoriesFromApi, true, selectedCategoryIdFilter, newPage, 10, servicesSearch);
  };

  const categoriesList = [
    "All Categories",
    ...Array.from(new Set(categoriesFromApi.map((c) => c.categoryName).filter(Boolean))),
  ];

  // Helper to toggle linking an addon to a service
  const handleToggleLinkAddonToService = async (serviceId: string, addon: ServiceAddon) => {
    let nextAddons: ServiceAddon[] = [];
    setServices((prevServices) =>
      prevServices.map((srv) => {
        if (srv.id === serviceId) {
          const currentAddons = srv.addons || [];
          const exists = currentAddons.some((a) => a.id === addon.id);
          const updatedAddons = exists
            ? currentAddons.filter((a) => a.id !== addon.id)
            : [...currentAddons, addon];
          nextAddons = updatedAddons;

          const updatedService = { ...srv, addons: updatedAddons };
          if (selectedService && selectedService.id === serviceId) {
            setSelectedService(updatedService);
          }
          return updatedService;
        }
        return srv;
      })
    );

    if (serviceId.length === 24) {
      try {
        const addonIds = nextAddons.map((a) => a.id).filter((id) => id && id.length === 24);
        const form = new FormData();
        form.append("addons", JSON.stringify(addonIds));
        await updatePackageApi(serviceId, form);
      } catch (err) {
        console.error("Error updating service addons:", err);
      }
    }
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
          packageId={row.id}
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
        <div className="flex flex-col">
          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
            ₹{row.price}
          </span>
          {row.duration && (
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              {typeof row.duration === "number" || /^\d+$/.test(String(row.duration).trim())
                ? formatDurationLabel(calculateDurationInMinutes(row.duration))
                : row.duration}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "addons",
      header: "Add-ons",
      accessor: (row) => {
        const count = row.addons?.length || 0;
        return (
          <button
            type="button"
            onClick={() => handleOpenAddonsModal(row)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer group shadow-2xs ${
              count > 0
                ? "bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700"
            }`}
            title={`Click to view & manage add-ons (${count} linked)`}
          >
            <Wrench className={`w-3.5 h-3.5 transition-transform group-hover:rotate-12 ${count > 0 ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
            <span>{count} Add-on{count === 1 ? "" : "s"}</span>
          </button>
        );
      },
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
              onClick: () => handleOpenAddonsModal(row),
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

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddAddonOpen, setIsAddAddonOpen] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isSavingAddon, setIsSavingAddon] = useState(false);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false);

  // Step 1 State: Master Category & Option to Add New Category
  const [serviceCategory, setServiceCategory] = useState("");
  const [serviceThumbnail, setServiceThumbnail] = useState("");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Top-level Service Action selection in Add/Edit Drawer
  const [selectedServiceAction, setSelectedServiceAction] = useState<string>("");
  const [selectedServiceActionId, setSelectedServiceActionId] = useState<string>("");

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
  const [addonImageFile, setAddonImageFile] = useState<File | null>(null);

  const openAddAddonDrawer = (defaultCatId?: string, defaultSubCatId?: string) => {
    setEditingAddonId(null);
    setAddonTitle("");
    setAddonPrice("199");
    setAddonUnit("Per Unit");
    setAddonDescription("");
    setAddonImageUrl("");
    setAddonImageFile(null);

    const initialCat = (categoriesFromApi.length > 0 ? categoriesFromApi : []).find(
      (c) =>
        (defaultCatId && c._id === defaultCatId) ||
        (defaultCatId && c.categoryName.toLowerCase().trim() === defaultCatId.toLowerCase().trim()) ||
        (serviceCategory && (c._id === serviceCategory || c.categoryName.toLowerCase().trim() === serviceCategory.toLowerCase().trim()))
    ) || categoriesFromApi[0];

    const initialCatName = initialCat?.categoryName || serviceCategory || "";
    setAddonCategory(initialCatName);
    setAddonCategoryId(initialCat?._id || defaultCatId || "");

    const initialSub = initialCat?.subCategories?.find(
      (s: any) =>
        (defaultSubCatId && s._id === defaultSubCatId) ||
        (defaultSubCatId && s.name.toLowerCase().trim() === defaultSubCatId.toLowerCase().trim()) ||
        (selectedSubcategory && (s._id === selectedSubcategory || s.name.toLowerCase().trim() === selectedSubcategory.toLowerCase().trim()))
    ) || initialCat?.subCategories?.[0];

    setAddonSubCategory(initialSub?.name || selectedSubcategory || "");
    setAddonSubCategoryId(initialSub?._id || defaultSubCatId || "");

    setIsAddAddonOpen(true);
  };

  const openEditAddonDrawer = (item: any) => {
    setEditingAddonId(item.id || item._id);
    setAddonTitle(item.title || item.addonName || "");
    setAddonPrice(String(item.price || 199));
    setAddonUnit(item.unit || "Per Unit");
    setAddonDescription(item.description || "");
    setAddonImageUrl(item.imageUrl || "");
    setAddonImageFile(null);

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



  const handleAddOfferingRow = () => {
    setServiceOfferings((prev) => [
      ...prev,
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
        imageFile: undefined,
        imageRemoved: false,
        addonIds: [],
      },
    ]);
  };

  const handleUpdateOfferingRow = (
    index: number,
    fieldOrUpdates: keyof ServiceOfferingRow | Partial<ServiceOfferingRow>,
    value?: any
  ) => {
    setServiceOfferings((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      if (typeof fieldOrUpdates === "object") {
        updated[index] = { ...updated[index], ...fieldOrUpdates };
      } else {
        updated[index] = { ...updated[index], [fieldOrUpdates]: value };
      }
      return updated;
    });
  };

  const handleOpenAddonsModalForOffering = (packageIndex: number) => {
    setSelectedService(null);
    setOfferingAddonModalIndex(packageIndex);
    setAddonModalSearch("");
    setAddonModalViewFilter("all");
    setAddonToDelete(null);
    setIsAddonsModalOpen(true);
  };

  const handleToggleLinkAddonToOffering = (addonId: string) => {
    if (offeringAddonModalIndex === null) return;
    const currentOff = serviceOfferings[offeringAddonModalIndex];
    if (!currentOff) return;
    const currentIds = currentOff.addonIds || [];
    const exists = currentIds.includes(addonId);
    const updated = exists ? currentIds.filter((id) => id !== addonId) : [...currentIds, addonId];
    handleUpdateOfferingRow(offeringAddonModalIndex, "addonIds", updated);
  };

  // Active Scoped Category & Subcategory for the Addons Modal
  const activeModalCategoryInfo = useMemo(() => {
    let catId = "";
    let catName = "";
    let subCatId = "";
    let subCatName = "";
    let isScopedToService = false;

    if (offeringAddonModalIndex !== null) {
      isScopedToService = true;
      const matchedCat = categoriesFromApi.find(
        (c) => c._id === serviceCategory || c.categoryName.toLowerCase().trim() === (serviceCategory || "").toLowerCase().trim()
      );
      catId = matchedCat?._id || serviceCategory || "";
      catName = matchedCat?.categoryName || serviceCategory || "";

      const matchedSub = matchedCat?.subCategories?.find(
        (s: any) => s._id === selectedSubcategory || s.name.toLowerCase().trim() === (selectedSubcategory || "").toLowerCase().trim()
      );
      subCatId = matchedSub?._id || selectedSubcategory || "";
      subCatName = matchedSub?.name || selectedSubcategory || "";
    } else if (selectedService) {
      isScopedToService = true;
      const rawCat = selectedService.category || selectedService.categoryId || "";
      const rawSub = selectedService.subcategory || selectedService.subCategoryId || "";

      const matchedCat = categoriesFromApi.find(
        (c) => (selectedService.categoryId && c._id === selectedService.categoryId) ||
               (rawCat && c._id === rawCat) ||
               (rawCat && c.categoryName.toLowerCase().trim() === rawCat.toLowerCase().trim())
      );
      catId = matchedCat?._id || selectedService.categoryId || rawCat;
      catName = matchedCat?.categoryName || selectedService.category || rawCat;

      const matchedSub = matchedCat?.subCategories?.find(
        (s: any) => (selectedService.subCategoryId && s._id === selectedService.subCategoryId) ||
                   (rawSub && s._id === rawSub) ||
                   (rawSub && s.name.toLowerCase().trim() === rawSub.toLowerCase().trim())
      );
      subCatId = matchedSub?._id || selectedService.subCategoryId || rawSub;
      subCatName = matchedSub?.name || selectedService.subcategory || rawSub;
    } else {
      // Standalone mode: using addonModalCategoryFilter and addonModalSubCategoryFilter
      const matchedCat = categoriesFromApi.find(
        (c) => c.categoryName === addonModalCategoryFilter || c._id === addonModalCategoryFilter
      ) || categoriesFromApi[0];
      catId = matchedCat?._id || "";
      catName = matchedCat?.categoryName || "";

      const subList = matchedCat?.subCategories || [];
      const matchedSub = subList.find(
        (s: any) => s.name === addonModalSubCategoryFilter || s._id === addonModalSubCategoryFilter
      ) || subList[0];
      subCatId = matchedSub?._id || "";
      subCatName = matchedSub?.name || "";
    }

    return { catId, catName, subCatId, subCatName, isScopedToService };
  }, [offeringAddonModalIndex, selectedService, serviceCategory, selectedSubcategory, categoriesFromApi, addonModalCategoryFilter, addonModalSubCategoryFilter]);

  const modalFilteredAddons = useMemo(() => {
    const { catId, catName, subCatId, subCatName } = activeModalCategoryInfo;

    return addons.filter((addon) => {
      // 1. Linked view filter
      if (offeringAddonModalIndex !== null) {
        if (addonModalViewFilter === "linked") {
          const isLinked = serviceOfferings[offeringAddonModalIndex]?.addonIds?.includes(addon.id);
          if (!isLinked) return false;
        }
      } else if (selectedService && addonModalViewFilter === "linked") {
        const isLinked = selectedService.addons?.some((a) => a.id === addon.id);
        if (!isLinked) return false;
      }

      // 2. Strict Category and Subcategory matching ("addon must show by category and subcategory dont show all addons")
      if (catId || catName) {
        const matchesCategory =
          (catId && addon.categoryId === catId) ||
          (catName && addon.category && addon.category.toLowerCase().trim() === catName.toLowerCase().trim());
        if (!matchesCategory) return false;
      }

      if (subCatId || subCatName) {
        const matchesSubCategory =
          (subCatId && addon.subCategoryId === subCatId) ||
          (subCatName && addon.subcategory && addon.subcategory.toLowerCase().trim() === subCatName.toLowerCase().trim());
        if (!matchesSubCategory) return false;
      }

      // 3. Search query
      if (addonModalSearch.trim()) {
        const q = addonModalSearch.toLowerCase().trim();
        const matchesTitle = (addon.title || "").toLowerCase().includes(q);
        const matchesDesc = (addon.description || "").toLowerCase().includes(q);
        const matchesPrice = String(addon.price || "").includes(q);
        if (!matchesTitle && !matchesDesc && !matchesPrice) {
          return false;
        }
      }

      return true;
    });
  }, [addons, offeringAddonModalIndex, serviceOfferings, selectedService, addonModalViewFilter, addonModalSearch, activeModalCategoryInfo]);

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
    if (categoriesFromApi.length === 0) fetchCategoriesFromBackend();
    if (addons.length === 0) fetchAddonsFromBackend();
    setEditingServiceId(null);
    setServiceCategory("");
    setSelectedSubcategory("");
    setSelectedServiceAction("");
    setSelectedServiceActionId("");
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

  const openEditServiceDrawer = (item: ServiceItem) => {
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
    const actionId = item.serviceActionId || "";
    setSelectedServiceActionId(actionId);
    setSelectedServiceAction(actionId || actionVal);

    if (actionVal) {
      setServiceActionsList((prev) => (prev.includes(actionVal) ? prev : [actionVal, ...prev]));
    }

    // Immediately fetch service actions for this category & subcategory from backend
    const resolvedCatId = matchedCategory?._id || item.categoryId;
    const resolvedSubId = matchedSub?._id || item.subCategoryId;
    if (resolvedCatId) {
      fetchServiceActionsFromBackend(resolvedCatId, resolvedSubId);
    }

    // Prefill Addons & Package Image from existing item
    const extractedAddonIds = Array.isArray(item.addons)
      ? item.addons.map((a: any) => (typeof a === "string" ? a : (a.id || a._id))).filter(Boolean)
      : [];

    const packageImage = safeStr(item.thumbnailUrl) || safeStr((item as any).imageUrl);
    const includedItems = safeStringArray(item.includeInPackage);
    const excludedItems = safeStringArray(item.excludeFromPackage);

    const initialDurationMins = calculateDurationInMinutes(item.duration);
    const matchedPreset = DURATION_PRESETS.find(
      (p) => p.value === item.duration || calculateDurationInMinutes(p.value) === initialDurationMins
    );

    setServiceOfferings([
      {
        id: item.id,
        title: item.title,
        subtitle: safeStr(item.subtitle),
        price: Number(item.price),
        originalPrice: Number(item.originalPrice),
        duration: matchedPreset
          ? matchedPreset.value
          : "45 mins",
        description: safeStr(item.description) || safeStr(item.subtitle) || "",
        includeInPackage: includedItems.length ? includedItems : ["• "],
        excludeFromPackage: excludedItems.length ? excludedItems : ["• "],
        thumbnailUrl: packageImage,
        imageFile: undefined,
        imageRemoved: false,
        addonIds: extractedAddonIds,
      },
    ]);

    if (Array.isArray(item.addons)) {
      const extraAddons: ServiceAddon[] = item.addons
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

    // Instant drawer opening with zero delay and zero API calls
    setIsAddServiceOpen(true);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingService) return;

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

    setIsSavingService(true);
    try {
      if (editingServiceId) {
        // UPDATE MODE: Call ONLY updatePackageApi and recall package API!
        // DO NOT call getCategoriesApi, getServiceActionDropdownApi, or createServiceActionApi!
        const firstOff = validOfferings[0];
        const packageAddonIds = (firstOff.addonIds || []).filter((id) => id.length === 24);

        if (editingServiceId.length === 24) {
          const form = new FormData();
          form.append("packageName", firstOff.title);
          form.append("subtitle", firstOff.subtitle && firstOff.subtitle.trim() ? firstOff.subtitle.trim() : "");
          form.append("description", firstOff.description && firstOff.description.trim() ? firstOff.description.trim() : "");
          form.append("price", String(firstOff.price));
          const firstOffDurationMins = calculateDurationInMinutes(firstOff.duration);
          form.append("duration", String(firstOffDurationMins));
          form.append("originalPrice", String(firstOff.originalPrice || Math.round((firstOff.price || 699) * 1.3)));
          form.append("includeInPackage", JSON.stringify(cleanPackagePoints(firstOff.includeInPackage)));
          form.append("excludeFromPackage", JSON.stringify(cleanPackagePoints(firstOff.excludeFromPackage)));
          // Send addons in array format (works for 0, 1, or multiple addons)
          form.append("addons", JSON.stringify(packageAddonIds));

          // Strictly resolve serviceActionId as a 24-character hexadecimal ObjectId
          let actionIdToUse: string | undefined = undefined;

          // 1. Check selectedServiceActionId
          if (selectedServiceActionId && /^[0-9a-fA-F]{24}$/.test(selectedServiceActionId)) {
            actionIdToUse = selectedServiceActionId;
          }

          // 2. Check selectedServiceAction if 24-hex
          if (!actionIdToUse && selectedServiceAction && /^[0-9a-fA-F]{24}$/.test(selectedServiceAction)) {
            actionIdToUse = selectedServiceAction;
          }

          // 3. Match from serviceActionsFromApi
          if (!actionIdToUse && (selectedServiceAction || selectedServiceActionId)) {
            const queryStr = selectedServiceAction || selectedServiceActionId;
            const matchedActionObj = (serviceActionsFromApi || []).find(
              (act: any) =>
                act._id === queryStr ||
                (act.serviceAction && act.serviceAction.toLowerCase().trim() === queryStr.toLowerCase().trim()) ||
                (act.name && act.name.toLowerCase().trim() === queryStr.toLowerCase().trim()) ||
                (act.serviceName && act.serviceName.toLowerCase().trim() === queryStr.toLowerCase().trim())
            );
            if (matchedActionObj?._id && /^[0-9a-fA-F]{24}$/.test(matchedActionObj._id)) {
              actionIdToUse = matchedActionObj._id;
            }
          }

          // 4. Fallback to original service's serviceActionId
          if (!actionIdToUse && editingServiceId) {
            const origItem = services.find((s) => s.id === editingServiceId);
            if (origItem?.serviceActionId && /^[0-9a-fA-F]{24}$/.test(origItem.serviceActionId)) {
              actionIdToUse = origItem.serviceActionId;
            }
          }

          // 5. Fallback via backend dropdown API if still not resolved
          if (!actionIdToUse) {
            const matchedCategory = categoriesFromApi.find(
              (c) => c.categoryName.toLowerCase().trim() === serviceCategory.toLowerCase().trim() || c._id === serviceCategory
            );
            const matchedSub = matchedCategory?.subCategories?.find(
              (s: any) => s.name.toLowerCase().trim() === selectedSubcategory.toLowerCase().trim() || s._id === selectedSubcategory
            );
            const catIdToUse = matchedCategory?._id;
            const subCatIdToUse = matchedSub?._id;

            if (catIdToUse) {
              const dropRes = await getServiceActionDropdownApi({ categoryId: catIdToUse, subCategoryId: subCatIdToUse || undefined, forceRefresh: true });
              const dropList = Array.isArray(dropRes?.data) ? dropRes.data : [];
              const targetQuery = selectedServiceAction || selectedServiceActionId;
              const foundInDrop = dropList.find(
                (act: any) =>
                  act._id === targetQuery ||
                  (act.serviceAction && act.serviceAction.toLowerCase().trim() === targetQuery.toLowerCase().trim()) ||
                  (act.name && act.name.toLowerCase().trim() === targetQuery.toLowerCase().trim())
              );
              if (foundInDrop?._id && /^[0-9a-fA-F]{24}$/.test(foundInDrop._id)) {
                actionIdToUse = foundInDrop._id;
              } else if (targetQuery && !/^[0-9a-fA-F]{24}$/.test(targetQuery)) {
                const createActRes = await createServiceActionApi({
                  categoryId: catIdToUse,
                  subCategoryId: subCatIdToUse || undefined,
                  serviceAction: targetQuery,
                });
                if (createActRes?.success && createActRes?.data?._id && /^[0-9a-fA-F]{24}$/.test(createActRes.data._id)) {
                  actionIdToUse = createActRes.data._id;
                }
              }
            }
          }

          if (actionIdToUse && /^[0-9a-fA-F]{24}$/.test(actionIdToUse)) {
            form.append("serviceActionId", actionIdToUse);
          } else {
            toast.error("Invalid Service Action", "Service Action ID is missing or invalid. Please select a valid Service Action.");
            setIsSavingService(false);
            return;
          }

          if (firstOff.imageFile instanceof File) {
            form.append("image", firstOff.imageFile);
          } else if (firstOff.imageRemoved || !firstOff.thumbnailUrl) {
            form.append("removeImage", "true");
            form.append("imageUrl", "");
          }

          const updatePkgRes = await updatePackageApi(editingServiceId, form);
          if (updatePkgRes && updatePkgRes.success === false) {
            toast.error("Update Package Failed", updatePkgRes.message || "Unknown error");
            return;
          }

          toast.success("Package Updated", `"${firstOff.title}" package updated successfully.`);

          // 1. Instantly close the sliding form drawer on successful update
          setIsAddServiceOpen(false);
          setEditingServiceId(null);
          setIsAddingNewCategory(false);
          setNewCategoryName("");

          const updatedImageUrl = updatePkgRes?.data?.imageUrl || (firstOff.imageRemoved ? "" : firstOff.thumbnailUrl);

          // 2. Immediate table update for instant 0ms visual feedback
          setServices((prev) =>
            prev.map((s) => {
              if (s.id === editingServiceId) {
                return {
                  ...s,
                  serviceActionId: actionIdToUse,
                  title: firstOff.title,
                  subtitle: safeStr(firstOff.subtitle),
                  description: safeStr(firstOff.description) || s.description,
                  price: Number(firstOff.price),
                  originalPrice: Number(firstOff.originalPrice) || Math.round(Number(firstOff.price) * 1.3),
                  duration: formatDurationLabel(firstOffDurationMins),
                  includeInPackage: cleanPackagePoints(firstOff.includeInPackage),
                  excludeFromPackage: cleanPackagePoints(firstOff.excludeFromPackage),
                  addons: addons.filter((a) => (firstOff.addonIds || []).includes(a.id)),
                  thumbnailUrl: firstOff.imageFile instanceof File
                    ? (updatedImageUrl || firstOff.thumbnailUrl || s.thumbnailUrl || "")
                    : (firstOff.imageRemoved ? "" : (updatedImageUrl || firstOff.thumbnailUrl || "")),
                  imageUrl: firstOff.imageFile instanceof File
                    ? (updatedImageUrl || firstOff.thumbnailUrl || s.thumbnailUrl || "")
                    : (firstOff.imageRemoved ? "" : ((s as any).imageUrl || updatedImageUrl || firstOff.thumbnailUrl || "")),
                };
              }
              return s;
            })
          );

          if (validOfferings.length > 1 && actionIdToUse && actionIdToUse.length === 24) {
            const extraPackageListPayload = validOfferings.slice(1).map((off) => ({
              packageName: off.title,
              subtitle: off.subtitle && off.subtitle.trim() ? off.subtitle.trim() : undefined,
              description: off.description && off.description.trim() ? off.description.trim() : `${off.title} service`,
              price: off.price,
              originalPrice: off.originalPrice || Math.round((off.price || 699) * 1.3),
              includeInPackage: cleanPackagePoints(off.includeInPackage),
              excludeFromPackage: cleanPackagePoints(off.excludeFromPackage),
              duration: calculateDurationInMinutes(off.duration),
              imageUrl: off.thumbnailUrl || "",
              thumbnailUrl: off.thumbnailUrl || "",
              imageFile: off.imageFile,
              addons: (off.addonIds || []).filter((id) => id.length === 24),
            }));

            await createPackageApi({
              serviceActionId: actionIdToUse,
              packages: extraPackageListPayload,
            });
          }
        }

        // 3. Recall package API from backend to reload and guarantee 100% perfect, current data
        await fetchServicesFromBackend(categoriesFromApi, true, selectedCategoryIdFilter, servicesTablePage, 10);
        return;
      }

      // CREATE MODE: Add new package offers matching POST /api/package schema
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
          act._id === selectedServiceActionId ||
          act.serviceAction === selectedServiceAction ||
          act.name === selectedServiceAction ||
          act.serviceName === selectedServiceAction
      );
      let actionIdToUse = (selectedServiceActionId?.length === 24 ? selectedServiceActionId : undefined) ||
        matchedActionObj?._id ||
        (selectedServiceAction?.length === 24 ? selectedServiceAction : undefined);

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
        duration: calculateDurationInMinutes(off.duration),
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
        // Force-refresh package list to display the new data in the table
        await fetchServicesFromBackend(categoriesFromApi, true, selectedCategoryIdFilter, 1, 10);
      }

      if (isAddingNewCategory && newCategoryName.trim()) {
        setCustomCategories([...customCategories, newCategoryName.trim()]);
      }

      setEditingServiceId(null);
      setIsAddingNewCategory(false);
      setNewCategoryName("");
      setIsAddServiceOpen(false);
    } catch (err: any) {
      console.error("handleCreateService error:", err);
      toast.error("Save Failed", err?.message || "Failed to save service package.");
    } finally {
      setIsSavingService(false);
    }
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingAddon) return;
    if (!addonTitle.trim()) {
      toast.error("Title Required", "Add-on Item Title is required.");
      return;
    }

    setIsSavingAddon(true);
    try {
      const matchedCat = categoriesFromApi.find(
        (c) => c._id === addonCategoryId || c.categoryName === addonCategory
      ) || categoriesFromApi[0];

      const catIdToUse = matchedCat?._id || addonCategoryId;
      if (!catIdToUse) {
        toast.error("Category Required", "Please select a category for this add-on.");
        setIsSavingAddon(false);
        return;
      }

      const matchedSub = matchedCat?.subCategories?.find(
        (s: any) => s._id === addonSubCategoryId || s.name === addonSubCategory
      ) || matchedCat?.subCategories?.[0];

      const subCatIdToUse = matchedSub?._id || addonSubCategoryId;

      const payload = {
        categoryId: catIdToUse,
        subCategoryId: subCatIdToUse || undefined,
        addonName: addonTitle.trim(),
        title: addonTitle.trim(),
        description: addonDescription.trim(),
        price: parseFloat(addonPrice) || 0,
        unit: addonUnit.trim() || "Per Unit",
        image: addonImageFile || undefined,
        imageUrl: addonImageUrl && !addonImageUrl.startsWith("blob:") ? addonImageUrl.trim() : undefined,
        category: matchedCat?.categoryName || addonCategory,
        status: true,
      };

      if (editingAddonId && editingAddonId.length === 24) {
        const updateRes = await updateAddonApi(editingAddonId, payload);
        if (updateRes && updateRes.success === false) {
          toast.error("Update Add-on Failed", updateRes.message || "Unknown error");
          return;
        }
        toast.success("Add-on Updated", `"${addonTitle.trim()}" updated successfully.`);
      } else {
        const createRes = await createAddonApi(payload);
        if (createRes && createRes.success === false) {
          toast.error("Create Add-on Failed", createRes.message || "Unknown error");
          return;
        }
        const createdId = (createRes as any)?.data?._id || (createRes as any)?.data?.id || (createRes as any)?._id || (createRes as any)?.id;
        if (offeringAddonModalIndex !== null && createdId) {
          setServiceOfferings((prev) => {
            const updated = [...prev];
            if (updated[offeringAddonModalIndex]) {
              const currentIds = updated[offeringAddonModalIndex].addonIds || [];
              if (!currentIds.includes(createdId)) {
                updated[offeringAddonModalIndex] = {
                  ...updated[offeringAddonModalIndex],
                  addonIds: [...currentIds, createdId],
                };
              }
            }
            return updated;
          });
        }
        toast.success("Add-on Created", `"${addonTitle.trim()}" created successfully.`);
      }

      // Instantly close the sliding form drawer
      setIsAddAddonOpen(false);
      setEditingAddonId(null);
      setAddonTitle("");
      setAddonDescription("");
      setAddonImageUrl("");
      setAddonImageFile(null);

      // Recall addons API to reload and show perfect data
      await fetchAddonsFromBackend(undefined, undefined, true);
    } catch (err: any) {
      console.error("handleSaveAddon error:", err);
      toast.error("Save Error", err?.message || "Failed to save add-on.");
    } finally {
      setIsSavingAddon(false);
    }
  };



  // Dynamic Filtering by Category
  const filteredServices = useMemo(() => {
    if (!selectedCategoryIdFilter && (!selectedCategoryFilter || selectedCategoryFilter === "All Categories")) {
      return services;
    }
    const matched = services.filter((s) => {
      if (selectedCategoryIdFilter) {
        return s.categoryId === selectedCategoryIdFilter || s.category === selectedCategoryFilter;
      }
      return s.category === selectedCategoryFilter;
    });
    return matched.length > 0 ? matched : services;
  }, [services, selectedCategoryIdFilter, selectedCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-brand-600" />
            <span>Services CMS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage fixed service rates, diagnostic inspection charges, and Add-on spare parts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === "services") openAddServiceDrawer();
            else openAddAddonDrawer();
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === "services"
              ? "Create Service Offer"
              : "Add Spare Component"}
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
            Services CMS
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
                <span>{cat.categoryName}</span>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "services" ? (
        <DataTable
          columns={serviceColumns}
          data={filteredServices}
          searchPlaceholder="Search service title or category..."
          serverPagination={true}
          currentPage={servicesTablePage}
          totalPages={servicesTotalPages}
          totalRecords={servicesTotalRecords}
          pageSize={10}
          pageSizeOptions={[10]}
          onPageChange={handleServicesPageChange}
          searchValue={servicesSearch}
          onSearchChange={handleServicesSearchChange}
          isLoading={isLoading}
        />
      ) : (
        <div className="space-y-4">
         
          <DataTable
            columns={addonColumns}
            data={addons}
            searchPlaceholder="Search add-on title..."
            isLoading={isLoading}
          />
        </div>
      )}

      {/* COMPREHENSIVE ADD-ONS MANAGEMENT POPUP */}
      {isAddonsModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 outline-none animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden outline-none animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                        {offeringAddonModalIndex !== null && serviceOfferings[offeringAddonModalIndex]
                          ? `Add-ons: ${serviceOfferings[offeringAddonModalIndex].title || `Package #${offeringAddonModalIndex + 1}`}`
                          : selectedService
                            ? `Add-ons: ${selectedService.title}`
                            : "Add-on Catalog"}
                      </h3>
                      {offeringAddonModalIndex !== null && serviceOfferings[offeringAddonModalIndex] ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                          {(serviceOfferings[offeringAddonModalIndex].addonIds || []).length} Linked
                        </span>
                      ) : selectedService ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                          {selectedService.addons?.length || 0} Linked
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        Category: <strong className="text-brand-600 font-bold">{activeModalCategoryInfo.catName || "General"}</strong>
                      </span>
                      {activeModalCategoryInfo.subCatName && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="flex items-center gap-1">
                            Subcategory: <strong className="text-purple-600 dark:text-purple-400 font-bold">{activeModalCategoryInfo.subCatName}</strong>
                          </span>
                        </>
                      )}
                      {offeringAddonModalIndex !== null && serviceOfferings[offeringAddonModalIndex] && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>Base Rate: <strong className="text-slate-700 dark:text-slate-300 font-mono">₹{serviceOfferings[offeringAddonModalIndex].price}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Single Primary Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const { catId, subCatId } = activeModalCategoryInfo;
                      openAddAddonDrawer(catId, subCatId);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Add-on</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddonsModalOpen(false);
                      setOfferingAddonModalIndex(null);
                      setAddonToDelete(null);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search add-ons in ${activeModalCategoryInfo.subCatName || activeModalCategoryInfo.catName || "this category"}...`}
                    value={addonModalSearch}
                    onChange={(e) => setAddonModalSearch(e.target.value)}
                    className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  {addonModalSearch && (
                    <button
                      type="button"
                      onClick={() => setAddonModalSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  {/* Category & Subcategory Scoped Indicator or Standalone Dropdowns */}
                  {activeModalCategoryInfo.isScopedToService ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-extrabold flex items-center gap-1 shadow-2xs">
                        <Lock className="w-3 h-3 text-purple-500" />
                        <span>{activeModalCategoryInfo.catName}</span>
                        {activeModalCategoryInfo.subCatName && (
                          <>
                            <span className="text-purple-300 dark:text-purple-600">/</span>
                            <span>{activeModalCategoryInfo.subCatName}</span>
                          </>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={addonModalCategoryFilter}
                        onChange={(e) => {
                          const newCatName = e.target.value;
                          setAddonModalCategoryFilter(newCatName);
                          const matchedCat = categoriesFromApi.find((c) => c.categoryName === newCatName);
                          const firstSub = matchedCat?.subCategories?.[0];
                          setAddonModalSubCategoryFilter(firstSub?.name || "All");
                        }}
                        aria-label="Filter add-ons by category"
                        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                      >
                        {categoriesFromApi.map((cat) => (
                          <option key={cat._id} value={cat.categoryName}>
                            {cat.categoryName}
                          </option>
                        ))}
                      </select>

                      <select
                        value={addonModalSubCategoryFilter}
                        onChange={(e) => setAddonModalSubCategoryFilter(e.target.value)}
                        aria-label="Filter add-ons by subcategory"
                        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                      >
                        <option value="All">All Subcategories</option>
                        {(() => {
                          const matchedCat = categoriesFromApi.find(
                            (c) => c.categoryName === addonModalCategoryFilter || c._id === addonModalCategoryFilter
                          );
                          return (matchedCat?.subCategories || []).map((s: any) => (
                            <option key={s._id} value={s.name}>
                              {s.name}
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                  )}

                  {(offeringAddonModalIndex !== null || selectedService) && (
                    <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setAddonModalViewFilter("all")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          addonModalViewFilter === "all"
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        All for Subcategory ({modalFilteredAddons.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddonModalViewFilter("linked")}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          addonModalViewFilter === "linked"
                            ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs font-extrabold"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        Linked (
                        {offeringAddonModalIndex !== null && serviceOfferings[offeringAddonModalIndex]
                          ? (serviceOfferings[offeringAddonModalIndex].addonIds || []).length
                          : selectedService?.addons?.length || 0}
                        )
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Addons List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 min-h-[300px]">
                {modalFilteredAddons.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                      No Add-ons for {activeModalCategoryInfo.subCatName ? `"${activeModalCategoryInfo.subCatName}"` : (activeModalCategoryInfo.catName || "this Subcategory")}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                      {addonModalSearch || addonModalViewFilter === "linked"
                        ? "Try clearing your search query or switching to 'All for Subcategory'."
                        : `No spare parts have been added to ${activeModalCategoryInfo.catName || "this category"} > ${activeModalCategoryInfo.subCatName || "subcategory"} yet.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const { catId, subCatId } = activeModalCategoryInfo;
                        openAddAddonDrawer(catId, subCatId);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-extrabold text-xs transition-colors border border-purple-200 dark:border-purple-800 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Add-on for {activeModalCategoryInfo.subCatName || "this Subcategory"}</span>
                    </button>
                  </div>
                ) : (
                  modalFilteredAddons.map((addon) => {
                    const isLinked = offeringAddonModalIndex !== null && serviceOfferings[offeringAddonModalIndex]
                      ? (serviceOfferings[offeringAddonModalIndex].addonIds || []).includes(addon.id)
                      : selectedService?.addons?.some((a) => a.id === addon.id);
                    const isConfirmingDelete = addonToDelete?.id === addon.id;

                    return (
                      <div
                        key={addon.id}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isLinked
                            ? "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/90 dark:border-purple-800/80 shadow-2xs"
                            : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300"
                        }`}
                      >
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <TableImage
                            src={addon.imageUrl}
                            alt={addon.title}
                            fallbackIcon="image"
                            containerClassName="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center relative shadow-2xs"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {addon.title}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                                {addon.category}
                              </span>
                              {addon.subcategory && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-medium">
                                  {addon.subcategory}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs">
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                ₹{addon.price}
                              </span>
                              <span className="text-slate-400 text-[11px] font-medium">/ {addon.unit}</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <button
                                type="button"
                                onClick={() => handleToggleAddonStatus(addon.id, addon.status)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 border ${
                                  addon.status === "Active"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                                }`}
                                title="Click to toggle Active/Inactive"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${addon.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                                {addon.status || "Active"}
                              </button>
                            </div>

                            {addon.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
                                {addon.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 animate-in fade-in duration-150">
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 pl-1">
                                Delete?
                              </span>
                              <button
                                type="button"
                                disabled={isDeletingAddon}
                                onClick={() => handleDeleteAddon(addon.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                              >
                                {isDeletingAddon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddonToDelete(null)}
                                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 font-bold text-[10px] border border-slate-200 dark:border-slate-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Link / Unlink Toggle (when offering or service context is active) */}
                              {(offeringAddonModalIndex !== null || selectedService) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (offeringAddonModalIndex !== null) {
                                      handleToggleLinkAddonToOffering(addon.id);
                                    } else if (selectedService) {
                                      handleToggleLinkAddonToService(selectedService.id, addon);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer border ${
                                    isLinked
                                      ? "bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950/80 dark:hover:bg-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700 shadow-2xs"
                                      : "bg-slate-100 hover:bg-purple-50 hover:text-purple-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  {isLinked ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                      <span>Linked</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Link Add-on</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openEditAddonDrawer(addon)}
                                className="px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Edit add-on details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setAddonToDelete(addon)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer"
                                title="Delete add-on from catalog"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:px-5 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Showing <strong className="text-slate-800 dark:text-slate-200">{modalFilteredAddons.length}</strong> add-on(s) for{" "}
                  <strong className="text-purple-600 dark:text-purple-400">{activeModalCategoryInfo.subCatName || activeModalCategoryInfo.catName || "Subcategory"}</strong>
                  {offeringAddonModalIndex !== null && serviceOfferings[offeringAddonModalIndex] ? (
                    <>
                      {" "}• <strong className="text-purple-600 dark:text-purple-400">{(serviceOfferings[offeringAddonModalIndex].addonIds || []).length}</strong> linked to this package
                    </>
                  ) : selectedService ? (
                    <>
                      {" "}• <strong className="text-purple-600 dark:text-purple-400">{selectedService.addons?.length || 0}</strong> linked to this service
                    </>
                  ) : null}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddonsModalOpen(false);
                    setOfferingAddonModalIndex(null);
                    setAddonToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs border border-slate-300/60 dark:border-slate-700 transition-colors cursor-pointer"
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
          <div className="fixed inset-0 z-[99990] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
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

                        // Only call service action dropdown when category is selected
                        const matchedCat = categoriesFromApi.find(
                          (c) => c.categoryName.toLowerCase().trim() === catName.toLowerCase().trim() || c._id === catName
                        );
                        if (matchedCat?._id) {
                          fetchServiceActionsFromBackend(matchedCat._id);
                        } else {
                          setServiceActionsFromApi([]);
                          setServiceActionsList([]);
                        }
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

                        // Only call service action dropdown when subcategory is selected
                        const matchedCat = categoriesFromApi.find(
                          (c) => c.categoryName.toLowerCase().trim() === serviceCategory.toLowerCase().trim() || c._id === serviceCategory
                        );
                        const matchedSub = matchedCat?.subCategories?.find(
                          (s: any) => s.name.toLowerCase().trim() === sub.toLowerCase().trim() || s._id === sub
                        );
                        if (matchedCat?._id) {
                          fetchServiceActionsFromBackend(matchedCat._id, matchedSub?._id);
                        }
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
                      const optionsMap = new Map<string, { value: string; label: string }>();

                      // 1. Add all from serviceActionsFromApi with _id as value
                      (serviceActionsFromApi || []).forEach((a: any) => {
                        const actId = a._id ? String(a._id) : "";
                        const actLabel = a.serviceAction || a.name || a.serviceName || "Action";
                        if (actId) {
                          optionsMap.set(actId, { value: actId, label: actLabel });
                        }
                      });

                      // 2. If editing and we have current action ID, ensure it is in the options
                      const currentService = editingServiceId ? services.find((s) => s.id === editingServiceId) : null;
                      const currentActionId = selectedServiceActionId || currentService?.serviceActionId || "";
                      const currentActionName = currentService?.serviceAction || selectedServiceAction || "";

                      if (currentActionId && !optionsMap.has(currentActionId)) {
                        optionsMap.set(currentActionId, {
                          value: currentActionId,
                          label: currentActionName || "Current Action",
                        });
                      }

                      // 3. Fallback for names in serviceActionsList
                      (serviceActionsList || []).forEach((name) => {
                        const matched = (serviceActionsFromApi || []).find(
                          (a: any) => (a.serviceAction || a.name) === name
                        );
                        if (matched?._id) {
                          optionsMap.set(matched._id, { value: matched._id, label: name });
                        }
                      });

                      const selectOptions = Array.from(optionsMap.values());

                      return (
                        <CustomSelect
                          label="Select Service Action *"
                          value={selectedServiceAction}
                          placeholder={
                            selectOptions.length > 0
                              ? "Select Service Action..."
                              : "No Service Action Available"
                          }
                          onChange={(val) => {
                            setSelectedServiceAction(val);
                            setSelectedServiceActionId(val);
                          }}
                          options={
                            selectOptions.length > 0
                              ? selectOptions
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
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                                4. Service Duration *
                              </label>

                              <CustomSelect
                                size="sm"
                                value={off.duration}
                                onChange={(val) => handleUpdateOfferingRow(idx, "duration", val)}
                                options={DURATION_PRESETS}
                              />

                              {/* Real-time duration calculation feedback */}
                              {(() => {
                                const calcMinutes = calculateDurationInMinutes(off.duration);
                                const hrsText = formatHoursOnly(calcMinutes);
                                return (
                                  <div className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 mt-1.5">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>Duration: <strong>{calcMinutes} mins</strong></span>
                                      {calcMinutes >= 60 && hrsText && (
                                        <span className="text-slate-500 dark:text-slate-400 font-semibold bg-emerald-500/10 dark:bg-emerald-400/10 px-1.5 py-0.5 rounded text-[9.5px]">
                                          ({hrsText})
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                      Sent in min
                                    </span>
                                  </div>
                                );
                              })()}

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

                          {/* PACKAGE IMAGE ROW */}
                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {(() => {
                                  const pkgIdToUse = !off.imageRemoved ? (off.id && off.id.length === 24 ? off.id : (editingServiceId && editingServiceId.length === 24 ? editingServiceId : undefined)) : undefined;
                                  const activeImage = !off.imageRemoved ? (off.thumbnailUrl || (off as any).imageUrl || "") : "";
                                  const hasImage = Boolean(activeImage || off.imageFile);
                                  return (
                                    <>
                                      <TableImage
                                        src={activeImage}
                                        packageId={pkgIdToUse}
                                        alt="Package Thumbnail"
                                        containerClassName="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 flex items-center justify-center relative shadow-xs"
                                        className="w-full h-full object-cover"
                                        fallbackIcon="image"
                                        showInitialsFallback={false}
                                      />
                                      <div className="min-w-0">
                                        <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                          <span>Package Thumbnail</span>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hasImage ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                                            {hasImage ? "Attached" : "No image"}
                                          </span>
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                                          {off.imageFile ? off.imageFile.name : (hasImage ? "Display image for this package" : "Upload an image banner or thumbnail")}
                                        </p>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {(!off.imageRemoved && (off.thumbnailUrl || off.imageFile)) ? (
                                  <>
                                    <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                                      <Upload className="w-3.5 h-3.5 text-brand-600" />
                                      <span>Change</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleUpdateOfferingRow(idx, {
                                              imageFile: file,
                                              thumbnailUrl: URL.createObjectURL(file),
                                              imageRemoved: false,
                                            });
                                          }
                                          e.target.value = "";
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateOfferingRow(idx, {
                                          thumbnailUrl: "",
                                          imageFile: undefined,
                                          imageRemoved: true,
                                        });
                                      }}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-colors cursor-pointer"
                                      title="Remove Image"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                                    <Upload className="w-3.5 h-3.5 text-brand-600" />
                                    <span>Upload Image</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleUpdateOfferingRow(idx, {
                                            imageFile: file,
                                            thumbnailUrl: URL.createObjectURL(file),
                                            imageRemoved: false,
                                          });
                                        }
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* DEDICATED SPARE PART ADD-ONS CARD */}
                          <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/25 border border-purple-200/90 dark:border-purple-800/70 space-y-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
                                  <Wrench className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                    Add-ons
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                      {(off.addonIds || []).length} Linked
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                    Extra accessories & parts for {selectedSubcategory || serviceCategory || "this package"}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenAddonsModalForOffering(idx)}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-extrabold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                title="Open popup to view all add-ons for this category & subcategory, link existing, or create new"
                              >
                                <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>Add Addon</span>
                              </button>
                            </div>

                            {/* BODY: LINKED MINI-CARDS OR CLEAN EMPTY STATE */}
                            {(off.addonIds || []).length > 0 ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(off.addonIds || []).map((addonId) => {
                                    const addonObj = addons.find((a) => a.id === addonId);
                                    if (!addonObj) return null;
                                    return (
                                      <div
                                        key={addonId}
                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200/80 dark:border-purple-800/70 shadow-2xs flex items-center justify-between gap-2.5 hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <TableImage
                                            src={addonObj.imageUrl}
                                            alt={addonObj.title}
                                            fallbackIcon="image"
                                            containerClassName="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50 shrink-0 flex items-center justify-center relative shadow-2xs"
                                            className="w-full h-full object-cover"
                                            showInitialsFallback={false}
                                          />
                                          <div className="min-w-0">
                                            <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                                              {addonObj.title}
                                            </p>
                                            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold font-mono">
                                              ₹{addonObj.price} <span className="text-slate-400 font-sans font-normal">/ {addonObj.unit}</span>
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = (off.addonIds || []).filter((id) => id !== addonId);
                                            handleUpdateOfferingRow(idx, "addonIds", updated);
                                          }}
                                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                          title={`Unlink ${addonObj.title}`}
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex justify-end pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddonsModalForOffering(idx)}
                                    className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 hover:text-purple-800 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 text-purple-600" />
                                    <span>Add more add-ons &rarr;</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleOpenAddonsModalForOffering(idx)}
                                className="w-full py-3.5 px-4 rounded-xl border border-dashed border-purple-200 dark:border-purple-800/80 bg-white/70 dark:bg-slate-800/40 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/80 dark:border-purple-700/60 group-hover:scale-105 transition-transform">
                                    <Wrench className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                      No spare parts linked yet
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                      Click to link existing add-ons or create new ones for {selectedSubcategory || serviceCategory || "this package"}
                                    </p>
                                  </div>
                                </div>

                                <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center gap-1 shrink-0 group-hover:bg-purple-100 transition-colors shadow-2xs">
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Browse & Link</span>
                                </span>
                              </div>
                            )}
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
                          <span> Add Another Package</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  disabled={isSavingService}
                  onClick={() => setIsAddServiceOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lux flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isSavingService ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingServiceId ? "Updating Package..." : "Saving Package..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingServiceId ? "Update Service Package" : "Save Service Package"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ADD / EDIT ADDON DRAWER */}
      {isAddAddonOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100010] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
            <div className="absolute inset-0" onClick={() => setIsAddAddonOpen(false)} />
            <form
              onSubmit={handleSaveAddon}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-md w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {editingAddonId ? "Edit Add-on" : "Add Add-on"}
                  </h3>
                  <button type="button" onClick={() => setIsAddAddonOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Category & Subcategory Display / Selection */}
                {activeModalCategoryInfo.isScopedToService ? (
                  <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                        Category & Subcategory
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
                        <Lock className="w-3 h-3" />
                        Locked to Active Service
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 border border-purple-200/80 dark:border-purple-700/80 shadow-2xs">
                        Category: <strong className="text-brand-600">{addonCategory || activeModalCategoryInfo.catName}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 font-bold text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-700/80 shadow-2xs">
                        Subcategory: <strong>{addonSubCategory || activeModalCategoryInfo.subCatName || "General"}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Category Dropdown */}
                    <CustomSelect
                      label="Category *"
                      size="sm"
                      value={addonCategory}
                      onChange={(catName) => {
                        setAddonCategory(catName);
                        const matchedCat = categoriesFromApi.find((c) => c.categoryName === catName);
                        setAddonCategoryId(matchedCat?._id || "");
                        const firstSub = matchedCat?.subCategories?.[0];
                        setAddonSubCategory(firstSub?.name || "");
                        setAddonSubCategoryId(firstSub?._id || "");
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
                  </>
                )}

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
                      <span>{addonImageFile ? addonImageFile.name : "Upload Image File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAddonImageFile(file);
                            setAddonImageUrl(URL.createObjectURL(file));
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      value={addonImageFile ? `[Selected File: ${addonImageFile.name}]` : (addonImageUrl.startsWith("blob:") ? "" : addonImageUrl)}
                      onChange={(e) => {
                        setAddonImageUrl(e.target.value);
                        setAddonImageFile(null);
                      }}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none text-xs"
                    />
                  </div>

                  {addonImageUrl && (
                    <div className="mt-2.5 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <TableImage
                          src={addonImageUrl}
                          alt="Addon Preview"
                          containerClassName="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative shadow-xs"
                          className="w-full h-full object-cover"
                          fallbackIcon="image"
                          showInitialsFallback={false}
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {addonImageFile ? addonImageFile.name : "Image Preview"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {addonImageFile ? `${(addonImageFile.size / 1024).toFixed(1)} KB` : (addonImageUrl.startsWith("blob:") ? "Local Image File" : addonImageUrl)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAddonImageUrl("");
                          setAddonImageFile(null);
                        }}
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
                  disabled={isSavingAddon}
                  onClick={() => setIsAddAddonOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddon}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lux flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingAddon ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{editingAddonId ? "Updating Add-on..." : "Saving Add-on..."}</span>
                    </>
                  ) : (
                    editingAddonId ? "Update Add-on Item" : "Save Add-on Item"
                  )}
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
                if (isSavingCategory) return;
                if (!newCatNameInput.trim()) return;
                const catName = newCatNameInput.trim();
                const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

                setIsSavingCategory(true);
                try {
                  const res = await createCategoryApi({
                    categoryName: catName,
                    slug,
                    subCategories: newCatSubcategories.map((subName) => ({ name: subName })),
                    status: true,
                  });
                  if (res && res.success !== false) {
                    toast.success("Category Created", `Category "${catName}" created successfully.`);
                    await fetchCategoriesFromBackend(true);
                  } else {
                    toast.error("Category Creation Failed", res?.message || "Failed to create category");
                  }
                } catch (err: any) {
                  console.error("Failed to create category API:", err);
                  toast.error("Category Error", err?.message || "Failed to create category");
                } finally {
                  setIsSavingCategory(false);
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
                  disabled={isSavingCategory}
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-extrabold text-xs shadow-lux flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Category...</span>
                    </>
                  ) : (
                    "Save Category & Subcategories"
                  )}
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
                if (isSavingSubcategory) return;
                const catName = targetCategoryForSubcategory;
                const subsList = categorySubcategoriesMap[catName] || [];

                const matchedCat = categoriesFromApi.find((c) => c.categoryName === catName);
                if (matchedCat && matchedCat._id) {
                  setIsSavingSubcategory(true);
                  try {
                    const res = await updateCategoryApi(matchedCat._id, {
                      categoryName: matchedCat.categoryName,
                      slug: matchedCat.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      subCategories: subsList.map((subName) => ({ name: subName })),
                      status: matchedCat.status !== false,
                    });
                    if (res && res.success !== false) {
                      toast.success("Subcategories Updated", "Subcategories updated successfully.");
                      await fetchCategoriesFromBackend(true);
                    } else {
                      toast.error("Update Failed", res?.message || "Failed to update subcategories");
                    }
                  } catch (err: any) {
                    console.error("Failed to update category subcategories API:", err);
                    toast.error("Update Error", err?.message || "Failed to update subcategories");
                  } finally {
                    setIsSavingSubcategory(false);
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSavingSubcategory}
                  onClick={() => setIsAddSubcategoryOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSubcategory}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-lux flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingSubcategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Subcategories...</span>
                    </>
                  ) : (
                    "Done & Save"
                  )}
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
                if (isSavingAction) return;
                setActionFormError("");
                if (!newActionInput.trim()) {
                  setActionFormError("Service Action Name is required.");
                  return;
                }
                if (!actionCategoryId) {
                  setActionFormError("Category selection is mandatory.");
                  return;
                }

                setIsSavingAction(true);
                try {
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
                    await fetchServiceActionsFromBackend(actionCategoryId, actionSubCategoryId || undefined, true);
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
                } catch (err: any) {
                  console.error("Save service action error:", err);
                  const errorMsg = err?.message || "Failed to save service action.";
                  setActionFormError(errorMsg);
                  toast.error("Service Action Error", errorMsg);
                } finally {
                  setIsSavingAction(false);
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
                          <TableImage
                            src={actionImageUrl}
                            alt="Action Preview"
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover"
                            fallbackIcon="image"
                            showInitialsFallback={false}
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
                  disabled={isSavingAction}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-lux flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingActionObj ? "Updating Service Action..." : "Adding Service Action..."}</span>
                    </>
                  ) : (
                    <>
                      {editingActionObj ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingActionObj ? "Update Service Action" : "Add Service Action"}</span>
                    </>
                  )}
                </button>
                {editingActionObj && (
                  <button
                    type="button"
                    disabled={isSavingAction}
                    onClick={() => {
                      setEditingActionObj(null);
                      setNewActionInput("");
                      setActionImageUrl("");
                      setActionCategoryId("");
                      setActionSubCategoryId("");
                      setActionFormError("");
                    }}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                              <TableImage
                                src={actImg}
                                alt={actName}
                                containerClassName="w-8 h-8 rounded-lg overflow-hidden border border-purple-200 dark:border-purple-800 shrink-0"
                                className="w-full h-full object-cover"
                                fallbackIcon="wrench"
                                showInitialsFallback={false}
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
              <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] bg-slate-900 overflow-hidden">
                {bannerImageUrl ? (
                  <Image
                    src={bannerImageUrl}
                    alt="Pure Image Visitor Promo Popup Banner"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}

                {/* Optional Second Image Icon Overlay Badge at bottom left */}
                {secondBannerIconUrl && (
                  <div className="absolute bottom-4 left-4 z-20 p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/40 flex items-center gap-2 max-w-[200px]">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={secondBannerIconUrl}
                        alt="Second Icon Badge"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
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
