import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, DollarSign } from "lucide-react";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => Promise<void>;
  maxAmount: number;
  isLoading: boolean;
}

export function RefundModal({
  isOpen,
  onClose,
  onConfirm,
  maxAmount,
  isLoading
}: RefundModalProps) {
  const [amount, setAmount] = useState<string>(maxAmount.toString());
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    const refundAmount = parseFloat(amount);
    if (!isNaN(refundAmount) && refundAmount > 0 && refundAmount <= maxAmount) {
      onConfirm(refundAmount, reason);
    }
  };

  const isAmountValid = () => {
    const refundAmount = parseFloat(amount);
    return !isNaN(refundAmount) && refundAmount > 0 && refundAmount <= maxAmount;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Issue a refund to the customer for this dispute. The maximum refundable amount is ${maxAmount.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Refund Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
              />
            </div>
            {!isAmountValid() && amount !== "" && (
              <p className="text-xs text-destructive">
                Please enter a valid amount between $0.01 and ${maxAmount.toFixed(2)}.
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for Refund</Label>
            <Textarea
              id="reason"
              placeholder="E.g., Customer dissatisfied with service quality..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between flex-row-reverse">
          <Button
            onClick={handleConfirm}
            disabled={!isAmountValid() || !reason || isLoading}
          >
            {isLoading ? "Processing..." : "Confirm Refund"}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
