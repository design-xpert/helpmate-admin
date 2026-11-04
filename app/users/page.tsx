"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { initialUsers, UserManagementItem, UserPermissions, ModulePermission } from "@/lib/mockData";
import { useRbac } from "@/context/RbacContext";
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Lock,
  Edit,
  Trash2,
  X,
  Eye,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  CalendarCheck,
  Wrench,
  Users,
  UserCheck as TechIcon,
  CreditCard,
  BarChart3,
  KeyRound,
  Tag,
  Star,
  FileImage,
  FileText,
  DollarSign,
  Building2,
  Sliders,
  TrendingUp,
  Search,
  Layers,
  AlertCircle,
  FolderPlus,
  UserPlus,
  BadgeCheck,
  RefreshCw,
  SlidersHorizontal,
  Key,
  Check,
  Shield,
  Gift,
  Bell,
  HelpCircle,
  Image as ImageIcon,
  Wallet,
  Receipt,
  Headphones,
  Settings,
  History,
  Sparkles,
  Send,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { PermissionGuard } from "@/components/PermissionGuard";
import { StatusDropdown } from "@/components/StatusDropdown";
import {
  getRolesApi,
  createRoleApi,
  updateRoleApi,
  getPermissionsApi,
  createPermissionApi,
  updatePermissionApi,
  deletePermissionApi,
  getAdminsApi,
  createAdminApi,
  updateAdminApi,
  deleteAdminApi,
} from "@/lib/api";
import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";

type ModuleKey =
  | "bookings" | "inspections" | "customers" | "technicians"
  | "categories" | "cms" | "pricing" | "locations"
  | "payments" | "billing" | "commission" | "coupons"
  | "reviews" | "media" | "analytics" | "reports" | "rbac"
  | "leads" | "settlements" | "wallets" | "membership"
  | "banners" | "imageSections" | "faq" | "support"
  | "notifications" | "activityLog" | "settings";

const modulesList: { key: ModuleKey; label: string; icon: any; desc: string; defaultSampleId: string }[] = [
  { key: "bookings",      label: "Bookings & Jobs",          icon: CalendarCheck, desc: "Manage customer requests, live job assignments & schedules", defaultSampleId: "6aba0c2c6110aa2c74212449" },
  { key: "inspections",   label: "Inspections",               icon: Search,        desc: "On-site service inspections and quality verification",      defaultSampleId: "6aba0c2d6110aa2c7421244d" },
  { key: "leads",         label: "Lead Inquiries",           icon: UserCheck,     desc: "Customer inquiries, enterprise leads & quote requests",      defaultSampleId: "6aba0c316110aa2c74212470" },
  { key: "customers",     label: "Customers CRM",            icon: Users,         desc: "Access client profiles & customer CRM directory",             defaultSampleId: "6aba0c2d6110aa2c74212451" },
  { key: "technicians",   label: "Partner & KYC",            icon: TechIcon,      desc: "Onboard technicians, verify Aadhaar & police clearance",    defaultSampleId: "6aba0c2d6110aa2c74212456" },
  { key: "categories",    label: "Category Catalog",         icon: Sliders,       desc: "Manage service categories and sub-categories",                defaultSampleId: "6aba0c2e6110aa2c7421245a" },
  { key: "cms",           label: "Services CMS",              icon: Wrench,        desc: "Configure service listings, descriptions & media",           defaultSampleId: "6aba0c2e6110aa2c7421245e" },
  { key: "pricing",       label: "Pricing Engine",            icon: Tag,           desc: "Set base prices, add-ons and rate cards",                     defaultSampleId: "6aba0c2e6110aa2c74212462" },
  { key: "membership",    label: "Membership & VIP Club",     icon: Sparkles,      desc: "Manage VIP subscription tiers, benefits and members",        defaultSampleId: "6aba0c376110aa2c74212488" },
  { key: "banners",       label: "Marketing Banners",        icon: ImageIcon,     desc: "Manage promotional carousel banners on customer apps",       defaultSampleId: "6aba0c386110aa2c7421248c" },
  { key: "imageSections", label: "App Section Images",       icon: FileImage,     desc: "Configure section banners and home page visuals",            defaultSampleId: "6aba0c396110aa2c74212490" },
  { key: "faq",           label: "FAQ & Help Center",        icon: HelpCircle,    desc: "Create and publish help articles and customer FAQs",         defaultSampleId: "6aba0c3a6110aa2c74212494" },
  { key: "locations",     label: "Locations & Pincodes",     icon: Building2,     desc: "Manage serviceable areas and pincode zones",                 defaultSampleId: "6aba0c2f6110aa2c74212466" },
  { key: "media",         label: "Media Library",            icon: FileImage,     desc: "Upload and manage service images and assets",                 defaultSampleId: "6aba0c3d6110aa2c742124a0" },
  { key: "payments",      label: "Payments",                 icon: CreditCard,    desc: "Track UPI, card and cash payment transactions",               defaultSampleId: "6aba0c326110aa2c74212474" },
  { key: "billing",       label: "Billing & GST",            icon: FileText,      desc: "Generate GST invoices, process refunds & receipts",          defaultSampleId: "6aba0c336110aa2c74212478" },
  { key: "settlements",   label: "Partner Settlements",      icon: Receipt,       desc: "Commission payouts, partner disbursements & statements",     defaultSampleId: "6aba0c346110aa2c7421247c" },
  { key: "commission",    label: "Commission Engine",        icon: DollarSign,    desc: "Platform commission rules & weekly payouts engine",           defaultSampleId: "6aba0c2e6110aa2c74212462" },
  { key: "wallets",       label: "Wallets & Balances",       icon: Wallet,        desc: "Partner and customer wallet balances & credit logs",          defaultSampleId: "6aba0c356110aa2c74212480" },
  { key: "coupons",       label: "Coupons & Offers",         icon: Gift,          desc: "Discount codes, bank offers and promo campaigns",             defaultSampleId: "6aba0c366110aa2c74212484" },
  { key: "reviews",       label: "Customer Reviews",         icon: Star,          desc: "Moderate ratings and quality feedback",                       defaultSampleId: "6aba0c3b6110aa2c74212498" },
  { key: "support",       label: "Customer Support",         icon: Headphones,    desc: "Helpdesk support tickets & user issue resolution",           defaultSampleId: "6aba0c3c6110aa2c7421249c" },
  { key: "notifications", label: "Push Notifications",       icon: Bell,          desc: "Send targeted push alerts and broadcast messages",           defaultSampleId: "6aba0c3e6110aa2c742124a4" },
  { key: "activityLog",   label: "Audit Logs & Security",    icon: History,       desc: "System security logs and administrative action history",      defaultSampleId: "6aba0c3f6110aa2c742124a8" },
  { key: "analytics",     label: "Executive Analytics",      icon: TrendingUp,    desc: "Real-time dashboards and KPI tracking",                       defaultSampleId: "6aba0c416110aa2c742124b0" },
  { key: "reports",       label: "Reports & Exports",        icon: BarChart3,     desc: "Export financial statements & audit logs",                    defaultSampleId: "6aba0c406110aa2c742124ac" },
  { key: "settings",      label: "Platform Settings",        icon: Settings,      desc: "Global system configuration, policies & parameters",          defaultSampleId: "6aba0c426110aa2c742124b4" },
  { key: "rbac",          label: "User Management & RBAC",   icon: KeyRound,      desc: "Manage admin accounts and permission matrix",                 defaultSampleId: "6aba4bbe6110aa2c74213e5e" },
];

const off: ModulePermission = { view: false, create: false, edit: false, delete: false };
const full: ModulePermission = { view: true, create: true, edit: true, delete: true };

const defaultFullPermissions: UserPermissions = {
  bookings: full, inspections: full, customers: full, technicians: full,
  categories: full, cms: full, pricing: full, locations: full,
  payments: full, billing: full, commission: full, coupons: full,
  reviews: full, media: full, analytics: full, reports: full, rbac: full,
  leads: full, settlements: full, wallets: full, membership: full,
  banners: full, imageSections: full, faq: full, support: full,
  notifications: full, activityLog: full, settings: full,
  canAssignJobs: true, canEditServices: true, canProcessRefunds: true,
  canManageFleet: true, canExportReports: true, canManageRbac: true, canViewAuditLogs: true,
};

const opsCoordinatorPermissions: UserPermissions = {
  bookings: { view: true, create: true, edit: true, delete: false },
  inspections: { view: true, create: false, edit: false, delete: false },
  customers: { view: true, create: false, edit: true, delete: false },
  technicians: { view: true, create: false, edit: true, delete: false },
  categories: off, cms: off, pricing: off,
  locations: { view: true, create: false, edit: false, delete: false },
  payments: off, billing: off, commission: off, coupons: off,
  reviews: { view: true, create: false, edit: false, delete: false },
  media: off, analytics: off, reports: off, rbac: off,
  leads: { view: true, create: true, edit: true, delete: false },
  settlements: off, wallets: off, membership: off,
  banners: off, imageSections: off, faq: { view: true, create: false, edit: false, delete: false },
  support: { view: true, create: true, edit: true, delete: false },
  notifications: { view: true, create: false, edit: false, delete: false },
  activityLog: { view: true, create: false, edit: false, delete: false },
  settings: off,
  canAssignJobs: true, canEditServices: false, canProcessRefunds: false,
  canManageFleet: true, canExportReports: false, canManageRbac: false, canViewAuditLogs: true,
};

interface PermissionItem {
  _id: string;
  id: string;
  name: string;
  code: string;
  module: string;
  action: "view" | "create" | "edit" | "delete";
  status: "active" | "inactive";
}

interface ModulePermissionGroup {
  id: string;
  module: string;
  actions: PermissionItem[];
}

interface SystemRole {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  description: string;
  permissions?: any;
  permissionsObjects?: any[];
  permissionIds: string[];
  userCount?: number;
  status?: string;
  color?: string;
}

interface RoleAssignedAction {
  action: string;
  code: string;
  name: string;
  status: string;
  _id: string;
}

interface RoleAssignedModule {
  module: string;
  actions: RoleAssignedAction[];
  status: string;
}

// Complete 29 System Modules across the HelpmateAdmin Platform
const MODULE_OPTIONS = [
  { value: "USER_MANAGEMENT", label: "USER_MANAGEMENT — User Management & RBAC" },
  { value: "ADMIN", label: "ADMIN — Administrators & Staff" },
  { value: "ANALYTICS", label: "ANALYTICS — Executive Analytics & Dashboards" },
  { value: "BANNER", label: "BANNER — Marketing Banners & Carousels" },
  { value: "BILLING", label: "BILLING — Billing, GST & Invoices" },
  { value: "BOOKING", label: "BOOKING — Customer Service Bookings" },
  { value: "CATEGORY", label: "CATEGORY — Service Catalog & Categories" },
  { value: "COUPON", label: "COUPON — Discount Codes & Offers" },
  { value: "CUSTOMER", label: "CUSTOMER — End User Profiles & CRM" },
  { value: "FAQ", label: "FAQ — Help Center & FAQ Articles" },
  { value: "IMAGE_SECTION", label: "IMAGE_SECTION — App Section Images & Visuals" },
  { value: "INSPECTION", label: "INSPECTION — Technician Quality Audits" },
  { value: "LEAD", label: "LEAD — Customer Leads & Inquiries" },
  { value: "LOCATION", label: "LOCATION — Cities, Zones & Pincodes" },
  { value: "MEDIA", label: "MEDIA — Media Library & Storage Assets" },
  { value: "MEMBERSHIP", label: "MEMBERSHIP — VIP Membership & Subscriptions" },
  { value: "NOTIFICATION", label: "NOTIFICATION — Push Notifications & Alerts" },
  { value: "PARTNER", label: "PARTNER — Technician Service Providers" },
  { value: "PAYMENT", label: "PAYMENT — Online Payments & Transactions" },
  { value: "PERMISSION", label: "PERMISSION — System RBAC Permissions" },
  { value: "PRICING", label: "PRICING — Dynamic Pricing Engine" },
  { value: "REPORT", label: "REPORT — Reports & Audit Data Exports" },
  { value: "REVIEW", label: "REVIEW — Customer Ratings & Reviews" },
  { value: "ROLE", label: "ROLE — Role Matrix Configurations" },
  { value: "SERVICE", label: "SERVICE — Service Packages & CMS" },
  { value: "SETTINGS", label: "SETTINGS — Platform Settings & Policies" },
  { value: "SETTLEMENT", label: "SETTLEMENT — Partner Settlements & Payouts" },
  { value: "SUPPORT", label: "SUPPORT — Helpdesk & Customer Tickets" },
  { value: "WALLET", label: "WALLET — Wallets & Credit Balances" },
  { value: "ACTIVITY_LOG", label: "ACTIVITY_LOG — Audit Logs & Security History" },
];

