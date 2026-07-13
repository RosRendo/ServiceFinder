"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, LifeBuoy, MessageSquare, Clock, CheckCircle2, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type TicketStatus = "open" | "in_progress" | "resolved";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  date: string;
  lastUpdate: string;
}

const MOCK_TICKETS: Ticket[] = [
  { id: "TCK-1029", subject: "Cannot update payout bank details", category: "Billing", status: "open", date: "2026-06-29", lastUpdate: "1 hour ago" },
  { id: "TCK-1024", subject: "Dispute regarding Booking #4928", category: "Disputes", status: "in_progress", date: "2026-06-28", lastUpdate: "Yesterday" },
  { id: "TCK-0982", subject: "Requesting higher service radius limit", category: "Account", status: "resolved", date: "2026-06-15", lastUpdate: "2 weeks ago" },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [formData, setFormData] = useState({ subject: "", category: "General", message: "" });

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const newTicket: Ticket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: formData.subject,
      category: formData.category,
      status: "open",
      date: new Date().toISOString().split("T")[0],
      lastUpdate: "Just now"
    };

    setTickets([newTicket, ...tickets]);
    setNewTicketOpen(false);
    setFormData({ subject: "", category: "General", message: "" });
    toast.success("Support ticket submitted successfully");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Help & Support</h1>
          <p className="text-sm text-gray-500 mt-1">Submit tickets and get help from the ServiceFinder admin team</p>
        </div>
        
        <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-11 shadow-sm px-6 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl border border-slate-200 shadow-xl bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 h-11"
                >
                  <option>General</option>
                  <option>Billing & Payouts</option>
                  <option>Technical Issue</option>
                  <option>Dispute Escalation</option>
                  <option>Account Management</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                <Input 
                  placeholder="Brief summary of your issue" 
                  value={formData.subject} 
                  onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                  className="rounded-md border-slate-200 bg-white h-11" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message</label>
                <Textarea 
                  placeholder="Describe your issue in detail..." 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})} 
                  className="rounded-md border-slate-200 bg-white min-h-[120px] resize-none" 
                />
              </div>
              <Button className="w-full rounded-md h-11 bg-blue-600 hover:bg-blue-700 shadow-sm font-bold text-white mt-2" onClick={handleSubmit}>
                Submit Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Ticket List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <Input 
              placeholder="Search tickets by ID or subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 px-2 bg-transparent"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredTickets.length === 0 ? (
                <div className="py-12 text-center">
                  <LifeBuoy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No support tickets found</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group flex items-start justify-between">
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
                          <span className="text-xs font-semibold text-gray-500">{ticket.id}</span>
                          <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full border ${
                            ticket.status === 'open' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            ticket.status === 'in_progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Category: {ticket.category} • Updated {ticket.lastUpdate}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 mt-3 transition-colors" />
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
              <div className="bg-white/10 rounded-md p-3 text-sm flex items-center justify-between">
                <span className="text-blue-200">Email</span>
                <span className="font-semibold">partners@servicefinder.com</span>
              </div>
              <div className="bg-white/10 rounded-md p-3 text-sm flex items-center justify-between">
                <span className="text-blue-200">Phone</span>
                <span className="font-semibold">+1 (800) 555-0199</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Help Center Guides</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-blue-600 hover:underline">How to optimize your service areas</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">Understanding payout schedules</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">Managing staff schedules and dispatch</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">Handling customer disputes effectively</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
