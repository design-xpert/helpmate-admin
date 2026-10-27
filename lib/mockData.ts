export interface VaranasiLocality {
  id: string;
  name: string;
  pincode: string;
  activeBookings: number;
  activeTechs: number;
  status: "High Demand" | "Normal" | "Peak";
  isServiceable: boolean;
}

export interface ServiceAddon {
  id: string;
  title: string;
  price: number;
  unit: string;
  category: string;
  description?: string;
  imageUrl?: string;
  status: "Active" | "Inactive";
  categoryId?: string;
  subCategoryId?: string;
  subcategory?: string;
}

export interface ServiceItem {
  id: string;
  categoryId?: string;
  subCategoryId?: string;
  serviceActionId?: string;
  category: string;
  subcategory?: string;
  title: string;
  subtitle: string;
  description?: string;
  includeInPackage?: string[];
  excludeFromPackage?: string[];
  price: number;
  originalPrice: number;
  duration: string;
  rating: number;
  reviewsCount: number;
  isPopular?: boolean;
  isTrending?: boolean;
  isInspectionBased?: boolean;
  addons?: ServiceAddon[];
  systemType?: string[];
  serviceAction?: string;
  thumbnailUrl?: string;
  status: "Active" | "Inactive";
  createdBy?: string;
  createdDate?: string;
}

export interface CategorySubService {
  id: string;
  title: string;
  type: "Installation" | "Repair" | "Uninstallation" | "Servicing" | "Maintenance";
  price: number;
  duration?: string;
  status: "Active" | "Inactive";
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  iconUrl?: string;
  secondImageIconUrl?: string;
  subcategoriesCount: number;
  subcategories?: string[];
  subCategoriesObj?: Array<{ _id?: string; name: string; imageUrl?: string; iconUrl?: string }>;
  servicesCount: number;
  status: "Active" | "Inactive";
  subServices?: CategorySubService[];
}

export interface VisitorPromoPopupConfig {
  isEnabled: boolean;
  bannerImageUrl: string;
  secondImageIconUrl?: string;
  targetLinkUrl: string;
  headlineText?: string;
  showFrequency: "Every Visit" | "Once per Session" | "Once per 24 Hours";
  closeDelaySeconds: number;
}

export interface SubCategoryItem {
  id: string;
  name: string;
  categoryName: string;
  slug: string;
  imageUrl?: string;
  iconUrl?: string;
  servicesCount: number;
  status: "Active" | "Inactive";
}

export interface PackageItem {
  id: string;
  title: string;
  category: string;
  includedServices: string[];
  packagePrice: number;
  individualPrice: number;
  discountPercentage: number;
  status: "Active" | "Inactive";
}

export interface RateCardItem {
  id: string;
  serviceTitle: string;
  category: string;
  basePrice: number;
  memberPrice: number;
  convenienceFee: number;
  gstPercentage: number;
  commissionPercentage: number;
  surgeMultiplier: number;
  status: "Active" | "Inactive";
}

export interface CityPricingItem {
  id: string;
  cityName: string;
  locality?: string;
  state: string;
  baseFareMultiplier: number;
  peakHourSurge: number;
  nightSurgeMultiplier: number;
  weatherSurge: number;
  status: "Active" | "Inactive";
}

export interface CouponItem {
  id: string;
  code: string;
  discountType: "Fixed" | "Percentage" | "Bank Offer" | "First Booking";
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap?: number;
  bankName?: string;
  description?: string;
  usageCount: number;
  expiryDate: string;
  status: "Active" | "Expired" | "Disabled";
}

export interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerType: "Customer" | "Partner";
  rating: number;
  comment: string;
  targetName: string;
  date: string;
  status: "Approved" | "Pending" | "Flagged";
  bookingId?: string;
  adminResponse?: string;
  showOnWebsite?: boolean;
  hasVideo?: boolean;
  videoUrl?: string;
  videoThumbnail?: string;
  videoAspectRatio?: "9:16";
  videoDuration?: string;
  locality?: string;
  category?: string;
}

export interface TransactionItem {
  id: string;
  bookingId: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  status: "Success" | "Refunded" | "Failed";
  date: string;
}

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface UserPermissions {
  // Granular View/Edit/Delete Matrix — All Admin Modules
  bookings: ModulePermission;
  inspections: ModulePermission;
  customers: ModulePermission;
  technicians: ModulePermission;
  categories: ModulePermission;
  cms: ModulePermission;
  pricing: ModulePermission;
  locations: ModulePermission;
  payments: ModulePermission;
  billing: ModulePermission;
  commission: ModulePermission;
  coupons: ModulePermission;
  reviews: ModulePermission;
  media: ModulePermission;
  analytics: ModulePermission;
  reports: ModulePermission;
  rbac: ModulePermission;

  // Feature flags (auto-derived)
  canAssignJobs: boolean;
  canEditServices: boolean;
  canProcessRefunds: boolean;
  canManageFleet: boolean;
  canExportReports: boolean;
  canManageRbac: boolean;
  canViewAuditLogs: boolean;
}

export interface UserManagementItem {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Varanasi Operations Coordinator" | "Quality Inspector" | "Support Agent" | "Billing & Finance Manager" | "Service Partner" | string;
  status: "Active" | "Suspended";
  lastLogin: string;
  phone?: string;
  locality?: string;
  permissions: UserPermissions;
}

export interface Technician {
  id: string;
  name: string;
  avatar: string;
  role: string;
  category: string;
  locality: string;
  pincode: string;
  phone: string;
  rating: number;
  totalJobs: number;
  aadhaarVerified: boolean;
  policeVerified: boolean;
  bondedInsurance: boolean;
  status: "Working" | "In Transit" | "Absent" | "Available" | "On Job" | "Offline" | "Approved" | "Pending" | "Rejected";
  joiningDate: string;
  lastCompletedJob?: {
    title: string;
    bookingId?: string;
    completedAt?: string;
  };

  // Earnings & Settlement
  totalEarnings: number;
  commissionPaid: number;
  pendingPayout: number;
  lastPayoutDate: string;
  payoutProofUrl?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  aadhaarDocUrl?: string;
  guarantorAadhaarDocUrl?: string;
  policeDocUrl?: string;
}

export interface SettlementRecord {
  id: string;
  technicianId: string;
  technicianName: string;
  category: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId?: string;
  grossAmount: number;
  commissionDeducted: number;
  netPayoutAmount: number;
  paymentMethod: string;
  utrNumber: string;
  settlementDate: string;
  period: string;
  status: "Completed" | "Processing" | "Failed";
  proofUrl?: string;
  notes?: string;
}

export interface CategoryCommissionRule {
  id: string;
  categoryName: string;
  commissionPercentage: number;
  convenienceFeeSharePercentage: number;
  minimumCommissionFloor: number;
  status: "Active" | "Inactive";
}

export type BookingStatus =
  | "Draft"
  | "Pending"
  | "Waiting For Assignment"
  | "Assigned"
  | "Partner Accepted"
  | "Inspection Pending"
  | "Price Approval Pending"
  | "Customer Approval Pending"
  | "Confirmed"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "Refunded"
  | "Rejected";

export interface SelectedServiceItem {
  id: string;
  serviceId?: string; // Unique Service ID e.g. SRV-8821-1
  serviceCode?: string; // Unique Service Item Code e.g. HM-SRV-101
  title: string;
  price: number;
  quantity: number;
  category?: string;
  duration?: string;
  categoryId?: string;
  subCategoryId?: string;
  serviceActionId?: string;
  rawServiceId?: string;
  packageId?: string;
  addons?: any[];
}

export type AddressRecipientType = "Self" | "Family Member" | "Friend / Neighbor" | "Office / Work" | "Other";

export interface SelectedAddOnItem {
  id: string;
  name: string;
  price: number;
  gstRate: number; // e.g. 0.18 for 18% GST or 0 for 0%
  gstAmount: number;
  totalPrice: number;
  isUnlisted?: boolean;
}

export interface BroadcastPartnerOffer {
  technicianId: string;
  technicianName: string;
  technicianPhone?: string;
  rating?: number;
  locality?: string;
  status: "Pending" | "Accepted" | "Offer Closed" | "Declined";
  sentAt?: string;
  acceptedAt?: string;
}

