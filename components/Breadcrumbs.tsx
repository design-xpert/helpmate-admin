"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { getBookingDetailsApi } from "@/lib/api";

const ROUTE_NAME_MAP: Record<string, string> = {
  bookings: "Bookings",
  customers: "Customers",
  technicians: "Partners & Technicians",
  partner: "Service Partner Portal",
  settlements: "Settlements",
  billing: "Billing & Invoices",
  categories: "Categories & Services",
  analytics: "Analytics & Reports",
  inspections: "Quality Inspections",
  coupons: "Coupons & Discounts",
  commission: "Commission Settings",
  rbac: "Role & Access Control",
  settings: "System Settings",
  locations: "Varanasi Locality Zones",
  reviews: "Customer Reviews",
  notifications: "Broadcast Notifications",
  cms: "CMS & Banner Management",
  faq: "Help & FAQ Hub",
};

function BreadcrumbsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams?.get("category");
  const segments = pathname.split("/").filter(Boolean);

  const [bookingNumMap, setBookingNumMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    if ((segments[0] === "bookings" || segments[0] === "billing" || segments[0] === "settlements") && segments[1]) {
      const bId = segments[1];
      if (bId && !bookingNumMap[bId]) {
        getBookingDetailsApi(bId)
          .then((res) => {
            if (isMounted && res && res.success && res.data) {
              const bNum = res.data.bookingNumber || (res.data._id ? `BK-${res.data._id.slice(-6).toUpperCase()}` : null);
              if (bNum) {
                setBookingNumMap((prev) => ({ ...prev, [bId]: bNum }));
              }
            }
          })
          .catch(() => {});
      }
    }
    return () => {
      isMounted = false;
    };
  }, [pathname, segments]);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 select-none">
        <Home className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
        <span className="font-bold text-slate-900 dark:text-white">Dashboard Overview</span>
      </div>
    );
  }

  const breadcrumbItems: { name: string; href: string; isLast: boolean; isId: boolean }[] = [];

  segments.forEach((segment, index) => {
    const isId = /^(HM|INV|cust|bk|tech|JOB)-/i.test(segment) || /^[0-9a-f-]{8,}$/i.test(segment);
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const mappedName = ROUTE_NAME_MAP[segment.toLowerCase()];
    
    let formattedName = mappedName
      ? mappedName
      : isId
      ? (bookingNumMap[segment] || (segment.length === 24 ? `BK-${segment.slice(-6).toUpperCase()}` : segment.toUpperCase()))
      : segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

    if (segments[0] === "bookings" && index === 1 && bookingNumMap[segment]) {
      formattedName = bookingNumMap[segment];
    }

    // If segment is an ID and category param is present, insert Category link before ID
    if (isId && category) {
      const categoryHref = `/bookings?category=${encodeURIComponent(category)}`;
      breadcrumbItems.push({
        name: category,
        href: categoryHref,
        isLast: false,
        isId: false,
      });
    }

    const isLastItem = index === segments.length - 1;

    breadcrumbItems.push({
      name: formattedName,
      href,
      isLast: isLastItem,
      isId,
    });
  });

  // If on /bookings page directly with category param, append category
  if (segments.length === 1 && segments[0] === "bookings" && category && breadcrumbItems.length === 1) {
    breadcrumbItems[0].isLast = false;
    breadcrumbItems.push({
      name: category,
      href: `/bookings?category=${encodeURIComponent(category)}`,
      isLast: true,
      isId: false,
    });
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 select-none overflow-x-auto no-scrollbar whitespace-nowrap py-1">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-semibold text-slate-500 dark:text-slate-400 shrink-0"
      >
        <Home className="w-3.5 h-3.5 text-slate-400 hover:text-brand-600 shrink-0" />
        <span>Dashboard</span>
      </Link>

      {breadcrumbItems.map((item, idx) => (
        <div key={`${item.href}-${idx}`} className="flex items-center gap-1.5 shrink-0">
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
          {item.isLast ? (
            <span
              title={item.name}
              className={`font-bold truncate max-w-[120px] sm:max-w-[160px] lg:max-w-[220px] inline-block align-bottom ${
                item.isId
                  ? "font-mono text-brand-600 dark:text-brand-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {item.name}
            </span>
          ) : (
            <Link
              href={item.href}
              title={item.name}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[90px] sm:max-w-[130px] inline-block align-bottom"
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

export function Breadcrumbs() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </div>
      }
    >
      <BreadcrumbsContent />
    </Suspense>
  );
}
