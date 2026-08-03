"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Send, 
  Users, 
  Building, 
  Smartphone,
  Search,
  Filter,
  Megaphone,
  CheckCircle2,
  Clock,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock data for broadcasts
const MOCK_BROADCASTS = [
  {
    id: "br-101",
    title: "System Maintenance Notice",
    message: "The platform will be down for scheduled maintenance on Sunday at 2 AM EST for approximately 2 hours.",
    audience: "All Users & Companies",
    audienceType: "all",
    sentAt: "2026-08-01T14:30:00Z",
    sentCount: 15420,
    openRate: 68,
    status: "sent"
  },
  {
    id: "br-102",
    title: "New Feature: Instant Payouts",
    message: "Companies can now opt-in for instant payouts via Stripe. Check your billing settings to enable this feature.",
    audience: "All Companies",
    audienceType: "companies",
    sentAt: "2026-07-28T09:15:00Z",
    sentCount: 450,
    openRate: 82,
    status: "sent"
  },
  {
    id: "br-103",
    title: "Summer Discount Promo Code",
    message: "Use code SUMMER20 to get 20% off your next cleaning booking! Valid until August 31st.",
    audience: "All Customers",
    audienceType: "customers",
    sentAt: "2026-07-15T11:00:00Z",
    sentCount: 12800,
    openRate: 45,
    status: "sent"
  }
];

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState(MOCK_BROADCASTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Composer State
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSendBroadcast = async () => {
    if (!title || !message) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newBroadcast = {
      id: `br-${Date.now()}`,
      title,
      message,
      audience: audience === "all" ? "All Users & Companies" : audience === "companies" ? "All Companies" : "All Customers",
      audienceType: audience,
      sentAt: new Date().toISOString(),
      sentCount: audience === "companies" ? 485 : 16000,
      openRate: 0,
      status: "sent"
    };

    setBroadcasts([newBroadcast, ...broadcasts]);
    setSending(false);
    setIsComposerOpen(false);
    setTitle("");
    setMessage("");
    toast.success("Broadcast sent successfully!");
  };

  const filteredBroadcasts = broadcasts.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Push Broadcasts
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            Send mass push notifications and in-app alerts to your platform users.
          </p>
        </div>
        <Button onClick={() => setIsComposerOpen(true)} className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-4 shadow-sm text-sm">
          <Plus className="w-4 h-4 mr-2" /> New Broadcast
        </Button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* Main Content - History */}
        <div className="flex-1 bg-background rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Broadcast History</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 rounded-md px-1.5 py-0">
                {broadcasts.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search broadcasts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm rounded-lg border-border bg-muted/50 focus:bg-background w-64 shadow-sm"
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border shadow-sm">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {filteredBroadcasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Megaphone className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">No broadcasts found</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredBroadcasts.map((broadcast, i) => (
                  <motion.div
                    key={broadcast.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground text-sm truncate">{broadcast.title}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold border-border/50 bg-muted/50 text-muted-foreground">
                            {broadcast.audience}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                          {broadcast.message}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(broadcast.sentAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 sm:border-l sm:border-border sm:pl-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Recipients</p>
                        <p className="text-xl font-black text-foreground tracking-tight">{broadcast.sentCount.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Open Rate</p>
                        <p className="text-xl font-black text-primary tracking-tight">{broadcast.openRate}%</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Composer Side Panel */}
        <AnimatePresence>
          {isComposerOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-96 shrink-0 bg-background rounded-xl border border-border shadow-lg flex flex-col overflow-hidden relative z-10"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" /> New Broadcast
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setIsComposerOpen(false)} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  Cancel
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Audience</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "all", label: "All Users & Companies", icon: Users },
                      { id: "customers", label: "Customers Only", icon: Smartphone },
                      { id: "companies", label: "Companies Only", icon: Building },
                    ].map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAudience(a.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border text-sm font-semibold transition-all text-left",
                          audience === a.id 
                            ? "bg-primary/10 border-primary text-primary shadow-sm" 
                            : "bg-background border-border text-foreground hover:border-primary/40"
                        )}
                      >
                        <a.icon className="w-4 h-4" />
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Broadcast Title</Label>
                  <Input 
                    placeholder="E.g. System Maintenance Notice"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message Body</Label>
                  <Textarea 
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[160px] rounded-lg border-border bg-background focus:ring-1 focus:ring-primary shadow-sm resize-none"
                  />
                  <p className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span>Supports plain text only.</span>
                    <span className={message.length > 200 ? "text-amber-500" : ""}>{message.length} / 200</span>
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-muted/20">
                <Button 
                  onClick={handleSendBroadcast} 
                  disabled={sending} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-lg shadow-sm transition-all"
                >
                  {sending ? (
                    <><Bell className="w-4 h-4 mr-2 animate-bounce" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send Broadcast Now</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
