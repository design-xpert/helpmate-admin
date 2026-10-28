"use client";

import { useEffect, useState, useMemo } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { initialUsers, UserManagementItem, UserPermissions, ModulePermission } from "@/lib/mockData";
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Lock,
  Edit,
  Trash2,
  X,
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
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { PermissionGuard } from "@/components/PermissionGuard";
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
  | "reviews" | "media" | "analytics" | "reports" | "rbac";

const modulesList: { key: ModuleKey; label: string; icon: any; desc: string; defaultSampleId: string }[] = [
  { key: "bookings",    label: "Bookings & Jobs",          icon: CalendarCheck, desc: "Manage customer requests, live job assignments & schedules", defaultSampleId: "6aba0c2d6110aa2c74212456" },
  { key: "inspections", label: "Inspections",               icon: Search,        desc: "On-site service inspections and quality verification",      defaultSampleId: "6aba0c2d6110aa2c74212457" },
  { key: "customers",   label: "Customers CRM",            icon: Users,         desc: "Access client profiles & customer CRM directory",             defaultSampleId: "6aba0c2e6110aa2c74212458" },
  { key: "technicians", label: "Partner & KYC",            icon: TechIcon,      desc: "Onboard technicians, verify Aadhaar & police clearance",    defaultSampleId: "6aba0c2e6110aa2c74212459" },
  { key: "categories",  label: "Category Catalog",         icon: Sliders,       desc: "Manage service categories and sub-categories",                defaultSampleId: "6aba0c2e6110aa2c74212460" },
  { key: "cms",         label: "Services CMS",              icon: Wrench,        desc: "Configure service listings, descriptions & media",           defaultSampleId: "6aba0c2e6110aa2c74212461" },
  { key: "pricing",     label: "Pricing Engine",            icon: Tag,           desc: "Set base prices, add-ons and rate cards",                     defaultSampleId: "6aba0c2e6110aa2c74212462" },
  { key: "locations",   label: "Locations & Pincodes",     icon: Building2,     desc: "Manage serviceable areas and pincode zones",                 defaultSampleId: "6aba0c2e6110aa2c74212463" },
  { key: "payments",    label: "Payments",                 icon: CreditCard,    desc: "Track UPI, card and cash payment transactions",               defaultSampleId: "6aba0c2e6110aa2c74212464" },
  { key: "billing",     label: "Billing & GST",            icon: FileText,      desc: "Generate GST invoices, process refunds & receipts",          defaultSampleId: "6aba0c2e6110aa2c74212465" },
  { key: "commission",  label: "Commission & Settlements", icon: DollarSign,    desc: "25% platform commission engine & weekly payouts",             defaultSampleId: "6aba0c2e6110aa2c74212466" },
  { key: "coupons",     label: "Coupons & Offers",         icon: Tag,           desc: "Discount codes, bank offers and promo campaigns",             defaultSampleId: "6aba0c2e6110aa2c74212467" },
  { key: "reviews",     label: "Customer Reviews",         icon: Star,          desc: "Moderate ratings and quality feedback",                       defaultSampleId: "6aba0c2e6110aa2c74212468" },
  { key: "media",       label: "Media Library",            icon: FileImage,     desc: "Upload and manage service images and assets",                 defaultSampleId: "6aba0c2e6110aa2c74212469" },
  { key: "analytics",   label: "Executive Analytics",      icon: TrendingUp,    desc: "Real-time dashboards and KPI tracking",                       defaultSampleId: "6aba0c2e6110aa2c74212470" },
  { key: "reports",     label: "Reports & Exports",        icon: BarChart3,     desc: "Export financial statements & audit logs",                    defaultSampleId: "6aba0c2e6110aa2c74212471" },
  { key: "rbac",        label: "User Management & RBAC",   icon: KeyRound,      desc: "Manage admin accounts and permission matrix",                 defaultSampleId: "6aba0c2e6110aa2c74212472" },
];

const off: ModulePermission = { view: false, create: false, edit: false, delete: false };
const full: ModulePermission = { view: true, create: true, edit: true, delete: true };

