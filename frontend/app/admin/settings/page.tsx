"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Bell, Lock, Shield, User, DollarSign, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuthContext } from "@/lib/contexts/AuthContext";

type TabKey = "profile" | "notifications" | "security" | "finance";

export default function AdminSettingsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [notifications, setNotifications] = useState({ emailBookings: true, emailNewCompanies: true, weeklyReport: true });

  const [finance, setFinance] = useState({ platformFee: 10, companySplit: 31, staffDebtLimit: -50, companyDebtLimit: -200 });
  const [financeLoading, setFinanceLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({ fullName: user.fullName || "", email: user.email || "", phone: (user as any).phone || "" });
  }, [user]);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFinance({ platformFee: Number(data.PLATFORM_FEE_PERCENT) || 10, companySplit: Number(data.COMPANY_SPLIT_PERCENT) || 31, staffDebtLimit: Number(data.STAFF_DEBT_LIMIT) || -50, companyDebtLimit: Number(data.COMPANY_DEBT_LIMIT) || -200 });
      }
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.ok) toast.success("Profile updated!"); else toast.error(data.error || "Failed to update");
    } catch { toast.error("Something went wrong"); }
    finally { setProfileLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (passwords.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ password: passwords.newPassword }),
      });
      if (res.ok) { toast.success("Password updated!"); setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
      else { const d = await res.json(); toast.error(d.error || "Failed"); }
    } catch { toast.error("Something went wrong"); }
    finally { setPasswordLoading(false); }
  };

  const handleSaveFinance = async () => {
    setFinanceLoading(true);
    try {
      const token = localStorage.getItem("token");
      const staffSplit = 100 - finance.platformFee - finance.companySplit;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ PLATFORM_FEE_PERCENT: finance.platformFee.toString(), COMPANY_SPLIT_PERCENT: finance.companySplit.toString(), STAFF_SPLIT_PERCENT: staffSplit.toString(), STAFF_DEBT_LIMIT: finance.staffDebtLimit.toString(), COMPANY_DEBT_LIMIT: finance.companyDebtLimit.toString() }),
      });
      if (res.ok) toast.success("Finance settings saved!"); else toast.error("Failed to save");
    } catch { toast.error("Something went wrong"); }
    finally { setFinanceLoading(false); }
  };

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "security", label: "Security", icon: Lock },
    { key: "finance", label: "Finance & Limits", icon: DollarSign },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and platform preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-indigo-600" /> Admin Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">Update your name, email and contact details</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold shrink-0">
                {profile.fullName?.charAt(0) || "A"}
              </div>
              <div>
                <div className="font-medium text-gray-900">{profile.fullName || "Admin"}</div>
                <div className="text-xs text-gray-500">{profile.email}</div>
                <span className="inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-900 text-white">Platform Administrator</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "fullName", type: "text", placeholder: "Your full name" },
                { label: "Email", key: "email", type: "email", placeholder: "admin@example.com" },
                { label: "Phone", key: "phone", type: "tel", placeholder: "+855 00 000 000" },
              ].map((f) => (
                <div key={f.key} className={`space-y-1.5 ${f.key === "phone" ? "col-span-2" : ""}`}>
                  <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                  <input type={f.type} value={(profile as any)[f.key]} onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors" />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSaveProfile} disabled={profileLoading} className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-60 flex items-center gap-2">
                {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600" /> Email Notifications</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { key: "emailBookings", label: "New Bookings", desc: "Get notified when a new booking is made" },
              { key: "emailNewCompanies", label: "New Company Applications", desc: "Get notified when a company registers" },
              { key: "weeklyReport", label: "Weekly Report", desc: "Receive a weekly summary of platform activity" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">{n.label}</div>
                  <div className="text-xs text-gray-500">{n.desc}</div>
                </div>
                <Switch checked={(notifications as any)[n.key]} onCheckedChange={(c) => setNotifications((p) => ({ ...p, [n.key]: c }))} />
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button onClick={() => toast.success("Preferences saved!")} className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">Save Preferences</button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Lock className="w-4 h-4 text-rose-600" /> Change Password</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: "Current Password", key: "currentPassword" },
                { label: "New Password", key: "newPassword" },
                { label: "Confirm Password", key: "confirmPassword" },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                  <input type="password" value={(passwords as any)[f.key]} onChange={(e) => setPasswords((p) => ({ ...p, [f.key]: e.target.value }))} placeholder="••••••••"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 focus:bg-white transition-colors" />
                </div>
              ))}
              {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                <p className="text-xs font-medium text-rose-600 bg-rose-50 px-3 py-2 rounded-md border border-rose-200">Passwords do not match</p>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={handleChangePassword} disabled={passwordLoading || !passwords.newPassword} className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors disabled:opacity-60 flex items-center gap-2">
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Update Password
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" /> Two-Factor Authentication</div>
              <div className="text-xs text-gray-500 mt-0.5">Add extra security to your admin account</div>
            </div>
            <button onClick={() => toast.info("2FA setup coming soon")} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors">Setup 2FA</button>
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === "finance" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="w-4 h-4 text-indigo-600" /> Finance & Limits</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage platform fees, split percentages, and debt limits</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Platform Fee %", key: "platformFee" },
                { label: "Company Split %", key: "companySplit" },
                { label: "Staff Debt Limit ($)", key: "staffDebtLimit" },
                { label: "Company Debt Limit ($)", key: "companyDebtLimit" },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                  <input type="number" value={(finance as any)[f.key]} onChange={(e) => setFinance((p) => ({ ...p, [f.key]: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Staff Split % (auto-calculated)</div>
              <div className="text-lg font-bold text-gray-900">{100 - finance.platformFee - finance.companySplit}%</div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSaveFinance} disabled={financeLoading} className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-60 flex items-center gap-2">
                {financeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
