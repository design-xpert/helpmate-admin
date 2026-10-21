export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiAdmin {
  _id: string;
  adminId: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export async function adminLoginApi(payload: { identifier: string; password: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    console.error("adminLoginApi error:", error);
    return { success: false, message: "Failed to connect to backend server." };
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (typeof payload.exp === "number") {
      return Date.now() >= (payload.exp - 5) * 1000;
    }
  } catch (e) {
    // If decoding fails, fallback to server check
  }
  return false;
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}, isFormData: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {
    ...extraHeaders,
  };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("helpmate_admin_token");
    if (token) {
      if (isTokenExpired(token)) {
        handleGlobalLogout();
      } else if (!headers["Authorization"] && !headers["authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }
  return headers;
}

export function handleGlobalLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("helpmate_admin_token");
    localStorage.removeItem("helpmate_admin_user");
    localStorage.removeItem("helpmate_admin_session");
    localStorage.removeItem("helpmate_active_user_id");
    clearApiCache();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
}

export function dataURLtoBlob(dataUrl?: string): Blob | null {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
  try {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("helpmate_admin_token");
    if (token && isTokenExpired(token)) {
      handleGlobalLogout();
      return new Response(JSON.stringify({ success: false, message: "Token expired", isUnauthorized: true }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = getAuthHeaders(options.headers as Record<string, string>, isFormData);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    handleGlobalLogout();
  }

  return response;
}

export async function getAdminMeApi() {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/me`);
    if (res.status === 401 || res.status === 403) {
      handleGlobalLogout();
      return { success: false, message: "Token expired", isUnauthorized: true };
    }
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getAdminMeApi error:", error);
    return { success: false, message: "Failed to fetch admin profile." };
  }
}

export async function safeJsonResponse(res: Response): Promise<any> {
  if (res.status === 401 || res.status === 403) {
    handleGlobalLogout();
    return { success: false, message: "Token expired or unauthorized.", isUnauthorized: true };
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.warn(`[API Warning] Received non-JSON response (${res.status}):`, text.slice(0, 150));
    return { success: false, message: `Server returned non-JSON response (${res.status})` };
  }
  try {
    const data = await res.json();
    if (data && data.success === false && typeof data.message === "string") {
      const msg = data.message.toLowerCase();
      if (
        msg.includes("jwt expired") ||
        msg.includes("token expired") ||
        msg.includes("token is expired") ||
        msg.includes("jwt malformed") ||
        msg.includes("invalid token") ||
        msg.includes("unauthorized") ||
        msg.includes("authentication required") ||
        msg.includes("jwt signature") ||
        msg.includes("session expired")
      ) {
        handleGlobalLogout();
      }
    }
    return data;
  } catch (err) {
    console.error("[API Error] JSON parse failed:", err);
    return { success: false, message: "Failed to parse JSON response from server." };
  }
}

// ─── IN-MEMORY API RESPONSE CACHE WITH 30-SECOND TTL COOLDOWN ───
const rawApiCache = new Map<string, { timestamp: number; data: any }>();

const apiCache = {
  has(key: string) {
    if (!rawApiCache.has(key)) return false;
    const entry = rawApiCache.get(key);
    if (entry && Date.now() - entry.timestamp < 30000) {
      return true;
    }
    rawApiCache.delete(key);
    return false;
  },
  get(key: string) {
    if (!rawApiCache.has(key)) return undefined;
    const entry = rawApiCache.get(key);
    if (entry && Date.now() - entry.timestamp < 30000) {
      return entry.data;
    }
    rawApiCache.delete(key);
    return undefined;
  },
  set(key: string, data: any) {
    if (data && data.success !== false) {
      rawApiCache.set(key, { timestamp: Date.now(), data });
    }
  },
  delete(key: string) {
    return rawApiCache.delete(key);
  },
  clear() {
    rawApiCache.clear();
  },
  keys() {
    return rawApiCache.keys();
  },
};

function getFromCache(cacheKey: string, forceRefresh?: boolean, maxAgeMs: number = 30000) {
  if (forceRefresh) {
    apiCache.delete(cacheKey);
    return null;
  }
  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (cached && cached.success !== false) {
      return cached;
    }
    apiCache.delete(cacheKey);
  }
  return null;
}

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      apiCache.delete(key);
    }
  }
}

export function invalidateCatalogCache() {
  clearApiCache("getServices");
  clearApiCache("getPackages");
  clearApiCache("getCategories");
  clearApiCache("getCategoryDropdown");
  clearApiCache("getServiceActions");
  clearApiCache("getAddons");
}

// ─── LOCALITY APIS ───

export interface ApiLocality {
  _id: string;
  localityName: string;
  pincode: string;
  status: boolean;
}

export async function getLocalitiesApi(params?: {
  search?: string;
  limit?: number;
  page?: number;
  status?: boolean | string;
  forceRefresh?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.page) query.append("page", params.page.toString());
  if (params?.status !== undefined) query.append("status", params.status.toString());
  const queryString = query.toString();

  const cacheKey = `getLocalitiesApi:${queryString}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;
  try {
    const res = await authFetch(`${API_BASE_URL}/api/locality${queryString ? `?${queryString}` : ""}`);
    const data = await safeJsonResponse(res);

    if (data && data.success !== false && data.data) {
      const localitiesList: ApiLocality[] = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.localities)
        ? data.data.localities
        : [];

      const paginationObj = data.data?.pagination || data.pagination || {
        total: localitiesList.length,
        page: params?.page || 1,
        limit: params?.limit || localitiesList.length,
        totalPages: Math.ceil(localitiesList.length / (params?.limit || 10)) || 1,
      };

      const normalized = {
        success: true,
        message: data.message || "Localities fetched successfully.",
        data: localitiesList,
        localities: localitiesList,
        pagination: paginationObj,
        total: paginationObj.total,
        totalPages: paginationObj.totalPages,
        raw: data,
      };

      apiCache.set(cacheKey, normalized);
      return normalized;
    }
  } catch (error) {
    console.error("getLocalitiesApi error:", error);
  }

  // Fallback to /locality/dropdown ONLY if /api/locality fails completely
  try {
    const fallbackRes = await authFetch(`${API_BASE_URL}/api/locality/dropdown`);
    const fallbackData = await safeJsonResponse(fallbackRes);
    if (fallbackData && fallbackData.success !== false) {
      const fallbackList: ApiLocality[] = Array.isArray(fallbackData.data) ? fallbackData.data : [];
      const normalizedFallback = {
        success: true,
        message: fallbackData.message || "Localities fetched from dropdown fallback.",
        data: fallbackList,
        localities: fallbackList,
        pagination: {
          total: fallbackList.length,
          page: 1,
          limit: fallbackList.length,
          totalPages: 1,
        },
        total: fallbackList.length,
        totalPages: 1,
      };
      apiCache.set(cacheKey, normalizedFallback);
      return normalizedFallback;
    }
  } catch (err) {
    console.error("getLocalitiesApi fallback error:", err);
  }

  return { success: false, message: "Failed to fetch localities.", data: [], localities: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } };
}

export async function getLocalityDropdownApi(params?: { forceRefresh?: boolean }) {
  const cacheKey = `getLocalityDropdownApi`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;
  try {
    const res = await authFetch(`${API_BASE_URL}/api/locality/dropdown`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getLocalityDropdownApi error:", error);
    return { success: false, message: "Failed to fetch locality dropdown." };
  }
}

export async function addLocalityApi(payload: { localityName: string; pincode: string; status?: boolean }) {
  clearApiCache("getLocalitiesApi");
  clearApiCache("getLocalityDropdownApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/locality`, {
      method: "POST",
      body: JSON.stringify({
        localityName: payload.localityName,
        pincode: payload.pincode,
      }),
    });
    const data = await safeJsonResponse(res);
    return data;
  } catch (error) {
    console.error("addLocalityApi error:", error);
    return { success: false, message: "Failed to add locality." };
  }
}

export async function updateLocalityApi(id: string, payload: { localityName?: string; pincode?: string; status?: boolean }) {
  clearApiCache("getLocalitiesApi");
  clearApiCache("getLocalityDropdownApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/locality/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await safeJsonResponse(res);
    return data;
  } catch (error) {
    console.error("updateLocalityApi error:", error);
    return { success: false, message: "Failed to update locality." };
  }
}

export async function deleteLocalityApi(id: string) {
  clearApiCache("getLocalitiesApi");
  clearApiCache("getLocalityDropdownApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/locality/${id}`, {
      method: "DELETE",
    });
    const data = await safeJsonResponse(res);
    return data;
  } catch (error) {
    console.error("deleteLocalityApi error:", error);
    return { success: false, message: "Failed to delete locality." };
  }
}

