import React from "react";

export interface ZoneCard {
  id: string;
  name: string;
  city: string;
  proCount: number;
  imageUrl: string;
  isActive: boolean;
  areas: string[];
  sortOrder: number;
}

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TrendingServiceCard {
  id: string;
  packageId?: string;
  title: string;
  category: string;
  durationMins: number;
  rating: number;
  reviewsCount: number;
  description: string;
  discountPercentage: string;
  price: string;
  originalPrice: string;
  imageUrl: string;
  bookCtaText: string;
  bookCtaLink: string;
  isActive: boolean;
  sortOrder: number;
}

export interface WhereWeServeHeader {
  badge: string;
  title: string;
  subtitle: string;
}

export interface TrendingHeader {
  badge: string;
  title: string;
  subtitle: string;
  viewAllText: string;
  viewAllLink: string;
}

export interface QuickHeader {
  badge: string;
  title: string;
  subtitle: string;
  viewAllText: string;
  viewAllLink: string;
}

export interface SpotlightBanner {
  id: string;
  packageId?: string;
  badge?: string;
  badgeBg?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaTheme: "white" | "accent";
  overlayGradient: string;
  image: string;
  targetUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SpotlightHeader {
  badge: string;
  title: string;
  subtitle: string;
  viewAllText: string;
  viewAllLink: string;
}

export interface SimpleServiceCard {
  id: string;
  packageId?: string;
  title: string;
  image: string;
  targetUrl: string;
  price?: string;
  originalPrice?: string;
  duration?: number;
}

export interface CategorySectionData {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  categoryIds?: string[];
  categorySlug: string;
  seeAllUrl: string;
  isActive: boolean;
  sortOrder: number;
  services: SimpleServiceCard[];
}

export type TabType = "zones" | "trending" | "quick" | "spotlight" | "categorySections";

export const GRADIENT_PRESETS = [
  { label: "HelpMate Burgundy", value: "linear-gradient(90deg, #48073d 0%, #48073d 44%, rgba(72, 7, 61, 0.92) 62%, rgba(72, 7, 61, 0) 100%)" },
  { label: "Velvet Plum", value: "linear-gradient(90deg, #801c6e 0%, #801c6e 44%, rgba(128, 28, 110, 0.92) 62%, rgba(128, 28, 110, 0) 100%)" },
  { label: "Deep Plum", value: "linear-gradient(90deg, #3d0532 0%, #3d0532 44%, rgba(61, 5, 50, 0.92) 62%, rgba(61, 5, 50, 0) 100%)" },
  { label: "Midnight Wine", value: "linear-gradient(90deg, #2b0323 0%, #2b0323 44%, rgba(43, 3, 35, 0.92) 62%, rgba(43, 3, 35, 0) 100%)" },
  { label: "Royal Magenta", value: "linear-gradient(90deg, #590d4b 0%, #590d4b 44%, rgba(89, 13, 75, 0.92) 62%, rgba(89, 13, 75, 0) 100%)" },
  { label: "Charcoal Violet", value: "linear-gradient(90deg, #1e1024 0%, #1e1024 44%, rgba(30, 16, 36, 0.92) 62%, rgba(30, 16, 36, 0) 100%)" },
];

export const BADGE_COLOR_PRESETS = [
  { label: "Plum (#801C6E)", value: "#801C6E" },
  { label: "Burgundy (#48073d)", value: "#48073d" },
  { label: "Amber (#D97706)", value: "#D97706" },
  { label: "Emerald (#059669)", value: "#059669" },
  { label: "Sapphire (#2563EB)", value: "#2563EB" },
  { label: "Rose (#E11D48)", value: "#E11D48" },
];

export const initialWhereWeServeHeader: WhereWeServeHeader = {
  badge: "WHERE WE SERVE",
  title: "Varanasi's Neighborhoods We Cover",
  subtitle: "Book background-verified, uniformed professionals across active Varanasi municipal zones. Select a zone below to explore the direct areas we support.",
};

export const initialTrendingHeader: TrendingHeader = {
  badge: "STEP 3: BEST SELLERS",
  title: "Trending Services This Week",
  subtitle: "Our most popular deep cleaning and home repair bundles booked by Varanasi residents this week.",
  viewAllText: "View all trending packages →",
  viewAllLink: "/services",
};

export const initialQuickHeader: QuickHeader = {
  badge: "QUICK SERVICES",
  title: "Instant 15–30 Min Doorstep Services",
  subtitle: "Fast-dispatch verified technicians for urgent home repairs, deep cleaning, and appliance fixes across Varanasi.",
  viewAllText: "Explore all quick services →",
  viewAllLink: "/services",
};

export const initialSpotlightHeader: SpotlightHeader = {
  badge: "FEATURED EXPERIENCES",
  title: "In the Spotlight",
  subtitle: "Flagship curated experiences and season-special home solutions across Varanasi.",
  viewAllText: "View all spotlight →",
  viewAllLink: "/search?view=spotlight",
};

export const initialSpotlightBanners: SpotlightBanner[] = [
  {
    id: "doorstep-car-wash",
    badge: "New launch",
    badgeBg: "#801C6E",
    title: "Doorstep car\nfoam wash",
    subtitle: "Starting ₹ 399",
    ctaText: "Book now",
    ctaTheme: "white",
    overlayGradient: "linear-gradient(90deg, #48073d 0%, #48073d 44%, rgba(72, 7, 61, 0.92) 62%, rgba(72, 7, 61, 0) 100%)",
    image: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80",
    targetUrl: "/services/car-washing?categoryId=6aa80d87c1c096e4af148665",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "deep-clean-home",
    badge: "Bestseller",
    badgeBg: "#48073d",
    title: "Deep clean\nyour home",
    subtitle: "Complete multi-room sanitisation",
    ctaText: "Book now",
    ctaTheme: "white",
    overlayGradient: "linear-gradient(90deg, #801c6e 0%, #801c6e 44%, rgba(128, 28, 110, 0.92) 62%, rgba(128, 28, 110, 0) 100%)",
    image: "/hero-showcase.png",
    targetUrl: "/services/cleaning?item=deep-cleaning-lux",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "power-jet-ac",
    badge: "Summer special",
    badgeBg: "#801C6E",
    title: "Power-Jet AC\nfoam service",
    subtitle: "Up to 50% power savings",
    ctaText: "Book now",
    ctaTheme: "white",
    overlayGradient: "linear-gradient(90deg, #3d0532 0%, #3d0532 44%, rgba(61, 5, 50, 0.92) 62%, rgba(61, 5, 50, 0) 100%)",
    image: "/ac-technician-promo.png",
    targetUrl: "/services/ac?item=ac-jet-service",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "home-painting",
    badge: "Top rated",
    badgeBg: "#801C6E",
    title: "Home painting\n& waterproofing",
    subtitle: "Pay after 100% satisfaction",
    ctaText: "Book now",
    ctaTheme: "white",
    overlayGradient: "linear-gradient(90deg, #2b0323 0%, #2b0323 44%, rgba(43, 3, 35, 0.92) 62%, rgba(43, 3, 35, 0) 100%)",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    targetUrl: "/services/painting",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "bathroom-deep-clean",
    badge: "Express pick",
    badgeBg: "#48073d",
    title: "Deep clean\nyour bathroom",
    subtitle: "Intense bathroom descaling",
    ctaText: "Book now",
    ctaTheme: "white",
    overlayGradient: "linear-gradient(90deg, #590d4b 0%, #590d4b 44%, rgba(89, 13, 75, 0.92) 62%, rgba(89, 13, 75, 0) 100%)",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    targetUrl: "/services/cleaning?item=bathroom-deep-clean",
    isActive: true,
    sortOrder: 5,
  },
];

export const initialCategorySections: CategorySectionData[] = [
  {
    id: "home-cleaning-pest",
    title: "Cleaning & Pest Control",
    subtitle: "Varanasi's top-rated deep cleaning, sofa shampoo & herbal disinfection",
    categorySlug: "cleaning",
    seeAllUrl: "/search?view=packages&category=Cleaning&categoryId=6a9e855fddcd6e3b74874759",
    isActive: true,
    sortOrder: 1,
    services: [
      { id: "deep-cleaning-lux", title: "Classic Deep Home Cleaning", image: "/hero-showcase.png", targetUrl: "/services/cleaning?item=deep-cleaning-lux" },
      { id: "bathroom-deep-clean", title: "Bathroom Deep Scrub", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/cleaning?item=bathroom-deep-clean" },
      { id: "sofa-shampoo-lux", title: "Sofa Shampoo & Sanitization", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/cleaning?item=sofa-shampoo-lux" },
      { id: "herbal-pest-control", title: "Ultra-Quiet Herbal Pest Control", image: "https://images.unsplash.com/photo-1587582423116-ec07293f0395?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/pest?item=herbal-pest-control" },
      { id: "kitchen-deep-clean", title: "Kitchen Degreasing & Clean", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/cleaning" },
      { id: "carpet-cleaning-lux", title: "Carpet Foam Extraction", image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/cleaning" },
      { id: "balcony-dusting", title: "Balcony & Window Dusting", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/cleaning" },
      { id: "mattress-sanitization", title: "Bed Mattress Sanitization", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/cleaning" },
      { id: "full-home-disinfection", title: "Full Home Disinfection", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/cleaning" },
    ],
  },
  {
    id: "ac-appliances",
    badge: "Cooling & Appliances",
    title: "AC & Appliance Repair",
    subtitle: "Doorstep diagnostic and repairs with 90-day HelpMate guarantee",
    categorySlug: "ac",
    seeAllUrl: "/search?view=packages&category=AC%20Servicessss&categoryId=6a6c8abe39a3352837da4c60",
    isActive: true,
    sortOrder: 2,
    services: [
      { id: "ac-jet-service", title: "Foam & Power Jet AC Service", image: "/ac-technician-promo.png", targetUrl: "/services/ac?item=ac-jet-service" },
      { id: "split-ac-gas-refill", title: "Split AC Gas Refill & Leak Fix", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/ac" },
      { id: "refrigerator-smart-repair", title: "Smart Refrigerator Repair", image: "https://images.unsplash.com/photo-1571175432247-fe063c762567?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/appliances?item=refrigerator-smart-repair" },
      { id: "washing-machine-repair", title: "Washing Machine Repair", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/appliances" },
      { id: "ro-water-purifier", title: "RO Water Purifier Service", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/appliances" },
      { id: "chimney-microwave", title: "Chimney & Microwave Repair", image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/appliances" },
      { id: "geyser-heater-service", title: "Geyser & Water Heater Service", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/appliances" },
      { id: "ac-install-uninstall", title: "AC Installation & Uninstallation", image: "/hero-showcase.png", targetUrl: "/services/ac" },
    ],
  },
  {
    id: "quick-home-repairs",
    badge: "Urgent 15-30 Min Visits",
    title: "Quick Home Repairs",
    subtitle: "Certified Electricians, Plumbers & Carpenters at your doorstep",
    categorySlug: "electrician",
    seeAllUrl: "/search?view=packages&category=Electrician&categoryId=6aa80cfec1c096e4af148660",
    isActive: true,
    sortOrder: 3,
    services: [
      { id: "smart-home-automation", title: "Smart Switch & Hub Setup", image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/electrician?item=smart-home-automation" },
      { id: "switchboard-repair", title: "Switchboard & Wiring Fix", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/electrician" },
      { id: "plumbing-smart-inspection", title: "Water Leakage Detection & Fix", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/plumbing?item=plumbing-smart-inspection" },
      { id: "tap-leakage-fix", title: "Tap Leakage & Valve Fix", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/plumbing" },
      { id: "modular-carpentry-fix", title: "Modular Cabinet Restoration", image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/carpentry?item=modular-carpentry-fix" },
      { id: "fan-light-fitting", title: "Ceiling Fan & Light Fitting", image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/electrician" },
      { id: "drain-unclogging", title: "Drain & Sink Unclogging", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/plumbing" },
      { id: "door-lock-fix", title: "Door Lock & Latch Fix", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/carpentry" },
      { id: "drill-wall-hanging", title: "Drill & Wall Hanging", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80", targetUrl: "/services/carpentry" },
    ],
  },
];

export const initialQuickServices: TrendingServiceCard[] = [
  {
    id: "quick-1",
    packageId: "quick-ac-jet",
    title: "Power Jet AC Service",
    category: "AC Repair & Service",
    durationMins: 45,
    rating: 4.9,
    reviewsCount: 142,
    description: "Deep power-jet coil flush, gas pressure check, and filter sanitization for rapid ice-cool airflow.",
    discountPercentage: "25% OFF",
    price: "599",
    originalPrice: "799",
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "quick-2",
    packageId: "quick-deep-clean",
    title: "Deep Home Clean",
    category: "Home Cleaning",
    durationMins: 180,
    rating: 4.95,
    reviewsCount: 218,
    description: "Complete living room, kitchen, and balcony deep sanitization with industrial vacuuming & stain treatment.",
    discountPercentage: "24% OFF",
    price: "1899",
    originalPrice: "2499",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "quick-3",
    packageId: "quick-switchboard",
    title: "Switchboard & Wiring Fix",
    category: "Electrician",
    durationMins: 30,
    rating: 4.88,
    reviewsCount: 89,
    description: "Fast fix for burned sockets, loose connections, short circuits, and MCB breaker tripping issues.",
    discountPercentage: "33% OFF",
    price: "199",
    originalPrice: "299",
    imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "quick-4",
    packageId: "quick-bathroom-clean",
    title: "Bathroom Deep Scrub",
    category: "Home Cleaning",
    durationMins: 60,
    rating: 4.86,
    reviewsCount: 110,
    description: "Intensive hard water scale removal, anti-fungal tile scrubbing, tap descaling, and high-shine mirror polish.",
    discountPercentage: "25% OFF",
    price: "449",
    originalPrice: "599",
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "quick-5",
    packageId: "quick-tap-leakage",
    title: "Tap Leakage & Valve Fix",
    category: "Plumber",
    durationMins: 30,
    rating: 4.84,
    reviewsCount: 76,
    description: "Quick replacement of dripping spindles, pipe washers, angle valves, and mixer cartridges.",
    discountPercentage: "40% OFF",
    price: "149",
    originalPrice: "249",
    imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services",
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "quick-6",
    packageId: "quick-sofa-shampoo",
    title: "Sofa Shampoo & Sanitization",
    category: "Home Cleaning",
    durationMins: 90,
    rating: 4.92,
    reviewsCount: 164,
    description: "Dry vacuuming followed by deep enzyme shampoo foam extraction to remove stubborn stains and allergens.",
    discountPercentage: "27% OFF",
    price: "799",
    originalPrice: "1099",
    imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services",
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "quick-7",
    packageId: "quick-ro-water",
    title: "RO Water Purifier Service",
    category: "Appliances",
    durationMins: 45,
    rating: 4.9,
    reviewsCount: 95,
    description: "Complete TDS check, sediment filter cleaning, carbon filter inspection, and pump pressure testing.",
    discountPercentage: "27% OFF",
    price: "399",
    originalPrice: "549",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services",
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "quick-8",
    packageId: "quick-drain-unclog",
    title: "Drain & Sink Unclogging",
    category: "Plumber",
    durationMins: 35,
    rating: 4.87,
    reviewsCount: 82,
    description: "High-pressure mechanical snake clearing for blocked kitchen sinks, bathroom floor traps, and drain pipes.",
    discountPercentage: "33% OFF",
    price: "299",
    originalPrice: "449",
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services",
    isActive: true,
    sortOrder: 8,
  },
];

export const initialZones: ZoneCard[] = [
  {
    id: "zone-1",
    name: "Lanka",
    city: "Varanasi",
    proCount: 120,
    imageUrl: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80",
    isActive: true,
    areas: [
      "Assi Ghat",
      "Lanka",
      "Durgakund",
      "Ravindrapuri",
      "BHU Campus",
      "Saket Nagar",
      "Samne Ghat",
      "Nagwa",
      "Jawahar Nagar",
      "Tulsipur",
      "Naria",
      "Sunderpur",
      "Karundi",
      "Chitaipur",
      "Newada",
    ],
    sortOrder: 1,
  },
  {
    id: "zone-2",
    name: "Godowlia",
    city: "Varanasi",
    proCount: 90,
    imageUrl: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80",
    isActive: true,
    areas: ["Godowlia", "Dashashwamedh", "Chowk", "Thatheri Bazar", "Kashi Vishwanath", "Bangali Tola", "Madanpura"],
    sortOrder: 2,
  },
  {
    id: "zone-3",
    name: "Cantonment",
    city: "Varanasi",
    proCount: 150,
    imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80",
    isActive: true,
    areas: ["Cantonment", "Nadesar", "Sigra", "Mahmoorganj", "Mint House", "Varuna Bridge", "Vidyapeeth"],
    sortOrder: 3,
  },
  {
    id: "zone-4",
    name: "Sigra",
    city: "Varanasi",
    proCount: 110,
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80",
    isActive: true,
    areas: ["Sigra", "Rath Yatra", "IP Mall Road", "Lallapura", "Siddhgiribagh"],
    sortOrder: 4,
  },
  {
    id: "zone-5",
    name: "Sarnath",
    city: "Varanasi",
    proCount: 80,
    imageUrl: "https://images.unsplash.com/photo-1609949279531-cf48d64bed89?w=800&auto=format&fit=crop&q=80",
    isActive: true,
    areas: ["Sarnath", "Dhamek Stupa", "Ashoka Pillar Area", "Mavaiya", "Hiramanpur"],
    sortOrder: 5,
  },
  {
    id: "zone-6",
    name: "Pandeypur",
    city: "Varanasi",
    proCount: 70,
    imageUrl: "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=800&auto=format&fit=crop&q=80",
    isActive: true,
    areas: ["Pandeypur", "Azamgarh Road", "Paharia", "Premchand Nagar", "Khajuri"],
    sortOrder: 6,
  },
];

export const initialServiceCards: ServiceCard[] = [
  { id: "svc-1", title: "Elite Deep Cleaning", description: "Full-home sanitisation using industrial hydro-pressure equipment.", imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80", price: "₹999", category: "Cleaning", isActive: true, sortOrder: 1 },
  { id: "svc-2", title: "AC Foam-Jet Service", description: "Power-Jet deep foam cleaning, filter wash & gas check.", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80", price: "₹399", category: "Appliance", isActive: true, sortOrder: 2 },
  { id: "svc-3", title: "Home Salon & Spa", description: "Premium salon treatments at home — facial, waxing, hair spa.", imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80", price: "₹599", category: "Beauty", isActive: true, sortOrder: 3 },
];

export const initialTrendingServices: TrendingServiceCard[] = [
  {
    id: "trend-1",
    title: "Luxury Interior Concept & Moodboard Design",
    category: "Interior",
    durationMins: 180,
    rating: 4.96,
    reviewsCount: 110,
    description: "Consult with gold-medalist interior architects. Receive a 3D moodboard, color palette mapping, and material selection breakdown.",
    discountPercentage: "28% OFF",
    price: "1999",
    originalPrice: "2799",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services/interior",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "trend-2",
    title: "White-Glove Bubble-Wrapped Villa Packers & Movers",
    category: "Moving",
    durationMins: 300,
    rating: 4.88,
    reviewsCount: 290,
    description: "Includes 3-layered bubble wrap, cardboard boxes, customized wooden crating for delicate items & dedicated supervisor.",
    discountPercentage: "28% OFF",
    price: "2499",
    originalPrice: "3499",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services/moving",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "trend-3",
    title: "Classic Deep Home Cleaning",
    category: "Cleaning",
    durationMins: 240,
    rating: 4.92,
    reviewsCount: 1240,
    description: "Our signature, multi-room deep cleaning service. Covers every square inch of your home including kitchen, bathrooms & balcony.",
    discountPercentage: "24% OFF",
    price: "1899",
    originalPrice: "2499",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services/cleaning",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "trend-4",
    title: "Foam & Power Jet AC Service",
    category: "Ac",
    durationMins: 60,
    rating: 4.88,
    reviewsCount: 890,
    description: "Revolutionary high-pressure foam cleaning that penetrates deep split AC coils. Removes 2x more dirt & improves cooling.",
    discountPercentage: "25% OFF",
    price: "599",
    originalPrice: "799",
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services/ac",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "trend-5",
    title: "Luxury Facial & Hair Spa Combo",
    category: "Beauty",
    durationMins: 120,
    rating: 4.96,
    reviewsCount: 2310,
    description: "Pamper yourself with our flagship beauty combo. Includes an organic deep-glow facial and nourishing hot-oil hair spa treatment.",
    discountPercentage: "28% OFF",
    price: "2499",
    originalPrice: "3499",
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80",
    bookCtaText: "Book Now →",
    bookCtaLink: "/services/beauty",
    isActive: true,
    sortOrder: 5,
  },
];
