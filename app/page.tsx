"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  CalendarCheck,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  UserCheck,
  X,
  Zap,
  IndianRupee,
  Star,
  Clock,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Tag,
  CreditCard,
  Radio,
  Search,
  Layers,
  RefreshCw,
  Ban,
  Calendar,
  Sparkles,
  Globe,
  Building2,
  Phone,
  Smartphone,
  MessageSquare,
  Wind,
  Hammer,
  Droplets,
  Paintbrush,
  ShieldAlert,
  Tv,
  Car,
  Download,
  Activity,
  Check,
} from "lucide-react";
import { CustomSelect, CustomSelectOption } from "@/components/CustomSelect";
import { BookingWizardModal } from "@/components/bookings/BookingWizardModal";
import { analyticsData, initialTechnicians, varanasiLocalities } from "@/lib/mockData";

// ─── 1. COMPREHENSIVE INITIAL DATASET (Helpmate Varanasi Market) ───
export interface DashboardBookingItem {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  category: string;
  serviceTitle: string;
  locality: string;
  address: string;
  channel: string;
  origin: "online" | "manual";
  date: string;
  timeSlot: string;
  totalAmount: number;
  status: "Pending" | "Assigned" | "In Progress" | "Completed" | "Cancelled";
  technicianName?: string;
  technicianRating?: number;
  paymentStatus: "Paid Online" | "Cash on Service" | "Refunded" | "Pending Payment";
  paymentMethod: "UPI" | "Cash on Service" | "Card" | "Helpmate Wallet";
  createdAt: string;
}

