"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Plug, Globe, Save, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "general" | "fees" | "notifications" | "integrations" | "email";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "general", label: "General", icon: Globe },
  { key: "email", label: "Email & SMTP", icon: Mail },
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
    google_maps_api_key: "",
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_pass: "",
    smtp_from_email: ""
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
    <div className="h-full flex flex-col p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Platform Settings
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Configure global platform behavior and integrations.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Tab Menu */}
        <div className="w-64 shrink-0 bg-background border border-border shadow-sm rounded-xl p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <h3 className="px-4 pt-2 pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Settings Menu</h3>
          {TABS.map((t) => (
            <button 
              key={t.key} 
              onClick={() => setTab(t.key)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all relative overflow-hidden group",
                tab === t.key ? "bg-primary/10 text-primary shadow-sm border border-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent")}
            >
              {tab === t.key && (
                <motion.div layoutId="activeTabSettings" className="absolute left-0 w-1 h-1/2 bg-primary rounded-r-full top-1/4" />
              )}
              <t.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", tab === t.key ? "text-primary" : "text-muted-foreground")} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-background border border-border shadow-sm rounded-xl flex flex-col overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col">
              <div className="max-w-3xl flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {tab === "general" && (
                      <>
                        <div>
                          <h2 className="text-xl font-bold text-foreground tracking-tight">General Settings</h2>
                          <p className="text-sm font-medium text-muted-foreground mt-1">Platform-wide configuration details.</p>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="platformName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Platform Name</Label>
                            <input 
                              id="platformName" 
                              value={settings.platform_name} 
                              onChange={e => updateKey("platform_name", e.target.value)}
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="supportEmail" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Support Email</Label>
                            <input 
                              id="supportEmail" 
                              type="email"
                              value={settings.support_email} 
                              onChange={e => updateKey("support_email", e.target.value)}
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default Language</Label>
                              <select 
                                value={settings.default_language} 
                                onChange={e => updateKey("default_language", e.target.value)}
                                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none"
                              >
                                <option value="English">English</option>
                                <option value="Khmer">Khmer</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Timezone</Label>
                              <select 
                                value={settings.timezone} 
                                onChange={e => updateKey("timezone", e.target.value)}
                                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none"
                              >
                                <option value="Asia/Phnom_Penh (GMT+7)">Asia/Phnom_Penh (GMT+7)</option>
                                <option value="UTC">UTC</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {tab === "email" && (
                      <>
                        <div>
                          <h2 className="text-xl font-bold text-foreground tracking-tight">Email & SMTP Settings</h2>
                          <p className="text-sm font-medium text-muted-foreground mt-1">Configure global email dispatching parameters.</p>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="smtpHost" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SMTP Host</Label>
                              <input 
                                id="smtpHost" 
                                value={settings.smtp_host} 
                                onChange={e => updateKey("smtp_host", e.target.value)}
                                placeholder="e.g., smtp.resend.com"
                                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-mono" 
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="smtpPort" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SMTP Port</Label>
                              <input 
                                id="smtpPort" 
                                type="number"
                                value={settings.smtp_port} 
                                onChange={e => updateKey("smtp_port", e.target.value)}
                                placeholder="e.g., 465 or 587"
                                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-mono" 
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="smtpFromEmail" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default From Email</Label>
                            <input 
                              id="smtpFromEmail" 
                              type="email"
                              value={settings.smtp_from_email} 
                              onChange={e => updateKey("smtp_from_email", e.target.value)}
                              placeholder="noreply@servicefinder.com"
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="smtpUser" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SMTP User</Label>
                              <input 
                                id="smtpUser" 
                                value={settings.smtp_user} 
                                onChange={e => updateKey("smtp_user", e.target.value)}
                                placeholder="API Key or Username"
                                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-mono" 
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="smtpPass" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SMTP Password</Label>
                              <input 
                                id="smtpPass" 
                                type="password"
                                value={settings.smtp_pass} 
                                onChange={e => updateKey("smtp_pass", e.target.value)}
                                placeholder="••••••••••••••••"
                                className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-mono tracking-widest" 
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {tab === "fees" && (
                      <>
                        <div>
                          <h2 className="text-xl font-bold text-foreground tracking-tight">Platform Fees & Payments</h2>
                          <p className="text-sm font-medium text-muted-foreground mt-1">Adjust transaction commission and payout structures.</p>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="platformFee" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default Platform Fee (%)</Label>
                            <input 
                              id="platformFee" 
                              type="number"
                              value={settings.platform_fee_percent} 
                              onChange={e => updateKey("platform_fee_percent", Number(e.target.value))}
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                            />
                            <p className="text-xs font-medium text-muted-foreground">Commission percentage taken per completed booking.</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="minPayout" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Minimum Payout Amount ($)</Label>
                            <input 
                              id="minPayout" 
                              type="number"
                              value={settings.min_payout_amount} 
                              onChange={e => updateKey("min_payout_amount", Number(e.target.value))}
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payout Schedule</Label>
                            <select 
                              value={settings.payout_schedule} 
                              onChange={e => updateKey("payout_schedule", e.target.value)}
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none"
                            >
                              <option value="weekly">Weekly (every Monday)</option>
                              <option value="biweekly">Bi-weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {tab === "notifications" && (
                      <>
                        <div>
                          <h2 className="text-xl font-bold text-foreground tracking-tight">Notification Settings</h2>
                          <p className="text-sm font-medium text-muted-foreground mt-1">Control administrative push alerts.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-5 bg-background border border-border shadow-sm rounded-xl hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-foreground">New Booking Alert</p>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">Alert when a new booking is created.</p>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={settings.notify_new_booking} 
                              onChange={e => updateKey("notify_new_booking", e.target.checked)}
                              className="w-5 h-5 text-primary border-border rounded focus:ring-primary cursor-pointer bg-background"
                            />
                          </div>
                          <div className="flex items-center justify-between p-5 bg-background border border-border shadow-sm rounded-xl hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-foreground">Dispute Opened Alert</p>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">Alert when a customer files a new dispute.</p>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={settings.notify_dispute_opened} 
                              onChange={e => updateKey("notify_dispute_opened", e.target.checked)}
                              className="w-5 h-5 text-primary border-border rounded focus:ring-primary cursor-pointer bg-background"
                            />
                          </div>
                          <div className="flex items-center justify-between p-5 bg-background border border-border shadow-sm rounded-xl hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-foreground">Payout Failure Alert</p>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">Alert when a processed payout fails.</p>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={settings.notify_payout_failed} 
                              onChange={e => updateKey("notify_payout_failed", e.target.checked)}
                              className="w-5 h-5 text-primary border-border rounded focus:ring-primary cursor-pointer bg-background"
                            />
                          </div>
                          <div className="flex items-center justify-between p-5 bg-background border border-border shadow-sm rounded-xl hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-foreground">Low Staff Rating Alert</p>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">Alert when staff rating drops below 4.0 stars.</p>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={settings.notify_low_rating} 
                              onChange={e => updateKey("notify_low_rating", e.target.checked)}
                              className="w-5 h-5 text-primary border-border rounded focus:ring-primary cursor-pointer bg-background"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {tab === "integrations" && (
                      <>
                        <div>
                          <h2 className="text-xl font-bold text-foreground tracking-tight">Integrations & Credentials</h2>
                          <p className="text-sm font-medium text-muted-foreground mt-1">Configure global third-party APIs.</p>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="twilio" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Twilio Auth Token</Label>
                            <input 
                              id="twilio" 
                              type="password"
                              value={settings.twilio_auth_token} 
                              onChange={e => updateKey("twilio_auth_token", e.target.value)}
                              placeholder="••••••••••••••••"
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-mono tracking-widest" 
                            />
                            <p className="text-xs font-medium text-muted-foreground">Used for SMS dispatching and OTP validation.</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="stripe" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stripe Secret Key</Label>
                            <input 
                              id="stripe" 
                              type="password"
                              value={settings.stripe_secret_key} 
                              onChange={e => updateKey("stripe_secret_key", e.target.value)}
                              placeholder="••••••••••••••••"
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-mono tracking-widest" 
                            />
                            <p className="text-xs font-medium text-muted-foreground">Used for international credit card payments.</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="gmaps" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Google Maps API Key</Label>
                            <input 
                              id="gmaps" 
                              type="password"
                              value={settings.google_maps_api_key} 
                              onChange={e => updateKey("google_maps_api_key", e.target.value)}
                              placeholder="••••••••••••••••"
                              className="w-full h-11 px-4 bg-background border border-border rounded-lg text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-mono tracking-widest" 
                            />
                            <p className="text-xs font-medium text-muted-foreground">Used for distance calculations and map components.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-border mt-10 pt-6 max-w-3xl flex justify-end shrink-0">
                <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6 rounded-lg shadow-sm transition-all text-sm">
                  {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
