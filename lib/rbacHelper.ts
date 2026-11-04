/**
 * HelpmateAdmin RBAC & Granular Permission Helper
 * Maps backend modules & 4 granular actions (view, create, edit, delete)
 */

export interface ActionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type ModulePermissionsMap = Record<string, ActionPermissions>;

export const ALL_SYSTEM_MODULES = [
  "DASHBOARD",
  "USER_MANAGEMENT",
  "BOOKING",
  "INSPECTION",
  "LEAD",
  "CUSTOMER",
  "PARTNER",
  "CATEGORY",
  "SERVICE",
  "PRICING",
  "MEMBERSHIP",
  "BANNER",
  "IMAGE_SECTION",
  "FAQ",
  "LOCATION",
  "MEDIA",
  "PAYMENT",
  "BILLING",
  "SETTLEMENT",
  "WALLET",
  "COUPON",
  "ADMIN",
  "ROLE",
  "PERMISSION",
  "ACTIVITY_LOG",
  "NOTIFICATION",
  "SETTINGS",
  "REPORT",
  "ANALYTICS",
  "REVIEW",
  "SUPPORT",
] as const;

export type SystemModuleCode = typeof ALL_SYSTEM_MODULES[number];

/**
 * Normalizes any module key, route, or alias to the uppercase standard module code
 */