export interface Booking {
  createdBy?: string;
  origin?: "online" | "manual" | "website" | "admin" | string;
  bookingSource?: string;
  isOnline?: boolean;
  id: string; // Booking / Invoice ID
  jobId?: string; // Unique Job Tracking Code e.g. HM-JOB-8821
  bookingNumber?: string;
  customerId?: string;
  customerBookingCount?: number;
  rawTimestamp?: number;
  rawBookingNumber?: number;
  rawId?: string;
  broadcastOffers?: BroadcastPartnerOffer[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerGstin?: string;
  city: string;
  locality: string;
  pincode: string;
  address: string;
  serviceTitle: string;
  serviceName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  category: string;
  subCategory?: string;
  packageTitle?: string;
  addons?: string[];
  systemType?: string;
  servicesList?: SelectedServiceItem[];
  completedAddOns?: SelectedAddOnItem[];
  addOnsBaseTotal?: number;
  addOnsGstTotal?: number;
  addOnsFinalTotal?: number;
  addressRecipientType?: AddressRecipientType;
  recipientName?: string;
  recipientPhone?: string;

  // Pricing & GST Engine
  basePrice: number;
  addonPrice?: number;
  convenienceFee: number; // Fixed ₹49
  discountAmount?: number;
  couponCode?: string;
  gst?: number;
  cgst: number; // 9%
  sgst: number; // 9%
  totalAmount: number;
  finalAmount?: number;
  paymentStatus?: "Paid" | "Pending" | "Refunded" | string;
  invoiceType: "B2C" | "B2B";

  // Commission (Fixed 25%)
  commissionAmount: number; // 25% of Base
  partnerEarnings: number; // 75% of Base

  // Inspection Flow
  isInspectionBased?: boolean;
  initialInspectionQuote?: number;
  updatedInspectionQuote?: number;
  materialCost?: number;
  labourCost?: number;
  inspectionImages?: string[];
  inspectionRemarks?: string;
  inspectionApprovedByCustomer?: boolean;
  otpCode?: string;
  isOtpVerified?: boolean;

  // Notes & Attachments
  notes?: string;
  internalNotes?: string;
  customerImages?: string[];

  // Refund Management
  isRefunded?: boolean;
  refundAmount?: number;
  refundReason?: string;

  // Rating & Feedback
  rating?: number;
  reviewComment?: string;

  status: BookingStatus;
  technicianName?: string;
  technicianId?: string;
  technicianPhone?: string;
  date: string;
  timeSlot: string;
  paymentMethod: "UPI" | "Cash on Service" | "Card" | "Helpmate Wallet" | "Online" | "Partial Payment";
  createdAt?: string;
  bookingDate?: string;
  callingDate?: string;
  callingPerson?: string;
  handledBy?: string;
  isArchived?: boolean;
  archivedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  locality: string;
  pincode?: string;
  address: string;
  secondaryLocality?: string;
  secondaryAddress?: string;
  tier: "Crown Elite" | "VIP" | "Standard";
  totalSpend: number;
  totalBookings: number;
  lastBookingDate: string;
  joinedDate: string;
  avatar?: string;
  customerType?: "Individual Household" | "Commercial Business / B2B";
  companyName?: string;
  customerGstin?: string;
  householdType?: "Family Home" | "Apartment / Flat" | "Villa / Bungalow" | "Commercial Office / Shop";
  registeredAppliances?: string[];
  preferredLanguage?: "Hindi" | "English" | "Bhojpuri";
  preferredTimeSlot?: "Morning (9am-12pm)" | "Afternoon (12pm-4pm)" | "Evening (4pm-8pm)";
  loyaltyPoints?: number;
  walletBalance?: number;
  preferredPaymentMethod?: string;
  crmManager?: string;
  // Customer Identity & Aadhaar Verification (Optional for Customer KYC)
  aadhaarNumber?: string;
  aadhaarDocUrl?: string;

  // Membership Subscription Details
  membershipPlanName?: "Crown Elite VIP" | "HelpMate Gold Club" | "HelpMate Silver Pass" | "Non-Member / Free";
  membershipStatus?: "Active" | "Expiring Soon" | "Expired" | "Inactive";
  membershipStartDate?: string;
  membershipExpiryDate?: string;
  freeServicesClaimed?: number;
  freeServicesTotal?: number;
  discountPercent?: number;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  locality: string;
}

// Initial Data Sets
export const varanasiLocalities: VaranasiLocality[] = [
  { id: "loc-1", name: "Sigra", pincode: "221002", activeBookings: 14, activeTechs: 18, status: "High Demand", isServiceable: true },
  { id: "loc-2", name: "Lanka / Assi Ghat", pincode: "221005", activeBookings: 18, activeTechs: 22, status: "Peak", isServiceable: true },
  { id: "loc-3", name: "Godowlia", pincode: "221001", activeBookings: 9, activeTechs: 12, status: "Normal", isServiceable: true },
  { id: "loc-4", name: "Bhelupur", pincode: "221010", activeBookings: 11, activeTechs: 15, status: "High Demand", isServiceable: true },
  { id: "loc-5", name: "Mahmoorganj", pincode: "221010", activeBookings: 8, activeTechs: 10, status: "Normal", isServiceable: true },
  { id: "loc-6", name: "Shivpur", pincode: "221003", activeBookings: 6, activeTechs: 8, status: "Normal", isServiceable: true },
  { id: "loc-7", name: "Sarnath", pincode: "221007", activeBookings: 5, activeTechs: 7, status: "Normal", isServiceable: true },
  { id: "loc-8", name: "Varanasi Cantt", pincode: "221002", activeBookings: 12, activeTechs: 16, status: "High Demand", isServiceable: true },
];

export const initialAddons: ServiceAddon[] = [
  { id: "add-1", title: "Extra Heavy-Duty Copper Pipe (per meter)", price: 250, unit: "meter", category: "AC", status: "Active" },
  { id: "add-2", title: "Anti-Bacterial Coil Coating Spray", price: 199, unit: "can", category: "AC", status: "Active" },
  { id: "add-3", title: "Wall Mounting Heavy Angle Bracket", price: 350, unit: "piece", category: "AC", status: "Active" },
  { id: "add-4", title: "High-Pressure Hydro Drain Cleaner Fluid", price: 149, unit: "bottle", category: "Plumbing", status: "Active" },
];

export const initialCategories: CategoryItem[] = [
  {
    id: "cat-1",
    name: "AC Servicing & Repair",
    slug: "ac",
    icon: "Wrench",
    subcategoriesCount: 4,
    servicesCount: 12,
    status: "Active",
    subServices: [
      { id: "sub-srv-101", title: "Split AC Complete Installation", type: "Installation", price: 1499, duration: "90 mins", status: "Active" },
      { id: "sub-srv-102", title: "Window AC Installation", type: "Installation", price: 999, duration: "60 mins", status: "Active" },
      { id: "sub-srv-103", title: "Power Jet Deep Foam Servicing", type: "Servicing", price: 699, duration: "45 mins", status: "Active" },
      { id: "sub-srv-104", title: "Gas Leakage Testing & R32/R410 Charging", type: "Repair", price: 2499, duration: "60 mins", status: "Active" },
      { id: "sub-srv-105", title: "Split AC Safe Uninstallation", type: "Uninstallation", price: 699, duration: "45 mins", status: "Active" },
      { id: "sub-srv-106", title: "Window AC Uninstallation", type: "Uninstallation", price: 499, duration: "30 mins", status: "Active" },
      { id: "sub-srv-107", title: "Anti-Bacterial Hydro Coil Cleaning", type: "Maintenance", price: 399, duration: "30 mins", status: "Active" },
    ],
  },
  {
    id: "cat-2",
    name: "Elite Deep Cleaning",
    slug: "cleaning",
    icon: "Sparkles",
    subcategoriesCount: 5,
    servicesCount: 18,
    status: "Active",
    subServices: [
      { id: "sub-srv-201", title: "Full Home Deep Cleaning (3BHK)", type: "Servicing", price: 4999, duration: "4-5 hrs", status: "Active" },
      { id: "sub-srv-202", title: "Bathroom Hydro Cleaning & Descaling", type: "Servicing", price: 699, duration: "60 mins", status: "Active" },
      { id: "sub-srv-203", title: "Modular Kitchen Chimney Degreasing", type: "Maintenance", price: 899, duration: "90 mins", status: "Active" },
    ],
  },
  {
    id: "cat-3",
    name: "Smart Home Electrician",
    slug: "electrician",
    icon: "Zap",
    subcategoriesCount: 3,
    servicesCount: 10,
    status: "Active",
    subServices: [
      { id: "sub-srv-301", title: "Smart MCB Box & Circuit Fitting", type: "Installation", price: 799, duration: "45 mins", status: "Active" },
      { id: "sub-srv-302", title: "Short Circuit & Wire Fault Repair", type: "Repair", price: 499, duration: "30 mins", status: "Active" },
      { id: "sub-srv-303", title: "Ceiling Fan & Chandelier Fitting", type: "Installation", price: 299, duration: "30 mins", status: "Active" },
    ],
  },
  {
    id: "cat-4",
    name: "Hydro Jet Plumbing",
    slug: "plumbing",
    icon: "Droplets",
    subcategoriesCount: 3,
    servicesCount: 8,
    status: "Active",
    subServices: [
      { id: "sub-srv-401", title: "High-Pressure Drain Unclogging", type: "Repair", price: 599, duration: "45 mins", status: "Active" },
      { id: "sub-srv-402", title: "Luxury Tap & Mixer Fitting", type: "Installation", price: 349, duration: "30 mins", status: "Active" },
    ],
  },
  {
    id: "cat-5",
    name: "Home Salon & Spa",
    slug: "beauty",
    icon: "Scissors",
    subcategoriesCount: 6,
    servicesCount: 22,
    status: "Active",
    subServices: [
      { id: "sub-srv-501", title: "Ayurvedic Kashi Spa Body Massage", type: "Servicing", price: 1999, duration: "60 mins", status: "Active" },
      { id: "sub-srv-502", title: "Organic Gold Glow Facial", type: "Maintenance", price: 1499, duration: "60 mins", status: "Active" },
    ],
  },
];

export const initialSubCategories: SubCategoryItem[] = [
  { id: "sub-1", name: "Power Jet Wash", categoryName: "AC Servicing & Repair", slug: "power-jet-wash", servicesCount: 3, status: "Active" },
  { id: "sub-2", name: "Gas Refilling & Leak Repair", categoryName: "AC Servicing & Repair", slug: "gas-refilling", servicesCount: 4, status: "Active" },
  { id: "sub-3", name: "Full Villa Deep Clean", categoryName: "Elite Deep Cleaning", slug: "full-villa-clean", servicesCount: 5, status: "Active" },
  { id: "sub-4", name: "Kitchen Degreasing", categoryName: "Elite Deep Cleaning", slug: "kitchen-degreasing", servicesCount: 2, status: "Active" },
  { id: "sub-5", name: "MCB & Fuse Repair", categoryName: "Smart Home Electrician", slug: "mcb-repair", servicesCount: 3, status: "Active" },
];

export const initialPackages: PackageItem[] = [
  { id: "pkg-1", title: "Varanasi Summer AC Protection Combo", category: "AC Servicing", includedServices: ["Power Jet Wash", "Gas Leak Testing", "Anti-Bacterial Spray"], packagePrice: 1299, individualPrice: 1899, discountPercentage: 31, status: "Active" },
  { id: "pkg-2", title: "Complete Villa Deep Clean + Pest Control", category: "Cleaning", includedServices: ["3BHK Deep Cleaning", "Herbal Pest Spray", "Kitchen Hydro Wash"], packagePrice: 5999, individualPrice: 8499, discountPercentage: 29, status: "Active" },
  { id: "pkg-3", title: "Ayurvedic Home Spa & Glow Facial Bundle", category: "Beauty", includedServices: ["Kashi Oil Body Massage", "Gold Glow Facial", "Herbal Hair Spa"], packagePrice: 2999, individualPrice: 4299, discountPercentage: 30, status: "Active" },
];

export const initialRateCards: RateCardItem[] = [
  { id: "rc-1", serviceTitle: "Split AC Foam Jet Servicing", category: "AC Servicing", basePrice: 599, memberPrice: 499, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.0, status: "Active" },
  { id: "rc-2", serviceTitle: "Split AC Gas Leak Repair & Refill", category: "AC Servicing", basePrice: 1499, memberPrice: 1299, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.0, status: "Active" },
  { id: "rc-3", serviceTitle: "Window AC Deep Jet Servicing", category: "AC Servicing", basePrice: 499, memberPrice: 399, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.0, status: "Active" },
  { id: "rc-4", serviceTitle: "Full House Deep Cleaning (2BHK)", category: "Deep Cleaning", basePrice: 2999, memberPrice: 2499, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.1, status: "Active" },
  { id: "rc-5", serviceTitle: "Kitchen Oil & Degreasing Wash", category: "Deep Cleaning", basePrice: 1199, memberPrice: 999, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.0, status: "Active" },
  { id: "rc-6", serviceTitle: "Smart MCB & Fuse Box Installation", category: "Electrician", basePrice: 349, memberPrice: 299, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.0, status: "Active" },
  { id: "rc-7", serviceTitle: "Hydro Jet Drain Cleaning & Unclog", category: "Plumbing", basePrice: 699, memberPrice: 599, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.0, status: "Active" },
  { id: "rc-8", serviceTitle: "Gold Radiance Glow Facial & Massage", category: "Home Salon", basePrice: 1299, memberPrice: 1099, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.0, status: "Active" },
  { id: "rc-9", serviceTitle: "Full Car Foam Wash & Interior Polish", category: "Car Wash", basePrice: 499, memberPrice: 399, convenienceFee: 49, gstPercentage: 18, commissionPercentage: 25, surgeMultiplier: 1.0, status: "Active" },
];

export const initialCityPricing: CityPricingItem[] = [
  { id: "cp-1", cityName: "Varanasi Metro", locality: "Sigra Commercial Zone", state: "Uttar Pradesh", baseFareMultiplier: 1.0, peakHourSurge: 1.25, nightSurgeMultiplier: 1.20, weatherSurge: 1.30, status: "Active" },
  { id: "cp-2", cityName: "Varanasi Metro", locality: "Lanka & Assi Ghat Hub", state: "Uttar Pradesh", baseFareMultiplier: 1.0, peakHourSurge: 1.20, nightSurgeMultiplier: 1.15, weatherSurge: 1.25, status: "Active" },
  { id: "cp-3", cityName: "Varanasi Metro", locality: "Godowlia Heritage Zone", state: "Uttar Pradesh", baseFareMultiplier: 1.1, peakHourSurge: 1.30, nightSurgeMultiplier: 1.25, weatherSurge: 1.35, status: "Active" },
  { id: "cp-4", cityName: "Varanasi Metro", locality: "Bhelupur Residential", state: "Uttar Pradesh", baseFareMultiplier: 1.0, peakHourSurge: 1.15, nightSurgeMultiplier: 1.15, weatherSurge: 1.20, status: "Active" },
  { id: "cp-5", cityName: "Varanasi Metro", locality: "Cantt Railway Station Zone", state: "Uttar Pradesh", baseFareMultiplier: 1.05, peakHourSurge: 1.25, nightSurgeMultiplier: 1.20, weatherSurge: 1.30, status: "Active" },
  { id: "cp-6", cityName: "Prayagraj Hub", locality: "Civil Lines Central", state: "Uttar Pradesh", baseFareMultiplier: 1.0, peakHourSurge: 1.15, nightSurgeMultiplier: 1.20, weatherSurge: 1.25, status: "Active" },
  { id: "cp-7", cityName: "Lucknow Metro", locality: "Hazratganj & Gomti Nagar", state: "Uttar Pradesh", baseFareMultiplier: 1.15, peakHourSurge: 1.35, nightSurgeMultiplier: 1.30, weatherSurge: 1.40, status: "Active" },
];

export const initialCoupons: CouponItem[] = [
  {
    id: "coup-1",
    code: "VARANASI100",
    discountType: "Fixed",
    discountValue: 100,
    minOrderValue: 499,
    description: "Flat ₹100 Instant Cash Discount on AC & Home Care Services in Varanasi",
    usageCount: 1420,
    expiryDate: "31 Dec 2026",
    status: "Active",
  },
  {
    id: "coup-2",
    code: "HDFC10",
    discountType: "Bank Offer",
    discountValue: 10,
    maxDiscountCap: 300,
    minOrderValue: 999,
    bankName: "HDFC Bank",
    description: "10% Instant Discount up to ₹300 on HDFC Credit & Debit Cards",
    usageCount: 890,
    expiryDate: "31 Dec 2026",
    status: "Active",
  },
  {
    id: "coup-3",
    code: "ICICICASH",
    discountType: "Bank Offer",
    discountValue: 200,
    minOrderValue: 1499,
    bankName: "ICICI Bank",
    description: "Flat ₹200 Cashback on ICICI Credit Cards & NetBanking",
    usageCount: 640,
    expiryDate: "30 Nov 2026",
    status: "Active",
  },
  {
    id: "coup-4",
    code: "WELCOME150",
    discountType: "First Booking",
    discountValue: 150,
    minOrderValue: 499,
    description: "Flat ₹150 Off for First Time HelpMate Booking Customers",
    usageCount: 2150,
    expiryDate: "31 Dec 2026",
    status: "Active",
  },
  {
    id: "coup-5",
    code: "AXIS250",
    discountType: "Bank Offer",
    discountValue: 250,
    minOrderValue: 1999,
    bankName: "Axis Bank",
    description: "Flat ₹250 Discount on Axis Bank Credit Cards",
    usageCount: 430,
    expiryDate: "31 Dec 2026",
    status: "Active",
  },
];

export const initialReviews: ReviewItem[] = [
  {
    id: "rev-101",
    reviewerName: "Rajesh Kumar Agrawal",
    reviewerType: "Customer",
    rating: 5,
    comment: "Watch my AC cooling test after Power Jet Wash! High pressure foam jet cleaned copper coils completely. Tech Ramesh Yadav arrived within 25 mins in Sigra.",
    targetName: "Ramesh Yadav (AC Tech)",
    date: "Today, 04:30 PM",
    status: "Approved",
    bookingId: "HM-VAR-8821",
    showOnWebsite: true,
    hasVideo: true,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-technician-checking-air-conditioner-in-an-office-41541-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
    videoAspectRatio: "9:16",
    videoDuration: "0:24",
    locality: "Sigra",
    category: "AC Service & Repair",
  },
  {
    id: "rev-102",
    reviewerName: "Dr. Ananya Mukherjee",
    reviewerType: "Customer",
    rating: 5,
    comment: "Here is the video review of my living room sofa shampooing and deep villa cleaning! Very professional therapist Sunita Verma. Highly recommend HelpMate Spa at Assi Ghat.",
    targetName: "Sunita Verma (Deep Cleaning & Spa Specialist)",
    date: "Yesterday",
    status: "Approved",
    bookingId: "HM-VAR-8820",
    showOnWebsite: true,
    hasVideo: true,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-cleaning-a-table-with-a-cloth-42880-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80",
    videoAspectRatio: "9:16",
    videoDuration: "0:35",
    locality: "Lanka / Assi Ghat",
    category: "Elite Deep Cleaning",
  },
  {
    id: "rev-103",
    reviewerName: "Sanjay Mishra",
    reviewerType: "Customer",
    rating: 5,
    comment: "MCB short circuit & distribution box upgrade video proof. Main trip switch issue resolved in Mahmoorganj. Safe and neat work by Amit Pandey.",
    targetName: "Amit Pandey (Smart Electrician)",
    date: "20 Aug 2026",
    status: "Approved",
    bookingId: "HM-VAR-8822",
    showOnWebsite: false,
    hasVideo: true,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-electrician-checking-an-electrical-panel-41544-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop&q=80",
    videoAspectRatio: "9:16",
    videoDuration: "0:18",
    locality: "Mahmoorganj",
    category: "Smart Home Electrician",
  },
  {
    id: "rev-104",
    reviewerName: "Priya Sharma",
    reviewerType: "Customer",
    rating: 4,
    comment: "Hydro jet plumbing tap leak fix done properly at Ravindrapuri. Satisfied with the quick service.",
    targetName: "Vikas Kumar (Plumbing Partner)",
    date: "19 Aug 2026",
    status: "Approved",
    bookingId: "HM-VAR-8823",
    showOnWebsite: true,
    hasVideo: false,
    locality: "Ravindrapuri",
    category: "Hydro Jet Plumbing",
  },
  {
    id: "rev-105",
    reviewerName: "Sunil Verma",
    reviewerType: "Partner",
    rating: 5,
    comment: "HelpMate dispatch app assigns Varanasi jobs transparently with instant daily wallet settlement.",
    targetName: "HelpMate Fleet Operations",
    date: "18 Aug 2026",
    status: "Approved",
    showOnWebsite: true,
    hasVideo: false,
    locality: "Bhelupur",
    category: "Partner Feedback",
  },
  {
    id: "rev-106",
    reviewerName: "Vikram Singh",
    reviewerType: "Customer",
    rating: 2,
    comment: "Technician arrived 30 mins late during peak heat hours in Bhelupur.",
    targetName: "Ramesh Yadav (AC Tech)",
    date: "17 Aug 2026",
    status: "Flagged",
    bookingId: "HM-VAR-8819",
    showOnWebsite: false,
    hasVideo: false,
    locality: "Bhelupur",
    category: "AC Service & Repair",
  },
];

export const initialTransactions: TransactionItem[] = [
  { id: "txn-901", bookingId: "HM-VAR-8821", customerName: "Rajesh Kumar Agrawal", amount: 1499, paymentMethod: "UPI (Google Pay)", status: "Success", date: "Today, 05:30 PM" },
  { id: "txn-902", bookingId: "HM-VAR-8822", customerName: "Sanjay Mishra", amount: 850, paymentMethod: "Cash on Service", status: "Success", date: "Today, 03:15 PM" },
  { id: "txn-903", bookingId: "HM-VAR-8823", customerName: "Priya Sharma", amount: 1249, paymentMethod: "UPI (PhonePe)", status: "Success", date: "Yesterday, 11:45 AM" },
  { id: "txn-904", bookingId: "HM-VAR-8820", customerName: "Dr. Ananya Mukherjee", amount: 2417, paymentMethod: "Helpmate Wallet", status: "Success", date: "Today, 04:45 PM" },
  { id: "txn-905", bookingId: "HM-VAR-8819", customerName: "Vikram Singh", amount: 647, paymentMethod: "Credit Card (HDFC)", status: "Success", date: "Today, 02:10 PM" },
  { id: "txn-906", bookingId: "HM-VAR-8818", customerName: "Sunil Verma", amount: 499, paymentMethod: "UPI (Paytm)", status: "Refunded", date: "28 Jul 2026, 06:15 PM" },
  { id: "txn-907", bookingId: "HM-VAR-8817", customerName: "Kavita Gupta", amount: 1899, paymentMethod: "NetBanking (ICICI)", status: "Success", date: "28 Jul 2026, 01:20 PM" },
  { id: "txn-908", bookingId: "HM-VAR-8816", customerName: "Manish Srivastava", amount: 799, paymentMethod: "UPI (BHIM)", status: "Failed", date: "27 Jul 2026, 09:10 AM" },
];

export const initialUsers: UserManagementItem[] = [
  {
    id: "usr-1",
    name: "Aman Verma",
    email: "admin@helpmate.net.in",
    role: "Super Admin",
    status: "Active",
    lastLogin: "Just now",
    phone: "+91 98390 11111",
    locality: "Varanasi HQ",
    permissions: {
      bookings: { view: true, create: true, edit: true, delete: true },
      inspections: { view: true, create: true, edit: true, delete: true },
      customers: { view: true, create: true, edit: true, delete: true },
      technicians: { view: true, create: true, edit: true, delete: true },
      categories: { view: true, create: true, edit: true, delete: true },
      cms: { view: true, create: true, edit: true, delete: true },
      pricing: { view: true, create: true, edit: true, delete: true },
      locations: { view: true, create: true, edit: true, delete: true },
      payments: { view: true, create: true, edit: true, delete: true },
      billing: { view: true, create: true, edit: true, delete: true },
      commission: { view: true, create: true, edit: true, delete: true },
      coupons: { view: true, create: true, edit: true, delete: true },
      reviews: { view: true, create: true, edit: true, delete: true },
      media: { view: true, create: true, edit: true, delete: true },
      analytics: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      rbac: { view: true, create: true, edit: true, delete: true },
      canAssignJobs: true,
      canEditServices: true,
      canProcessRefunds: true,
      canManageFleet: true,
      canExportReports: true,
      canManageRbac: true,
      canViewAuditLogs: true,
    },
  },
  {
    id: "usr-2",
    name: "Siddharth Malhotra",
    email: "operations.sigra@helpmate.net.in",
    role: "Varanasi Operations Coordinator",
    status: "Active",
    lastLogin: "10 mins ago",
    phone: "+91 98390 22222",
    locality: "Sigra Zone",
    permissions: {
      bookings: { view: true, create: true, edit: true, delete: false },
      inspections: { view: true, create: false, edit: true, delete: false },
      customers: { view: true, create: false, edit: true, delete: false },
      technicians: { view: true, create: false, edit: true, delete: false },
      categories: { view: true, create: false, edit: false, delete: false },
      cms: { view: false, create: false, edit: false, delete: false },
      pricing: { view: false, create: false, edit: false, delete: false },
      locations: { view: true, create: false, edit: false, delete: false },
      payments: { view: false, create: false, edit: false, delete: false },
      billing: { view: false, create: false, edit: false, delete: false },
      commission: { view: false, create: false, edit: false, delete: false },
      coupons: { view: false, create: false, edit: false, delete: false },
      reviews: { view: true, create: false, edit: false, delete: false },
      media: { view: false, create: false, edit: false, delete: false },
      analytics: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      rbac: { view: false, create: false, edit: false, delete: false },
      canAssignJobs: true,
      canEditServices: false,
      canProcessRefunds: false,
      canManageFleet: true,
      canExportReports: false,
      canManageRbac: false,
      canViewAuditLogs: true,
    },
  },
  {
    id: "usr-3",
    name: "Priya Sharma",
    email: "priya.support@helpmate.net.in",
    role: "Support Agent",
    status: "Active",
    lastLogin: "1 hour ago",
    phone: "+91 98390 33333",
    locality: "Lanka Zone",
    permissions: {
      bookings: { view: true, create: false, edit: true, delete: false },
      inspections: { view: true, create: false, edit: false, delete: false },
      customers: { view: true, create: false, edit: true, delete: false },
      technicians: { view: true, create: false, edit: false, delete: false },
      categories: { view: false, create: false, edit: false, delete: false },
      cms: { view: false, create: false, edit: false, delete: false },
      pricing: { view: false, create: false, edit: false, delete: false },
      locations: { view: false, create: false, edit: false, delete: false },
      payments: { view: true, create: false, edit: false, delete: false },
      billing: { view: true, create: false, edit: false, delete: false },
      commission: { view: false, create: false, edit: false, delete: false },
      coupons: { view: false, create: false, edit: false, delete: false },
      reviews: { view: true, create: false, edit: false, delete: false },
      media: { view: false, create: false, edit: false, delete: false },
      analytics: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      rbac: { view: false, create: false, edit: false, delete: false },
      canAssignJobs: true,
      canEditServices: false,
      canProcessRefunds: true,
      canManageFleet: false,
      canExportReports: false,
      canManageRbac: false,
      canViewAuditLogs: false,
    },
  },
  {
    id: "usr-4",
    name: "Rajesh Agrawal",
    email: "finance@helpmate.net.in",
    role: "Billing & Finance Manager",
    status: "Active",
    lastLogin: "Yesterday",
    phone: "+91 98390 44444",
    locality: "Cantt Zone",
    permissions: {
      bookings: { view: true, create: false, edit: false, delete: false },
      inspections: { view: false, create: false, edit: false, delete: false },
      customers: { view: true, create: false, edit: false, delete: false },
      technicians: { view: false, create: false, edit: false, delete: false },
      categories: { view: true, create: false, edit: false, delete: false },
      cms: { view: true, create: true, edit: true, delete: false },
      pricing: { view: true, create: true, edit: true, delete: false },
      locations: { view: true, create: false, edit: false, delete: false },
      payments: { view: true, create: false, edit: true, delete: false },
      billing: { view: true, create: true, edit: true, delete: true },
      commission: { view: true, create: false, edit: true, delete: false },
      coupons: { view: true, create: true, edit: true, delete: false },
      reviews: { view: false, create: false, edit: false, delete: false },
      media: { view: false, create: false, edit: false, delete: false },
      analytics: { view: true, create: false, edit: false, delete: false },
      reports: { view: true, create: false, edit: true, delete: false },
      rbac: { view: false, create: false, edit: false, delete: false },
      canAssignJobs: false,
      canEditServices: true,
      canProcessRefunds: true,
      canManageFleet: false,
      canExportReports: true,
      canManageRbac: false,
      canViewAuditLogs: true,
    },
  },
];

export const initialTechnicians: Technician[] = [
  {
    id: "tech-101",
    name: "Ramesh Yadav",
    avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    role: "Master HVAC Specialist",
    category: "AC Repair",
    locality: "Sigra, Varanasi",
    pincode: "221002",
    phone: "+91 98391 22401",
    rating: 4.95,
    totalJobs: 412,
    aadhaarVerified: true,
    policeVerified: true,
    bondedInsurance: true,
    status: "Working",
    joiningDate: "14 Jan 2024",
    lastCompletedJob: {
      title: "Split AC Foam Jet Servicing",
      bookingId: "BK-VNS-8821",
      completedAt: "Today, 09:30 AM",
    },
    totalEarnings: 284500,
    commissionPaid: 71125,
    pendingPayout: 14200,
    lastPayoutDate: "20 Jan 2026",
    payoutProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "tech-102",
    name: "Sunita Verma",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "Senior Wellness Therapist",
    category: "Beauty & Spa",
    locality: "Lanka, Varanasi",
    pincode: "221005",
    phone: "+91 97920 44812",
    rating: 4.98,
    totalJobs: 580,
    aadhaarVerified: true,
    policeVerified: true,
    bondedInsurance: true,
    status: "In Transit",
    joiningDate: "05 Nov 2023",
    lastCompletedJob: {
      title: "Full Body Deep Tissue Spa",
      bookingId: "BK-VNS-7732",
      completedAt: "Today, 08:15 AM",
    },
    totalEarnings: 412000,
    commissionPaid: 103000,
    pendingPayout: 18900,
    lastPayoutDate: "20 Jan 2026",
  },
  {
    id: "tech-103",
    name: "Amit Pandey",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "Certified Electrical Engineer",
    category: "Electrician",
    locality: "Bhelupur, Varanasi",
    pincode: "221010",
    phone: "+91 94152 88901",
    rating: 4.90,
    totalJobs: 320,
    aadhaarVerified: true,
    policeVerified: true,
    bondedInsurance: true,
    status: "Absent",
    joiningDate: "20 Feb 2024",
    lastCompletedJob: {
      title: "MCB & Submersible Wiring Repair",
      bookingId: "BK-VNS-9910",
      completedAt: "Yesterday, 05:45 PM",
    },
    totalEarnings: 156000,
    commissionPaid: 39000,
    pendingPayout: 8500,
    lastPayoutDate: "15 Jan 2026",
  },
  {
    id: "tech-104",
    name: "Vikas Srivastava",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "Master Plumber & Pipe Fitter",
    category: "Plumbing",
    locality: "Godowlia, Varanasi",
    pincode: "221001",
    phone: "+91 98388 77611",
    rating: 4.88,
    totalJobs: 245,
    aadhaarVerified: true,
    policeVerified: true,
    bondedInsurance: true,
    status: "Available",
    joiningDate: "10 Mar 2024",
    lastCompletedJob: {
      title: "Overhead Tank Leakage Fix",
      bookingId: "BK-VNS-6641",
      completedAt: "Yesterday, 02:30 PM",
    },
    totalEarnings: 198000,
    commissionPaid: 49500,
    pendingPayout: 11200,
    lastPayoutDate: "22 Jan 2026",
  },
];

const generateMockBookings = (): Booking[] => {
  const initialFiveBookings: Booking[] = [
    {
      id: "HM-VAR-8821",
      customerName: "Rajesh Kumar Agrawal",
      customerPhone: "+91 77050 04040",
      customerGstin: "09AABCH1234H1Z5",
      city: "Varanasi",
      locality: "Sigra",
      pincode: "221002",
      address: "D-38/21, Sigra Central Main Road, Varanasi",
      serviceTitle: "Power Jet AC Servicing & Gas Refill Bundle",
      category: "AC Service & Repair",
      systemType: "Split AC (1.5 Ton)",
      servicesList: [
        { id: "sp-1", serviceCode: "HM-SVC-8821-01", title: "Split AC Foam Jet Servicing", price: 599, quantity: 1, category: "AC Service & Repair", duration: "45 mins" },
        { id: "sp-4", serviceCode: "HM-SVC-8821-02", title: "Gas Leak Repair & Full Refill (R32/R410a)", price: 1499, quantity: 1, category: "AC Service & Repair", duration: "90 mins" },
        { id: "sp-5", serviceCode: "HM-SVC-8821-03", title: "Split AC Capacitor Replacement", price: 499, quantity: 1, category: "AC Service & Repair", duration: "30 mins" },
      ],
      basePrice: 2597,
      convenienceFee: 49,
      cgst: 238.14,
      sgst: 238.14,
      totalAmount: 3122,
      invoiceType: "B2B",
      commissionAmount: 649.25,
      partnerEarnings: 1947.75,
      isInspectionBased: true,
      initialInspectionQuote: 599,
      updatedInspectionQuote: 2597,
      materialCost: 1499,
      labourCost: 1098,
      inspectionRemarks: "Compressor capacitor burnt & copper pipe R32 refrigerant top-up required. PCB circuit tested clean.",
      inspectionImages: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80"
      ],
      inspectionApprovedByCustomer: true,
      otpCode: "8821",
      isOtpVerified: false,
      status: "In Progress",
      technicianName: "Ramesh Yadav",
      technicianId: "tech-101",
      technicianPhone: "+91 98390 11200",
      createdBy: "Office Admin (Rohan Sharma)",
      date: "Today, 05:30 PM",
      timeSlot: "05:00 PM - 06:30 PM",
      paymentMethod: "UPI",
    },
    {
      id: "HM-VAR-8822",
      customerName: "Sanjay Mishra",
      customerPhone: "+91 98390 11928",
      city: "Varanasi",
      locality: "Mahmoorganj",
      pincode: "221010",
      address: "B-32/12 Tulsipur, Near Galaxy Hospital, Mahmoorganj, Varanasi",
      serviceTitle: "Main MCB & Socket Board Upgrade Bundle",
      category: "Electrician",
      systemType: "3-Phase Distribution Box",
      servicesList: [
        { id: "el-1", serviceCode: "HM-SVC-8822-01", title: "Switchboard & Socket Installation (5 points)", price: 299, quantity: 2, category: "Electrician", duration: "30 mins" },
        { id: "el-3", serviceCode: "HM-SVC-8822-02", title: "Main Line MCB Tripping & Short Circuit Fix", price: 499, quantity: 1, category: "Electrician", duration: "45 mins" },
      ],
      basePrice: 1097,
      convenienceFee: 49,
      cgst: 103.14,
      sgst: 103.14,
      totalAmount: 1352,
      invoiceType: "B2C",
      commissionAmount: 274.25,
      partnerEarnings: 822.75,
      isInspectionBased: true,
      initialInspectionQuote: 299,
      updatedInspectionQuote: 1097,
      materialCost: 550,
      labourCost: 547,
      inspectionRemarks: "Overheated 32A MCB switch melted terminal block. Replaced with Havells 32A C-Curve MCB.",
      inspectionImages: [
        "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500&auto=format&fit=crop&q=80"
      ],
      inspectionApprovedByCustomer: false,
      otpCode: "3310",
      isOtpVerified: false,
      status: "Assigned",
      technicianName: "Amit Pandey",
      technicianId: "tech-103",
      technicianPhone: "+91 94152 88200",
      createdBy: "Office Admin (Rohan Sharma)",
      date: "Today, 03:15 PM",
      timeSlot: "03:00 PM - 04:30 PM",
      paymentMethod: "Cash on Service",
    },
    {
      id: "HM-VAR-8823",
      customerName: "Priya Sharma",
      customerPhone: "+91 91402 88301",
      city: "Varanasi",
      locality: "Ravindrapuri",
      pincode: "221005",
      address: "House 45, Lane 3, Near Anand Park, Ravindrapuri, Varanasi",
      serviceTitle: "Water Tap Leakage Fix & Mixer Installation",
      category: "Plumbing",
      systemType: "CPVC Underground Line",
      servicesList: [
        { id: "pl-1", serviceCode: "HM-SVC-8823-01", title: "Water Tap Leakage Fix & Washer Replace", price: 199, quantity: 2, category: "Plumbing", duration: "20 mins" },
        { id: "pl-2", serviceCode: "HM-SVC-8823-02", title: "Hot & Cold Water Mixer Installation", price: 499, quantity: 1, category: "Plumbing", duration: "45 mins" },
      ],
      basePrice: 897,
      convenienceFee: 49,
      cgst: 85.14,
      sgst: 85.14,
      totalAmount: 1116,
      invoiceType: "B2C",
      commissionAmount: 224.25,
      partnerEarnings: 672.75,
      isInspectionBased: true,
      initialInspectionQuote: 199,
      updatedInspectionQuote: 897,
      materialCost: 499,
      labourCost: 398,
      inspectionRemarks: "CPVC 1-inch elbow hairline crack fixed and hot/cold mixer wall mounted.",
      inspectionImages: [
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80"
      ],
      inspectionApprovedByCustomer: true,
      otpCode: "9912",
      isOtpVerified: true,
      status: "Completed",
      technicianName: "Vikas Kumar",
      technicianId: "tech-104",
      date: "Yesterday",
      timeSlot: "11:00 AM - 12:30 PM",
      paymentMethod: "UPI",
    },
    {
      id: "HM-VAR-8820",
      customerName: "Dr. Ananya Mukherjee",
      customerPhone: "+91 94501 22910",
      city: "Varanasi",
      locality: "Lanka / Assi Ghat",
      pincode: "221005",
      address: "Plot 12, Assi Ghat Road, Near BHU Gate, Lanka, Varanasi",
      serviceTitle: "Full House Deep Clean & Sofa Shampooing Combo",
      category: "Home Cleaning",
      servicesList: [
        { id: "hc-1", serviceCode: "HM-SVC-8820-01", title: "2BHK Full House Deep Cleaning", price: 2999, quantity: 1, category: "Home Cleaning", duration: "4 Hours" },
        { id: "sc-1", serviceCode: "HM-SVC-8820-02", title: "5-Seater Fabric Sofa Shampooing", price: 899, quantity: 1, category: "Home Cleaning", duration: "60 mins" },
      ],
      basePrice: 3898,
      convenienceFee: 49,
      cgst: 355.23,
      sgst: 355.23,
      totalAmount: 4657,
      invoiceType: "B2C",
      commissionAmount: 974.50,
      partnerEarnings: 2923.50,
      otpCode: "4920",
      isOtpVerified: false,
      status: "Assigned",
      technicianName: "Sunita Verma",
      technicianId: "tech-102",
      technicianPhone: "+91 98390 22100",
      createdBy: "Office Admin (Rohan Sharma)",
      date: "Today, 06:00 PM",
      timeSlot: "06:00 PM - 07:30 PM",
      paymentMethod: "Helpmate Wallet",
    },
    {
      id: "HM-VAR-8819",
      customerName: "Vikram Singh",
      customerPhone: "+91 99180 55432",
      city: "Varanasi",
      locality: "Bhelupur",
      pincode: "221010",
      address: "B-22/41 Sonarpura, Bhelupur, Varanasi",
      serviceTitle: "Smart Home & MCB Box Repair",
      category: "Electrician",
      basePrice: 499,
      convenienceFee: 49,
      cgst: 49.32,
      sgst: 49.32,
      totalAmount: 647,
      invoiceType: "B2C",
      commissionAmount: 124.75,
      partnerEarnings: 374.25,
      otpCode: "1819",
      isOtpVerified: true,
      status: "Completed",
      technicianName: "Amit Pandey",
      technicianId: "tech-103",
      date: "Today, 04:45 PM",
      timeSlot: "04:30 PM - 05:30 PM",
      paymentMethod: "UPI",
    },
  ];

