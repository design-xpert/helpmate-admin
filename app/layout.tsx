import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/context/ThemeContext";
import { RbacProvider } from "@/context/RbacContext";
import type { SidebarState } from "@/components/Sidebar";

import { ToastContainer } from "@/components/Toast";
import { TopProgressBar } from "@/components/TopProgressBar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "HelpMate Admin Panel | Enterprise On-Demand Services Varanasi",
  description: "Enterprise management panel for HelpMate home care services in Varanasi. Real-time booking assignment, service CMS, partner verification, and customer CRM.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialSidebarState: SidebarState | null = null;
  try {
    const cookieStore = await cookies();
    const rawState = cookieStore.get("helpmate_sidebar_state")?.value;
    if (rawState) {
      initialSidebarState = JSON.parse(decodeURIComponent(rawState));
    }
  } catch {}

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased selection:bg-brand-500 selection:text-white transition-colors duration-200">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <ThemeProvider>
          <RbacProvider
            initialRole={initialSidebarState?.role}
            initialAllowedModules={initialSidebarState?.allowedModules}
            initialIsSuperAdmin={initialSidebarState?.isSuperAdmin}
          >
            <AppShell initialSidebarState={initialSidebarState}>{children}</AppShell>
            <ToastContainer />
          </RbacProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