const initialDashboardBookings: DashboardBookingItem[] = [
  {
    id: "HM-2026-9021",
    bookingNumber: "BK-9021",
    customerName: "Rajesh Kumar Agrawal",
    customerPhone: "+91 98380 12345",
    category: "AC Services",
    serviceTitle: "Split AC Foam Jet Deep Clean & Gas Top-up",
    locality: "Sigra",
    address: "D-38/21, Sigra Central Main Road, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-11-04",
    timeSlot: "10:00 AM - 12:00 PM",
    totalAmount: 1899,
    status: "In Progress",
    technicianName: "Ramesh Yadav",
    technicianRating: 4.9,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-11-04T08:30:00Z",
  },
  {
    id: "HM-2026-9022",
    bookingNumber: "BK-9022",
    customerName: "Pooja Verma",
    customerPhone: "+91 94501 88231",
    category: "Cleaning",
    serviceTitle: "Full Home Deep Scrubbing & Anti-Bacterial Sanitization",
    locality: "Lanka",
    address: "Plot 14B, Near BHU Gate, Lanka, Varanasi",
    channel: "Web Portal",
    origin: "online",
    date: "2026-11-04",
    timeSlot: "11:30 AM - 02:00 PM",
    totalAmount: 3450,
    status: "Pending",
    technicianName: undefined,
    technicianRating: undefined,
    paymentStatus: "Pending Payment",
    paymentMethod: "Cash on Service",
    createdAt: "2026-11-04T09:15:00Z",
  },
  {
    id: "HM-2026-9023",
    bookingNumber: "BK-9023",
    customerName: "Amit Srivastava",
    customerPhone: "+91 99192 45678",
    category: "Electrician",
    serviceTitle: "Inverter & Switchboard MCB Wiring Repair",
    locality: "Bhelupur",
    address: "B-22/19, Shivaji Nagar, Bhelupur, Varanasi",
    channel: "Admin Desk",
    origin: "manual",
    date: "2026-11-04",
    timeSlot: "02:00 PM - 03:30 PM",
    totalAmount: 799,
    status: "Assigned",
    technicianName: "Amit Sharma",
    technicianRating: 4.8,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-11-04T10:00:00Z",
  },
  {
    id: "HM-2026-9024",
    bookingNumber: "BK-9024",
    customerName: "Sunita Mishra",
    customerPhone: "+91 98391 76543",
    category: "Plumbing",
    serviceTitle: "Bathroom Concealed Pipe Leakage & Valve Fix",
    locality: "Cantt",
    address: "Cantt Railway Colony, Quarter 82, Varanasi",
    channel: "WhatsApp",
    origin: "online",
    date: "2026-11-04",
    timeSlot: "03:30 PM - 05:00 PM",
    totalAmount: 1150,
    status: "In Progress",
    technicianName: "Sunil Maurya",
    technicianRating: 4.7,
    paymentStatus: "Cash on Service",
    paymentMethod: "Cash on Service",
    createdAt: "2026-11-04T10:45:00Z",
  },
  {
    id: "HM-2026-9025",
    bookingNumber: "BK-9025",
    customerName: "Vikram Singh",
    customerPhone: "+91 97922 34567",
    category: "Carpenter",
    serviceTitle: "Main Door Mortise Lock & Modular Hinge Alignment",
    locality: "Assi Ghat",
    address: "Near Anand Bagh, Assi Ghat Road, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-11-04",
    timeSlot: "04:00 PM - 05:30 PM",
    totalAmount: 649,
    status: "Pending",
    technicianName: undefined,
    technicianRating: undefined,
    paymentStatus: "Paid Online",
    paymentMethod: "Card",
    createdAt: "2026-11-04T11:20:00Z",
  },
  {
    id: "HM-2026-9026",
    bookingNumber: "BK-9026",
    customerName: "Priya Tiwari",
    customerPhone: "+91 94152 87654",
    category: "Pest Control",
    serviceTitle: "Herbal Bed Bug & Cockroach Gel Treatment",
    locality: "Durgakund",
    address: "K-44/12, Kabir Nagar Colony, Durgakund, Varanasi",
    channel: "Web Portal",
    origin: "online",
    date: "2026-11-03",
    timeSlot: "10:00 AM - 12:00 PM",
    totalAmount: 2200,
    status: "Completed",
    technicianName: "Rajesh Patel",
    technicianRating: 5.0,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-11-03T08:00:00Z",
  },
  {
    id: "HM-2026-9027",
    bookingNumber: "BK-9027",
    customerName: "Ananya Pandey",
    customerPhone: "+91 98388 23456",
    category: "Painting",
    serviceTitle: "Waterproofing & Living Room Acrylic Emulsion",
    locality: "Mahmoorganj",
    address: "G-102, Surya Apartments, Mahmoorganj, Varanasi",
    channel: "Admin Desk",
    origin: "manual",
    date: "2026-11-03",
    timeSlot: "01:00 PM - 04:00 PM",
    totalAmount: 4800,
    status: "Completed",
    technicianName: "Suresh Verma",
    technicianRating: 4.9,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-11-03T09:30:00Z",
  },
  {
    id: "HM-2026-9028",
    bookingNumber: "BK-9028",
    customerName: "Rohan Gupta",
    customerPhone: "+91 91254 33211",
    category: "Appliances",
    serviceTitle: "Front Load Washing Machine Drum Balancing & Motor Fix",
    locality: "Shivpur",
    address: "House 28, Bypass Road, Shivpur, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-11-03",
    timeSlot: "03:00 PM - 04:30 PM",
    totalAmount: 1450,
    status: "Completed",
    technicianName: "Amit Sharma",
    technicianRating: 4.8,
    paymentStatus: "Paid Online",
    paymentMethod: "Helpmate Wallet",
    createdAt: "2026-11-03T11:00:00Z",
  },
  {
    id: "HM-2026-9029",
    bookingNumber: "BK-9029",
    customerName: "Deepak Yadav",
    customerPhone: "+91 95598 77654",
    category: "Car Washing",
    serviceTitle: "Sedan Foam Wash, Interior Vacuum & Tyre Polish",
    locality: "Orderly Bazar",
    address: "Lane 3, Orderly Bazar, Varanasi",
    channel: "WhatsApp",
    origin: "online",
    date: "2026-11-03",
    timeSlot: "04:30 PM - 06:00 PM",
    totalAmount: 899,
    status: "Cancelled",
    technicianName: undefined,
    technicianRating: undefined,
    paymentStatus: "Refunded",
    paymentMethod: "UPI",
    createdAt: "2026-11-03T13:00:00Z",
  },
  {
    id: "HM-2026-9030",
    bookingNumber: "BK-9030",
    customerName: "Kavita Jaiswal",
    customerPhone: "+91 97214 55678",
    category: "AC Services",
    serviceTitle: "Window AC Jet Wash & Copper Coil Anti-Rust Coating",
    locality: "Sigra",
    address: "S-12/44, Sigra Stadium Road, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-11-02",
    timeSlot: "09:30 AM - 11:00 AM",
    totalAmount: 799,
    status: "Completed",
    technicianName: "Ramesh Yadav",
    technicianRating: 4.9,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-11-02T08:15:00Z",
  },
  {
    id: "HM-2026-9031",
    bookingNumber: "BK-9031",
    customerName: "Manish Agrawal",
    customerPhone: "+91 93356 78901",
    category: "Cleaning",
    serviceTitle: "Kitchen Chimney & Deep Degreasing Package",
    locality: "Bhelupur",
    address: "C-29/18, Sonarpura Crossing, Bhelupur, Varanasi",
    channel: "Web Portal",
    origin: "online",
    date: "2026-11-02",
    timeSlot: "12:00 PM - 02:00 PM",
    totalAmount: 1299,
    status: "Completed",
    technicianName: "Suresh Verma",
    technicianRating: 4.9,
    paymentStatus: "Cash on Service",
    paymentMethod: "Cash on Service",
    createdAt: "2026-11-02T10:00:00Z",
  },
  {
    id: "HM-2026-9032",
    bookingNumber: "BK-9032",
    customerName: "Neha Dubey",
    customerPhone: "+91 98890 12344",
    category: "Electrician",
    serviceTitle: "Geyser Installation & 16A Power Socket Setup",
    locality: "Lanka",
    address: "Plot 8, Saket Nagar, Lanka, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-11-02",
    timeSlot: "02:30 PM - 04:00 PM",
    totalAmount: 599,
    status: "Completed",
    technicianName: "Amit Sharma",
    technicianRating: 4.8,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-11-02T11:45:00Z",
  },
  {
    id: "HM-2026-9033",
    bookingNumber: "BK-9033",
    customerName: "Sanjay Tripathi",
    customerPhone: "+91 94509 87123",
    category: "Plumbing",
    serviceTitle: "Overhead Water Tank Float Valve & Booster Pump Check",
    locality: "Cantt",
    address: "E-14, Vidyapeeth Road, Cantt, Varanasi",
    channel: "Admin Desk",
    origin: "manual",
    date: "2026-11-01",
    timeSlot: "10:00 AM - 11:30 AM",
    totalAmount: 950,
    status: "Completed",
    technicianName: "Sunil Maurya",
    technicianRating: 4.7,
    paymentStatus: "Cash on Service",
    paymentMethod: "Cash on Service",
    createdAt: "2026-11-01T09:00:00Z",
  },
  {
    id: "HM-2026-9034",
    bookingNumber: "BK-9034",
    customerName: "Divya Pandey",
    customerPhone: "+91 96214 66789",
    category: "Carpenter",
    serviceTitle: "Modular Kitchen Drawer Channel Replacement",
    locality: "Assi Ghat",
    address: "House 3, Near Tulsi Ghat, Assi, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-11-01",
    timeSlot: "01:30 PM - 03:00 PM",
    totalAmount: 850,
    status: "Completed",
    technicianName: "Rajesh Patel",
    technicianRating: 5.0,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-11-01T11:00:00Z",
  },
  {
    id: "HM-2026-9035",
    bookingNumber: "BK-9035",
    customerName: "Harsh Vardhan",
    customerPhone: "+91 99365 44321",
    category: "Pest Control",
    serviceTitle: "Subterranean Termite Soil Treatment & Drill-Fill",
    locality: "Durgakund",
    address: "Durgakund Road, Opposite Manas Mandir, Varanasi",
    channel: "Web Portal",
    origin: "online",
    date: "2026-10-31",
    timeSlot: "11:00 AM - 01:30 PM",
    totalAmount: 3800,
    status: "Completed",
    technicianName: "Rajesh Patel",
    technicianRating: 5.0,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-10-31T09:20:00Z",
  },
  {
    id: "HM-2026-9036",
    bookingNumber: "BK-9036",
    customerName: "Meenakshi Maurya",
    customerPhone: "+91 98394 55667",
    category: "AC Services",
    serviceTitle: "Cassette AC PCB Circuit Board Diagnostic & Relay Fix",
    locality: "Mahmoorganj",
    address: "Tower 2, Manduadih Crossing, Mahmoorganj, Varanasi",
    channel: "Admin Desk",
    origin: "manual",
    date: "2026-10-30",
    timeSlot: "02:00 PM - 04:00 PM",
    totalAmount: 2650,
    status: "Completed",
    technicianName: "Ramesh Yadav",
    technicianRating: 4.9,
    paymentStatus: "Paid Online",
    paymentMethod: "Card",
    createdAt: "2026-10-30T10:10:00Z",
  },
  {
    id: "HM-2026-9037",
    bookingNumber: "BK-9037",
    customerName: "Arjun Patel",
    customerPhone: "+91 94158 99887",
    category: "Cleaning",
    serviceTitle: "Sofa Foam Shampoo & Deep Fabric Sanitization (5-Seater)",
    locality: "Sigra",
    address: "Flat 401, Kashi Residency, Sigra, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-10-29",
    timeSlot: "10:30 AM - 12:30 PM",
    totalAmount: 1199,
    status: "Completed",
    technicianName: "Suresh Verma",
    technicianRating: 4.9,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-10-29T08:45:00Z",
  },
  {
    id: "HM-2026-9038",
    bookingNumber: "BK-9038",
    customerName: "Shalini Singh",
    customerPhone: "+91 97931 22334",
    category: "Appliances",
    serviceTitle: "Double Door Refrigerator Gas Leakage & Thermostat Fix",
    locality: "Lanka",
    address: "G-18, Hyderabad Colony, BHU Campus, Lanka, Varanasi",
    channel: "WhatsApp",
    origin: "online",
    date: "2026-10-28",
    timeSlot: "03:00 PM - 04:30 PM",
    totalAmount: 1650,
    status: "Completed",
    technicianName: "Amit Sharma",
    technicianRating: 4.8,
    paymentStatus: "Cash on Service",
    paymentMethod: "Cash on Service",
    createdAt: "2026-10-28T12:00:00Z",
  },
  {
    id: "HM-2026-9039",
    bookingNumber: "BK-9039",
    customerName: "Aditya Mishra",
    customerPhone: "+91 99182 33445",
    category: "Painting",
    serviceTitle: "Balcony Waterproofing & Exterior Weathercoat Coat",
    locality: "Shivpur",
    address: "Lane 5, Tarna, Shivpur, Varanasi",
    channel: "Web Portal",
    origin: "online",
    date: "2026-10-27",
    timeSlot: "09:00 AM - 12:00 PM",
    totalAmount: 3200,
    status: "Completed",
    technicianName: "Suresh Verma",
    technicianRating: 4.9,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-10-27T08:00:00Z",
  },
  {
    id: "HM-2026-9040",
    bookingNumber: "BK-9040",
    customerName: "Ritika Saxena",
    customerPhone: "+91 93361 44556",
    category: "Plumbing",
    serviceTitle: "Kitchen Sink Clog Hydro Jet & Pipe Trap Replacement",
    locality: "Orderly Bazar",
    address: "Block B, Circuit House Road, Orderly Bazar, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-10-26",
    timeSlot: "01:00 PM - 02:30 PM",
    totalAmount: 699,
    status: "Completed",
    technicianName: "Sunil Maurya",
    technicianRating: 4.7,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-10-26T10:30:00Z",
  },
  {
    id: "HM-2026-9041",
    bookingNumber: "BK-9041",
    customerName: "Gaurav Sen",
    customerPhone: "+91 98894 66778",
    category: "Electrician",
    serviceTitle: "Complete House Safety Earthing & Copper Rod Installation",
    locality: "Bhelupur",
    address: "Plot 12, Kamachha, Bhelupur, Varanasi",
    channel: "Admin Desk",
    origin: "manual",
    date: "2026-10-25",
    timeSlot: "11:00 AM - 01:00 PM",
    totalAmount: 2400,
    status: "Completed",
    technicianName: "Amit Sharma",
    technicianRating: 4.8,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-10-25T09:00:00Z",
  },
  {
    id: "HM-2026-9042",
    bookingNumber: "BK-9042",
    customerName: "Poonam Rai",
    customerPhone: "+91 94503 11223",
    category: "AC Services",
    serviceTitle: "Split AC Uninstallation & Reinstallation (New Home)",
    locality: "Cantt",
    address: "Flat 203, Varuna Heights, Cantt, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-10-24",
    timeSlot: "02:00 PM - 04:30 PM",
    totalAmount: 1850,
    status: "Completed",
    technicianName: "Ramesh Yadav",
    technicianRating: 4.9,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-10-24T11:15:00Z",
  },
  {
    id: "HM-2026-9043",
    bookingNumber: "BK-9043",
    customerName: "Vivek Chaubey",
    customerPhone: "+91 97218 88990",
    category: "Carpenter",
    serviceTitle: "Wooden Wardrobe Sliding Rail & Hydraulic Channel Fix",
    locality: "Assi Ghat",
    address: "House 21A, Dumraon Colony, Assi Ghat, Varanasi",
    channel: "WhatsApp",
    origin: "online",
    date: "2026-10-23",
    timeSlot: "10:00 AM - 11:30 AM",
    totalAmount: 750,
    status: "Completed",
    technicianName: "Rajesh Patel",
    technicianRating: 5.0,
    paymentStatus: "Cash on Service",
    paymentMethod: "Cash on Service",
    createdAt: "2026-10-23T08:30:00Z",
  },
  {
    id: "HM-2026-9044",
    bookingNumber: "BK-9044",
    customerName: "Swati Keshari",
    customerPhone: "+91 96219 00112",
    category: "Cleaning",
    serviceTitle: "Bathroom Deep Descaling & Floor Tile Buffing",
    locality: "Sigra",
    address: "Shop 4, Kashi Shopping Complex, Sigra, Varanasi",
    channel: "Web Portal",
    origin: "online",
    date: "2026-10-22",
    timeSlot: "03:30 PM - 05:00 PM",
    totalAmount: 899,
    status: "Completed",
    technicianName: "Suresh Verma",
    technicianRating: 4.9,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-10-22T13:00:00Z",
  },
  {
    id: "HM-2026-9045",
    bookingNumber: "BK-9045",
    customerName: "Tarun Malhotra",
    customerPhone: "+91 98389 44556",
    category: "Car Washing",
    serviceTitle: "SUV Full Pressure Wash & Interior Ceramic Coat",
    locality: "Lanka",
    address: "Plot 30, Naria Road, Lanka, Varanasi",
    channel: "Mobile App",
    origin: "online",
    date: "2026-10-21",
    timeSlot: "09:00 AM - 10:30 AM",
    totalAmount: 1199,
    status: "Completed",
    technicianName: "Rajesh Patel",
    technicianRating: 5.0,
    paymentStatus: "Paid Online",
    paymentMethod: "UPI",
    createdAt: "2026-10-21T07:45:00Z",
  },
];