// Complete 116 Permissions Registry across all 29 System Modules (4 Granular Actions each: create, delete, edit, view)
const DEFAULT_SYSTEM_PERMISSIONS: PermissionItem[] = [
  // 0. USER_MANAGEMENT
  { _id: "6aeadbcd253953e31997be28", id: "6aeadbcd253953e31997be28", name: "View User Management", code: "USER_MANAGEMENT_VIEW", module: "USER_MANAGEMENT", action: "view", status: "active" },
  { _id: "6aeadbcd253953e31997be29", id: "6aeadbcd253953e31997be29", name: "Create User Management", code: "USER_MANAGEMENT_CREATE", module: "USER_MANAGEMENT", action: "create", status: "active" },
  { _id: "6aeadbcd253953e31997be2a", id: "6aeadbcd253953e31997be2a", name: "Edit User Management", code: "USER_MANAGEMENT_EDIT", module: "USER_MANAGEMENT", action: "edit", status: "active" },
  { _id: "6aeadbcd253953e31997be2b", id: "6aeadbcd253953e31997be2b", name: "Delete User Management", code: "USER_MANAGEMENT_DELETE", module: "USER_MANAGEMENT", action: "delete", status: "active" },

  // 1. ADMIN (Preserved Original IDs)
  { _id: "6aba4bbf6110aa2c74213e63", id: "6aba4bbf6110aa2c74213e63", name: "Create Admins", code: "ADMIN_CREATE", module: "ADMIN", action: "create", status: "active" },
  { _id: "6aba4bbf6110aa2c74213e65", id: "6aba4bbf6110aa2c74213e65", name: "Delete Admins", code: "ADMIN_DELETE", module: "ADMIN", action: "delete", status: "active" },
  { _id: "6aba4bbf6110aa2c74213e64", id: "6aba4bbf6110aa2c74213e64", name: "Edit Admins", code: "ADMIN_EDIT", module: "ADMIN", action: "edit", status: "active" },
  { _id: "6aba4bbf6110aa2c74213e62", id: "6aba4bbf6110aa2c74213e62", name: "View Admins", code: "ADMIN_VIEW", module: "ADMIN", action: "view", status: "active" },

  // 2. ANALYTICS
  { _id: "6aba0c416110aa2c742124b1", id: "6aba0c416110aa2c742124b1", name: "Create Analytics Dashboards", code: "ANALYTICS_CREATE", module: "ANALYTICS", action: "create", status: "active" },
  { _id: "6aba0c416110aa2c742124b3", id: "6aba0c416110aa2c742124b3", name: "Delete Analytics Dashboards", code: "ANALYTICS_DELETE", module: "ANALYTICS", action: "delete", status: "active" },
  { _id: "6aba0c416110aa2c742124b2", id: "6aba0c416110aa2c742124b2", name: "Edit Analytics Dashboards", code: "ANALYTICS_EDIT", module: "ANALYTICS", action: "edit", status: "active" },
  { _id: "6aba0c416110aa2c742124b0", id: "6aba0c416110aa2c742124b0", name: "View Analytics Dashboards", code: "ANALYTICS_VIEW", module: "ANALYTICS", action: "view", status: "active" },

  // 3. BANNER
  { _id: "6aba0c386110aa2c7421248d", id: "6aba0c386110aa2c7421248d", name: "Create Banners", code: "BANNER_CREATE", module: "BANNER", action: "create", status: "active" },
  { _id: "6aba0c386110aa2c7421248f", id: "6aba0c386110aa2c7421248f", name: "Delete Banners", code: "BANNER_DELETE", module: "BANNER", action: "delete", status: "active" },
  { _id: "6aba0c386110aa2c7421248e", id: "6aba0c386110aa2c7421248e", name: "Edit Banners", code: "BANNER_EDIT", module: "BANNER", action: "edit", status: "active" },
  { _id: "6aba0c386110aa2c7421248c", id: "6aba0c386110aa2c7421248c", name: "View Banners", code: "BANNER_VIEW", module: "BANNER", action: "view", status: "active" },

  // 4. BILLING
  { _id: "6aba0c336110aa2c74212479", id: "6aba0c336110aa2c74212479", name: "Create Billing & Invoices", code: "BILLING_CREATE", module: "BILLING", action: "create", status: "active" },
  { _id: "6aba0c336110aa2c7421247b", id: "6aba0c336110aa2c7421247b", name: "Delete Billing & Invoices", code: "BILLING_DELETE", module: "BILLING", action: "delete", status: "active" },
  { _id: "6aba0c336110aa2c7421247a", id: "6aba0c336110aa2c7421247a", name: "Edit Billing & Invoices", code: "BILLING_EDIT", module: "BILLING", action: "edit", status: "active" },
  { _id: "6aba0c336110aa2c74212478", id: "6aba0c336110aa2c74212478", name: "View Billing & Invoices", code: "BILLING_VIEW", module: "BILLING", action: "view", status: "active" },

  // 5. BOOKING (Preserved Original IDs)
  { _id: "6aba0c2c6110aa2c7421244a", id: "6aba0c2c6110aa2c7421244a", name: "Create Bookings", code: "BOOKING_CREATE", module: "BOOKING", action: "create", status: "active" },
  { _id: "6aba0c2c6110aa2c7421244c", id: "6aba0c2c6110aa2c7421244c", name: "Delete Bookings", code: "BOOKING_DELETE", module: "BOOKING", action: "delete", status: "active" },
  { _id: "6aba0c2c6110aa2c7421244b", id: "6aba0c2c6110aa2c7421244b", name: "Edit Bookings", code: "BOOKING_EDIT", module: "BOOKING", action: "edit", status: "active" },
  { _id: "6aba0c2c6110aa2c74212449", id: "6aba0c2c6110aa2c74212449", name: "View Bookings", code: "BOOKING_VIEW", module: "BOOKING", action: "view", status: "active" },

  // 6. CATEGORY (Preserved Original IDs)
  { _id: "6aba0c2e6110aa2c7421245b", id: "6aba0c2e6110aa2c7421245b", name: "Create Category Catalog", code: "CATEGORY_CREATE", module: "CATEGORY", action: "create", status: "active" },
  { _id: "6aba0c2e6110aa2c7421245d", id: "6aba0c2e6110aa2c7421245d", name: "Delete Category Catalog", code: "CATEGORY_DELETE", module: "CATEGORY", action: "delete", status: "active" },
  { _id: "6aba0c2e6110aa2c7421245c", id: "6aba0c2e6110aa2c7421245c", name: "Edit Category Catalog", code: "CATEGORY_EDIT", module: "CATEGORY", action: "edit", status: "active" },
  { _id: "6aba0c2e6110aa2c7421245a", id: "6aba0c2e6110aa2c7421245a", name: "View Category Catalog", code: "CATEGORY_VIEW", module: "CATEGORY", action: "view", status: "active" },

  // 7. COUPON
  { _id: "6aba0c366110aa2c74212485", id: "6aba0c366110aa2c74212485", name: "Create Coupons & Offers", code: "COUPON_CREATE", module: "COUPON", action: "create", status: "active" },
  { _id: "6aba0c366110aa2c74212487", id: "6aba0c366110aa2c74212487", name: "Delete Coupons & Offers", code: "COUPON_DELETE", module: "COUPON", action: "delete", status: "active" },
  { _id: "6aba0c366110aa2c74212486", id: "6aba0c366110aa2c74212486", name: "Edit Coupons & Offers", code: "COUPON_EDIT", module: "COUPON", action: "edit", status: "active" },
  { _id: "6aba0c366110aa2c74212484", id: "6aba0c366110aa2c74212484", name: "View Coupons & Offers", code: "COUPON_VIEW", module: "COUPON", action: "view", status: "active" },

  // 8. CUSTOMER (Preserved Original IDs)
  { _id: "6aba0c2d6110aa2c74212452", id: "6aba0c2d6110aa2c74212452", name: "Create Customers", code: "CUSTOMER_CREATE", module: "CUSTOMER", action: "create", status: "active" },
  { _id: "6aba0c2d6110aa2c74212454", id: "6aba0c2d6110aa2c74212454", name: "Delete Customers", code: "CUSTOMER_DELETE", module: "CUSTOMER", action: "delete", status: "active" },
  { _id: "6aba0c2d6110aa2c74212453", id: "6aba0c2d6110aa2c74212453", name: "Edit Customers", code: "CUSTOMER_EDIT", module: "CUSTOMER", action: "edit", status: "active" },
  { _id: "6aba0c2d6110aa2c74212451", id: "6aba0c2d6110aa2c74212451", name: "View Customers", code: "CUSTOMER_VIEW", module: "CUSTOMER", action: "view", status: "active" },

  // 9. FAQ
  { _id: "6aba0c3a6110aa2c74212495", id: "6aba0c3a6110aa2c74212495", name: "Create FAQs", code: "FAQ_CREATE", module: "FAQ", action: "create", status: "active" },
  { _id: "6aba0c3a6110aa2c74212497", id: "6aba0c3a6110aa2c74212497", name: "Delete FAQs", code: "FAQ_DELETE", module: "FAQ", action: "delete", status: "active" },
  { _id: "6aba0c3a6110aa2c74212496", id: "6aba0c3a6110aa2c74212496", name: "Edit FAQs", code: "FAQ_EDIT", module: "FAQ", action: "edit", status: "active" },
  { _id: "6aba0c3a6110aa2c74212494", id: "6aba0c3a6110aa2c74212494", name: "View FAQs", code: "FAQ_VIEW", module: "FAQ", action: "view", status: "active" },

  // 10. IMAGE_SECTION
  { _id: "6aba0c396110aa2c74212491", id: "6aba0c396110aa2c74212491", name: "Create App Section Images", code: "IMAGE_SECTION_CREATE", module: "IMAGE_SECTION", action: "create", status: "active" },
  { _id: "6aba0c396110aa2c74212493", id: "6aba0c396110aa2c74212493", name: "Delete App Section Images", code: "IMAGE_SECTION_DELETE", module: "IMAGE_SECTION", action: "delete", status: "active" },
  { _id: "6aba0c396110aa2c74212492", id: "6aba0c396110aa2c74212492", name: "Edit App Section Images", code: "IMAGE_SECTION_EDIT", module: "IMAGE_SECTION", action: "edit", status: "active" },
  { _id: "6aba0c396110aa2c74212490", id: "6aba0c396110aa2c74212490", name: "View App Section Images", code: "IMAGE_SECTION_VIEW", module: "IMAGE_SECTION", action: "view", status: "active" },

  // 11. INSPECTION (Preserved Original IDs)
  { _id: "6aba0c2d6110aa2c7421244e", id: "6aba0c2d6110aa2c7421244e", name: "Create Inspections", code: "INSPECTION_CREATE", module: "INSPECTION", action: "create", status: "active" },
  { _id: "6aba0c2d6110aa2c74212450", id: "6aba0c2d6110aa2c74212450", name: "Delete Inspections", code: "INSPECTION_DELETE", module: "INSPECTION", action: "delete", status: "active" },
  { _id: "6aba0c2d6110aa2c7421244f", id: "6aba0c2d6110aa2c7421244f", name: "Edit Inspections", code: "INSPECTION_EDIT", module: "INSPECTION", action: "edit", status: "active" },
  { _id: "6aba0c2d6110aa2c7421244d", id: "6aba0c2d6110aa2c7421244d", name: "View Inspections", code: "INSPECTION_VIEW", module: "INSPECTION", action: "view", status: "active" },

  // 12. LEAD
  { _id: "6aba0c316110aa2c74212471", id: "6aba0c316110aa2c74212471", name: "Create Leads", code: "LEAD_CREATE", module: "LEAD", action: "create", status: "active" },
  { _id: "6aba0c316110aa2c74212473", id: "6aba0c316110aa2c74212473", name: "Delete Leads", code: "LEAD_DELETE", module: "LEAD", action: "delete", status: "active" },
  { _id: "6aba0c316110aa2c74212472", id: "6aba0c316110aa2c74212472", name: "Edit Leads", code: "LEAD_EDIT", module: "LEAD", action: "edit", status: "active" },
  { _id: "6aba0c316110aa2c74212470", id: "6aba0c316110aa2c74212470", name: "View Leads", code: "LEAD_VIEW", module: "LEAD", action: "view", status: "active" },

  // 13. LOCATION (Preserved Original IDs)
  { _id: "6aba0c2f6110aa2c74212467", id: "6aba0c2f6110aa2c74212467", name: "Create Locations & Pincodes", code: "LOCATION_CREATE", module: "LOCATION", action: "create", status: "active" },
  { _id: "6aba0c2f6110aa2c74212469", id: "6aba0c2f6110aa2c74212469", name: "Delete Locations & Pincodes", code: "LOCATION_DELETE", module: "LOCATION", action: "delete", status: "active" },
  { _id: "6aba0c2f6110aa2c74212468", id: "6aba0c2f6110aa2c74212468", name: "Edit Locations & Pincodes", code: "LOCATION_EDIT", module: "LOCATION", action: "edit", status: "active" },
  { _id: "6aba0c2f6110aa2c74212466", id: "6aba0c2f6110aa2c74212466", name: "View Locations & Pincodes", code: "LOCATION_VIEW", module: "LOCATION", action: "view", status: "active" },

  // 14. MEDIA
  { _id: "6aba0c3d6110aa2c742124a1", id: "6aba0c3d6110aa2c742124a1", name: "Create Media Library", code: "MEDIA_CREATE", module: "MEDIA", action: "create", status: "active" },
  { _id: "6aba0c3d6110aa2c742124a3", id: "6aba0c3d6110aa2c742124a3", name: "Delete Media Library", code: "MEDIA_DELETE", module: "MEDIA", action: "delete", status: "active" },
  { _id: "6aba0c3d6110aa2c742124a2", id: "6aba0c3d6110aa2c742124a2", name: "Edit Media Library", code: "MEDIA_EDIT", module: "MEDIA", action: "edit", status: "active" },
  { _id: "6aba0c3d6110aa2c742124a0", id: "6aba0c3d6110aa2c742124a0", name: "View Media Library", code: "MEDIA_VIEW", module: "MEDIA", action: "view", status: "active" },

  // 15. MEMBERSHIP
  { _id: "6aba0c376110aa2c74212489", id: "6aba0c376110aa2c74212489", name: "Create Memberships", code: "MEMBERSHIP_CREATE", module: "MEMBERSHIP", action: "create", status: "active" },
  { _id: "6aba0c376110aa2c7421248b", id: "6aba0c376110aa2c7421248b", name: "Delete Memberships", code: "MEMBERSHIP_DELETE", module: "MEMBERSHIP", action: "delete", status: "active" },
  { _id: "6aba0c376110aa2c7421248a", id: "6aba0c376110aa2c7421248a", name: "Edit Memberships", code: "MEMBERSHIP_EDIT", module: "MEMBERSHIP", action: "edit", status: "active" },
  { _id: "6aba0c376110aa2c74212488", id: "6aba0c376110aa2c74212488", name: "View Memberships", code: "MEMBERSHIP_VIEW", module: "MEMBERSHIP", action: "view", status: "active" },

  // 16. NOTIFICATION
  { _id: "6aba0c3e6110aa2c742124a5", id: "6aba0c3e6110aa2c742124a5", name: "Create Notifications", code: "NOTIFICATION_CREATE", module: "NOTIFICATION", action: "create", status: "active" },
  { _id: "6aba0c3e6110aa2c742124a7", id: "6aba0c3e6110aa2c742124a7", name: "Delete Notifications", code: "NOTIFICATION_DELETE", module: "NOTIFICATION", action: "delete", status: "active" },
  { _id: "6aba0c3e6110aa2c742124a6", id: "6aba0c3e6110aa2c742124a6", name: "Edit Notifications", code: "NOTIFICATION_EDIT", module: "NOTIFICATION", action: "edit", status: "active" },
  { _id: "6aba0c3e6110aa2c742124a4", id: "6aba0c3e6110aa2c742124a4", name: "View Notifications", code: "NOTIFICATION_VIEW", module: "NOTIFICATION", action: "view", status: "active" },

  // 17. PARTNER (Preserved Original IDs)
  { _id: "6aba0c2d6110aa2c74212457", id: "6aba0c2d6110aa2c74212457", name: "Create Partners", code: "PARTNER_CREATE", module: "PARTNER", action: "create", status: "active" },
  { _id: "6aba0c2e6110aa2c74212459", id: "6aba0c2e6110aa2c74212459", name: "Delete Partners", code: "PARTNER_DELETE", module: "PARTNER", action: "delete", status: "active" },
  { _id: "6aba0c2e6110aa2c74212458", id: "6aba0c2e6110aa2c74212458", name: "Edit Partners", code: "PARTNER_EDIT", module: "PARTNER", action: "edit", status: "active" },
  { _id: "6aba0c2d6110aa2c74212456", id: "6aba0c2d6110aa2c74212456", name: "View Partners", code: "PARTNER_VIEW", module: "PARTNER", action: "view", status: "active" },

  // 18. PAYMENT
  { _id: "6aba0c326110aa2c74212475", id: "6aba0c326110aa2c74212475", name: "Create Payments", code: "PAYMENT_CREATE", module: "PAYMENT", action: "create", status: "active" },
  { _id: "6aba0c326110aa2c74212477", id: "6aba0c326110aa2c74212477", name: "Delete Payments", code: "PAYMENT_DELETE", module: "PAYMENT", action: "delete", status: "active" },
  { _id: "6aba0c326110aa2c74212476", id: "6aba0c326110aa2c74212476", name: "Edit Payments", code: "PAYMENT_EDIT", module: "PAYMENT", action: "edit", status: "active" },
  { _id: "6aba0c326110aa2c74212474", id: "6aba0c326110aa2c74212474", name: "View Payments", code: "PAYMENT_VIEW", module: "PAYMENT", action: "view", status: "active" },

  // 19. PERMISSION (Preserved Original IDs)
  { _id: "6aba4bbe6110aa2c74213e5f", id: "6aba4bbe6110aa2c74213e5f", name: "Create Permissions", code: "PERMISSION_CREATE", module: "PERMISSION", action: "create", status: "active" },
  { _id: "6aba4bbe6110aa2c74213e61", id: "6aba4bbe6110aa2c74213e61", name: "Delete Permissions", code: "PERMISSION_DELETE", module: "PERMISSION", action: "delete", status: "active" },
  { _id: "6aba4bbe6110aa2c74213e60", id: "6aba4bbe6110aa2c74213e60", name: "Edit Permissions", code: "PERMISSION_EDIT", module: "PERMISSION", action: "edit", status: "active" },
  { _id: "6aba4bbe6110aa2c74213e5e", id: "6aba4bbe6110aa2c74213e5e", name: "View Permissions", code: "PERMISSION_VIEW", module: "PERMISSION", action: "view", status: "active" },

  // 20. PRICING (Preserved Original IDs)
  { _id: "6aba0c2e6110aa2c74212463", id: "6aba0c2e6110aa2c74212463", name: "Create Pricing Engine", code: "PRICING_CREATE", module: "PRICING", action: "create", status: "active" },
  { _id: "6aba0c2e6110aa2c74212465", id: "6aba0c2e6110aa2c74212465", name: "Delete Pricing Engine", code: "PRICING_DELETE", module: "PRICING", action: "delete", status: "active" },
  { _id: "6aba0c2e6110aa2c74212464", id: "6aba0c2e6110aa2c74212464", name: "Edit Pricing Engine", code: "PRICING_EDIT", module: "PRICING", action: "edit", status: "active" },
  { _id: "6aba0c2e6110aa2c74212462", id: "6aba0c2e6110aa2c74212462", name: "View Pricing Engine", code: "PRICING_VIEW", module: "PRICING", action: "view", status: "active" },

  // 21. REPORT
  { _id: "6aba0c406110aa2c742124ad", id: "6aba0c406110aa2c742124ad", name: "Create Reports & Exports", code: "REPORT_CREATE", module: "REPORT", action: "create", status: "active" },
  { _id: "6aba0c406110aa2c742124af", id: "6aba0c406110aa2c742124af", name: "Delete Reports & Exports", code: "REPORT_DELETE", module: "REPORT", action: "delete", status: "active" },
  { _id: "6aba0c406110aa2c742124ae", id: "6aba0c406110aa2c742124ae", name: "Edit Reports & Exports", code: "REPORT_EDIT", module: "REPORT", action: "edit", status: "active" },
  { _id: "6aba0c406110aa2c742124ac", id: "6aba0c406110aa2c742124ac", name: "View Reports & Exports", code: "REPORT_VIEW", module: "REPORT", action: "view", status: "active" },

  // 22. REVIEW
  { _id: "6aba0c3b6110aa2c74212499", id: "6aba0c3b6110aa2c74212499", name: "Create Reviews", code: "REVIEW_CREATE", module: "REVIEW", action: "create", status: "active" },
  { _id: "6aba0c3b6110aa2c7421249b", id: "6aba0c3b6110aa2c7421249b", name: "Delete Reviews", code: "REVIEW_DELETE", module: "REVIEW", action: "delete", status: "active" },
  { _id: "6aba0c3b6110aa2c7421249a", id: "6aba0c3b6110aa2c7421249a", name: "Edit Reviews", code: "REVIEW_EDIT", module: "REVIEW", action: "edit", status: "active" },
  { _id: "6aba0c3b6110aa2c74212498", id: "6aba0c3b6110aa2c74212498", name: "View Reviews", code: "REVIEW_VIEW", module: "REVIEW", action: "view", status: "active" },

  // 23. ROLE (Preserved Original IDs)
  { _id: "6aba4bbe6110aa2c74213e5b", id: "6aba4bbe6110aa2c74213e5b", name: "Create Roles", code: "ROLE_CREATE", module: "ROLE", action: "create", status: "active" },
  { _id: "6aba4bbe6110aa2c74213e5d", id: "6aba4bbe6110aa2c74213e5d", name: "Delete Roles", code: "ROLE_DELETE", module: "ROLE", action: "delete", status: "active" },
  { _id: "6aba4bbe6110aa2c74213e5c", id: "6aba4bbe6110aa2c74213e5c", name: "Edit Roles", code: "ROLE_EDIT", module: "ROLE", action: "edit", status: "active" },
  { _id: "6aba4bbe6110aa2c74213e5a", id: "6aba4bbe6110aa2c74213e5a", name: "View Roles", code: "ROLE_VIEW", module: "ROLE", action: "view", status: "active" },

  // 24. SERVICE (Preserved Original IDs)
  { _id: "6aba0c2e6110aa2c7421245f", id: "6aba0c2e6110aa2c7421245f", name: "Create Services CMS", code: "SERVICE_CREATE", module: "SERVICE", action: "create", status: "active" },
  { _id: "6aba0c2e6110aa2c74212461", id: "6aba0c2e6110aa2c74212461", name: "Delete Services CMS", code: "SERVICE_DELETE", module: "SERVICE", action: "delete", status: "active" },
  { _id: "6aba0c2e6110aa2c74212460", id: "6aba0c2e6110aa2c74212460", name: "Edit Services CMS", code: "SERVICE_EDIT", module: "SERVICE", action: "edit", status: "active" },
  { _id: "6aba0c2e6110aa2c7421245e", id: "6aba0c2e6110aa2c7421245e", name: "View Services CMS", code: "SERVICE_VIEW", module: "SERVICE", action: "view", status: "active" },

  // 25. SETTINGS
  { _id: "6aba0c426110aa2c742124b5", id: "6aba0c426110aa2c742124b5", name: "Create Platform Settings", code: "SETTINGS_CREATE", module: "SETTINGS", action: "create", status: "active" },
  { _id: "6aba0c426110aa2c742124b7", id: "6aba0c426110aa2c742124b7", name: "Delete Platform Settings", code: "SETTINGS_DELETE", module: "SETTINGS", action: "delete", status: "active" },
  { _id: "6aba0c426110aa2c742124b6", id: "6aba0c426110aa2c742124b6", name: "Edit Platform Settings", code: "SETTINGS_EDIT", module: "SETTINGS", action: "edit", status: "active" },
  { _id: "6aba0c426110aa2c742124b4", id: "6aba0c426110aa2c742124b4", name: "View Platform Settings", code: "SETTINGS_VIEW", module: "SETTINGS", action: "view", status: "active" },

  // 26. SETTLEMENT
  { _id: "6aba0c346110aa2c7421247d", id: "6aba0c346110aa2c7421247d", name: "Create Partner Settlements", code: "SETTLEMENT_CREATE", module: "SETTLEMENT", action: "create", status: "active" },
  { _id: "6aba0c346110aa2c7421247f", id: "6aba0c346110aa2c7421247f", name: "Delete Partner Settlements", code: "SETTLEMENT_DELETE", module: "SETTLEMENT", action: "delete", status: "active" },
  { _id: "6aba0c346110aa2c7421247e", id: "6aba0c346110aa2c7421247e", name: "Edit Partner Settlements", code: "SETTLEMENT_EDIT", module: "SETTLEMENT", action: "edit", status: "active" },
  { _id: "6aba0c346110aa2c7421247c", id: "6aba0c346110aa2c7421247c", name: "View Partner Settlements", code: "SETTLEMENT_VIEW", module: "SETTLEMENT", action: "view", status: "active" },

  // 27. SUPPORT
  { _id: "6aba0c3c6110aa2c7421249d", id: "6aba0c3c6110aa2c7421249d", name: "Create Support Tickets", code: "SUPPORT_CREATE", module: "SUPPORT", action: "create", status: "active" },
  { _id: "6aba0c3c6110aa2c7421249f", id: "6aba0c3c6110aa2c7421249f", name: "Delete Support Tickets", code: "SUPPORT_DELETE", module: "SUPPORT", action: "delete", status: "active" },
  { _id: "6aba0c3c6110aa2c7421249e", id: "6aba0c3c6110aa2c7421249e", name: "Edit Support Tickets", code: "SUPPORT_EDIT", module: "SUPPORT", action: "edit", status: "active" },
  { _id: "6aba0c3c6110aa2c7421249c", id: "6aba0c3c6110aa2c7421249c", name: "View Support Tickets", code: "SUPPORT_VIEW", module: "SUPPORT", action: "view", status: "active" },

  // 28. WALLET
  { _id: "6aba0c356110aa2c74212481", id: "6aba0c356110aa2c74212481", name: "Create Wallets & Balances", code: "WALLET_CREATE", module: "WALLET", action: "create", status: "active" },
  { _id: "6aba0c356110aa2c74212483", id: "6aba0c356110aa2c74212483", name: "Delete Wallets & Balances", code: "WALLET_DELETE", module: "WALLET", action: "delete", status: "active" },
  { _id: "6aba0c356110aa2c74212482", id: "6aba0c356110aa2c74212482", name: "Edit Wallets & Balances", code: "WALLET_EDIT", module: "WALLET", action: "edit", status: "active" },
  { _id: "6aba0c356110aa2c74212480", id: "6aba0c356110aa2c74212480", name: "View Wallets & Balances", code: "WALLET_VIEW", module: "WALLET", action: "view", status: "active" },

  // 29. ACTIVITY_LOG
  { _id: "6aba0c3f6110aa2c742124a9", id: "6aba0c3f6110aa2c742124a9", name: "Create Audit Logs", code: "ACTIVITY_LOG_CREATE", module: "ACTIVITY_LOG", action: "create", status: "active" },
  { _id: "6aba0c3f6110aa2c742124ab", id: "6aba0c3f6110aa2c742124ab", name: "Delete Audit Logs", code: "ACTIVITY_LOG_DELETE", module: "ACTIVITY_LOG", action: "delete", status: "active" },
  { _id: "6aba0c3f6110aa2c742124aa", id: "6aba0c3f6110aa2c742124aa", name: "Edit Audit Logs", code: "ACTIVITY_LOG_EDIT", module: "ACTIVITY_LOG", action: "edit", status: "active" },
  { _id: "6aba0c3f6110aa2c742124a8", id: "6aba0c3f6110aa2c742124a8", name: "View Audit Logs", code: "ACTIVITY_LOG_VIEW", module: "ACTIVITY_LOG", action: "view", status: "active" },
];

