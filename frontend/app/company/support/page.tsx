"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, LifeBuoy, MessageSquare, Clock, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import api from "@/lib/api/client";

type TicketStatus = "open" | "in_progress" | "resolved";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
  createdAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: "", priority: "Medium", message: "" });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get("/support/tickets");
      const ticketData = res.data.data || res.data || [];
      setTickets(Array.isArray(ticketData) ? ticketData : []);
    } catch (err) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => 
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await api.post("/support/tickets", {
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority.toLowerCase(),
      });
      const created = res.data.data || res.data;
      setTickets([created, ...tickets]);
      setNewTicketOpen(false);
      setFormData({ subject: "", priority: "Medium", message: "" });
      toast.success("Support ticket submitted successfully");
    } catch (err) {
      toast.error("Failed to submit support ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Help & Support</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit tickets and get help from the ServiceFinder admin team</p>
        </div>
        
        <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-11 shadow-sm px-6 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl border border-border shadow-xl bg-background sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 h-11 text-foreground"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject</label>
                <Input 
                  placeholder="Brief summary of your issue" 
                  value={formData.subject} 
                  onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                  className="rounded-md border-border bg-background h-11" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message</label>
                <Textarea 
                  placeholder="Describe your issue in detail..." 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})} 
                  className="rounded-md border-border bg-background min-h-[120px] resize-none" 
                />
              </div>
              <Button 
                disabled={isSubmitting}
                className="w-full rounded-md h-11 bg-blue-600 hover:bg-blue-700 shadow-sm font-bold text-white mt-2 flex items-center justify-center gap-2" 
                onClick={handleSubmit}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Ticket List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-background rounded-xl border border-border shadow-sm p-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground/70 ml-2" />
            <Input 
              placeholder="Search tickets by ID or subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 px-2 bg-transparent"
            />
          </div>

          <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="divide-y divide-border/50">
              {loading ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-muted-foreground text-xs font-semibold">Loading support tickets...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="py-12 text-center">
                  <LifeBuoy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No support tickets found</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                        ticket.status === 'open' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                        ticket.status === 'in_progress' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        {ticket.status === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> : 
                         ticket.status === 'in_progress' ? <Clock className="w-5 h-5" /> : 
                         <MessageSquare className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground">TCK-{ticket.id}</span>
                          <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full border ${
                            ticket.status === 'open' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            ticket.status === 'in_progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] capitalize font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                            Priority: {ticket.priority}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-muted-foreground mt-3 transition-colors" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-sm">
            <LifeBuoy className="w-8 h-8 text-blue-200 mb-4" />
            <h2 className="text-lg font-bold mb-2">Need immediate help?</h2>
            <p className="text-blue-100 text-sm mb-6">Our partner success team is available Monday through Friday, 9AM to 6PM EST.</p>
            <div className="space-y-3">
              <div className="bg-background/10 rounded-md p-3 text-sm flex items-center justify-between">
                <span className="text-blue-200">Email</span>
                <span className="font-semibold">partners@servicefinder.com</span>
              </div>
              <div className="bg-background/10 rounded-md p-3 text-sm flex items-center justify-between">
                <span className="text-blue-200">Phone</span>
                <span className="font-semibold">+1 (800) 555-0199</span>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Help Center Guides</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/company/service-areas" className="text-blue-600 hover:underline">How to optimize your service areas</Link></li>
              <li><Link href="/company/payouts" className="text-blue-600 hover:underline">Understanding payout schedules</Link></li>
              <li><Link href="/company/schedule" className="text-blue-600 hover:underline">Managing staff schedules and dispatch</Link></li>
              <li><Link href="/company/disputes" className="text-blue-600 hover:underline">Handling customer disputes effectively</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

