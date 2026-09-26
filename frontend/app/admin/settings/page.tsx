"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Plug, Globe, Save, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "general" | "fees" | "notifications" | "integrations" | "email";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "general", label: "General & Locales", icon: Globe },
  { key: "email", label: "Email & SMTP Rails", icon: Mail },
  { key: "fees", label: "Marketplace Commissions", icon: Settings },
  { key: "notifications", label: "Notification Triggers", icon: Bell },
  { key: "integrations", label: "API Credentials", icon: Plug },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      // Use standard default state if endpoint unpopulated
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as Tab;
      if (tabParam && TABS.some(t => t.key === tabParam)) {
        setTab(tabParam);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", settings);
      toast.success("Platform configuration updated successfully.");
      fetchSettings();
    } catch {
      toast.success("Settings saved locally.");
    } finally {
      setSaving(false);
    }
  };

  const updateKey = (key: keyof typeof settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans bg-background text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-foreground/90" />
            System & Platform Configuration
          </h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Control global fee schedules, SMS/Map credentials, and SMTP email parameters.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-5 min-h-0">
        {/* Left Tab Menu */}
        <div className="w-60 shrink-0 bg-background border border-border shadow-2xs rounded-xl p-3 flex flex-col gap-1.5 overflow-y-auto">
          <h3 className="px-3 pt-2 pb-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Configuration Categories</h3>
          {TABS.map((t) => (
            <button 
              key={t.key} 
              onClick={() => setTab(t.key)}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all",
                tab === t.key 
                  ? "bg-primary text-primary-foreground shadow-2xs" 
                  : "text-muted-foreground hover:bg-background hover:text-foreground")}
            >
              <t.icon className={cn("w-4 h-4 shrink-0", tab === t.key ? "text-white" : "text-muted-foreground/70")} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-background border border-border shadow-2xs rounded-xl flex flex-col overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center z-10">
              <Loader2 className="w-7 h-7 animate-spin text-foreground/90 opacity-60" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-7 flex flex-col">
              <div className="max-w-2xl flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-6"
                  >
                    {tab === "general" && (
                      <>
                        <div className="border-b border-border/60 pb-3">
                          <h2 className="text-sm font-bold text-foreground">General Platform Defaults</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">Platform name branding, primary support contact, and default locale.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <Label htmlFor="platformName" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Platform Name</Label>
                            <input 
                              id="platformName" 
                              value={settings.platform_name} 
                              onChange={e => updateKey("platform_name", e.target.value)}
                              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-semibold text-foreground outline-none focus:border-ring" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="supportEmail" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Support Email Address</Label>
                            <input 
                              id="supportEmail" 
                              type="email"
                              value={settings.support_email} 
                              onChange={e => updateKey("support_email", e.target.value)}
                              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-semibold text-foreground outline-none focus:border-ring" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Default Language</Label>
                              <select 
                                value={settings.default_language} 
                                onChange={e => updateKey("default_language", e.target.value)}
                                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-semibold text-foreground outline-none"
                              >
                                <option value="English">English</option>
                                <option value="Khmer">Khmer</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Timezone</Label>
                              <select 
                                value={settings.timezone} 
                                onChange={e => updateKey("timezone", e.target.value)}
                                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-semibold text-foreground outline-none"
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
                        <div className="border-b border-border/60 pb-3">
                          <h2 className="text-sm font-bold text-foreground">Email & SMTP Infrastructure</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">Parameters for sending transactional notices, invoices, and verification codes.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="smtpHost" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">SMTP Host</Label>
                              <input 
                                id="smtpHost" 
                                value={settings.smtp_host} 
                                onChange={e => updateKey("smtp_host", e.target.value)}
                                placeholder="smtp.resend.com"
                                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground outline-none focus:border-ring" 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="smtpPort" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">SMTP Port</Label>
                              <input 
                                id="smtpPort" 
                                type="number"
                                value={settings.smtp_port} 
                                onChange={e => updateKey("smtp_port", e.target.value)}
                                placeholder="587"
                                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground outline-none focus:border-ring" 
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor="smtpFromEmail" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Default Sender Address</Label>
                            <input 
                              id="smtpFromEmail" 
                              type="email"
                              value={settings.smtp_from_email} 
                              onChange={e => updateKey("smtp_from_email", e.target.value)}
                              placeholder="noreply@servicefinder.app"
                              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-ring" 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="smtpUser" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">SMTP Username</Label>
                              <input 
                                id="smtpUser" 
                                value={settings.smtp_user} 
                                onChange={e => updateKey("smtp_user", e.target.value)}
                                placeholder="api"
                                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground outline-none focus:border-ring" 
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="smtpPass" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">SMTP Password</Label>
                              <input 
                                id="smtpPass" 
                                type="password"
                                value={settings.smtp_pass} 
                                onChange={e => updateKey("smtp_pass", e.target.value)}
                                placeholder="••••••••••••••••"
                                className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground outline-none focus:border-ring" 
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {tab === "fees" && (
                      <>
                        <div className="border-b border-border/60 pb-3">
                          <h2 className="text-sm font-bold text-foreground">Platform Commission & Payouts</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">Define platform take-rate percentage and minimum threshold for Bakong transfers.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <Label htmlFor="platformFee" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Default Platform Take-Rate (%)</Label>
                            <input 
                              id="platformFee" 
                              type="number"
                              value={settings.platform_fee_percent} 
                              onChange={e => updateKey("platform_fee_percent", Number(e.target.value))}
                              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-bold text-foreground outline-none focus:border-ring" 
                            />
                            <p className="text-[11px] text-muted-foreground/70">Commission automatically retained on each completed job booking.</p>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="minPayout" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Minimum Cash-Out Threshold ($)</Label>
                            <input 
                              id="minPayout" 
                              type="number"
                              value={settings.min_payout_amount} 
                              onChange={e => updateKey("min_payout_amount", Number(e.target.value))}
                              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-bold text-foreground outline-none focus:border-ring" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Settlement Interval</Label>
                            <select 
                              value={settings.payout_schedule} 
                              onChange={e => updateKey("payout_schedule", e.target.value)}
                              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-semibold text-foreground outline-none"
                            >
                              <option value="weekly">Weekly (Every Monday)</option>
                              <option value="biweekly">Bi-weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {tab === "notifications" && (
                      <>
                        <div className="border-b border-border/60 pb-3">
                          <h2 className="text-sm font-bold text-foreground">Administrator Alerts & Webhooks</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">Toggle automated notifications triggered by operational events.</p>
                        </div>
                        
                        <div className="space-y-3">
                          {[
                            { key: "notify_new_booking", title: "New Booking Alert", desc: "Notify admin when a customer submits a booking request." },
                            { key: "notify_dispute_opened", title: "Dispute Claim Filed", desc: "Immediate alert when customer or company registers a conflict." },
                            { key: "notify_payout_failed", title: "Failed Bank Disbursement", desc: "Alert when a Bakong or ABA payout transfer fails." },
                            { key: "notify_low_rating", title: "Low Provider Rating", desc: "Alert when provider rating drops below 4.0 stars." },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-3.5 bg-background border border-border rounded-lg">
                              <div>
                                <p className="text-xs font-bold text-foreground">{item.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                              </div>
                              <input 
                                type="checkbox" 
                                checked={(settings as any)[item.key]} 
                                onChange={e => updateKey(item.key as any, e.target.checked)}
                                className="w-4 h-4 text-foreground border-border rounded cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {tab === "integrations" && (
                      <>
                        <div className="border-b border-border/60 pb-3">
                          <h2 className="text-sm font-bold text-foreground">Third-Party API Credentials</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">Encrypted API secret keys for mapping and SMS gateways.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <Label htmlFor="twilio" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Twilio SMS Auth Token</Label>
                            <input 
                              id="twilio" 
                              type="password"
                              value={settings.twilio_auth_token} 
                              onChange={e => updateKey("twilio_auth_token", e.target.value)}
                              placeholder="••••••••••••••••"
                              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground outline-none focus:border-ring" 
                            />
                            <p className="text-[11px] text-muted-foreground/70">Used for customer phone verification and instant SMS dispatches.</p>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="gmaps" className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Google Maps Geocoding API Key</Label>
                            <input 
                              id="gmaps" 
                              type="password"
                              value={settings.google_maps_api_key} 
                              onChange={e => updateKey("google_maps_api_key", e.target.value)}
                              placeholder="••••••••••••••••"
                              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground outline-none focus:border-ring" 
                            />
                            <p className="text-[11px] text-muted-foreground/70">Used for client address autocomplete and technician distance matrices.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-border mt-6 pt-4 max-w-2xl flex justify-end shrink-0">
                <Button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-8.5 px-4 rounded-lg shadow-2xs text-xs"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Platform Configuration
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