const defaultFullPermissions: UserPermissions = {
  bookings: full, inspections: full, customers: full, technicians: full,
  categories: full, cms: full, pricing: full, locations: full,
  payments: full, billing: full, commission: full, coupons: full,
  reviews: full, media: full, analytics: full, reports: full, rbac: full,
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
  canAssignJobs: true, canEditServices: false, canProcessRefunds: false,
  canManageFleet: true, canExportReports: false, canManageRbac: false, canViewAuditLogs: true,
};

export interface PermissionItem {
  _id: string;
  id: string;
  name: string;
  code: string;
  module: string;
  action: "view" | "create" | "edit" | "delete";
  status: "active" | "inactive";
}

export interface ModulePermissionGroup {
  id: string;
  module: string;
  actions: PermissionItem[];
}

export interface SystemRole {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  description: string;
  permissions?: any;
  permissionIds: string[];
  userCount?: number;
  color?: string;
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "permissions">("users");

  const initialCachedUsers = getStoredModuleData<UserManagementItem[]>("users_admins");
  const initialCachedRoles = getStoredModuleData<SystemRole[]>("users_roles");
  const initialCachedPerms = getStoredModuleData<PermissionItem[]>("users_permissions");

  const [users, setUsers] = useState<UserManagementItem[]>(() => initialCachedUsers || initialUsers);

  // System Roles Directory
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>(() => initialCachedRoles || [
    {
      id: "role-super-admin",
      _id: "6aba384336ec417c47fdd2fe",
      name: "Super Admin",
      code: "SUPER_ADMIN",
      description: "Full administrative access to all 17 system modules, pricing & RBAC matrix.",
      permissions: defaultFullPermissions,
      permissionIds: ["6aba0c2d6110aa2c74212456", "6aba0c2d6110aa2c74212457", "6aba0c2e6110aa2c74212458"],
      userCount: 1,
      color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    },
    {
      id: "role-ops-coord",
      _id: "6aba384336ec417c47fdd2ff",
      name: "Operations Coordinator",
      code: "OPERATIONS_COORDINATOR",
      description: "Live booking pipeline management and technician partner re-assignment.",
      permissions: opsCoordinatorPermissions,
      permissionIds: ["6aba0c2d6110aa2c74212456", "6aba0c2d6110aa2c74212457"],
      userCount: 3,
      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    },
  ]);

  // Official 11 Modules from Backend API (GET /api/admin/permissions)
  const MODULE_OPTIONS = [
    { value: "ADMIN", label: "ADMIN — Administrators & Staff" },
    { value: "BOOKING", label: "BOOKING — Customer Service Bookings" },
    { value: "CATEGORY", label: "CATEGORY — Service Catalog & Categories" },
    { value: "CUSTOMER", label: "CUSTOMER — End User Profiles" },
    { value: "INSPECTION", label: "INSPECTION — Technician Quality Audits" },
    { value: "LOCATION", label: "LOCATION — Cities & Pincodes" },
    { value: "PARTNER", label: "PARTNER — Technician Service Providers" },
    { value: "PERMISSION", label: "PERMISSION — System RBAC Permissions" },
    { value: "PRICING", label: "PRICING — Dynamic Pricing Engine" },
    { value: "ROLE", label: "ROLE — Role Matrix Configurations" },
    { value: "SERVICE", label: "SERVICE — Service Packages & CMS" },
  ];