export default function UsersPage() {
  const { canView, canCreate, canEdit, canDelete } = useRbac();
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "permissions">("users");

  const initialCachedUsers = useMemo(() => {
    const data = getStoredModuleData<UserManagementItem[]>("users_admins");
    if (Array.isArray(data)) {
      const real = data.filter((u) => !String(u.id).startsWith("usr-"));
      if (real.length > 0) return real;
    }
    return null;
  }, []);

  const initialCachedRoles = useMemo(() => {
    const data = getStoredModuleData<SystemRole[]>("users_roles");
    if (Array.isArray(data)) {
      const real = data.filter((r) => !String(r.id).startsWith("role-ops") && !String(r.id).startsWith("role-varanasi"));
      if (real.length > 0) return real;
    }
    return null;
  }, []);

  const initialCachedPerms = useMemo(() => {
    return getStoredModuleData<PermissionItem[]>("users_permissions");
  }, []);

  // Loading shimmer state until real API calls complete
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>(() => initialCachedRoles || []);

  // System Permissions Registry
  const [permissionsList, setPermissionsList] = useState<PermissionItem[]>(() => {
    if (initialCachedPerms && initialCachedPerms.length > 0) {
      const cachedCodes = new Set(initialCachedPerms.map((p) => p.code));
      const missing = DEFAULT_SYSTEM_PERMISSIONS.filter((p) => !cachedCodes.has(p.code));
      const combined = missing.length > 0 ? [...initialCachedPerms, ...missing] : initialCachedPerms;
      return combined.filter((p) => (p.module || "").toUpperCase() !== "USER");
    }
    return DEFAULT_SYSTEM_PERMISSIONS.filter((p) => (p.module || "").toUpperCase() !== "USER");
  });

  // Fast memoized lookup map of permissions by ObjectId or Code
  const permissionsByIdMap = useMemo(() => {
    const map = new Map<string, PermissionItem>();
    permissionsList.forEach((p) => {
      if (p._id) map.set(p._id, p);
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [permissionsList]);

  // Resolves assigned modules and actions for any given role
  const getRoleAssignedModules = useCallback(
    (row: SystemRole): RoleAssignedModule[] => {
      const moduleMap: Record<string, RoleAssignedModule> = {};

      let rawPerms: any[] = [];
      if (Array.isArray((row as any).permissionsObjects) && (row as any).permissionsObjects.length > 0) {
        rawPerms = (row as any).permissionsObjects
          .map((p: any) => {
            if (typeof p === "object" && p !== null) return p;
            return permissionsByIdMap.get(String(p));
          })
          .filter(Boolean);
      } else if (Array.isArray(row.permissionIds) && row.permissionIds.length > 0) {
        rawPerms = row.permissionIds
          .map((pid) => permissionsByIdMap.get(String(pid)))
          .filter(Boolean);
      }

      rawPerms.forEach((p: any) => {
        if (!p) return;
        const mod = (p.module || "SYSTEM").toUpperCase();
        if (mod === "USER") return; // Obsolete module replaced by USER_MANAGEMENT

        if (!moduleMap[mod]) {
          moduleMap[mod] = {
            module: mod,
            actions: [],
            status: p.status || "active",
          };
        }

        const actName = (p.action || "view").toLowerCase();
        if (!moduleMap[mod].actions.some((a) => a.action === actName)) {
          moduleMap[mod].actions.push({
            action: actName,
            code: p.code || `${mod}_${actName.toUpperCase()}`,
            name: p.name || `${actName.toUpperCase()} ${mod}`,
            status: p.status || "active",
            _id: String(p._id || p.id || ""),
          });
        }
      });

      return Object.values(moduleMap);
    },
    [permissionsByIdMap]
  );

  // Group permissions by module name for matrix rendering (Strictly USER_MANAGEMENT, no obsolete USER module)
  const groupedPermissions = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    permissionsList.forEach((perm) => {
      const mod = (perm.module || "ADMIN").toUpperCase();
      if (mod === "USER") return; // Obsolete module replaced by USER_MANAGEMENT
      if (!map[mod]) map[mod] = [];
      map[mod].push(perm);
    });
    return map;
  }, [permissionsList]);

  // Unique module groups for UI Table rendering (Module -> Action Type -> Actions)
  const modulePermissionGroups = useMemo<ModulePermissionGroup[]>(() => {
    return Object.entries(groupedPermissions).map(([mod, actions]) => ({
      id: mod,
      module: mod,
      actions,
    }));
  }, [groupedPermissions]);

  // Sliding Drawers
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreatePermissionOpen, setIsCreatePermissionOpen] = useState(false);

  // View Role Modules Sliding Drawer State
  const [viewingRole, setViewingRole] = useState<SystemRole | null>(null);
  const [viewingRoleSearch, setViewingRoleSearch] = useState("");

  // Edit User Drawer State
  const [editUser, setEditUser] = useState<UserManagementItem | null>(null);

  // Edit Role Sliding Drawer States
  const [editRole, setEditRole] = useState<SystemRole | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDesc, setEditRoleDesc] = useState("");
  const [editRolePermissionIds, setEditRolePermissionIds] = useState<string[]>([]);
  const [isUpdatingRoleApi, setIsUpdatingRoleApi] = useState(false);

  // Edit Permission Sliding Drawer States
  const [editPermission, setEditPermission] = useState<PermissionItem | null>(null);
  const [permName, setPermName] = useState("");
  const [permCode, setPermCode] = useState("");
  const [permModule, setPermModule] = useState("ADMIN");
  const [permActions, setPermActions] = useState<("view" | "create" | "edit" | "delete")[]>(["create", "delete", "edit", "view"]);
  const [permStatus, setPermStatus] = useState<"active" | "inactive">("active");

  const [deleteUser, setDeleteUser] = useState<UserManagementItem | null>(null);
  const [deletePermissionItem, setDeletePermissionItem] = useState<PermissionItem | null>(null);
  const [deletePermissionGroup, setDeletePermissionGroup] = useState<ModulePermissionGroup | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add User Form States (Clean & Simple: Name + CustomSelect Role Dropdown)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("12345678");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("Varanasi HQ");
  const [selectedRole, setSelectedRole] = useState<string>("Operations Coordinator");
  const [status, setStatus] = useState<"Active" | "Suspended">("Active");
  const [isAddingUserApi, setIsAddingUserApi] = useState(false);

  // Edit User Password & API State
  const [editUserPassword, setEditUserPassword] = useState("");
  const [isUpdatingUserApi, setIsUpdatingUserApi] = useState(false);

  // Create Role Form States
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedRolePermissionIds, setSelectedRolePermissionIds] = useState<string[]>([
    "6aba0c2d6110aa2c74212456",
    "6aba0c2d6110aa2c74212457",
  ]);
  const [isCreatingRoleApi, setIsCreatingRoleApi] = useState(false);

  // Create Role Permission Selection Helpers
  const togglePermissionIdInCreate = (id: string) => {
    setSelectedRolePermissionIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAllPermissionsInModuleCreate = (modName: string) => {
    const modItems = groupedPermissions[modName] || [];
    const modIds = modItems.map((p) => p._id || p.id);
    const allSelected = modIds.every((id) => selectedRolePermissionIds.includes(id));

    if (allSelected) {
      setSelectedRolePermissionIds((prev) => prev.filter((id) => !modIds.includes(id)));
    } else {
      setSelectedRolePermissionIds((prev) => Array.from(new Set([...prev, ...modIds])));
    }
  };

  const selectAllPermissionsInCreate = () => {
    const allIds = permissionsList.map((p) => p._id || p.id);
    setSelectedRolePermissionIds(allIds);
  };

  const deselectAllPermissionsInCreate = () => {
    setSelectedRolePermissionIds([]);
  };

  // Edit Role Permission Selection Helpers
  const togglePermissionIdInEdit = (id: string) => {
    setEditRolePermissionIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAllPermissionsInModuleEdit = (modName: string) => {
    const modItems = groupedPermissions[modName] || [];
    const modIds = modItems.map((p) => p._id || p.id);
    const allSelected = modIds.every((id) => editRolePermissionIds.includes(id));

    if (allSelected) {
      setEditRolePermissionIds((prev) => prev.filter((id) => !modIds.includes(id)));
    } else {
      setEditRolePermissionIds((prev) => Array.from(new Set([...prev, ...modIds])));
    }
  };

  const selectAllPermissionsInEdit = () => {
    const allIds = permissionsList.map((p) => p._id || p.id);
    setEditRolePermissionIds(allIds);
  };

  const deselectAllPermissionsInEdit = () => {
    setEditRolePermissionIds([]);
  };

  // Fetch Roles, Permissions & Admin Users from Backend APIs
  const fetchAllData = async (force: boolean = false) => {
    setIsLoadingData(true);
    try {
      const [rolesRes, permsRes, adminsRes] = await Promise.all([
        getRolesApi(true),
        getPermissionsApi(true),
        getAdminsApi(true),
      ]);

      let fetchedAdminsList: UserManagementItem[] = [];
      if (adminsRes && adminsRes.success && Array.isArray(adminsRes.data)) {
        fetchedAdminsList = adminsRes.data.map((u: any) => ({
          id: u._id || u.id,
          _id: u._id || u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "+91 98390 00000",
          locality: u.locality || "Varanasi HQ",
          role: typeof u.role === "object" ? u.role?.name || "Staff Admin" : (u.role || "Staff Admin"),
          status: u.status === "inactive" || u.status === "Suspended" ? "Suspended" : "Active",
          lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : "Active Now",
          permissions: defaultFullPermissions,
        }));
        if (fetchedAdminsList.length > 0) {
          setUsers(fetchedAdminsList);
          setCachedModuleData("users_admins", fetchedAdminsList);
        }
      }

      if (rolesRes && rolesRes.success && Array.isArray(rolesRes.data)) {
        const allPermIds = DEFAULT_SYSTEM_PERMISSIONS.map((p) => p._id);
        const roleUserCountMap: Record<string, number> = {};
        fetchedAdminsList.forEach((u) => {
          if (u.role) {
            roleUserCountMap[u.role] = (roleUserCountMap[u.role] || 0) + 1;
          }
        });

        const fetchedRoles: SystemRole[] = rolesRes.data.map((r: any) => {
          const isSuperAdmin =
            r.name?.toLowerCase().includes("super") ||
            r.code === "SUPER_ADMIN";
          const permIds = Array.isArray(r.permissions)
            ? r.permissions.map((p: any) => (typeof p === "string" ? p : p._id))
            : [];
          return {
            id: r._id || r.id,
            _id: r._id || r.id,
            name: r.name,
            code: r.code,
            description:
              r.description ||
              (isSuperAdmin
                ? "Full administrative access to all system modules, pricing & RBAC matrix."
                : `Configured role with ${permIds.length} permissions`),
            permissionIds: isSuperAdmin
              ? Array.from(new Set([...permIds, ...allPermIds]))
              : permIds,
            permissionsObjects: Array.isArray(r.permissions) ? r.permissions : undefined,
            userCount: roleUserCountMap[r.name] || 0,
            status: r.status || "active",
            color:
              "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
          };
        });
        if (fetchedRoles.length > 0) {
          setSystemRoles(fetchedRoles);
          setCachedModuleData("users_roles", fetchedRoles);
        }
      }

      if (permsRes && permsRes.success && Array.isArray(permsRes.data)) {
        const flatPerms: PermissionItem[] = [];
        permsRes.data.forEach((item: any) => {
          const mod = (item.module || "").toUpperCase();
          if (mod === "USER") return; // Obsolete module replaced by USER_MANAGEMENT
          if (item.actions && Array.isArray(item.actions)) {
            item.actions.forEach((act: any) => {
              flatPerms.push({
                _id: act._id || act.id,
                id: act._id || act.id,
                name: act.name,
                code: act.code,
                module: item.module || act.module || "SYSTEM",
                action: act.action || "view",
                status: act.status || "active",
              });
            });
          } else {
            flatPerms.push({
              _id: item._id || item.id,
              id: item._id || item.id,
              name: item.name,
              code: item.code,
              module: item.module,
              action: item.action || "view",
              status: item.status || "active",
            });
          }
        });
        if (flatPerms.length > 0) {
          const existingCodes = new Set(flatPerms.map((p) => p.code));
          const mergedPerms = [...flatPerms];
          DEFAULT_SYSTEM_PERMISSIONS.forEach((defPerm) => {
            if (!existingCodes.has(defPerm.code)) {
              mergedPerms.push(defPerm);
            }
          });
          setPermissionsList(mergedPerms);
          setCachedModuleData("users_permissions", mergedPerms);
        }
      }
    } catch (err) {
      console.error("Failed to load permissions, roles and admin users from API:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData(true);
  }, []);

  // Handler: Add New User / Admin (`POST /api/admin/create-admins`)
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsAddingUserApi(true);

    const targetRoleObj = systemRoles.find((r) => r.name === selectedRole || r.id === selectedRole || r._id === selectedRole);
    const roleId = targetRoleObj?._id || targetRoleObj?.id || selectedRole;

    try {
      const res = await createAdminApi({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || "12345678",
        role: roleId,
        status: status === "Active" ? "active" : "inactive",
      });

      if (res && res.success) {
        setToast({
          type: "success",
          message: res.message || `Staff user "${name.trim()}" created successfully!`,
        });
        setName("");
        setEmail("");
        setPassword("12345678");
        setPhone("");
        setIsAddUserOpen(false);
        fetchAllData(true);
      } else {
        const newUser: UserManagementItem = {
          id: `usr-${Date.now()}`,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || "+91 98390 00000",
          locality: locality.trim() || "Varanasi HQ",
          role: selectedRole,
          status,
          lastLogin: "Just Now",
          permissions: defaultFullPermissions,
        };

        const updatedUsers = [newUser, ...users];
        setUsers(updatedUsers);
        setCachedModuleData("users_admins", updatedUsers);
        setSystemRoles((prev) => {
          const updated = prev.map((r) => (r.name === selectedRole ? { ...r, userCount: (r.userCount || 0) + 1 } : r));
          setCachedModuleData("users_roles", updated);
          return updated;
        });

        setName("");
        setEmail("");
        setPassword("12345678");
        setPhone("");
        setIsAddUserOpen(false);
        setToast({
          type: "success",
          message: `Staff user "${newUser.name}" added and assigned role "${selectedRole}".`,
        });
      }
    } catch (err) {
      console.error("Error creating staff admin:", err);
      setToast({ type: "error", message: "Failed to create staff user." });
    } finally {
      setIsAddingUserApi(false);
    }
  };

  // Handler: Create Role (`POST /api/admin/roles`)
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsCreatingRoleApi(true);

    try {
      const res = await createRoleApi({
        name: newRoleName.trim(),
        permissions: selectedRolePermissionIds,
      });

      if (res && res.success) {
        setToast({
          type: "success",
          message: res.message || `Role "${newRoleName.trim()}" created successfully!`,
        });

        const createdRoleData = res.data;
        const createdRole: SystemRole = {
          id: createdRoleData?._id || `role-${Date.now()}`,
          _id: createdRoleData?._id,
          name: createdRoleData?.name || newRoleName.trim(),
          description: newRoleDesc.trim() || "Custom operational role.",
          permissionIds: selectedRolePermissionIds,
          userCount: 0,
          color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        };

        setSystemRoles((prev) => [createdRole, ...prev]);
        setSelectedRole(createdRole.name);

        setNewRoleName("");
        setNewRoleDesc("");
        setIsCreateRoleOpen(false);

        fetchAllData(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("helpmate_permissions_updated"));
        }
      } else {
        const createdRole: SystemRole = {
          id: `role-${Date.now()}`,
          name: newRoleName.trim(),
          description: newRoleDesc.trim() || "Custom operational role.",
          permissionIds: selectedRolePermissionIds,
          userCount: 0,
          color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        };

        const updatedRoles = [createdRole, ...systemRoles];
        setSystemRoles(updatedRoles);
        setCachedModuleData("users_roles", updatedRoles);
        setSelectedRole(createdRole.name);

        setNewRoleName("");
        setNewRoleDesc("");
        setIsCreateRoleOpen(false);
        setToast({
          type: "success",
          message: `Role "${createdRole.name}" created! Available in role selection.`,
        });
      }
    } catch (err) {
      console.error("Error creating role:", err);
      setToast({ type: "error", message: "Failed to connect to backend roles service." });
    } finally {
      setIsCreatingRoleApi(false);
    }
  };

  // Handler: Update Role (`PUT /api/admin/roles/:id`)
  const handleUpdateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole || !editRoleName.trim()) return;

    setIsUpdatingRoleApi(true);

    try {
      const targetId = editRole._id || editRole.id;
      const res = await updateRoleApi(targetId, {
        name: editRoleName.trim(),
        permissions: editRolePermissionIds,
      });

      if (res && res.success) {
        setToast({
          type: "success",
          message: res.message || `Role "${editRoleName.trim()}" updated successfully!`,
        });

        setSystemRoles((prev) =>
          prev.map((r) =>
            r.id === editRole.id || r._id === editRole._id
              ? {
                  ...r,
                  name: editRoleName.trim(),
                  description: editRoleDesc.trim(),
                  permissionIds: editRolePermissionIds,
                }
              : r
          )
        );

        setEditRole(null);
        fetchAllData(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("helpmate_permissions_updated"));
        }
      } else {
        setSystemRoles((prev) => {
          const updated = prev.map((r) =>
            r.id === editRole.id
              ? {
                  ...r,
                  name: editRoleName.trim(),
                  description: editRoleDesc.trim(),
                  permissionIds: editRolePermissionIds,
                }
              : r
          );
          setCachedModuleData("users_roles", updated);
          return updated;
        });

        setEditRole(null);
        setToast({
          type: "success",
          message: `Role "${editRoleName.trim()}" updated successfully!`,
        });
      }
    } catch (err) {
      console.error("Error updating role:", err);
      setToast({ type: "error", message: "Failed to update role." });
    } finally {
      setIsUpdatingRoleApi(false);
    }
  };

  // Handler: Create Permission (`POST /api/admin/permissions`)
  const handleCreatePermissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveModule = (
      permModule || 
      (permCode.trim() ? permCode.trim().split("_")[0] : "") || 
      (permName.trim() ? permName.trim().split(" ")[0] : "") || 
      "SYSTEM"
    ).toUpperCase();

    if (!effectiveModule || permActions.length === 0) return;

    try {
      const createdItems: PermissionItem[] = [];

      for (const act of permActions) {
        const code = permCode.trim()
          ? (permActions.length === 1 ? permCode.trim() : `${effectiveModule}_${act.toUpperCase()}`)
          : `${effectiveModule}_${act.toUpperCase()}`;

        const name = permName.trim()
          ? (permActions.length === 1 ? permName.trim() : `${act.charAt(0).toUpperCase() + act.slice(1)} ${effectiveModule}`)
          : `${act.charAt(0).toUpperCase() + act.slice(1)} ${effectiveModule}`;

        const res = await createPermissionApi({
          name,
          code,
          module: effectiveModule,
          action: act as any,
          status: permStatus,
        });

        if (res && res.success && res.data) {
          // Created via backend API
        } else {
          createdItems.push({
            _id: `perm-${Date.now()}-${act}`,
            id: `perm-${Date.now()}-${act}`,
            name,
            code,
            module: permModule.toUpperCase(),
            action: act as any,
            status: permStatus,
          });
        }
      }

      if (createdItems.length > 0) {
        setPermissionsList((prev) => [...createdItems, ...prev]);
      }

      setToast({
        type: "success",
        message: `Permissions configured for ${permModule} module (${permActions.map((a) => a.toUpperCase()).join(", ")})`,
      });

      setPermName("");
      setPermCode("");
      setIsCreatePermissionOpen(false);
      fetchAllData(true);
    } catch (err) {
      console.error("Error creating permission:", err);
      setToast({ type: "error", message: "Failed to create permission." });
    }
  };

  const handleModuleChange = (newModule: string) => {
    setPermModule(newModule);
    const existingInModule = (groupedPermissions[newModule.toUpperCase()] || []).map((p) => p.action);
    setPermActions(existingInModule.length > 0 ? (existingInModule as any) : ["create", "delete", "edit", "view"]);
  };

  // Handler: Update Permission (`PUT /api/admin/permissions/:id`)
  const handleUpdatePermissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPermission) return;

    try {
      const targetModule = (
        permModule || 
        (permCode.trim() ? permCode.trim().split("_")[0] : "") || 
        (permName.trim() ? permName.trim().split(" ")[0] : "") || 
        "SYSTEM"
      ).toUpperCase();
      const existingInModule = groupedPermissions[targetModule] || [];

      for (const act of permActions) {
        const existingAct = existingInModule.find((p) => p.action === act);
        const name = permName.trim() && permActions.length === 1
          ? permName.trim()
          : (existingAct?.name || `${act.charAt(0).toUpperCase() + act.slice(1)} ${targetModule}`);
        const code = permCode.trim() && permActions.length === 1
          ? permCode.trim()
          : (existingAct?.code || `${targetModule}_${act.toUpperCase()}`);

        if (existingAct) {
          await updatePermissionApi(existingAct._id || existingAct.id, {
            name,
            code,
            module: targetModule,
            action: act as any,
            status: permStatus,
          });
        } else {
          await createPermissionApi({
            name,
            code,
            module: targetModule,
            action: act as any,
            status: permStatus,
          });
        }
      }

      setToast({
        type: "success",
        message: `Updated ${targetModule} module permissions (${permActions.map((a) => a.toUpperCase()).join(", ")})`,
      });

      setEditPermission(null);
      fetchAllData(true);
    } catch (err) {
      console.error("Error updating permission:", err);
      setToast({ type: "error", message: "Failed to update permission." });
    }
  };

  // Handler: Delete Permission (`DELETE /api/admin/permissions/:id`)
  const handleDeletePermissionConfirm = async () => {
    if (!deletePermissionItem) return;
    try {
      const res = await deletePermissionApi(deletePermissionItem._id || deletePermissionItem.id);
      if (res && res.success) {
        setToast({ type: "success", message: res.message || `Permission deleted.` });
      } else {
        setPermissionsList((prev) =>
          prev.filter((p) => p._id !== deletePermissionItem._id && p.id !== deletePermissionItem.id)
        );
        setToast({ type: "success", message: `Permission deleted.` });
      }
      setDeletePermissionItem(null);
      fetchAllData(true);
    } catch (err) {
      console.error("Error deleting permission:", err);
      setToast({ type: "error", message: "Failed to delete permission." });
    }
  };

  // Handler: Delete Module Permission Group
  const handleDeletePermissionGroupConfirm = async () => {
    if (!deletePermissionGroup) return;
    try {
      await Promise.all(
        deletePermissionGroup.actions.map((act) =>
          deletePermissionApi(act._id || act.id)
        )
      );
      setToast({ type: "success", message: `Permissions for ${deletePermissionGroup.module} deleted.` });
      setDeletePermissionGroup(null);
      fetchAllData(true);
    } catch (err) {
      console.error("Error deleting permission group:", err);
      setToast({ type: "error", message: "Failed to delete permission group." });
    }
  };

  // Handler: Update Admin User (`PUT /api/admin/:id`)
  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setIsUpdatingUserApi(true);

    const targetRoleObj = systemRoles.find((r) => r.name === editUser.role || r.id === editUser.role || r._id === editUser.role);
    const roleId = targetRoleObj?._id || targetRoleObj?.id || editUser.role;

    try {
      const targetId = (editUser as any)._id || editUser.id;
      const res = await updateAdminApi(targetId, {
        name: editUser.name.trim(),
        email: editUser.email.trim(),
        password: editUserPassword.trim() || undefined,
        role: roleId,
        status: editUser.status === "Active" ? "active" : "inactive",
      });

      if (res && res.success) {
        setToast({ type: "success", message: res.message || `Updated staff user profile for ${editUser.name}.` });
        setEditUser(null);
        setEditUserPassword("");
        fetchAllData(true);
      } else {
        setUsers((prev) => {
          const updated = prev.map((u) => (u.id === editUser.id ? editUser : u));
          setCachedModuleData("users_admins", updated);
          return updated;
        });
        setEditUser(null);
        setEditUserPassword("");
        setToast({ type: "success", message: `Updated user profile for ${editUser.name}.` });
      }
    } catch (err) {
      console.error("Error updating admin user:", err);
      setToast({ type: "error", message: "Failed to update staff user." });
    } finally {
      setIsUpdatingUserApi(false);
    }
  };

  // Handler: Delete Admin User (`DELETE /api/admin/:id`)
  const handleDeleteUserConfirm = async () => {
    if (!deleteUser) return;
    try {
      const targetId = (deleteUser as any)._id || deleteUser.id;
      const res = await deleteAdminApi(targetId);
      if (res && res.success) {
        setToast({ type: "success", message: res.message || `Staff account ${deleteUser.name} deleted.` });
      } else {
        setUsers(users.filter((u) => u.id !== deleteUser.id));
        setToast({ type: "success", message: `User account ${deleteUser.name} deleted.` });
      }
      setDeleteUser(null);
      fetchAllData(true);
    } catch (err) {
      console.error("Error deleting admin user:", err);
      setToast({ type: "error", message: "Failed to delete staff user." });
    }
  };


  const [updatingAdminStatusId, setUpdatingAdminStatusId] = useState<string | null>(null);
  const [updatingRoleStatusId, setUpdatingRoleStatusId] = useState<string | null>(null);

  const handleToggleAdminStatus = async (user: UserManagementItem, targetStatus: "Active" | "Inactive") => {
    const targetId = (user as any)._id || user.id;
    setUpdatingAdminStatusId(targetId);
    const newStatus: "Active" | "Suspended" = targetStatus === "Active" ? "Active" : "Suspended";
    const apiStatus = targetStatus === "Active" ? "active" : "inactive";
    
    setUsers((prev) =>
      prev.map((u) => ((u as any)._id === targetId || u.id === targetId ? { ...u, status: newStatus } : u))
    );

    try {
      const res = await updateAdminApi(targetId, {
        name: user.name,
        email: user.email,
        status: apiStatus,
      });
      if (res && res.success !== false) {
        setToast({ type: "success", message: `Admin ${user.name} is now ${newStatus}.` });
      } else {
        setUsers((prev) =>
          prev.map((u) => ((u as any)._id === targetId || u.id === targetId ? { ...u, status: user.status } : u))
        );
        setToast({ type: "error", message: res?.message || `Failed to update status for ${user.name}.` });
      }
    } catch (err: any) {
      setUsers((prev) =>
        prev.map((u) => ((u as any)._id === targetId || u.id === targetId ? { ...u, status: user.status } : u))
      );
      setToast({ type: "error", message: err?.message || `Failed to update status for ${user.name}.` });
    } finally {
      setUpdatingAdminStatusId(null);
    }
  };

  const handleToggleRoleStatus = async (role: SystemRole, targetStatus: "Active" | "Inactive") => {
    const targetId = role._id || role.id;
    setUpdatingRoleStatusId(targetId);
    const newStatusStr = targetStatus.toLowerCase();

    setSystemRoles((prev) =>
      prev.map((r) => ((r._id === targetId || r.id === targetId) ? { ...r, status: newStatusStr } : r))
    );

    try {
      const res = await updateRoleApi(targetId, {
        name: role.name,
        permissions: role.permissions,
        status: newStatusStr,
      });
      if (res && res.success !== false) {
        setToast({ type: "success", message: `Role "${role.name}" is now ${targetStatus}.` });
      } else {
        setSystemRoles((prev) =>
          prev.map((r) => ((r._id === targetId || r.id === targetId) ? { ...r, status: role.status } : r))
        );
        setToast({ type: "error", message: res?.message || `Failed to update role status.` });
      }
    } catch (err: any) {
      setSystemRoles((prev) =>
        prev.map((r) => ((r._id === targetId || r.id === targetId) ? { ...r, status: role.status } : r))
      );
      setToast({ type: "error", message: err?.message || `Failed to update role status.` });
    } finally {
      setUpdatingRoleStatusId(null);
    }
  };

  // User Columns
  const userColumns: Column<UserManagementItem>[] = [
    {
      key: "name",
      header: "Staff Member",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 dark:text-white text-xs">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.email}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role",
      header: "Assigned Role",
      accessor: (row) => (
        <span className="font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-xl border border-brand-200 dark:border-brand-800 text-xs">
          {row.role}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <StatusDropdown
          status={row.status || "Active"}
          isUpdating={updatingAdminStatusId === ((row as any)._id || row.id)}
          disabled={!canEdit("users")}
          onChange={(newStatus) =>
            handleToggleAdminStatus(row, newStatus)
          }
          title="Click to change account status"
        />
      ),
      sortable: true,
    },
    { key: "lastLogin", header: "Last Active", sortable: true },
    {
      key: "id",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            ...(canEdit("users")
              ? [
                  {
                    label: "Edit User Role",
                    icon: Edit,
                    onClick: () => setEditUser(JSON.parse(JSON.stringify(row))),
                  },
                ]
              : []),
            ...(canDelete("users")
              ? [
                  {
                    label: "Delete Staff Account",
                    icon: Trash2,
                    onClick: () => setDeleteUser(row),
                    danger: true,
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  // Role Columns: strictly Role, Assigned Permissions (Modules), Status, Action
  const roleColumns: Column<SystemRole>[] = [
    {
      key: "name",
      header: "Role",
      accessor: (row) => (
        <span className="font-extrabold text-slate-900 dark:text-white text-xs">{row.name}</span>
      ),
      sortable: true,
    },
    {
      key: "permissionIds",
      header: "Assigned Permissions",
      accessor: (row) => {
        const assignedModules = getRoleAssignedModules(row);
        if (assignedModules.length === 0) {
          return <span className="text-xs text-slate-400 italic">No modules assigned</span>;
        }

        const previewModules = assignedModules.slice(0, 3);
        const extraCount = assignedModules.length - previewModules.length;

        return (
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {previewModules.map((m: RoleAssignedModule) => (
              <span
                key={m.module}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium"
              >
                <span className="font-extrabold text-purple-700 dark:text-purple-300">{m.module}</span>
                <span className="text-[10px] text-slate-400">({m.actions.map((a: RoleAssignedAction) => a.action).join(", ")})</span>
              </span>
            ))}
            {extraCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setViewingRole(row);
                  setViewingRoleSearch("");
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold transition-colors cursor-pointer"
                title={`View all ${assignedModules.length} assigned modules`}
              >
                <span>+{extraCount} more</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => {
        const isAct = (row.status || "active").toLowerCase() === "active";
        const isSuperAdmin = row.name === "Super Admin";
        return (
          <StatusDropdown
            status={isAct ? "Active" : "Inactive"}
            isUpdating={updatingRoleStatusId === (row._id || row.id)}
            disabled={!canEdit("users") || isSuperAdmin}
            onChange={(newStatus) =>
              handleToggleRoleStatus(row, newStatus)
            }
            title={isSuperAdmin ? "Super Admin status cannot be modified" : "Click to change role status"}
          />
        );
      },
      sortable: true,
    },
    {
      key: "actions",
      header: "Action",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: "View All Assigned Modules",
              icon: Eye,
              onClick: () => {
                setViewingRole(row);
                setViewingRoleSearch("");
              },
            },
            ...(canEdit("users")
              ? [
                  {
                    label: "Edit Role & Matrix",
                    icon: Edit,
                    onClick: () => {
                      setEditRole(row);
                      setEditRoleName(row.name);
                      setEditRoleDesc(row.description);
                      setEditRolePermissionIds(row.permissionIds || []);
                    },
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  // Module Permission Group Columns: Module -> Action Type -> Actions (Module shown only ONCE per row)
  const modulePermissionGroupColumns: Column<ModulePermissionGroup>[] = [
    {
      key: "module",
      header: "Module",
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              {row.module}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {row.actions.length} Actions
            </span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Action Type",
      accessor: (row) => (
        <div className="flex flex-wrap gap-2 items-center">
          {row.actions.map((act) => (
            <div
              key={act._id || act.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 border ${
                  act.action === "view"
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                    : act.action === "create"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                    : act.action === "edit"
                    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                }`}
              >
                {act.action}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                {act.code}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "id",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            ...(canEdit("users")
              ? [
                  {
                    label: `Edit ${row.module} Permissions`,
                    icon: Edit,
                    onClick: () => {
                      setEditPermission(row.actions[0]);
                      setPermName(`${row.module} Permissions`);
                      setPermCode(`${row.module}_ALL`);
                      setPermModule(row.module);
                      setPermActions(row.actions.map((a) => a.action));
                      setPermStatus(row.actions[0]?.status || "active");
                    },
                  },
                ]
              : []),
            ...(canDelete("users")
              ? [
                  {
                    label: `Delete ${row.module} Permissions`,
                    icon: Trash2,
                    onClick: () => setDeletePermissionGroup(row),
                    danger: true,
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  const selectedRoleObj = systemRoles.find((r) => r.name === selectedRole);

  return (
    <PermissionGuard permissionKey="canManageRbac">
      <div className="space-y-6 animate-in fade-in duration-300 pb-12">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300 ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-3 text-xs font-semibold">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/5 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand-600" />
              <span>User Management & RBAC</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Secondary Action: Create Permission */}
            {canCreate("users") && (
              <button
                type="button"
                onClick={() => {
                  setPermName("");
                  setPermCode("");
                  setPermModule("USER_MANAGEMENT");
                  setPermActions(["create", "delete", "edit", "view"]);
                  setPermStatus("active");
                  setIsCreatePermissionOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Create Permission</span>
              </button>
            )}

            {/* Secondary Action: Create Role */}
            {canCreate("users") && (
              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Create New Role</span>
              </button>
            )}

            {/* STRICTLY ONLY ONE PRIMARY BUTTON on Page Header: Add User */}
            {canCreate("users") && (
              <button
                type="button"
                onClick={() => setIsAddUserOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation: Staff Directory vs System Roles vs Permissions */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-slate-700 font-bold"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Directory ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "roles"
                ? "bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-slate-700 font-bold"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>System Roles ({systemRoles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "permissions"
                ? "bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-slate-700 font-bold"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>System Permissions ({permissionsList.length})</span>
          </button>
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`role-shimmer-${i}`}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700/60 rounded-md" />
                      <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700/60 rounded" />
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/80 rounded" />
                    <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800/80 rounded" />
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800/80 rounded" />
                      <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800/80 rounded" />
                    </div>
                  </div>
                ))
              ) : (
                systemRoles.map((r) => (
                  <div
                    key={r.id || r._id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${r.color || "bg-slate-100 text-slate-700"}`}>
                        {r.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditRole(r);
                          setEditRoleName(r.name);
                          setEditRoleDesc(r.description);
                          setEditRolePermissionIds(r.permissionIds || []);
                        }}
                        className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 cursor-pointer"
                        title="Edit Role Matrix"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                      {r.description}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      <span className="font-semibold text-slate-400">{r.userCount || 0} Staff</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole(r.name);
                          setIsAddUserOpen(true);
                        }}
                        className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        Assign →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <DataTable columns={userColumns} data={users} isLoading={isLoadingData} />
          </div>
        )}

        {/* TAB 2: SYSTEM ROLES DIRECTORY DATATABLE WITH EDIT ACTION */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  System Roles
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Create New Role</span>
              </button>
            </div>

            <DataTable columns={roleColumns} data={systemRoles} isLoading={isLoadingData} hideActionsColumn={true} />
          </div>
        )}

        {/* TAB 3: SYSTEM PERMISSIONS DIRECTORY DATATABLE */}
        {activeTab === "permissions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  System Permissions
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPermName("");
                  setPermCode("");
                  setPermModule("USER_MANAGEMENT");
                  setPermActions(["create", "delete", "edit", "view"]);
                  setPermStatus("active");
                  setIsCreatePermissionOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Create Permission</span>
              </button>
            </div>

            <DataTable columns={modulePermissionGroupColumns} data={modulePermissionGroups} isLoading={isLoadingData} />
          </div>
        )}

        {/* ─── 1. ADD USER SLIDING DRAWER (CLEAN & SIMPLE: NAME + CustomSelect ROLE DROPDOWN) ─── */}
        {isAddUserOpen && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
              <div className="absolute inset-0" onClick={() => setIsAddUserOpen(false)} />
              <div className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-brand-600" />
                      <span>Add Staff User & Assign Role</span>
                    </h3>
                    <button type="button" onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddUserSubmit} id="add-user-form" className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Staff Full Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="priya@helpmate.net.in"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Login Password *
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter 8+ character password"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98390 00000"
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Locality Zone
                        </label>
                        <input
                          type="text"
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                          placeholder="e.g. Sigra, Lanka"
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    {/* CUSTOM ROLE SELECTION DROPDOWN */}
                    <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80 space-y-2">
                      <CustomSelect
                        label="Assign Role *"
                        value={selectedRole}
                        onChange={(val) => setSelectedRole(val)}
                        options={systemRoles.map((r) => ({
                          value: r.name,
                          label: r.name,
                          icon: <BadgeCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />,
                        }))}
                        placeholder="Select staff role..."
                        onAddAction={() => {
                          setIsAddUserOpen(false);
                          setIsCreateRoleOpen(true);
                        }}
                        addActionLabel="+ Create New Role"
                        searchable
                      />

                      {selectedRoleObj && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-snug">
                          {selectedRoleObj.description}
                        </p>
                      )}
                    </div>

                    <CustomSelect
                      label="Account Status"
                      value={status}
                      onChange={(val) => setStatus(val as "Active" | "Suspended")}
                      options={[
                        { value: "Active", label: "Active" },
                        { value: "Suspended", label: "Suspended" },
                      ]}
                    />
                  </form>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="add-user-form"
                    disabled={isAddingUserApi}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAddingUserApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{isAddingUserApi ? "Creating Staff User..." : "Assign Role & Add User"}</span>
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* ─── 2. CREATE ROLE SLIDING DRAWER (SLIDE-IN FROM RIGHT) ─── */}
        {isCreateRoleOpen && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
              <div className="absolute inset-0" onClick={() => setIsCreateRoleOpen(false)} />
              <form
                onSubmit={handleCreateRoleSubmit}
                className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <FolderPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                          Create New Role
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateRoleOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Role Designation Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="e.g. Operations Coordinator"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Role Operational Description
                      </label>
                      <input
                        type="text"
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        placeholder="e.g. Live booking pipeline management and technician partner re-assignment."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Permissions Matrix grouped by Module */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider block">
                            Configure Role Permissions
                          </span>
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                            {selectedRolePermissionIds.length} of {permissionsList.length} Permissions Selected
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={selectAllPermissionsInCreate}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300 cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={deselectAllPermissionsInCreate}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {Object.entries(groupedPermissions).map(([modName, items]) => {
                          const selectedInMod = items.filter((p) => selectedRolePermissionIds.includes(p._id || p.id)).length;
                          const isAllModSelected = selectedInMod === items.length && items.length > 0;
                          const isSomeModSelected = selectedInMod > 0 && !isAllModSelected;

                          return (
                            <div
                              key={modName}
                              className={`rounded-2xl border transition-all ${
                                selectedInMod > 0
                                  ? "border-purple-200 dark:border-purple-800/60 bg-purple-50/20 dark:bg-purple-950/20"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                              }`}
                            >
                              <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between rounded-t-2xl">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                                    {modName} MODULE
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                      isAllModSelected
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                        : isSomeModSelected
                                        ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                                        : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                    }`}
                                  >
                                    {selectedInMod} / {items.length} Selected
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleAllPermissionsInModuleCreate(modName)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                    isAllModSelected
                                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50 hover:text-purple-700"
                                  }`}
                                >
                                  {isAllModSelected ? "Deselect Module" : "Select All in Module"}
                                </button>
                              </div>

                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {items.map((perm) => {
                                  const isSelected = selectedRolePermissionIds.includes(perm._id || perm.id);

                                  return (
                                    <div
                                      key={perm._id || perm.id}
                                      onClick={() => togglePermissionIdInCreate(perm._id || perm.id)}
                                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                        isSelected
                                          ? "bg-purple-100/60 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 shadow-xs"
                                          : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 pr-2">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 border ${
                                            perm.action === "view"
                                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                              : perm.action === "create"
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                              : perm.action === "edit"
                                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                                              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                                          }`}
                                        >
                                          {perm.action}
                                        </span>

                                        <div className="min-w-0">
                                          <span className="font-bold text-slate-900 dark:text-white text-[11px] block truncate">
                                            {perm.name}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono block truncate">
                                            {perm.code}
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                          isSelected
                                            ? "bg-purple-600 border-purple-600 text-white"
                                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent"
                                        }`}
                                      >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateRoleOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingRoleApi}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingRoleApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FolderPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{isCreatingRoleApi ? "Creating Role..." : "Save & Create Role"}</span>
                  </button>
                </div>
              </form>
            </div>
          </Portal>
        )}

        {/* ─── 3. SLIDING DRAWER FOR EDITING ROLE (`PUT /api/admin/roles/:id`) ─── */}
        {editRole && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
              <div className="absolute inset-0" onClick={() => setEditRole(null)} />
              <form
                onSubmit={handleUpdateRoleSubmit}
                className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                          Edit Role & Permission Matrix
                        </h3>
                      </div>
                    </div>
                    <button type="button" onClick={() => setEditRole(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Role Designation Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={editRoleName}
                        onChange={(e) => setEditRoleName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Role Description
                      </label>
                      <input
                        type="text"
                        value={editRoleDesc}
                        onChange={(e) => setEditRoleDesc(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Permissions Matrix grouped by Module */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider block">
                            Configure Role Permissions
                          </span>
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                            {editRolePermissionIds.length} of {permissionsList.length} Permissions Selected
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={selectAllPermissionsInEdit}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300 cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={deselectAllPermissionsInEdit}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {Object.entries(groupedPermissions).map(([modName, items]) => {
                          const selectedInMod = items.filter((p) => editRolePermissionIds.includes(p._id || p.id)).length;
                          const isAllModSelected = selectedInMod === items.length && items.length > 0;
                          const isSomeModSelected = selectedInMod > 0 && !isAllModSelected;

                          return (
                            <div
                              key={modName}
                              className={`rounded-2xl border transition-all ${
                                selectedInMod > 0
                                  ? "border-purple-200 dark:border-purple-800/60 bg-purple-50/20 dark:bg-purple-950/20"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                              }`}
                            >
                              <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between rounded-t-2xl">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                                    {modName} MODULE
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                      isAllModSelected
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                        : isSomeModSelected
                                        ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                                        : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                    }`}
                                  >
                                    {selectedInMod} / {items.length} Selected
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleAllPermissionsInModuleEdit(modName)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                    isAllModSelected
                                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50 hover:text-purple-700"
                                  }`}
                                >
                                  {isAllModSelected ? "Deselect Module" : "Select All in Module"}
                                </button>
                              </div>

                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {items.map((perm) => {
                                  const isSelected = editRolePermissionIds.includes(perm._id || perm.id);

                                  return (
                                    <div
                                      key={perm._id || perm.id}
                                      onClick={() => togglePermissionIdInEdit(perm._id || perm.id)}
                                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                        isSelected
                                          ? "bg-purple-100/60 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 shadow-xs"
                                          : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 pr-2">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 border ${
                                            perm.action === "view"
                                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                              : perm.action === "create"
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                              : perm.action === "edit"
                                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                                              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                                          }`}
                                        >
                                          {perm.action}
                                        </span>

                                        <div className="min-w-0">
                                          <span className="font-bold text-slate-900 dark:text-white text-[11px] block truncate">
                                            {perm.name}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono block truncate">
                                            {perm.code}
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                          isSelected
                                            ? "bg-purple-600 border-purple-600 text-white"
                                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent"
                                        }`}
                                      >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditRole(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingRoleApi}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdatingRoleApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Edit className="w-3.5 h-3.5" />
                    )}
                    <span>{isUpdatingRoleApi ? "Saving Role..." : "Save Role Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
          </Portal>
        )}

        {/* ─── 3.5 VIEW ASSIGNED MODULES SLIDING DRAWER ─── */}
        {viewingRole && (() => {
          const roleAssignedMods: RoleAssignedModule[] = getRoleAssignedModules(viewingRole);
          const filteredMods = viewingRoleSearch.trim()
            ? roleAssignedMods.filter(
                (m: RoleAssignedModule) =>
                  m.module.toLowerCase().includes(viewingRoleSearch.toLowerCase()) ||
                  m.actions.some(
                    (a: RoleAssignedAction) =>
                      a.action.toLowerCase().includes(viewingRoleSearch.toLowerCase()) ||
                      a.name.toLowerCase().includes(viewingRoleSearch.toLowerCase()) ||
                      a.code.toLowerCase().includes(viewingRoleSearch.toLowerCase())
                  )
              )
            : roleAssignedMods;

          const totalPermsCount = roleAssignedMods.reduce((acc: number, m: RoleAssignedModule) => acc + m.actions.length, 0);

          return (
            <Portal>
              <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
                <div className="absolute inset-0" onClick={() => setViewingRole(null)} />
                <div className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-hidden">
                  {/* Header */}
                  <div className="space-y-4 shrink-0 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                              {viewingRole.name}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
                              {viewingRole.code || "ROLE"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingRole(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quick stats & Search */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          {roleAssignedMods.length} Modules
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[11px]">
                          {totalPermsCount} Permissions
                        </span>
                      </div>
                      <div className="relative w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Filter modules..."
                          value={viewingRoleSearch}
                          onChange={(e) => setViewingRoleSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Module List Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {filteredMods.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {viewingRoleSearch ? "No modules match your search filter" : "No modules or permissions assigned to this role"}
                        </p>
                        {viewingRoleSearch && (
                          <button
                            type="button"
                            onClick={() => setViewingRoleSearch("")}
                            className="text-xs text-brand-600 hover:underline cursor-pointer font-semibold"
                          >
                            Clear Search
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredMods.map((mod: RoleAssignedModule) => (
                        <div
                          key={mod.module}
                          className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-2.5 transition-all hover:border-purple-300 dark:hover:border-purple-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white tracking-wider uppercase">
                                {mod.module}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {mod.actions.length} {mod.actions.length === 1 ? "action" : "actions"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {mod.actions.map((act: RoleAssignedAction) => {
                              const aLower = act.action.toLowerCase();
                              const colorClass =
                                aLower === "view"
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                  : aLower === "create"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : aLower === "edit"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";

                              return (
                                <div
                                  key={act._id || act.code}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${colorClass}`}
                                >
                                  <span className="uppercase">{act.action}</span>
                                  {act.name && act.name !== act.action && (
                                    <span className="text-[10px] font-normal opacity-80">
                                      • {act.name}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer: Strictly adhere to AGENTS.md button hierarchy */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingRole(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      Close
                    </button>

                    {canEdit("users") && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetRole = viewingRole;
                          setViewingRole(null);
                          setEditRole(targetRole);
                          setEditRoleName(targetRole.name);
                          setEditRoleDesc(targetRole.description);
                          setEditRolePermissionIds(targetRole.permissionIds || []);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Role & Matrix</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Portal>
          );
        })()}

        {/* ─── 4. CREATE PERMISSION SLIDING DRAWER ─── */}
        {isCreatePermissionOpen && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
              <div className="absolute inset-0" onClick={() => setIsCreatePermissionOpen(false)} />
              <form
                onSubmit={handleCreatePermissionSubmit}
                className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                      <Key className="w-5 h-5 text-emerald-600" />
                      <span>Create New System Permission</span>
                    </h3>
                    <button type="button" onClick={() => setIsCreatePermissionOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Target Module Dropdown */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Select System Module *
                      </label>
                      <select
                        value={permModule}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleModuleChange(val);
                          setPermCode(`${val}_VIEW`);
                          setPermName(`${val} Module Permissions`);
                        }}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500"
                      >
                        {MODULE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 1. Module Name / Permission Name */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Permission / Feature Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={permName}
                        onChange={(e) => setPermName(e.target.value)}
                        placeholder="e.g. Booking Pipeline"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* 2. Module Code / Permission Code */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Module Code / Permission Code
                      </label>
                      <input
                        type="text"
                        value={permCode}
                        onChange={(e) => setPermCode(e.target.value)}
                        placeholder="e.g. BOOKING_VIEW"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase font-bold outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* 3. Action Type (Multi-Select) */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                        <span>Action Type (Multi-Select) *</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {permActions.length} Selected
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "create" as const, label: "Create (Write)", badge: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
                          { value: "delete" as const, label: "Delete (Remove)", badge: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800" },
                          { value: "edit" as const, label: "Edit (Update)", badge: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800" },
                          { value: "view" as const, label: "View (Read)", badge: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
                        ].map((act) => {
                          const isSelected = permActions.includes(act.value);
                          return (
                            <button
                              key={act.value}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (permActions.length > 1) {
                                    setPermActions(permActions.filter((a) => a !== act.value));
                                  }
                                } else {
                                  setPermActions([...permActions, act.value]);
                                }
                              }}
                              className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? `${act.badge} shadow-2xs`
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span>{act.label}</span>
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent"
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Status */}
                    <CustomSelect
                      label="Status"
                      value={permStatus}
                      onChange={(val) => setPermStatus(val as any)}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreatePermissionOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Create Permission
                  </button>
                </div>
              </form>
            </div>
          </Portal>
        )}

        {/* ─── 5. EDIT PERMISSION SLIDING DRAWER ─── */}
        {editPermission && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
              <div className="absolute inset-0" onClick={() => setEditPermission(null)} />
              <form
                onSubmit={handleUpdatePermissionSubmit}
                className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Edit System Permission</h3>
                    <button type="button" onClick={() => setEditPermission(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Target Module Dropdown */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Select System Module *
                      </label>
                      <select
                        value={permModule}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleModuleChange(val);
                        }}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-purple-500"
                      >
                        {MODULE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 1. Module Name / Permission Name */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Permission / Feature Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={permName}
                        onChange={(e) => setPermName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    {/* 2. Module Code / Permission Code */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Module Code / Permission Code
                      </label>
                      <input
                        type="text"
                        value={permCode}
                        onChange={(e) => setPermCode(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase font-bold"
                      />
                    </div>

                    {/* 3. Action Type (Multi-Select) */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                        <span>Action Type (Multi-Select) *</span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                          {permActions.length} Selected
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "create" as const, label: "Create (Write)", badge: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
                          { value: "delete" as const, label: "Delete (Remove)", badge: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800" },
                          { value: "edit" as const, label: "Edit (Update)", badge: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800" },
                          { value: "view" as const, label: "View (Read)", badge: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
                        ].map((act) => {
                          const isSelected = permActions.includes(act.value);
                          return (
                            <button
                              key={act.value}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (permActions.length > 1) {
                                    setPermActions(permActions.filter((a) => a !== act.value));
                                  }
                                } else {
                                  setPermActions([...permActions, act.value]);
                                }
                              }}
                              className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? `${act.badge} shadow-2xs`
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span>{act.label}</span>
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-purple-600 border-purple-600 text-white"
                                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent"
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Status */}
                    <CustomSelect
                      label="Status"
                      value={permStatus}
                      onChange={(val) => setPermStatus(val as any)}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditPermission(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </Portal>
        )}

        {/* ─── 6. DELETE PERMISSION CONFIRMATION MODAL ─── */}
        {deletePermissionItem && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 outline-none">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl outline-none">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-3 bg-red-100 dark:bg-red-950 rounded-2xl">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Delete Permission</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete permission <strong>{deletePermissionItem.name}</strong> ({deletePermissionItem.code})?
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletePermissionItem(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePermissionConfirm}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    Delete Permission
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* ─── 6. DELETE PERMISSION GROUP MODAL ─── */}
        {deletePermissionGroup && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Delete Module Permissions</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete permissions for module <strong>{deletePermissionGroup.module}</strong> ({deletePermissionGroup.actions.length} actions)?
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletePermissionGroup(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePermissionGroupConfirm}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    Delete Permissions
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* ─── 7. EDIT USER DRAWER ─── */}
        {editUser && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
              <div className="absolute inset-0" onClick={() => setEditUser(null)} />
              <div className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Edit Staff User</h3>
                    </div>
                    <button type="button" onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateUserSubmit} id="edit-user-form" className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Staff Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editUser.name}
                        onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={editUser.email}
                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Update Password (Optional)</label>
                      <input
                        type="password"
                        value={editUserPassword}
                        onChange={(e) => setEditUserPassword(e.target.value)}
                        placeholder="Leave blank to keep unchanged"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <CustomSelect
                        label="Assigned Role"
                        value={editUser.role}
                        onChange={(val) => {
                          setEditUser({
                            ...editUser,
                            role: val as any,
                          });
                        }}
                        options={systemRoles.map((r) => ({ value: r.name, label: r.name }))}
                        searchable
                      />

                      <CustomSelect
                        label="Account Status"
                        value={editUser.status}
                        onChange={(val) => setEditUser({ ...editUser, status: val as any })}
                        options={[
                          { value: "Active", label: "Active" },
                          { value: "Suspended", label: "Suspended" },
                        ]}
                      />
                    </div>
                  </form>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-user-form"
                    disabled={isUpdatingUserApi}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdatingUserApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Edit className="w-3.5 h-3.5" />
                    )}
                    <span>{isUpdatingUserApi ? "Saving Changes..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* ─── 8. DELETE USER CONFIRMATION MODAL ─── */}
        {deleteUser && (
          <Portal>
            <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 outline-none">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl outline-none">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-3 bg-red-100 dark:bg-red-950 rounded-2xl">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Delete Staff Account</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete staff account <strong>{deleteUser.name}</strong> ({deleteUser.email})?
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteUser(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUserConfirm}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}
      </div>
    </PermissionGuard>
  );
}