  const localities = ["Sigra", "Lanka / Assi Ghat", "Godowlia", "Bhelupur", "Mahmoorganj", "Shivpur", "Sarnath", "Varanasi Cantt"];
  const pincodes: Record<string, string> = {
    "Sigra": "221002",
    "Lanka / Assi Ghat": "221005",
    "Godowlia": "221001",
    "Bhelupur": "221010",
    "Mahmoorganj": "221010",
    "Shivpur": "221003",
    "Sarnath": "221007",
    "Varanasi Cantt": "221002",
  };

  const services = [
    { title: "Power Jet Split AC Servicing", category: "AC", price: 699 },
    { title: "Window AC Gas Leakage Repair", category: "AC", price: 2499 },
    { title: "Full 3BHK Villa Deep Cleaning", category: "Cleaning", price: 4999 },
    { title: "Bathroom Hydro Jet Descaling", category: "Cleaning", price: 699 },
    { title: "Smart MCB & Circuit Box Fitting", category: "Electrician", price: 799 },
    { title: "Short Circuit & Wire Fault Repair", category: "Electrician", price: 499 },
    { title: "High-Pressure Drain Unclogging", category: "Plumbing", price: 599 },
    { title: "Tap Mixer & Shower Fitting", category: "Plumbing", price: 349 },
    { title: "Ayurvedic Kashi Spa Body Massage", category: "Beauty", price: 1999 },
    { title: "Organic Gold Glow Facial", category: "Beauty", price: 1499 },
    { title: "RO Water Purifier Filter Change", category: "Plumbing", price: 899 },
    { title: "Washing Machine Motor Overhaul", category: "Electrician", price: 1299 },
  ];

