"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuthContext } from "@/lib/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<"kh" | "en">("kh");

  // 2FA States
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verify2FA } = useAuthContext();
  const { toast } = useToast();

  const redirectTo = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await login(email, password) as any;

    if (result.requires2FA) {
      setRequires2FA(true);
      setUserId(result.userId);
      toast({ title: lang === "kh" ? "ទាមទារការផ្ទៀងផ្ទាត់ 2 ជំហាន" : "2FA Required", description: lang === "kh" ? "សូមពិនិត្យកម្មវិធីផ្ទៀងផ្ទាត់របស់អ្នក។" : "Please check your authenticator app." });
      setIsLoading(false);
      return;
    }

    if (result.success) {
      const roleDashboards: Record<string, string> = {
        company_admin: "/company/dashboard",
        staff: "/staff/dashboard",
        admin: "/admin/dashboard",
      };
      const dest = redirectTo || roleDashboards[result.user?.role] || "/";
      router.push(dest);
    } else {
      setError(result.error || (lang === "kh" ? "ការចូលគណនីបរាជ័យ។ សូមពិនិត្យព័ត៌មានរបស់អ្នក។" : "Login failed. Please check your credentials."));
    }

    setIsLoading(false);
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !twoFaCode) return;
    setIsLoading(true);
    setError("");

    const result = await verify2FA(userId, twoFaCode) as any;

    if (result.success) {
      const roleDashboards: Record<string, string> = {
        company_admin: "/company/dashboard",
        staff: "/staff/dashboard",
        admin: "/admin/dashboard",
      };
      const dest = redirectTo || roleDashboards[result.user?.role] || "/";
      router.push(dest);
    } else {
      setError(result.error || (lang === "kh" ? "លេខកូដមិនត្រឹមត្រូវ" : "Invalid 2FA code"));
    }

    setIsLoading(false);
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

      {/* Left Column: Minimal Form */}
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

        {/* Center Card Container */}
        <div className="w-full max-w-[400px] mx-auto my-12">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
              {requires2FA ? (lang === "kh" ? "ការផ្ទៀងផ្ទាត់ 2 ជំហាន" : "Two-Factor Auth") : (lang === "kh" ? "ចូលគណនី" : "Sign In")}
            </h1>
            <p className="text-slate-500 font-semibold text-sm">
              {lang === "kh" ? "គ្រប់គ្រងអាជីវកម្មសេវាកម្មរបស់អ្នកទាំងមូលនៅក្នុងប្រព័ន្ធប្រតិបត្តិការតែមួយ។" : "Manage your entire service business in one operating system."}
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-md border border-rose-100 font-medium text-center">
                {error}
              </div>
            )}

            {!requires2FA ? (
              <>
                {/* Google SSO - Crisp rounded-md corners */}
                <Button variant="outline" className="w-full h-12 rounded-md font-bold text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-bold text-slate-700">{lang === "kh" ? "អ៊ីមែល" : "Email"}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input 
                        id="email" type="email" placeholder="you@company.com" 
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 rounded-md border-slate-200 focus:border-slate-900 focus:ring-slate-900 font-medium" required 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-sm font-bold text-slate-700">{lang === "kh" ? "ពាក្យសម្ងាត់" : "Password"}</Label>
                      <Link href="/auth/forgot-password" className="text-sm font-bold text-slate-600 hover:text-slate-900">{lang === "kh" ? "ភ្លេចពាក្យសម្ងាត់?" : "Forgot password?"}</Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input 
                        id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" 
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-md border-slate-200 focus:border-slate-900 focus:ring-slate-900 font-medium" required 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold mt-2 shadow-sm text-base uppercase tracking-wider">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {lang === "kh" ? "ចូលគណនី" : "SIGN IN"}
                  </Button>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm font-bold text-slate-700">{lang === "kh" ? "បញ្ចូលលេខកូដ ៦ ខ្ទង់" : "Enter 6-digit code"}</Label>
                  <Input 
                    id="code" type="text" placeholder="000000" 
                    value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)}
                    className="h-14 rounded-md text-center tracking-[0.5em] font-mono text-xl border-slate-200 focus:border-slate-900 focus:ring-slate-900 font-bold" 
                    maxLength={6} required 
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold mt-2 shadow-sm text-base uppercase tracking-wider">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {lang === "kh" ? "ផ្ទៀងផ្ទាត់" : "VERIFY"}
                </Button>
              </form>
            )}
          </div>

          {!requires2FA && (
            <div className="text-center mt-6">
              <p className="text-slate-500 font-medium">
                {lang === "kh" ? "មិនទាន់មានគណនីមែនទេ?" : "Don't have an account?"} <Link href="/auth/register" className="font-bold text-slate-900 hover:text-slate-800">{lang === "kh" ? "បង្កើតគណនី" : "Create Account"}</Link>
              </p>
            </div>
          )}
        </div>

        {/* Bottom copyright */}
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
