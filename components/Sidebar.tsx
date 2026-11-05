"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { toast } from "@/components/Toast";
import { getPinnedModulesApi, updatePinnedModulesApi, getAdminMeApi } from "@/lib/api";
import { computeUserPermissions } from "@/lib/rbacHelper";
import {
  LayoutDashboard,
  CalendarCheck,
  Wrench,
  Users,
  ShieldCheck,
  UserCheck,
  FileImage,
  Settings,
  DollarSign,
  FileText,
  MessageSquare,
  Tag,
  Star,
  BarChart3,
  CreditCard,
  Building2,
  Sliders,
  Search,
  ChevronDown,
  TrendingUp,
  CheckCircle2,
  X,
  Megaphone,
  Image as ImageIcon,
  MessageCircleQuestion,
  Wallet,
  Headphones,
  Crown,
  Target,
  UserPlus,
  Layers,
  Pin,
  PinOff,
  PanelLeftOpen,
  PanelLeftClose,
  Loader2,
  Mail,
  Activity,
} from "lucide-react";
import { useRbac } from "@/context/RbacContext";
import { Portal } from "@/components/Portal";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function getStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    if (item !== null) return JSON.parse(item);
  } catch {}
  return fallback;
}

function getStoredBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    if (item !== null) return item === "true";
  } catch {}
  return fallback;
}

export interface SidebarState {
  pinnedHrefs?: string[];
  maxPinnedModules?: number;
  collapsedSections?: Record<string, boolean>;
  isSidebarPinned?: boolean;
  isPinnedSectionCollapsed?: boolean;
  isSettingsOpen?: boolean;
  allowedModules?: string[];
  isSuperAdmin?: boolean;
  role?: string;
}

export function getSidebarCookie(): SidebarState | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)helpmate_sidebar_state=([^;]*)/);
    if (match && match[1]) {
      return JSON.parse(decodeURIComponent(match[1]));
    }
  } catch {}
  return null;
}