  const customers = [
    { name: "Rajesh Kumar Agrawal", phone: "+91 77050 04040" },
    { name: "Sunita Agrawal", phone: "+91 94501 88200" },
    { name: "Rakesh Verma", phone: "+91 98390 12001" },
    { name: "Kavita Gupta", phone: "+91 94152 33412" },
    { name: "Abhishek Singh", phone: "+91 99180 77123" },
    { name: "Archana Tripathi", phone: "+91 98391 55642" },
    { name: "Deepak Pandey", phone: "+91 77050 88129" },
    { name: "Neha Agarwal", phone: "+91 94501 66321" },
    { name: "Rohit Srivastava", phone: "+91 98392 44109" },
    { name: "Pooja Yadav", phone: "+91 91402 99823" },
    { name: "Sunil Kumar Rastogi", phone: "+91 94150 11294" },
    { name: "Meenakshi Joshi", phone: "+91 98393 77210" },
    { name: "Alok Chaurasia", phone: "+91 99350 44812" },
    { name: "Shalini Rai", phone: "+91 77051 22938" },
  ];

  const technicians = [
    { name: "Ramesh Yadav", id: "tech-101" },
    { name: "Amit Pandey", id: "tech-103" },
    { name: "Vikas Kumar", id: "tech-104" },
    { name: "Sunita Verma", id: "tech-102" },
  ];

  const statuses: BookingStatus[] = [
    "Completed",
    "In Progress",
    "Completed",
    "Pending",
    "Refunded",
    "Completed",
    "Cancelled",
    "Waiting For Assignment",
    "Completed",
  ];

