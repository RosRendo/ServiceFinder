"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, Lock, Eye, EyeOff, User, Phone, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

function RegisterPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register, googleLogin } = useAuthContext();
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [lang, setLang] = useState<"kh" | "en">("kh");

  const redirectTo = searchParams.get("redirect");
  const selectedRole = "company_admin"; // Hardcode for B2B

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError("");
      // Google user registering should also map to company_admin in this B2B context
      const result = await googleLogin(tokenResponse.access_token, selectedRole);
      if (result.success) {
        router.push(redirectTo || "/company/dashboard");
      } else {
        setError(result.error || (lang === "kh" ? "ការចុះឈ្មោះដោយប្រើ Google បរាជ័យ។" : "Google Registration failed."));
      }
      setIsLoading(false);
    },
    onError: () => {
      setError(lang === "kh" ? "ការចុះឈ្មោះដោយប្រើ Google បរាជ័យ។" : "Google Registration failed.");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const result = await register({ ...formData, role: selectedRole }) as any;
      
      if (!result.success) { 
        setError(result.error || (lang === "kh" ? "ការចុះឈ្មោះបរាជ័យ" : "Registration failed")); 
        setIsLoading(false); 
        return; 
      }
      
      router.push(redirectTo || "/company/dashboard");
    } catch { 
      setError(lang === "kh" ? "មានបញ្ហាមួយបានកើតឡើង។ សូមព្យាយាមម្តងទៀត។" : "An unexpected error occurred. Please try again."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const partners = [
    "PP Cleaners", "Angkor HVAC", "Sabaicode", "PP Logistics", 
    "SmartFix", "Sokha Plumbing", "Vattanac Group", "Chip Mong",
    "Canadia Bank", "ABA Bank", "Zando", "Brown Coffee"
  ];

  return (
    <div className="min-h-screen flex bg-white">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>

      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 md:p-16">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">ServiceFinder</span>
          </Link>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200/60">
            <button 
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${lang === "en" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang("kh")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${lang === "kh" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900"}`}
            >
              KH
            </button>
          </div>
        </div>

        {/* Center Registration Box */}
        <div className="w-full max-w-[400px] mx-auto my-12">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
              {lang === "kh" ? "ចាប់ផ្តើម" : "Get Started"}
            </h1>
            <p className="text-slate-500 font-semibold text-sm">
              {lang === "kh" ? "បង្កើតប្រព័ន្ធប្រតិបត្តិការក្រុមហ៊ុនរបស់អ្នកក្នុងរយៈពេលប៉ុន្មានវិនាទី។" : "Create your company operating system in seconds."}
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-md border border-rose-100 font-medium text-center">
                {error}
              </div>
            )}

            {/* Google SSO - Crisp rounded-md corners */}
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-md font-bold text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2"
              onClick={() => handleGoogleAuth()}
              type="button"
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {lang === "kh" ? "បន្តជាមួយ Google" : "Continue with Google"}
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">{lang === "kh" ? "ឬ" : "Or"}</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Reverted to clean single column stacked list but with premium rounded-md corners */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-bold text-slate-700">{lang === "kh" ? "ឈ្មោះពេញ" : "Full Name"}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    id="name" type="text" placeholder={lang === "kh" ? "សុខា រ." : "John Doe"} 
                    value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-10 h-12 rounded-md border-slate-200 focus:border-slate-900 focus:ring-slate-900 font-semibold" required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700">{lang === "kh" ? "អ៊ីមែលការងារ" : "Work Email"}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    id="email" type="email" placeholder="you@company.com" 
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 rounded-md border-slate-200 focus:border-slate-900 focus:ring-slate-900 font-semibold" required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-bold text-slate-700">{lang === "kh" ? "លេខទូរស័ព្ទ" : "Phone Number"}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    id="phone" type="tel" placeholder="+855 000-0000" 
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 h-12 rounded-md border-slate-200 focus:border-slate-900 focus:ring-slate-900 font-semibold" required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">{lang === "kh" ? "ពាក្យសម្ងាត់" : "Password"}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" 
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 rounded-md border-slate-200 focus:border-slate-900 focus:ring-slate-900 font-semibold" required minLength={8} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold mt-4 shadow-sm text-base uppercase tracking-wider">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {lang === "kh" ? "បង្កើតគណនី" : "CREATE ACCOUNT"}
              </Button>
            </form>

            <p className="text-xs text-slate-400 text-center">
              {lang === "kh" ? "ដោយការបន្ត អ្នកយល់ព្រមនឹង" : "By continuing, you agree to our"} <a href="#" className="font-bold hover:text-slate-900 transition-colors">{lang === "kh" ? "លក្ខខណ្ឌសេវាកម្ម" : "Terms of Service"}</a> {lang === "kh" ? "និង" : "and"} <a href="#" className="font-bold hover:text-slate-900 transition-colors">{lang === "kh" ? "គោលការណ៍ឯកជនភាព" : "Privacy Policy"}</a>.
            </p>
          </div>

          <div className="text-center mt-6">
            <p className="text-slate-500 font-medium">
              {lang === "kh" ? "មានគណនីរួចហើយមែនទេ?" : "Already have an account?"} <Link href="/auth/login" className="font-bold text-slate-900 hover:text-slate-800">{lang === "kh" ? "ចូលគណនី" : "Login"}</Link>
            </p>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="text-xs font-semibold text-slate-400">
          © {new Date().getFullYear()} ServiceFinder. All rights reserved.
        </div>

      </div>

      {/* Right Column: Office Backdrop & Partner Carousel */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-slate-950 text-white p-16 flex-col justify-between overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="max-w-[460px] space-y-6 z-10">
          <span className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">{lang === "kh" ? "ប្រព័ន្ធប្រតិបត្តិការសហគ្រាស" : "Enterprise OS"}</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
            {lang === "kh" ? "បង្កើតឡើងសម្រាប់ស្ថាប័នសេវាកម្មទំនើប។" : "Built for modern service organizations."}
          </h2>
          <p className="text-slate-300 font-medium text-lg leading-relaxed">
            {lang === "kh" ? "បង្រួបបង្រួមប្រតិបត្តិការរបស់អ្នក បង្កើនភាពរលូននៃដំណើរការកក់ និងបំពាក់បុគ្គលិករបស់អ្នកជាមួយប្រព័ន្ធតាមដានផ្ទាល់កម្រិតខ្ពស់។" : "Unify your operations, streamline booking pipelines, and equip your staff with advanced live dispatch systems."}
          </p>
        </div>

        {/* Infinite Smooth Right-to-Left Partner Carousel */}
        <div className="w-full overflow-hidden relative py-4 border-y border-white/10 z-10 bg-slate-950/20 backdrop-blur-sm">
          <div className="flex gap-12 w-[200%] animate-marquee">
            {/* First Set */}
            <div className="flex gap-12 shrink-0">
              {partners.map((partner, idx) => (
                <span key={`p1-${idx}`} className="text-sm font-bold text-slate-400 tracking-wider whitespace-nowrap uppercase">
                  ● {partner}
                </span>
              ))}
            </div>
            {/* Duplicate Set */}
            <div className="flex gap-12 shrink-0">
              {partners.map((partner, idx) => (
                <span key={`p2-${idx}`} className="text-sm font-bold text-slate-400 tracking-wider whitespace-nowrap uppercase">
                  ● {partner}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
