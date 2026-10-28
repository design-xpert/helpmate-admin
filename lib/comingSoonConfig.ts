export interface ComingSoonModuleConfig {
  path: string;
  title: string;
}

export const COMING_SOON_CONFIGS: Record<string, ComingSoonModuleConfig> = {
  "/": {
    path: "/",
    title: "Dashboard",
  },
  "/partner": {
    path: "/partner",
    title: "My Dashboard",
  },
  "/inspections": {
    path: "/inspections",
    title: "Inspections",
  },
  "/leads": {
    path: "/leads",
    title: "Lead CRM",
  },
  "/support": {
    path: "/support",
    title: "Customer Support",
  },
  "/pricing": {
    path: "/pricing",
    title: "Pricing Engine",
  },
  "/membership": {
    path: "/membership",
    title: "Membership",
  },
  "/faq": {
    path: "/faq",
    title: "FAQ Manager",
  },
  "/payments": {
    path: "/payments",
    title: "Payments",
  },
  "/billing": {
    path: "/billing",
    title: "Billing & GST",
  },
  "/settlements": {
    path: "/settlements",
    title: "Commission & Settlements",
  },
  "/partner/payouts": {
    path: "/partner/payouts",
    title: "Payouts & Commission",
  },
  "/wallets": {
    path: "/wallets",
    title: "Wallets",
  },
  "/partner/wallet": {
    path: "/partner/wallet",
    title: "Wallet",
  },
  "/coupons": {
    path: "/coupons",
    title: "Coupons",
  },
  "/notifications": {
    path: "/notifications",
    title: "Notifications Hub",
  },
  "/reports": {
    path: "/reports",
    title: "Reports & Exports",
  },
  "/analytics": {
    path: "/analytics",
    title: "Executive Analytics",
  },
};

export function isComingSoonPath(pathname: string): boolean {
  return Boolean(COMING_SOON_CONFIGS[pathname]);
}
