"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, Lock, Eye, EyeOff, User, Phone, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuthContext } from "@/lib/contexts/AuthContext";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuthContext();
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", password: "" });

  const redirectTo = searchParams.get("redirect");
  const selectedRole = "company_admin"; // Hardcode for B2B

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const result = await register({ ...formData, role: selectedRole }) as any;
      
      if (!result.success) { 
        setError(result.error || "Registration failed"); 
        setIsLoading(false); 
        return; 
      }
      
      router.push(redirectTo || "/company/dashboard");
    } catch { 
      setError("An unexpected error occurred. Please try again."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-slate-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ServiceFinder</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6 leading-tight">Build your service empire.</h2>
          <p className="text-lg text-slate-300">
            Join thousands of modern businesses using ServiceFinder to dispatch staff, track jobs, and scale revenue effortlessly.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[440px]">
          
          <div className="mb-8 lg:hidden flex justify-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">ServiceFinder</span>
            </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Start your 14-day free trial. No credit card required.</p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-md mb-6 border border-rose-100 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="name" type="text" placeholder="John Doe" 
                  value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-9 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500" required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="email" type="email" placeholder="you@company.com" 
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-9 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500" required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="phone" type="tel" placeholder="+1 (555) 000-0000" 
                  value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-9 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500" required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" 
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-9 pr-9 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500" required minLength={8} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters.</p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium mt-4">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>

          <div className="text-center mt-8 text-sm text-gray-500">
            Already have an account? <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
