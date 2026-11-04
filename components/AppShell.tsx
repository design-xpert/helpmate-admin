"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, type SidebarState } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { isComingSoonPath } from "@/lib/comingSoonConfig";
import { useRbac } from "@/context/RbacContext";
import { getModuleFromPathname } from "@/lib/rbacHelper";
import { AccessDeniedView } from "@/components/AccessDeniedView";

import { isTokenExpired, handleGlobalLogout } from "@/lib/api";

export function AppShell({
  children,
  initialSidebarState,
}: {
  children: React.ReactNode;
  initialSidebarState?: SidebarState | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSuperAdmin, canView, allowedModules, role } = useRbac();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Validate module route permissions when navigating by URL
  const moduleInfo = useMemo(() => {
    return getModuleFromPathname(pathname);
  }, [pathname]);

  const isAccessDenied = useMemo(() => {
    // Super Admin has universal access across all routes
    if (isSuperAdmin) return false;

    // Public / universal routes (e.g. "/", "/login", "/profile", "/api-docs")
    if (!moduleInfo) return false;

    // Partner Portal route access
    if (moduleInfo.moduleCode === "PARTNER_PORTAL") {
      return role !== "Service Partner";
    }

    // Service Partners cannot access admin desk modules
    if (role === "Service Partner") {
      return true;
    }

    // Check if user has permission to view this module
    const hasViewPerm = canView(moduleInfo.moduleCode);
    const isInAllowedList = Array.isArray(allowedModules) && allowedModules.includes(moduleInfo.moduleCode);

    return !hasViewPerm && !isInAllowedList;
  }, [isSuperAdmin, moduleInfo, role, canView, allowedModules]);

  // Check token expiration immediately & periodically on protected routes
  useEffect(() => {
    if (pathname === "/login") return;

    const checkTokenState = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("helpmate_admin_token");
        if (!token || isTokenExpired(token)) {
          handleGlobalLogout();
        }
      }
    };

    checkTokenState();
    const interval = setInterval(checkTokenState, 3000);
    return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("helpmate_admin_session");
      if (session === "true") {
        setIsAuthenticated(true);
      }
    }
  }, [pathname, router]);

  // Close mobile sidebar automatically on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Standalone Login Page
  if (pathname === "/login") {
    return <main className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</main>;
  }

  const isComingSoon = isComingSoonPath(pathname);

  return (
    <div className="h-screen flex overflow-hidden antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        initialState={initialSidebarState}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full relative min-h-full">
          {isAccessDenied ? (
            <AccessDeniedView
              moduleName={moduleInfo?.moduleName}
              moduleCode={moduleInfo?.moduleCode}
              role={role}
            />
          ) : (
            <>
              {children}
              {isComingSoon && <ComingSoonOverlay path={pathname} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