  const paymentMethods: Array<Booking["paymentMethod"]> = ["UPI", "Cash on Service", "Card", "Helpmate Wallet", "Online"];

  const generated: Booking[] = [];
  for (let i = 6; i <= 140; i++) {
    const numStr = String(8820 + i);
    const id = `HM-VAR-${numStr}`;
    const cust = customers[i % customers.length];
    const srv = services[i % services.length];
    const loc = localities[i % localities.length];
    const pin = pincodes[loc] || "221002";
    const status = statuses[i % statuses.length];
    const tech = technicians[i % technicians.length];

    const basePrice = srv.price;
    const convenienceFee = 49;
    const gstTotal = Math.round(basePrice * 0.18 * 100) / 100;
    const cgst = Math.round((gstTotal / 2) * 100) / 100;
    const sgst = cgst;
    const totalAmount = Math.round((basePrice + convenienceFee + gstTotal) * 100) / 100;
    const commissionAmount = Math.round(basePrice * 0.25 * 100) / 100;
    const partnerEarnings = Math.round(basePrice * 0.75 * 100) / 100;

    generated.push({
      id,
      customerName: cust.name,
      customerPhone: cust.phone,
      city: "Varanasi",
      locality: loc,
      pincode: pin,
      address: `Plot ${10 + (i % 50)}, ${loc} Main Road, Varanasi`,
      serviceTitle: srv.title,
      category: srv.category,
      basePrice,
      convenienceFee,
      cgst,
      sgst,
      totalAmount,
      invoiceType: i % 4 === 0 ? "B2B" : "B2C",
      commissionAmount,
      partnerEarnings,
      status,
      technicianName: status !== "Pending" && status !== "Waiting For Assignment" ? tech.name : undefined,
      technicianId: status !== "Pending" && status !== "Waiting For Assignment" ? tech.id : undefined,
      date: i % 2 === 0 ? `2026-08-${String(1 + (i % 10)).padStart(2, '0')}, 02:00 PM` : `2026-07-${String(10 + (i % 15)).padStart(2, '0')}`,
      timeSlot: "02:00 PM - 03:30 PM",
      paymentMethod: paymentMethods[i % paymentMethods.length],
      isOtpVerified: status === "Completed",
      otpCode: String(1000 + (i * 37) % 8999),
      callingDate: `2026-07-${15 + (i % 12)}`,
      callingPerson: ["Pooja Sharma (Operations)", "Sunil Gupta (Caller)", "Ritu Singh (Support)", "Anita Roy (CRM)"][i % 4],
      handledBy: ["Aman Verma (HQ)", "Varanasi Ops Admin", "Rajeev Verma (Lead)", "Priya Sharma (Ops)"][i % 4],
      notes: i % 3 === 0 ? "Customer requested morning slot. Handle with care." : undefined,
    });
  }

  return [...initialFiveBookings, ...generated];
};

export const initialBookings: Booking[] = generateMockBookings();

export const initialServices: ServiceItem[] = [
  {
    id: "srv-1",
    category: "ac",
    title: "Power Jet AC Servicing",
    subtitle: "High-pressure jet pump cleaning for indoor & outdoor units with anti-bacterial coating",
    price: 699,
    originalPrice: 999,
    duration: "45 mins",
    rating: 4.94,
    reviewsCount: 1420,
    isPopular: true,
    isInspectionBased: true,
    systemType: ["Split AC", "Window AC"],
    status: "Active",
    createdBy: "Aman Verma (Admin)",
    createdDate: "12 Jan 2026",
  },
  {
    id: "srv-2",
    category: "ac",
    title: "AC Gas Leakage Repair & Refilling",
    subtitle: "Comprehensive gas leak testing with eco-friendly R32/R410a refrigerant charging",
    price: 2499,
    originalPrice: 2999,
    duration: "60 mins",
    rating: 4.89,
    reviewsCount: 890,
    systemType: ["Split AC", "Window AC", "Inverter AC"],
    status: "Active",
    createdBy: "Aman Verma (Admin)",
    createdDate: "15 Jan 2026",
  },
  {
    id: "srv-3",
    category: "cleaning",
    title: "Elite Full Home Deep Cleaning",
    subtitle: "Deep scrubbing of all rooms, balcony, floor polishing, and UV sanitization",
    price: 4999,
    originalPrice: 6999,
    duration: "4 - 5 hrs",
    rating: 4.96,
    reviewsCount: 1120,
    isPopular: true,
    status: "Active",
  },
];

export const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Rajesh Kumar Agrawal",
    phone: "+91 77050 04040",
    alternatePhone: "+91 98390 99881",
    email: "rajesh.agrawal@gmail.com",
    locality: "Sigra",
    pincode: "221002",
    address: "D-58/16C Shashtri Nagar Colony, Sigra Main Road, Varanasi",
    secondaryLocality: "Mahmoorganj",
    secondaryAddress: "B-12/40 Shop No. 4, Mahmoorganj Commercial Complex, Varanasi",
    tier: "Crown Elite",
    totalSpend: 34500,
    totalBookings: 8,
    lastBookingDate: "Today, 04:30 PM",
    joinedDate: "12 Jan 2024",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    customerType: "Commercial Business / B2B",
    companyName: "Agrawal Electricals & Retail Solutions",
    customerGstin: "09AABCH1234H1Z5",
    householdType: "Commercial Office / Shop",
    registeredAppliances: ["3x Inverter AC 1.5 Ton", "1x Commercial Water Cooler", "1x Main Distribution Panel"],
    preferredLanguage: "Hindi",
    preferredTimeSlot: "Morning (9am-12pm)",
    loyaltyPoints: 1250,
    walletBalance: 1250,
    preferredPaymentMethod: "UPI Digital Prepaid (Google Pay)",
    crmManager: "Pooja Sharma (Operations HQ)",
    aadhaarNumber: "7821-4920-1102",
    aadhaarDocUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    membershipPlanName: "Crown Elite VIP",
    membershipStatus: "Active",
    membershipStartDate: "15 Jan 2026",
    membershipExpiryDate: "14 Jan 2027",
    freeServicesClaimed: 2,
    freeServicesTotal: 5,
    discountPercent: 20,
  },
  {
    id: "cust-2",
    name: "Dr. Ananya Mukherjee",
    phone: "+91 94501 22910",
    alternatePhone: "+91 94501 99000",
    email: "ananya.bhu@yahoo.in",
    locality: "Lanka / Assi Ghat",
    pincode: "221005",
    address: "Plot 12, Assi Ghat Road, Near BHU Gate, Lanka, Varanasi",
    secondaryLocality: "BHU Campus",
    secondaryAddress: "Faculty Quarter 45, Professor Colony, BHU Campus, Varanasi",
    tier: "Crown Elite",
    totalSpend: 28900,
    totalBookings: 6,
    lastBookingDate: "Yesterday",
    joinedDate: "05 Mar 2024",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    customerType: "Individual Household",
    householdType: "Villa / Bungalow",
    registeredAppliances: ["2x Split AC 1.5 Ton", "1x RO Water Purifier", "1x Front Load Washing Machine"],
    preferredLanguage: "English",
    preferredTimeSlot: "Evening (4pm-8pm)",
    loyaltyPoints: 940,
    walletBalance: 450,
    preferredPaymentMethod: "Credit Card (HDFC Bank)",
    crmManager: "Sunil Gupta (Varanasi Ops)",
    aadhaarNumber: "4920-1102-8821",
    aadhaarDocUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    membershipPlanName: "HelpMate Gold Club",
    membershipStatus: "Active",
    membershipStartDate: "01 Mar 2026",
    membershipExpiryDate: "28 Feb 2027",
    freeServicesClaimed: 1,
    freeServicesTotal: 3,
    discountPercent: 15,
  },
  {
    id: "cust-3",
    name: "Sanjay Mishra",
    phone: "+91 98390 11928",
    email: "sanjay.mishra@helpmate.com",
    locality: "Mahmoorganj",
    pincode: "221010",
    address: "B-32/12 Tulsipur, Near Galaxy Hospital, Mahmoorganj, Varanasi",
    tier: "VIP",
    totalSpend: 14200,
    totalBookings: 4,
    lastBookingDate: "28 Jul 2026",
    joinedDate: "18 Jun 2024",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    customerType: "Individual Household",
    householdType: "Apartment / Flat",
    registeredAppliances: ["1x Split AC", "1x Refrigerator 350L"],
    preferredLanguage: "Hindi",
    preferredTimeSlot: "Afternoon (12pm-4pm)",
    loyaltyPoints: 480,
    walletBalance: 200,
    preferredPaymentMethod: "Cash on Service",
    crmManager: "Ritu Singh (Support)",
    aadhaarNumber: "3310-9920-8812",
    aadhaarDocUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    membershipPlanName: "HelpMate Silver Pass",
    membershipStatus: "Expiring Soon",
    membershipStartDate: "20 Sep 2025",
    membershipExpiryDate: "19 Sep 2026",
    freeServicesClaimed: 1,
    freeServicesTotal: 1,
    discountPercent: 10,
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "log-901",
    user: "Aman Verma (Admin)",
    role: "Super Admin",
    action: "Validated Inspection Price (₹199 -> ₹699)",
    target: "Booking HM-VAR-8821 (Rajesh Agrawal)",
    timestamp: "Just now",
    locality: "Sigra",
  },
];

export const analyticsData = {
  totalRevenue: 1485200,
  monthlyGrowth: 24.8,
  activeBookings: 48,
  technicianFleet: 142,
  csatRating: 4.94,
  bondedInsuranceCoverage: 10000,
  monthlyChart: [
    { month: "Jan", revenue: 840000, bookings: 710 },
    { month: "Feb", revenue: 960000, bookings: 820 },
    { month: "Mar", revenue: 1120000, bookings: 940 },
    { month: "Apr", revenue: 1280000, bookings: 1080 },
    { month: "May", revenue: 1420000, bookings: 1210 },
    { month: "Jun", revenue: 1390000, bookings: 1180 },
    { month: "Jul", revenue: 1485200, bookings: 1290 },
  ],
  categoryBreakdown: [
    { category: "Power Jet AC", percentage: 38, count: 490, color: "#8D397E" },
    { category: "Elite Deep Cleaning", percentage: 26, count: 335, color: "#10B981" },
    { category: "Home Salon & Spa", percentage: 18, count: 232, color: "#F59E0B" },
    { category: "Electrician & MCB", percentage: 11, count: 142, color: "#3B82F6" },
    { category: "Hydro Jet Plumbing", percentage: 7, count: 91, color: "#EC4899" },
  ],
};

export const initialCategoryCommissionRules: CategoryCommissionRule[] = [
  { id: "cc-1", categoryName: "AC Service & Repair", commissionPercentage: 25, convenienceFeeSharePercentage: 100, minimumCommissionFloor: 150, status: "Active" },
  { id: "cc-2", categoryName: "Elite Deep Cleaning", commissionPercentage: 20, convenienceFeeSharePercentage: 100, minimumCommissionFloor: 300, status: "Active" },
  { id: "cc-3", categoryName: "Smart Home Electrician", commissionPercentage: 15, convenienceFeeSharePercentage: 100, minimumCommissionFloor: 50, status: "Active" },
  { id: "cc-4", categoryName: "Hydro Jet Plumbing", commissionPercentage: 18, convenienceFeeSharePercentage: 100, minimumCommissionFloor: 75, status: "Active" },
  { id: "cc-5", categoryName: "Home Salon & Spa", commissionPercentage: 30, convenienceFeeSharePercentage: 100, minimumCommissionFloor: 200, status: "Active" },
  { id: "cc-6", categoryName: "Appliance Repair", commissionPercentage: 22, convenienceFeeSharePercentage: 100, minimumCommissionFloor: 100, status: "Active" },
  { id: "cc-7", categoryName: "Car & Bike Wash", commissionPercentage: 20, convenienceFeeSharePercentage: 100, minimumCommissionFloor: 80, status: "Active" },
  { id: "cc-8", categoryName: "Pest Control", commissionPercentage: 25, convenienceFeeSharePercentage: 100, minimumCommissionFloor: 250, status: "Active" },
];