// ─── 2. CUSTOM DROPDOWN OPTIONS WITH ICONS ───
const categoryFilterOptions: CustomSelectOption[] = [
  { value: "All", label: "All Categories", icon: <Layers className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "AC Services", label: "AC Services", icon: <Wind className="w-3.5 h-3.5 text-cyan-500" /> },
  { value: "Carpenter", label: "Carpenter", icon: <Hammer className="w-3.5 h-3.5 text-amber-600" /> },
  { value: "Cleaning", label: "Cleaning", icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "Electrician", label: "Electrician", icon: <Zap className="w-3.5 h-3.5 text-amber-500" /> },
  { value: "Painting", label: "Painting", icon: <Paintbrush className="w-3.5 h-3.5 text-purple-500" /> },
  { value: "Pest Control", label: "Pest Control", icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> },
  { value: "Plumbing", label: "Plumbing", icon: <Droplets className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "Appliances", label: "Appliances", icon: <Tv className="w-3.5 h-3.5 text-indigo-500" /> },
  { value: "Car Washing", label: "Car Washing", icon: <Car className="w-3.5 h-3.5 text-sky-500" /> },
];

const channelFilterOptions: CustomSelectOption[] = [
  { value: "All", label: "All Booking Channels", icon: <Layers className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "Mobile App", label: "Mobile Customer App", icon: <Smartphone className="w-3.5 h-3.5 text-indigo-500" /> },
  { value: "Web Portal", label: "Helpmate Web Portal", icon: <Globe className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "Admin Desk", label: "Admin Manual Desk", icon: <Building2 className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "WhatsApp", label: "WhatsApp Concierge", icon: <MessageSquare className="w-3.5 h-3.5 text-teal-500" /> },
];

