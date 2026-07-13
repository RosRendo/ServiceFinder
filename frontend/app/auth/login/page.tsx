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
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      toast({ title: "2FA Required", description: "Please check your authenticator app." });
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
      setError(result.error || "Login failed. Please check your credentials.");
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
      setError(result.error || "Invalid 2FA code");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-slate-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ServiceFinder</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6 leading-tight">Welcome back to your workspace.</h2>
          <p className="text-lg text-slate-300">
            Log in to manage your bookings, dispatch your staff, and monitor your business growth in real-time.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-8 lg:hidden flex justify-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">ServiceFinder</span>
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {requires2FA ? "Two-Factor Authentication" : "Sign in to your account"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {requires2FA ? "Enter the 6-digit code from your authenticator app." : "Welcome back! Please enter your details."}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-md mb-6 border border-rose-100 font-medium">
              {error}
            </div>
          )}

          {!requires2FA ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    id="email" type="email" placeholder="you@company.com" 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500" required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" 
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500" required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium mt-4">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign in
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-sm font-medium text-gray-700">Authentication Code</Label>
                <Input 
                  id="code" type="text" placeholder="000000" 
                  value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)}
                  className="h-10 text-center tracking-[0.5em] font-mono text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500" 
                  maxLength={6} required 
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium mt-4">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify
              </Button>
            </form>
          )}

          {!requires2FA && (
            <div className="text-center mt-8 text-sm text-gray-500">
              Don't have an account? <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-700">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