export const initialSettlementRecords: SettlementRecord[] = [
  {
    id: "SETTL-VAR-910",
    technicianId: "tech-101",
    technicianName: "Ramesh Yadav",
    category: "AC Servicing & Repair",
    bankAccountName: "Ramesh Yadav",
    bankAccountNumber: "9820-1049-8120",
    ifscCode: "SBIN0001240",
    upiId: "ramesh.yadav@okaxis",
    grossAmount: 48000,
    commissionDeducted: 12000,
    netPayoutAmount: 36000,
    paymentMethod: "Manual Bank Transfer (IMPS / NEFT)",
    utrNumber: "IMPS-VAR-2026-9928102830",
    settlementDate: "14 Aug 2026",
    period: "07 Aug - 13 Aug 2026",
    status: "Completed",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80",
    notes: "Today's daily payout processed successfully",
  },
  {
    id: "SETTL-VAR-909",
    technicianId: "tech-102",
    technicianName: "Sunita Verma",
    category: "Beauty & Spa",
    bankAccountName: "Sunita Verma",
    bankAccountNumber: "4910-2910-4491",
    ifscCode: "HDFC0000142",
    upiId: "sunita.verma@okhdfcbank",
    grossAmount: 36000,
    commissionDeducted: 9000,
    netPayoutAmount: 27000,
    paymentMethod: "Manual UPI Transfer",
    utrNumber: "UPI-VAR-2026-8819203910",
    settlementDate: "14 Aug 2026",
    period: "07 Aug - 13 Aug 2026",
    status: "Completed",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80",
    notes: "Today's settlement completed",
  },
  {
    id: "SETTL-VAR-908",
    technicianId: "tech-103",
    technicianName: "Amit Pandey",
    category: "Electrician",
    bankAccountName: "Amit Pandey",
    bankAccountNumber: "1102-4910-8820",
    ifscCode: "ICIC0000492",
    upiId: "amit.pandey@icici",
    grossAmount: 24000,
    commissionDeducted: 6000,
    netPayoutAmount: 18000,
    paymentMethod: "Manual Bank Transfer (IMPS / NEFT)",
    utrNumber: "NEFT-VAR-2026-3392019482",
    settlementDate: "12 Aug 2026",
    period: "05 Aug - 11 Aug 2026",
    status: "Completed",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "SETTL-VAR-907",
    technicianId: "tech-104",
    technicianName: "Manoj Kumar",
    category: "Plumbing",
    bankAccountName: "Manoj Kumar",
    bankAccountNumber: "7710-4920-1120",
    ifscCode: "PUNB0004810",
    upiId: "manoj.plumber@paytm",
    grossAmount: 32000,
    commissionDeducted: 8000,
    netPayoutAmount: 24000,
    paymentMethod: "Manual Cash Payout",
    utrNumber: "CASH-VAR-2026-991029",
    settlementDate: "10 Aug 2026",
    period: "03 Aug - 09 Aug 2026",
    status: "Completed",
  },
  {
    id: "SETTL-VAR-901",
    technicianId: "tech-101",
    technicianName: "Ramesh Yadav",
    category: "AC Repair",
    bankAccountName: "Ramesh Yadav",
    bankAccountNumber: "9820-1049-8120",
    ifscCode: "SBIN0001240",
    upiId: "ramesh.yadav@okaxis",
    grossAmount: 56800,
    commissionDeducted: 14200,
    netPayoutAmount: 42600,
    paymentMethod: "IMPS Bank Transfer",
    utrNumber: "IMPS-VAR-2026-9812401824",
    settlementDate: "01 Aug 2026",
    period: "25 Jul - 31 Jul 2026",
    status: "Completed",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80",
    notes: "Monthly settlement processed cleanly",
  },
  {
    id: "SETTL-VAR-902",
    technicianId: "tech-102",
    technicianName: "Sunita Verma",
    category: "Beauty & Spa",
    bankAccountName: "Sunita Verma",
    bankAccountNumber: "4910-2910-4491",
    ifscCode: "HDFC0000142",
    upiId: "sunita.verma@okhdfcbank",
    grossAmount: 75600,
    commissionDeducted: 18900,
    netPayoutAmount: 56700,
    paymentMethod: "NEFT Direct",
    utrNumber: "NEFT-VAR-2026-4491029102",
    settlementDate: "20 Jan 2026",
    period: "13 Jan - 19 Jan 2026",
    status: "Completed",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80",
    notes: "Batch payout verified by Finance Manager",
  },
];

export interface SupportMessage {
  id: string;
  sender: "Customer" | "Support Agent" | "System";
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportCallLog {
  id: string;
  agentName: string;
  durationSeconds: number;
  outcome: "Resolved" | "Follow-up Scheduled" | "Unreachable" | "Customer Call Ended";
  notes: string;
  timestamp: string;
}

export interface SupportTicketItem {
  id: string;
  bookingId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partnerName?: string;
  category: string;
  issueCategory: "Booking & Scheduling" | "Payments & Billing" | "Service Quality" | "Partner Conduct" | "General Inquiry";
  subject: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Replied" | "Customer Replied" | "In Progress" | "In Review" | "Answered" | "Closed";
  assignedAgent?: string;
  assignedAdmin?: string;
  createdDate: string;
  lastUpdated: string;
  messages: SupportMessage[];
  callLogs: SupportCallLog[];
  internalNotes?: string[];
}

export interface OfficeAdminProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  department: string;
  location: string;
  assignedTicketsCount: number;
}

export const officeAdminProfiles: Record<string, OfficeAdminProfile> = {
  "Priya Sharma": {
    id: "adm-101",
    name: "Priya Sharma",
    role: "Senior Office Admin & Support Lead",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    email: "priya.sharma@helpmate.com",
    phone: "+91 98390 12345",
    department: "Customer Operations & Support Desk",
    location: "Varanasi HQ",
    assignedTicketsCount: 14,
  },
  "Rohan Verma": {
    id: "adm-102",
    name: "Rohan Verma",
    role: "Office Admin & Dispatch Coordinator",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    email: "rohan.verma@helpmate.com",
    phone: "+91 94152 67890",
    department: "Partner Logistics & Scheduling",
    location: "Varanasi HQ",
    assignedTicketsCount: 9,
  },
  "Anand Verma": {
    id: "adm-103",
    name: "Anand Verma",
    role: "Office Admin & Billing Specialist",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    email: "anand.verma@helpmate.com",
    phone: "+91 91234 56789",
    department: "Finance & Refunds Desk",
    location: "Varanasi HQ",
    assignedTicketsCount: 6,
  },
  "Neha Kapoor": {
    id: "adm-104",
    name: "Neha Kapoor",
    role: "Office Admin & QC Inspector",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    email: "neha.kapoor@helpmate.com",
    phone: "+91 98381 44920",
    department: "Quality Assurance & Compliance",
    location: "Varanasi HQ",
    assignedTicketsCount: 4,
  },
  "Aman Verma": {
    id: "adm-100",
    name: "Aman Verma",
    role: "Super Admin & Operations Lead",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    email: "aman.verma@helpmate.com",
    phone: "+91 99350 11200",
    department: "Executive Management",
    location: "Varanasi HQ",
    assignedTicketsCount: 22,
  },
};

export const officeAdminsList: string[] = [
  "Priya Sharma",
  "Rohan Verma",
  "Anand Verma",
  "Neha Kapoor",
  "Aman Verma",
];

export const initialSupportTickets: SupportTicketItem[] = [
  {
    id: "TKT-VAR-9910",
    bookingId: "HM-VAR-8821",
    customerName: "Rajesh Agrawal",
    customerPhone: "+91 98390 12345",
    customerEmail: "rajesh.agrawal@gmail.com",
    partnerName: "Ramesh Yadav",
    category: "AC Service & Repair",
    issueCategory: "Service Quality",
    subject: "Water leaking from Split AC indoor unit post jet wash service",
    description: "Technician completed jet cleaning yesterday afternoon. Today morning water started dripping continuously onto the living room wall. Request urgent technician re-visit under 30-day warranty.",
    priority: "High",
    status: "Replied",
    assignedAgent: "Priya Sharma (Senior Support Specialist)",
    assignedAdmin: "Priya Sharma",
    createdDate: "2026-08-20T10:15:00Z",
    lastUpdated: "2026-08-20T10:30:00Z",
    messages: [
      {
        id: "msg-1",
        sender: "Customer",
        senderName: "Rajesh Agrawal",
        text: "Hello support team, water is dripping heavily from the AC indoor unit after yesterday's jet cleaning.",
        timestamp: "2026-08-20 10:15 AM",
      },
      {
        id: "msg-2",
        sender: "Support Agent",
        senderName: "Priya Sharma",
        text: "Greetings Mr. Rajesh. We apologize for the inconvenience! We have flagged your request under 30-day warranty and are dispatching partner Ramesh Yadav for a free re-inspection.",
        timestamp: "2026-08-20 10:30 AM",
      },
    ],
    callLogs: [
      {
        id: "call-1",
        agentName: "Priya Sharma",
        durationSeconds: 180,
        outcome: "Follow-up Scheduled",
        notes: "Called customer to confirm location and drain pipe issue details. Partner notified for priority re-visit.",
        timestamp: "2026-08-20 10:25 AM",
      },
    ],
    internalNotes: [
      "Drain hose pipe clog suspected post jet wash. Re-visit scheduled free of charge.",
    ],
  },
  {
    id: "TKT-VAR-9911",
    bookingId: "HM-VAR-8820",
    customerName: "Alok Verma",
    customerPhone: "+91 94152 67890",
    customerEmail: "alok.verma@yahoo.com",
    partnerName: "Amit Sharma",
    category: "Electrical & Wiring",
    issueCategory: "Partner Conduct",
    subject: "Technician arrived 45 mins late without prior status update",
    description: "Scheduled slot was 10:00 AM - 12:00 PM. Technician arrived at 12:45 PM without calling in advance to notify about traffic delay.",
    priority: "Medium",
    status: "Customer Replied",
    assignedAgent: "Rohan V. (HelpMate Support)",
    assignedAdmin: "Rohan Verma",
    createdDate: "2026-08-19T14:20:00Z",
    lastUpdated: "2026-08-19T15:10:00Z",
    messages: [
      {
        id: "msg-101",
        sender: "Customer",
        senderName: "Alok Verma",
        text: "The technician arrived almost an hour late and did not call beforehand.",
        timestamp: "2026-08-19 02:20 PM",
      },
      {
        id: "msg-102",
        sender: "Support Agent",
        senderName: "Rohan V.",
        text: "We sincerely apologize Mr. Alok. Partner penalty advisory issued and ₹100 courtesy wallet credit applied.",
        timestamp: "2026-08-19 03:00 PM",
      },
      {
        id: "msg-103",
        sender: "Customer",
        senderName: "Alok Verma",
        text: "Thank you for the credit. Please ensure technicians are punctual in future bookings.",
        timestamp: "2026-08-19 03:15 PM",
      },
    ],
    callLogs: [
      {
        id: "call-101",
        agentName: "Rohan V.",
        durationSeconds: 240,
        outcome: "Resolved",
        notes: "Customer accepted courtesy credit of ₹100 for delay.",
        timestamp: "2026-08-19 03:10 PM",
      },
    ],
    internalNotes: ["Partner cautioned regarding ETA updates."],
  },
  {
    id: "TKT-VAR-9912",
    bookingId: "HM-VAR-8818",
    customerName: "Priya Sharma",
    customerPhone: "+91 91234 56789",
    category: "Plumbing Services",
    issueCategory: "Payments & Billing",
    subject: "Double UPI transaction deduction for faucet installation",
    description: "Payment failed on first attempt via PhonePe but amount ₹599 was debited from bank account. Second payment of ₹599 succeeded.",
    priority: "High",
    status: "In Review",
    assignedAgent: "Anand Verma (Finance Desk)",
    assignedAdmin: "Anand Verma",
    createdDate: "2026-08-18T11:00:00Z",
    lastUpdated: "2026-08-18T12:00:00Z",
    messages: [
      {
        id: "msg-201",
        sender: "Customer",
        senderName: "Priya Sharma",
        text: "I was debited twice (₹599 x 2) for UTR #99102910.",
        timestamp: "2026-08-18 11:00 AM",
      },
    ],
    callLogs: [],
    internalNotes: ["Finance team initiated reversal for failed UPI transaction UTR #99102910."],
  },
  {
    id: "TKT-VAR-9913",
    bookingId: "HM-VAR-8819",
    customerName: "Sunita Devi",
    customerPhone: "+91 98381 44920",
    category: "Home Cleaning",
    issueCategory: "Booking & Scheduling",
    subject: "Reschedule slot change request for Sunday morning",
    description: "Requested time slot shift from 2:00 PM to 9:00 AM for deep kitchen cleaning.",
    priority: "Low",
    status: "Answered",
    assignedAgent: "Priya Sharma",
    assignedAdmin: "Priya Sharma",
    createdDate: "2026-08-17T09:00:00Z",
    lastUpdated: "2026-08-17T09:45:00Z",
    messages: [
      {
        id: "msg-301",
        sender: "Support Agent",
        senderName: "Priya Sharma",
        text: "Slot updated to Sunday 09:00 AM - 11:00 AM. Confirmation SMS sent.",
        timestamp: "2026-08-17 09:45 AM",
      },
    ],
    callLogs: [
      {
        id: "call-301",
        agentName: "Priya Sharma",
        durationSeconds: 120,
        outcome: "Resolved",
        notes: "Customer confirmed new morning slot.",
        timestamp: "2026-08-17 09:40 AM",
      },
    ],
    internalNotes: ["Schedule updated on partner calendar."],
  },
  {
    id: "TKT-VAR-9914",
    customerName: "Vikas Malhotra",
    customerPhone: "+91 99350 11200",
    category: "Appliance Repair",
    issueCategory: "General Inquiry",
    subject: "Inquiry regarding 30-Day HelpMate Repair Protection Warranty",
    description: "Customer inquired if spare parts replaced during washing machine repair carry a separate manufacturer warranty.",
    priority: "Low",
    status: "Answered",
    assignedAgent: "Rohan V.",
    assignedAdmin: "Rohan Verma",
    createdDate: "2026-08-15T16:00:00Z",
    lastUpdated: "2026-08-15T16:20:00Z",
    messages: [
      {
        id: "msg-401",
        sender: "Support Agent",
        senderName: "Rohan V.",
        text: "All genuine spare parts replaced by HelpMate specialists carry a 90-day manufacturer warranty in addition to our 30-day labor warranty.",
        timestamp: "2026-08-15 04:20 PM",
      },
    ],
    callLogs: [],
    internalNotes: ["Warranty terms explained to customer."],
  },
  {
    id: "TKT-VAR-9915",
    bookingId: "HM-VAR-8825",
    customerName: "Sanjay Gupta",
    customerPhone: "+91 97920 44556",
    customerEmail: "sanjay.gupta@gmail.com",
    partnerName: "Sunil Kumar",
    category: "Plumbing Services",
    issueCategory: "Service Quality",
    subject: "Main pipe leakage under kitchen sink post coupler repair",
    description: "Technician installed new PVC coupler joint yesterday. Water leakage started under sink this morning. Urgent partner re-inspection requested.",
    priority: "High",
    status: "In Review",
    assignedAgent: undefined,
    assignedAdmin: undefined,
    createdDate: "2026-08-25T08:30:00Z",
    lastUpdated: "2026-08-25T08:30:00Z",
    messages: [
      {
        id: "msg-501",
        sender: "Customer",
        senderName: "Sanjay Gupta",
        text: "Please send a technician urgently. Water is leaking continuously from the sink pipe joint.",
        timestamp: "2026-08-25 08:30 AM",
      },
    ],
    callLogs: [],
    internalNotes: ["Unassigned ticket created via app support portal. Awaiting Office Admin allocation."],
  },
  {
    id: "TKT-VAR-9916",
    bookingId: "HM-VAR-8829",
    customerName: "Meena Mishra",
    customerPhone: "+91 94501 88234",
    customerEmail: "meena.mishra@outlook.com",
    category: "Electrical & Wiring",
    issueCategory: "Payments & Billing",
    subject: "Refund for canceled switchboard repair booking not credited",
    description: "Booking was canceled 3 days ago prior to partner dispatch. Refund of ₹399 has not reflected in HelpMate wallet.",
    priority: "Medium",
    status: "In Review",
    assignedAgent: undefined,
    assignedAdmin: undefined,
    createdDate: "2026-08-24T14:15:00Z",
    lastUpdated: "2026-08-24T16:00:00Z",
    messages: [
      {
        id: "msg-601",
        sender: "Customer",
        senderName: "Meena Mishra",
        text: "When will my canceled booking refund of ₹399 be processed?",
        timestamp: "2026-08-24 02:15 PM",
      },
    ],
    callLogs: [],
    internalNotes: ["Pending billing desk assignment."],
  },
  {
    id: "TKT-VAR-9917",
    bookingId: "HM-VAR-8832",
    customerName: "Karan Johar",
    customerPhone: "+91 98399 77112",
    customerEmail: "karan.j@gmail.com",
    category: "AC Service & Repair",
    issueCategory: "Partner Conduct",
    subject: "Technician demanded extra cash payment above invoice",
    description: "Technician asked for ₹350 cash for extra gas pressure testing which was already included in the standard service package.",
    priority: "High",
    status: "In Review",
    assignedAgent: undefined,
    assignedAdmin: undefined,
    createdDate: "2026-08-25T11:00:00Z",
    lastUpdated: "2026-08-25T11:00:00Z",
    messages: [
      {
        id: "msg-701",
        sender: "Customer",
        senderName: "Karan Johar",
        text: "The technician demanded ₹350 extra in cash. Please check the booking invoice.",
        timestamp: "2026-08-25 11:00 AM",
      },
    ],
    callLogs: [],
    internalNotes: ["High priority conduct complaint needing prompt admin assignment."],
  },
  {
    id: "TKT-VAR-9918",
    bookingId: "HM-VAR-8835",
    customerName: "Anjali Rao",
    customerPhone: "+91 91612 33445",
    customerEmail: "anjali.rao@gmail.com",
    category: "Home Cleaning",
    issueCategory: "Booking & Scheduling",
    subject: "Request to update service location address for tomorrow",
    description: "Shifted house within Sigra neighborhood. Requesting address update before tomorrow's deep cleaning slot.",
    priority: "Low",
    status: "In Review",
    assignedAgent: undefined,
    assignedAdmin: undefined,
    createdDate: "2026-08-26T07:45:00Z",
    lastUpdated: "2026-08-26T07:45:00Z",
    messages: [
      {
        id: "msg-801",
        sender: "Customer",
        senderName: "Anjali Rao",
        text: "Hi, I need to update my home address for tomorrow's cleaning service.",
        timestamp: "2026-08-26 07:45 AM",
      },
    ],
    callLogs: [],
    internalNotes: ["Location modification request. Awaiting admin assignment."],
  },
];