export interface ApiCategory {
  _id: string;
  categoryName: string;
  slug: string;
  iconUrl?: string;
  subCategories: { _id?: string; name: string; imageUrl?: string; iconUrl?: string }[];
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiAddon {
  _id: string;
  categoryId?: string;
  subCategoryId?: string;
  addonName?: string;
  title: string;
  description?: string;
  price: number;
  unit: string;
  imageUrl?: string;
  category: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiServiceActionHierarchy {
  _id?: string;
  serviceAction?: string;
  serviceName?: string;
  subtitle?: string;
  price?: number;
  originalPrice?: number;
  duration?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  package?: any;
  addons?: (string | ApiAddon)[];
}

export interface ApiSubCategoryHierarchy {
  _id?: string;
  name?: string;
  imageUrl?: string;
  iconUrl?: string;
  serviceAction?: ApiServiceActionHierarchy;
}

export interface ApiCategoryHierarchy {
  _id?: string;
  categoryName?: string;
  iconUrl?: string;
  subCategory?: ApiSubCategoryHierarchy;
}

export interface ApiService {
  _id: string;
  category?: ApiCategoryHierarchy;
  categoryId: string | { _id: string; categoryName: string; subCategories?: { _id: string; name: string; imageUrl?: string; iconUrl?: string }[] };
  categoryName?: string;
  subCategoryId: string;
  subCategoryName?: string;
  serviceName: string;
  serviceAction?: string;
  subtitle?: string;
  price?: number;
  originalPrice?: number;
  duration?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  package?: any;
  addons?: (string | ApiAddon)[];
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── CATEGORY APIS ───

export async function getCategoriesApi(params?: { search?: string; status?: string; page?: number; limit?: number; forceRefresh?: boolean }) {
  const cacheKey = `getCategoriesApi:${JSON.stringify({ search: params?.search, status: params?.status, page: params?.page, limit: params?.limit })}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;
  try {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    query.append("limit", String(params?.limit || 100));

    const res = await fetch(`${API_BASE_URL}/api/category?${query.toString()}`);
    const data = await res.json();
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getCategoriesApi error:", error);
    return { success: false, message: "Failed to connect to backend server." };
  }
}

export async function getCategoryDropdownApi(forceRefresh?: boolean) {
  const cacheKey = `getCategoryDropdownApi`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;
  try {
    const res = await fetch(`${API_BASE_URL}/api/category/dropdown`);
    const data = await res.json();
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getCategoryDropdownApi error:", error);
    return { success: false, message: "Failed to fetch category dropdown." };
  }
}

export async function getSubcategoriesApi(categoryId: string, forceRefresh?: boolean) {
  const cacheKey = `getSubcategoriesApi:${categoryId}`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;
  try {
    const res = await authFetch(`${API_BASE_URL}/api/customer/subcategories?categoryId=${encodeURIComponent(categoryId)}`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getSubcategoriesApi error:", error);
    return { success: false, message: "Failed to fetch subcategories." };
  }
}


export interface SubCategoryPayloadItem {
  _id?: string;
  name: string;
  imageUrl?: string;
  iconUrl?: string;
  iconFile?: File;
  status?: boolean;
}

export interface CategoryPayload {
  categoryName: string;
  slug: string;
  iconUrl?: string;
  iconFile?: File;
  subCategories?: SubCategoryPayloadItem[];
  status?: boolean;
}

export async function createCategoryApi(
  payload: FormData | CategoryPayload
) {
  clearApiCache("getCategoriesApi");
  clearApiCache("getCategoryDropdownApi");
  try {
    let body: any;
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      body = payload;
    } else {
      const objPayload = payload as CategoryPayload;
      const formData = new FormData();
      formData.append("categoryName", objPayload.categoryName?.trim() || "");
      formData.append("slug", objPayload.slug?.trim().toLowerCase() || "");
      formData.append("status", String(objPayload.status !== false));

      if (objPayload.subCategories && Array.isArray(objPayload.subCategories)) {
        // Strip non-essential fields from subCategories JSON (only keep name, and status if provided)
        // Backend addCategory rejects unknown fields like _id, imageUrl, iconUrl
        const cleanSubCats = objPayload.subCategories.map((sub) => ({
          name: sub.name.trim(),
          ...(sub.status !== undefined ? { status: sub.status } : {}),
        }));
        formData.append("subCategories", JSON.stringify(cleanSubCats));

        // Subcategory icons on POST: backend requires index format: subCategoryIcon_0, subCategoryIcon_1...
        objPayload.subCategories.forEach((sub, index) => {
          if (sub.iconFile instanceof File) {
            formData.append(`subCategoryIcon_${index}`, sub.iconFile);
          } else {
            const img = sub.imageUrl || sub.iconUrl;
            if (img && typeof img === "string" && img.startsWith("data:")) {
              const blob = dataURLtoBlob(img);
              if (blob) {
                formData.append(`subCategoryIcon_${index}`, blob, `subcategory_${index}.jpg`);
              }
            }
          }
        });
      }

      // Category icon
      if (objPayload.iconFile instanceof File) {
        formData.append("icon", objPayload.iconFile);
      } else if (objPayload.iconUrl && typeof objPayload.iconUrl === "string" && objPayload.iconUrl.startsWith("data:")) {
        const blob = dataURLtoBlob(objPayload.iconUrl);
        if (blob) {
          formData.append("icon", blob, "category_icon.jpg");
        }
      }
      body = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/category`, {
      method: "POST",
      body,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createCategoryApi error:", error);
    return { success: false, message: "Failed to create category." };
  }
}

export async function updateCategoryApi(
  id: string,
  payload: FormData | CategoryPayload
) {
  clearApiCache("getCategoriesApi");
  clearApiCache("getCategoryDropdownApi");
  try {
    let body: any;
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      body = payload;
    } else {
      const objPayload = payload as CategoryPayload;
      const formData = new FormData();
      formData.append("categoryName", objPayload.categoryName?.trim() || "");
      formData.append("slug", objPayload.slug?.trim().toLowerCase() || "");
      formData.append("status", String(objPayload.status !== false));

      if (objPayload.subCategories && Array.isArray(objPayload.subCategories)) {
        // In updateCategory: items can have _id (if 24-hex ObjectId) and name (and optional status)
        // Backend updateCategory rejects unknown fields like imageUrl, iconUrl
        const cleanSubCats = objPayload.subCategories.map((sub) => {
          const item: any = { name: sub.name.trim() };
          if (sub._id && /^[a-f\d]{24}$/i.test(sub._id)) {
            item._id = sub._id;
          }
          if (sub.status !== undefined) {
            item.status = sub.status;
          }
          return item;
        });
        formData.append("subCategories", JSON.stringify(cleanSubCats));

        // Subcategory icons on PUT:
        // If sub._id exists and is valid 24-hex string, use subCategoryIcon_${sub._id}
        // Otherwise use subCategoryIcon_${index}
        objPayload.subCategories.forEach((sub, index) => {
          const isMongoId = sub._id && /^[a-f\d]{24}$/i.test(sub._id);
          const fieldName = isMongoId ? `subCategoryIcon_${sub._id}` : `subCategoryIcon_${index}`;

          if (sub.iconFile instanceof File) {
            formData.append(fieldName, sub.iconFile);
          } else {
            const img = sub.imageUrl || sub.iconUrl;
            if (img && typeof img === "string" && img.startsWith("data:")) {
              const blob = dataURLtoBlob(img);
              if (blob) {
                formData.append(fieldName, blob, `subcategory_${sub._id || index}.jpg`);
              }
            }
          }
        });
      }

      // Category icon
      if (objPayload.iconFile instanceof File) {
        formData.append("icon", objPayload.iconFile);
      } else if (objPayload.iconUrl && typeof objPayload.iconUrl === "string" && objPayload.iconUrl.startsWith("data:")) {
        const blob = dataURLtoBlob(objPayload.iconUrl);
        if (blob) {
          formData.append("icon", blob, "category_icon.jpg");
        }
      }
      body = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/category/${id}`, {
      method: "PUT",
      body,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateCategoryApi error:", error);
    return { success: false, message: "Failed to update category." };
  }
}

export async function deleteCategoryApi(id: string) {
  clearApiCache("getCategoriesApi");
  clearApiCache("getCategoryDropdownApi");
  try {
    const res = await fetch(`${API_BASE_URL}/api/category/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("deleteCategoryApi error:", error);
    return { success: false, message: "Failed to delete category." };
  }
}

export async function toggleCategoryStatusApi(id: string, status?: boolean) {
  clearApiCache("getCategoriesApi");
  clearApiCache("getCategoryDropdownApi");
  try {
    const res = await fetch(`${API_BASE_URL}/api/category/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    console.error("toggleCategoryStatusApi error:", error);
    return { success: false, message: "Failed to toggle status." };
  }
}

// ─── SERVICE APIS ───

export async function getServicesApi(params?: {
  search?: string;
  page?: number;
  limit?: number;
  categoryId?: string;
  subCategoryId?: string;
  serviceAction?: string;
  forceRefresh?: boolean;
}) {
  const cacheKey = `getServicesApi:${JSON.stringify(params || {})}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;
  try {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", String(params.page));
    if (params?.categoryId) query.append("categoryId", params.categoryId);
    if (params?.subCategoryId) query.append("subCategoryId", params.subCategoryId);
    if (params?.serviceAction) query.append("serviceAction", params.serviceAction);
    query.append("limit", String(params?.limit || 100));

    const res = await fetch(`${API_BASE_URL}/api/service?${query.toString()}`);
    const data = await res.json();
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getServicesApi error:", error);
    return { success: false, message: "Failed to connect to backend server." };
  }
}

export async function getServicesByActionApi(params?: {
  categoryId?: string;
  subCategoryId?: string;
  categoryName?: string;
  subCategoryName?: string;
  category?: string;
  subcategory?: string;
  serviceAction?: string;
}) {
  try {
    const query = new URLSearchParams();
    if (params?.categoryId) query.append("categoryId", params.categoryId);
    if (params?.subCategoryId) query.append("subCategoryId", params.subCategoryId);
    if (params?.categoryName) query.append("categoryName", params.categoryName);
    if (params?.subCategoryName) query.append("subCategoryName", params.subCategoryName);
    if (params?.category) query.append("category", params.category);
    if (params?.subcategory) query.append("subcategory", params.subcategory);
    if (params?.serviceAction) query.append("serviceAction", params.serviceAction);

    const res = await fetch(`${API_BASE_URL}/api/service/by-action?${query.toString()}`);
    return await res.json();
  } catch (error) {
    console.error("getServicesByActionApi error:", error);
    return { success: false, message: "Failed to fetch services by action." };
  }
}

export async function createServiceApi(payload: {
  categoryId?: string;
  subCategoryId?: string;
  serviceName?: string;
  serviceAction?: string;
  subtitle?: string;
  price?: number;
  originalPrice?: number;
  duration?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  package?: any;
  packageId?: any;
  addons?: string[];
  status?: boolean;
  category?: any;
}) {
  invalidateCatalogCache();
  try {
    const bodyData = {
      ...payload,
      addons: ensureAddonsArray(payload.addons),
    };
    const res = await fetch(`${API_BASE_URL}/api/service`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    return await res.json();
  } catch (error) {
    console.error("createServiceApi error:", error);
    return { success: false, message: "Failed to create service." };
  }
}

export async function updateServiceApi(
  id: string,
  payload: {
    categoryId?: string;
    subCategoryId?: string;
    serviceName?: string;
    serviceAction?: string;
    subtitle?: string;
    price?: number;
    originalPrice?: number;
    duration?: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    package?: any;
    packageId?: any;
    addons?: string[];
    status?: boolean;
    category?: any;
  }
) {
  invalidateCatalogCache();
  try {
    const bodyData = {
      ...payload,
      addons: ensureAddonsArray(payload.addons),
    };
    const res = await fetch(`${API_BASE_URL}/api/service/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    return await res.json();
  } catch (error) {
    console.error("updateServiceApi error:", error);
    return { success: false, message: "Failed to update service." };
  }
}

export async function deleteServiceApi(id: string) {
  invalidateCatalogCache();
  try {
    const res = await fetch(`${API_BASE_URL}/api/service/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("deleteServiceApi error:", error);
    return { success: false, message: "Failed to delete service." };
  }
}

export async function toggleServiceStatusApi(id: string, status?: boolean) {
  invalidateCatalogCache();
  try {
    const res = await fetch(`${API_BASE_URL}/api/service/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    console.error("toggleServiceStatusApi error:", error);
    return { success: false, message: "Failed to toggle status." };
  }
}

// ─── ADDON / SPARE PART APIS ───

export async function getAddonsApi(params?: { search?: string; category?: string; categoryId?: string; subCategoryId?: string; status?: string; limit?: number; forceRefresh?: boolean }) {
  const catId = params?.categoryId || params?.category;
  const cacheKey = `getAddonsApi:${JSON.stringify({ search: params?.search, categoryId: catId, subCategoryId: params?.subCategoryId, status: params?.status, limit: params?.limit })}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;
  try {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (catId) query.append("categoryId", catId);
    if (params?.subCategoryId) query.append("subCategoryId", params.subCategoryId);
    if (params?.status) query.append("status", params.status);
    query.append("limit", String(params?.limit || 100));

    const res = await authFetch(`${API_BASE_URL}/api/addon?${query.toString()}`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getAddonsApi error:", error);
    return { success: false, message: "Failed to fetch spare part add-ons." };
  }
}

export async function getAddonDropdownApi(params?: { categoryId?: string; subCategoryId?: string; forceRefresh?: boolean }) {
  const cleanCatId = (params?.categoryId || "").trim();
  const cleanSubCatId = (params?.subCategoryId || "").trim();

  // If no categoryId is provided, fetch all addons with high limit
  if (!cleanCatId) {
    return getAddonsApi({ forceRefresh: params?.forceRefresh, limit: 100 });
  }

  const cacheKey = `getAddonDropdownApi:${JSON.stringify({ categoryId: cleanCatId, subCategoryId: cleanSubCatId })}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;

  try {
    const query = new URLSearchParams();
    query.append("categoryId", cleanCatId);
    if (cleanSubCatId && /^[a-f\d]{24}$/i.test(cleanSubCatId)) {
      query.append("subCategoryId", cleanSubCatId);
    }

    const res = await authFetch(`${API_BASE_URL}/api/addon/dropdown?${query.toString()}`);
    const data = await safeJsonResponse(res);

    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      apiCache.set(cacheKey, data);
      return data;
    }

    // Fallback: If dropdown endpoint failed or returned empty (e.g. backend dropdown strictly requires status:true or subCategoryId:null),
    // fetch from getAddonsApi with categoryId:
    const fallbackRes = await getAddonsApi({
      categoryId: cleanCatId,
      subCategoryId: cleanSubCatId || undefined,
      limit: 100,
      forceRefresh: params?.forceRefresh,
    });

    if (fallbackRes && fallbackRes.success && Array.isArray(fallbackRes.data)) {
      const filtered = cleanSubCatId
        ? fallbackRes.data.filter((item: any) => {
          const sId = typeof item.subCategoryId === "object" ? item.subCategoryId?._id : item.subCategoryId;
          return !sId || String(sId) === cleanSubCatId;
        })
        : fallbackRes.data;

      const fallbackResult = {
        success: true,
        message: "Addon dropdown fetched successfully.",
        data: filtered,
      };
      if (filtered.length > 0) {
        apiCache.set(cacheKey, fallbackResult);
      }
      return fallbackResult;
    }

    return data || { success: true, message: "Addon dropdown fetched successfully.", data: [] };
  } catch (error) {
    console.error("getAddonDropdownApi error:", error);
    return getAddonsApi({ categoryId: cleanCatId, limit: 100, forceRefresh: params?.forceRefresh });
  }
}

export interface AddonPayload {
  categoryId?: string;
  subCategoryId?: string;
  addonName?: string;
  title?: string;
  description?: string;
  price?: number;
  unit?: string;
  imageUrl?: string;
  image?: File | Blob | null;
  category?: string;
  status?: boolean;
}

export async function createAddonApi(payload: AddonPayload | FormData) {
  clearApiCache("getAddonsApi");
  clearApiCache("getAddonDropdownApi");
  try {
    let body: BodyInit;
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      body = payload;
    } else {
      const data = payload as AddonPayload;
      const formData = new FormData();
      if (data.categoryId) formData.append("categoryId", data.categoryId);
      if (data.subCategoryId) formData.append("subCategoryId", data.subCategoryId);
      const name = data.addonName || data.title || "";
      if (name) formData.append("addonName", name);
      if (data.description !== undefined) formData.append("description", data.description);
      if (data.price !== undefined) formData.append("price", String(data.price));
      if (data.unit) formData.append("unit", data.unit);
      if (data.status !== undefined) formData.append("status", String(data.status));

      if (data.image instanceof File || data.image instanceof Blob) {
        formData.append("image", data.image);
      } else if (data.imageUrl && data.imageUrl.startsWith("data:")) {
        const blob = dataURLtoBlob(data.imageUrl);
        if (blob) {
          formData.append("image", blob, "addon.jpg");
        }
      } else if (data.imageUrl && !data.imageUrl.startsWith("blob:")) {
        formData.append("imageUrl", data.imageUrl);
      }
      body = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/addon`, {
      method: "POST",
      body,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createAddonApi error:", error);
    return { success: false, message: "Failed to create spare part add-on." };
  }
}

export async function updateAddonApi(
  id: string,
  payload: AddonPayload | FormData
) {
  clearApiCache("getAddonsApi");
  clearApiCache("getAddonDropdownApi");
  try {
    let body: BodyInit;
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      body = payload;
    } else {
      const data = payload as AddonPayload;
      const formData = new FormData();
      if (data.categoryId) formData.append("categoryId", data.categoryId);
      if (data.subCategoryId !== undefined) {
        formData.append("subCategoryId", data.subCategoryId || "");
      }
      const name = data.addonName || data.title;
      if (name) formData.append("addonName", name);
      if (data.description !== undefined) formData.append("description", data.description);
      if (data.price !== undefined) formData.append("price", String(data.price));
      if (data.unit) formData.append("unit", data.unit);
      if (data.status !== undefined) formData.append("status", String(data.status));

      if (data.image instanceof File || data.image instanceof Blob) {
        formData.append("image", data.image);
      } else if (data.imageUrl && data.imageUrl.startsWith("data:")) {
        const blob = dataURLtoBlob(data.imageUrl);
        if (blob) {
          formData.append("image", blob, "addon.jpg");
        }
      } else if (data.imageUrl && !data.imageUrl.startsWith("blob:")) {
        formData.append("imageUrl", data.imageUrl);
      }
      body = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/addon/${id}`, {
      method: "PATCH",
      body,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateAddonApi error:", error);
    return { success: false, message: "Failed to update spare part add-on." };
  }
}

export async function getAddonDetailsApi(id: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/addon/${id}`);
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getAddonDetailsApi error:", error);
    return { success: false, message: "Failed to fetch spare part add-on details." };
  }
}

export async function deleteAddonApi(id: string) {
  clearApiCache("getAddonsApi");
  clearApiCache("getAddonDropdownApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/addon/${id}`, {
      method: "DELETE",
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("deleteAddonApi error:", error);
    return { success: false, message: "Failed to delete spare part add-on." };
  }
}

export async function toggleAddonStatusApi(id: string, status?: boolean) {
  clearApiCache("getAddonsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/addon/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    console.error("toggleAddonStatusApi error:", error);
    return { success: false, message: "Failed to toggle status." };
  }
}

// ─── SERVICE ACTION APIS ───

export interface ApiServiceAction {
  _id: string;
  name: string;
  serviceAction?: string;
  serviceName?: string;
  categoryId?: any;
  categoryName?: string;
  subCategoryId?: any;
  subCategoryName?: string;
  subCategory?: any;
  price?: number;
  originalPrice?: number;
  duration?: any;
  thumbnailUrl?: string;
  imageUrl?: string;
  package?: any;
  addons?: any[];
  description?: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getServiceActionsApi(
  params?: { categoryId?: string; subCategoryId?: string; categoryName?: string; subCategoryName?: string; forceRefresh?: boolean } | boolean
) {
  let categoryId = "";
  let subCategoryId = "";
  let categoryName = "";
  let subCategoryName = "";
  let forceRefresh = false;

  if (typeof params === "boolean") {
    forceRefresh = params;
  } else if (params && typeof params === "object") {
    categoryId = params.categoryId || "";
    subCategoryId = params.subCategoryId || "";
    categoryName = params.categoryName || "";
    subCategoryName = params.subCategoryName || "";
    forceRefresh = !!params.forceRefresh;
  }

  const queryParts: string[] = [];
  if (categoryId) queryParts.push(`categoryId=${encodeURIComponent(categoryId)}`);
  if (subCategoryId) queryParts.push(`subCategoryId=${encodeURIComponent(subCategoryId)}`);
  if (categoryName) queryParts.push(`categoryName=${encodeURIComponent(categoryName)}`);
  if (subCategoryName) queryParts.push(`subCategoryName=${encodeURIComponent(subCategoryName)}`);
  const queryString = queryParts.length ? `?${queryParts.join("&")}` : "";

  const cacheKey = `getServiceActionsApi_${queryString}`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;
  try {
    if (categoryId) {
      const res = await authFetch(`${API_BASE_URL}/api/service-action/dropdown${queryString}`);
      const data = await safeJsonResponse(res);
      if (data && data.success !== false) {
        apiCache.set(cacheKey, data);
        return data;
      }
    }

    return { success: true, data: [] };
  } catch (error) {
    console.error("getServiceActionsApi error:", error);
    return { success: false, message: "Failed to fetch service actions." };
  }
}

export async function getServiceActionDropdownApi(params?: { categoryId?: string; subCategoryId?: string; forceRefresh?: boolean }) {
  const cleanCatId = (params?.categoryId || "").trim();
  const cleanSubCatId = (params?.subCategoryId || "").trim();

  if (!cleanCatId) {
    return { success: true, data: [] };
  }

  const cacheKey = `getServiceActionDropdownApi:${JSON.stringify({ categoryId: cleanCatId, subCategoryId: cleanSubCatId })}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;

  try {
    const query = new URLSearchParams();
    if (cleanCatId) query.append("categoryId", cleanCatId);
    if (cleanSubCatId) query.append("subCategoryId", cleanSubCatId);

    const res = await authFetch(`${API_BASE_URL}/api/service-action/dropdown?${query.toString()}`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getServiceActionDropdownApi error:", error);
    return { success: false, message: "Failed to fetch service action dropdown options." };
  }
}

export interface ServiceActionPayload {
  categoryId?: string;
  subCategoryId?: string;
  serviceAction?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  iconUrl?: string;
  iconFile?: File;
  status?: boolean;
}

export async function createServiceActionApi(payload: ServiceActionPayload | FormData) {
  clearApiCache("getServiceActionsApi");
  clearApiCache("getServiceActionDropdownApi");
  try {
    let body: any;
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      body = payload;
    } else {
      const obj = payload as ServiceActionPayload;
      const formData = new FormData();
      if (obj.categoryId) formData.append("categoryId", obj.categoryId);
      if (obj.subCategoryId && obj.subCategoryId.trim()) formData.append("subCategoryId", obj.subCategoryId.trim());
      const actionName = obj.serviceAction || obj.name;
      if (actionName) formData.append("serviceAction", actionName.trim());
      if (obj.status !== undefined) formData.append("status", String(obj.status));

      const imgInput = obj.iconFile || obj.imageUrl || obj.thumbnailUrl || obj.iconUrl;
      if (imgInput instanceof File) {
        formData.append("icon", imgInput);
      } else if (typeof imgInput === "string" && imgInput.startsWith("data:")) {
        const blob = dataURLtoBlob(imgInput);
        if (blob) {
          formData.append("icon", blob, "service_action_icon.jpg");
        }
      }
      body = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/service-actions`, {
      method: "POST",
      body,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createServiceActionApi error:", error);
    return { success: false, message: "Failed to create service action." };
  }
}

export async function updateServiceActionApi(id: string, payload: ServiceActionPayload | FormData) {
  clearApiCache("getServiceActionsApi");
  clearApiCache("getServiceActionDropdownApi");
  try {
    let body: any;
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      body = payload;
    } else {
      const obj = payload as ServiceActionPayload;
      const formData = new FormData();
      if (obj.categoryId) formData.append("categoryId", obj.categoryId);
      if (obj.subCategoryId && obj.subCategoryId.trim()) formData.append("subCategoryId", obj.subCategoryId.trim());
      const actionName = obj.serviceAction || obj.name;
      if (actionName) formData.append("serviceAction", actionName.trim());
      if (obj.status !== undefined) formData.append("status", String(obj.status));

      const imgInput = obj.iconFile || obj.imageUrl || obj.thumbnailUrl || obj.iconUrl;
      if (imgInput instanceof File) {
        formData.append("icon", imgInput);
      } else if (typeof imgInput === "string" && imgInput.startsWith("data:")) {
        const blob = dataURLtoBlob(imgInput);
        if (blob) {
          formData.append("icon", blob, "service_action_icon.jpg");
        }
      }
      body = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/service-action/${id}`, {
      method: "PUT",
      body,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateServiceActionApi error:", error);
    return { success: false, message: "Failed to update service action." };
  }
}

export async function deleteServiceActionApi(id: string) {
  clearApiCache("getServiceActionsApi");
  clearApiCache("getServiceActionDropdownApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/service-action/${id}`, {
      method: "DELETE",
    });
    const data = await safeJsonResponse(res);
    if (!res.ok) {
      return {
        success: false,
        message: data?.message || data?.error || data?.detail || `Failed to delete service action (${res.status}).`,
        ...data,
      };
    }
    return data;
  } catch (error: any) {
    console.error("deleteServiceActionApi error:", error);
    return { success: false, message: error?.message || "Failed to delete service action." };
  }
}

// ─── PACKAGE APIS ───

export interface ApiPackageItem {
  _id: string;
  packageId?: string;
  packageName: string;
  subtitle?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  duration?: number | string;
  imageUrl?: string;
  thumbnailUrl?: string;
  serviceActionId?: {
    _id: string;
    serviceAction?: string;
    name?: string;
    categoryId?: string;
    subCategoryId?: string;
  } | string | null;
  serviceAction?: {
    id?: string;
    name?: string;
  };
  category?: {
    id?: string;
    name?: string;
  };
  addons?: any[];
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getPackagesApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  serviceAction?: string;
  serviceActionId?: string;
  serviceId?: string;
  categoryId?: string;
  subCategoryId?: string;
  categoryName?: string;
  subCategoryName?: string;
  category?: string;
  subcategory?: string;
  forceRefresh?: boolean;
}) {
  const cacheKey = `getPackagesApi:${JSON.stringify(params || {})}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;
  try {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit !== undefined) {
      query.append("limit", String(params.limit));
    } else {
      query.append("limit", "10");
    }
    if (params?.search) query.append("search", params.search);
    if (params?.serviceAction) query.append("serviceAction", params.serviceAction);
    if (params?.serviceActionId) query.append("serviceActionId", params.serviceActionId);
    if (params?.serviceId) query.append("serviceId", params.serviceId);
    if (params?.categoryId) query.append("categoryId", params.categoryId);
    if (params?.subCategoryId) query.append("subCategoryId", params.subCategoryId);
    if (params?.categoryName) query.append("categoryName", params.categoryName);
    if (params?.subCategoryName) query.append("subCategoryName", params.subCategoryName);
    if (params?.category) query.append("category", params.category);
    if (params?.subcategory) query.append("subcategory", params.subcategory);

    const res = await authFetch(`${API_BASE_URL}/api/package?${query.toString()}`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getPackagesApi error:", error);
    return { success: false, message: "Failed to fetch packages." };
  }
}

export async function getPackageByIdApi(id: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/customer/packages/${id}`);
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getPackageByIdApi error:", error);
    return { success: false, message: "Failed to fetch package details." };
  }
}

export async function getPackageDropdownApi(params?: string | {
  serviceId?: string;
  serviceAction?: string;
  categoryId?: string;
  subCategoryId?: string;
  categoryName?: string;
  subCategoryName?: string;
  category?: string;
  subcategory?: string;
}) {
  try {
    const query = new URLSearchParams();
    if (typeof params === "string") {
      query.append("serviceId", params);
    } else if (params) {
      if (params.serviceId) query.append("serviceId", params.serviceId);
      if (params.serviceAction) query.append("serviceAction", params.serviceAction);
      if (params.categoryId) query.append("categoryId", params.categoryId);
      if (params.subCategoryId) query.append("subCategoryId", params.subCategoryId);
      if (params.categoryName) query.append("categoryName", params.categoryName);
      if (params.subCategoryName) query.append("subCategoryName", params.subCategoryName);
      if (params.category) query.append("category", params.category);
      if (params.subcategory) query.append("subcategory", params.subcategory);
    }
    const res = await authFetch(`${API_BASE_URL}/api/package/dropdown?${query.toString()}`);
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getPackageDropdownApi error:", error);
    return { success: false, message: "Failed to fetch package dropdown." };
  }
}

export function formatImageUrl(imgUrl?: any, packageId?: string): string {
  if (!imgUrl && !packageId) return "";
  let rawStr = "";
  if (typeof imgUrl === "string") {
    rawStr = imgUrl;
  } else if (typeof imgUrl === "object" && imgUrl !== null) {
    const pkgId = imgUrl._id || imgUrl.packageId || imgUrl.id;
    if (pkgId && (imgUrl.imageUrl || imgUrl.thumbnailUrl || imgUrl.image)) {
      return `/api/media/package/${pkgId}/image`;
    }
    rawStr =
      imgUrl.passportPhotoUrl ||
      imgUrl.url ||
      imgUrl.imageUrl ||
      imgUrl.objectName ||
      imgUrl.location ||
      imgUrl.path ||
      "";
  }
  if (!rawStr && packageId) {
    return `/api/media/package/${packageId}/image`;
  }
  if (!rawStr || typeof rawStr !== "string") return "";
  let trimmed = rawStr.trim();
  if (!trimmed) {
    return packageId ? `/api/media/package/${packageId}/image` : "";
  }

  // Data URLs (base64) and blob URLs don't need transformation
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Route any backend media URL through same-origin (/api/media/...)
  // This completely eliminates browser CORP (Cross-Origin-Resource-Policy: same-origin) blocking
  if (trimmed.includes("/api/media/")) {
    return trimmed.substring(trimmed.indexOf("/api/media/"));
  }
  if (trimmed.includes("/uploads/")) {
    return trimmed.substring(trimmed.indexOf("/uploads/"));
  }

  // If a package ID is provided or in URL and rawStr is an internal MinIO path
  if (packageId && (trimmed.startsWith("helpMate/packages") || trimmed.includes("packages/"))) {
    return `/api/media/package/${packageId}/image`;
  }

  // 1. Google Drive file view links to direct image source
  const gdriveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^\/&#?]+)/);
  const gdriveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?.*id=([^\/&#?]+)/);
  const gdriveId = gdriveFileMatch ? gdriveFileMatch[1] : gdriveIdMatch ? gdriveIdMatch[1] : null;

  if (gdriveId) {
    return `https://lh3.googleusercontent.com/d/${gdriveId}`;
  }

  // 2. Dropbox share link conversion
  if (trimmed.includes("dropbox.com")) {
    if (trimmed.includes("dl=0")) {
      trimmed = trimmed.replace("dl=0", "raw=1");
    } else if (!trimmed.includes("raw=1")) {
      trimmed += (trimmed.includes("?") ? "&" : "?") + "raw=1";
    }
  }

  // 3. Convert backslashes (Windows paths like uploads\image.png) to forward slashes
  trimmed = trimmed.replace(/\\/g, "/");

  // 4. Absolute URLs (http:// or https://) - preserve them completely
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return encodeURI(decodeURI(trimmed));
    } catch {
      return trimmed;
    }
  }

  // 5. If it's a relative URL or internal path like helpMate/packages/...
  if (trimmed.includes("packages") && packageId) {
    return `/api/media/package/${packageId}/image`;
  }

  const origin = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/api\/?$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const fullUrl = origin ? `${origin}${path}` : path;

  // 6. Safely encode space characters and unescaped symbols
  try {
    return encodeURI(decodeURI(fullUrl));
  } catch {
    return fullUrl;  
  }
}

/**
 * Extracts initials from a title or name.
 * If two or more words are present, returns the first letter of the first word and the first letter of the second word.
 * If only one word is present, returns the first letter of that word.
 * E.g., "Deep Cleaning" -> "DC", "AC Repair" -> "AR", "Tap & Pipe" -> "TP", "Plumbing" -> "P"
 */
export function getTitleInitials(title?: string, fallback: string = "HM"): string {
  if (!title || typeof title !== "string") return fallback;
  const words = title
    .trim()
    .split(/[\s\-_/]+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  if (words.length >= 2) {
    const first = words[0].charAt(0);
    const second = words[1].charAt(0);
    return (first + second).toUpperCase();
  }
  if (words.length === 1) {
    return (words[0].charAt(0) || fallback).toUpperCase();
  }
  return fallback.toUpperCase();
}

export function ensureAddonsArray(rawAddons: any): string[] {
  if (!rawAddons) return [];
  let list: any[] = [];
  if (Array.isArray(rawAddons)) {
    list = rawAddons;
  } else if (typeof rawAddons === "string") {
    const trimmed = rawAddons.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) list = parsed;
        else list = [trimmed];
      } catch {
        list = [trimmed];
      }
    } else if (trimmed.length > 0) {
      list = [trimmed];
    }
  } else if (typeof rawAddons === "object" && rawAddons !== null) {
    list = [rawAddons];
  }

  return list
    .map((a: any) => {
      if (typeof a === "string") return a.trim();
      if (typeof a === "object" && a !== null) return String(a._id || a.id || a.addonId || "").trim();
      return String(a || "").trim();
    })
    .filter((id: string) => id.length === 24);
}

export function cleanImagePayload(imgUrl?: string): string {
  if (!imgUrl) return "";
  return formatImageUrl(imgUrl);
}

/**
 * Calculates and converts any duration input (hours, mins, ranges, composite strings) into integer minutes for backend payload.
 * Examples:
 * - "1 hr" -> 60
 * - "1.5 hrs" -> 90
 * - "2 hrs" -> 120
 * - "2 - 3 hrs" -> 150
 * - "1 hr 30 mins" -> 90
 * - "45 mins" -> 45
 * - 45 -> 45
 */
export function calculateDurationInMinutes(input: unknown): number {
  if (input === null || input === undefined) return 45;
  if (typeof input === "number") {
    return Number.isFinite(input) && input > 0 ? Math.round(input) : 45;
  }
  let raw = String(input).trim().toLowerCase();
  if (!raw) return 45;

  // Insert space between numbers and letters (e.g. "2hrs" -> "2 hrs", "1.5hrs" -> "1.5 hrs")
  raw = raw.replace(/(\d+(?:\.\d+)?)([a-z]+)/gi, "$1 $2");

  // 1. Check for combined hour & minute: e.g. "1 hr 30 mins", "1 hour and 15 min", "2h 45m"
  const comboMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|h)\b(?:\s*(?:and|&)?\s*(\d+(?:\.\d+)?)\s*(?:mins?|minutes?|m)\b)/i);
  if (comboMatch) {
    const hours = parseFloat(comboMatch[1]) || 0;
    const mins = parseFloat(comboMatch[2]) || 0;
    const total = Math.round(hours * 60 + mins);
    if (total > 0) return total;
  }

  // 2. Check for range in hours: e.g. "2 - 3 hrs", "2-3 hours", "1 to 2 hrs", "4 - 5 hrs"
  const hourRangeMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|h)\b/i);
  if (hourRangeMatch) {
    const h1 = parseFloat(hourRangeMatch[1]) || 0;
    const h2 = parseFloat(hourRangeMatch[2]) || 0;
    const avgHours = (h1 + h2) / 2;
    const total = Math.round(avgHours * 60);
    if (total > 0) return total;
  }

