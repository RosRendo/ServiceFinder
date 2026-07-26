"use client";

import { useState } from "react";
import { Settings, Bell, Shield, Plug, Layers, Globe, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "general" | "services" | "fees" | "security" | "notifications" | "integrations";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "general", label: "General", icon: Globe },
  { key: "services", label: "Service Categories", icon: Layers },
  { key: "fees", label: "Platform Fees", icon: Settings },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "integrations", label: "Integrations", icon: Plug },
];

function FormField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8 py-4 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0 w-64">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={cn("w-11 h-6 rounded-full transition-colors relative", checked ? "bg-violet-600" : "bg-muted-foreground/30")}>
      <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm", checked && "translate-x-5")} />
    </button>
  );
}

function Input({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return <input defaultValue={defaultValue} placeholder={placeholder}
    className="w-full h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" />;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [notifs, setNotifs] = useState({ newBooking: true, dispute: true, payout: false, lowRating: true });

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Tab Menu */}
      <div className="w-56 shrink-0 border-r border-border bg-background p-3 space-y-0.5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors",
              tab === t.key ? "bg-violet-500/10 text-violet-400" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          {tab === "general" && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">General Settings</h2>
              <p className="text-sm text-muted-foreground mb-6">Platform-wide configuration.</p>
              <FormField label="Platform Name" description="Displayed in the mobile app and emails.">
                <Input defaultValue="ServiceFinder" />
              </FormField>
              <FormField label="Support Email" description="Customers contact this address for help.">
                <Input defaultValue="support@servicefinder.app" />
              </FormField>
              <FormField label="Default Language">
                <select className="w-full h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none">
                  <option>English</option><option>Khmer</option>
                </select>
              </FormField>
              <FormField label="Timezone">
                <select className="w-full h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none">
                  <option>Asia/Phnom_Penh (GMT+7)</option><option>UTC</option>
                </select>
              </FormField>
            </div>
          )}

          {tab === "fees" && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">Platform Fees</h2>
              <p className="text-sm text-muted-foreground mb-6">Global defaults. Company-specific fees override these.</p>
              <FormField label="Default Platform Fee" description="% commission taken per completed booking.">
                <div className="flex items-center gap-2">
                  <Input defaultValue="15" />
                  <span className="text-sm text-muted-foreground shrink-0">%</span>
                </div>
              </FormField>
              <FormField label="Minimum Payout Amount" description="Minimum balance before we send a payout.">
                <div className="flex items-center gap-2">
                  <Input defaultValue="10" />
                  <span className="text-sm text-muted-foreground shrink-0">USD</span>
                </div>
              </FormField>
              <FormField label="Payout Schedule">
                <select className="w-full h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none">
                  <option>Weekly (every Monday)</option><option>Bi-weekly</option><option>Monthly</option>
                </select>
              </FormField>
            </div>
          )}

          {tab === "notifications" && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">Notification Settings</h2>
              <p className="text-sm text-muted-foreground mb-6">Control which events trigger admin alerts.</p>
              <FormField label="New Booking" description="Alert when a new booking is created.">
                <Toggle checked={notifs.newBooking} onChange={() => setNotifs((n) => ({ ...n, newBooking: !n.newBooking }))} />
              </FormField>
              <FormField label="Dispute Opened" description="Alert when a customer opens a dispute.">
                <Toggle checked={notifs.dispute} onChange={() => setNotifs((n) => ({ ...n, dispute: !n.dispute }))} />
              </FormField>
              <FormField label="Payout Failed" description="Alert when a payout attempt fails.">
                <Toggle checked={notifs.payout} onChange={() => setNotifs((n) => ({ ...n, payout: !n.payout }))} />
              </FormField>
              <FormField label="Low Staff Rating" description="Alert when staff drops below 4.0 stars.">
                <Toggle checked={notifs.lowRating} onChange={() => setNotifs((n) => ({ ...n, lowRating: !n.lowRating }))} />
              </FormField>
            </div>
          )}

          {tab === "integrations" && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">Integrations</h2>
              <p className="text-sm text-muted-foreground mb-6">Connect your third-party services.</p>
              {[
                { name: "Twilio (SMS)", desc: "OTP and booking notifications via SMS.", key: "TWILIO_AUTH_TOKEN" },
                { name: "ABA PayWay", desc: "Cambodia payment gateway.", key: "ABA_API_KEY" },
                { name: "Stripe", desc: "International payment processing.", key: "STRIPE_SECRET_KEY" },
                { name: "Google Maps", desc: "Dispatch map and geocoding.", key: "GOOGLE_MAPS_API_KEY" },
                { name: "Sentry", desc: "Error monitoring.", key: "SENTRY_DSN" },
              ].map((intg) => (
                <FormField key={intg.name} label={intg.name} description={intg.desc}>
                  <input type="password" placeholder={`Enter ${intg.key}`}
                    className="w-full h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 font-mono" />
                </FormField>
              ))}
            </div>
          )}

          {(tab === "security" || tab === "services") && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                <Settings className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
          )}

          {/* Save button */}
          <div className="mt-8">
            <button className="flex items-center gap-2 h-10 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