// Membership & VIP Club Interfaces
export interface IncludedServiceRule {
  id?: string;
  serviceTitle: string;
  category?: string;
  serviceType?: string;
  benefitType: "Free" | "PercentDiscount" | "FixedDiscount";
  discountPercent: number; // e.g. 100 for 100% Free, 20 for 20% OFF
  discountAmount?: number; // e.g. ₹200 OFF
  usageLimit: string; // e.g. "Unlimited", "1 / year", "2 / year", "4 / year"
}

export interface MembershipPlan {
  id: string;
  name: string; // e.g. HelpMate Silver Pass, HelpMate Gold Club, Crown Elite VIP
  slug: string;
  tagline: string;
  price: number; // e.g. 499, 999, 1999
  originalPrice: number; // e.g. 999, 1999, 3999
  billingCycle: "Annual" | "Quarterly" | "Monthly";
  badge: string; // e.g. "Most Popular", "Best Value", "Elite VIP"
  discountPercent: number; // e.g. 10, 15, 20
  freeServicesCount: number; // total free services included
  convenienceFeeWaiver: boolean;
  priorityDispatchMinutes: number; // e.g. 15 mins priority
  freeCancellation: boolean;
  dedicatedManager: boolean;
  activeSubscribersCount: number;
  status: "Active" | "Draft" | "Archived";
  colorTheme: string; // gradient CSS or color hex
  customPrimaryColor?: string;
  customSecondaryColor?: string;
  perks: string[];
  includedServices?: (string | IncludedServiceRule)[]; // Covered service categories and per-service discount rules
}

export interface FreeServiceOffer {
  id: string;
  serviceTitle: string;
  category: string;
  eligiblePlans: string[]; // plan IDs
  annualQuota: number; // max per member per year
  unitValue: number; // retail value ₹
  totalClaimedCount: number;
  status: "Active" | "Paused";
}

export interface MemberSubscriber {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locality: string;
  planId: string;
  planName: string;
  subscribedDate: string;
  expiryDate: string;
  daysRemaining: number;
  freeServicesUsed: number;
  freeServicesTotal: number;
  totalSavingsAmount: number;
  status: "Active" | "Expired" | "Cancelled";
}

export const initialMembershipPlans: MembershipPlan[] = [
  {
    id: "plan-silver",
    name: "HelpMate Silver Pass",
    slug: "silver-pass",
    tagline: "Essential savings for regular home maintenance",
    price: 499,
    originalPrice: 999,
    billingCycle: "Annual",
    badge: "Starter",
    discountPercent: 10,
    freeServicesCount: 1,
    convenienceFeeWaiver: true,
    priorityDispatchMinutes: 30,
    freeCancellation: false,
    dedicatedManager: false,
    activeSubscribersCount: 420,
    status: "Active",
    colorTheme: "from-blue-600 via-indigo-600 to-slate-900",
    includedServices: ["Electrical Maintenance", "Plumbing Care", "Water Purifier (RO)"],
    perks: [
      "10% Flat Discount on all Services",
      "1x FREE Electrical Inspection per year",
      "₹0 Convenience Fee on all bookings",
      "Priority Technician Slot Booking",
    ],
  },
  {
    id: "plan-gold",
    name: "HelpMate Gold Club",
    slug: "gold-club",
    tagline: "Our most popular VIP plan with free AC servicing",
    price: 999,
    originalPrice: 1999,
    billingCycle: "Annual",
    badge: "🔥 Most Popular",
    discountPercent: 15,
    freeServicesCount: 3,
    convenienceFeeWaiver: true,
    priorityDispatchMinutes: 15,
    freeCancellation: true,
    dedicatedManager: false,
    activeSubscribersCount: 840,
    status: "Active",
    colorTheme: "from-amber-600 via-amber-500 to-yellow-600",
    includedServices: ["AC & Appliance Servicing", "Electrical Maintenance", "Plumbing Care", "Home Deep Cleaning", "Water Purifier (RO)"],
    perks: [
      "15% Unlimited Discount across all categories",
      "2x FREE AC Jet Cleaning Services (₹1,198 Value)",
      "1x FREE Plumbing Safety Health Check",
      "Zero Convenience Fee & Free Rescheduling",
      "15-Minute Express Priority Dispatch",
    ],
  },
  {
    id: "plan-crown-elite",
    name: "Crown Elite VIP",
    slug: "crown-elite",
    tagline: "Ultimate luxury home care with unlimited VIP perks",
    price: 1999,
    originalPrice: 3999,
    billingCycle: "Annual",
    badge: "👑 VIP Elite",
    discountPercent: 20,
    freeServicesCount: 5,
    convenienceFeeWaiver: true,
    priorityDispatchMinutes: 10,
    freeCancellation: true,
    dedicatedManager: true,
    activeSubscribersCount: 168,
    status: "Active",
    colorTheme: "from-purple-900 via-purple-700 to-brand-600",
    includedServices: ["AC & Appliance Servicing", "Electrical Maintenance", "Plumbing Care", "Home Deep Cleaning", "Water Purifier (RO)", "Home Painting & Waterproofing", "Pest Control & Fumigation"],
    perks: [
      "20% Maximum Discount on all repairs & maintenance",
      "2x FREE AC Foam Jet Servicing (₹1,598 Value)",
      "1x FREE Bathroom Hydro Deep Cleaning (₹699 Value)",
      "1x FREE Full Home Electrical Audit (₹499 Value)",
      "1x FREE Plumbing Tap Leak Repair (₹299 Value)",
      "Dedicated Personal Account Manager on Call",
      "10-Minute Superfast Priority Dispatch Guarantee",
    ],
  },
];

export const initialFreeServiceOffers: FreeServiceOffer[] = [
  {
    id: "free-srv-1",
    serviceTitle: "AC Foam Jet Deep Cleaning (Split/Window)",
    category: "AC Servicing & Repair",
    eligiblePlans: ["plan-gold", "plan-crown-elite"],
    annualQuota: 2,
    unitValue: 699,
    totalClaimedCount: 1890,
    status: "Active",
  },
  {
    id: "free-srv-2",
    serviceTitle: "Full Home Electrical Safety & MCB Inspection",
    category: "Smart Home Electrician",
    eligiblePlans: ["plan-silver", "plan-gold", "plan-crown-elite"],
    annualQuota: 1,
    unitValue: 399,
    totalClaimedCount: 1240,
    status: "Active",
  },
  {
    id: "free-srv-3",
    serviceTitle: "Bathroom Hydro Cleaning & Descaling",
    category: "Deep Cleaning",
    eligiblePlans: ["plan-crown-elite"],
    annualQuota: 1,
    unitValue: 699,
    totalClaimedCount: 310,
    status: "Active",
  },
  {
    id: "free-srv-4",
    serviceTitle: "Tap & Pipe Leak Health Checkup",
    category: "Hydro Jet Plumbing",
    eligiblePlans: ["plan-gold", "plan-crown-elite"],
    annualQuota: 1,
    unitValue: 299,
    totalClaimedCount: 400,
    status: "Active",
  },
];