export function saveSidebarCookie(state: Partial<SidebarState>) {
  if (typeof document === "undefined") return;
  try {
    const existing = getSidebarCookie() || {};
    const merged = { ...existing, ...state };
    document.cookie = `helpmate_sidebar_state=${encodeURIComponent(JSON.stringify(merged))}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

interface SubItem {
  label: string;
  href: string;
  icon: any;
}

interface NavItem {
  title: string;
  icon: any;
  href?: string;
  badge?: string;
  subItems?: SubItem[];
}

interface NavSection {
  sectionTitle: string;
  items: NavItem[];
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  initialState?: SidebarState | null;
}

export function Sidebar({ isMobileOpen = false, onCloseMobile, initialState }: SidebarProps) {
  const pathname = usePathname();
  const { role, isSuperAdmin } = useRbac();
  const [sidebarSearch, setSidebarSearch] = useState("");
  const isRouteInSettings = useMemo(() => {
    return ["/settings", "/reports", "/analytics", "/notifications", "/reviews"].some(
      (path) => pathname === path || pathname.startsWith(path)
    );
  }, [pathname]);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(() => {
    if (initialState?.isSettingsOpen !== undefined) {
      return initialState.isSettingsOpen;
    }
    return isRouteInSettings;
  });

  const [apiAllowedModules, setApiAllowedModules] = useState<Set<string> | null>(() => {
    if (initialState?.allowedModules && Array.isArray(initialState.allowedModules)) {
      return new Set(initialState.allowedModules);
    }
    return null;
  });
  const hasFetchedPermissionsRef = useRef(false);

  const effectiveRole = initialState?.role || role;
  const isPartner = effectiveRole === "Service Partner";
  const isOfficeAdmin = effectiveRole === "Office Admin";

  const effectiveIsSuperAdmin = useMemo(() => {
    if (initialState?.isSuperAdmin === false || isSuperAdmin === false) {
      return false;
    }
    if (initialState?.allowedModules && Array.isArray(initialState.allowedModules)) {
      if (!initialState.allowedModules.includes("USER_MANAGEMENT")) {
        return false;
      }
      if (initialState.allowedModules.length < 25) {
        return false;
      }
    }
    if (apiAllowedModules) {
      if (!apiAllowedModules.has("USER_MANAGEMENT")) {
        return false;
      }
      if (apiAllowedModules.size < 25) {
        return false;
      }
    }
    if (initialState?.isSuperAdmin !== undefined) {
      return initialState.isSuperAdmin;
    }
    return !!isSuperAdmin;
  }, [initialState?.isSuperAdmin, initialState?.allowedModules, apiAllowedModules, isSuperAdmin]);

  const partnerNavSections: NavSection[] = [
    {
      sectionTitle: "Partner Portal",
      items: [
        {
          title: "My Dashboard",
          icon: LayoutDashboard,
          href: "/partner",
          // badge: "Coming Soon",
        },
      ],
    },
    {
      sectionTitle: "My Jobs & Orders",
      items: [
        {
          title: "New Assigned Jobs",
          icon: CalendarCheck,
          href: "/partner/bookings",
          badge: "2 New",
        },
      ],
    },
    {
      sectionTitle: "My Catalog & Rates",
      items: [
        {
          title: "Assigned Services",
          icon: Wrench,
          href: "/partner/services",
        },
      ],
    },
    {
      sectionTitle: "Earnings & Wallet",
      items: [
        {
          title: "Payouts & Commission",
          icon: DollarSign,
          href: "/partner/payouts",
          badge: "Coming Soon",
        },
        {
          title: "Wallet",
          icon: Wallet,
          href: "/partner/wallet",
          badge: "Coming Soon",
        },
      ],
    },
    {
      sectionTitle: "My Account",
      items: [
        {
          title: "Profile",
          icon: ShieldCheck,
          href: "/partner/profile",
        },
      ],
    },
  ];

  const adminNavSections: NavSection[] = [
    // {
    //   sectionTitle: "Overview",
    //   items: [
    //     {
    //       title: "Dashboard",
    //       icon: LayoutDashboard,
    //       href: "/",
    //       // badge: "Coming Soon",
    //     },
    //   ],
    // },
    {
      sectionTitle: "Operations",
      items: [
        {
          title: "Bookings",
          icon: CalendarCheck,
          href: "/bookings",
        },
        {
          title: "Inspections",
          icon: Wrench,
          href: "/inspections",
          badge: "Coming Soon",
        },
        {
          title: "Lead CRM",
          icon: Target,
          href: "/leads",
          badge: "Coming Soon",
        },
      ],
    },
    {
      sectionTitle: "Partners & Customers",
      items: [
        {
          title: "Customers",
          icon: Users,
          href: "/customers",
        },
        {
          title: "Partners",
          icon: UserCheck,
          href: "/technicians",
        },
      ],
    },
    {
      sectionTitle: "Customer Reviews & Support",
      items: [
        {
          title: "Reviews & Ratings",
          icon: Star,
          href: "/reviews",
        },
        { title: "Customer Support", icon: Headphones, href: "/support", badge: "Coming Soon" },
      ],
    },
    {
      sectionTitle: "Services & Pricing",
      items: [
        {
          title: "Category Catalog",
          icon: Sliders,
          href: "/categories",
        },
        {
          title: "Services CMS",
          icon: Wrench,
          href: "/cms",
        },
        {
          title: "Pricing Engine",
          icon: Tag,
          href: "/pricing",
          badge: "Coming Soon",
        },
        {
          title: "Membership",
          icon: Crown,
          href: "/membership",
          badge: "Coming Soon",
        },
      ],
    },
    {
      sectionTitle: "Website Management",
      items: [
        {
          title: "Banners & Visitor Popups",
          icon: Megaphone,
          href: "/banners",
        },
        {
          title: "Website Sections CMS",
          icon: Layers,
          href: "/image-sections",
        },
        {
          title: "FAQ Manager",
          icon: MessageCircleQuestion,
          href: "/faq",
          badge: "Coming Soon",
        },
        {
          title: "Locations & Pincodes",
          icon: Building2,
          href: "/locations",
        },
        {
          title: "Media Library",
          icon: FileImage,
          href: "/media",
        },
      ],
    },
    {
      sectionTitle: "Finance & Billing",
      items: [
        {
          title: "Payments",
          icon: CreditCard,
          href: "/payments",
          badge: "Coming Soon",
        },
        {
          title: "Billing & GST",
          icon: FileText,
          href: "/billing",
          badge: "Coming Soon",
        },
        {
          title: "Commission & Settlements",
          icon: DollarSign,
          href: "/settlements",
          badge: "Coming Soon",
        },
        {
          title: "Wallets",
          icon: Wallet,
          href: "/wallets",
          badge: "Coming Soon",
        },
        {
          title: "Coupons",
          icon: Tag,
          href: "/coupons",
          badge: "Coming Soon",
        },
      ],
    },
    {
      sectionTitle: "System & Admin",
      items: [
        {
          title: "User Management & RBAC",
          icon: ShieldCheck,
          href: "/users",
        },
        {
          title: "Activity & Audit Logs",
          icon: Activity,
          href: "/activity-log",
        },
        {
          title: "Notifications Hub",
          icon: MessageSquare,
          href: "/notifications",
          badge: "Coming Soon",
        },
        {
          title: "Settings & Analytics",
          icon: Settings,
          subItems: [
            { label: "General Settings", href: "/settings", icon: Settings },
            { label: "Reports & Exports", href: "/reports", icon: BarChart3 },
            { label: "Executive Analytics", href: "/analytics", icon: TrendingUp },
          ],
        },
      ],
    },
  ];

  const officeAdminNavSections: NavSection[] = [
    // {
    //   sectionTitle: "Overview",
    //   items: [
    //     {
    //       title: "Dashboard",
    //       icon: LayoutDashboard,
    //       href: "/",
    //       badge: "Coming Soon",
    //     },
    //   ],
    // },
    {
      sectionTitle: "Operations",
      items: [
        {
          title: "Bookings",
          icon: CalendarCheck,
          href: "/bookings",
        },
        {
          title: "Lead CRM",
          icon: Target,
          href: "/leads",
          badge: "Coming Soon",
        },
        {
          title: "Customer Support",
          icon: Headphones,
          href: "/support",
          badge: "Coming Soon",
        },
        {
          title: "Reviews & Ratings",
          icon: Star,
          href: "/reviews",
        },
      ],
    },
    {
      sectionTitle: "Finance & Billing",
      items: [
        {
          title: "Billing & Invoices",
          icon: FileText,
          href: "/billing",
          badge: "Coming Soon",
        },
        {
          title: "Finance & Settlements",
          icon: DollarSign,
          href: "/settlements",
          badge: "Coming Soon",
        },
      ],
    },
  ];

  const currentNavSections = isPartner
    ? partnerNavSections
    : isOfficeAdmin
    ? officeAdminNavSections
    : adminNavSections;

  // Backend Module Code <-> Sidebar Route Href Mappings
  const MODULE_CODE_TO_HREF: Record<string, string> = useMemo(
    () => ({
      DASHBOARD: "/",
      BOOKING: "/bookings",
      BOOKINGS: "/bookings",
      INSPECTION: "/inspections",
      INSPECTIONS: "/inspections",
      LEAD: "/leads",
      LEADS: "/leads",
      LEAD_CRM: "/leads",
      CUSTOMER: "/customers",
      CUSTOMERS: "/customers",
      PARTNER: "/technicians",
      PARTNERS: "/technicians",
      TECHNICIAN: "/technicians",
      TECHNICIANS: "/technicians",
      REVIEW: "/reviews",
      REVIEWS: "/reviews",
      SUPPORT: "/support",
      CUSTOMER_SUPPORT: "/support",
      CATEGORY: "/categories",
      CATEGORIES: "/categories",
      SERVICE: "/cms",
      SERVICES: "/cms",
      CMS: "/cms",
      SERVICES_CMS: "/cms",
      PRICING: "/pricing",
      MEMBERSHIP: "/membership",
      BANNER: "/banners",
      BANNERS: "/banners",
      IMAGE_SECTION: "/image-sections",
      IMAGE_SECTIONS: "/image-sections",
      WHERE_WE_SERVE: "/image-sections",
      WEBSITE_SECTIONS: "/image-sections",
      FAQ: "/faq",
      FAQS: "/faq",
      LOCATION: "/locations",
      LOCATIONS: "/locations",
      PINCODE: "/locations",
      PINCODES: "/locations",
      MEDIA: "/media",
      MEDIA_LIBRARY: "/media",
      PAYMENT: "/payments",
      PAYMENTS: "/payments",
      BILLING: "/billing",
      SETTLEMENT: "/settlements",
      SETTLEMENTS: "/settlements",
      COMMISSION: "/settlements",
      WALLET: "/wallets",
      WALLETS: "/wallets",
      COUPON: "/coupons",
      COUPONS: "/coupons",
      ADMIN: "/users",
      ADMINS: "/users",
      USER: "/users",
      USERS: "/users",
      USER_MANAGEMENT: "/users",
      USERMANAGEMENT: "/users",
      ROLE: "/users",
      ROLES: "/users",
      PERMISSION: "/users",
      PERMISSIONS: "/users",
      ACTIVITY_LOG: "/activity-log",
      ACTIVITY_LOGS: "/activity-log",
      AUDIT_TRAIL: "/activity-log",
      AUDIT_TRAILS: "/activity-log",
      NOTIFICATION: "/notifications",
      NOTIFICATIONS: "/notifications",
      SETTING: "/settings",
      SETTINGS: "/settings",
      REPORT: "/reports",
      REPORTS: "/reports",
      ANALYTIC: "/analytics",
      ANALYTICS: "/analytics",
      PARTNER_BOOKING: "/partner/bookings",
      PARTNER_BOOKINGS: "/partner/bookings",
      PARTNER_SERVICE: "/partner/services",
      PARTNER_SERVICES: "/partner/services",
      PARTNER_EARNING: "/partner/earnings",
      PARTNER_EARNINGS: "/partner/earnings",
      PARTNER_PROFILE: "/partner/profile",
    }),
    []
  );

  // Exact Singular Backend Module Codes matching database & http://localhost:5005/api/admin/permissions
  const HREF_TO_MODULE_CODE: Record<string, string> = useMemo(
    () => ({
      "/": "DASHBOARD",
      "/bookings": "BOOKING",
      "/inspections": "INSPECTION",
      "/leads": "LEAD",
      "/customers": "CUSTOMER",
      "/technicians": "PARTNER",
      "/reviews": "REVIEW",
      "/support": "SUPPORT",
      "/categories": "CATEGORY",
      "/cms": "SERVICE",
      "/pricing": "PRICING",
      "/membership": "MEMBERSHIP",
      "/banners": "BANNER",
      "/image-sections": "IMAGE_SECTION",
      "/faq": "FAQ",
      "/locations": "LOCATION",
      "/media": "MEDIA",
      "/payments": "PAYMENT",
      "/billing": "BILLING",
      "/settlements": "SETTLEMENT",
      "/wallets": "WALLET",
      "/coupons": "COUPON",
      "/users": "USER_MANAGEMENT",
      "/activity-log": "ACTIVITY_LOG",
      "/notifications": "NOTIFICATION",
      "/settings": "SETTINGS",
      "/reports": "REPORT",
      "/analytics": "ANALYTICS",
      "/partner/bookings": "PARTNER_BOOKING",
      "/partner/services": "PARTNER_SERVICE",
      "/partner/earnings": "PARTNER_EARNING",
      "/partner/profile": "PARTNER_PROFILE",
    }),
    []
  );

  // Filter sidebar sections strictly based on user's authorized modules
  const navSectionsToDisplay = useMemo(() => {
    if (isPartner) {
      return partnerNavSections;
    }
    if (effectiveIsSuperAdmin) {
      return adminNavSections;
    }

    if (!apiAllowedModules || apiAllowedModules.size === 0) {
      return [
        {
          sectionTitle: "Operations",
          items: [
            {
              title: "Bookings",
              icon: CalendarCheck,
              href: "/bookings",
            },
          ],
        },
      ];
    }

    return currentNavSections
      .map((section) => {
        const filteredItems = section.items
          .map((item) => {
            if (item.subItems && item.subItems.length > 0) {
              const filteredSubItems = item.subItems.filter((sub) => {
                const code = HREF_TO_MODULE_CODE[sub.href];
                if (!code || code === "DASHBOARD") return true;
                return apiAllowedModules.has(code);
              });
              if (filteredSubItems.length === 0) return null;
              return {
                ...item,
                subItems: filteredSubItems,
              };
            }

            if (!item.href) return item;
            if (item.href === "/" || item.href === "/partner") return item;
            const code = HREF_TO_MODULE_CODE[item.href];
            if (!code) return item;
            const isAllowed = apiAllowedModules.has(code);
            return isAllowed ? item : null;
          })
          .filter(Boolean) as NavItem[];

        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [isPartner, effectiveIsSuperAdmin, apiAllowedModules, partnerNavSections, adminNavSections, currentNavSections, HREF_TO_MODULE_CODE]);

  // Flattened available items for navigation & module resolution (derived from active allowed sections)
  const allNavItemsFlat = useMemo(() => {
    const list: (NavItem & { sectionTitle: string })[] = [];
    navSectionsToDisplay.forEach((sec) => {
      sec.items.forEach((item) => {
        if (item.href) {
          list.push({ ...item, sectionTitle: sec.sectionTitle });
        }
        if (item.subItems) {
          item.subItems.forEach((sub) => {
            list.push({
              title: sub.label,
              icon: sub.icon,
              href: sub.href,
              sectionTitle: sec.sectionTitle,
            });
          });
        }
      });
    });
    return list;
  }, [navSectionsToDisplay]);

  // Robust Module Resolver: maps any backend module object, code, route, or name to a sidebar link
  const resolveModuleHref = useCallback(
    (m: any): string | null => {
      if (!m) return null;
      if (typeof m === "string") {
        if (m.startsWith("/")) return m;
        const norm = m.toUpperCase().trim();
        if (MODULE_CODE_TO_HREF[norm]) return MODULE_CODE_TO_HREF[norm];
        const match = allNavItemsFlat.find(
          (item) =>
            item.title.toLowerCase() === m.toLowerCase() ||
            item.href?.toLowerCase() === m.toLowerCase()
        );
        return match?.href || null;
      }

      if (m.href && typeof m.href === "string") return m.href;
      if (m.route && typeof m.route === "string") return m.route;
      if (m.path && typeof m.path === "string") return m.path;

      const code = (m.code || "").toUpperCase().trim();
      if (code && MODULE_CODE_TO_HREF[code]) {
        return MODULE_CODE_TO_HREF[code];
      }

      const name = (m.name || "").trim().toLowerCase();
      if (name) {
        const matchByName = allNavItemsFlat.find(
          (item) => item.title.toLowerCase() === name
        );
        if (matchByName?.href) return matchByName.href;
      }

      if (code) {
        const matchByCode = allNavItemsFlat.find(
          (item) =>
            item.href &&
            item.href.replace(/^\//, "").replace(/-/g, "_").toUpperCase() === code
        );
        if (matchByCode?.href) return matchByCode.href;
      }

      return null;
    },
    [MODULE_CODE_TO_HREF, allNavItemsFlat]
  );

  // Sidebar Preferences State (Persisted in localStorage & cookies for instant zero-flicker SSR)
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>(() =>
    initialState?.pinnedHrefs ?? []
  );
  const [maxPinnedModules, setMaxPinnedModules] = useState<number>(() =>
    initialState?.maxPinnedModules ?? 5
  );
  const [isSyncingPinned, setIsSyncingPinned] = useState(false);
  const [isPinnedLoading, setIsPinnedLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() =>
    initialState?.collapsedSections ?? {}
  );
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() =>
    initialState?.isSidebarPinned ?? true
  );
  const [isPinnedSectionCollapsed, setIsPinnedSectionCollapsed] = useState<boolean>(() =>
    initialState?.isPinnedSectionCollapsed ?? false
  );
  const [isMounted, setIsMounted] = useState(false);

  const putDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedCodesRef = useRef<string>(
    (() => {
      const codes = (initialState?.pinnedHrefs ?? [])
        .map((h: string) => HREF_TO_MODULE_CODE[h] || h.replace(/^\//, "").toUpperCase())
        .filter(Boolean);
      return JSON.stringify(codes);
    })()
  );
  const serverModuleMapRef = useRef<Map<string, { id?: string; code?: string }>>(new Map());
  const hasFetchedPinnedRef = useRef(false);
  const resolveModuleHrefRef = useRef(resolveModuleHref);
  resolveModuleHrefRef.current = resolveModuleHref;

  // Load preferences on mount & fetch pinned modules from API in background (PERSISTENT & INSTANT)
  useEffect(() => {
    // 1. Ensure all cached sidebar preferences are loaded from localStorage & synced to cookie
    try {
      const storedPinned = localStorage.getItem("helpmate_sidebar_pinned_items");
      let parsedPinned: string[] = [];
      if (storedPinned) {
        parsedPinned = JSON.parse(storedPinned);
        if (Array.isArray(parsedPinned) && parsedPinned.length > 0) {
          if (!initialState?.pinnedHrefs || initialState.pinnedHrefs.length === 0) {
            setPinnedHrefs(parsedPinned);
          }
          const cachedCodes = parsedPinned
            .map((h: string) => HREF_TO_MODULE_CODE[h] || h.replace(/^\//, "").toUpperCase())
            .filter(Boolean);
          lastSavedCodesRef.current = JSON.stringify(cachedCodes);
        }
      }

      const storedMax = localStorage.getItem("helpmate_sidebar_max_pinned");
      let parsedMax = 5;
      if (storedMax) {
        const num = parseInt(storedMax, 10);
        if (!isNaN(num) && num > 0) {
          parsedMax = num;
          if (!initialState?.maxPinnedModules) {
            setMaxPinnedModules(num);
          }
        }
      }

      const storedAllowed = localStorage.getItem("helpmate_sidebar_allowed_modules");
      let parsedAllowed: string[] = [];
      if (storedAllowed) {
        parsedAllowed = JSON.parse(storedAllowed);
        if (Array.isArray(parsedAllowed) && parsedAllowed.length > 0) {
          if (!initialState?.allowedModules) {
            setApiAllowedModules(new Set(parsedAllowed));
          }
        }
      }

      const storedCollapsed = localStorage.getItem("helpmate_sidebar_collapsed_sections");
      let parsedCollapsed: Record<string, boolean> = {};
      if (storedCollapsed) {
        parsedCollapsed = JSON.parse(storedCollapsed);
        if (!initialState?.collapsedSections || Object.keys(initialState.collapsedSections).length === 0) {
          setCollapsedSections(parsedCollapsed);
        }
      }

      const storedPinnedState = localStorage.getItem("helpmate_sidebar_pinned");
      if (storedPinnedState !== null && initialState?.isSidebarPinned === undefined) {
        setIsSidebarPinned(storedPinnedState === "true");
      }

      const storedPinnedCollapsed = localStorage.getItem("helpmate_sidebar_pinned_collapsed");
      if (storedPinnedCollapsed !== null && initialState?.isPinnedSectionCollapsed === undefined) {
        setIsPinnedSectionCollapsed(storedPinnedCollapsed === "true");
      }

      const storedSettingsOpen = localStorage.getItem("helpmate_sidebar_settings_open");
      if (storedSettingsOpen !== null && initialState?.isSettingsOpen === undefined) {
        setIsSettingsOpen(storedSettingsOpen === "true");
      }

      // Sync into cookie immediately so ALL subsequent reloads have SSR state
      saveSidebarCookie({
        pinnedHrefs: initialState?.pinnedHrefs?.length ? initialState.pinnedHrefs : parsedPinned,
        maxPinnedModules: initialState?.maxPinnedModules || parsedMax,
        allowedModules: initialState?.allowedModules || (parsedAllowed.length > 0 ? parsedAllowed : undefined),
        isSuperAdmin: effectiveIsSuperAdmin,
        role: effectiveRole,
        collapsedSections: initialState?.collapsedSections && Object.keys(initialState.collapsedSections).length > 0 ? initialState.collapsedSections : parsedCollapsed,
        isSidebarPinned: initialState?.isSidebarPinned !== undefined ? initialState.isSidebarPinned : (storedPinnedState !== null ? storedPinnedState === "true" : true),
        isPinnedSectionCollapsed: initialState?.isPinnedSectionCollapsed !== undefined ? initialState.isPinnedSectionCollapsed : (storedPinnedCollapsed !== null ? storedPinnedCollapsed === "true" : false),
        isSettingsOpen: initialState?.isSettingsOpen !== undefined ? initialState.isSettingsOpen : (storedSettingsOpen !== null ? storedSettingsOpen === "true" : isRouteInSettings),
      });
    } catch (err) {
      console.warn("Failed to load cached sidebar preferences", err);
    }

    setIsMounted(true);

    // 2. Fetch authenticated user profile in background to dynamically validate user's allowed modules
    if (!isPartner && !hasFetchedPermissionsRef.current) {
      hasFetchedPermissionsRef.current = true;
      getAdminMeApi()
        .then((res) => {
          if (res && res.success && res.data) {
            const computed = computeUserPermissions(res.data);
            const newList = computed.allowedModules;
            const newSet = new Set(newList);

            setApiAllowedModules(newSet);
            try {
              localStorage.setItem(
                "helpmate_sidebar_allowed_modules",
                JSON.stringify(newList)
              );
              localStorage.setItem(
                "helpmate_user_permissions",
                JSON.stringify(computed.permissions)
              );
              saveSidebarCookie({
                allowedModules: newList,
                isSuperAdmin: computed.isSuperAdmin,
                role: res.data?.role?.name || res.data?.role || (computed.isSuperAdmin ? "Super Admin" : "Staff Admin"),
              });
            } catch {}
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch admin permissions for sidebar", err);
        });
    }

    // 3. Fetch pinned modules from API strictly in background (SWR pattern)
    if (!isPartner && !hasFetchedPinnedRef.current) {
      hasFetchedPinnedRef.current = true;
      let isSubscribed = true;

      getPinnedModulesApi()
        .then((res) => {
          if (!isSubscribed) return;
          if (res.success && res.data) {
            if (typeof res.data.maxPinnedModules === "number") {
              setMaxPinnedModules(res.data.maxPinnedModules);
              try {
                localStorage.setItem(
                  "helpmate_sidebar_max_pinned",
                  String(res.data.maxPinnedModules)
                );
              } catch {}
            }
            if (Array.isArray(res.data.modules)) {
              // Cache backend module details
              serverModuleMapRef.current.clear();
              res.data.modules.forEach((m: any) => {
                const href = resolveModuleHrefRef.current(m);
                if (href) {
                  serverModuleMapRef.current.set(href, { id: m._id, code: m.code });
                }
              });

              const sortedModules = [...res.data.modules].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0)
              );
              const serverHrefs = sortedModules
                .map((m) => resolveModuleHrefRef.current(m))
                .filter(Boolean) as string[];

              // Compare server response with current cached state to avoid unnecessary DOM movement
              const codes = sortedModules.map((m) => m.code).filter(Boolean);
              const newCodesSignature = JSON.stringify(codes);

              if (lastSavedCodesRef.current !== newCodesSignature) {
                setPinnedHrefs(serverHrefs);
                lastSavedCodesRef.current = newCodesSignature;
                try {
                  if (serverHrefs.length > 0) {
                    localStorage.setItem(
                      "helpmate_sidebar_pinned_items",
                      JSON.stringify(serverHrefs)
                    );
                  } else {
                    localStorage.removeItem("helpmate_sidebar_pinned_items");
                  }
                  saveSidebarCookie({
                    pinnedHrefs: serverHrefs,
                    maxPinnedModules: res.data.maxPinnedModules,
                  });
                } catch {}
              }
            }
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch pinned modules from API", err);
        })
        .finally(() => {
          if (isSubscribed) {
            setIsPinnedLoading(false);
          }
        });

      return () => {
        isSubscribed = false;
      };
    } else if (isPartner) {
      setIsPinnedLoading(false);
    }
  }, [isPartner, MODULE_CODE_TO_HREF, HREF_TO_MODULE_CODE]);

  // Dynamically re-fetch and apply latest permissions if a role is updated anywhere in the platform
  useEffect(() => {
    const handlePermissionsUpdated = () => {
      if (isPartner) return;
      getAdminMeApi()
        .then((res) => {
          if (res && res.success && res.data) {
            const computed = computeUserPermissions(res.data);
            const newList = computed.allowedModules;
            setApiAllowedModules(new Set(newList));
            try {
              localStorage.setItem("helpmate_sidebar_allowed_modules", JSON.stringify(newList));
              localStorage.setItem("helpmate_user_permissions", JSON.stringify(computed.permissions));
              saveSidebarCookie({
                allowedModules: newList,
                isSuperAdmin: computed.isSuperAdmin,
                role: res.data?.role?.name || res.data?.role || (computed.isSuperAdmin ? "Super Admin" : "Staff Admin"),
              });
            } catch {}
          }
        })
        .catch(() => {});
    };

    window.addEventListener("helpmate_permissions_updated", handlePermissionsUpdated);
    return () => {
      window.removeEventListener("helpmate_permissions_updated", handlePermissionsUpdated);
    };
  }, [isPartner]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (putDebounceTimerRef.current) {
        clearTimeout(putDebounceTimerRef.current);
      }
    };
  }, []);

  // Sync pinned modules to backend API with debounce
  const syncPinnedModulesToApi = useCallback(
    (nextHrefs: string[]) => {
      if (isPartner) return;

      // Extract unique module codes and ids
      const codes = nextHrefs
        .map((h) => HREF_TO_MODULE_CODE[h] || h.replace(/^\//, "").toUpperCase())
        .filter(Boolean)
        .filter((code) => {
          if (!apiAllowedModules || apiAllowedModules.size === 0) return true;
          return apiAllowedModules.has(code);
        });

      const uniqueCodes = Array.from(new Set(codes));
      const payloadSignature = JSON.stringify(uniqueCodes);

      // Skip if unchanged
      if (lastSavedCodesRef.current === payloadSignature) return;

      if (putDebounceTimerRef.current) {
        clearTimeout(putDebounceTimerRef.current);
      }

      putDebounceTimerRef.current = setTimeout(async () => {
        try {
          setIsSyncingPinned(true);
          const res = await updatePinnedModulesApi({
            pinnedModules: uniqueCodes,
            pinnedModuleCodes: uniqueCodes,
            moduleCodes: uniqueCodes,
          });
          if (res.success) {
            lastSavedCodesRef.current = payloadSignature;
            if (res.data?.maxPinnedModules) {
              setMaxPinnedModules(res.data.maxPinnedModules);
            }
          } else {
            toast.error("Sync Failed", res.message || "Failed to update pinned modules on server.");
          }
        } catch (err) {
          console.error("Error updating pinned modules:", err);
        } finally {
          setIsSyncingPinned(false);
        }
      }, 350);
    },
    [isPartner, HREF_TO_MODULE_CODE, apiAllowedModules]
  );

  // Toggle Sidebar Pin (Expand w-64 vs Compact w-[72px])
  const toggleSidebarPinned = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("helpmate_sidebar_pinned", String(next));
        saveSidebarCookie({ isSidebarPinned: next });
      } catch {}
      return next;
    });
  };

  // Toggle Item Pin in Sidebar
  const togglePinItem = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isPinning = !pinnedHrefs.includes(href);

    // Enforce maxPinnedModules limit when pinning a new item
    if (isPinning && pinnedHrefs.length >= maxPinnedModules) {
      toast.error(
        "Pin Limit Reached",
        `A maximum of ${maxPinnedModules} sidebar modules can be pinned.`,
        3000
      );
      return;
    }

    const nextHrefs = isPinning
      ? [...pinnedHrefs, href]
      : pinnedHrefs.filter((h) => h !== href);

    setPinnedHrefs(nextHrefs);
    try {
      localStorage.setItem("helpmate_sidebar_pinned_items", JSON.stringify(nextHrefs));
      saveSidebarCookie({ pinnedHrefs: nextHrefs });
    } catch {}

    // Visual feedback toast
    const navItem = allNavItemsFlat.find((i) => i.href === href);
    const itemTitle = navItem?.title || "Module";
    if (isPinning) {
      toast.success("Module Pinned", `${itemTitle} pinned to sidebar quick access.`, 2500);
    } else {
      toast.info("Module Unpinned", `${itemTitle} unpinned from sidebar.`, 2500);
    }

    // Trigger backend synchronization
    syncPinnedModulesToApi(nextHrefs);
  };

  // Toggle Section / Module Collapse
  const toggleSectionCollapse = (title: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem("helpmate_sidebar_collapsed_sections", JSON.stringify(next));
        saveSidebarCookie({ collapsedSections: next });
      } catch {}
      return next;
    });
  };

  // Toggle Pinned Section Collapse
  const togglePinnedSectionCollapse = () => {
    setIsPinnedSectionCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("helpmate_sidebar_pinned_collapsed", String(next));
        saveSidebarCookie({ isPinnedSectionCollapsed: next });
      } catch {}
      return next;
    });
  };

  // Toggle Settings & Analytics sub-items
  const toggleSettingsOpen = () => {
    setIsSettingsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("helpmate_sidebar_settings_open", String(next));
        saveSidebarCookie({ isSettingsOpen: next });
      } catch {}
      return next;
    });
  };

  // Check if item or subitem is currently active
  const isItemActive = (href?: string) => {
    if (!href) return false;
    if (href === "/" || href === "/partner") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Check if any route inside the section is active
  const isSectionActive = (section: NavSection) => {
    return section.items.some((item) => {
      if (item.href) return isItemActive(item.href);
      if (item.subItems) return item.subItems.some((sub) => isItemActive(sub.href));
      return false;
    });
  };

  // List of pinned items to show in the PINNED section
  const pinnedNavItems = useMemo(() => {
    return pinnedHrefs
      .map((href) => allNavItemsFlat.find((item) => item.href === href))
      .filter(Boolean) as (NavItem & { sectionTitle: string })[];
  }, [pinnedHrefs, allNavItemsFlat]);

  const isSearching = sidebarSearch.trim().length > 0;

  // Render individual navigation item
  const renderNavItem = (item: NavItem, isPinnedView = false, isCompact = false) => {
    const Icon = item.icon;
    const isPinned = pinnedHrefs.includes(item.href || "");

    // Nested sub-items group
    if (item.subItems && !isPinnedView) {
      const isSubActive = item.subItems.some((sub) => isItemActive(sub.href));

      if (isCompact) {
        return (
          <button
            key={item.title}
            type="button"
            onClick={toggleSettingsOpen}
            className={`w-full flex items-center justify-center p-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
              isSubActive
                ? "bg-brand-500 text-white shadow-lux"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title={`${item.title} (Settings & Analytics)`}
          >
            <Icon className={`w-4 h-4 ${isSubActive ? "text-white" : "text-slate-400 group-hover:text-brand-600"}`} />
          </button>
        );
      }

      return (
        <div key={item.title} className="space-y-1">
          <button
            type="button"
            onClick={toggleSettingsOpen}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
              isSubActive
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isSubActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-brand-600"
                }`}
              />
              <span>{item.title}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSettingsOpen ? "rotate-180" : ""}`}
            />
          </button>

          {(isSettingsOpen || isSearching) && (
            <div className="pl-6 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
              {item.subItems.map((sub) => {
                const SubIcon = sub.icon;
                const isActive = isItemActive(sub.href);
                const isSubPinned = pinnedHrefs.includes(sub.href);

                return (
                  <div
                    key={sub.href}
                    className="flex items-center justify-between gap-1 group/sub rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all pr-1"
                  >
                    <Link
                      href={sub.href}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-2 flex-1 px-3 py-1.5 text-xs font-medium transition-all rounded-lg ${
                        isActive
                          ? "bg-brand-500 text-white font-bold shadow-lux"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate">{sub.label}</span>
                    </Link>

                    {/* Pin button for sub-item */}
                    <button
                      type="button"
                      onClick={(e) => togglePinItem(sub.href, e)}
                      className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                        isSubPinned
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 opacity-0 group-hover/sub:opacity-100"
                      }`}
                      title={isSubPinned ? `Unpin ${sub.label} from sidebar` : `Pin ${sub.label} to sidebar`}
                      aria-label={isSubPinned ? `Unpin ${sub.label}` : `Pin ${sub.label}`}
                    >
                      <Pin className={`w-3 h-3 ${isSubPinned ? "fill-amber-500 rotate-45" : "hover:rotate-45"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive = isItemActive(item.href);

    // Compact mode item display
    if (isCompact) {
      return (
        <Link
          key={item.href || item.title}
          href={item.href || "#"}
          onClick={onCloseMobile}
          className={`relative flex items-center justify-center p-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
            isActive
              ? "bg-brand-500 text-white shadow-lux"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title={`${item.title}${item.badge ? ` • ${item.badge}` : ""}`}
        >
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? "text-white" : "text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400"
            }`}
          />
          {isPinned && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" title="Pinned" />
          )}
        </Link>
      );
    }

    // Standard expanded item display
    return (
      <div
        key={`${isPinnedView ? "pinned-" : ""}${item.href || item.title}`}
        className={`flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
          isActive
            ? "bg-brand-500 text-white shadow-lux"
            : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <Link
          href={item.href || "#"}
          onClick={onCloseMobile}
          className="flex items-center gap-2 min-w-0 flex-1"
        >
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? "text-white" : "text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400"
            }`}
          />
          <span className="truncate whitespace-nowrap">{item.title}</span>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          {item.badge && (
            <span
              className={`text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full transition-all border shrink-0 whitespace-nowrap ${
                item.badge.toLowerCase().includes("coming soon")
                  ? isActive
                    ? "bg-white/20 text-white border-white/30 font-bold"
                    : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 shadow-2xs"
                  : isActive
                    ? "bg-white/20 text-white border-white/30 font-bold"
                    : "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border-brand-200 dark:border-brand-800"
              }`}
            >
              {item.badge}
            </span>
          )}

          {/* Pin / Unpin button */}
          {item.href && (
            <button
              type="button"
              onClick={(e) => togglePinItem(item.href || "", e)}
              className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                isPinnedView
                  ? isActive
                    ? "text-white/80 hover:text-white hover:bg-white/20"
                    : "text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100"
                  : isPinned
                  ? isActive
                    ? "text-amber-200 hover:text-white"
                    : "text-amber-500 hover:text-amber-600 dark:text-amber-400"
                  : isActive
                  ? "text-white/70 hover:text-white opacity-0 group-hover:opacity-100"
                  : "text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 opacity-0 group-hover:opacity-100"
              }`}
              title={
                isPinnedView
                  ? `Unpin ${item.title} from sidebar`
                  : isPinned
                  ? `Unpin ${item.title} from sidebar`
                  : `Pin ${item.title} to sidebar`
              }
              aria-label={isPinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
            >
              {isPinnedView ? (
                <PinOff className="w-3 h-3" />
              ) : (
                <Pin className={`w-3 h-3 ${isPinned ? "fill-amber-500 rotate-45" : "hover:rotate-45"}`} />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSidebarContent = (isCompact = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Fixed Header Logo & Sidebar Pin Button */}
      <div
        className={`h-16 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10 transition-all ${
          isCompact ? "px-2.5 justify-center" : "px-4"
        }`}
      >
        <Link
          href={isPartner ? "/partner" : "/bookings"}
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group min-w-0"
        >
          <Image
            src="/logo.png"
            alt="HelpMate Logo"
            width={28}
            height={28}
            className="h-7 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          {!isCompact && (
            <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight truncate">HelpMate</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                    isPartner
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : isOfficeAdmin
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                      : "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 border-brand-200 dark:border-brand-800"
                  }`}
                >
                  {isPartner ? "PARTNER" : isOfficeAdmin ? "OFFICE ADMIN" : "ADMIN"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                {isPartner ? "Varanasi Partners" : isOfficeAdmin ? "Office Admin Desk" : "Varanasi HQ"}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse / Expand Sidebar Toggle */}
        <button
          type="button"
          onClick={toggleSidebarPinned}
          className={`hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ${
            isCompact ? "mt-1" : ""
          }`}
          title={isSidebarPinned ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={isSidebarPinned ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarPinned ? (
            <PanelLeftClose className="w-4 h-4 text-slate-500 hover:text-brand-600 transition-colors" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-slate-500 hover:text-brand-600 transition-colors" />
          )}
        </button>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Bar (Only shown in expanded mode) */}
      {!isCompact && (
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search menu..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable Navigation Menu */}
      <nav suppressHydrationWarning className={`space-y-3 flex-1 overflow-y-auto ${isCompact ? "p-2 space-y-2" : "p-3"}`}>
        {/* Pinned Items Quick Access Module (Expanded Mode) */}
        {!isCompact && pinnedNavItems.length > 0 && (
          <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={togglePinnedSectionCollapse}
              className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 transition-colors cursor-pointer group/pinsec select-none"
              title={isPinnedSectionCollapsed ? "Expand Pinned items" : "Collapse Pinned items"}
              aria-expanded={!isPinnedSectionCollapsed}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 rotate-45 shrink-0" />
                <span className="truncate">Pinned</span>
                <span
                  className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  title={`Pinned modules (${pinnedNavItems.length} of max ${maxPinnedModules})`}
                >
                  {pinnedNavItems.length}/{maxPinnedModules}
                </span>
                {isSyncingPinned && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" title="Syncing..." />
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-amber-500/70 transition-transform duration-200 ${
                  isPinnedSectionCollapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
            </button>

            {!isPinnedSectionCollapsed && (
              <div className="space-y-1 pt-0.5">
                {pinnedNavItems.map((item) => renderNavItem(item, true, false))}
              </div>
            )}
          </div>
        )}

        {/* Pinned Items Quick Access (Compact Mode) */}
        {isCompact && pinnedNavItems.length > 0 && (
          <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800">
            {pinnedNavItems.map((item) => renderNavItem(item, true, true))}
          </div>
        )}


        {/* Navigation Sections / Modules */}
        {navSectionsToDisplay.map((section, secIdx) => {
          const filteredItems = section.items.filter((item) => {
            if (!sidebarSearch.trim()) return true;
            if (item.title.toLowerCase().includes(sidebarSearch.toLowerCase())) return true;
            if (item.subItems?.some((sub) => sub.label.toLowerCase().includes(sidebarSearch.toLowerCase()))) return true;
            return false;
          });

          if (filteredItems.length === 0) return null;

          const hasActiveRoute = isSectionActive(section);
          const isCollapsed = !isSearching && !!collapsedSections[section.sectionTitle];

          return (
            <div key={secIdx} className="space-y-1">
              {!isCompact && (
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse(section.sectionTitle)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer select-none group/sec ${
                    hasActiveRoute && isCollapsed
                      ? "bg-brand-50/80 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80 shadow-2xs font-extrabold"
                      : "text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                  }`}
                  title={isCollapsed ? `Expand ${section.sectionTitle}` : `Collapse ${section.sectionTitle}`}
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{section.sectionTitle}</span>
                    {hasActiveRoute && isCollapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shrink-0" title="Active page inside" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 group-hover/sec:text-slate-600 dark:group-hover/sec:text-slate-300 shrink-0">
                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      {filteredItems.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90 text-slate-400" : "rotate-0 text-slate-500"
                      }`}
                    />
                  </div>
                </button>
              )}

              {/* Items in Module */}
              {(!isCollapsed || isCompact) && (
                <div className="space-y-1 pt-0.5 animate-in fade-in duration-150">
                  {filteredItems.map((item) => renderNavItem(item, false, isCompact))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Contact & Support Footer (WhatsApp & Email) */}
      <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800/80 shrink-0 bg-white dark:bg-slate-900">
        {isCompact ? (
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            <a
              href="https://wa.me/919874940555"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700/70 flex items-center justify-center transition-colors cursor-pointer"
              title="WhatsApp: +91 98749 40555"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
            </a>
            <a
              href="mailto:info@kvtmedia.com"
              className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700/70 flex items-center justify-center transition-colors cursor-pointer"
              title="Email: info@kvtmedia.com"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 py-0.5">
            {/* WhatsApp Link */}
            <a
              href="https://wa.me/919874940555"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors group cursor-pointer"
              title="Chat on WhatsApp (+91 98749 40555)"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold font-mono truncate leading-tight">
                +91 7980073673
              </span>
            </a>

            {/* Email Link */}
            <a
              href="mailto:info@kvtmedia.com"
              className="flex items-center gap-2 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 transition-colors group cursor-pointer"
              title="Send Support Email (info@kvtmedia.com)"
            >
              <Mail className="w-3.5 h-3.5 text-brand-500 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium truncate leading-tight">
                mukund@kvtmedia.com
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on screens < 1024px) */}
      <aside
        suppressHydrationWarning
        className={`hidden lg:flex bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col h-screen sticky top-0 shrink-0 select-none z-30 shadow-xs transition-all duration-300 ease-in-out ${
          isSidebarPinned ? "w-64" : "w-[72px]"
        }`}
      >
        {renderSidebarContent(!isSidebarPinned)}
      </aside>

      {/* Mobile Drawer (visible when isMobileOpen is true) */}
      {isMobileOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] lg:hidden bg-slate-950/70 backdrop-blur-xs flex justify-start outline-none animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onCloseMobile} />
            <div className="relative z-10 w-72 bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-300 outline-none">
              {renderSidebarContent(false)}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
