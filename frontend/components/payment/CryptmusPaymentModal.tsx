"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Clock, Check } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

interface CryptmusPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
}

export function CryptmusPaymentModal({
  isOpen,
  onClose,
  paymentUrl,
  paymentId,
  amount,
  currency = "USD",
}: CryptmusPaymentModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Payment URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cryptmus Payment</DialogTitle>
          <DialogDescription>
            Complete your payment securely with cryptocurrency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-3xl font-bold">
              {amount ? Number(amount).toFixed(2) : "0.00"} {currency}
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Payment expires in:{" "}
              <span className="font-bold">{formatTime(timeLeft)}</span>
            </p>
          </div>

          {/* Payment ID */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment ID</p>
            <div className="flex gap-2">
              <code className="flex-1 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm font-mono break-all">
                {paymentId}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="Copy payment ID"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full gap-2"
              onClick={() => {
                if (paymentUrl) {
                  window.open(paymentUrl, "_blank");
                }
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Open Payment Page
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                copyToClipboard();
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Payment Link
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You will be redirected automatically after payment is confirmed
            </p>
          </div>

          {/* Notes */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>✓ Support 500+ cryptocurrencies</p>
              <p>✓ Secure instant payment</p>
              <p>✓ Auto-converted to your preferred currency</p>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
