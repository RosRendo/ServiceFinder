"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        if (email) {
          // If we have an email but no token, we just show the "Check your email" screen
          setStatus("loading"); // We'll keep it loading or switch to a specific 'pending' state
          return;
        }
        setStatus("error");
        setErrorMessage("Verification token is missing.");
        return;
      }

      try {
        // In a real app, call your backend API to verify the token
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setStatus("success");
          toast.success("Email verified successfully!");
        } else {
          const data = await res.json();
          setStatus("error");
          setErrorMessage(data.message || "Invalid or expired verification token.");
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("An error occurred during verification. Please try again.");
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token, email]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address not found. Please log in again.");
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        toast.success("Verification email resent. Please check your inbox.");
      } else {
        toast.error("Failed to resend verification email.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  if (!token && email) {
    return (
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Check your email</CardTitle>
          <CardDescription className="pt-2 text-base">
            We've sent a verification link to <br/>
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground pb-6">
          <p>Please click the link in that email to verify your account and continue.</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Resend Verification Email
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/20">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4">
          {status === "loading" && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
          {status === "success" && <CheckCircle className="w-12 h-12 text-green-500" />}
          {status === "error" && <XCircle className="w-12 h-12 text-destructive" />}
        </div>
        <CardTitle className="text-2xl font-display">
          {status === "loading" && "Verifying Email"}
          {status === "success" && "Email Verified!"}
          {status === "error" && "Verification Failed"}
        </CardTitle>
        <CardDescription className="pt-2 text-base">
          {status === "loading" && "Please wait while we verify your email address..."}
          {status === "success" && "Your email has been successfully verified. You can now access all features of your account."}
          {status === "error" && errorMessage}
        </CardDescription>
      </CardHeader>
      
      <CardFooter className="flex flex-col gap-3 pt-4">
        {status === "success" && (
          <Button className="w-full" asChild>
            <Link href="/auth/login">
              Continue to Login <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
        
        {status === "error" && (
          <>
            <Button 
              className="w-full" 
              onClick={handleResend}
              disabled={isResending || !email}
            >
              {isResending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Resend Verification Link
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Suspense fallback={
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