export function normalizeModuleCode(raw: string): string {
  if (!raw) return "DASHBOARD";
  const cleaned = raw.trim().replace(/^\//, "").replace(/-/g, "_").toUpperCase();

  const ALIAS_MAP: Record<string, string> = {
    "": "DASHBOARD",
    "DASHBOARD": "DASHBOARD",
    "BOOKING": "BOOKING",
    "BOOKINGS": "BOOKING",
    "INSPECTION": "INSPECTION",
    "INSPECTIONS": "INSPECTION",
    "LEAD": "LEAD",
    "LEADS": "LEAD",
    "CUSTOMER": "CUSTOMER",
    "CUSTOMERS": "CUSTOMER",
    "PARTNER": "PARTNER",
    "PARTNERS": "PARTNER",
    "TECHNICIAN": "PARTNER",
    "TECHNICIANS": "PARTNER",
    "CATEGORY": "CATEGORY",
    "CATEGORIES": "CATEGORY",
    "SERVICE": "SERVICE",
    "SERVICES": "SERVICE",
    "CMS": "SERVICE",
    "PRICING": "PRICING",
    "MEMBERSHIP": "MEMBERSHIP",
    "BANNER": "BANNER",
    "BANNERS": "BANNER",
    "IMAGE_SECTION": "IMAGE_SECTION",
    "IMAGE_SECTIONS": "IMAGE_SECTION",
    "IMAGESECTIONS": "IMAGE_SECTION",
    "FAQ": "FAQ",
    "FAQS": "FAQ",
    "LOCATION": "LOCATION",
    "LOCATIONS": "LOCATION",
    "PINCODE": "LOCATION",
    "PINCODES": "LOCATION",
    "MEDIA": "MEDIA",
    "MEDIA_LIBRARY": "MEDIA",
    "PAYMENT": "PAYMENT",
    "PAYMENTS": "PAYMENT",
    "BILLING": "BILLING",
    "SETTLEMENT": "SETTLEMENT",
    "SETTLEMENTS": "SETTLEMENT",
    "COMMISSION": "SETTLEMENT",
    "WALLET": "WALLET",
    "WALLETS": "WALLET",
    "COUPON": "COUPON",
    "COUPONS": "COUPON",
    "ADMIN": "ADMIN",
    "ADMINS": "ADMIN",
    "USER": "USER_MANAGEMENT",
    "USERS": "USER_MANAGEMENT",
    "USER_MANAGEMENT": "USER_MANAGEMENT",
    "USERMANAGEMENT": "USER_MANAGEMENT",
    "RBAC": "USER_MANAGEMENT",
    "ROLE": "ROLE",
    "ROLES": "ROLE",
    "PERMISSION": "PERMISSION",
    "PERMISSIONS": "PERMISSION",
    "ACTIVITY_LOG": "ACTIVITY_LOG",
    "ACTIVITY_LOGS": "ACTIVITY_LOG",
    "ACTIVITYLOG": "ACTIVITY_LOG",
    "NOTIFICATION": "NOTIFICATION",
    "NOTIFICATIONS": "NOTIFICATION",
    "SETTING": "SETTINGS",
    "SETTINGS": "SETTINGS",
    "REPORT": "REPORT",
    "REPORTS": "REPORT",
    "ANALYTIC": "ANALYTICS",
    "ANALYTICS": "ANALYTICS",
    "REVIEW": "REVIEW",
    "REVIEWS": "REVIEW",
    "SUPPORT": "SUPPORT",
    "PARTNER_BOOKINGS": "BOOKING",
    "PARTNER_SERVICES": "SERVICE",
    "PARTNER_EARNINGS": "SETTLEMENT",
    "PARTNER_PROFILE": "PARTNER",
  };

  return ALIAS_MAP[cleaned] || cleaned;
}

export interface ModuleRouteInfo {
  moduleCode: string;
  moduleName: string;
}

/**
 * Maps a URL route pathname to its standard module code and display name
 */
export function getModuleFromPathname(pathname: string): ModuleRouteInfo | null {
  if (!pathname || pathname === "/" || pathname === "/login" || pathname === "/profile" || pathname === "/api-docs") {
    return null;
  }

  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  const segments = cleanPath.split("/");
  const firstSegment = segments[0]?.toLowerCase() || "";

  if (firstSegment === "partner") {
    return {
      moduleCode: "PARTNER_PORTAL",
      moduleName: "Partner Portal",
    };
  }

  const ROUTE_MODULE_MAP: Record<string, ModuleRouteInfo> = {
    bookings: { moduleCode: "BOOKING", moduleName: "Bookings" },
    inspections: { moduleCode: "INSPECTION", moduleName: "Inspections & Diagnostics" },
    leads: { moduleCode: "LEAD", moduleName: "Lead CRM" },
    customers: { moduleCode: "CUSTOMER", moduleName: "Customers" },
    technicians: { moduleCode: "PARTNER", moduleName: "Partners & Technicians Fleet" },
    categories: { moduleCode: "CATEGORY", moduleName: "Service Categories" },
    cms: { moduleCode: "SERVICE", moduleName: "Services Catalog CMS" },
    pricing: { moduleCode: "PRICING", moduleName: "Pricing Engine" },
    membership: { moduleCode: "MEMBERSHIP", moduleName: "VIP Membership" },
    banners: { moduleCode: "BANNER", moduleName: "Promotional Banners" },
    "image-sections": { moduleCode: "IMAGE_SECTION", moduleName: "Website Image Sections" },
    faq: { moduleCode: "FAQ", moduleName: "FAQ & Help Center" },
    locations: { moduleCode: "LOCATION", moduleName: "Pincodes & Service Locations" },
    media: { moduleCode: "MEDIA", moduleName: "Media Library" },
    payments: { moduleCode: "PAYMENT", moduleName: "Payment Transactions" },
    billing: { moduleCode: "BILLING", moduleName: "Billing & Invoices" },
    settlements: { moduleCode: "SETTLEMENT", moduleName: "Partner Settlements" },
    commission: { moduleCode: "SETTLEMENT", moduleName: "Commission Structure" },
    wallets: { moduleCode: "WALLET", moduleName: "HelpMate Wallets" },
    coupons: { moduleCode: "COUPON", moduleName: "Coupons & Discounts" },
    users: { moduleCode: "USER_MANAGEMENT", moduleName: "User Management & RBAC" },
    rbac: { moduleCode: "USER_MANAGEMENT", moduleName: "User Management & RBAC" },
    "activity-log": { moduleCode: "ACTIVITY_LOG", moduleName: "Activity & Audit Logs" },
    notifications: { moduleCode: "NOTIFICATION", moduleName: "Notifications Hub" },
    settings: { moduleCode: "SETTINGS", moduleName: "General Settings" },
    reports: { moduleCode: "REPORT", moduleName: "Reports & Exports" },
    analytics: { moduleCode: "ANALYTICS", moduleName: "Executive Analytics" },
    reviews: { moduleCode: "REVIEW", moduleName: "Customer Reviews" },
    support: { moduleCode: "SUPPORT", moduleName: "Customer Support" },
  };

  return ROUTE_MODULE_MAP[firstSegment] || null;
}

/**
 * Computes allowed modules and granular 4-action matrix (view, create, edit, delete)
 * for the logged in user or admin object.
 */
export function computeUserPermissions(
  admin: any,
  systemPermissionsLookup?: Array<{ _id?: string; id?: string; code?: string; module?: string; action?: string }>
): {
  allowedModules: string[];
  permissions: ModulePermissionsMap;
  isSuperAdmin: boolean;
} {
  const roleName = (admin?.role?.name || admin?.role || "").toString().toLowerCase();
  const roleCode = (admin?.role?.code || "").toString().toUpperCase();
  const email = (admin?.email || "").toString().toLowerCase();

  const isSuperAdmin =
    roleName.includes("super") ||
    roleCode === "SUPER_ADMIN" ||
    roleName === "super admin" ||
    email === "admin@helpmate.com";

  const permissions: ModulePermissionsMap = {};

  // Initialize all modules
  ALL_SYSTEM_MODULES.forEach((mod) => {
    permissions[mod] = {
      view: isSuperAdmin,
      create: isSuperAdmin,
      edit: isSuperAdmin,
      delete: isSuperAdmin,
    };
  });

  // Always grant full access to Dashboard
  permissions["DASHBOARD"] = { view: true, create: true, edit: true, delete: true };

  if (isSuperAdmin) {
    return {
      allowedModules: Array.from(ALL_SYSTEM_MODULES),
      permissions,
      isSuperAdmin: true,
    };
  }

  // Build lookup map for permission ObjectIds if passed
  const permLookupMap = new Map<string, { module: string; action: string }>();
  if (Array.isArray(systemPermissionsLookup)) {
    systemPermissionsLookup.forEach((p) => {
      const id = p._id || p.id;
      if (id && p.module && p.action) {
        permLookupMap.set(id, { module: p.module, action: p.action });
      }
    });
  }

  // Parse permissions from admin object
  const rawPerms: any[] = Array.isArray(admin?.role?.permissions)
    ? admin.role.permissions
    : Array.isArray(admin?.permissions)
    ? admin.permissions
    : [];

  rawPerms.forEach((p) => {
    if (!p) return;

    let moduleRaw = "";
    let actionRaw = "";

    if (typeof p === "string") {
      // Could be an ObjectId or a code like BOOKING_VIEW
      if (permLookupMap.has(p)) {
        const found = permLookupMap.get(p)!;
        moduleRaw = found.module;
        actionRaw = found.action;
      } else if (p.includes("_")) {
        const parts = p.split("_");
        actionRaw = parts.pop() || "view";
        moduleRaw = parts.join("_");
      }
    } else if (typeof p === "object") {
      if (p.status === "inactive") return;
      const id = p._id || p.id;
      if (id && permLookupMap.has(id)) {
        const found = permLookupMap.get(id)!;
        moduleRaw = found.module;
        actionRaw = found.action;
      } else {
        moduleRaw = p.module || "";
        actionRaw = p.action || "";
        if (!moduleRaw && p.code && p.code.includes("_")) {
          const parts = p.code.split("_");
          actionRaw = parts.pop() || "view";
          moduleRaw = parts.join("_");
        }
      }
    }

    if (!moduleRaw) return;

    const mod = normalizeModuleCode(moduleRaw);
    const act = (actionRaw || "view").toLowerCase().trim();

    if (!permissions[mod]) {
      permissions[mod] = { view: false, create: false, edit: false, delete: false };
    }

    if (act === "view" || act === "read") {
      permissions[mod].view = true;
    } else if (act === "create" || act === "add") {
      permissions[mod].create = true;
      permissions[mod].view = true; // Creating implies viewing
    } else if (act === "edit" || act === "update") {
      permissions[mod].edit = true;
      permissions[mod].view = true; // Editing implies viewing
    } else if (act === "delete" || act === "remove") {
      permissions[mod].delete = true;
      permissions[mod].view = true; // Deleting implies viewing
    }
  });

  // Calculate allowed modules (must have view permission)
  const allowedSet = new Set<string>();
  allowedSet.add("DASHBOARD");

  ALL_SYSTEM_MODULES.forEach((mod) => {
    const p = permissions[mod];
    if (p && (p.view || p.create || p.edit || p.delete)) {
      p.view = true;
      allowedSet.add(mod);
    }
  });

  return {
    allowedModules: Array.from(allowedSet),
    permissions,
    isSuperAdmin: false,
  };
}