  // 3. Check for range in minutes: e.g. "30 - 45 mins", "45 to 60 mins"
  const minRangeMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:mins?|minutes?|m)\b/i);
  if (minRangeMatch) {
    const m1 = parseFloat(minRangeMatch[1]) || 0;
    const m2 = parseFloat(minRangeMatch[2]) || 0;
    const total = Math.round((m1 + m2) / 2);
    if (total > 0) return total;
  }

  // 4. Minutes specified explicitly: e.g. "180 mins (3 hrs)", "45 mins", "60 mins (1 hr)", "90 minutes", "30m"
  const minMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:mins?|minutes?|m)\b/i);
  if (minMatch) {
    const mins = Math.round(parseFloat(minMatch[1]) || 0);
    if (mins > 0) return mins;
  }

  // 5. Pure hours: e.g. "1 hr", "1.5 hrs", "2 hours", "0.5 hr", "3 hrs"
  const hMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|h)\b/i);
  if (hMatch) {
    const hours = parseFloat(hMatch[1]) || 0;
    const total = Math.round(hours * 60);
    if (total > 0) return total;
  }

  // 6. Just numbers: e.g. "45", "60", "120", "180" (backend API returns duration in minutes)
  const plainNum = parseFloat(raw);
  if (!isNaN(plainNum) && plainNum > 0) {
    return Math.round(plainNum);
  }

  return 45;
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hrs = minutes / 60;
  if (Number.isInteger(hrs)) {
    return `${minutes} mins (${hrs} ${hrs === 1 ? "hr" : "hrs"})`;
  }
  const wholeHrs = Math.floor(hrs);
  const remMins = minutes % 60;
  if (remMins === 30) {
    return `${minutes} mins (${hrs.toFixed(1)} hrs)`;
  }
  const hrPart = wholeHrs === 1 ? "1 hr" : `${wholeHrs} hrs`;
  return `${minutes} mins (${hrPart} ${remMins} mins)`;
}