const statusFilterOptions: CustomSelectOption[] = [
  { value: "All", label: "All Statuses", icon: <Activity className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "Pending", label: "Pending Assignment", icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
  { value: "Assigned", label: "Assigned / Dispatched", icon: <UserCheck className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "In Progress", label: "In Field (In Progress)", icon: <Wrench className="w-3.5 h-3.5 text-indigo-500" /> },
  { value: "Completed", label: "Completed (Fulfilled)", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "Cancelled", label: "Cancelled / Rejected", icon: <Ban className="w-3.5 h-3.5 text-rose-500" /> },
];

const localityFilterOptions: CustomSelectOption[] = [
  { value: "All", label: "All Varanasi Zones", icon: <MapPin className="w-3.5 h-3.5 text-slate-400" /> },
  { value: "Sigra", label: "Sigra Central", icon: <MapPin className="w-3.5 h-3.5 text-rose-500" /> },
  { value: "Lanka", label: "Lanka / BHU Gate", icon: <MapPin className="w-3.5 h-3.5 text-amber-500" /> },
  { value: "Bhelupur", label: "Bhelupur Main", icon: <MapPin className="w-3.5 h-3.5 text-blue-500" /> },
  { value: "Cantt", label: "Cantt Station Zone", icon: <MapPin className="w-3.5 h-3.5 text-indigo-500" /> },
  { value: "Assi Ghat", label: "Assi Ghat Heritage", icon: <MapPin className="w-3.5 h-3.5 text-emerald-500" /> },
  { value: "Durgakund", label: "Durgakund Mandir", icon: <MapPin className="w-3.5 h-3.5 text-cyan-500" /> },
  { value: "Mahmoorganj", label: "Mahmoorganj Commercial", icon: <MapPin className="w-3.5 h-3.5 text-purple-500" /> },
  { value: "Shivpur", label: "Shivpur Bypass", icon: <MapPin className="w-3.5 h-3.5 text-teal-500" /> },
  { value: "Orderly Bazar", label: "Orderly Bazar", icon: <MapPin className="w-3.5 h-3.5 text-orange-500" /> },
];

const datePresets = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7days", label: "Last 7 Days" },
  { id: "30days", label: "Last 30 Days" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Range" },
];

const categoryPalette: Record<string, string> = {
  "AC Services": "#06b6d4",
  "Carpenter": "#d97706",
  "Cleaning": "#10b981",
  "Electrician": "#f59e0b",
  "Painting": "#a855f7",
  "Pest Control": "#f43f5e",
  "Plumbing": "#3b82f6",
  "Appliances": "#6366f1",
  "Car Washing": "#0284c7",
};

function getCategoryIcon(cat: string, className = "w-4 h-4") {
  switch (cat) {
    case "AC Services":
      return <Wind className={`${className} text-cyan-500`} />;
    case "Carpenter":
      return <Hammer className={`${className} text-amber-600`} />;
    case "Cleaning":
      return <Sparkles className={`${className} text-emerald-500`} />;
    case "Electrician":
      return <Zap className={`${className} text-amber-500`} />;
    case "Painting":
      return <Paintbrush className={`${className} text-purple-500`} />;
    case "Pest Control":
      return <ShieldAlert className={`${className} text-rose-500`} />;
    case "Plumbing":
      return <Droplets className={`${className} text-blue-500`} />;
    case "Appliances":
      return <Tv className={`${className} text-indigo-500`} />;
    case "Car Washing":
      return <Car className={`${className} text-sky-500`} />;
    default:
      return <Wrench className={`${className} text-slate-500`} />;
  }
}

function getChannelBadge(channel: string) {
  switch (channel) {
    case "Mobile App":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Smartphone className="w-2.5 h-2.5" /> App
        </span>
      );
    case "Web Portal":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Globe className="w-2.5 h-2.5" /> Web
        </span>
      );
    case "Admin Desk":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Building2 className="w-2.5 h-2.5" /> Admin Desk
        </span>
      );
    case "WhatsApp":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
          <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
          {channel}
        </span>
      );
  }
}