export const initialMemberSubscribers: MemberSubscriber[] = [
  {
    id: "sub-101",
    customerName: "Rohan Sharma",
    customerPhone: "+91 98765 43210",
    customerEmail: "rohan.sharma@example.com",
    locality: "Lanka, Varanasi",
    planId: "plan-gold",
    planName: "HelpMate Gold Club",
    subscribedDate: "2026-01-15",
    expiryDate: "2027-01-15",
    daysRemaining: 146,
    freeServicesUsed: 2,
    freeServicesTotal: 3,
    totalSavingsAmount: 3250,
    status: "Active",
  },
  {
    id: "sub-102",
    customerName: "Ananya Roy",
    customerPhone: "+91 91234 56789",
    customerEmail: "ananya.roy@example.com",
    locality: "Sigra, Varanasi",
    planId: "plan-crown-elite",
    planName: "Crown Elite VIP",
    subscribedDate: "2025-11-20",
    expiryDate: "2026-11-20",
    daysRemaining: 90,
    freeServicesUsed: 4,
    freeServicesTotal: 5,
    totalSavingsAmount: 6490,
    status: "Active",
  },
  {
    id: "sub-103",
    customerName: "Vikas Malhotra",
    customerPhone: "+91 99350 11200",
    customerEmail: "vikas.m@example.com",
    locality: "Bhelupur, Varanasi",
    planId: "plan-silver",
    planName: "HelpMate Silver Pass",
    subscribedDate: "2026-03-10",
    expiryDate: "2027-03-10",
    daysRemaining: 200,
    freeServicesUsed: 1,
    freeServicesTotal: 1,
    totalSavingsAmount: 1120,
    status: "Active",
  },
  {
    id: "sub-104",
    customerName: "Sunita Verma",
    customerPhone: "+91 98390 44321",
    customerEmail: "sunita.verma@example.com",
    locality: "Cantonment, Varanasi",
    planId: "plan-gold",
    planName: "HelpMate Gold Club",
    subscribedDate: "2025-08-01",
    expiryDate: "2026-08-01",
    daysRemaining: 0,
    freeServicesUsed: 3,
    freeServicesTotal: 3,
    totalSavingsAmount: 2890,
    status: "Expired",
  },
];

export type LeadStatus =
  | "New Inquiry"
  | "Contacted & Qualified"
  | "Inspection Scheduled"
  | "Quotation Sent"
  | "Converted"
  | "Lost";

export type LeadSource =
  | "WhatsApp Inquiry"
  | "Website Form"
  | "Google Ads"
  | "Missed Call Desk"
  | "Customer Referral"
  | "Mobile App Sign-up"
  | "Support Desk";

export type LeadPriority = "Urgent" | "High" | "Medium" | "Low";

export interface LeadInteraction {
  id: string;
  type: "Call" | "WhatsApp" | "Note" | "StatusChange" | "Quotation";
  author: string;
  text: string;
  timestamp: string;
}

export interface LeadCRMItem {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  locality: string;
  address: string;
  serviceCategory: string;
  serviceRequested: string;
  leadSource: LeadSource;
  leadScore: number;
  estimatedValue: number;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string;
  followUpDate: string;
  createdDate: string;
  lastContacted: string;
  notesHistory: LeadInteraction[];
  convertedBookingId?: string;
  lostReason?: string;
}

export const initialLeadItems: LeadCRMItem[] = [
  {
    id: "LEAD-2026-901",
    customerName: "Rajesh Tripathi",
    phone: "+91 98391 12345",
    email: "rajesh.tripathi@gmail.com",
    locality: "Lanka, Varanasi",
    address: "B-12/44 Near BHU Gate, Lanka",
    serviceCategory: "AC & Appliance Repair",
    serviceRequested: "AC Master Deep Clean & Gas Refill",
    leadSource: "WhatsApp Inquiry",
    leadScore: 88,
    estimatedValue: 3499,
    status: "New Inquiry",
    priority: "Urgent",
    assignedTo: "Aman Verma (HQ)",
    followUpDate: "2026-08-24 14:00",
    createdDate: "2026-08-24 09:15",
    lastContacted: "2026-08-24 09:30",
    notesHistory: [
      {
        id: "nt-1",
        type: "WhatsApp",
        author: "System Bot",
        text: "Inquiry received via WhatsApp for AC Cooling issue & Deep Servicing.",
        timestamp: "2026-08-24 09:15",
      },
      {
        id: "nt-2",
        type: "Note",
        author: "Aman Verma (HQ)",
        text: "Customer requested urgent service slot before 3 PM today due to guest arrival.",
        timestamp: "2026-08-24 09:30",
      },
    ],
  },
  {
    id: "LEAD-2026-902",
    customerName: "Priyanka Singh",
    phone: "+91 94502 67890",
    email: "priyanka.singh@yahoo.com",
    locality: "Sigra, Varanasi",
    address: "Flat 302, Royal Residency, Sigra",
    serviceCategory: "Water Purifier (RO)",
    serviceRequested: "RO Water Purifier Repair & Membrane Filter Change",
    leadSource: "Website Form",
    leadScore: 92,
    estimatedValue: 2450,
    status: "Contacted & Qualified",
    priority: "High",
    assignedTo: "Rahul Singh (VNS Lead)",
    followUpDate: "2026-08-24 16:30",
    createdDate: "2026-08-23 18:40",
    lastContacted: "2026-08-24 10:15",
    notesHistory: [
      {
        id: "nt-3",
        type: "Call",
        author: "Rahul Singh (VNS Lead)",
        text: "Called customer. High TDS water taste issue reported. Scheduled technician visit confirmation.",
        timestamp: "2026-08-24 10:15",
      },
    ],
  },
  {
    id: "LEAD-2026-903",
    customerName: "Alok Nath Gupta",
    phone: "+91 99350 45678",
    email: "alok.gupta@guptatraders.in",
    locality: "Ravindrapuri, Varanasi",
    address: "C-14/89 Ravindrapuri Main Rd",
    serviceCategory: "Painting & Renovation",
    serviceRequested: "Full Home Waterproofing & Interior Painting Consultation",
    leadSource: "Google Ads",
    leadScore: 78,
    estimatedValue: 38000,
    status: "Inspection Scheduled",
    priority: "High",
    assignedTo: "Priya Sharma (Ops)",
    followUpDate: "2026-08-25 11:00",
    createdDate: "2026-08-22 11:20",
    lastContacted: "2026-08-23 15:45",
    notesHistory: [
      {
        id: "nt-4",
        type: "Call",
        author: "Priya Sharma (Ops)",
        text: "Customer wants dampness inspection for 3BHK bungalow before festival season.",
        timestamp: "2026-08-22 14:10",
      },
      {
        id: "nt-5",
        type: "StatusChange",
        author: "Priya Sharma (Ops)",
        text: "Assigned senior inspector Manoj Kumar for laser dampness check on Aug 25.",
        timestamp: "2026-08-23 15:45",
      },
    ],
  },
  {
    id: "LEAD-2026-904",
    customerName: "Manish Upadhyay",
    phone: "+91 98388 99112",
    email: "m.upadhyay@gmail.com",
    locality: "Mahmoorganj, Varanasi",
    address: "Lane 4, Vivekanand Nagar, Mahmoorganj",
    serviceCategory: "Electrical Works",
    serviceRequested: "3-Phase Electric DB Box Installation & Rewiring",
    leadSource: "Missed Call Desk",
    leadScore: 82,
    estimatedValue: 8900,
    status: "Quotation Sent",
    priority: "Urgent",
    assignedTo: "Rajeev Verma (Lead)",
    followUpDate: "2026-08-24 18:00",
    createdDate: "2026-08-23 09:00",
    lastContacted: "2026-08-24 11:00",
    notesHistory: [
      {
        id: "nt-6",
        type: "Quotation",
        author: "Rajeev Verma (Lead)",
        text: "Sent official quotation ₹8,900 via PDF & WhatsApp (includes Havells MCB & heavy gauge copper wire).",
        timestamp: "2026-08-24 11:00",
      },
    ],
  },
  {
    id: "LEAD-2026-905",
    customerName: "Smita Chaurasia",
    phone: "+91 91612 33445",
    email: "smita.chaurasia@gmail.com",
    locality: "Sarnath, Varanasi",
    address: "H.No 88, Near Archaeological Museum, Sarnath",
    serviceCategory: "Deep Cleaning",
    serviceRequested: "Kitchen Deep Cleaning & Chimney Degreasing",
    leadSource: "Customer Referral",
    leadScore: 95,
    estimatedValue: 4200,
    status: "Converted",
    priority: "Medium",
    assignedTo: "Aman Verma (HQ)",
    followUpDate: "Completed",
    createdDate: "2026-08-21 14:15",
    lastContacted: "2026-08-22 17:00",
    convertedBookingId: "BK-VNS-8841",
    notesHistory: [
      {
        id: "nt-7",
        type: "StatusChange",
        author: "Aman Verma (HQ)",
        text: "Customer accepted quote ₹4,200. Converted lead to booking BK-VNS-8841.",
        timestamp: "2026-08-22 17:00",
      },
    ],
  },
  {
    id: "LEAD-2026-906",
    customerName: "Devendra Pandey",
    phone: "+91 97920 88776",
    email: "devendra.p@rediffmail.com",
    locality: "Cantonment, Varanasi",
    address: "C-45 Officers Colony, Cantt",
    serviceCategory: "Plumbing",
    serviceRequested: "Bathroom Hydro-jet Drainage Unclogging",
    leadSource: "Mobile App Sign-up",
    leadScore: 65,
    estimatedValue: 1850,
    status: "Contacted & Qualified",
    priority: "Medium",
    assignedTo: "Varanasi Ops Admin",
    followUpDate: "2026-08-26 10:00",
    createdDate: "2026-08-24 08:30",
    lastContacted: "2026-08-24 10:45",
    notesHistory: [
      {
        id: "nt-8",
        type: "Call",
        author: "Varanasi Ops Admin",
        text: "Contacted customer. Customer requested callback on Wednesday post office hours.",
        timestamp: "2026-08-24 10:45",
      },
    ],
  },
  {
    id: "LEAD-2026-907",
    customerName: "Sunita Jaiswal",
    phone: "+91 93351 66778",
    email: "sunita.j@gmail.com",
    locality: "Assi Ghat, Varanasi",
    address: "D-34/12 Assi Ghat Road",
    serviceCategory: "Deep Cleaning",
    serviceRequested: "Sofa & Carpet Deep Shampooing (5-Seater)",
    leadSource: "Support Desk",
    leadScore: 74,
    estimatedValue: 2900,
    status: "Quotation Sent",
    priority: "Medium",
    assignedTo: "Rahul Singh (VNS Lead)",
    followUpDate: "2026-08-25 15:00",
    createdDate: "2026-08-23 16:00",
    lastContacted: "2026-08-24 11:30",
    notesHistory: [
      {
        id: "nt-9",
        type: "Quotation",
        author: "Rahul Singh (VNS Lead)",
        text: "Shared quotation ₹2,900 with 10% Gold discount promo details.",
        timestamp: "2026-08-24 11:30",
      },
    ],
  },
  {
    id: "LEAD-2026-908",
    customerName: "Harish Chandra Yadav",
    phone: "+91 98390 22334",
    email: "harish.yadav@gmail.com",
    locality: "Shivpur, Varanasi",
    address: "GT Road Near Bypass, Shivpur",
    serviceCategory: "Electrical Works",
    serviceRequested: "Commercial Inverter & High Output Battery Wiring",
    leadSource: "Google Ads",
    leadScore: 40,
    estimatedValue: 12500,
    status: "Lost",
    priority: "Low",
    assignedTo: "Priya Sharma (Ops)",
    followUpDate: "N/A",
    createdDate: "2026-08-20 10:00",
    lastContacted: "2026-08-21 16:00",
    lostReason: "Out of budget; opted for local unverified mechanic.",
    notesHistory: [
      {
        id: "nt-10",
        type: "Note",
        author: "Priya Sharma (Ops)",
        text: "Customer marked lead lost. Budget constraint.",
        timestamp: "2026-08-21 16:00",
      },
    ],
  },
  {
    id: "LEAD-2026-909",
    customerName: "Ritu Agarwal",
    phone: "+91 94152 77889",
    email: "ritu.agarwal@outlook.com",
    locality: "Bhelupur, Varanasi",
    address: "B-22/105 Bhelupur Crossing",
    serviceCategory: "Water Purifier (RO)",
    serviceRequested: "Solar Water Heater Panel Cleaning & Pressure Check",
    leadSource: "WhatsApp Inquiry",
    leadScore: 85,
    estimatedValue: 5600,
    status: "Inspection Scheduled",
    priority: "High",
    assignedTo: "Aman Verma (HQ)",
    followUpDate: "2026-08-25 12:30",
    createdDate: "2026-08-23 11:45",
    lastContacted: "2026-08-24 09:00",
    notesHistory: [
      {
        id: "nt-11",
        type: "Call",
        author: "Aman Verma (HQ)",
        text: "Scheduled rooftop inspection slot for Aug 25 12:30 PM.",
        timestamp: "2026-08-24 09:00",
      },
    ],
  },
  {
    id: "LEAD-2026-910",
    customerName: "Vikramaditya Roy",
    phone: "+91 98899 11223",
    email: "v.roy@gmail.com",
    locality: "Kuber Nagar, Varanasi",
    address: "Plot 12, Kuber Nagar Extension",
    serviceCategory: "Plumbing",
    serviceRequested: "Modular Kitchen Plumbing & Dual Sink Leakage Fix",
    leadSource: "Website Form",
    leadScore: 90,
    estimatedValue: 3200,
    status: "New Inquiry",
    priority: "Urgent",
    assignedTo: "Unassigned",
    followUpDate: "2026-08-24 15:00",
    createdDate: "2026-08-24 11:10",
    lastContacted: "Never",
    notesHistory: [
      {
        id: "nt-12",
        type: "Note",
        author: "System Bot",
        text: "New inquiry captured via website widget. Unassigned.",
        timestamp: "2026-08-24 11:10",
      },
    ],
  },
];

