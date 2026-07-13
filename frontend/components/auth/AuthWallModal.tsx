"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/contexts/AuthContext";

type AuthMode = "login" | "register" | "forgot-password";

interface AuthWallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  serviceId?: string;
  redirectTo?: string;
}

export function AuthWallModal({
  open,
  onOpenChange,
  companyId,
  serviceId,
  redirectTo,
}: AuthWallModalProps) {
  const router = useRouter();
  const { login: contextLogin, googleLogin } = useAuthContext();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode("login");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      const errorTimer = setTimeout(() => setError(null), 3000);
      return () => {
        clearTimeout(timer);
        clearTimeout(errorTimer);
      };
    }
  }, [error]);

  const buildRedirectUrl = () => {
    if (redirectTo) return redirectTo;
    if (companyId && serviceId) return `/customer/bookings/new?company=${companyId}&serviceId=${serviceId}`;
    if (companyId) return `/customer/bookings/new?company=${companyId}`;
    return "/customer/dashboard";
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await contextLogin(email, password);
    
    if (result.success) {
      onOpenChange(false);
      router.push(buildRedirectUrl());
    } else {
      setError((result as any).error || "Invalid email or password");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await googleLogin("", "customer");
      onOpenChange(false);
      router.push(buildRedirectUrl());
    } catch (err) {
      setError("Google login failed. Please try again.");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: name,
            email,
            password,
            confirmPassword,
            role: "customer",
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        onOpenChange(false);
        router.push(buildRedirectUrl());
      } else {
        const err = await response.json();
        setError(err.error || "Registration failed");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  const handleGuestBrowse = () => {
    onOpenChange(false);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isLoginValid = email && password && validateEmail(email);
  const isRegisterValid = name && email && password && confirmPassword && password.length >= 6;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 p-8 pb-16">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {mode === "login" && "Welcome Back"}
                  {mode === "register" && "Create Account"}
                  {mode === "forgot-password" && "Reset Password"}
                </h2>
                <p className="text-blue-100 mt-2">
                  {mode === "login" && "Sign in to book your service"}
                  {mode === "register" && "Join to book services"}
                  {mode === "forgot-password" && "We'll send you a reset link"}
                </p>
              </div>
            </div>

            <div className="px-8 pb-8 -mt-8">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6">
                <AnimatePresence mode="wait">
                  {mode === "login" && (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleEmailLogin}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className={`w-full h-12 pl-11 pr-4 rounded-xl border ${
                              error ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                            } bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${shake ? "animate shake" : ""}`}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full h-12 pl-11 pr-12 rounded-xl border ${
                              error ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                            } bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setMode("forgot-password")}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        disabled={!isLoginValid || loading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LOGIN WITH EMAIL"}
                      </Button>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-sm text-slate-400">OR</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={loading}
                          className="w-full h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.96 21.3 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.96 2.7 2.18 4.93l2.85 2.85C6.71 8.31 9.14 6.38 12 6.38z"
                            />
                          </svg>
                          CONTINUE WITH GOOGLE
                        </button>

                        <button
                          type="button"
                          disabled
                          className="w-full h-12 bg-black dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-black font-semibold rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-.79-3.12-1.53-1.59-1.43-1.35-3.53.34-4.66.84-.58 1.96-.82 3.35-.55.47.09 1.51.16 2.48.32.5.08.59.16.59.5 0 .53-.77.81-1.65.81-.73 0-1.55-.25-2.11-.25-.58 0-1.47.16-2.33.62-.79.42-1.16 1.28-1.16 2.25 0 1.59 1.75 2.99 3.5 2.99 2.02 0 2.97-1.28 3.25-1.96h-3.19c-.37.74-1.22 1.27-2.16 1.22zM12 3.5c.9 0 1.74-.09 2.47-.25.59-.13 1.13-.38 1.6-.79-.84-.66-1.54-1.44-1.54-2.46 0-1.03 1.08-1.67 2.54-1.67 1.05 0 2.14.37 2.66 1.12.63-.81 1.07-1.77 1.07-2.93 0-.79-.19-1.47-.53-2.06-1.07.12-2.09.56-2.83 1.29-.66.66-1.08 1.53-1.2 2.47h.06c.62 0 1.11-.28 1.47-.78.38-.53.58-1.22.58-2.01 0-.9-.46-1.67-1.19-2.15-.84-.56-2.04-.71-3.46-.62-1.09.07-2.07.4-2.7.96-.61.54-.96 1.28-.96 2.12 0 .83.43 1.53 1.09 1.96.72.47 1.67.66 2.66.56.84-.09 1.48-.47 1.79-1.08h-.06c-.22.37-.56.59-1.01.59-.61 0-1.02-.34-1.21-.85-.22-.59-.22-1.23-.05-1.75.21-.65.72-1.09 1.47-1.09.42 0 .82.14 1.15.4-.07-.5-.21-.98-.47-1.44-.58.06-1.08.27-1.5.65-.52.47-.78 1.13-.78 1.95 0 1.24.78 2.05 2.25 2.67 1.04.44 2.07.53 3.09.38.61-.09 1.12-.31 1.53-.66-.09-.58-.37-1.07-.84-1.45z" />
                          </svg>
                          CONTINUE WITH APPLE
                        </button>
                      </div>

                      <div className="text-center pt-2">
                        <span className="text-slate-500">Don't have an account? </span>
                        <button
                          type="button"
                          onClick={() => setMode("register")}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          CREATE NEW ACCOUNT
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {mode === "register" && (
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className={`w-full h-12 pl-11 pr-4 rounded-xl border ${
                              confirmPassword && password !== confirmPassword
                                ? "border-red-500"
                                : "border-slate-200 dark:border-slate-700"
                            } bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        disabled={!isRegisterValid || loading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CREATE ACCOUNT"}
                      </Button>

                      <div className="text-center pt-2">
                        <span className="text-slate-500">Already have an account? </span>
                        <button
                          type="button"
                          onClick={() => setMode("login")}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          SIGN IN
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {mode === "forgot-password" && (
                    <motion.form
                      key="forgot-password"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={!validateEmail(email) || loading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SEND RESET LINK"}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setMode("login")}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Back to Sign In
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={handleGuestBrowse}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-4"
                >
                  Browse as Guest
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </AnimatePresence>
  );
}