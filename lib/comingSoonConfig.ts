export interface ComingSoonModuleConfig {
  path: string;
  title: string;
}

export const COMING_SOON_CONFIGS: Record<string, ComingSoonModuleConfig> = {
  "/": {
    path: "/",
    title: "Executive Dashboard",
  },
  "/partner": {
    path: "/partner",
    title: "Partner Dashboard",
  },
  "/inspections": {
    path: "/inspections",
    title: "Inspections Directory",
  },
  "/leads": {
    path: "/leads",
    title: "Lead CRM Operations",
  },
  "/support": {
    path: "/support",
    title: "Customer Support Desk",
  },
  "/pricing": {
    path: "/pricing",
    title: "Pricing Engine & Surge Logic",
  },
  "/membership": {
    path: "/membership",
    title: "VIP Membership Portal",
  },
  "/faq": {
    path: "/faq",
    title: "FAQ & Help Center Manager",
  },
  "/payments": {
    path: "/payments",
    title: "Payments & Online Gateway",
  },
  "/billing": {
    path: "/billing",
    title: "Billing & GST Invoices",
  },
  "/settlements": {
    path: "/settlements",
    title: "Commission & Settlements",
  },
  "/partner/payouts": {
    path: "/partner/payouts",
    title: "Partner Payouts & Commission",
  },
  "/wallets": {
    path: "/wallets",
    title: "Helpmate Wallets Hub",
  },
  "/partner/wallet": {
    path: "/partner/wallet",
    title: "Partner Earnings Wallet",
  },
  "/coupons": {
    path: "/coupons",
    title: "Promotional Coupons & Discounts",
  },
  "/notifications": {
    path: "/notifications",
    title: "Notifications Hub & Alerts",
  },
  "/reports": {
    path: "/reports",
    title: "Reports & Data Exports",
  },
  "/analytics": {
    path: "/analytics",
    title: "Executive Analytics Dashboard",
  },
};

export function isComingSoonPath(pathname: string): boolean {
  return Boolean(COMING_SOON_CONFIGS[pathname]);
}