export function formatHoursOnly(minutes: number): string {
  if (minutes < 60) return "";
  const hrs = minutes / 60;
  if (Number.isInteger(hrs)) {
    return `${hrs} ${hrs === 1 ? "hr" : "hrs"}`;
  }
  const wholeHrs = Math.floor(hrs);
  const remMins = minutes % 60;
  if (remMins === 30) {
    return `${hrs.toFixed(1)} hrs`;
  }
  const hrPart = wholeHrs === 1 ? "1 hr" : `${wholeHrs} hrs`;
  return `${hrPart} ${remMins} mins`;
}

export async function createPackageApi(
  payload:
    | FormData
    | {
      serviceActionId?: string;
      packages?: Array<{
        packageName: string;
        subtitle?: string;
        description?: string;
        price: number;
        originalPrice?: number;
        duration: number | string;
        imageUrl?: string;
        thumbnailUrl?: string;
        addons?: string[];
        includeInPackage?: string[];
        excludeFromPackage?: string[];
      }>;
      serviceId?: string;
      categoryId?: string;
      subCategoryId?: string;
      serviceAction?: string;
      packageName?: string;
      description?: string;
      subtitle?: string;
      price?: number;
      duration?: number | string;
      originalPrice?: number;
      thumbnailUrl?: string;
      imageUrl?: string;
      addons?: string[];
      includeInPackage?: string[];
      excludeFromPackage?: string[];
      status?: boolean;
    }
) {
  clearApiCache("getPackagesApi");
  try {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;

    let bodyData: BodyInit;

    if (isFormData) {
      bodyData = payload as FormData;
    } else {
      const pkgObj = payload as any;
      const serviceActionId = pkgObj.serviceActionId || pkgObj.serviceId || "";

      let rawPackages: any[] = [];
      if (Array.isArray(pkgObj.packages)) {
        rawPackages = pkgObj.packages;
      } else if (pkgObj.packageName || pkgObj.price !== undefined) {
        rawPackages = [pkgObj];
      }

      const formData = new FormData();
      if (serviceActionId) {
        formData.append("serviceActionId", serviceActionId);
      }

      const formattedPackages = await Promise.all(
        rawPackages.map(async (p: any, index: number) => {
          let fileBlob: Blob | File | null = null;
          if (typeof File !== "undefined" && p.imageFile instanceof File) {
            fileBlob = p.imageFile;
          } else {
            const rawUri = p.imageUrl || p.thumbnailUrl || "";
            if (rawUri.startsWith("blob:") || rawUri.startsWith("http://") || rawUri.startsWith("https://")) {
              try {
                const res = await fetch(rawUri);
                fileBlob = await res.blob();
              } catch {
                fileBlob = null;
              }
            } else if (rawUri.startsWith("data:")) {
              fileBlob = dataURLtoBlob(rawUri);
            }
          }

          if (fileBlob) {
            const mimeType = (fileBlob as any).type || "image/jpeg";
            const ext = mimeType.split("/")[1] || "jpeg";
            formData.append(`package_${index}_image`, fileBlob, `package_${index}_image.${ext}`);
          }

          const pkgItem: any = {
            packageName: p.packageName || p.title || "",
            description: p.description || `${p.packageName || "Service"} package`,
            price: Number(p.price) || 0,
            originalPrice: Number(p.originalPrice) || Math.round((Number(p.price) || 0) * 1.3),
            duration: calculateDurationInMinutes(p.duration),
            addons: Array.isArray(p.addons)
              ? p.addons.filter((id: any) => typeof id === "string" && id.length === 24)
              : [],
            imageUrl: cleanImagePayload(p.imageUrl || p.thumbnailUrl || ""),
            thumbnailUrl: cleanImagePayload(p.thumbnailUrl || p.imageUrl || ""),
            includeInPackage: Array.isArray(p.includeInPackage)
              ? p.includeInPackage
                .filter((item: any) => typeof item === "string")
                .map((item: string) => item.trim().replace(/^[•-]\s*/, "").trim())
                .filter(Boolean)
              : [],
            excludeFromPackage: Array.isArray(p.excludeFromPackage)
              ? p.excludeFromPackage
                .filter((item: any) => typeof item === "string")
                .map((item: string) => item.trim().replace(/^[•-]\s*/, "").trim())
                .filter(Boolean)
              : [],
          };

          if (p.subtitle && typeof p.subtitle === "string" && p.subtitle.trim()) {
            pkgItem.subtitle = p.subtitle.trim();
          }

          return pkgItem;
        })
      );

      formData.append("packages", JSON.stringify(formattedPackages));
      bodyData = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/package`, {
      method: "POST",
      body: bodyData,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createPackageApi error:", error);
    return { success: false, message: "Failed to create package." };
  }
}

export async function updatePackageApi(
  id: string,
  payload:
    | FormData
    | {
      serviceId?: string;
      serviceActionId?: string;
      categoryId?: string;
      subCategoryId?: string;
      serviceAction?: string;
      packageName?: string;
      description?: string;
      subtitle?: string;
      price?: number;
      duration?: number | string;
      originalPrice?: number;
      thumbnailUrl?: string;
      imageUrl?: string;
      imageFile?: File;
      removeImage?: boolean;
      addons?: string[];
      includeInPackage?: string[];
      excludeFromPackage?: string[];
      status?: boolean;
    }
) {
  clearApiCache("getPackagesApi");
  try {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    let bodyData: BodyInit;
    if (isFormData) {
      const formPayload = payload as FormData;
      const sa = formPayload.get("serviceActionId");
      if (typeof sa === "string" && sa && !/^[0-9a-fA-F]{24}$/.test(sa)) {
        console.warn("Removing non-ObjectId serviceActionId from FormData in updatePackageApi:", sa);
        formPayload.delete("serviceActionId");
      }
      bodyData = formPayload;
    } else {
      const objPayload = payload as Record<string, any>;
      let fileBlob: Blob | File | null = null;
      if (typeof File !== "undefined" && objPayload.imageFile instanceof File) {
        fileBlob = objPayload.imageFile;
      } else {
        const rawUri = objPayload.imageUrl || objPayload.thumbnailUrl || "";
        if (rawUri.startsWith("blob:") || rawUri.startsWith("data:")) {
          if (rawUri.startsWith("blob:")) {
            try {
              const res = await fetch(rawUri);
              fileBlob = await res.blob();
            } catch {
              fileBlob = null;
            }
          } else {
            fileBlob = dataURLtoBlob(rawUri);
          }
        }
      }

      const formData = new FormData();
      const serviceActionId = objPayload.serviceActionId || objPayload.serviceId || "";
      if (serviceActionId && /^[0-9a-fA-F]{24}$/.test(serviceActionId)) {
        formData.append("serviceActionId", serviceActionId);
      }

      if (objPayload.packageName || objPayload.title) {
        formData.append("packageName", String(objPayload.packageName || objPayload.title).trim());
      }

      if (objPayload.subtitle !== undefined) {
        formData.append("subtitle", objPayload.subtitle && typeof objPayload.subtitle === "string" ? objPayload.subtitle.trim() : "");
      }

      if (objPayload.description !== undefined) {
        formData.append("description", objPayload.description && typeof objPayload.description === "string" ? objPayload.description.trim() : "");
      }

      if (objPayload.price !== undefined) {
        formData.append("price", String(Number(objPayload.price) || 0));
        formData.append(
          "originalPrice",
          String(Number(objPayload.originalPrice) || Math.round((Number(objPayload.price) || 0) * 1.3))
        );
      }

      if (objPayload.duration !== undefined) {
        formData.append("duration", String(calculateDurationInMinutes(objPayload.duration)));
      }

      if (Array.isArray(objPayload.includeInPackage)) {
        const includedPoints = objPayload.includeInPackage
          .filter((item: any) => typeof item === "string")
          .map((item: string) => item.trim().replace(/^[•-]\s*/, "").trim())
          .filter(Boolean);
        formData.append("includeInPackage", JSON.stringify(includedPoints));
      }

      if (Array.isArray(objPayload.excludeFromPackage)) {
        const excludedPoints = objPayload.excludeFromPackage
          .filter((item: any) => typeof item === "string")
          .map((item: string) => item.trim().replace(/^[•-]\s*/, "").trim())
          .filter(Boolean);
        formData.append("excludeFromPackage", JSON.stringify(excludedPoints));
      }

      const validAddonIds = ensureAddonsArray(objPayload.addons);
      formData.append("addons", JSON.stringify(validAddonIds));

      if (fileBlob) {
        const mimeType = (fileBlob as any).type || "image/jpeg";
        const ext = mimeType.split("/")[1] || "jpeg";
        formData.append("image", fileBlob, `package_image.${ext}`);
      } else if (objPayload.removeImage || (objPayload.imageUrl === "" && !objPayload.thumbnailUrl)) {
        formData.append("removeImage", "true");
        formData.append("imageUrl", "");
      }

      bodyData = formData;
    }
    const res = await authFetch(`${API_BASE_URL}/api/package/${id}`, {
      method: "PATCH",
      body: bodyData,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updatePackageApi error:", error);
    return { success: false, message: "Failed to update package." };
  }
}

export async function deletePackageApi(id: string, token?: string) {
  clearApiCache("getPackagesApi");
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    const res = await authFetch(`${API_BASE_URL}/api/package/${id}`, {
      method: "DELETE",
      headers,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("deletePackageApi error:", error);
    return { success: false, message: "Failed to delete package." };
  }
}

// ─── BOOKING APIS ───

export interface ApiSelectedAddonPayload {
  addonId: string;
  quantity: number;
}

export interface ApiBookingItemPayload {
  categoryId: string;
  subCategoryId: string;
  serviceActionId: string;
  packageId: string;
  quantity: number;
}

export interface ApiCreateBookingPayload {
  customerId: string;
  addressId: string;
  items: ApiBookingItemPayload[];
  partnerId?: string;
  bookingDate: string;
  timeSlot: string;
  paymentMethod: "cash" | "upi" | "card" | "wallet";
  bookingSource?: "admin" | "app" | "website";
}

export async function createBookingApi(payload: ApiCreateBookingPayload) {
  clearApiCache("getBookingsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/booking`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    console.error("createBookingApi error:", error);
    return { success: false, message: "Failed to create booking." };
  }
}

export interface ApiCalculatePricePayload {
  items: ApiBookingItemPayload[];
  couponCode?: string;
}

export async function calculateBookingPriceApi(payload: ApiCalculatePricePayload) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/booking/calculate-price`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("calculateBookingPriceApi error:", error);
    return { success: false, message: "Failed to calculate booking price." };
  }
}

export interface ApiBookingCategoryStat {
  _id: string;
  categoryName: string;
  totalBookings: number;
  openBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface ApiBookingCategoriesResponse {
  success: boolean;
  message?: string;
  data?: {
    allServices: {
      totalBookings: number;
      openBookings: number;
      activeBookings: number;
      completedBookings: number;
      cancelledBookings: number;
    };
    categories: ApiBookingCategoryStat[];
  };
}

export async function getBookingCategoriesApi(forceRefresh?: boolean) {
  const cacheKey = `getBookingCategoriesApi`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;

  try {
    const res = await authFetch(`${API_BASE_URL}/api/booking/categories`);
    const data = await res.json();
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getBookingCategoriesApi error:", error);
    return { success: false, message: "Failed to fetch booking categories." };
  }
}

export async function getBookingsApi(
  params?:
    | { categoryId?: string; search?: string; status?: string; bookingType?: string; page?: number; limit?: number; forceRefresh?: boolean }
    | boolean
) {
  let categoryId = "";
  let search = "";
  let status = "";
  let bookingType = "";
  let page: number | undefined;
  let limit = 100;
  let forceRefresh = false;

  if (typeof params === "boolean") {
    forceRefresh = params;
  } else if (params && typeof params === "object") {
    categoryId = params.categoryId || "";
    search = params.search || "";
    status = params.status || "";
    bookingType = params.bookingType || "";
    page = params.page;
    limit = params.limit || 100;
    forceRefresh = !!params.forceRefresh;
  }

  const cacheKey = `getBookingsApi:${JSON.stringify({ categoryId, search, status, bookingType, page, limit })}`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;

  try {
    const query = new URLSearchParams();
    if (categoryId) query.append("categoryId", categoryId);
    if (search) query.append("search", search);
    if (status) query.append("status", status);
    if (bookingType) query.append("bookingType", bookingType);
    if (page) query.append("page", String(page));
    query.append("limit", String(limit));

    const res = await authFetch(`${API_BASE_URL}/api/booking?${query.toString()}`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getBookingsApi error:", error);
    return { success: false, message: "Failed to fetch bookings." };
  }
}

export async function getBookingDashboardStatsApi() {
  clearApiCache("getBookingDashboardStatsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/booking/dashboard-stats`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getBookingDashboardStatsApi error:", error);
    return { success: false, message: "Failed to fetch booking dashboard stats." };
  }
}

