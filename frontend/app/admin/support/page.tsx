"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MessageSquare, AlertCircle, Clock, CheckCircle, SearchX, Paperclip, Send, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { useSupportTickets } from "@/lib/hooks/useSupportTickets";

type TicketStatus = "open" | "pending" | "resolved" | "closed" | "in_progress";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "company" | "admin" | "staff";
  content: string;
  createdAt: string;
}

export interface UISupportTicket {
  id: string;
  subject: string;
  userType: "customer" | "company" | "staff";
  userName: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export default function AdminSupportPage() {
  const { tickets: fetchedTickets, loading, updateTicketStatus, addTicketReply } = useSupportTickets();
  const [localTickets, setLocalTickets] = useState<UISupportTicket[]>([]);

  useEffect(() => {
    if (fetchedTickets && fetchedTickets.length > 0) {
      const mapped = fetchedTickets.map(t => ({
        ...t,
        messages: (t as any).messages || [],
        userType: (t as any).userType || "customer"
      })) as UISupportTicket[];
      setLocalTickets(mapped);
    }
  }, [fetchedTickets]);

  const tickets = localTickets;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  
  const [selectedTicket, setSelectedTicket] = useState<UISupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    setIsReplying(true);
    try {
      await addTicketReply(selectedTicket.id, replyMessage);

      const newMessage: TicketMessage = {
        id: `msg_${Date.now()}`,
        senderId: "admin_current",
        senderName: "Admin Support",
        senderRole: "admin",
        content: replyMessage,
        createdAt: new Date().toISOString()
      };

      const updatedTicket = {
        ...selectedTicket,
        status: "pending" as TicketStatus,
        updatedAt: new Date().toISOString(),
        messages: [...selectedTicket.messages, newMessage]
      };

      setLocalTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setReplyMessage("");
      setIsReplying(false);
      toast.success("Reply sent successfully");
    } catch (error) {
      toast.error("Failed to send reply");
      setIsReplying(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    
    try {
      await updateTicketStatus(selectedTicket.id, newStatus as any);
      const updatedTicket = { ...selectedTicket, status: newStatus, updatedAt: new Date().toISOString() };
      setLocalTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      toast.success(`Ticket marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update ticket status");
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "open": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">Open</span>;
      case "in_progress": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">In Progress</span>;
      case "pending": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">Pending User</span>;
      case "resolved": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">Resolved</span>;
      case "closed": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-slate-600 border border-slate-200 shadow-sm">Closed</span>;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case "low": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-200 text-slate-600 bg-white/60 shadow-sm">Low</span>;
      case "medium": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-blue-200 text-blue-700 bg-blue-50 shadow-sm">Medium</span>;
      case "high": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-orange-200 text-orange-700 bg-orange-50 shadow-sm">High</span>;
      case "urgent": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-rose-200 text-rose-700 bg-rose-50 shadow-sm">Urgent</span>;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto space-y-6 flex flex-col h-full lg:h-[calc(100vh-2rem)] py-6">
        
        {/* Header */}
        <div className="pb-6 border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Support Helpdesk
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-xl">
              Manage user inquiries, bug reports, and assistance requests effectively.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0 px-4 sm:px-6 lg:px-8">
          
          {/* Ticket List Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-[350px] bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm flex flex-col overflow-hidden shrink-0"
          >
            <div className="p-5 border-b border-white/40 bg-white/40 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 rounded-2xl bg-white/50 border-white/60 font-medium focus-visible:ring-blue-500 shadow-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full h-12 pl-11 pr-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredTickets.length > 0 ? (
                <AnimatePresence>
                  {filteredTickets.map((ticket, idx) => (
                    <motion.button
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-left p-5 rounded-2xl transition-all border shadow-sm ${
                        selectedTicket?.id === ticket.id 
                          ? "bg-blue-500/10 border-blue-200 ring-1 ring-blue-500/20" 
                          : "bg-white/40 border-white/60 hover:bg-white/60"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-md border border-gray-200">{ticket.id}</span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-3 tracking-tight">{ticket.subject}</h4>
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 truncate pr-2"><User className="w-3.5 h-3.5" /> {ticket.userName}</span>
                        <span className="bg-white/60 px-2 py-1 rounded-lg border border-gray-200">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-12 px-4"
                >
                  <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white shadow-sm shadow-slate-200/50">
                    <SearchX className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 tracking-tight">No tickets found</p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Try adjusting your search criteria</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Ticket Detail View */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm flex flex-col overflow-hidden"
          >
            {selectedTicket ? (
              <>
                {/* Ticket Header */}
                <div className="p-6 sm:p-8 border-b border-white/40 bg-white/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{selectedTicket.subject}</h2>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      Requested by <span className="font-bold text-gray-900">{selectedTicket.userName}</span> 
                      <span className="text-slate-300">•</span> 
                      <span className="font-mono bg-white/60 px-2 py-0.5 rounded-md border border-gray-200 text-xs font-bold">{selectedTicket.id}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {selectedTicket.status !== "resolved" && (
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto rounded-xl h-11 text-emerald-700 bg-emerald-500/10 border-emerald-200 hover:bg-emerald-500/20 font-bold shadow-sm"
                        onClick={() => handleStatusChange("resolved")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Resolved
                      </Button>
                    )}
                    {selectedTicket.status === "resolved" && (
                      <Button 
                        variant="outline"
                        className="w-full sm:w-auto rounded-xl h-11 font-bold text-slate-700 bg-white/50 border-white/60 hover:bg-white shadow-sm"
                        onClick={() => handleStatusChange("open")}
                      >
                        Reopen Ticket
                      </Button>
                    )}
                  </div>
                </div>

                {/* Chat Thread */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white/20">
                  <AnimatePresence>
                    {selectedTicket.messages.map((msg, idx) => (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex gap-4 ${msg.senderRole === 'admin' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border shadow-sm ${msg.senderRole === 'admin' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-600 border-white/60 shadow-slate-200/50'}`}>
                          {msg.senderName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className={`flex flex-col ${msg.senderRole === 'admin' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-sm font-bold text-gray-900">{msg.senderName}</span>
                            <span className="text-[10px] font-bold text-gray-500 font-medium bg-white/40 px-2 py-0.5 rounded-md border border-slate-200/40">{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                          <div className={`p-5 rounded-3xl text-sm font-medium shadow-sm leading-relaxed ${
                            msg.senderRole === 'admin' 
                              ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-500/20' 
                              : 'bg-white border border-white/60 text-slate-700 rounded-tl-sm shadow-slate-200/50'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Reply Box */}
                <div className="p-6 sm:p-8 border-t border-white/40 bg-white/40 shrink-0">
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Type your reply here..." 
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="min-h-[120px] resize-none rounded-2xl border-white/60 bg-white/50 focus:bg-white transition-colors p-5 font-medium shadow-sm focus-visible:ring-blue-500"
                      disabled={selectedTicket.status === "resolved" || selectedTicket.status === "closed"}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-5">
                    <Button variant="ghost" className="text-gray-500 font-bold hover:text-slate-700 rounded-xl hover:bg-white/50">
                      <Paperclip className="w-5 h-5 mr-2" />
                      Attach File
                    </Button>
                    <Button 
                      onClick={handleSendReply} 
                      disabled={!replyMessage.trim() || isReplying || selectedTicket.status === "resolved" || selectedTicket.status === "closed"}
                      className="rounded-xl h-12 px-8 font-bold bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 text-base"
                    >
                      {isReplying ? (
                        <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-5 h-5 mr-2" />
                      )}
                      {isReplying ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/20"
              >
                <div className="w-24 h-24 bg-white/80 rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-white rotate-3">
                  <MessageSquare className="h-12 w-12 text-slate-300 -rotate-3" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">No Ticket Selected</h3>
                <p className="text-gray-500 font-medium max-w-md mt-3 text-lg leading-relaxed">
                  Select a ticket from the sidebar to view the conversation history and reply to the user.
                </p>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
