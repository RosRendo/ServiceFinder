"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Plug, Globe, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Tab = "general" | "fees" | "notifications" | "integrations";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "general", label: "General", icon: Globe },
  { key: "fees", label: "Platform Fees", icon: Settings },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "integrations", label: "Integrations", icon: Plug },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    platform_name: "ServiceFinder",
    support_email: "support@servicefinder.app",
    default_language: "English",
    timezone: "Asia/Phnom_Penh (GMT+7)",
    platform_fee_percent: 15,
    min_payout_amount: 10,
    payout_schedule: "weekly",
    notify_new_booking: true,
    notify_dispute_opened: true,
    notify_payout_failed: false,
    notify_low_rating: true,
    twilio_auth_token: "",
    stripe_secret_key: "",
    google_maps_api_key: ""
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings");
      const data = res.data;
      if (data && typeof data === "object") {
        setSettings((prev) => ({
          ...prev,
          ...data,
          // Handle conversions from backend formats if needed
          platform_fee_percent: data.platform_fee_percent !== undefined ? Number(data.platform_fee_percent) : prev.platform_fee_percent,
          min_payout_amount: data.min_payout_amount !== undefined ? Number(data.min_payout_amount) : prev.min_payout_amount,
          notify_new_booking: data.notify_new_booking === "true" || data.notify_new_booking === true,
          notify_dispute_opened: data.notify_dispute_opened === "true" || data.notify_dispute_opened === true,
          notify_payout_failed: data.notify_payout_failed === "true" || data.notify_payout_failed === true,
          notify_low_rating: data.notify_low_rating === "true" || data.notify_low_rating === true,
        }));
      }
    } catch {
      toast({ title: "Error", description: "Failed to load system settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", settings);
      toast({ title: "Success", description: "System settings saved successfully" });
      fetchSettings();
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateKey = (key: keyof typeof settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex h-full overflow-hidden p-6 gap-6">
      {/* Left Tab Menu */}
      <div className="w-56 shrink-0 border border-border bg-card rounded-xl p-3 flex flex-col gap-1">
        <h3 className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Settings</h3>
        {TABS.map((t) => (
          <button 
            key={t.key} 
            onClick={() => setTab(t.key)}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-colors",
              tab === t.key ? "bg-violet-500/10 text-violet-500" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Right Content */}
      <div className="flex-1 border border-border bg-card rounded-xl flex flex-col overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col">
            <div className="max-w-2xl flex-1">
              {tab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">General Settings</h2>
                    <p className="text-sm text-muted-foreground">Platform-wide configuration details.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="platformName">Platform Name</Label>
                      <input 
                        id="platformName" 
                        value={settings.platform_name} 
                        onChange={e => updateKey("platform_name", e.target.value)}
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <input 
                        id="supportEmail" 
                        type="email"
                        value={settings.support_email} 
                        onChange={e => updateKey("support_email", e.target.value)}
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label>Default Language</Label>
                        <select 
                          value={settings.default_language} 
                          onChange={e => updateKey("default_language", e.target.value)}
                          className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none"
                        >
                          <option value="English">English</option>
                          <option value="Khmer">Khmer</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Timezone</Label>
                        <select 
                          value={settings.timezone} 
                          onChange={e => updateKey("timezone", e.target.value)}
                          className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none"
                        >
                          <option value="Asia/Phnom_Penh (GMT+7)">Asia/Phnom_Penh (GMT+7)</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "fees" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Platform Fees & Payments</h2>
                    <p className="text-sm text-muted-foreground">Adjust transaction commission and payout structures.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="platformFee">Default Platform Fee (%)</Label>
                      <input 
                        id="platformFee" 
                        type="number"
                        value={settings.platform_fee_percent} 
                        onChange={e => updateKey("platform_fee_percent", Number(e.target.value))}
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" 
                      />
                      <p className="text-xs text-muted-foreground">Commission percentage taken per completed booking.</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="minPayout">Minimum Payout Amount ($)</Label>
                      <input 
                        id="minPayout" 
                        type="number"
                        value={settings.min_payout_amount} 
                        onChange={e => updateKey("min_payout_amount", Number(e.target.value))}
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Payout Schedule</Label>
                      <select 
                        value={settings.payout_schedule} 
                        onChange={e => updateKey("payout_schedule", e.target.value)}
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none"
                      >
                        <option value="weekly">Weekly (every Monday)</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {tab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Notification Settings</h2>
                    <p className="text-sm text-muted-foreground">Control administrative push alerts.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-foreground">New Booking Alert</p>
                        <p className="text-xs text-muted-foreground">Alert when a new booking is created.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notify_new_booking} 
                        onChange={e => updateKey("notify_new_booking", e.target.checked)}
                        className="w-4 h-4 text-violet-600 border-border rounded focus:ring-violet-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Dispute Opened Alert</p>
                        <p className="text-xs text-muted-foreground">Alert when a customer files a new dispute.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notify_dispute_opened} 
                        onChange={e => updateKey("notify_dispute_opened", e.target.checked)}
                        className="w-4 h-4 text-violet-600 border-border rounded focus:ring-violet-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Payout Failure Alert</p>
                        <p className="text-xs text-muted-foreground">Alert when a processed payout fails.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notify_payout_failed} 
                        onChange={e => updateKey("notify_payout_failed", e.target.checked)}
                        className="w-4 h-4 text-violet-600 border-border rounded focus:ring-violet-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Low Staff Rating Alert</p>
                        <p className="text-xs text-muted-foreground">Alert when staff rating drops below 4.0 stars.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notify_low_rating} 
                        onChange={e => updateKey("notify_low_rating", e.target.checked)}
                        className="w-4 h-4 text-violet-600 border-border rounded focus:ring-violet-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {tab === "integrations" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Integrations & Credentials</h2>
                    <p className="text-sm text-muted-foreground">Configure global third-party APIs.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="twilio">Twilio Auth Token</Label>
                      <input 
                        id="twilio" 
                        type="password"
                        value={settings.twilio_auth_token} 
                        onChange={e => updateKey("twilio_auth_token", e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 font-mono" 
                      />
                      <p className="text-xs text-muted-foreground">Used for SMS dispatching and OTP validation.</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="stripe">Stripe Secret Key</Label>
                      <input 
                        id="stripe" 
                        type="password"
                        value={settings.stripe_secret_key} 
                        onChange={e => updateKey("stripe_secret_key", e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 font-mono" 
                      />
                      <p className="text-xs text-muted-foreground">Used for international credit card payments.</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="gmaps">Google Maps API Key</Label>
                      <input 
                        id="gmaps" 
                        type="password"
                        value={settings.google_maps_api_key} 
                        onChange={e => updateKey("google_maps_api_key", e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 font-mono" 
                      />
                      <p className="text-xs text-muted-foreground">Used for distance calculations and map components.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-border mt-8 pt-4 max-w-2xl flex justify-end shrink-0">
              <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