export async function getBookingDetailsApi(id: string) {
  try {
    let res = await authFetch(`${API_BASE_URL}/api/booking/${id}/details`);
    if (!res.ok) {
      res = await authFetch(`${API_BASE_URL}/api/booking/${id}`);
    }
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getBookingDetailsApi error:", error);
    return { success: false, message: "Failed to fetch booking details." };
  }
}

export interface ApiUpdateBookingPayload {
  addressId: string;
  items: ApiBookingItemPayload[];
  partnerId?: string;
  bookingDate: string;
  timeSlot: string;
}

export async function updateBookingApi(id: string, payload: ApiUpdateBookingPayload) {
  clearApiCache("getBookingsApi");
  try {
    const res = await fetch(`${API_BASE_URL}/api/booking/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    console.error("updateBookingApi error:", error);
    return { success: false, message: "Failed to update booking." };
  }
}

export async function completeBookingApi(id: string) {
  clearApiCache("getBookingsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/booking/${id}/complete`, {
      method: "PUT",
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("completeBookingApi error:", error);
    return { success: false, message: "Failed to complete booking." };
  }
}

// ─── CUSTOMER APIS ───

export interface ApiCustomerDropdownItem {
  _id: string;
  customerCode?: string;
  fullName: string;
  mobile: string;
  email?: string;
}

export async function getCustomerDropdownApi(params?: { search?: string; forceRefresh?: boolean; token?: string }) {
  const cacheKey = `getCustomerDropdownApi:${JSON.stringify(params || {})}`;
  if (!params?.forceRefresh && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  try {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    query.append("limit", "100");

    const reqHeaders: Record<string, string> = {};
    if (params?.token) {
      reqHeaders["Authorization"] = params.token.startsWith("Bearer ") ? params.token : `Bearer ${params.token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/admin/customer/dropdown?${query.toString()}`, {
      headers: reqHeaders,
    });
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getCustomerDropdownApi error:", error);
    return { success: false, message: "Failed to fetch customer dropdown." };
  }
}

export interface ApiCreateCustomerPayload {
  fullName: string;
  mobile: string;
  alternatePhone?: string;
  email?: string;
  customerCategory?: string;
  propertyHouseholdType?: string;
  address: {
    addressLabel: string;
    relationshipType: "self" | "family_member" | "friend_neighbor" | "office_work" | "other_person";
    localityId: string;
    pincode: string;
    serviceAddress: string;
    landmark?: string;
  };
}

export async function createCustomerApi(payload: ApiCreateCustomerPayload & { token?: string }) {
  try {
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (payload?.token) {
      reqHeaders["Authorization"] = payload.token.startsWith("Bearer ") ? payload.token : `Bearer ${payload.token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/admin/customer`, {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({
        fullName: payload.fullName,
        mobile: payload.mobile,
        alternatePhone: payload.alternatePhone || "",
        email: payload.email || "",
        customerCategory: payload.customerCategory || "individual_household",
        propertyHouseholdType: payload.propertyHouseholdType || "apartment_flat",
        address: {
          addressLabel: payload.address.addressLabel || "Home (Primary)",
          relationshipType: payload.address.relationshipType || "self",
          localityId: payload.address.localityId,
          pincode: payload.address.pincode || "221002",
          serviceAddress: payload.address.serviceAddress || "Varanasi",
          landmark: payload.address.landmark || "",
        },
      }),
    });
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.clear();
    }
    return data;
  } catch (error) {
    console.error("createCustomerApi error:", error);
    return { success: false, message: "Failed to create customer." };
  }
}

export interface ApiAdminCustomerItem {
  _id: string;
  customerCode?: string;
  fullName: string;
  mobile: string;
  alternatePhone?: string;
  email?: string;
  customerCategory?: string;
  propertyHouseholdType?: string;
  status?: boolean;
  isPasswordSet?: boolean;
  passwordSetAt?: string;
  createdAt?: string;
  updatedAt?: string;
  primaryAddress?: {
    _id?: string;
    addressLabel?: string;
    relationshipType?: string;
    localityId?: {
      _id?: string;
      localityName?: string;
      pincode?: string;
    } | string;
    pincode?: string;
    serviceAddress?: string;
    landmark?: string;
  };
}

export async function getAdminCustomersApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  forceRefresh?: boolean;
  token?: string;
}) {
  const cacheKey = `getAdminCustomersApi:${JSON.stringify(params || {})}`;
  if (!params?.forceRefresh && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  try {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.search) query.append("search", params.search);
    if (params?.status !== undefined) query.append("status", String(params.status));

    const reqHeaders: Record<string, string> = {};
    if (params?.token) {
      reqHeaders["Authorization"] = params.token.startsWith("Bearer ") ? params.token : `Bearer ${params.token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/admin/customer?${query.toString()}`, {
      headers: reqHeaders,
    });
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getAdminCustomersApi error:", error);
    return { success: false, message: "Failed to fetch customers." };
  }
}