  // System Permissions Registry (Default 44 Actions across 11 Modules from Backend)
  const [permissionsList, setPermissionsList] = useState<PermissionItem[]>(() => initialCachedPerms || [
    // ADMIN
    { _id: "6aba4bbf6110aa2c74213e63", id: "6aba4bbf6110aa2c74213e63", name: "Create Admins", code: "ADMIN_CREATE", module: "ADMIN", action: "create", status: "active" },
    { _id: "6aba4bbf6110aa2c74213e65", id: "6aba4bbf6110aa2c74213e65", name: "Delete Admins", code: "ADMIN_DELETE", module: "ADMIN", action: "delete", status: "active" },
    { _id: "6aba4bbf6110aa2c74213e64", id: "6aba4bbf6110aa2c74213e64", name: "Edit Admins", code: "ADMIN_EDIT", module: "ADMIN", action: "edit", status: "active" },
    { _id: "6aba4bbf6110aa2c74213e62", id: "6aba4bbf6110aa2c74213e62", name: "View Admins", code: "ADMIN_VIEW", module: "ADMIN", action: "view", status: "active" },
    // BOOKING
    { _id: "6aba0c2c6110aa2c7421244a", id: "6aba0c2c6110aa2c7421244a", name: "Create Bookings", code: "BOOKING_CREATE", module: "BOOKING", action: "create", status: "active" },
    { _id: "6aba0c2c6110aa2c7421244c", id: "6aba0c2c6110aa2c7421244c", name: "Delete Bookings", code: "BOOKING_DELETE", module: "BOOKING", action: "delete", status: "active" },
    { _id: "6aba0c2c6110aa2c7421244b", id: "6aba0c2c6110aa2c7421244b", name: "Edit Bookings", code: "BOOKING_EDIT", module: "BOOKING", action: "edit", status: "active" },
    { _id: "6aba0c2c6110aa2c74212449", id: "6aba0c2c6110aa2c74212449", name: "View Bookings", code: "BOOKING_VIEW", module: "BOOKING", action: "view", status: "active" },
    // CATEGORY
    { _id: "6aba0c2e6110aa2c7421245b", id: "6aba0c2e6110aa2c7421245b", name: "Create Category Catalog", code: "CATEGORY_CREATE", module: "CATEGORY", action: "create", status: "active" },
    { _id: "6aba0c2e6110aa2c7421245d", id: "6aba0c2e6110aa2c7421245d", name: "Delete Category Catalog", code: "CATEGORY_DELETE", module: "CATEGORY", action: "delete", status: "active" },
    { _id: "6aba0c2e6110aa2c7421245c", id: "6aba0c2e6110aa2c7421245c", name: "Edit Category Catalog", code: "CATEGORY_EDIT", module: "CATEGORY", action: "edit", status: "active" },
    { _id: "6aba0c2e6110aa2c7421245a", id: "6aba0c2e6110aa2c7421245a", name: "View Category Catalog", code: "CATEGORY_VIEW", module: "CATEGORY", action: "view", status: "active" },
    // CUSTOMER
    { _id: "6aba0c2d6110aa2c74212452", id: "6aba0c2d6110aa2c74212452", name: "Create Customers", code: "CUSTOMER_CREATE", module: "CUSTOMER", action: "create", status: "active" },
    { _id: "6aba0c2d6110aa2c74212454", id: "6aba0c2d6110aa2c74212454", name: "Delete Customers", code: "CUSTOMER_DELETE", module: "CUSTOMER", action: "delete", status: "active" },
    { _id: "6aba0c2d6110aa2c74212453", id: "6aba0c2d6110aa2c74212453", name: "Edit Customers", code: "CUSTOMER_EDIT", module: "CUSTOMER", action: "edit", status: "active" },
    { _id: "6aba0c2d6110aa2c74212451", id: "6aba0c2d6110aa2c74212451", name: "View Customers", code: "CUSTOMER_VIEW", module: "CUSTOMER", action: "view", status: "active" },
    // INSPECTION
    { _id: "6aba0c2d6110aa2c7421244e", id: "6aba0c2d6110aa2c7421244e", name: "Create Inspections", code: "INSPECTION_CREATE", module: "INSPECTION", action: "create", status: "active" },
    { _id: "6aba0c2d6110aa2c74212450", id: "6aba0c2d6110aa2c74212450", name: "Delete Inspections", code: "INSPECTION_DELETE", module: "INSPECTION", action: "delete", status: "active" },
    { _id: "6aba0c2d6110aa2c7421244f", id: "6aba0c2d6110aa2c7421244f", name: "Edit Inspections", code: "INSPECTION_EDIT", module: "INSPECTION", action: "edit", status: "active" },
    { _id: "6aba0c2d6110aa2c7421244d", id: "6aba0c2d6110aa2c7421244d", name: "View Inspections", code: "INSPECTION_VIEW", module: "INSPECTION", action: "view", status: "active" },
    // LOCATION
    { _id: "6aba0c2f6110aa2c74212467", id: "6aba0c2f6110aa2c74212467", name: "Create Locations & Pincodes", code: "LOCATION_CREATE", module: "LOCATION", action: "create", status: "active" },
    { _id: "6aba0c2f6110aa2c74212469", id: "6aba0c2f6110aa2c74212469", name: "Delete Locations & Pincodes", code: "LOCATION_DELETE", module: "LOCATION", action: "delete", status: "active" },
    { _id: "6aba0c2f6110aa2c74212468", id: "6aba0c2f6110aa2c74212468", name: "Edit Locations & Pincodes", code: "LOCATION_EDIT", module: "LOCATION", action: "edit", status: "active" },
    { _id: "6aba0c2f6110aa2c74212466", id: "6aba0c2f6110aa2c74212466", name: "View Locations & Pincodes", code: "LOCATION_VIEW", module: "LOCATION", action: "view", status: "active" },
    // PARTNER
    { _id: "6aba0c2d6110aa2c74212457", id: "6aba0c2d6110aa2c74212457", name: "Create Partners", code: "PARTNER_CREATE", module: "PARTNER", action: "create", status: "active" },
    { _id: "6aba0c2e6110aa2c74212459", id: "6aba0c2e6110aa2c74212459", name: "Delete Partners", code: "PARTNER_DELETE", module: "PARTNER", action: "delete", status: "active" },
    { _id: "6aba0c2e6110aa2c74212458", id: "6aba0c2e6110aa2c74212458", name: "Edit Partners", code: "PARTNER_EDIT", module: "PARTNER", action: "edit", status: "active" },
    { _id: "6aba0c2d6110aa2c74212456", id: "6aba0c2d6110aa2c74212456", name: "View Partners", code: "PARTNER_VIEW", module: "PARTNER", action: "view", status: "active" },
    // PERMISSION
    { _id: "6aba4bbe6110aa2c74213e5f", id: "6aba4bbe6110aa2c74213e5f", name: "Create Permissions", code: "PERMISSION_CREATE", module: "PERMISSION", action: "create", status: "active" },
    { _id: "6aba4bbe6110aa2c74213e61", id: "6aba4bbe6110aa2c74213e61", name: "Delete Permissions", code: "PERMISSION_DELETE", module: "PERMISSION", action: "delete", status: "active" },
    { _id: "6aba4bbe6110aa2c74213e60", id: "6aba4bbe6110aa2c74213e60", name: "Edit Permissions", code: "PERMISSION_EDIT", module: "PERMISSION", action: "edit", status: "active" },
    { _id: "6aba4bbe6110aa2c74213e5e", id: "6aba4bbe6110aa2c74213e5e", name: "View Permissions", code: "PERMISSION_VIEW", module: "PERMISSION", action: "view", status: "active" },
    // PRICING
    { _id: "6aba0c2e6110aa2c74212463", id: "6aba0c2e6110aa2c74212463", name: "Create Pricing Engine", code: "PRICING_CREATE", module: "PRICING", action: "create", status: "active" },
    { _id: "6aba0c2e6110aa2c74212465", id: "6aba0c2e6110aa2c74212465", name: "Delete Pricing Engine", code: "PRICING_DELETE", module: "PRICING", action: "delete", status: "active" },
    { _id: "6aba0c2e6110aa2c74212464", id: "6aba0c2e6110aa2c74212464", name: "Edit Pricing Engine", code: "PRICING_EDIT", module: "PRICING", action: "edit", status: "active" },
    { _id: "6aba0c2e6110aa2c74212462", id: "6aba0c2e6110aa2c74212462", name: "View Pricing Engine", code: "PRICING_VIEW", module: "PRICING", action: "view", status: "active" },
    // ROLE
    { _id: "6aba4bbe6110aa2c74213e5b", id: "6aba4bbe6110aa2c74213e5b", name: "Create Roles", code: "ROLE_CREATE", module: "ROLE", action: "create", status: "active" },
    { _id: "6aba4bbe6110aa2c74213e5d", id: "6aba4bbe6110aa2c74213e5d", name: "Delete Roles", code: "ROLE_DELETE", module: "ROLE", action: "delete", status: "active" },
    { _id: "6aba4bbe6110aa2c74213e5c", id: "6aba4bbe6110aa2c74213e5c", name: "Edit Roles", code: "ROLE_EDIT", module: "ROLE", action: "edit", status: "active" },
    { _id: "6aba4bbe6110aa2c74213e5a", id: "6aba4bbe6110aa2c74213e5a", name: "View Roles", code: "ROLE_VIEW", module: "ROLE", action: "view", status: "active" },
    // SERVICE
    { _id: "6aba0c2e6110aa2c7421245f", id: "6aba0c2e6110aa2c7421245f", name: "Create Services CMS", code: "SERVICE_CREATE", module: "SERVICE", action: "create", status: "active" },
    { _id: "6aba0c2e6110aa2c74212461", id: "6aba0c2e6110aa2c74212461", name: "Delete Services CMS", code: "SERVICE_DELETE", module: "SERVICE", action: "delete", status: "active" },
    { _id: "6aba0c2e6110aa2c74212460", id: "6aba0c2e6110aa2c74212460", name: "Edit Services CMS", code: "SERVICE_EDIT", module: "SERVICE", action: "edit", status: "active" },
    { _id: "6aba0c2e6110aa2c7421245e", id: "6aba0c2e6110aa2c7421245e", name: "View Services CMS", code: "SERVICE_VIEW", module: "SERVICE", action: "view", status: "active" },
  ]);

