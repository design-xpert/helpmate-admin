"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { UserPermissions, initialUsers, UserManagementItem } from "@/lib/mockData";
import {
  computeUserPermissions,
  normalizeModuleCode,
  ModulePermissionsMap,
  ActionPermissions,
  ALL_SYSTEM_MODULES,
} from "@/lib/rbacHelper";
import { saveSidebarCookie } from "@/components/Sidebar";

export type RoleType =
  | "Super Admin"
  | "Office Admin"
  | "Varanasi Operations Coordinator"
  | "Quality Inspector"
  | "Billing & Finance Manager"
  | "Support Agent"
  | "Service Partner";

const o = { view: false, create: false, edit: false, delete: false };
const r = { view: true, create: false, edit: false, delete: false };
const rw = { view: true, create: false, edit: true, delete: false };
const rc = { view: true, create: true, edit: false, delete: false };
const rcw = { view: true, create: true, edit: true, delete: false };
const rwd = { view: true, create: true, edit: true, delete: true };

const rolePermissionsMap: Record<RoleType, UserPermissions> = {
  "Super Admin": {
    bookings: rwd, inspections: rwd, customers: rwd, technicians: rwd,
    categories: rwd, cms: rwd, pricing: rwd, locations: rwd,
    payments: rwd, billing: rwd, commission: rwd, coupons: rwd,
    reviews: rwd, media: rwd, analytics: rwd, reports: rwd, rbac: rwd,
    leads: rwd, settlements: rwd, wallets: rwd, membership: rwd,
    banners: rwd, imageSections: rwd, faq: rwd, support: rwd,
    notifications: rwd, activityLog: rwd, settings: rwd,
    canAssignJobs: true, canEditServices: true, canProcessRefunds: true,
    canManageFleet: true, canExportReports: true, canManageRbac: true, canViewAuditLogs: true,
  },
  "Office Admin": {
    bookings: rwd, inspections: o, customers: o, technicians: o,
    categories: o, cms: o, pricing: o, locations: o,
    payments: rwd, billing: rwd, commission: rwd, coupons: o,
    reviews: o, media: o, analytics: o, reports: o, rbac: o,
    canAssignJobs: true, canEditServices: false, canProcessRefunds: true,
    canManageFleet: false, canExportReports: true, canManageRbac: false, canViewAuditLogs: false,
  },
  "Varanasi Operations Coordinator": {
    bookings: rw, inspections: rw, customers: rw, technicians: rw,
    categories: r, cms: o, pricing: o, locations: r,
    payments: o, billing: o, commission: o, coupons: o,
    reviews: r, media: o, analytics: o, reports: o, rbac: o,
    canAssignJobs: true, canEditServices: false, canProcessRefunds: false,
    canManageFleet: true, canExportReports: false, canManageRbac: false, canViewAuditLogs: true,
  },
  "Quality Inspector": {
    bookings: rw, inspections: rw, customers: r, technicians: rw,
    categories: o, cms: o, pricing: o, locations: r,
    payments: o, billing: o, commission: o, coupons: o,
    reviews: r, media: o, analytics: o, reports: o, rbac: o,
    canAssignJobs: true, canEditServices: false, canProcessRefunds: false,
    canManageFleet: true, canExportReports: false, canManageRbac: false, canViewAuditLogs: false,
  },
  "Billing & Finance Manager": {
    bookings: r, inspections: o, customers: r, technicians: o,
    categories: r, cms: rw, pricing: rw, locations: r,
    payments: rw, billing: rwd, commission: rw, coupons: rw,
    reviews: o, media: o, analytics: r, reports: rw, rbac: o,
    canAssignJobs: false, canEditServices: true, canProcessRefunds: true,
    canManageFleet: false, canExportReports: true, canManageRbac: false, canViewAuditLogs: true,
  },
  "Support Agent": {
    bookings: rw, inspections: r, customers: rw, technicians: r,
    categories: o, cms: o, pricing: o, locations: o,
    payments: r, billing: r, commission: o, coupons: o,
    reviews: r, media: o, analytics: o, reports: o, rbac: o,
    canAssignJobs: true, canEditServices: false, canProcessRefunds: true,
    canManageFleet: false, canExportReports: false, canManageRbac: false, canViewAuditLogs: false,
  },
  "Service Partner": {
    bookings: rw, inspections: r, customers: o, technicians: o,
    categories: o, cms: o, pricing: o, locations: o,
    payments: r, billing: o, commission: o, coupons: o,
    reviews: o, media: o, analytics: o, reports: o, rbac: o,
    canAssignJobs: false, canEditServices: false, canProcessRefunds: false,
    canManageFleet: false, canExportReports: false, canManageRbac: false, canViewAuditLogs: false,
  },
};

