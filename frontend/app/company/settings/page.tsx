"use client";

import { useState } from "react";
import { Save, MapPin, Clock, Upload, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "profile" | "hours" | "bank" | "coverage";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Company Profile", icon: Building2 },
  { key: "hours", label: "Business Hours", icon: Clock },
  { key: "bank", label: "Bank Details", icon: Save },
  { key: "coverage", label: "Coverage Area", icon: MapPin },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function Input({ defaultValue, placeholder, type = "text" }: { defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <input type={type} defaultValue={defaultValue} placeholder={placeholder}
      className="w-full h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" />
  );
}

function FormField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-8 py-4 border-b border-border last:border-0">
      <div className="w-48 shrink-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function CompanySettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [hours, setHours] = useState(
    DAYS.reduce((acc, d) => ({ ...acc, [d]: { open: d !== "Sunday", from: "09:00", to: "18:00" } }), {} as Record<string, { open: boolean; from: string; to: string }>)
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left tabs */}
      <div className="w-52 shrink-0 border-r border-border bg-background p-3 space-y-0.5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors",
              tab === t.key ? "bg-violet-500/10 text-violet-400" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          {tab === "profile" && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">Company Profile</h2>
              <p className="text-sm text-muted-foreground mb-6">How your company appears to customers in the app.</p>

              {/* Logo upload */}
              <div className="mb-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">A</div>
                <div>
                  <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Upload Logo
                  </button>
                  <p className="text-xs text-muted-foreground mt-1.5">PNG or JPG, max 2MB</p>
                </div>
              </div>

              <FormField label="Company Name"><Input defaultValue="ABC Cleaning Co." /></FormField>
              <FormField label="Description" description="Tell customers what makes you special.">
                <textarea rows={3} defaultValue="Professional cleaning services in Phnom Penh with 5+ years of experience."
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 resize-none" />
              </FormField>
              <FormField label="Phone"><Input defaultValue="+855 12 345 678" type="tel" /></FormField>
              <FormField label="Email"><Input defaultValue="contact@abccleaning.com" type="email" /></FormField>
              <FormField label="Website"><Input defaultValue="https://abccleaning.com" type="url" /></FormField>
            </div>
          )}

          {tab === "hours" && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">Business Hours</h2>
              <p className="text-sm text-muted-foreground mb-6">Set when customers can book your services.</p>
              <div className="space-y-2">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-4 py-2 border-b border-border/50">
                    <button
                      onClick={() => setHours((h) => ({ ...h, [day]: { ...h[day], open: !h[day].open } }))}
                      className={cn("w-10 h-6 rounded-full transition-colors relative shrink-0",
                        hours[day].open ? "bg-violet-600" : "bg-muted-foreground/30")}>
                      <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                        hours[day].open && "translate-x-4")} />
                    </button>
                    <span className={cn("text-sm w-24 shrink-0", hours[day].open ? "text-foreground font-medium" : "text-muted-foreground")}>{day}</span>
                    {hours[day].open ? (
                      <div className="flex items-center gap-2">
                        <input type="time" defaultValue={hours[day].from}
                          className="h-8 px-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" />
                        <span className="text-muted-foreground text-sm">to</span>
                        <input type="time" defaultValue={hours[day].to}
                          className="h-8 px-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "bank" && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">Bank Details</h2>
              <p className="text-sm text-muted-foreground mb-6">Payouts will be sent to this account.</p>
              <FormField label="Account Name"><Input defaultValue="ABC Cleaning Co. Ltd." /></FormField>
              <FormField label="Bank Name">
                <select className="w-full h-9 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none">
                  <option>ABA Bank</option><option>ACLEDA Bank</option><option>Wing Bank</option><option>Canadia Bank</option>
                </select>
              </FormField>
              <FormField label="Account Number"><Input defaultValue="000123456789" /></FormField>
              <FormField label="ABA PayWay Merchant ID" description="Optional: For instant ABA payments."><Input placeholder="Enter Merchant ID" /></FormField>
            </div>
          )}

          {tab === "coverage" && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-1">Coverage Area</h2>
              <p className="text-sm text-muted-foreground mb-6">Define where your company operates.</p>
              <div className="h-72 bg-muted/50 rounded-2xl border border-border flex items-center justify-center mb-4">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Google Maps polygon editor</p>
                  <p className="text-xs text-muted-foreground mt-1">Draw your service area on the map</p>
                </div>
              </div>
              <FormField label="Max Radius (km)" description="Alternative to polygon: simple radius.">
                <div className="flex items-center gap-2">
                  <Input defaultValue="15" type="number" />
                  <span className="text-sm text-muted-foreground shrink-0">km from base</span>
                </div>
              </FormField>
            </div>
          )}

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