// ─── 3. MAIN EXECUTIVE DASHBOARD COMPONENT ───
export default function ExecutiveDashboard() {
  // Bookings state initialized with rich Helpmate mock data
  const [bookingsList, setBookingsList] = useState<DashboardBookingItem[]>(initialDashboardBookings);

  // Filters State
  const [datePreset, setDatePreset] = useState<"all" | "today" | "yesterday" | "7days" | "30days" | "month" | "custom">("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedChannel, setSelectedChannel] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedLocality, setSelectedLocality] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination & Visuals State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [chartMode, setChartMode] = useState<"revenue" | "bookings">("revenue");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // ─── 4. INSTANTANEOUS CLIENT-SIDE FILTERING ───
  const filteredBookings = useMemo(() => {
    return bookingsList.filter((b) => {
      // 1. Category Filter
      if (selectedCategory !== "All" && b.category !== selectedCategory) {
        return false;
      }
      // 2. Channel Filter
      if (selectedChannel !== "All" && b.channel !== selectedChannel) {
        return false;
      }
      // 3. Status Filter
      if (selectedStatus !== "All") {
        if (selectedStatus === "Assigned") {
          if (b.status !== "Assigned" && b.status !== "In Progress") return false;
        } else if (b.status.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }
      // 4. Locality Filter
      if (selectedLocality !== "All" && b.locality !== selectedLocality) {
        return false;
      }
      // 5. Date Presets Filter
      if (datePreset === "today" && b.date !== "2026-11-04") {
        return false;
      }
      if (datePreset === "yesterday" && b.date !== "2026-11-03") {
        return false;
      }
      if (datePreset === "7days" && b.date < "2026-10-29") {
        return false;
      }
      if (datePreset === "30days" && b.date < "2026-10-06") {
        return false;
      }
      if (datePreset === "month" && !b.date.startsWith("2026-11")) {
        return false;
      }
      if (datePreset === "custom") {
        if (customFromDate && b.date < customFromDate) return false;
        if (customToDate && b.date > customToDate) return false;
      }
      // 6. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = b.id.toLowerCase().includes(q) || b.bookingNumber.toLowerCase().includes(q);
        const matchCust = b.customerName.toLowerCase().includes(q) || b.customerPhone.toLowerCase().includes(q);
        const matchSvc = b.serviceTitle.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
        const matchLoc = b.locality.toLowerCase().includes(q) || b.address.toLowerCase().includes(q);
        const matchTech = Boolean(b.technicianName && b.technicianName.toLowerCase().includes(q));
        if (!matchId && !matchCust && !matchSvc && !matchLoc && !matchTech) {
          return false;
        }
      }
      return true;
    });
  }, [
    bookingsList,
    selectedCategory,
    selectedChannel,
    selectedStatus,
    selectedLocality,
    datePreset,
    customFromDate,
    customToDate,
    searchQuery,
  ]);

  // ─── 5. DYNAMIC EXECUTIVE KPI METRICS ───
  const kpiStats = useMemo(() => {
    const total = filteredBookings.length;
    const pending = filteredBookings.filter((b) => b.status === "Pending").length;
    const assigned = filteredBookings.filter((b) => b.status === "Assigned" || b.status === "In Progress").length;
    const completed = filteredBookings.filter((b) => b.status === "Completed").length;
    const cancelled = filteredBookings.filter((b) => b.status === "Cancelled").length;
    const revenue = filteredBookings
      .filter((b) => b.status === "Completed")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return { total, pending, assigned, completed, cancelled, revenue };
  }, [filteredBookings]);

  // ─── 6. CATEGORY MARKET SHARE ───
  const categoryShares = useMemo(() => {
    const catMap = new Map<string, { count: number; revenue: number }>();
    filteredBookings.forEach((b) => {
      const existing = catMap.get(b.category) || { count: 0, revenue: 0 };
      existing.count += 1;
      if (b.status === "Completed") {
        existing.revenue += b.totalAmount;
      }
      catMap.set(b.category, existing);
    });

    const list = Array.from(catMap.entries()).map(([cat, val]) => ({
      name: cat,
      count: val.count,
      revenue: val.revenue,
      sharePct: filteredBookings.length > 0 ? Math.round((val.count / filteredBookings.length) * 100) : 0,
    }));

    list.sort((a, b) => b.count - a.count);
    return list;
  }, [filteredBookings]);

  // ─── 7. CLIENT-SIDE PAGINATION ───
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Reset all filters
  const resetFilters = () => {
    setDatePreset("all");
    setSelectedCategory("All");
    setSelectedChannel("All");
    setSelectedStatus("All");
    setSelectedLocality("All");
    setCustomFromDate("");
    setCustomToDate("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    datePreset !== "all" ||
    selectedCategory !== "All" ||
    selectedChannel !== "All" ||
    selectedStatus !== "All" ||
    selectedLocality !== "All" ||
    searchQuery.trim() !== "";

  // ─── 8. EXPORT CSV (Client-side) ───
  const handleExportCSV = () => {
    const headers = [
      "Booking ID",
      "Customer Name",
      "Phone",
      "Category",
      "Service",
      "Locality",
      "Channel",
      "Date",
      "Slot",
      "Amount",
      "Status",
      "Technician",
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      `"${b.customerName}"`,
      b.customerPhone,
      b.category,
      `"${b.serviceTitle}"`,
      b.locality,
      b.channel,
      b.date,
      `"${b.timeSlot}"`,
      b.totalAmount,
      b.status,
      `"${b.technicianName || "Unassigned"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Helpmate_Bookings_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── 9. HANDLE NEW BOOKING CREATION FROM WIZARD MODAL ───
  const handleBookingCreated = (newBooking: any) => {
    setIsWizardOpen(false);
    const formatted: DashboardBookingItem = {
      id: newBooking.id || `HM-2026-${Math.floor(9100 + Math.random() * 899)}`,
      bookingNumber: newBooking.bookingNumber || `BK-${Math.floor(9100 + Math.random() * 899)}`,
      customerName: newBooking.customerName || "Walk-in Customer",
      customerPhone: newBooking.customerPhone || "+91 98000 00000",
      category: newBooking.category || "AC Services",
      serviceTitle: newBooking.serviceTitle || "Custom Service Job",
      locality: newBooking.locality || "Sigra",
      address: newBooking.address || "Sigra Main Road, Varanasi",
      channel: newBooking.bookingSource === "manual" ? "Admin Desk" : "Mobile App",
      origin: newBooking.origin || "manual",
      date: "2026-11-04",
      timeSlot: newBooking.timeSlot || "10:00 AM - 12:00 PM",
      totalAmount: newBooking.totalAmount || 899,
      status: newBooking.status || "Pending",
      technicianName: newBooking.technicianName,
      technicianRating: newBooking.technicianName ? 4.9 : undefined,
      paymentStatus: newBooking.paymentStatus || "Paid Online",
      paymentMethod: newBooking.paymentMethod || "UPI",
      createdAt: new Date().toISOString(),
    };

    setBookingsList((prev) => [formatted, ...prev]);
    setSelectedStatus("All");
    setCurrentPage(1);
    setToastMessage(`Booking ${formatted.bookingNumber} created successfully!`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ─── SUCCESS TOAST NOTIFICATION ─── */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold">{toastMessage}</p>
            <p className="text-[10px] text-slate-400">Added to live queue & operational telemetry</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="text-slate-400 hover:text-white ml-2 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── 1. PAGE HEADER (Strictly ONLY ONE Primary Button per AGENTS.md) ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-brand-600" />
              <span>Operations Command Center</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Operations Feed
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <MapPin className="w-3 h-3 text-rose-500" /> Varanasi Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time on-demand service fulfillment, technician dispatch velocity, and revenue telemetry.
          </p>
        </div>

        {/* Action Controls: Secondary Buttons + STRICTLY ONE PRIMARY BUTTON */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Secondary Action 1: Refresh View */}
          <button
            type="button"
            onClick={resetFilters}
            title="Reset Filters & Refresh Queue"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-brand-600" />
          </button>

          {/* Secondary Action 2: Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Download CSV Report"
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Secondary Action 3: Bookings Hub Link */}
          <Link
            href="/bookings"
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4 text-brand-600" />
            <span>All Bookings</span>
          </Link>

          {/* STRICTLY ONLY ONE PRIMARY BUTTON ON THE PAGE */}
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Booking</span>
          </button>
        </div>
      </div>

      {/* ─── 2. HIGH-PERFORMANCE CUSTOM FILTER CONSOLE ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Filter Bar: Date Presets & Reset */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <span className="text-xs font-extrabold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-brand-600" /> Range:
            </span>
            {datePresets.map((p) => {
              const isActive = datePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setDatePreset(p.id as any);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-300 dark:border-brand-700 font-extrabold shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Active Filter Indicator & Reset Button */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            {hasActiveFilters && (
              <span className="text-[11px] font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 px-2.5 py-1 rounded-xl border border-brand-200 dark:border-brand-800">
                Filters Active ({filteredBookings.length} matching)
              </span>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Inputs (when 'custom' preset is active) */}
        {datePreset === "custom" && (
          <div className="pt-1 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <span className="text-xs font-extrabold text-slate-500">Pick Custom Range:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">From</span>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => {
                  setCustomFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">To</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => {
                  setCustomToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* CUSTOM DROPDOWN FILTERS ROW (Zero Native Selects) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* 1. Category CustomSelect */}
          <div>
            <CustomSelect
              label="Service Category"
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
              options={categoryFilterOptions}
              size="sm"
              searchable={true}
              searchPlaceholder="Search category..."
              placeholder="All Categories"
            />
          </div>

          {/* 2. Channel CustomSelect */}
          <div>
            <CustomSelect
              label="Booking Channel"
              value={selectedChannel}
              onChange={(val) => {
                setSelectedChannel(val);
                setCurrentPage(1);
              }}
              options={channelFilterOptions}
              size="sm"
              searchable={false}
              placeholder="All Booking Channels"
            />
          </div>

          {/* 3. Status CustomSelect */}
          <div>
            <CustomSelect
              label="Fulfillment Status"
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val);
                setCurrentPage(1);
              }}
              options={statusFilterOptions}
              size="sm"
              searchable={false}
              placeholder="All Statuses"
            />
          </div>

          {/* 4. Varanasi Zone CustomSelect */}
          <div>
            <CustomSelect
              label="Varanasi Zone / Locality"
              value={selectedLocality}
              onChange={(val) => {
                setSelectedLocality(val);
                setCurrentPage(1);
              }}
              options={localityFilterOptions}
              size="sm"
              searchable={true}
              searchPlaceholder="Search locality..."
              placeholder="All Varanasi Zones"
            />
          </div>
        </div>
      </div>

      {/* ─── 3. TOP METRICS KPI RIBBON (5 INTERACTIVE CARDS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Orders */}
        <div
          onClick={() => {
            setSelectedStatus("All");
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatus === "All"
              ? "border-brand-500 dark:border-brand-500 ring-2 ring-brand-500/20 shadow-xs"
              : "border-slate-200 dark:border-slate-800 hover:border-brand-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Bookings</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {kpiStats.total}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                +18.4%
              </span>
              <span>Overall Orders</span>
            </div>
          </div>
        </div>

        {/* 2. Pending Assignment (Alert Pulse) */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Pending" ? "All" : "Pending");
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatus === "Pending"
              ? "border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs"
              : "border-slate-200 dark:border-slate-800 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Assignment</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {kpiStats.pending}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Needs Specialist</span>
            </div>
          </div>
        </div>

        {/* 3. Partner Assigned & Active */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Assigned" ? "All" : "Assigned");
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatus === "Assigned"
              ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs"
              : "border-slate-200 dark:border-slate-800 hover:border-blue-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Partner Assigned</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {kpiStats.assigned}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-blue-700 dark:text-blue-300">
              <Wrench className="w-3.5 h-3.5" />
              <span>In Dispatch / Field</span>
            </div>
          </div>
        </div>

        {/* 4. Completed Orders */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "Completed" ? "All" : "Completed");
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatus === "Completed"
              ? "border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs"
              : "border-slate-200 dark:border-slate-800 hover:border-emerald-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Completed Orders</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {kpiStats.completed}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span>
                {kpiStats.total > 0
                  ? `${Math.round((kpiStats.completed / kpiStats.total) * 100)}% Fulfilled`
                  : "0% Fulfilled"}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Gross Settled GMV */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Gross GMV Settled</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              ₹{(kpiStats.revenue).toLocaleString("en-IN")}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-purple-700 dark:text-purple-300">
              <span>
                Avg Ticket ₹{Math.round(kpiStats.revenue / Math.max(kpiStats.completed, 1))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. MID SECTION: REVENUE TRENDS (8 COLS) + CATEGORY DEMAND SHARE (4 COLS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (8 Cols): Performance Trend Graph */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 h-full flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Operations Growth & Revenue Trajectory
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Monthly fulfillment volume & gross revenue trajectory (Jan 2026 – Jul 2026)
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setChartMode("revenue")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartMode === "revenue"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Revenue (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("bookings")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartMode === "bookings"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Orders Volume
                </button>
              </div>
            </div>

            {/* Interactive Smooth Spline Area Chart Canvas */}
            <div className="pt-2">
              <div className="flex gap-4">
                {/* Y-Axis Scale */}
                <div className="flex flex-col justify-between text-right shrink-0 py-1" style={{ height: "200px" }}>
                  {chartMode === "revenue"
                    ? ["₹18L", "₹14L", "₹10L", "₹6L", "₹0"].map((l) => (
                        <span key={l} className="text-[10px] font-mono font-bold text-slate-400">
                          {l}
                        </span>
                      ))
                    : ["700", "550", "400", "250", "0"].map((l) => (
                        <span key={l} className="text-[10px] font-mono font-bold text-slate-400">
                          {l}
                        </span>
                      ))}
                </div>

                {/* Chart Grid with SVG Area Path & Nodes */}
                <div className="flex-1 min-w-0 relative" style={{ height: "200px" }}>
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <div
                      key={pct}
                      className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800/70"
                      style={{ bottom: `${pct}%` }}
                    />
                  ))}

                  {/* SVG Smooth Curved Area Graph */}
                  {(() => {
                    const data = analyticsData.monthlyChart;
                    const maxVal = chartMode === "revenue" ? 1800000 : 700;
                    const pts = data.map((d, i) => {
                      const val = chartMode === "revenue" ? d.revenue : d.bookings;
                      const x = (i / (data.length - 1)) * 700;
                      const y = 190 - (val / maxVal) * 170;
                      return { x, y };
                    });

                    let lineD = `M ${pts[0].x} ${pts[0].y}`;
                    for (let i = 0; i < pts.length - 1; i++) {
                      const curr = pts[i];
                      const next = pts[i + 1];
                      const cp1x = curr.x + (next.x - curr.x) / 2;
                      const cp1y = curr.y;
                      const cp2x = curr.x + (next.x - curr.x) / 2;
                      const cp2y = next.y;
                      lineD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
                    }
                    const areaD = `${lineD} L 700 200 L 0 200 Z`;

                    return (
                      <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 700 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartMode === "revenue" ? "#4f46e5" : "#10b981"} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={chartMode === "revenue" ? "#4f46e5" : "#10b981"} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        <path d={areaD} fill="url(#chartGradient)" className="transition-all duration-500 ease-in-out" />
                        <path
                          d={lineD}
                          fill="none"
                          stroke={chartMode === "revenue" ? "#4f46e5" : "#10b981"}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="transition-all duration-500 ease-in-out"
                        />
                      </svg>
                    );
                  })()}

                  <div className="absolute inset-0 flex justify-between items-stretch z-20 pointer-events-auto">
                    {analyticsData.monthlyChart.map((m) => {
                      const val = chartMode === "revenue" ? m.revenue : m.bookings;
                      const maxVal = chartMode === "revenue" ? 1800000 : 700;
                      const pct = Math.min((val / maxVal) * 100, 100);
                      const topPos = 100 - (10 + (pct * 85) / 100);

                      return (
                        <div key={m.month} className="relative flex-1 group flex flex-col items-center">
                          <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl border border-slate-700 dark:border-slate-200 z-30">
                            {chartMode === "revenue"
                              ? `${m.month}: ₹${(m.revenue / 100000).toFixed(2)} Lakhs (${m.bookings} Bookings)`
                              : `${m.month}: ${m.bookings} Orders Fulfilled (₹${(m.revenue / 100000).toFixed(2)}L)`}
                          </div>

                          <div
                            className={`absolute w-3.5 h-3.5 -ml-1.75 -mt-1.75 rounded-full bg-white dark:bg-slate-900 border-2.5 shadow-md group-hover:scale-150 transition-all duration-300 cursor-pointer ${
                              chartMode === "revenue"
                                ? "border-brand-600 group-hover:bg-brand-600 group-hover:border-white"
                                : "border-emerald-600 group-hover:bg-emerald-600 group-hover:border-white"
                            }`}
                            style={{ top: `${topPos}%`, left: "50%" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* X-Axis Month Labels */}
              <div className="flex justify-between gap-3 px-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 ml-12">
                {analyticsData.monthlyChart.map((m) => (
                  <div key={m.month} className="flex-1 text-center">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">{m.month}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium block">
                      {chartMode === "revenue" ? `₹${(m.revenue / 100000).toFixed(1)}L` : `${m.bookings} orders`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right (4 Cols): Category Demand Share */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Category Demand Share</h3>
                </div>
                <span className="text-[10px] font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                  {categoryShares.length} Active Categories
                </span>
              </div>

              <div className="space-y-3 mt-3.5 max-h-[290px] overflow-y-auto pr-1 no-scrollbar">
                {categoryShares.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 italic text-xs">
                    No orders matching selected criteria.
                  </div>
                ) : (
                  categoryShares.map((cat) => {
                    const color = categoryPalette[cat.name] || "#4f46e5";
                    const isSelected = selectedCategory === cat.name;

                    return (
                      <div
                        key={cat.name}
                        onClick={() => {
                          setSelectedCategory(isSelected ? "All" : cat.name);
                          setCurrentPage(1);
                        }}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-brand-50/70 dark:bg-brand-950/50 border-brand-400 shadow-xs"
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 truncate">
                            {getCategoryIcon(cat.name, "w-3.5 h-3.5")}
                            <span>{cat.name}</span>
                          </span>
                          <span className="font-black text-slate-900 dark:text-white ml-2 text-right">
                            {cat.count} orders ({cat.sharePct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(cat.sharePct, 6)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-bold">
              <span>Click any category to filter</span>
              <Link href="/categories" className="text-brand-600 hover:underline flex items-center gap-1 font-extrabold">
                Manage Services <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. LIVE BOOKING OPERATIONS FEED TABLE ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Table Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0">
              <Radio className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">Live Booking Operations Feed</h2>
                <span className="text-[10px] font-extrabold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                  {filteredBookings.length} Orders Match
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct realtime queue with quick technician assignment and service tracking
              </p>
            </div>
          </div>

          {/* Search and Status Tab Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search order #, customer, service..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
              {[
                { id: "All", label: "All" },
                { id: "Pending", label: "Pending" },
                { id: "Assigned", label: "In Field" },
                { id: "Completed", label: "Completed" },
                { id: "Cancelled", label: "Cancelled" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(st.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedStatus.toLowerCase() === st.id.toLowerCase()
                      ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Category & Service</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Scheduled Slot</th>
                <th className="py-3 px-4">Zone / Locality</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 font-medium">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    No booking records found matching current criteria.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => {
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Booking ID */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                        <Link href={`/bookings/${b.id}?from=/`} className="hover:underline">
                          #{b.bookingNumber}
                        </Link>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                          {b.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" /> {b.customerPhone}
                        </div>
                      </td>

                      {/* Category & Service */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                          {b.serviceTitle}
                        </div>
                        <div className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {getCategoryIcon(b.category, "w-3 h-3")}
                          <span>{b.category}</span>
                        </div>
                      </td>

                      {/* Channel Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getChannelBadge(b.channel)}
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{b.date}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{b.timeSlot}</div>
                      </td>

                      {/* Locality */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{b.locality}</span>
                        </span>
                      </td>

                      {/* Assigned Specialist */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {b.technicianName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-[10px] font-black flex items-center justify-center">
                              {b.technicianName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">
                                {b.technicianName}
                              </div>
                              <div className="flex items-center text-[10px] font-bold text-amber-500">
                                <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                                {b.technicianRating || 4.9}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <Clock className="w-2.5 h-2.5" /> Unassigned
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-white text-xs">
                          ₹{b.totalAmount}
                        </div>
                        <span
                          className={`text-[9px] font-extrabold ${
                            b.paymentStatus === "Paid Online"
                              ? "text-emerald-600"
                              : b.paymentStatus === "Refunded"
                              ? "text-rose-500"
                              : "text-slate-400"
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            b.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : b.status === "Cancelled"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : b.status === "Assigned" || b.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Action (Secondary Style Button per AGENTS.md) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/bookings/${b.id}?from=/`}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5 text-brand-600" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-bold">
            Showing Page <span className="text-slate-900 dark:text-white font-extrabold">{currentPage}</span> of{" "}
            <span className="text-slate-900 dark:text-white font-extrabold">{totalPages}</span> (
            {filteredBookings.length} total orders)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <div className="text-xs font-mono font-bold px-2 text-slate-600 dark:text-slate-300">
              {currentPage} / {totalPages}
            </div>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 6. OPERATIONAL ECOSYSTEM CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Card 1: Varanasi Zone Demand */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Varanasi Zone Density</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Territory Hotspots</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3.5">
              {varanasiLocalities.slice(0, 6).map((loc) => {
                const isSelected = selectedLocality === loc.name;
                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocality(isSelected ? "All" : loc.name);
                      setCurrentPage(1);
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/60 dark:bg-brand-950/60"
                        : "border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate">{loc.name}</p>
                    <div className="flex items-center justify-between mt-1 text-[9px]">
                      <span className="text-slate-500 font-medium">{loc.activeBookings} active</span>
                      <span
                        className={`font-black px-1.5 py-0.2 rounded-full ${
                          loc.status === "Peak"
                            ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : loc.status === "High Demand"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {loc.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link href="/locations" className="text-[11px] font-bold text-brand-600 hover:underline flex items-center justify-end gap-1">
              Locality Management <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Certified Specialist Fleet Leaderboard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Partner Fleet Performance</h3>
              </div>
              <Link href="/technicians" className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 mt-3.5">
              {initialTechnicians.slice(0, 4).map((tech, idx) => (
                <div
                  key={tech.id}
                  className="p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {tech.name[0]}
                      </div>
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-900 text-[8px] font-extrabold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{tech.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{tech.role}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end text-[10px] font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 mr-0.5" /> {tech.rating}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">{tech.totalJobs} jobs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link href="/technicians" className="text-[11px] font-bold text-brand-600 hover:underline flex items-center justify-end gap-1">
              Dispatch Console <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Admin Quick Navigation Console */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Admin Quick Navigation</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-3.5">
              {[
                { label: "Bookings", href: "/bookings", icon: CalendarCheck, color: "text-brand-600" },
                { label: "Partner KYC", href: "/technicians", icon: UserCheck, color: "text-emerald-600" },
                { label: "CRM Clients", href: "/customers", icon: Users, color: "text-blue-600" },
                { label: "Billing & GST", href: "/billing", icon: CreditCard, color: "text-purple-600" },
                { label: "CMS Services", href: "/cms", icon: Wrench, color: "text-amber-600" },
                { label: "RBAC Users", href: "/users", icon: ShieldCheck, color: "text-rose-600" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
                  >
                    <Icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link href="/analytics" className="text-[11px] font-bold text-brand-600 hover:underline flex items-center justify-end gap-1">
              Detailed Analytics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 7. MODALS ─── */}
      <BookingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
}
