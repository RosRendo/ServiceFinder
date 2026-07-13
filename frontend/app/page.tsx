"use client";

import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  MessageSquareText,
  CreditCard,
  Sparkles,
  Star,
  ArrowRight,
  BarChart3,
  Users,
  Calendar,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SaaSIndex() {
  const { user, loading, isAuthenticated } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "company_admin") router.push("/company/dashboard");
      if (user.role === "admin") router.push("/admin/dashboard");
    }
  }, [loading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              ServiceFinder
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
              <Globe className="w-4 h-4" />
              <span>EN</span>
            </div>
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/auth/register">
              <Button className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full lg:w-1/2 text-center lg:text-left z-10"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Version 2.0 Now Live
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
                Manage your field services with <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">precision.</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                The all-in-one platform for cleaning, plumbing, and maintenance companies to dispatch staff, track jobs, and grow revenue.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-md shadow-sm w-full flex items-center gap-2">
                    Start your free trial <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" className="h-12 px-8 border-slate-200 text-slate-700 text-base font-medium rounded-md hover:bg-slate-50 w-full sm:w-auto">
                  Book a demo
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-500">
                  <span className="flex items-center text-amber-500 font-bold"><Star className="w-4 h-4 fill-amber-500 mr-1" /> 4.9/5</span>
                  from 10k+ businesses
                </div>
              </div>
            </motion.div>

            {/* Right Content: Abstract App Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="w-full lg:w-1/2 flex justify-center lg:justify-end relative mt-12 lg:mt-0"
            >
              <div className="absolute inset-0 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 transform translate-x-10 translate-y-10"></div>
              
              {/* Phone Frame */}
              <motion.div 
                initial={{ rotate: -2, y: 10 }}
                animate={{ rotate: -2, y: -10 }}
                transition={{ y: { repeat: Infinity, duration: 4, ease: "easeInOut", repeatType: "reverse" } }}
                className="relative w-[320px] h-[650px] bg-white rounded-[3rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden"
              >
                {/* iPhone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                  <div className="w-32 h-6 bg-slate-900 rounded-b-3xl"></div>
                </div>

                {/* App UI Inside Frame */}
                <div className="absolute inset-0 bg-slate-50 flex flex-col pt-14 pb-6 px-5 relative">
                  
                  {/* Fake Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Good Morning</div>
                      <div className="text-lg font-bold text-slate-900 mt-1">Acme Services</div>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
                      <img src="https://i.pravatar.cc/100?img=5" alt="Profile" />
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <div className="text-slate-400 text-xs font-semibold mb-1">Today's Revenue</div>
                      <div className="text-xl font-bold text-slate-900">$1,240</div>
                    </div>
                    <div className="bg-blue-600 rounded-2xl p-4 shadow-sm">
                      <div className="text-blue-200 text-xs font-semibold mb-1">Active Jobs</div>
                      <div className="text-xl font-bold text-white">12 Jobs</div>
                    </div>
                  </div>

                  {/* Map / Dispatch Area */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-900 text-sm">Live Dispatch</h4>
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-slate-100 rounded-xl flex-1 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]"></div>
                      <div className="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-md absolute top-1/3 left-1/3 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-md absolute bottom-1/3 right-1/4 flex items-center justify-center">
                         <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Active Booking Card (Floating at bottom) */}
                  <div className="bg-slate-900 rounded-[1.5rem] p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-3">
                      <span className="text-xs font-bold text-white">Incoming Request</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-2 py-1 rounded">JUST NOW</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                        <Users className="w-5 h-5 text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">Deep Cleaning</div>
                        <div className="text-[10px] text-slate-400">123 Market St, SF</div>
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-slate-900" />
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Bento Grid Feature Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Everything you need to scale</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Replace a dozen fragmented tools with one unified platform built specifically for field service companies.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            
            {/* Bento Item 1: Large */}
            <div className="md:col-span-2 bg-slate-900 rounded-[2rem] p-10 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Smart Dispatching</h3>
                <p className="text-slate-300 max-w-md leading-relaxed text-lg">Automatically assign jobs based on staff location, availability, and skill set. Watch them move on the map in real-time.</p>
              </div>
            </div>

            {/* Bento Item 2: Small */}
            <div className="bg-blue-50 rounded-[2rem] p-10 flex flex-col justify-between border border-blue-100 group">
              <div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm text-blue-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Instant Payments</h3>
                <p className="text-slate-600 leading-relaxed">Accept credit cards and digital wallets with next-day payouts.</p>
              </div>
            </div>

            {/* Bento Item 3: Small */}
            <div className="bg-white rounded-[2rem] p-10 flex flex-col justify-between border border-slate-200 shadow-sm group">
              <div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 border border-slate-100 text-slate-700">
                  <MessageSquareText className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Client Comms</h3>
                <p className="text-slate-500 leading-relaxed">Automated ETA alerts and built-in messaging keeps customers in the loop.</p>
              </div>
            </div>

            {/* Bento Item 4: Large */}
            <div className="md:col-span-2 bg-slate-50 rounded-[2rem] p-10 flex flex-col justify-between border border-slate-200 overflow-hidden relative group">
              <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-50 transition-transform group-hover:scale-105">
                <BarChart3 className="w-64 h-64 text-slate-200" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 text-slate-700">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Advanced Analytics</h3>
                <p className="text-slate-500 max-w-md leading-relaxed text-lg">Track revenue, identify your most profitable services, and monitor staff performance with beautiful, exportable dashboards.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to streamline your operations?</h2>
          <p className="text-slate-300 mb-10 max-w-xl mx-auto text-lg">Join thousands of service businesses that have already modernized their workflow with ServiceFinder.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow-sm">
                Create your account
              </Button>
            </Link>
            <span className="text-slate-500 text-sm">or</span>
            <Link href="/auth/login" className="text-white hover:text-blue-400 font-medium transition-colors">
              Sign in to your dashboard
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold tracking-tight text-slate-900">ServiceFinder</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} ServiceFinder Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}