export interface ApiCustomerDetailsAddress {
  _id: string;
  customerId: string;
  recipientName?: string;
  recipientMobile?: string;
  addressLabel: string;
  relationshipType?: string;
  localityId?: {
    _id: string;
    localityName: string;
    pincode: string;
  } | string;
  pincode: string;
  serviceAddress: string;
  landmark?: string;
  isPrimary?: boolean;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCustomerDetailsBookingItem {
  category?: { id?: string; name?: string };
  subCategory?: { id?: string; name?: string };
  serviceAction?: { id?: string; name?: string };
  package?: { id?: string; name?: string; price?: number; duration?: number };
  selectedAddons?: Array<{
    addonId?: string;
    name?: string;
    unitPrice?: number;
    quantity?: number;
    totalPrice?: number;
    _id?: string;
  }>;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  _id?: string;
}

export interface ApiCustomerDetailsBooking {
  _id: string;
  bookingNumber: string;
  status: string;
  bookingSource?: string;
  customer?: {
    customerId?: string;
    name?: string;
    mobile?: string;
    otpVerified?: boolean;
    otpVerificationMethod?: string;
  };
  address?: {
    addressId?: string;
    addressLabel?: string;
    localityId?: string;
    localityName?: string;
    pincode?: string;
    serviceAddress?: string;
    landmark?: string;
  };
  items?: ApiCustomerDetailsBookingItem[];
  schedule?: {
    bookingDate?: string;
    timeSlot?: string;
  };
  billing?: {
    mrp?: number;
    sellingPrice?: number;
    platformFee?: number;
    discount?: number;
    gst?: number;
    totalAmount?: number;
    payment?: {
      paymentMethod?: string;
      paymentStatus?: string;
    };
  };
  assignment?: {
    assignmentType?: string;
    partnerId?: string;
    partnerName?: string;
    assignedAt?: string;
    assignedBy?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCustomerDetailsInvoiceItem {
  categoryName?: string;
  subCategoryName?: string;
  serviceActionName?: string;
  packageName?: string;
  quantity?: number;
  unitPrice?: number;
  selectedAddons?: Array<{
    name?: string;
    unitPrice?: number;
    quantity?: number;
    totalPrice?: number;
    _id?: string;
  }>;
  totalPrice?: number;
  _id?: string;
}

export interface ApiCustomerDetailsInvoice {
  _id: string;
  invoiceNumber: string;
  bookingId?: string;
  bookingNumber?: string;
  customer?: {
    customerId?: string;
    name?: string;
    mobile?: string;
  };
  address?: {
    addressLabel?: string;
    localityName?: string;
    pincode?: string;
    serviceAddress?: string;
    landmark?: string;
  };
  items?: ApiCustomerDetailsInvoiceItem[];
  billing?: {
    mrp?: number;
    sellingPrice?: number;
    discount?: number;
    platformFee?: number;
    gst?: number;
    totalAmount?: number;
    paymentMethod?: string;
    paymentStatus?: string;
  };
  invoiceStatus?: string;
  generatedBy?: string | null;
  generatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCustomerDetailsReview {
  _id: string;
  customerId: string;
  packageId?: {
    _id: string;
    packageName: string;
  };
  bookingId?: string;
  rating: number;
  review: string;
  status: string;
  isPublished?: boolean;
  publishedAt?: string;
  publishedBy?: string;
  moderationNote?: string;
  officialResponse?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCustomerDetailsData {
  customer: ApiAdminCustomerItem;
  addresses: ApiCustomerDetailsAddress[];
  bookings: ApiCustomerDetailsBooking[];
  invoices: ApiCustomerDetailsInvoice[];
  reviews: ApiCustomerDetailsReview[];
  summary: {
    totalAddresses: number;
    totalBookings: number;
    totalInvoices: number;
    totalReviews: number;
  };
}

export async function getCustomerDetailsApi(
  customerId: string,
  forceRefresh?: boolean,
  token?: string
) {
  const cacheKey = `getCustomerDetailsApi:${customerId}`;
  if (!forceRefresh && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  try {
    const reqHeaders: Record<string, string> = {};
    if (token) {
      reqHeaders["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/admin/customer/${customerId}/details`, {
      headers: reqHeaders,
    });
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getCustomerDetailsApi error:", error);
    return { success: false, message: "Failed to fetch customer details." };
  }
}

export async function updateCustomerApi(id: string, payload: ApiCreateCustomerPayload & { status?: boolean; token?: string }) {
  try {
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (payload?.token) {
      reqHeaders["Authorization"] = payload.token.startsWith("Bearer ") ? payload.token : `Bearer ${payload.token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/admin/customer/${id}`, {
      method: "PUT",
      headers: reqHeaders,
      body: JSON.stringify(payload),
    });
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.clear();
    }
    return data;
  } catch (error) {
    console.error("updateCustomerApi error:", error);
    return { success: false, message: "Failed to update customer." };
  }
}

export async function deleteCustomerApi(id: string, token?: string) {
  try {
    const reqHeaders: Record<string, string> = {};
    if (token) {
      reqHeaders["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/admin/customer/${id}`, {
      method: "DELETE",
      headers: reqHeaders,
    });
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.clear();
    }
    return data;
  } catch (error) {
    console.error("deleteCustomerApi error:", error);
    return { success: false, message: "Failed to delete customer." };
  }
}



export async function sendBookingCustomerOtpApi(payload: { customerId: string; token?: string }) {
  try {
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (payload?.token) {
      reqHeaders["Authorization"] = payload.token.startsWith("Bearer ") ? payload.token : `Bearer ${payload.token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/booking/customer/send-otp`, {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({ customerId: payload.customerId }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("sendBookingCustomerOtpApi error:", error);
    return { success: false, message: "Failed to send OTP." };
  }
}

export async function verifyBookingCustomerOtpApi(payload: { customerId?: string; mobile?: string; otp: string; token?: string }) {
  try {
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (payload?.token) {
      reqHeaders["Authorization"] = payload.token.startsWith("Bearer ") ? payload.token : `Bearer ${payload.token}`;
    }

    const bodyObj: Record<string, string> = { otp: payload.otp };
    if (payload.customerId) bodyObj.customerId = payload.customerId;

    const res = await authFetch(`${API_BASE_URL}/api/booking/customer/verify-otp`, {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify(bodyObj),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("verifyBookingCustomerOtpApi error:", error);
    return { success: false, message: "Failed to verify OTP." };
  }
}

export async function sendCustomerOtpApi(payload: { customerId?: string; mobile?: string; token?: string }) {
  if (payload.customerId) {
    return sendBookingCustomerOtpApi({ customerId: payload.customerId, token: payload.token });
  }
  return { success: false, message: "Customer ID is required to send OTP." };
}

export async function getCustomerTrustStatusApi(customerId: string, forceRefresh?: boolean, token?: string) {
  const cacheKey = `getCustomerTrustStatusApi:${customerId}`;
  if (!forceRefresh && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  try {
    const reqHeaders: Record<string, string> = {};
    if (token) {
      reqHeaders["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/customer-trust/${customerId}`, {
      headers: reqHeaders,
    });
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getCustomerTrustStatusApi error:", error);
    return { success: false, message: "Failed to fetch customer trust status." };
  }
}


// ─── CUSTOMER ADDRESS APIS ───


export interface ApiCustomerAddressPayload {
  customerId: string;
  addressLabel: string;
  relationshipType: "self" | "family_member" | "friend_neighbor" | "office_work" | "other_person" | string;
  localityId: string;
  pincode: string;
  serviceAddress: string;
  landmark?: string;
  isPrimary?: boolean;
  recipientName?: string;
  recipientMobile?: string;
}

export async function createCustomerAddressApi(payload: ApiCustomerAddressPayload & { token?: string }) {
  clearApiCache("getCustomerAddressesApi");
  try {
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (payload?.token) {
      reqHeaders["Authorization"] = payload.token.startsWith("Bearer ") ? payload.token : `Bearer ${payload.token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/customer-address`, {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createCustomerAddressApi error:", error);
    return { success: false, message: "Failed to save customer address." };
  }
}

export async function getCustomerAddressesApi(customerId: string, forceRefresh?: boolean, token?: string) {
  const cacheKey = `getCustomerAddressesApi:${customerId}`;
  if (!forceRefresh && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  try {
    const reqHeaders: Record<string, string> = {};
    if (token) {
      reqHeaders["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/customer-address/${customerId}`, {
      headers: reqHeaders,
    });
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getCustomerAddressesApi error:", error);
    return { success: false, message: "Failed to fetch customer addresses." };
  }
}

export async function updateCustomerAddressApi(id: string, payload: Partial<ApiCustomerAddressPayload> & { token?: string }) {
  clearApiCache("getCustomerAddressesApi");
  try {
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (payload?.token) {
      reqHeaders["Authorization"] = payload.token.startsWith("Bearer ") ? payload.token : `Bearer ${payload.token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/customer-address/${id}`, {
      method: "PUT",
      headers: reqHeaders,
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateCustomerAddressApi error:", error);
    return { success: false, message: "Failed to update customer address." };
  }
}

export async function deleteCustomerAddressApi(id: string, token?: string) {
  clearApiCache("getCustomerAddressesApi");
  try {
    const reqHeaders: Record<string, string> = {};
    if (token) {
      reqHeaders["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    const res = await authFetch(`${API_BASE_URL}/api/customer-address/${id}`, {
      method: "DELETE",
      headers: reqHeaders,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("deleteCustomerAddressApi error:", error);
    return { success: false, message: "Failed to delete customer address." };
  }
}

// ─── PARTNER APIS ───

export interface ApiPartner {
  _id: string;
  partnerId?: string;
  name: string;
  mobile: string;
  designation?: string;
  rating?: number;
  category?: string;
  locality?: string;
  servicePincodes?: any[];
  serviceActions?: any[];
  status?: string;
  totalJobs?: number;
  lastCompletedJob?: {
    title: string;
    bookingId?: string;
    completedAt?: string;
  };
}

export interface GetPartnersParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getPartnersApi(params?: GetPartnersParams, forceRefresh?: boolean) {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString();
  const cacheKey = `getPartnersApi_${queryString}`;
  if (!forceRefresh && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  try {
    const res = await authFetch(`${API_BASE_URL}/api/partner${queryString ? `?${queryString}` : ""}`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getPartnersApi error:", error);
    return { success: false, message: "Failed to fetch partners." };
  }
}

export async function getPartnerDropdownApi(forceRefresh?: boolean) {
  const cacheKey = `getPartnerDropdownApi`;
  if (!forceRefresh && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  try {
    const res = await authFetch(`${API_BASE_URL}/api/partner/dropdown`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getPartnerDropdownApi error:", error);
    return { success: false, message: "Failed to fetch partner dropdown." };
  }
}

export async function getPartnerByIdApi(id: string, forceRefresh?: boolean) {
  const cacheKey = `getPartnerByIdApi_${id}`;
  if (!forceRefresh && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  try {
    const res = await authFetch(`${API_BASE_URL}/api/partner/${id}`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false && data.data && !Array.isArray(data.data)) {
      apiCache.set(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.error("getPartnerByIdApi single fetch error:", error);
  }

  // Fallback to searching inside getPartnersApi list
  try {
    const allRes = await getPartnersApi({ limit: 100 }, forceRefresh);
    if (allRes && allRes.success !== false && Array.isArray(allRes.data)) {
      const found = allRes.data.find((p: any) => p._id === id || p.partnerId === id);
      if (found) {
        const result = { success: true, data: found };
        apiCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.error("getPartnerByIdApi fallback error:", err);
  }

  return { success: false, message: "Partner not found." };
}

export async function assignPartnerToBookingApi(bookingId: string, partnerId: string) {
  clearApiCache("getBookingsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/booking/${bookingId}/assign-partner`, {
      method: "PUT",
      body: JSON.stringify({ partnerId }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("assignPartnerToBookingApi error:", error);
    return { success: false, message: "Failed to assign partner to booking." };
  }
}

export interface CreatePartnerPayload {
  name: string;
  mobile: string;
  mobileVerificationToken?: string;
  email?: string;
  residentialAddress?: string;
  password?: string;
  bankDetails?: {
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  } | string;
  serviceActions?: string[] | string;
  servicePincodes?: string[] | string;
  designation?: string;
  commissionRate?: number | string;
  kyc?: {
    aadhaarNumber?: string;
  } | string;
  guarantor?: {
    name?: string;
    relation?: string;
    mobile?: string;
    mobileVerified?: boolean;
  } | string;
  guarantorVerificationToken?: string;
  verificationDocumentType?: string;
  aadhaarFront?: File | Blob | null;
  aadhaarBack?: File | Blob | null;
  passportPhoto?: File | Blob | null;
  verificationDocument?: File | Blob | null;
}

// ─── PARTNER & GUARANTOR OTP VERIFICATION APIS ───

export async function sendPartnerMobileOtpApi(mobile: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/partner/send-mobile-verification-otp`, {
      method: "POST",
      body: JSON.stringify({ mobile }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("sendPartnerMobileOtpApi error:", error);
    return { success: false, message: "Failed to send partner mobile OTP." };
  }
}

export async function verifyPartnerMobileOtpApi(mobile: string, otp: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/partner/verify-mobile`, {
      method: "POST",
      body: JSON.stringify({ mobile, otp }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("verifyPartnerMobileOtpApi error:", error);
    return { success: false, message: "Failed to verify partner mobile OTP." };
  }
}

export async function sendGuarantorMobileOtpApi(mobile: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/partner/send-guarantor-verification-otp`, {
      method: "POST",
      body: JSON.stringify({ mobile }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("sendGuarantorMobileOtpApi error:", error);
    return { success: false, message: "Failed to send guarantor mobile OTP." };
  }
}

export async function verifyGuarantorMobileOtpApi(mobile: string, otp: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/partner/verify-guarantor-mobile`, {
      method: "POST",
      body: JSON.stringify({ mobile, otp }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("verifyGuarantorMobileOtpApi error:", error);
    return { success: false, message: "Failed to verify guarantor mobile OTP." };
  }
}

function attachPartnerPhotoFields(formData: FormData, photo?: any) {
  if (!photo) return;
  if (typeof photo === "string") {
    if (photo.trim() && !formData.has("passportPhoto")) {
      formData.append("passportPhoto", photo.trim());
    }
  } else {
    if (!formData.has("passportPhoto")) {
      formData.append("passportPhoto", photo);
    }
  }
}

export async function createPartnerApi(payload: CreatePartnerPayload | FormData) {
  clearApiCache("getPartner");
  clearApiCache("getPartners");
  clearApiCache("getPartnerDropdownApi");
  try {
    let bodyData: FormData | string;

    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      bodyData = payload;
      const docs = bodyData.getAll("verificationDocument");
      if (docs.length === 0 || (docs.length === 1 && docs[0] instanceof File && docs[0].size === 0)) {
        bodyData.delete("verificationDocument");
        bodyData.delete("verificationDocuments");
      }
      const existingPhoto =
        bodyData.get("passportPhoto") ||
        bodyData.get("image") ||
        bodyData.get("profilePhoto") ||
        bodyData.get("profileImage") ||
        bodyData.get("avatar");
      if (existingPhoto) {
        attachPartnerPhotoFields(bodyData, existingPhoto);
      }
    } else {
      const data = payload as any;
      const formData = new FormData();

      if (data.name) formData.append("name", data.name);
      if (data.mobile) formData.append("mobile", data.mobile);
      if (data.mobileVerificationToken) formData.append("mobileVerificationToken", data.mobileVerificationToken);
      if (data.email) formData.append("email", data.email);
      if (data.residentialAddress) formData.append("residentialAddress", data.residentialAddress);
      if (data.password) formData.append("password", data.password);
      if (data.designation) formData.append("designation", data.designation);
      if (data.commissionRate !== undefined) formData.append("commissionRate", String(data.commissionRate));

      if (data.bankDetails) {
        formData.append("bankDetails", typeof data.bankDetails === "string" ? data.bankDetails : JSON.stringify(data.bankDetails));
      }
      if (data.serviceActions) {
        formData.append("serviceActions", typeof data.serviceActions === "string" ? data.serviceActions : JSON.stringify(data.serviceActions));
      }
      if (data.servicePincodes) {
        formData.append("servicePincodes", typeof data.servicePincodes === "string" ? data.servicePincodes : JSON.stringify(data.servicePincodes));
      }
      if (data.kyc) {
        formData.append("kyc", typeof data.kyc === "string" ? data.kyc : JSON.stringify(data.kyc));
      }
      if (data.guarantor) {
        formData.append("guarantor", typeof data.guarantor === "string" ? data.guarantor : JSON.stringify(data.guarantor));
      }
      if (data.guarantorVerificationToken) formData.append("guarantorVerificationToken", data.guarantorVerificationToken);

      if (data.aadhaarFront) formData.append("aadhaarFront", data.aadhaarFront);
      if (data.aadhaarBack) formData.append("aadhaarBack", data.aadhaarBack);

      const photo = data.passportPhoto || data.image || data.profilePhoto || data.profileImage || data.avatar;
      if (photo) {
        attachPartnerPhotoFields(formData, photo);
      }

      if (data.verificationDocumentType) {
        formData.append("verificationDocumentType", data.verificationDocumentType);
      }
      if (data.verificationDocumentTypes) {
        formData.append("verificationDocumentTypes", typeof data.verificationDocumentTypes === "string" ? data.verificationDocumentTypes : JSON.stringify(data.verificationDocumentTypes));
      }
      if (data.verificationDocument) {
        formData.append("verificationDocument", data.verificationDocument);
      }
      if (data.verificationDocuments) {
        if (Array.isArray(data.verificationDocuments)) {
          data.verificationDocuments.forEach((doc: any) => formData.append("verificationDocuments", doc));
        } else {
          formData.append("verificationDocuments", data.verificationDocuments);
        }
      }

      bodyData = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/partner`, {
      method: "POST",
      body: bodyData,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createPartnerApi error:", error);
    return { success: false, message: "Failed to create partner." };
  }
}

export async function updatePartnerApi(id: string, payload: Partial<CreatePartnerPayload> | FormData) {
  clearApiCache("getPartner");
  clearApiCache("getPartners");
  clearApiCache("getPartnerDropdownApi");
  try {
    let bodyData: FormData | string;

    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      bodyData = payload;
      const docs = bodyData.getAll("verificationDocument");
      if (docs.length === 0 || (docs.length === 1 && docs[0] instanceof File && docs[0].size === 0)) {
        bodyData.delete("verificationDocument");
        bodyData.delete("verificationDocuments");
      }
      const existingPhoto =
        bodyData.get("passportPhoto") ||
        bodyData.get("image") ||
        bodyData.get("profilePhoto") ||
        bodyData.get("profileImage") ||
        bodyData.get("avatar");
      if (existingPhoto) {
        attachPartnerPhotoFields(bodyData, existingPhoto);
      }
    } else {
      const data = payload as any;
      const formData = new FormData();

      if (data.name) formData.append("name", data.name);
      if (data.mobile) formData.append("mobile", data.mobile);
      if (data.mobileVerificationToken) formData.append("mobileVerificationToken", data.mobileVerificationToken);
      if (data.email) formData.append("email", data.email);
      if (data.residentialAddress) formData.append("residentialAddress", data.residentialAddress);
      if (data.password) formData.append("password", data.password);
      if (data.designation) formData.append("designation", data.designation);
      if (data.commissionRate !== undefined) formData.append("commissionRate", String(data.commissionRate));

      if (data.bankDetails) {
        formData.append("bankDetails", typeof data.bankDetails === "string" ? data.bankDetails : JSON.stringify(data.bankDetails));
      }
      if (data.serviceActions) {
        formData.append("serviceActions", typeof data.serviceActions === "string" ? data.serviceActions : JSON.stringify(data.serviceActions));
      }
      if (data.servicePincodes) {
        formData.append("servicePincodes", typeof data.servicePincodes === "string" ? data.servicePincodes : JSON.stringify(data.servicePincodes));
      }
      if (data.kyc) {
        formData.append("kyc", typeof data.kyc === "string" ? data.kyc : JSON.stringify(data.kyc));
      }
      if (data.guarantor) {
        formData.append("guarantor", typeof data.guarantor === "string" ? data.guarantor : JSON.stringify(data.guarantor));
      }
      if (data.guarantorVerificationToken) formData.append("guarantorVerificationToken", data.guarantorVerificationToken);

      if (data.aadhaarFront) formData.append("aadhaarFront", data.aadhaarFront);
      if (data.aadhaarBack) formData.append("aadhaarBack", data.aadhaarBack);

      const photo = data.passportPhoto || data.image || data.profilePhoto || data.profileImage || data.avatar;
      if (photo) {
        attachPartnerPhotoFields(formData, photo);
      }

      if (data.verificationDocumentType) {
        formData.append("verificationDocumentType", data.verificationDocumentType);
      }
      if (data.verificationDocumentTypes) {
        formData.append("verificationDocumentTypes", typeof data.verificationDocumentTypes === "string" ? data.verificationDocumentTypes : JSON.stringify(data.verificationDocumentTypes));
      }
      if (data.verificationDocument) {
        formData.append("verificationDocument", data.verificationDocument);
      }
      if (data.verificationDocuments) {
        if (Array.isArray(data.verificationDocuments)) {
          data.verificationDocuments.forEach((doc: any) => formData.append("verificationDocuments", doc));
        } else {
          formData.append("verificationDocuments", data.verificationDocuments);
        }
      }

      bodyData = formData;
    }

    const res = await authFetch(`${API_BASE_URL}/api/partner/${id}`, {
      method: "PUT",
      body: bodyData,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updatePartnerApi error:", error);
    return { success: false, message: "Failed to update partner." };
  }
}

// ─── TRENDING WEBSITE SECTION APIS ───

export interface ApiTrendingPackage {
  _id: string;
  packageId: {
    _id: string;
    serviceActionId?: string;
    packageName: string;
    subtitle?: string;
    description?: string;
    price: number;
    originalPrice: number;
    duration?: number;
    imageUrl?: string;
    thumbnailUrl?: string;
  } | string;
  displayOrder: number;
  status: boolean;
}

export interface ApiTrendingCatalogItem {
  packageId: string;
  packageName: string;
  category: {
    id: string;
    name: string;
  };
  serviceAction: {
    id: string;
    name: string;
  };
  price: number;
  originalPrice: number;
  discountPercentage: number;
  duration: number;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export async function getAdminTrendingPackagesApi(forceRefresh?: boolean) {
  const cacheKey = `getAdminTrendingPackagesApi`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;

  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/trending`);
    const data = await res.json();
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getAdminTrendingPackagesApi error:", error);
    return { success: false, message: "Failed to fetch admin trending packages." };
  }
}

export async function getTrendingCatalogPackagesApi(params?: { search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/trending/catalog${queryString}`);
    return await res.json();
  } catch (error) {
    console.error("getTrendingCatalogPackagesApi error:", error);
    return { success: false, message: "Failed to fetch trending catalog packages." };
  }
}

export async function addTrendingPackageApi(packageId: string) {
  clearApiCache("getAdminTrendingPackagesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/trending`, {
      method: "POST",
      body: JSON.stringify({ packageId }),
    });
    return await res.json();
  } catch (error) {
    console.error("addTrendingPackageApi error:", error);
    return { success: false, message: "Failed to add package to trending." };
  }
}

export async function removeTrendingPackageApi(packageId: string) {
  clearApiCache("getAdminTrendingPackagesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/trending/${packageId}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("removeTrendingPackageApi error:", error);
    return { success: false, message: "Failed to remove package from trending." };
  }
}

// ─── QUICK SERVICES APIS ───

export interface ApiQuickServiceItem {
  _id?: string;
  packageId?: string;
  packageName: string;
  price: number;
  originalPrice?: number;
  duration?: number;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  serviceActionId?: any;
  status?: boolean;
}

export async function getAdminQuickServicesApi(forceRefresh?: boolean) {
  const cacheKey = `getAdminQuickServicesApi`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;

  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/quick-services`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getAdminQuickServicesApi error:", error);
    return { success: false, message: "Failed to fetch admin quick services." };
  }
}

export async function updateAdminQuickServicesApi(packageIds: string[]) {
  clearApiCache("getAdminQuickServicesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/quick-services`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ packageIds }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateAdminQuickServicesApi error:", error);
    return { success: false, message: "Failed to update quick services." };
  }
}

// ─── QUICK SERVICE SECTIONS (CATEGORY SLIDERS) APIS ───

export interface ApiQuickServiceSectionCategory {
  _id: string;
  categoryName: string;
  slug: string;
  iconUrl?: string;
}

export interface ApiQuickServiceSectionPackage {
  _id: string;
  packageId?: string;
  serviceActionId?: string;
  packageName: string;
  subtitle?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  duration?: number;
  imageUrl?: string;
  imageMimeType?: string;
  imageSize?: number;
  addons?: any[];
  status?: boolean;
  serviceAction?: any;
  categoryName?: string;
  category?: ApiQuickServiceSectionCategory;
}

export interface ApiQuickServiceSectionItem {
  category: ApiQuickServiceSectionCategory;
  packages: ApiQuickServiceSectionPackage[];
}

export interface ApiQuickServiceSectionSectionPayload {
  categoryId: string;
  packageIds: string[];
}

export async function getQuickServiceSectionsApi(forceRefresh?: boolean) {
  const cacheKey = `getQuickServiceSectionsApi`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;

  try {
    const res = await authFetch(`${API_BASE_URL}/api/quick-service-sections`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getQuickServiceSectionsApi error:", error);
    return { success: false, message: "Failed to fetch quick service sections." };
  }
}

export async function getQuickServiceSectionOptionsApi(
  categoryIds?: string[],
  forceRefresh?: boolean
) {
  const queryStr =
    categoryIds && categoryIds.length > 0
      ? `?categoryIds=${categoryIds.map(encodeURIComponent).join("%2C")}`
      : "";
  const cacheKey = `getQuickServiceSectionOptionsApi_${queryStr}`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;

  try {
    const res = await authFetch(
      `${API_BASE_URL}/api/quick-service-sections/options${queryStr}`
    );
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getQuickServiceSectionOptionsApi error:", error);
    return {
      success: false,
      message: "Failed to fetch quick service section options.",
    };
  }
}

export async function updateQuickServiceSectionsApi(
  sections: ApiQuickServiceSectionSectionPayload[]
) {
  clearApiCache("getQuickServiceSectionsApi");
  clearApiCache("getQuickServiceSectionOptionsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/quick-service-sections`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sections }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateQuickServiceSectionsApi error:", error);
    return {
      success: false,
      message: "Failed to update quick service sections.",
    };
  }
}


// ─── CITY MANAGEMENT APIS ───

export interface ApiCity {
  _id: string;
  cityName: string;
  stateName: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCitiesApi(params?: { status?: boolean; search?: string; forceRefresh?: boolean }) {
  const query = new URLSearchParams();
  if (params?.status !== undefined) query.append("status", String(params.status));
  if (params?.search) query.append("search", params.search);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const cacheKey = `getCitiesApi:${queryString}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;

  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/cities${queryString}`);
    const data = await res.json();
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getCitiesApi error:", error);
    return { success: false, message: "Failed to fetch cities." };
  }
}

export async function getCityDetailsApi(id: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/cities/${id}`);
    return await res.json();
  } catch (error) {
    console.error("getCityDetailsApi error:", error);
    return { success: false, message: "Failed to fetch city details." };
  }
}

export async function addCityApi(payload: { cityName: string; stateName: string; status?: boolean }) {
  clearApiCache("getCitiesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/cities`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    console.error("addCityApi error:", error);
    return { success: false, message: "Failed to add city." };
  }
}

export async function updateCityApi(id: string, payload: { cityName?: string; stateName?: string; status?: boolean }) {
  clearApiCache("getCitiesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/cities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    console.error("updateCityApi error:", error);
    return { success: false, message: "Failed to update city." };
  }
}

export async function deleteCityApi(id: string) {
  clearApiCache("getCitiesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/cities/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("deleteCityApi error:", error);
    return { success: false, message: "Failed to delete city." };
  }
}

// ─── WEBSITE ZONES MANAGEMENT APIS ───

export interface ApiWebsiteZone {
  _id: string;
  zoneName: string;
  city: string;
  proCount?: number;
  sortOrder?: number;
  areasCovered?: string[];
  status?: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getWebsiteZonesApi(params?: { search?: string; city?: string; status?: string; forceRefresh?: boolean }) {
  const cacheKey = `getWebsiteZonesApi:${JSON.stringify(params || {})}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;

  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.city) query.append("city", params.city);
  if (params?.status) query.append("status", params.status);

  const queryString = query.toString() ? `?${query.toString()}` : "";

  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/zones${queryString}`);
    const data = await res.json();
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getWebsiteZonesApi error:", error);
    return { success: false, message: "Failed to fetch website zones." };
  }
}

export async function addWebsiteZoneApi(formData: FormData) {
  clearApiCache("getWebsiteZonesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/zones`, {
      method: "POST",
      body: formData,
    });
    return await res.json();
  } catch (error) {
    console.error("addWebsiteZoneApi error:", error);
    return { success: false, message: "Failed to add website zone." };
  }
}

export async function updateWebsiteZoneApi(id: string, formData: FormData) {
  clearApiCache("getWebsiteZonesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/zones/${id}`, {
      method: "PATCH",
      body: formData,
    });
    return await res.json();
  } catch (error) {
    console.error("updateWebsiteZoneApi error:", error);
    return { success: false, message: "Failed to update website zone." };
  }
}

export async function deleteWebsiteZoneApi(id: string) {
  clearApiCache("getWebsiteZonesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/zones/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("deleteWebsiteZoneApi error:", error);
    return { success: false, message: "Failed to delete website zone." };
  }
}

// ─── WEBSITE SPOTLIGHT APIS ───

export const spotlightBadges = [
  { label: "New Launch", value: "new-launch" },
  { label: "Best Seller", value: "best-seller" },
  { label: "Summer Special", value: "summer-special" },
] as const;

export type SpotlightBadgeValue = (typeof spotlightBadges)[number]["value"];

export interface ApiWebsiteSpotlight {
  _id: string;
  packageId: {
    _id: string;
    packageName: string;
    subtitle?: string;
    description?: string;
    price: number;
    originalPrice?: number;
    duration?: number;
    imageUrl?: string;
    thumbnailUrl?: string;
    status: boolean;
    serviceActionId?: any;
  } | string;
  badge: SpotlightBadgeValue;
  displayOrder: number;
  status: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getAdminSpotlightApi(forceRefresh?: boolean) {
  const cacheKey = `getAdminSpotlightApi`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;
  try {
    const res = await authFetch(`${API_BASE_URL}/api/website/spotlight/admin`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getAdminSpotlightApi error:", error);
    return { success: false, message: "Failed to fetch spotlight items." };
  }
}

export async function createSpotlightApi(payload: {
  packageId: string;
  badge: string;
  displayOrder?: number;
}) {
  clearApiCache("getAdminSpotlightApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/website/spotlight/admin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createSpotlightApi error:", error);
    return { success: false, message: "Failed to add package to spotlight." };
  }
}

export async function updateSpotlightApi(
  id: string,
  payload: {
    packageId?: string;
    badge?: string;
    displayOrder?: number;
    status?: boolean;
  }
) {
  clearApiCache("getAdminSpotlightApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/website/spotlight/admin/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateSpotlightApi error:", error);
    return { success: false, message: "Failed to update spotlight item." };
  }
}

export async function deleteSpotlightApi(id: string) {
  clearApiCache("getAdminSpotlightApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/website/spotlight/admin/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("deleteSpotlightApi error:", error);
    return { success: false, message: "Failed to delete spotlight item." };
  }
}

// ─── ADMIN REVIEWS APIs ───
export interface ApiAdminReview {
  _id: string;
  booking?: {
    id?: string;
    bookingNumber?: string;
    status?: string;
  };
  customer?: {
    id?: string;
    name?: string;
    mobile?: string;
    customerCode?: string;
  };
  package?: {
    id?: string;
    name?: string;
    price?: number;
  };
  partner?: {
    id?: string;
    name?: string;
  };
  service?: {
    name?: string;
  };
  rating: number;
  review?: string;
  video?: {
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: string | number;
    objectName?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
  } | null;
  isPublished: boolean;
  publishedAt?: string;
  moderation?: {
    status?: string;
    note?: string;
  };
  officialResponse?: string;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export async function getAdminReviewsApi(params?: {
  search?: string;
  rating?: number | string;
  status?: string;
  isPublished?: boolean | string;
  page?: number;
  limit?: number;
  forceRefresh?: boolean;
}) {
  const cacheKey = `getAdminReviewsApi:${JSON.stringify(params || {})}`;
  const cached = getFromCache(cacheKey, params?.forceRefresh);
  if (cached) return cached;

  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.rating && params.rating !== "All") query.append("rating", String(params.rating));
  if (params?.status && params.status !== "All") query.append("status", params.status);
  if (params?.isPublished !== undefined && params.isPublished !== "All") {
    query.append("isPublished", String(params.isPublished));
  }
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/reviews${queryString}`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getAdminReviewsApi error:", error);
    return { success: false, message: "Failed to fetch admin reviews." };
  }
}

export async function moderateAdminReviewApi(reviewId: string, action: "approve" | "hide") {
  clearApiCache("getAdminReviewsApi");
  clearApiCache("getAdminReviewsSummaryApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}/moderate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("moderateAdminReviewApi error:", error);
    return { success: false, message: "Failed to update review status." };
  }
}

export async function updateAdminReviewResponseApi(reviewId: string, response: string) {
  clearApiCache("getAdminReviewsApi");
  clearApiCache("getAdminReviewsSummaryApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}/response`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateAdminReviewResponseApi error:", error);
    return { success: false, message: "Failed to update official response." };
  }
}

export interface ApiAdminReviewSummary {
  averageRating: number;
  publishedReviews: number;
  videoReviews: number;
  approvedReviews: number;
}

export async function getAdminReviewsSummaryApi(forceRefresh?: boolean) {
  const cacheKey = `getAdminReviewsSummaryApi`;
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;

  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/reviews/summary`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getAdminReviewsSummaryApi error:", error);
    return { success: false, message: "Failed to fetch admin reviews summary." };
  }
}

export interface ApiAdminReviewDetails {
  _id: string;
  booking?: {
    id?: string;
    bookingNumber?: string;
    status?: string;
    bookingSource?: string;
    bookingDate?: string;
    timeSlot?: string;
  };
  customer?: {
    id?: string;
    name?: string;
    mobile?: string;
    email?: string;
    customerCode?: string;
  };
  package?: {
    id?: string;
    name?: string;
    price?: number;
    originalPrice?: number;
    duration?: number;
  };
  service?: {
    category?: string;
    subCategory?: string;
    serviceAction?: string;
  };
  partner?: {
    id?: string;
    name?: string;
    assignedAt?: string;
  };
  rating: number;
  review?: string;
  video?: {
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: string;
  } | null;
  moderation?: {
    status?: string;
    note?: string;
    isPublished?: boolean;
    publishedAt?: string;
    publishedBy?: { id?: string; name?: string; email?: string } | null;
  };
  officialResponse?: {
    message?: string;
    respondedAt?: string;
    respondedBy?: { id?: string; name?: string; email?: string } | null;
  };
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export async function getAdminReviewDetailsApi(reviewId: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}`);
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getAdminReviewDetailsApi error:", error);
    return { success: false, message: "Failed to fetch review details." };
  }
}

// ─── PLATFORM FEE & GST SETTINGS APIs ───
export interface ApiPlatformSettings {
  id?: string;
  _id?: string;
  platformConvenienceFee: number;
  gstRate: number;
  updatedBy?: { _id?: string; name?: string; email?: string } | null;
  updatedAt?: string;
}

export async function getPlatformSettingsApi(forceRefresh?: boolean) {
  const cacheKey = "getPlatformSettingsApi";
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/settings/platform`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getPlatformSettingsApi error:", error);
    return { success: false, message: "Failed to fetch platform settings." };
  }
}

export async function updatePlatformSettingsApi(payload: { platformConvenienceFee?: number; gstRate?: number }) {
  clearApiCache("getPlatformSettingsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/settings/platform`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updatePlatformSettingsApi error:", error);
    return { success: false, message: "Failed to update platform settings." };
  }
}

// ─── ADMIN ROLES APIs ───
export interface ApiRole {
  _id: string;
  name: string;
  code?: string;
  permissions?: (string | { _id: string; name?: string; code?: string; module?: string; action?: string })[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getRolesApi(forceRefresh?: boolean) {
  const cacheKey = "getRolesApi";
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/roles`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getRolesApi error:", error);
    return { success: false, message: "Failed to fetch admin roles." };
  }
}

export async function createRoleApi(payload: { name: string; permissions?: string[] }) {
  clearApiCache("getRolesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createRoleApi error:", error);
    return { success: false, message: "Failed to create role." };
  }
}

export async function updateRoleApi(id: string, payload: { name?: string; permissions?: string[]; status?: string }) {
  clearApiCache("getRolesApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateRoleApi error:", error);
    return { success: false, message: "Failed to update role." };
  }
}

// ─── ADMIN PERMISSIONS APIs ───
export interface ApiPermission {
  _id: string;
  name: string;
  code: string;
  module: string;
  action: "view" | "create" | "edit" | "delete";
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getPermissionsApi(forceRefresh?: boolean) {
  const cacheKey = "getPermissionsApi";
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/permissions`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getPermissionsApi error:", error);
    return { success: false, message: "Failed to fetch permissions." };
  }
}

export async function createPermissionApi(payload: { name: string; code?: string; module: string; action: string; status?: string }) {
  clearApiCache("getPermissionsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/permissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createPermissionApi error:", error);
    return { success: false, message: "Failed to create permission." };
  }
}

export async function updatePermissionApi(id: string, payload: { name?: string; code?: string; module?: string; action?: string; status?: string }) {
  clearApiCache("getPermissionsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/permissions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updatePermissionApi error:", error);
    return { success: false, message: "Failed to update permission." };
  }
}

export async function deletePermissionApi(id: string) {
  clearApiCache("getPermissionsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/permissions/${id}`, {
      method: "DELETE",
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("deletePermissionApi error:", error);
    return { success: false, message: "Failed to delete permission." };
  }
}

// ─── ADMIN USERS / STAFF APIs ───
export interface ApiAdminUserItem {
  _id: string;
  adminId?: string;
  name: string;
  email: string;
  role?: string | ApiRole | { _id: string; name: string };
  status?: "active" | "inactive" | string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getAdminsApi(forceRefresh?: boolean) {
  const cacheKey = "getAdminsApi";
  const cached = getFromCache(cacheKey, forceRefresh);
  if (cached) return cached;
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin`);
    const data = await safeJsonResponse(res);
    if (data && data.success !== false) {
      apiCache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getAdminsApi error:", error);
    return { success: false, message: "Failed to fetch admin users." };
  }
}

export async function createAdminApi(payload: { name: string; email: string; password?: string; role: string; status?: string }) {
  clearApiCache("getAdminsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/create-admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("createAdminApi error:", error);
    return { success: false, message: "Failed to create admin user." };
  }
}

export async function updateAdminApi(id: string, payload: { name?: string; email?: string; password?: string; role?: string; status?: string }) {
  clearApiCache("getAdminsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateAdminApi error:", error);
    return { success: false, message: "Failed to update admin user." };
  }
}

export async function deleteAdminApi(id: string) {
  clearApiCache("getAdminsApi");
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/${id}`, {
      method: "DELETE",
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("deleteAdminApi error:", error);
    return { success: false, message: "Failed to delete admin user." };
  }
}

// ─── ADMIN INVOICE APIS ───
export async function getAdminInvoicesListApi(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString();
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/invoices${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getAdminInvoicesListApi error:", error);
    return { success: false, message: "Failed to fetch invoices list." };
  }
}

export async function getAdminInvoiceApi(idOrBookingId: string) {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/invoices/${idOrBookingId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getAdminInvoiceApi error:", error);
    return { success: false, message: "Failed to fetch invoice." };
  }
}

export async function getAdminInvoicePdfBlobApi(idOrBookingId: string): Promise<Blob | null> {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/invoices/${idOrBookingId}/pdf`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Failed to download PDF (${res.status})`);
    }
    return await res.blob();
  } catch (error) {
    console.error("getAdminInvoicePdfBlobApi error:", error);
    return null;
  }
}

export interface ApiWebsiteBanner {
  _id?: string;
  badgeText: string;
  badgePosition: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  clickTargetUrl: string;
  popupDelaySeconds: number;
  displayFrequency: "once-per-session" | "once-per-24-hours";
  isActive: boolean;
  mainImageMimeType?: string;
  mainImageSize?: number;
  badgeIconMimeType?: string;
  badgeIconSize?: number;
  createdAt?: string;
  updatedAt?: string;
  mainImageUrl?: string;
  badgeIconUrl?: string;
}

export async function getWebsiteBannerApi(): Promise<{
  success: boolean;
  message?: string;
  data?: ApiWebsiteBanner;
}> {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/banner`, {
      method: "GET",
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("getWebsiteBannerApi error:", error);
    return { success: false, message: "Failed to fetch website banner configuration." };
  }
}

export async function updateWebsiteBannerApi(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  data?: ApiWebsiteBanner;
}> {
  try {
    const res = await authFetch(`${API_BASE_URL}/api/admin/website/banner`, {
      method: "PUT",
      body: formData,
    });
    return await safeJsonResponse(res);
  } catch (error) {
    console.error("updateWebsiteBannerApi error:", error);
    return { success: false, message: "Failed to update website banner configuration." };
  }
}



