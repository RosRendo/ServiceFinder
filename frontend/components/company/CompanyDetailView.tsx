"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AuthWallModal } from "@/components/auth/AuthWallModal";
import {
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  PhoneCall,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Zap,
  Image as ImageIcon,
  Heart,
} from "lucide-react";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import Link from "next/link";

interface ServiceData {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  duration: string;
  category?: string;
  basePrice?: number;
  image?: string;
}

interface ReviewData {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  customer?: {
    fullName: string;
    avatar?: string;
  };
}

interface StaffData {
  id: string;
  name: string;
  title: string;
  image?: string;
  user?: {
    fullName: string;
    avatar?: string;
  };
}

interface CompanyData {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  location: string;
  distance?: string;
  verified: boolean;
  logo: string;
  logoUrl?: string;
  cover: string;
  coverImageUrl?: string;
  about: string;
  phone?: string;
  coordinates?: { latitude: number; longitude: number };
  workingHours: { day: string; hours: string }[];
  badges: string[];
  services: ServiceData[];
  reviews: ReviewData[];
  staff: StaffData[];
  city?: string;
  responseTime?: string;
  tagline?: string;
}

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface CompanyDetailViewProps {
  companyId: string;
  showBreadcrumbs?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
  apiBaseUrl?: string;
}

