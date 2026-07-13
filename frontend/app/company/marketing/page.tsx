"use client";

import { useState, useEffect } from "react";
import {
  Megaphone, Tag, Star, TrendingUp, Share2, Eye, MousePointerClick, Gift, Plus, Copy,
  CheckCircle2, Zap, ArrowUpRight, Calendar, Percent, Users, MessageSquare, Receipt,
  MoreVertical, RefreshCcw, Edit, Trash2, ExternalLink, CopyCheck, Rocket, Lightbulb,
  Target, ChartBar, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api/client";

type Campaign = {
  id: string;
  name: string;
  discount: string;
  code: string;
  uses: number;
  maxUses: number | null;
  expires: string;
  status: "active" | "paused" | "expired";
  revenue: number;
  conversions: number;
};

const tips = [
  { icon: Share2, title: "Share your profile link", body: "Post your booking page on Facebook or Telegram groups to get more visibility." },
  { icon: Star, title: "Chase reviews", body: "Send a follow-up message after each completed job asking for a 5-star review." },
  { icon: Zap, title: "Respond within 5 min", body: "Platforms rank faster-responding companies higher in search results." },
  { icon: TrendingUp, title: "Enable seasonal promos", body: "Set limited-time codes before public holidays to spike your bookings." },
];

export default function CompanyMarketing() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCode, setNewCode] = useState({ code: "", discount: "", expiry: "", maxUses: "" });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/companies/my-company/campaigns');
      const data = res.data?.data || res.data || [];
      const mapped = data.map((c: any) => ({
        id: c.id,
        name: c.name || "Promo",
        discount: c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`,
        code: c.code,
        uses: c.uses || 0,
        maxUses: c.maxUses || null,
        expires: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : "No expiry",
        status: c.status || "active",
        revenue: c.revenue || 0,
        conversions: c.conversions || 0,
      }));
      setCampaigns(mapped);
    } catch (error) {
      console.error("Failed to load campaigns", error);
    } finally {
      setLoading(false);
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === "active");
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalUses = campaigns.reduce((sum, c) => sum + c.uses, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  const metrics = [
    { label: "Active Campaigns", value: activeCampaigns.length.toString(), icon: Megaphone },
    { label: "Conversions", value: totalConversions.toString(), icon: MousePointerClick },
    { label: "Promo Uses", value: totalUses.toString(), icon: Gift },
    { label: "Promo Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: Receipt },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success(`Code ${code} copied to clipboard!`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success("Campaign deleted successfully!");
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Marketing & Promos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Grow your bookings with targeted promotions and actionable insights.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 px-4 text-sm font-medium border-gray-200" onClick={fetchCampaigns}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
            <DialogTrigger asChild>
              <Button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                <Plus className="w-4 h-4 mr-2" /> New Promo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Discount Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input placeholder="e.g. Summer Flash Sale" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Promo Code</Label>
                    <Input 
                      className="uppercase font-mono font-semibold"
                      placeholder="SUMMER20" 
                      value={newCode.code}
                      onChange={(e) => setNewCode(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount %</Label>
                    <Input type="number" placeholder="20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Uses <span className="text-xs text-gray-400">(0 = unlmt.)</span></Label>
                    <Input type="number" placeholder="100" />
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setShowNewForm(false);
                    toast.success("Promo code created successfully!");
                  }}
                >
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-md shrink-0">
              <m.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">{m.label}</div>
              <div className="text-2xl font-semibold text-gray-900">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content - Campaigns List (Col Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" /> Active Campaigns
          </h2>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600">Campaign</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Code</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Performance</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                        Loading campaigns...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No campaigns found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Expires: {c.expires}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">{c.code}</span>
                            <button onClick={() => handleCopy(c.code)} className="text-gray-400 hover:text-gray-600 transition-colors">
                              {copiedCode === c.code ? <CopyCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="text-xs font-medium text-gray-500 mt-1">{c.discount}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900 font-medium">{c.uses} / {c.maxUses || '∞'} uses</div>
                          <div className="text-xs text-gray-500 mt-0.5">${c.revenue.toLocaleString()} revenue</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            c.status === "paused" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }`}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="cursor-pointer text-gray-700"><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-gray-700"><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-rose-600 focus:text-rose-600" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar - Growth Tips (Col Span 1) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Growth Playbook
          </h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <div className="divide-y divide-gray-100">
              {tips.map((t, i) => (
                <div key={i} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors rounded-md group">
                  <div className="mt-0.5 text-gray-400 group-hover:text-gray-600 transition-colors">
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{t.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 pt-3 mt-1 border-t border-gray-100">
              <Button variant="outline" className="w-full text-xs font-medium border-gray-200">
                View More Tips <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