  // Group permissions by module name for matrix rendering
  const groupedPermissions = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    permissionsList.forEach((perm) => {
      const mod = (perm.module || "ADMIN").toUpperCase();
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
    if (
      !force &&
      isModuleCacheFresh("users_admins") &&
      isModuleCacheFresh("users_roles") &&
      isModuleCacheFresh("users_permissions") &&
      initialCachedUsers &&
      initialCachedRoles &&
      initialCachedPerms
    ) {
      return;
    }
    try {
      const [rolesRes, permsRes, adminsRes] = await Promise.all([
        getRolesApi(true),
        getPermissionsApi(true),
        getAdminsApi(true),
      ]);

      if (rolesRes && rolesRes.success && Array.isArray(rolesRes.data)) {
        const fetchedRoles: SystemRole[] = rolesRes.data.map((r: any) => ({
          id: r._id || r.id,
          _id: r._id || r.id,
          name: r.name,
          code: r.code,
          description: r.description || `Configured role with ${r.permissions?.length || 0} permissions`,
          permissionIds: Array.isArray(r.permissions)
            ? r.permissions.map((p: any) => (typeof p === "string" ? p : p._id))
            : [],
          userCount: 0,
          color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        }));
        if (fetchedRoles.length > 0) {
          setSystemRoles(fetchedRoles);
          setCachedModuleData("users_roles", fetchedRoles);
        }
      }

      if (permsRes && permsRes.success && Array.isArray(permsRes.data)) {
        const flatPerms: PermissionItem[] = [];
        permsRes.data.forEach((item: any) => {
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
          setPermissionsList(flatPerms);
          setCachedModuleData("users_permissions", flatPerms);
        }
      }

      if (adminsRes && adminsRes.success && Array.isArray(adminsRes.data)) {
        const fetchedAdmins: UserManagementItem[] = adminsRes.data.map((u: any) => ({
          id: u._id || u.id,
          _id: u._id || u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "+91 98390 00000",
          locality: u.locality || "Varanasi HQ",
          role: typeof u.role === "object" ? u.role?.name || "Operations Coordinator" : (systemRoles.find(r => r._id === u.role || r.id === u.role)?.name || u.role || "Operations Coordinator"),
          status: u.status === "inactive" || u.status === "Suspended" ? "Suspended" : "Active",
          lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : "Active Now",
          permissions: defaultFullPermissions,
        }));
        if (fetchedAdmins.length > 0) {
          setUsers(fetchedAdmins);
          setCachedModuleData("users_admins", fetchedAdmins);
        }
      }
    } catch (err) {
      console.error("Failed to load permissions, roles and admin users from API:", err);
    }
  };

  useEffect(() => {
    fetchAllData(false);
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
      header: "Account Status",
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            row.status === "Active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {row.status}
        </span>
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
            {
              label: "Edit User Role",
              icon: Edit,
              onClick: () => setEditUser(JSON.parse(JSON.stringify(row))),
            },
            {
              label: "Delete Staff Account",
              icon: Trash2,
              onClick: () => setDeleteUser(row),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  // Role Columns
  const roleColumns: Column<SystemRole>[] = [
    {
      key: "name",
      header: "Role Designation",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 dark:text-white text-xs">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.code || row._id || row.id}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "description",
      header: "Operational Scope & Description",
      accessor: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
          {row.description || "No description specified"}
        </span>
      ),
    },
    {
      key: "permissionIds",
      header: "Assigned Permission IDs",
      accessor: (row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(row.permissionIds && row.permissionIds.length > 0) ? (
            row.permissionIds.map((pid, idx) => (
              <span key={idx} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {typeof pid === "string" ? pid.slice(0, 10) + "..." : "ID"}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-400">None</span>
          )}
        </div>
      ),
    },
    {
      key: "userCount",
      header: "Assigned Staff",
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold">
          {row.userCount || 0} Users
        </span>
      ),
      sortable: true,
    },
    {
      key: "id",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
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
            {
              label: `Delete ${row.module} Permissions`,
              icon: Trash2,
              onClick: () => setDeletePermissionGroup(row),
              danger: true,
            },
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
              className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
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
            <button
              type="button"
              onClick={() => {
                setPermName("");
                setPermCode("");
                setPermModule("ADMIN");
                setPermActions(["create", "delete", "edit", "view"]);
                setPermStatus("active");
                setIsCreatePermissionOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>+ Create Permission</span>
            </button>

            {/* Secondary Action: Create Role */}
            <button
              type="button"
              onClick={() => setIsCreateRoleOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>+ Create New Role</span>
            </button>

            {/* STRICTLY ONLY ONE PRIMARY BUTTON on Page Header: Add User */}
            <button
              type="button"
              onClick={() => setIsAddUserOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
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
              {systemRoles.map((r) => (
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
              ))}
            </div>

            <DataTable columns={userColumns} data={users} />
          </div>
        )}

        {/* TAB 2: SYSTEM ROLES DIRECTORY DATATABLE WITH EDIT ACTION */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Configured System Roles & Permission Array
                </h3>
                <p className="text-xs text-slate-500">
                  Manage role names and permission arrays connected to backend API (`PUT /api/admin/roles/:id`)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Create New Role</span>
              </button>
            </div>

            <DataTable columns={roleColumns} data={systemRoles} />
          </div>
        )}

        {/* TAB 3: SYSTEM PERMISSIONS DIRECTORY DATATABLE */}
        {activeTab === "permissions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Granular System Permissions List
                </h3>
                <p className="text-xs text-slate-500">
                  Manage permissions (`GET /api/admin/permissions`) assigned to Roles
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPermName("");
                  setPermCode("");
                  setPermModule("ADMIN");
                  setPermActions(["create", "delete", "edit", "view"]);
                  setPermStatus("active");
                  setIsCreatePermissionOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>+ Create Permission</span>
              </button>
            </div>

            <DataTable columns={modulePermissionGroupColumns} data={modulePermissionGroups} />
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
                          Create New System Role
                        </h3>
                        <p className="text-xs text-slate-500">
                          POST /api/admin/roles — Configure role name & permission array
                        </p>
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
                        <p className="text-xs text-slate-400">
                          PUT /api/admin/roles/{editRole._id || editRole.id}
                        </p>
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
                    {/* 1. Module Name / Permission Name */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Module Name / Permission Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={permName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPermName(val);
                          if (val.trim()) {
                            setPermModule(val.trim().split(" ")[0].toUpperCase());
                          }
                        }}
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setPermCode(val);
                          if (val.trim()) {
                            setPermModule(val.trim().split("_")[0].toUpperCase());
                          }
                        }}
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
                    {/* 1. Module Name / Permission Name */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Module Name / Permission Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={permName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPermName(val);
                          if (val.trim()) {
                            setPermModule(val.trim().split(" ")[0].toUpperCase());
                          }
                        }}
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setPermCode(val);
                          if (val.trim()) {
                            setPermModule(val.trim().split("_")[0].toUpperCase());
                          }
                        }}
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
                    <p className="text-xs text-slate-400">Remove permission from system catalog</p>
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
                    <p className="text-xs text-slate-400">Remove permission module from system catalog</p>
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
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Edit Staff User & Assigned Role</h3>
                      <p className="text-xs text-slate-400">Update staff details and select assigned role</p>
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
                    <p className="text-xs text-slate-400">Revoke administrative permissions</p>
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
