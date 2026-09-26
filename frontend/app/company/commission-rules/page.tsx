"use client";
import { useState } from "react";
import { Percent, ShieldCheck, DollarSign, Save, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";

interface SplitRule {
  id: string;
  category: string;
  staffSplit: number;
}

export default function CommissionRulesPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<SplitRule[]>([
    { id: "hvac", category: "HVAC & Aircon Services", staffSplit: 60 },
    { id: "cleaning", category: "Deep Cleaning & Maid Services", staffSplit: 50 },
    { id: "electrical", category: "Electrical & Plumbing Repairs", staffSplit: 55 },
    { id: "handyman", category: "General Handyman & Assembly", staffSplit: 50 },
  ]);

  const handleSplitChange = (id: string, value: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, staffSplit: value } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast({
      title: "Settings Saved",
      description: "Commission splits and pay rules updated successfully."
    });
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 font-sans bg-muted/10">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Percent className="w-5 h-5 text-violet-500" /> Commission Rules & Pay Splits
          </h1>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">Configure staff splits and platform fee offsets</p>
        </div>
        <Button 
          disabled={saving}
          onClick={handleSave}
          className="rounded-xl h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Splits
        </Button>
      </div>

      {/* Info Warning */}
      <div className="flex gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-800">
        <Info className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider">How splits are processed</h3>
          <p className="text-xs leading-relaxed mt-1 opacity-90">
            For each booking completed by a staff member, the system first subtracts the standard 10% ServiceFinder platform fee. 
            The remaining 90% is divided between the Company and the Staff member using the split sliders below. Worker splits are deposited atomically into their staff wallets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Category Sliders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-background border border-border rounded-xl p-5 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-foreground">Worker Splits by Category</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Determine the percentage of net booking revenue allocated directly to your workers.</p>
            </div>

            <div className="space-y-6">
              {rules.map((rule) => {
                // Interactive simulation math
                const mockPrice = 100;
                const platformFee = mockPrice * 0.1;
                const netRevenue = mockPrice - platformFee;
                const staffEarning = netRevenue * (rule.staffSplit / 100);
                const companyEarning = netRevenue - staffEarning;

                return (
                  <div key={rule.id} className="p-4 bg-muted/20 border border-border/80 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">{rule.category}</span>
                      <span className="text-sm font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                        {rule.staffSplit}% Staff
                      </span>
                    </div>

                    {/* Slider */}
                    <input 
                      type="range" 
                      min="20" 
                      max="90" 
                      value={rule.staffSplit} 
                      onChange={(e) => handleSplitChange(rule.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                    />

                    {/* Interactive breakdown simulation */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <div>
                        <p className="text-[9px]">Sample Booking</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">$100.00</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-emerald-600">Company Share</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">${companyEarning.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-indigo-600">Staff Split</p>
                        <p className="text-sm font-bold text-indigo-600 mt-0.5">${staffEarning.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Platform Commission Overview */}
        <div className="space-y-4">
          <div className="bg-background border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Platform Commission</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Fixed platform cost metrics.</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-background border border-border/60 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-muted-foreground flex items-center justify-center text-background shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground leading-none">10.0% Flat Rate</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Standard Marketplace Fee</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed p-2 bg-muted/20 rounded-lg">
              The marketplace platform fee covers payment gateways checkout (ABA, KHQR PayWay), server maintenance, coordinates sync, routing APIs, and automated SMS alerts.
            </div>

            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              No Hidden Charges
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
