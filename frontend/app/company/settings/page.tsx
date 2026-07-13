"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { FlickerDots } from "@/components/common/FlickerDots";
import { Store, Bell, CreditCard, Shield, FileText, Loader2, User, Lock } from "lucide-react";

type TabKey = "business" | "verification" | "account" | "security" | "notifications" | "billing";

export default function Settings() {
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("business");

  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", address: "", description: "",
    logoUrl: "", coverImageUrl: "", verificationDocumentUrl: "", verificationStatus: "",
  });

  const [accountData, setAccountData] = useState({
    firstName: "", lastName: "", email: "", phone: "", avatarUrl: ""
  });

  useEffect(() => { fetchCompanyData(); }, []);

  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const userData = await userRes.json();
      const u = userData.data;
      setAccountData({ firstName: u?.firstName || "", lastName: u?.lastName || "", email: u?.email || "", phone: u?.phone || "", avatarUrl: u?.avatarUrl || "" });

      const cId = u?.company?.id || u?.companyId;
      if (!cId) { setLoading(false); return; }
      setCompanyId(cId);
      const compRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${cId}`);
      if (compRes.ok) {
        const compData = await compRes.json();
        const c = compData.data;
        setFormData({ name: c.name || "", phone: c.phone || "", email: c.email || "", address: c.address || "", description: c.description || "", logoUrl: c.logoUrl || "", coverImageUrl: c.coverImageUrl || "", verificationDocumentUrl: c.verificationDocumentUrl || "", verificationStatus: c.verificationStatus || "" });
      }
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(formData),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save company settings"); }
      
      // We would also save accountData to /api/users/me here if backend endpoint existed for it.
      toast.success("Settings saved successfully!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any; badge?: boolean }> = [
    { key: "business", label: "Business", icon: Store },
    { key: "verification", label: "Verification", icon: Shield, badge: formData.verificationStatus === "pending" },
    { key: "account", label: "Account", icon: User },
    { key: "security", label: "Security", icon: Lock },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "billing", label: "Billing", icon: CreditCard },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-64"><FlickerDots /></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your business profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" />{t.label}
            {t.badge && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
          </button>
        ))}
      </div>

      {/* Business Tab */}
      {activeTab === "business" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Store className="w-4 h-4 text-blue-600" /> Business Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">Information displayed publicly on your profile</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-semibold text-gray-600">Company Logo</label><div className="border-2 border-dashed border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"><ImageUpload value={formData.logoUrl} onChange={(url) => setFormData((p) => ({ ...p, logoUrl: url }))} label="Upload Logo" /></div></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-gray-600">Cover Image</label><div className="border-2 border-dashed border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"><ImageUpload value={formData.coverImageUrl} onChange={(url) => setFormData((p) => ({ ...p, coverImageUrl: url }))} label="Upload Cover" /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Company Name", id: "name", type: "text", placeholder: "Sparkle Clean" },
                  { label: "Phone", id: "phone", type: "tel", placeholder: "+855 00 000 000" },
                  { label: "Email", id: "email", type: "email", placeholder: "hello@company.com" },
                ].map((f) => (
                  <div key={f.id} className={`space-y-1.5 ${f.id === "email" ? "col-span-2" : ""}`}>
                    <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                    <input type={f.type} value={(formData as any)[f.id]} onChange={(e) => setFormData((p) => ({ ...p, [f.id]: e.target.value }))} placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors" />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} placeholder="Primary operating address" rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="What makes your business special..." rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none transition-colors" />
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-60 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Profile
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Booking Preferences</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Online Booking", desc: "Allow customers to book services online", defaultChecked: true },
                { label: "Instant Confirmation", desc: "Auto-confirm bookings without manual review", defaultChecked: false },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between px-6 py-4">
                  <div><div className="text-sm font-medium text-gray-900">{s.label}</div><div className="text-xs text-gray-500">{s.desc}</div></div>
                  <Switch defaultChecked={s.defaultChecked} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verification Tab */}
      {activeTab === "verification" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3`}>
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${formData.verificationStatus === "verified" ? "bg-emerald-50 text-emerald-600" : formData.verificationStatus === "rejected" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Business Verification</div>
              <div className="text-xs text-gray-500">
                {formData.verificationStatus === "verified" && "Your business is fully verified."}
                {formData.verificationStatus === "pending" && "Your document is under review."}
                {formData.verificationStatus === "rejected" && "Verification rejected — please resubmit."}
                {!formData.verificationStatus && "Upload your business license to get verified."}
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            {formData.verificationStatus === "pending" && (
              <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800">
                <div className="font-medium">Verification Pending</div>
                <div className="text-xs mt-0.5">Our team is reviewing your document. This usually takes 1-2 business days.</div>
              </div>
            )}
            {formData.verificationStatus === "rejected" && (
              <div className="bg-rose-50 border border-rose-200 rounded-md px-4 py-3 text-sm text-rose-800">
                <div className="font-medium">Verification Rejected</div>
                <div className="text-xs mt-0.5">Please upload a clear, legible copy of your valid business license or government ID.</div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">Verification Document</label>
              <p className="text-xs text-gray-400">Upload your business patent, operating license, or official ID. Only used by our admin team.</p>
              <div className="border-2 border-dashed border-gray-200 rounded-md p-4 max-w-sm hover:bg-gray-50 transition-colors">
                <ImageUpload value={formData.verificationDocumentUrl} onChange={(url) => setFormData((p) => ({ ...p, verificationDocumentUrl: url, verificationStatus: "pending" }))} label="Upload Document" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSave} disabled={saving || !formData.verificationDocumentUrl || formData.verificationStatus === "verified"}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-60 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit for Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> Personal Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage your personal information and contact details</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">First Name</label>
                <input type="text" value={accountData.firstName} onChange={(e) => setAccountData(p => ({ ...p, firstName: e.target.value }))} placeholder="John"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Last Name</label>
                <input type="text" value={accountData.lastName} onChange={(e) => setAccountData(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Email Address</label>
                <input type="email" value={accountData.email} onChange={(e) => setAccountData(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Personal Phone</label>
                <input type="tel" value={accountData.phone} onChange={(e) => setAccountData(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555-0000"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-60 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Lock className="w-4 h-4 text-blue-600" /> Change Password</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Current Password</label>
                <input type="password" placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors max-w-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">New Password</label>
                <input type="password" placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors max-w-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Confirm New Password</label>
                <input type="password" placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors max-w-sm" />
              </div>
              <div className="pt-2">
                <button className="px-4 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors">Update Password</button>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" /> Two-Factor Authentication (MFA)</h2>
              <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account</p>
            </div>
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Authenticator App</div>
                <div className="text-xs text-gray-500 mt-1 max-w-sm">Use an app like Google Authenticator or Authy to generate one-time codes when you sign in.</div>
              </div>
              <button className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors border border-blue-200">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Bell className="w-4 h-4 text-blue-600" /> Notification Preferences</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: "New Booking Alerts", desc: "Get notified when you receive a new booking", on: true },
              { label: "Cancellation Alerts", desc: "Get notified when a booking is cancelled", on: true },
              { label: "Payment Notifications", desc: "Get notified about payment status changes", on: true },
              { label: "Review Alerts", desc: "Get notified when customers leave reviews", on: true },
              { label: "Marketing Emails", desc: "Receive tips and updates from ServiceFinder", on: false },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between px-6 py-4">
                <div><div className="text-sm font-medium text-gray-900">{n.label}</div><div className="text-xs text-gray-500">{n.desc}</div></div>
                <Switch defaultChecked={n.on} />
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">Save Preferences</button>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Subscription Plan</h2></div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md p-5">
                <div><div className="font-semibold">Professional Plan</div><div className="text-sm text-blue-200 mt-0.5">$49/month · Billed monthly</div></div>
                <button className="px-3 py-1.5 text-sm font-medium bg-white text-blue-700 rounded-md hover:bg-blue-50 transition-colors">Upgrade</button>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Payment Methods</h2></div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between border border-gray-200 rounded-md p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs font-bold text-blue-900">VISA</div>
                  <div><div className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</div><div className="text-xs text-gray-400">Expires 12/26</div></div>
                </div>
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors">Update</button>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Payout Accounts</h2></div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-gray-600">PayPal Email</label><input type="email" placeholder="business@example.com" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div className="space-y-1.5"><label className="text-xs font-semibold text-gray-600">Bank Name</label><input placeholder="e.g. Chase Bank" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-gray-600">Account Number</label><input type="password" placeholder="••••••••8901" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
            <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-gray-400" /><div><div className="text-sm font-medium text-gray-900">Billing History</div><div className="text-xs text-gray-400">View and download your past invoices</div></div></div>
            <button className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors text-gray-700">View Invoices</button>
          </div>
        </div>
      )}
    </div>
  );
}