export interface RbacContextType {
  currentUser: UserManagementItem;
  setCurrentUser: (user: UserManagementItem) => void;
  role: RoleType;
  setRole: (role: RoleType) => void;
  userPermissions: UserPermissions;
  hasPermission: (permKey: keyof UserPermissions) => boolean;
  updateUserPermissions: (permissions: UserPermissions) => void;
  canView: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  canAccess: (module: string, action?: "view" | "create" | "edit" | "delete") => boolean;
  getModulePermissions: (module: string) => ActionPermissions;
  isSuperAdmin: boolean;
  allowedModules: string[];
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export interface RbacProviderProps {
  children: React.ReactNode;
  initialRole?: string;
  initialAllowedModules?: string[];
  initialIsSuperAdmin?: boolean;
}

export function RbacProvider({
  children,
  initialRole,
  initialAllowedModules,
  initialIsSuperAdmin,
}: RbacProviderProps) {
  const isInitialSuper = useMemo(() => {
    if (initialIsSuperAdmin !== undefined) return initialIsSuperAdmin;
    if (initialAllowedModules && Array.isArray(initialAllowedModules)) {
      if (!initialAllowedModules.includes("USER_MANAGEMENT")) return false;
      if (initialAllowedModules.length < ALL_SYSTEM_MODULES.length) return false;
    }
    if (initialRole) {
      return initialRole.toLowerCase().includes("super");
    }
    return false;
  }, [initialIsSuperAdmin, initialAllowedModules, initialRole]);

  const [currentUser, setCurrentUser] = useState<UserManagementItem>(() => {
    const resolvedRole: RoleType = isInitialSuper
      ? "Super Admin"
      : ((initialRole as RoleType) || "Office Admin");

    return {
      id: "admin-session",
      name: resolvedRole === "Super Admin" ? "Super Admin" : "Staff User",
      email: resolvedRole === "Super Admin" ? "admin@helpmate.com" : "staff@helpmate.com",
      role: resolvedRole,
      phone: "+91 98390 12345",
      status: "Active",
      lastLogin: "Just now",
      permissions: rolePermissionsMap[resolvedRole] || rolePermissionsMap["Super Admin"],
    };
  });

  const [modulePermissions, setModulePermissions] = useState<ModulePermissionsMap>(() => {
    if (isInitialSuper) {
      return computeUserPermissions({ role: "Super Admin" }).permissions;
    }

    // Initialize with only allowed modules for non-superadmin
    const perms: ModulePermissionsMap = {};
    const allowed = new Set(initialAllowedModules || ["DASHBOARD"]);
    ALL_SYSTEM_MODULES.forEach((mod) => {
      perms[mod] = {
        view: allowed.has(mod),
        create: false,
        edit: false,
        delete: false,
      };
    });
    perms["DASHBOARD"] = { view: true, create: true, edit: true, delete: true };
    return perms;
  });

  const [allowedModules, setAllowedModules] = useState<string[]>(() => {
    if (initialAllowedModules && Array.isArray(initialAllowedModules) && initialAllowedModules.length > 0) {
      return initialAllowedModules;
    }
    if (isInitialSuper) {
      return Array.from(ALL_SYSTEM_MODULES);
    }
    return ["DASHBOARD"];
  });

  const isSuperAdmin = useMemo(() => {
    if (initialIsSuperAdmin !== undefined) {
      if (!initialIsSuperAdmin) return false;
    }
    if (allowedModules && !allowedModules.includes("USER_MANAGEMENT")) {
      return false;
    }
    if (allowedModules && allowedModules.length < ALL_SYSTEM_MODULES.length) {
      return false;
    }
    const roleName = (currentUser.role || "").toLowerCase();
    const email = (currentUser.email || "").toLowerCase();
    return (
      (roleName.includes("super") || roleName === "super admin") &&
      email !== "staff@helpmate.com"
    );
  }, [currentUser.role, currentUser.email, allowedModules, initialIsSuperAdmin]);

  // Synchronize authenticated permissions on mount & profile refresh
  useEffect(() => {
    // 1. Immediately hydrate from localStorage on client mount (safe after SSR hydration)
    try {
      const savedUserStr = localStorage.getItem("helpmate_admin_user");
      if (savedUserStr) {
        const admin = JSON.parse(savedUserStr);
        const rawRole = typeof admin.role === "string" ? admin.role : (admin.role?.name || "Super Admin");
        const isSuper = rawRole.toLowerCase().includes("super") || admin.role?.code === "SUPER_ADMIN";
        const targetRole: RoleType = isSuper ? "Super Admin" : (rawRole as RoleType) || "Office Admin";
        setCurrentUser({
          id: String(admin._id || admin.id || admin.adminId || "admin-01"),
          name: typeof admin.name === "string" ? admin.name : "Admin User",
          email: typeof admin.email === "string" ? admin.email : (targetRole === "Super Admin" ? "admin@helpmate.com" : "staff@helpmate.com"),
          role: targetRole,
          phone: typeof admin.mobile === "string" ? admin.mobile : "+91 98390 12345",
          status: admin.status === "inactive" ? "Suspended" : "Active",
          lastLogin: "Just now",
          permissions: rolePermissionsMap[targetRole] || rolePermissionsMap["Super Admin"],
        });
      }
      const storedPerms = localStorage.getItem("helpmate_user_permissions");
      if (storedPerms) {
        setModulePermissions(JSON.parse(storedPerms));
      } else if (savedUserStr) {
        const admin = JSON.parse(savedUserStr);
        setModulePermissions(computeUserPermissions(admin).permissions);
      }
      const storedModules = localStorage.getItem("helpmate_sidebar_allowed_modules");
      if (storedModules) {
        setAllowedModules(JSON.parse(storedModules));
      }
    } catch {}

    const checkAdminAuth = async () => {
      const savedUserId = localStorage.getItem("helpmate_active_user_id");
      if (savedUserId) {
        const found = initialUsers.find((u) => u.id === savedUserId);
        if (found) setCurrentUser(found);
      }

      const token = localStorage.getItem("helpmate_admin_token");
      if (token) {
        try {
          const { getAdminMeApi } = await import("@/lib/api");
          const meRes = await getAdminMeApi();
          if (meRes && meRes.success && meRes.data) {
            const admin = meRes.data;
            const rawRole = typeof admin.role === "string" ? admin.role : (admin.role?.name || "Staff");
            const isSuper = rawRole.toLowerCase().includes("super") || admin.role?.code === "SUPER_ADMIN";
            const targetRole: RoleType = isSuper ? "Super Admin" : (rawRole as RoleType) || "Office Admin";
            const userItem: UserManagementItem = {
              id: String(admin._id || admin.id || admin.adminId || "admin-01"),
              name: typeof admin.name === "string" ? admin.name : "Super Admin",
              email: typeof admin.email === "string" ? admin.email : "admin@helpmate.com",
              role: targetRole,
              phone: typeof admin.mobile === "string" ? admin.mobile : "+91 98390 12345",
              status: admin.status === "inactive" ? "Suspended" : "Active",
              lastLogin: "Just now",
              permissions: rolePermissionsMap[targetRole] || rolePermissionsMap["Super Admin"],
            };
            setCurrentUser(userItem);

            // Compute and store actual granular permissions from backend role
            const computed = computeUserPermissions(admin);
            setModulePermissions(computed.permissions);
            setAllowedModules(computed.allowedModules);
            try {
              localStorage.setItem("helpmate_user_permissions", JSON.stringify(computed.permissions));
              localStorage.setItem("helpmate_sidebar_allowed_modules", JSON.stringify(computed.allowedModules));
              saveSidebarCookie({
                allowedModules: computed.allowedModules,
                isSuperAdmin: computed.isSuperAdmin,
                role: targetRole,
              });
            } catch {}
          }
        } catch (err) {
          console.error("Failed to verify admin profile:", err);
        }
      }
    };

    checkAdminAuth();

    const handlePermissionsUpdated = async () => {
      const token = localStorage.getItem("helpmate_admin_token");
      if (token) {
        try {
          const { getAdminMeApi } = await import("@/lib/api");
          const meRes = await getAdminMeApi();
          if (meRes && meRes.success && meRes.data) {
            const admin = meRes.data;
            const computed = computeUserPermissions(admin);
            setModulePermissions(computed.permissions);
            setAllowedModules(computed.allowedModules);
          }
        } catch {}
      }
    };

    window.addEventListener("helpmate_permissions_updated", handlePermissionsUpdated);
    return () => {
      window.removeEventListener("helpmate_permissions_updated", handlePermissionsUpdated);
    };
  }, []);

  const handleSetCurrentUser = (user: UserManagementItem) => {
    setCurrentUser(user);
    localStorage.setItem("helpmate_active_user_id", user.id);
  };

  const handleSetRole = (newRole: RoleType) => {
    const defaultPerms = rolePermissionsMap[newRole] || rolePermissionsMap["Super Admin"];
    const updatedUser: UserManagementItem = {
      ...currentUser,
      role: newRole,
      permissions: defaultPerms,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem("helpmate_active_user_id", updatedUser.id);
  };

  const handleUpdatePermissions = (newPerms: UserPermissions) => {
    const updatedUser: UserManagementItem = {
      ...currentUser,
      permissions: newPerms,
    };
    setCurrentUser(updatedUser);
  };

  const userPermissions: UserPermissions = currentUser.permissions || rolePermissionsMap[currentUser.role as RoleType] || rolePermissionsMap["Super Admin"];

  const canView = useCallback((module: string): boolean => {
    if (isSuperAdmin) return true;
    const mod = normalizeModuleCode(module);
    return !!modulePermissions[mod]?.view;
  }, [isSuperAdmin, modulePermissions]);

  const canCreate = useCallback((module: string): boolean => {
    if (isSuperAdmin) return true;
    const mod = normalizeModuleCode(module);
    return !!modulePermissions[mod]?.create;
  }, [isSuperAdmin, modulePermissions]);

  const canEdit = useCallback((module: string): boolean => {
    if (isSuperAdmin) return true;
    const mod = normalizeModuleCode(module);
    return !!modulePermissions[mod]?.edit;
  }, [isSuperAdmin, modulePermissions]);

  const canDelete = useCallback((module: string): boolean => {
    if (isSuperAdmin) return true;
    const mod = normalizeModuleCode(module);
    return !!modulePermissions[mod]?.delete;
  }, [isSuperAdmin, modulePermissions]);

  const canAccess = useCallback((module: string, action: "view" | "create" | "edit" | "delete" = "view"): boolean => {
    if (isSuperAdmin) return true;
    const mod = normalizeModuleCode(module);
    return !!modulePermissions[mod]?.[action];
  }, [isSuperAdmin, modulePermissions]);

  const getModulePermissions = useCallback((module: string): ActionPermissions => {
    if (isSuperAdmin) {
      return { view: true, create: true, edit: true, delete: true };
    }
    const mod = normalizeModuleCode(module);
    return modulePermissions[mod] || { view: false, create: false, edit: false, delete: false };
  }, [isSuperAdmin, modulePermissions]);

  const hasPermission = useCallback((permKey: keyof UserPermissions): boolean => {
    if (isSuperAdmin) return true;
    if (permKey === "canManageRbac") {
      return !!modulePermissions["USER_MANAGEMENT"]?.view;
    }
    const mod = normalizeModuleCode(String(permKey));
    if (modulePermissions[mod]) {
      return !!modulePermissions[mod].view;
    }
    return !!userPermissions[permKey];
  }, [isSuperAdmin, modulePermissions, userPermissions]);

  return (
    <RbacContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        role: currentUser.role as RoleType,
        setRole: handleSetRole,
        userPermissions,
        hasPermission,
        updateUserPermissions: handleUpdatePermissions,
        canView,
        canCreate,
        canEdit,
        canDelete,
        canAccess,
        getModulePermissions,
        isSuperAdmin,
        allowedModules,
      }}
    >
      {children}
    </RbacContext.Provider>
  );
}

export function useRbac() {
  const context = useContext(RbacContext);
  if (!context) {
    throw new Error("useRbac must be used within an RbacProvider");
  }
  return context;
}
