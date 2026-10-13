"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  Users,
  X,
  Save,
  Layers,
  Search,
  GripVertical,
  Globe,
  CheckCircle2,
  Camera,
  Flame,
  ChevronRight,
  FileText,
  TrendingUp,
  Star,
  Clock,
  Heart,
  Tag,
  Upload,
  Loader2,
  Zap,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { initialServices, ServiceItem } from "@/lib/mockData";
import {
  getAdminTrendingPackagesApi,
  getTrendingCatalogPackagesApi,
  addTrendingPackageApi,
  removeTrendingPackageApi,
  ApiTrendingPackage,
  ApiTrendingCatalogItem,
  getAdminQuickServicesApi,
  updateAdminQuickServicesApi,
  ApiQuickServiceItem,
  getWebsiteZonesApi,
  addWebsiteZoneApi,
  updateWebsiteZoneApi,
  deleteWebsiteZoneApi,
  ApiWebsiteZone,
  formatImageUrl,
} from "@/lib/api";

interface ZoneCard {
  id: string;
  name: string;
  city: string;
  proCount: number;
  imageUrl: string;
  isActive: boolean;
  areas: string[];
  sortOrder: number;
}



interface ServiceCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

interface TrendingServiceCard {
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

interface WhereWeServeHeader {
  badge: string;
  title: string;
  subtitle: string;
}

interface TrendingHeader {
  badge: string;
  title: string;
  subtitle: string;
  viewAllText: string;
  viewAllLink: string;
}

interface QuickHeader {
  badge: string;
  title: string;
  subtitle: string;
  viewAllText: string;
  viewAllLink: string;
}

const initialWhereWeServeHeader: WhereWeServeHeader = {
  badge: "WHERE WE SERVE",
  title: "Varanasi's Neighborhoods We Cover",
  subtitle: "Book background-verified, uniformed professionals across active Varanasi municipal zones. Select a zone below to explore the direct areas we support.",
};

const initialTrendingHeader: TrendingHeader = {
  badge: "STEP 3: BEST SELLERS",
  title: "Trending Services This Week",
  subtitle: "Our most popular deep cleaning and home repair bundles booked by Varanasi residents this week.",
  viewAllText: "View all trending packages →",
  viewAllLink: "/services",
};

const initialQuickHeader: QuickHeader = {
  badge: "QUICK SERVICES",
  title: "Instant 15–30 Min Doorstep Services",
  subtitle: "Fast-dispatch verified technicians for urgent home repairs, deep cleaning, and appliance fixes across Varanasi.",
  viewAllText: "Explore all quick services →",
  viewAllLink: "/services",
};

const initialQuickServices: TrendingServiceCard[] = [
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

const initialZones: ZoneCard[] = [
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



const initialServiceCards: ServiceCard[] = [
  { id: "svc-1", title: "Elite Deep Cleaning", description: "Full-home sanitisation using industrial hydro-pressure equipment.", imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80", price: "₹999", category: "Cleaning", isActive: true, sortOrder: 1 },
  { id: "svc-2", title: "AC Foam-Jet Service", description: "Power-Jet deep foam cleaning, filter wash & gas check.", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80", price: "₹399", category: "Appliance", isActive: true, sortOrder: 2 },
  { id: "svc-3", title: "Home Salon & Spa", description: "Premium salon treatments at home — facial, waxing, hair spa.", imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80", price: "₹599", category: "Beauty", isActive: true, sortOrder: 3 },
];

const initialTrendingServices: TrendingServiceCard[] = [
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

type TabType = "zones" | "trending" | "quick";

export default function ImageSectionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("zones");
  const [searchQuery, setSearchQuery] = useState("");
  const [zones, setZones] = useState<ZoneCard[]>(initialZones);
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>(initialServiceCards);
  const [trendingServices, setTrendingServices] = useState<TrendingServiceCard[]>([]);
  const [quickServices, setQuickServices] = useState<TrendingServiceCard[]>([]);
  const [isZonesLoading, setIsZonesLoading] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogPackages, setCatalogPackages] = useState<ApiTrendingCatalogItem[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const fetchZones = async () => {
    setIsZonesLoading(true);
    try {
      const res = await getWebsiteZonesApi({ forceRefresh: true });
      if (res && res.success && Array.isArray(res.data)) {
        const mapped: ZoneCard[] = res.data.map((item: ApiWebsiteZone, index: number) => ({
          id: item._id,
          name: item.zoneName,
          city: item.city,
          proCount: item.proCount || 0,
          imageUrl: formatImageUrl(item.imageUrl) || "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80",
          isActive: item.status ?? true,
          areas: item.areasCovered || [],
          sortOrder: item.sortOrder ?? index + 1,
        }));
        setZones(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch website zones:", err);
    } finally {
      setIsZonesLoading(false);
    }
  };

  const fetchTrendingPackages = async () => {
    setIsTrendingLoading(true);
    try {
      const res = await getAdminTrendingPackagesApi(true);
      if (res && res.success && Array.isArray(res.data)) {
        const mapped: TrendingServiceCard[] = res.data.map((item: ApiTrendingPackage, index: number) => {
          const pkg = typeof item.packageId === "object" ? item.packageId : null;
          const pkgId = pkg ? pkg._id : (typeof item.packageId === "string" ? item.packageId : item._id);
          const originalPrice = pkg?.originalPrice ?? 0;
          const price = pkg?.price ?? 0;
          const discountPercentage =
            originalPrice > price && originalPrice > 0
              ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`
              : "BESTSELLER";

          return {
            id: item._id,
            packageId: pkgId,
            title: pkg?.packageName || "Trending Package",
            category: pkg?.subtitle || "Trending Service",
            durationMins: pkg?.duration || 60,
            rating: 4.9,
            reviewsCount: 120,
            description: pkg?.description || pkg?.subtitle || "",
            discountPercentage,
            price: String(price),
            originalPrice: String(originalPrice),
            imageUrl: formatImageUrl(pkg?.imageUrl || pkg?.thumbnailUrl) || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80",
            bookCtaText: "Book Now →",
            bookCtaLink: "/services",
            isActive: item.status ?? true,
            sortOrder: item.displayOrder ?? index + 1,
          };
        });
        setTrendingServices(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch trending packages:", err);
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const fetchCatalogPackages = async (search: string = "") => {
    setIsCatalogLoading(true);
    try {
      const res = await getTrendingCatalogPackagesApi({ search, limit: 50 });
      if (res && res.success && Array.isArray(res.data)) {
        setCatalogPackages(res.data);
      } else {
        setCatalogPackages([]);
      }
    } catch (err) {
      console.error("Failed to fetch catalog packages:", err);
      setCatalogPackages([]);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const fetchQuickServices = async () => {
    setIsQuickLoading(true);
    try {
      const res = await getAdminQuickServicesApi(true);
      if (res && res.success && Array.isArray(res.data)) {
        let catalogList: ApiTrendingCatalogItem[] = catalogPackages;
        if (!catalogList || catalogList.length === 0) {
          const catRes = await getTrendingCatalogPackagesApi({ limit: 100 });
          if (catRes && catRes.success && Array.isArray(catRes.data)) {
            catalogList = catRes.data;
            setCatalogPackages(catRes.data);
          }
        }
        const catalogMap = new Map((catalogList || []).map((c) => [c.packageId, c]));

        const mapped: TrendingServiceCard[] = res.data.map((item: ApiQuickServiceItem, index: number) => {
          const pkgId = item.packageId;
          const catItem = catalogMap.get(pkgId);
          const originalPrice = catItem?.originalPrice || item.price || 0;
          const price = item.price || 0;
          const discountPercentage =
            originalPrice > price && originalPrice > 0
              ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`
              : "EXPRESS";

          return {
            id: pkgId,
            packageId: pkgId,
            title: item.packageName || catItem?.packageName || "Quick Service",
            category: catItem?.category?.name || "Quick Service",
            durationMins: catItem?.duration || 30,
            rating: 4.9,
            reviewsCount: 100,
            description: `Express 15-30 min doorstep service for ${item.packageName || catItem?.packageName || "this package"}.`,
            discountPercentage,
            price: String(price),
            originalPrice: String(originalPrice),
            imageUrl: formatImageUrl(catItem?.imageUrl || catItem?.thumbnailUrl) || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
            bookCtaText: "Book Now →",
            bookCtaLink: "/services",
            isActive: true,
            sortOrder: index + 1,
          };
        });
        setQuickServices(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch quick services:", err);
    } finally {
      setIsQuickLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "zones") {
      fetchZones();
    } else if (activeTab === "trending") {
      fetchTrendingPackages();
    } else if (activeTab === "quick") {
      fetchQuickServices();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isCatalogPickerOpen) {
      const timer = setTimeout(() => {
        fetchCatalogPackages(catalogSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCatalogPickerOpen, catalogSearch]);

  const handleAddPackageToTrending = async (packageId: string) => {
    try {
      const res = await addTrendingPackageApi(packageId);
      if (res && res.success) {
        await fetchTrendingPackages();
      } else {
        alert(res?.message || "Failed to add package to trending.");
      }
    } catch (err) {
      console.error("Error adding package to trending:", err);
    }
  };

  const handleRemovePackageFromTrending = async (packageId: string) => {
    try {
      const res = await removeTrendingPackageApi(packageId);
      if (res && res.success) {
        await fetchTrendingPackages();
      } else {
        alert(res?.message || "Failed to remove package from trending.");
      }
    } catch (err) {
      console.error("Error removing package from trending:", err);
    }
  };

  const [serveHeader, setServeHeader] = useState<WhereWeServeHeader>(initialWhereWeServeHeader);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerDraft, setHeaderDraft] = useState<WhereWeServeHeader>(initialWhereWeServeHeader);

  const [trendingHeader, setTrendingHeader] = useState<TrendingHeader>(initialTrendingHeader);
  const [editingTrendingHeader, setEditingTrendingHeader] = useState(false);
  const [trendingHeaderDraft, setTrendingHeaderDraft] = useState<TrendingHeader>(initialTrendingHeader);

  const [quickHeader, setQuickHeader] = useState<QuickHeader>(initialQuickHeader);
  const [editingQuickHeader, setEditingQuickHeader] = useState(false);
  const [quickHeaderDraft, setQuickHeaderDraft] = useState<QuickHeader>(initialQuickHeader);

  const [previewZone, setPreviewZone] = useState<ZoneCard | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; type: TabType; name: string } | null>(null);

  const [zoneModal, setZoneModal] = useState<{ open: boolean; mode: "add" | "edit"; data: Partial<ZoneCard>; file?: File | null }>({ open: false, mode: "add", data: {} });
  const [serviceModal, setServiceModal] = useState<{ open: boolean; mode: "add" | "edit"; data: Partial<ServiceCard> }>({ open: false, mode: "add", data: {} });
  const [trendingModal, setTrendingModal] = useState<{ open: boolean; mode: "add" | "edit"; data: Partial<TrendingServiceCard> }>({ open: false, mode: "add", data: {} });

  const saveZone = async () => {
    const d = zoneModal.data;
    if (!d.name) {
      alert("Zone name is required.");
      return;
    }
    if (!d.city) {
      alert("City is required.");
      return;
    }

    const formData = new FormData();
    formData.append("zoneName", d.name);
    formData.append("city", d.city);
    formData.append("proCount", String(d.proCount || 0));
    formData.append("sortOrder", String(d.sortOrder || 1));
    formData.append("areasCovered", (d.areas || []).join(", "));
    formData.append("status", String(d.isActive ?? true));

    if (zoneModal.file) {
      formData.append("image", zoneModal.file);
    }

    try {
      if (zoneModal.mode === "add") {
        if (!zoneModal.file) {
          alert("Zone image file is required.");
          return;
        }
        const res = await addWebsiteZoneApi(formData);
        if (res && res.success) {
          await fetchZones();
          setZoneModal({ open: false, mode: "add", data: {}, file: null });
        } else {
          alert(res?.message || "Failed to add zone.");
        }
      } else {
        if (!d.id) return;
        const res = await updateWebsiteZoneApi(d.id, formData);
        if (res && res.success) {
          await fetchZones();
          setZoneModal({ open: false, mode: "add", data: {}, file: null });
        } else {
          alert(res?.message || "Failed to update zone.");
        }
      }
    } catch (err) {
      console.error("Error saving zone:", err);
    }
  };

  const saveService = () => {
    const d = serviceModal.data;
    if (!d.title || !d.imageUrl) return;
    if (serviceModal.mode === "add") {
      setServiceCards([...serviceCards, { id: `svc-${Date.now()}`, title: d.title!, description: d.description || "", imageUrl: d.imageUrl!, price: d.price || "", category: d.category || "", isActive: d.isActive ?? true, sortOrder: d.sortOrder || serviceCards.length + 1 }]);
    } else {
      setServiceCards(serviceCards.map((s) => s.id === d.id ? { ...s, ...d } as ServiceCard : s));
    }
    setServiceModal({ open: false, mode: "add", data: {} });
  };

  const saveTrending = () => {
    const d = trendingModal.data;
    if (!d.title || !d.imageUrl) return;
    if (trendingModal.mode === "add") {
      const newTrending: TrendingServiceCard = {
        id: `trend-${Date.now()}`,
        title: d.title!,
        category: d.category || "General",
        durationMins: d.durationMins || 60,
        rating: d.rating || 4.9,
        reviewsCount: d.reviewsCount || 100,
        description: d.description || "",
        discountPercentage: d.discountPercentage || "20% OFF",
        price: d.price || "999",
        originalPrice: d.originalPrice || "1499",
        imageUrl: d.imageUrl!,
        bookCtaText: d.bookCtaText || "Book Now →",
        bookCtaLink: d.bookCtaLink || "/services",
        isActive: d.isActive ?? true,
        sortOrder: d.sortOrder || trendingServices.length + 1,
      };
      setTrendingServices([...trendingServices, newTrending]);
    } else {
      setTrendingServices(trendingServices.map((t) => t.id === d.id ? { ...t, ...d } as TrendingServiceCard : t));
    }
    setTrendingModal({ open: false, mode: "add", data: {} });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    if (deleteModal.type === "zones") {
      try {
        const res = await deleteWebsiteZoneApi(deleteModal.id);
        if (res && res.success) {
          await fetchZones();
        } else {
          alert(res?.message || "Failed to delete zone.");
        }
      } catch (err) {
        console.error("Error deleting zone:", err);
      }
    }
    if (deleteModal.type === "trending") {
      const item = trendingServices.find((t) => t.id === deleteModal.id || t.packageId === deleteModal.id);
      const targetPkgId = item?.packageId || deleteModal.id;
      await handleRemovePackageFromTrending(targetPkgId);
    }
    if (deleteModal.type === "quick") {
      const item = quickServices.find((q) => q.id === deleteModal.id || q.packageId === deleteModal.id);
      const targetPkgId = item?.packageId || deleteModal.id;
      await handleRemovePackageFromQuickServices(targetPkgId);
    }
    setDeleteModal(null);
  };

  const saveServeHeader = () => {
    setServeHeader(headerDraft);
    setEditingHeader(false);
  };

  const saveTrendingHeader = () => {
    setTrendingHeader(trendingHeaderDraft);
    setEditingTrendingHeader(false);
  };

  const saveQuickHeader = () => {
    setQuickHeader(quickHeaderDraft);
    setEditingQuickHeader(false);
  };

  const handleAddPackageToQuickServices = async (catItem: ApiTrendingCatalogItem) => {
    const currentPkgIds = quickServices.map((q) => q.packageId || q.id).filter(Boolean);
    if (currentPkgIds.includes(catItem.packageId)) return;
    if (currentPkgIds.length >= 6) {
      alert("Maximum 6 quick services are allowed.");
      return;
    }

    try {
      const updatedIds = [...currentPkgIds, catItem.packageId];
      const res = await updateAdminQuickServicesApi(updatedIds);
      if (res && res.success) {
        await fetchQuickServices();
      } else {
        alert(res?.message || "Failed to add package to quick services.");
      }
    } catch (err) {
      console.error("Error adding package to quick services:", err);
    }
  };

  const handleRemovePackageFromQuickServices = async (packageId: string) => {
    try {
      const currentPkgIds = quickServices
        .map((q) => q.packageId || q.id)
        .filter((id) => id && id !== packageId);
      const res = await updateAdminQuickServicesApi(currentPkgIds);
      if (res && res.success) {
        await fetchQuickServices();
      } else {
        alert(res?.message || "Failed to remove package from quick services.");
      }
    } catch (err) {
      console.error("Error removing package from quick services:", err);
    }
  };

  const filteredZones = zones.filter((z) => !searchQuery || z.name.toLowerCase().includes(searchQuery.toLowerCase()) || z.city.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredServices = serviceCards.filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTrending = trendingServices.filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredQuick = quickServices.filter((q) => !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.category.toLowerCase().includes(searchQuery.toLowerCase()));

  const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500";

  const tabs: { id: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { id: "zones", label: "Where We Serve (Zones)", icon: MapPin, count: zones.length },
    { id: "trending", label: "Trending Best Sellers", icon: Flame, count: trendingServices.length },
    { id: "quick", label: "Quick Services", icon: Zap, count: quickServices.length },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Camera className="w-6 h-6 text-brand-600" />
            <span>Website Sections CMS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage neighborhood zones and trending best-seller packages shown on your website.
          </p>
        </div>
      </div>

      {/* TAB NAV + SEARCH + ADD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${active ? "bg-brand-600 text-white shadow-md font-black" : "text-slate-500 hover:text-slate-700"}`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 w-44" />
          </div>
          <button type="button"
            onClick={() => {
              if (activeTab === "zones") setZoneModal({ open: true, mode: "add", data: { name: "", city: "Varanasi", proCount: 0, imageUrl: "", isActive: true, areas: [], sortOrder: zones.length + 1 } });
              else setIsCatalogPickerOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors shrink-0">
            <Plus className="w-3.5 h-3.5" />
            {activeTab === "zones" ? "Add Zone" : activeTab === "quick" ? "Select Quick Service" : "Select Service from Catalog"}
          </button>
        </div>
      </div>

      {/* TAB 1: WHERE WE SERVE (NEIGHBORHOOD ZONES) */}
      {activeTab === "zones" && (
        <div className="space-y-6">

          {/* SECTION HEADER TEXT EDITOR */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-black text-sm text-slate-900 dark:text-white">Section Header Text</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">— controls badge, title, and subtitle of Where We Serve on the website</span>
              </div>
              {!editingHeader ? (
                <button type="button" onClick={() => { setHeaderDraft(serveHeader); setEditingHeader(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-600 cursor-pointer transition-colors">
                  <Edit2 className="w-3 h-3" /> Edit Section Text
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingHeader(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-pointer transition-colors">Cancel</button>
                  <button type="button" onClick={saveServeHeader}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer transition-colors">
                    <Save className="w-3 h-3" />Save
                  </button>
                </div>
              )}
            </div>

            {!editingHeader ? (
              <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Badge Text</p>
                  <span className="text-xs font-extrabold bg-purple-900 text-white px-2 py-0.5 rounded uppercase tracking-wider">{serveHeader.badge}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Section Title</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{serveHeader.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Subtitle</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{serveHeader.subtitle}</p>
                </div>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Badge Text</label>
                  <input type="text" value={headerDraft.badge} onChange={(e) => setHeaderDraft({ ...headerDraft, badge: e.target.value })} className={inputCls} placeholder="WHERE WE SERVE" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Section Title</label>
                  <input type="text" value={headerDraft.title} onChange={(e) => setHeaderDraft({ ...headerDraft, title: e.target.value })} className={inputCls} placeholder="Varanasi's Neighborhoods We Cover" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subtitle</label>
                  <input type="text" value={headerDraft.subtitle} onChange={(e) => setHeaderDraft({ ...headerDraft, subtitle: e.target.value })} className={inputCls} placeholder="Book background-verified..." />
                </div>
              </div>
            )}
          </div>

          {/* ADMIN CARDS EDIT GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Neighborhood Zone Cards ({zones.length})
              </h3>
            </div>

            {isZonesLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-brand-600" />
                <span className="text-xs font-bold">Loading website zones...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredZones.map((zone) => (
                  <div key={zone.id} className={`rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all ${zone.isActive ? "border-slate-200 dark:border-slate-700" : "border-dashed border-slate-300 dark:border-slate-700 opacity-60"}`}>
                    <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={formatImageUrl(zone.imageUrl) || "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80"}
                        alt={zone.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80";
                        }}
                      />
                      <div className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full ${zone.isActive ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}>{zone.isActive ? "LIVE" : "HIDDEN"}</div>
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><GripVertical className="w-2.5 h-2.5" />#{zone.sortOrder}</div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white">{zone.name}</h3>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-brand-600" />{zone.city}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{zone.proCount} Pros</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{zone.areas.length} Areas</span>
                      </div>
                      {zone.areas.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {zone.areas.slice(0, 4).map((a) => (
                            <span key={a} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md">{a}</span>
                          ))}
                          {zone.areas.length > 4 && <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-600 px-1.5 py-0.5 rounded-md">+{zone.areas.length - 4}</span>}
                        </div>
                      )}
                    </div>
                    <div className="px-3 pb-3 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button type="button" onClick={() => setPreviewZone(zone)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => setZoneModal({ open: true, mode: "edit", data: { ...zone } })} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-600 transition-colors cursor-pointer" title="Edit Zone"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={async () => {
                        const nextStatus = !zone.isActive;
                        const formData = new FormData();
                        formData.append("status", String(nextStatus));
                        const res = await updateWebsiteZoneApi(zone.id, formData);
                        if (res && res.success) {
                          await fetchZones();
                        } else {
                          alert(res?.message || "Failed to update zone status.");
                        }
                      }} className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${zone.isActive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{zone.isActive ? "Live" : "Hidden"}</button>
                      <button type="button" onClick={() => setDeleteModal({ open: true, id: zone.id, type: "zones", name: zone.name })} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 transition-colors cursor-pointer ml-auto" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setZoneModal({ open: true, mode: "add", data: { name: "", city: "Varanasi", proCount: 0, imageUrl: "", isActive: true, areas: [], sortOrder: zones.length + 1 }, file: null })} className="rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 h-64 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center"><Plus className="w-5 h-5 text-purple-600" /></div>
                  <span className="text-xs font-bold text-purple-600">Add New Zone</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRENDING SERVICES (BEST SELLERS) */}
      {activeTab === "trending" && (
        <div className="space-y-6">

          {/* SECTION HEADER TEXT EDITOR */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-black text-sm text-slate-900 dark:text-white">Section Header Text</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">— controls badge, title, subtitle, and view all link of Trending Services on website</span>
              </div>
              {!editingTrendingHeader ? (
                <button type="button" onClick={() => { setTrendingHeaderDraft(trendingHeader); setEditingTrendingHeader(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-600 cursor-pointer transition-colors">
                  <Edit2 className="w-3 h-3" /> Edit Section Text
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingTrendingHeader(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-pointer transition-colors">Cancel</button>
                  <button type="button" onClick={saveTrendingHeader}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer transition-colors">
                    <Save className="w-3 h-3" />Save
                  </button>
                </div>
              )}
            </div>

            {!editingTrendingHeader ? (
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Badge Text</p>
                  <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider">{trendingHeader.badge}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Section Title</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{trendingHeader.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Subtitle</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-1">{trendingHeader.subtitle}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">View All Link</p>
                  <span className="text-xs font-bold text-brand-600">{trendingHeader.viewAllText}</span>
                </div>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Badge Text</label>
                  <input type="text" value={trendingHeaderDraft.badge} onChange={(e) => setTrendingHeaderDraft({ ...trendingHeaderDraft, badge: e.target.value })} className={inputCls} placeholder="STEP 3: BEST SELLERS" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Section Title</label>
                  <input type="text" value={trendingHeaderDraft.title} onChange={(e) => setTrendingHeaderDraft({ ...trendingHeaderDraft, title: e.target.value })} className={inputCls} placeholder="Trending Services This Week" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subtitle</label>
                  <input type="text" value={trendingHeaderDraft.subtitle} onChange={(e) => setTrendingHeaderDraft({ ...trendingHeaderDraft, subtitle: e.target.value })} className={inputCls} placeholder="Our most popular deep cleaning..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">View All Button Text</label>
                  <input type="text" value={trendingHeaderDraft.viewAllText} onChange={(e) => setTrendingHeaderDraft({ ...trendingHeaderDraft, viewAllText: e.target.value })} className={inputCls} placeholder="View all trending packages →" />
                </div>
                </div>
            )}
          </div>

          {/* ADMIN CARDS EDIT GRID & SELECTION */}
          <div className="space-y-4">
            {isTrendingLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-brand-600" />
                <span className="text-xs font-bold">Loading trending packages from backend...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTrending.map((item) => (
                  <div key={item.id} className={`rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all ${item.isActive ? "border-slate-200 dark:border-slate-700" : "border-dashed border-slate-300 dark:border-slate-700 opacity-60"}`}>
                    <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={formatImageUrl(item.imageUrl) || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80";
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{item.discountPercentage}</div>
                      <div className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full ${item.isActive ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}>{item.isActive ? "LIVE" : "HIDDEN"}</div>
                    </div>

                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>{item.category} • {item.durationMins} mins</span>
                        <span className="text-amber-500 font-bold">★ {item.rating}</span>
                      </div>

                      <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{item.description}</p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-black text-xs text-purple-600 dark:text-purple-400">₹{item.price} <span className="text-slate-400 line-through text-[10px]">₹{item.originalPrice}</span></span>
                        <span className="text-[10px] text-slate-400 font-mono">Rank #{item.sortOrder}</span>
                      </div>
                    </div>

                    <div className="px-3 pb-3 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button type="button" onClick={() => setTrendingServices(trendingServices.map((t) => t.id === item.id ? { ...t, isActive: !t.isActive } : t))} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${item.isActive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{item.isActive ? "Live" : "Hidden"}</button>
                      <button type="button" onClick={() => setDeleteModal({ open: true, id: item.id, type: "trending", name: item.title })} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer text-[10px] font-extrabold ml-auto flex items-center gap-1" title="Remove from Trending"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={() => setIsCatalogPickerOpen(true)} className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 h-56 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-500 hover:bg-amber-100/50 transition-all text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lux">
                    <Flame className="w-6 h-6 fill-white" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">Select Service from Catalog</span>
                  <span className="text-[10px] font-semibold text-slate-500 max-w-[180px]">Pick any service from Catalog to add to Trending</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: QUICK SERVICES */}
      {activeTab === "quick" && (
        <div className="space-y-6">

          {/* SECTION HEADER TEXT EDITOR */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span className="font-black text-sm text-slate-900 dark:text-white">Section Header Text</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">— controls badge, title, subtitle, and view all link of Quick Services on website</span>
              </div>
              {!editingQuickHeader ? (
                <button type="button" onClick={() => { setQuickHeaderDraft(quickHeader); setEditingQuickHeader(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-600 cursor-pointer transition-colors">
                  <Edit2 className="w-3 h-3" /> Edit Section Text
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingQuickHeader(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-pointer transition-colors">Cancel</button>
                  <button type="button" onClick={saveQuickHeader}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer transition-colors">
                    <Save className="w-3 h-3" />Save
                  </button>
                </div>
              )}
            </div>

            {!editingQuickHeader ? (
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Badge Text</p>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{quickHeader.badge}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Section Title</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{quickHeader.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Subtitle</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-1">{quickHeader.subtitle}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">View All Link</p>
                  <span className="text-xs font-bold text-brand-600">{quickHeader.viewAllText}</span>
                </div>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Badge Text</label>
                  <input type="text" value={quickHeaderDraft.badge} onChange={(e) => setQuickHeaderDraft({ ...quickHeaderDraft, badge: e.target.value })} className={inputCls} placeholder="QUICK SERVICES" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Section Title</label>
                  <input type="text" value={quickHeaderDraft.title} onChange={(e) => setQuickHeaderDraft({ ...quickHeaderDraft, title: e.target.value })} className={inputCls} placeholder="Instant 15-30 Min Doorstep Services" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subtitle</label>
                  <input type="text" value={quickHeaderDraft.subtitle} onChange={(e) => setQuickHeaderDraft({ ...quickHeaderDraft, subtitle: e.target.value })} className={inputCls} placeholder="Fast-dispatch verified technicians..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">View All Button Text</label>
                  <input type="text" value={quickHeaderDraft.viewAllText} onChange={(e) => setQuickHeaderDraft({ ...quickHeaderDraft, viewAllText: e.target.value })} className={inputCls} placeholder="Explore all quick services →" />
                </div>
              </div>
            )}
          </div>

          {/* ADMIN CARDS EDIT GRID & SELECTION FOR QUICK SERVICES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quick Service Packages ({quickServices.length}/6)
                </span>
                {quickServices.length >= 6 ? (
                  <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Max 6/6 Slots Filled
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {6 - quickServices.length} Slots Available
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(true)}
                disabled={quickServices.length >= 6}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  quickServices.length >= 6
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100/80 cursor-pointer"
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>+ Pick From Catalog</span>
              </button>
            </div>

            {isQuickLoading ? (
              <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" />
                <span className="text-xs font-bold text-slate-500">Loading quick services...</span>
              </div>
            ) : quickServices.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                  <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">No Quick Services Configured</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Pick up to 6 express doorstep packages from your service catalog to display in the Quick Services section.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCatalogPickerOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Select from Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuick.map((item, idx) => (
                  <div key={item.id || item.packageId || idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                    <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={formatImageUrl(item.imageUrl) || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80";
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        {item.discountPercentage}
                      </div>
                      <div className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">LIVE</div>
                    </div>

                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>{item.category} • {item.durationMins} mins</span>
                        <span className="text-amber-500 font-bold">★ {item.rating}</span>
                      </div>

                      <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{item.description}</p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-black text-xs text-brand-600 dark:text-brand-400">₹{item.price} {item.originalPrice && Number(item.originalPrice) > Number(item.price) && <span className="text-slate-400 line-through text-[10px]">₹{item.originalPrice}</span>}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Slot #{item.sortOrder || idx + 1}</span>
                      </div>
                    </div>

                    <div className="px-3 pb-3 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ open: true, id: item.packageId || item.id, type: "quick", name: item.title })}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer text-[10px] font-extrabold ml-auto flex items-center gap-1"
                        title="Remove from Quick Services"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}

                {quickServices.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setIsCatalogPickerOpen(true)}
                    className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 h-56 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-500 hover:bg-amber-100/50 transition-all text-center p-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lux">
                      <Zap className="w-6 h-6 fill-white" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">Select Quick Service from Catalog</span>
                    <span className="text-[10px] font-semibold text-slate-500 max-w-[180px]">
                      {6 - quickServices.length} more express slots available
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}





      {/* ZONE PREVIEW MODAL */}
      {previewZone && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="relative h-52 bg-slate-200">
                <img
                  src={formatImageUrl(previewZone.imageUrl) || "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80"}
                  alt={previewZone.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button type="button" onClick={() => setPreviewZone(null)} className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-1.5 cursor-pointer hover:bg-black/60 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h2 className="font-black text-lg text-slate-900 dark:text-white">{previewZone.name}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{previewZone.city}</p>
                </div>
                <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-purple-500" /><span className="font-bold text-slate-700 dark:text-slate-300">{previewZone.proCount} Pros</span></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Areas Covered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewZone.areas.map((a) => (
                      <span key={a} className="text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800 px-2 py-0.5 rounded-lg">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* TRENDING SERVICE MODAL */}
      {trendingModal.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-black text-slate-900 dark:text-white text-base">{trendingModal.mode === "add" ? "Add Trending Package" : "Edit Trending Package"}</h2>
                <button type="button" onClick={() => setTrendingModal({ open: false, mode: "add", data: {} })} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>

              <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Package Image URL *</label>
                  <input type="url" placeholder="https://..." value={trendingModal.data.imageUrl || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, imageUrl: e.target.value } })} className={inputCls} />
                  {trendingModal.data.imageUrl && (
                    <img
                      src={formatImageUrl(trendingModal.data.imageUrl)}
                      alt="preview"
                      className="mt-2 w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Title *</label>
                    <input type="text" placeholder="e.g. Classic Deep Home Cleaning" value={trendingModal.data.title || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, title: e.target.value } })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                    <input type="text" placeholder="e.g. Cleaning" value={trendingModal.data.category || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, category: e.target.value } })} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Duration (mins)</label>
                    <input type="number" placeholder="240" value={trendingModal.data.durationMins || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, durationMins: Number(e.target.value) } })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Rating (★)</label>
                    <input type="number" step="0.01" placeholder="4.92" value={trendingModal.data.rating || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, rating: Number(e.target.value) } })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Reviews Count</label>
                    <input type="number" placeholder="1240" value={trendingModal.data.reviewsCount || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, reviewsCount: Number(e.target.value) } })} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Offer Badge</label>
                    <input type="text" placeholder="24% OFF" value={trendingModal.data.discountPercentage || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, discountPercentage: e.target.value } })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Discount Price (₹)</label>
                    <input type="text" placeholder="1899" value={trendingModal.data.price || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, price: e.target.value } })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Original Price (₹)</label>
                    <input type="text" placeholder="2499" value={trendingModal.data.originalPrice || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, originalPrice: e.target.value } })} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                  <textarea rows={3} placeholder="Our signature, multi-room deep cleaning..." value={trendingModal.data.description || ""} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, description: e.target.value } })} className={`${inputCls} resize-none`} />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="trend-active" checked={trendingModal.data.isActive ?? true} onChange={(e) => setTrendingModal({ ...trendingModal, data: { ...trendingModal.data, isActive: e.target.checked } })} className="w-4 h-4 rounded accent-purple-600 cursor-pointer" />
                  <label htmlFor="trend-active" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Show on website (Live)</label>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setTrendingModal({ open: false, mode: "add", data: {} })} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors">Cancel</button>
                <button type="button" onClick={saveTrending} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"><Save className="w-3.5 h-3.5" />Save Package</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ZONE MODAL */}
      {zoneModal.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-black text-slate-900 dark:text-white text-base">{zoneModal.mode === "add" ? "Add Neighborhood Zone" : "Edit Zone"}</h2>
                <button type="button" onClick={() => setZoneModal({ open: false, mode: "add", data: {} })} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Upload Zone Image *</label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold cursor-pointer hover:bg-purple-100 transition-colors w-full">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setZoneModal({ ...zoneModal, file, data: { ...zoneModal.data, imageUrl: reader.result as string } });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input type="text" placeholder="Or paste image URL (https://...)" value={zoneModal.data.imageUrl || ""} onChange={(e) => setZoneModal({ ...zoneModal, data: { ...zoneModal.data, imageUrl: e.target.value } })} className={inputCls} />
                  </div>
                  {zoneModal.data.imageUrl && (
                    <img
                      src={formatImageUrl(zoneModal.data.imageUrl)}
                      alt="preview"
                      className="mt-2 w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Zone Name *</label>
                    <input type="text" placeholder="e.g. Lanka" value={zoneModal.data.name || ""} onChange={(e) => setZoneModal({ ...zoneModal, data: { ...zoneModal.data, name: e.target.value } })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">City</label>
                    <input type="text" placeholder="e.g. Varanasi" value={zoneModal.data.city || ""} onChange={(e) => setZoneModal({ ...zoneModal, data: { ...zoneModal.data, city: e.target.value } })} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Pro Count</label>
                    <input type="number" placeholder="120" value={zoneModal.data.proCount || ""} onChange={(e) => setZoneModal({ ...zoneModal, data: { ...zoneModal.data, proCount: Number(e.target.value) } })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Sort Order</label>
                    <input type="number" placeholder="1" value={zoneModal.data.sortOrder || ""} onChange={(e) => setZoneModal({ ...zoneModal, data: { ...zoneModal.data, sortOrder: Number(e.target.value) } })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Areas Covered (comma separated)</label>
                  <textarea rows={3} placeholder="Assi Ghat, Lanka, Durgakund, BHU Campus..." value={(zoneModal.data.areas || []).join(", ")} onChange={(e) => setZoneModal({ ...zoneModal, data: { ...zoneModal.data, areas: e.target.value.split(",").map(a => a.trim()).filter(Boolean) } })} className={`${inputCls} resize-none`} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="zone-active" checked={zoneModal.data.isActive ?? true} onChange={(e) => setZoneModal({ ...zoneModal, data: { ...zoneModal.data, isActive: e.target.checked } })} className="w-4 h-4 rounded accent-purple-600 cursor-pointer" />
                  <label htmlFor="zone-active" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Show on website (Live)</label>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setZoneModal({ open: false, mode: "add", data: {} })} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors">Cancel</button>
                <button type="button" onClick={saveZone} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"><Save className="w-3.5 h-3.5" />Save Zone</button>
              </div>
            </div>
          </div>
        </Portal>
      )}



      {/* DELETE MODAL */}
      {deleteModal?.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <div className="text-center space-y-1">
                <h3 className="font-black text-slate-900 dark:text-white text-base">Delete this item?</h3>
                <p className="text-xs text-slate-500"><strong className="text-slate-700 dark:text-slate-300">"{deleteModal.name}"</strong> will be permanently removed.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors">Cancel</button>
                <button type="button" onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
      {/* ─── CATALOG SERVICE SELECTION MODAL (PICK FROM EXISTING SERVICES) ─── */}
      {isCatalogPickerOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-white ${
                activeTab === "quick"
                  ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"
                  : "bg-gradient-to-r from-amber-500 to-rose-600"
              }`}>
                <div className="flex items-center gap-2.5">
                  {activeTab === "quick" ? (
                    <Zap className="w-5 h-5 fill-white text-white" />
                  ) : (
                    <Flame className="w-5 h-5 fill-white text-white" />
                  )}
                  <div>
                    <h3 className="font-extrabold text-white text-base">
                      {activeTab === "quick" ? "Select Quick Service from Catalog" : "Select Service from Catalog"}
                    </h3>
                    <p className="text-xs text-amber-100">
                      {activeTab === "quick"
                        ? "Choose existing services to feature in website Quick Services (15-30 min arrival)"
                        : "Choose existing services to feature in website Trending Best Sellers"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCatalogPickerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/20 text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search catalog service name or category..."
                    className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Catalog Services List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isCatalogLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2 text-amber-500" />
                    <span className="text-xs font-bold">Searching catalog packages...</span>
                  </div>
                ) : catalogPackages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    No matching catalog packages found.
                  </div>
                ) : (
                  catalogPackages.map((catItem) => {
                    const isSelected =
                      activeTab === "quick"
                        ? quickServices.some((q) => q.packageId === catItem.packageId)
                        : trendingServices.some((t) => t.packageId === catItem.packageId);

                    return (
                      <div
                        key={catItem.packageId}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 transition-all flex items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={formatImageUrl(catItem.imageUrl || catItem.thumbnailUrl) || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80"}
                            alt={catItem.packageName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80";
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{catItem.packageName}</h4>
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-brand-50 text-brand-600 border border-brand-200">
                                {catItem.category?.name || "Service"}
                              </span>
                              {catItem.serviceAction?.name && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                                  {catItem.serviceAction.name}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">₹{catItem.price}</span>
                              <span className="text-slate-400 line-through text-[10px]">₹{catItem.originalPrice}</span>
                              <span>•</span>
                              <span className="text-amber-600 font-bold">{catItem.discountPercentage}% OFF</span>
                              {catItem.duration && <span>• {catItem.duration} mins</span>}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (activeTab === "quick") {
                              if (isSelected) {
                                handleRemovePackageFromQuickServices(catItem.packageId);
                              } else {
                                handleAddPackageToQuickServices(catItem);
                              }
                            } else {
                              if (isSelected) {
                                handleRemovePackageFromTrending(catItem.packageId);
                              } else {
                                handleAddPackageToTrending(catItem.packageId);
                              }
                            }
                          }}
                          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            isSelected
                              ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white"
                              : "bg-amber-500 hover:bg-amber-600 text-white shadow-lux"
                          }`}
                        >
                          {activeTab === "quick" ? (
                            <Zap className={`w-3.5 h-3.5 ${isSelected ? "text-rose-600" : "fill-white text-white"}`} />
                          ) : (
                            <Flame className={`w-3.5 h-3.5 ${isSelected ? "text-rose-600" : "fill-white text-white"}`} />
                          )}
                          <span>
                            {isSelected
                              ? (activeTab === "quick" ? "Remove from Quick" : "Remove from Trending")
                              : (activeTab === "quick" ? "+ Add to Quick Services" : "+ Add to Trending")}
                          </span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCatalogPickerOpen(false)}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-extrabold text-xs shadow-lux cursor-pointer"
                >
                  {activeTab === "quick" ? "Done Managing Quick Services" : "Done Managing Trending"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