const DEMO_COMPANY: CompanyData = {
  id: "techfix-solutions",
  name: "TechFix Solutions",
  tagline: "Fast & reliable IT services for businesses",
  category: "IT Services & Setup",
  rating: 4.9,
  reviewsCount: 128,
  location: "Phnom Penh, Cambodia",
  distance: "2.3 km away",
  verified: true,
  logo: "TF",
  cover: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
  about: "TechFix Solutions has provided premium IT repair and network installation services since 2018. We have proudly served over 5,000 customers ranging from small startups to enterprise-level offices.",
  phone: "+855 12 345 678",
  coordinates: { latitude: 11.5564, longitude: 104.9282 },
  workingHours: [
    { day: "Monday - Friday", hours: "8:00 AM - 6:00 PM" },
    { day: "Saturday", hours: "9:00 AM - 3:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ],
  badges: ["Verified Company", "Top Rated 2024", "Fast Response", "Premium Partner"],
  services: [
    { id: "s1", name: "Network Installation", category: "Networking", description: "Full office routing, switching, and secure Wi-Fi setup.", priceRange: "$300 - $800", duration: "1 Day", image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=400&auto=format&fit=crop" },
    { id: "s2", name: "Server Configuration", category: "Infrastructure", description: "Linux/Windows server deployment and basic hardening.", priceRange: "$500 - $1,200", duration: "2 Days", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&auto=format&fit=crop" },
    { id: "s3", name: "Hardware Repair", category: "Repair", description: "Motherboard, screen, and battery replacement.", priceRange: "$80 - $250", duration: "2 Hours", image: "https://images.unsplash.com/photo-1517245386807-bb43f82b33c4?q=80&w=400&auto=format&fit=crop" },
  ],
  reviews: [
    { id: "r1", author: "John D.", rating: 5, date: "October 12, 2024", text: "Very fast service and extremely professional." },
    { id: "r2", author: "Sarah M.", rating: 5, date: "September 28, 2024", text: "Pricing was totally transparent." },
  ],
  staff: [],
};

export function CompanyDetailView({ companyId, showBreadcrumbs = true, breadcrumbItems = [], apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "" }: CompanyDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedServiceId = searchParams.get("serviceId");
  const { isAuthenticated } = useAuthContext();

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [similarCompanies, setSimilarCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      setLoading(true);
      setError(null);
      try {
        const companyRes = await fetch(`${apiBaseUrl}/api/companies/${companyId}`);
        if (!companyRes.ok) throw new Error("Company not found");
        const companyData = await companyRes.json();
        
        const servicesRes = await fetch(`${apiBaseUrl}/api/services/company/${companyId}`);
        const servicesData = servicesRes.ok ? await servicesRes.json() : { data: [] };
        
        const reviewsRes = await fetch(`${apiBaseUrl}/api/reviews/company/${companyId}?limit=5`);
        const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { data: [] };
        
        const staffRes = await fetch(`${apiBaseUrl}/api/staff/company/${companyId}`);
        const staffData = staffRes.ok ? await staffRes.json() : { data: [] };

        const safeServices = Array.isArray(servicesData) ? servicesData : (servicesData.data?.data || servicesData.data || servicesData.services || []);
        const safeReviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data?.data || reviewsData.data || reviewsData.reviews || []);
        const safeStaff = Array.isArray(staffData) ? staffData : (staffData.data?.data || staffData.data || staffData.staff || []);

        const normalizedCompany: CompanyData = {
          id: companyData.id || companyData.data?.id,
          name: companyData.name,
          category: companyData.category?.name || "Service Provider",
          rating: companyData.rating || 0,
          reviewsCount: companyData.reviewCount || 0,
          location: companyData.city || companyData.address || "Location TBD",
          city: companyData.city,
          verified: companyData.verificationStatus === "verified",
          logo: companyData.name?.charAt(0) || "C",
          logoUrl: companyData.logoUrl,
          cover: companyData.coverImageUrl || companyData.coverUrl,
          coverImageUrl: companyData.coverImageUrl,
          about: companyData.description || "No description available.",
          phone: companyData.phone,
          coordinates: companyData.coordinates,
          responseTime: companyData.responseTime,
          workingHours: companyData.workingHours || [{ day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" }],
          badges: companyData.badges || [],
          services: Array.isArray(safeServices) ? safeServices : [],
          reviews: Array.isArray(safeReviews) ? safeReviews : [],
          staff: Array.isArray(safeStaff) ? safeStaff : [],
        };
        setCompany(normalizedCompany);

        // Fetch similar companies in same category
        try {
          const catId = companyData.categoryId || companyData.category?.id;
          const similarRes = await fetch(
            `${apiBaseUrl}/api/companies?limit=3${catId ? `&categoryId=${catId}` : ''}`
          );
          if (similarRes.ok) {
            const similarData = await similarRes.json();
            const companies = (similarData.data?.companies || similarData.data || []) as any[];
            setSimilarCompanies(
              companies
                .filter((c: any) => c.id?.toString() !== companyId?.toString())
                .slice(0, 3)
                .map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  category: c.category?.name || "Service Provider",
                  rating: c.rating || 0,
                  reviewsCount: c.reviewCount || 0,
                  location: c.city || c.address || "",
                  distance: c.distance,
                  verified: c.verificationStatus === "verified",
                  logo: c.name?.charAt(0) || "C",
                  logoUrl: c.logoUrl,
                  cover: c.coverImageUrl || "",
                  coverImageUrl: c.coverImageUrl,
                  about: c.description || "",
                  phone: c.phone,
                  workingHours: c.workingHours || [],
                  badges: c.badges || [],
                  services: [],
                  reviews: [],
                  staff: [],
                }))
            );
          }
        } catch (simErr) {
          console.warn("Could not load similar companies", simErr);
        }
      } catch (err) {
        console.error("Error fetching company:", err);
        setError("Failed to load company details");
        setCompany(DEMO_COMPANY as any);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [companyId, apiBaseUrl]);

  const displayCompany = company as CompanyData || DEMO_COMPANY;

  const uniqueCategories = Array.from(new Set(displayCompany.services.map(s => s.category).filter(Boolean))) as string[];
  const categories = ["All", ...uniqueCategories];
  
  // Auto-highlight, scroll to, and open modal for a service when serviceId is in URL
  useEffect(() => {
    if (highlightedServiceId && displayCompany && displayCompany.services.length > 0) {
      const service = displayCompany.services.find(s => s.id === highlightedServiceId);
      if (service) {
        // Switch category tab if needed
        if (service.category) {
          setActiveTab(service.category);
        }
        // Auto-open the service detail modal immediately
        setSelectedService(service);
        setShowServiceModal(true);
        // Also scroll to card in background
        setTimeout(() => {
          const element = document.getElementById(`service-${highlightedServiceId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      }
    }
  }, [highlightedServiceId, displayCompany]);

  const filteredServices = displayCompany.services.filter(s => activeTab === "All" || s.category === activeTab);

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: displayCompany.reviews.filter(r => Math.round(r.rating) === stars).length,
  }));
  const totalReviews = displayCompany.reviews.length;

  const gallery = [
    displayCompany.coverImageUrl || displayCompany.cover,
    "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517245386807-bb43f82b33c4?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1600&auto=format&fit=crop",
  ];

  const handleBookNow = () => {
    if (isAuthenticated && company) router.push(`/customer/bookings/new?company=${displayCompany.id}`);
    else setShowAuthModal(true);
  };

  const handleCall = () => {
    if (company?.phone) window.location.href = `tel:${displayCompany.phone}`;
  };

  const handleBookServiceAction = (service: ServiceData) => {
    setShowServiceModal(false);
    if (isAuthenticated && company) router.push(`/customer/bookings/new?company=${displayCompany.id}&serviceId=${service.id}`);
    else {
      setSelectedService(service);
      setShowAuthModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">Company Not Found</h1>
          <p className="text-stone-500 mb-6">{error}</p>
          <Button onClick={() => router.push("/explore")} className="bg-stone-900 text-white hover:bg-stone-800">Browse Companies</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans pb-24 lg:pb-12">
      {/* HERO BENTO GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
 
        <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden h-[300px] sm:h-[400px] lg:h-[500px] grid grid-cols-4 gap-2">
          {/* Main Hero Image */}
          <div className="col-span-4 lg:col-span-2 h-full relative group cursor-pointer" onClick={() => { setCurrentGalleryIndex(0); setShowGallery(true); }}>
            <img src={gallery[0]} alt={displayCompany.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
          
          {/* Top Right Images */}
          <div className="hidden lg:grid col-span-1 gap-2 h-full">
            <div className="relative h-full overflow-hidden group cursor-pointer" onClick={() => { setCurrentGalleryIndex(1); setShowGallery(true); }}>
              <img src={gallery[1]} alt="Gallery 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="relative h-full overflow-hidden group cursor-pointer" onClick={() => { setCurrentGalleryIndex(2); setShowGallery(true); }}>
              <img src={gallery[2]} alt="Gallery 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          </div>
          
          {/* Far Right Images with View All Overlay */}
          <div className="hidden lg:grid col-span-1 gap-2 h-full">
            <div className="relative h-full overflow-hidden group cursor-pointer" onClick={() => { setCurrentGalleryIndex(3); setShowGallery(true); }}>
              <img src={gallery[3]} alt="Gallery 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="relative h-full overflow-hidden cursor-pointer group" onClick={() => { setCurrentGalleryIndex(4); setShowGallery(true); }}>
              <img src={gallery[4]} alt="Gallery 4" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <div className="text-center">
                  <span className="text-white text-xl sm:text-2xl font-semibold">+{gallery.length - 4}</span>
                  <p className="text-white/80 text-xs sm:text-sm font-medium mt-1">Photos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile View All Button */}
          <Button 
            onClick={() => setShowGallery(true)}
            className="lg:hidden absolute bottom-4 right-4 bg-white/90 text-stone-900 hover:bg-white backdrop-blur-md rounded-full shadow-lg"
          >
            <ImageIcon className="w-4 h-4 mr-2" /> 1/{gallery.length}
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
          
          {/* LEFT COLUMN (70%) */}
          <div className="w-full lg:w-[65%] xl:w-[70%] pb-12">
            
            {/* Header Info */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 pr-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase">
                    {displayCompany.category}
                  </span>
                  {displayCompany.verified && (
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl md:text-5xl font-serif font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                    {displayCompany.name}
                  </h1>
                </div>
                {displayCompany.tagline && (
                  <p className="text-lg text-stone-500 dark:text-stone-400 mt-2 font-medium">
                    {displayCompany.tagline}
                  </p>
                )}
              </div>
              <div className="flex gap-3 items-start shrink-0">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="rounded-full h-12 w-12 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-stone-500"}`} />
                </Button>
                <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 dark:from-stone-700 dark:to-stone-800 items-center justify-center text-white font-serif text-2xl shadow-lg">
                  {displayCompany.logo || displayCompany.name?.charAt(0) || "C"}
                </div>
              </div>
            </div>

            {/* Quick Info Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 mb-8">
              <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-xl flex items-center gap-3 border border-stone-100 dark:border-stone-800">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-500">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-500 uppercase font-semibold tracking-wide">Response</p>
                  <p className="font-medium text-stone-900 dark:text-stone-100 text-sm">{displayCompany.responseTime || "~1 hr"}</p>
                </div>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-xl flex items-center gap-3 border border-stone-100 dark:border-stone-800">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-500 uppercase font-semibold tracking-wide">Completed</p>
                  <p className="font-medium text-stone-900 dark:text-stone-100 text-sm">500+ jobs</p>
                </div>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-xl flex items-center gap-3 border border-stone-100 dark:border-stone-800">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-500">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-500 uppercase font-semibold tracking-wide">Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-stone-900 dark:text-stone-100 text-sm">{displayCompany.rating}</p>
                    <a href="#reviews" className="text-xs text-stone-500 hover:text-amber-600 underline decoration-stone-300">({displayCompany.reviewsCount})</a>
                  </div>
                </div>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-xl flex items-center gap-3 border border-stone-100 dark:border-stone-800">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-500 uppercase font-semibold tracking-wide">Distance</p>
                  <p className="font-medium text-stone-900 dark:text-stone-100 text-sm">{displayCompany.distance || "2.3 km"}</p>
                </div>
              </div>
            </div>

            <hr className="border-stone-200 dark:border-stone-800 my-8" />

            {/* About Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-5">About the Company</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[15px] md:text-base">
                {displayCompany.about}
              </p>
              
              {/* Trust Section inside content */}
              <div className="mt-8 bg-stone-50 dark:bg-stone-900/50 p-6 rounded-2xl border border-stone-200 dark:border-stone-800">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-4">Why choose {displayCompany.name}?</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <p className="text-sm text-stone-600 dark:text-stone-400">Secure booking and payment protection via ServiceFinder.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <p className="text-sm text-stone-600 dark:text-stone-400">Verified business details, licenses, and customer reviews.</p>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-stone-200 dark:border-stone-800 my-8" />

            {/* Services Section */}
            <section className="mb-12" id="services">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">Services Offered</h2>
              </div>
              
              {/* Category Filter Tabs */}
              {categories.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveTab(category)}
                      className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                        activeTab === category
                          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm"
                          : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {filteredServices.length === 0 ? (
                  <div className="bg-stone-50 dark:bg-stone-900/50 p-8 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">No services found</h3>
                    <p className="text-stone-500 mb-6 max-w-sm">We couldn't find any services matching this category. Please check another category or contact the provider directly.</p>
                    <Button onClick={handleCall} className="bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-700">
                      Contact Provider
                    </Button>
                  </div>
                ) : (
                  filteredServices.map((service) => (
                    <motion.div 
                      key={service.id} 
                      id={`service-${service.id}`}
                      whileHover={{ y: -2 }}
                      className={`bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row gap-5 hover:shadow-lg transition-all group ${
                        highlightedServiceId === service.id
                          ? "border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10 dark:shadow-amber-500/5 bg-amber-50/30 dark:bg-amber-900/10"
                          : "border-stone-200 dark:border-stone-800"
                      }`}
                    >
                      {service.image && (
                        <div className="w-full sm:w-48 h-36 sm:h-auto rounded-xl overflow-hidden shrink-0 relative">
                          <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors">{service.name}</h3>
                            <span className="text-lg font-semibold text-stone-900 dark:text-stone-100 shrink-0">
                              {service.priceRange || `$${service.basePrice}`}
                            </span>
                          </div>
                          <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 sm:line-clamp-3 mb-4 leading-relaxed">
                            {service.description || "No description provided."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md">
                            <Clock className="w-4 h-4" /> {service.duration || "1 hr"}
                          </span>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              onClick={() => { setSelectedService(service); setShowServiceModal(true); }}
                              className="flex-1 sm:flex-none border-stone-300 dark:border-stone-700"
                            >
                              Details
                            </Button>
                            <Button 
                              onClick={() => handleBookServiceAction(service)} 
                              className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-stone-900 shadow-md shadow-amber-500/10"
                            >
                              Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            <hr className="border-stone-200 dark:border-stone-800 my-8" />

            {/* Reviews Section */}
            <section className="mb-12" id="reviews">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">Guest Reviews</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{displayCompany.rating}</span>
                    <div className="flex items-center bg-amber-500 px-2 py-0.5 rounded text-white"><Star className="w-3.5 h-3.5 fill-current mr-1" /> Excellent</div>
                    <span className="text-stone-500 text-sm ml-1">Based on {displayCompany.reviewsCount} reviews</span>
                  </div>
                </div>
                <Link href={`/provider/${displayCompany.id}/reviews`} className="hidden sm:flex text-amber-600 dark:text-amber-500 text-sm font-medium hover:underline items-center gap-1">
                  Read All Reviews <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Rating Breakdown */}
              {totalReviews > 0 && (
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 mb-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="text-center md:text-left shrink-0">
                    <div className="text-5xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">{displayCompany.rating}</div>
                    <div className="flex justify-center md:justify-start text-amber-500 mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(displayCompany.rating) ? "fill-current" : "fill-stone-200 text-stone-200 dark:fill-stone-700 dark:text-stone-700"}`} />)}
                    </div>
                    <div className="text-sm text-stone-500">Based on {totalReviews} reviews</div>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {ratingCounts.map(({ stars, count }) => (
                      <div key={stars} className="flex items-center gap-3 text-sm">
                        <div className="w-12 text-stone-600 dark:text-stone-400 text-right">{stars} Stars</div>
                        <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full" 
                            style={{ width: `${totalReviews > 0 ? (count / totalReviews) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="w-8 text-stone-500 text-right">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayCompany.reviews.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700">
                    <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Star className="w-8 h-8 text-stone-300" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">No reviews yet</h3>
                    <p className="text-stone-500 mb-6 max-w-sm mx-auto">This provider doesn't have any reviews. Be the first to share your experience!</p>
                    <Button variant="outline" className="border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800">
                      Write a Review
                    </Button>
                  </div>
                ) : (
                  displayCompany.reviews.slice(0,4).map(review => (
                    <div key={review.id} className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-medium text-stone-600 dark:text-stone-300">
                            {review.customer?.avatar ? <img src={review.customer.avatar} className="w-full h-full rounded-full" /> : (review.author?.charAt(0) || "?")}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-stone-900 dark:text-stone-100">{review.customer?.fullName || review.author}</div>
                            <div className="text-xs text-stone-500">{review.date}</div>
                          </div>
                        </div>
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-current" : "fill-stone-200 text-stone-200 dark:fill-stone-700 dark:text-stone-700"}`} />)}
                        </div>
                      </div>
                      <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed line-clamp-4">"{review.text}"</p>
                    </div>
                  ))
                )}
              </div>
              <Link href={`/provider/${displayCompany.id}/reviews`} className="sm:hidden mt-4 text-amber-600 text-sm font-medium flex justify-center hover:underline items-center gap-1">
                Read All Reviews <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            <hr className="border-stone-200 dark:border-stone-800 my-8" />

            {/* Location Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-6">Location</h2>
              <div className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm">
                <div className="aspect-video sm:aspect-[2.5/1] bg-stone-100 dark:bg-stone-800 relative">
                  {displayCompany.coordinates ? (
                    <iframe 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      loading="lazy" 
                      allowFullScreen 
                      referrerPolicy="no-referrer-when-downgrade" 
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZKTgaQ74r4nqE&q=${displayCompany.coordinates.latitude},${displayCompany.coordinates.longitude}&zoom=15`} 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                        <p className="text-stone-400 text-sm">Map data not available</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-100 mb-1">{displayCompany.location}</p>
                      <p className="text-sm text-stone-500">Service area may vary. Contact provider to confirm.</p>
                    </div>
                  </div>
                  <Button variant="outline" className="shrink-0" asChild>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${displayCompany.coordinates?.latitude || ''},${displayCompany.coordinates?.longitude || ''}`} target="_blank" rel="noopener noreferrer">
                      Get Directions <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            </section>

            <hr className="border-stone-200 dark:border-stone-800 my-8" />

            {/* Similar Providers Section */}
            <section className="mb-4">
              <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-6">Similar Providers</h2>
              {similarCompanies.length === 0 ? (
                <p className="text-stone-500 text-sm">No similar providers found nearby.</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                  {similarCompanies.map((sim) => (
                    <Link
                      key={sim.id}
                      href={`/provider/${sim.id}`}
                      className="w-64 shrink-0 bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 hover:shadow-lg transition-shadow group cursor-pointer"
                    >
                      <div className="h-32 bg-stone-200 dark:bg-stone-800 relative overflow-hidden">
                        {sim.coverImageUrl ? (
                          <img src={sim.coverImageUrl} alt={sim.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-700 to-stone-900 text-white font-serif text-4xl">
                            {sim.logo}
                          </div>
                        )}
                        {sim.rating > 0 && (
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {sim.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-stone-500 uppercase tracking-wide font-semibold mb-1">{sim.category}</p>
                        <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-1 truncate">{sim.name}</h3>
                        <p className="text-sm text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {sim.location || "Nearby"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN (30% STICKY) */}
          <div className="hidden lg:block lg:w-[35%] xl:w-[30%] relative">
            <div className="sticky top-24 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 lg:p-8 shadow-xl">
              
              {/* Pricing Header */}
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-medium mb-1 tracking-wide">Starting from</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                      {displayCompany.services[0]?.basePrice ? `$${displayCompany.services[0].basePrice}` : "$49"}
                    </span>
                  </div>
                </div>
                {displayCompany.services[0]?.duration && (
                  <span className="text-sm text-stone-500 mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {displayCompany.services[0].duration}</span>
                )}
              </div>
              
              {/* Primary Actions */}
              <div className="space-y-3 mb-8">
                <Button onClick={handleBookNow} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 h-14 rounded-xl font-semibold text-lg shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5">
                  <Calendar className="w-5 h-5 mr-2" /> Book Appointment
                </Button>
                <Button onClick={handleCall} variant="outline" className="w-full h-14 rounded-xl font-medium text-base border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  <PhoneCall className="w-5 h-5 mr-2 text-stone-500" /> Contact Provider
                </Button>
              </div>

              {/* Working Hours */}
              <div className="pt-6 border-t border-stone-200 dark:border-stone-800">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">Working Hours</h4>
                <div className="space-y-3">
                  {displayCompany.workingHours.map((hours, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-stone-500 dark:text-stone-400">{hours.day}</span>
                      <span className="font-medium text-stone-900 dark:text-stone-100">{hours.hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust markers */}
              <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure booking via ServiceFinder
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                   <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified business details
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* MOBILE BOTTOM BOOKING BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-4 pb-6 z-40 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex items-center justify-between">
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Starting from</p>
          <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{displayCompany.services[0]?.basePrice ? `$${displayCompany.services[0].basePrice}` : "$49"}</p>
        </div>
        <Button onClick={handleBookNow} className="bg-amber-500 hover:bg-amber-600 text-stone-900 h-12 px-8 rounded-xl font-semibold shadow-lg shadow-amber-500/20">
          Book Now
        </Button>
      </div>

      {/* SERVICE MODAL */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-white dark:bg-stone-900 border-0 shadow-2xl rounded-2xl sm:rounded-3xl">
          {selectedService && (
            <>
              {selectedService.image ? (
                <div className="w-full h-56 sm:h-64 relative">
                   <img src={selectedService.image} alt={selectedService.name} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <h2 className="absolute bottom-4 left-6 right-6 text-2xl font-serif font-medium text-white">{selectedService.name}</h2>
                </div>
              ) : (
                <div className="px-6 pt-8 pb-4">
                  <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-white">{selectedService.name}</h2>
                </div>
              )}
              
              <div className="px-6 py-4">
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-stone-100 dark:border-stone-800">
                   <div>
                     <p className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-1">Price</p>
                     <p className="text-lg font-semibold text-amber-600">{selectedService.priceRange || `$${selectedService.basePrice}`}</p>
                   </div>
                   <div>
                     <p className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-1">Duration</p>
                     <p className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100 font-medium"><Clock className="w-4 h-4 text-stone-400" /> {selectedService.duration}</p>
                   </div>
                </div>
                
                <h3 className="font-medium text-stone-900 dark:text-white mb-2">Service Description</h3>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-sm">{selectedService.description || "No description provided for this service."}</p>
              </div>
              
              <div className="p-6 pt-2 flex gap-3">
                <Button variant="outline" onClick={() => setShowServiceModal(false)} className="flex-1 h-12 rounded-xl">Close</Button>
                <Button onClick={() => handleBookServiceAction(selectedService)} className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium">
                  <Calendar className="w-4 h-4 mr-2" /> Book Service
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* FULLSCREEN GALLERY MODAL */}
      <AnimatePresence>
        {showGallery && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
             <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
                <div className="text-white font-medium">{currentGalleryIndex + 1} / {gallery.length}</div>
                <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full" onClick={() => setShowGallery(false)}>Close</Button>
             </div>
             
             <div className="flex-1 relative flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentGalleryIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    src={gallery[currentGalleryIndex]}
                    className="max-w-full max-h-full object-contain"
                  />
                </AnimatePresence>
                
                <button 
                  onClick={() => setCurrentGalleryIndex((prev) => (prev - 1 + gallery.length) % gallery.length)} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setCurrentGalleryIndex((prev) => (prev + 1) % gallery.length)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
             </div>
             
             {/* Thumbnail strip */}
             <div className="h-24 bg-black/90 flex items-center justify-center gap-2 px-4 overflow-x-auto">
                {gallery.map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentGalleryIndex(idx)} className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden transition-all ${idx === currentGalleryIndex ? "border-2 border-white opacity-100" : "opacity-50 hover:opacity-80"}`}>
                     <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthWallModal open={showAuthModal} onOpenChange={setShowAuthModal} companyId={company?.id} redirectTo={company ? `/customer/bookings/new?company=${displayCompany.id}${selectedService ? `&serviceId=${selectedService.id}` : ""}` : undefined} />
    </div>
  );
}