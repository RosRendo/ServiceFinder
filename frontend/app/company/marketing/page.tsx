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
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
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
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
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
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      setCampaigns(prev => prev.filter(c => c.id !== deleteTargetId));
      if (selectedCampaign?.id === deleteTargetId) {
        setSelectedCampaign(null);
      }
      setDeleteTargetId(null);
      toast.success("Campaign deleted successfully!");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Marketing & Promos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Grow your bookings with targeted promotions and actionable insights.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 px-4 text-sm font-medium border-border" onClick={fetchCampaigns}>
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
          <div key={m.label} className="bg-background border border-border rounded-lg p-5 flex items-center gap-4">
            <div className="p-3 bg-muted/50 rounded-md shrink-0">
              <m.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-0.5">{m.label}</div>
              <div className="text-2xl font-semibold text-foreground">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content - Campaigns List (Col Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" /> Active Campaigns
          </h2>
          
          <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Code</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Performance</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                        Loading campaigns...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No campaigns found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => setSelectedCampaign(c)}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Expires: {c.expires}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">{c.code}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(c.code);
                              }} 
                              className="text-gray-400 hover:text-muted-foreground transition-colors"
                            >
                              {copiedCode === c.code ? <CopyCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="text-xs font-medium text-muted-foreground mt-1">{c.discount}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground font-medium">{c.uses} / {c.maxUses || '∞'} uses</div>
                          <div className="text-xs text-muted-foreground mt-0.5">${c.revenue.toLocaleString()} revenue</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            c.status === "paused" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-muted/50 text-muted-foreground border-border"
                          }`}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-muted-foreground">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="cursor-pointer text-muted-foreground"><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-muted-foreground"><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Growth Playbook
          </h2>
          
          <div className="bg-background border border-border rounded-lg p-1 shadow-sm">
            <div className="divide-y divide-border/50">
              {tips.map((t, i) => (
                <div key={i} className="p-4 flex gap-3 hover:bg-muted/50 transition-colors rounded-md group">
                  <div className="mt-0.5 text-gray-400 group-hover:text-muted-foreground transition-colors">
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 pt-3 mt-1 border-t border-border/50">
              <Button variant="outline" className="w-full text-xs font-medium border-border">
                View More Tips <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Campaign Details Drawer */}
      <BaseDrawer
        open={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        title="Promotional Campaign"
        subtitle={selectedCampaign ? selectedCampaign.name : undefined}
      >
        {selectedCampaign && (
          <div className="p-6 space-y-6 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promo Code</p>
                <p className="text-2xl font-mono font-bold text-foreground mt-1">{selectedCampaign.code}</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                selectedCampaign.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                selectedCampaign.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-muted text-muted-foreground border-border'
              }`}>
                {selectedCampaign.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-border bg-muted/10">
                <span className="text-xs text-muted-foreground block mb-1">Discount Amount</span>
                <span className="text-base font-bold text-foreground">{selectedCampaign.discount}</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/10">
                <span className="text-xs text-muted-foreground block mb-1">Expires</span>
                <span className="text-base font-semibold text-foreground">{selectedCampaign.expires}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-border bg-muted/10">
                <span className="text-xs text-muted-foreground block mb-1">Total Redemptions</span>
                <span className="text-base font-bold text-foreground">{selectedCampaign.uses} / {selectedCampaign.maxUses || '∞'}</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/10">
                <span className="text-xs text-muted-foreground block mb-1">Revenue Generated</span>
                <span className="text-base font-bold text-emerald-600">${selectedCampaign.revenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => handleDelete(selectedCampaign.id)}
                className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 font-bold"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Campaign
              </Button>
            </div>
          </div>
        )}
      </BaseDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Promo Campaign"
        description="Are you sure you want to delete this promotional campaign? Customers will no longer be able to apply this code."
        actionType="danger"
        confirmLabel="Delete Campaign"
        onConfirm={async () => confirmDelete()}
      />
    </div>
  );
}

