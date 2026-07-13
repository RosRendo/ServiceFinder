"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Clock, MapPin, Shield, Check, ChevronLeft, Calendar, Phone, Mail, ArrowRight, Loader2, Edit, CheckCircle2, Box, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/api/client";

export default function ServiceDetails() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [serviceData, setServiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchService = async () => {
      try {
        const response = await apiClient.get(`/services/${id}`);
        setServiceData(response.data.data || response.data.service || response.data);
      } catch (err: any) {
        console.error("Failed to fetch service:", err);
        setError("Failed to load service details.");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error || !serviceData) return (
    <div className="min-h-screen flex items-center justify-center pb-20 px-4">
        <div className="bg-white/60 backdrop-blur-xl border border-rose-200/50 bg-rose-50/50 p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-3xl text-center shadow-sm">
            <p className="text-rose-600 font-bold text-lg">{error || "Service not found."}</p>
            <Button variant="outline" className="border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded-xl px-8 h-11 font-semibold" onClick={() => router.back()}>Go Back</Button>
        </div>
    </div>
  );

  const features = Array.isArray(serviceData.features) ? serviceData.features : [];
  const durationText = serviceData.durationMax 
    ? `${serviceData.durationMin}-${serviceData.durationMax} mins`
    : `${serviceData.durationMin} mins`;
  const price = Number(serviceData.basePrice || 0).toFixed(2);
  const categoryName = serviceData.serviceType?.name || serviceData.category?.name || "Service";
  const companyName = serviceData.company?.name || "Company";
  const companyLogo = serviceData.company?.logoUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100";
  const images = serviceData.image ? [serviceData.image] : ["https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800"];

  return (
    <div className="min-h-screen pb-24 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 lg:px-8 py-2 bg-white border-b border-gray-200 shadow-sm mb-6">
          <div className="max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 sm:h-20 gap-4">
                  <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 hover:bg-slate-100 shrink-0">
                          <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <div>
                          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight line-clamp-1">{serviceData.name}</h1>
                          <p className="text-sm font-medium text-gray-500">Service Details</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 pl-14 sm:pl-0">
                      <Button onClick={() => alert("Edit modal would open here")} className="rounded-xl h-10 shadow-md w-full sm:w-auto">
                          <Edit className="h-4 w-4 mr-2" /> Edit Service
                      </Button>
                  </div>
              </div>
          </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-2 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Main Image */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-3 shadow-sm overflow-hidden">
                <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-video relative flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      src={images[selectedImage]}
                      alt={serviceData.name}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>
                </div>

                {/* Thumbnail Gallery */}
                {images.length > 1 && (
                  <div className="flex gap-3 mt-3 overflow-x-auto pb-2 snap-x">
                    {images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all snap-center ${
                          selectedImage === index ? "border-primary shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full mix-blend-multiply opacity-50" />
                
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                    <Info className="w-5 h-5 text-primary" /> About This Service
                </h2>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 relative z-10">
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                        {serviceData.description || "No description provided."}
                    </p>
                </div>
            </motion.div>

            {/* Features */}
            {features.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Box className="w-5 h-5 text-indigo-500" /> What's Included
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {features.map((feature: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <span className="text-slate-700 font-medium text-sm leading-snug">{feature}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="sticky top-28 space-y-6">
                
                {/* Status & Price Card */}
                <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 blur-[40px] rounded-full" />
                    
                    <div className="flex items-center gap-2 mb-6 relative z-10">
                        <div className={`w-2.5 h-2.5 rounded-full ${serviceData.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                            {serviceData.isActive ? 'Active & Visible' : 'Hidden'}
                        </span>
                    </div>

                    <div className="mb-8 relative z-10">
                        <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
                            {categoryName}
                        </span>
                        <h1 className="text-2xl font-black text-white leading-tight mb-2">
                            {serviceData.name}
                        </h1>
                        <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                            <Clock className="w-4 h-4" />
                            {durationText}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative z-10 backdrop-blur-md flex flex-col items-center justify-center text-center">
                        <p className="text-slate-400 font-medium text-sm mb-1">Base Price</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-slate-300 font-medium text-lg">$</span>
                            <span className="text-4xl font-black text-white">{price}</span>
                        </div>
                    </div>
                </div>

                {/* Company Info */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 font-medium mb-4">Provided By</p>
                    <div className="flex items-center gap-4">
                        <img
                            src={companyLogo}
                            alt={companyName}
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-gray-200 shrink-0"
                        />
                        <div>
                            <p className="font-bold text-gray-900 text-lg leading-tight">{companyName}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-xs font-semibold text-gray-500">Verified Partner</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
