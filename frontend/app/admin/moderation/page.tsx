"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, ShieldAlert, Check, Trash2, Search, Filter, AlertTriangle, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { useAdminModeration, ModerationItem } from "@/lib/hooks/useAdminModeration";
type ModerationType = "review" | "profile" | "service";

export default function ModerationQueuePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ModerationType | "all">("all");
  
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [actionType, setActionType] = useState<"remove" | "dismiss" | null>(null);
  const { items, loading, moderateItem } = useAdminModeration();

  const handleAction = async () => {
    if (!selectedItem || !actionType) return;
    
    try {
      await moderateItem(selectedItem.id, actionType === "dismiss" ? "dismiss" : "resolve", actionReason);
      
      toast.success(actionType === "remove" ? "Content removed successfully." : "Report dismissed.");
      setIsActionModalOpen(false);
      setSelectedItem(null);
      setActionReason("");
    } catch (error) {
      toast.error("Failed to process moderation action.");
    }
  };

  const openActionModal = (item: ModerationItem, type: "remove" | "dismiss") => {
    setSelectedItem(item);
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const getTypeBadge = (type: ModerationType) => {
    switch (type) {
      case "review": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">Review</span>;
      case "profile": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">Profile</span>;
      case "service": return <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">Service</span>;
    }
  };

  const filteredItems = items.filter(item => {
    const authorName = (item as any).authorName || item.reportedBy;
    const reportReason = item.reason || (item as any).reportReason || "";
    
    const matchesSearch = authorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          reportReason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const isPending = item.status === "pending";
    return matchesSearch && matchesType && isPending;
  });

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="pb-6 border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Content Moderation
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-xl">
              Review flagged content to maintain community standards and ensure platform safety.
            </p>
          </div>
          <div className="relative z-10 flex gap-3 mt-4 lg:mt-0">
            <span className="px-5 py-2.5 bg-white/60 backdrop-blur-xl border border-rose-200/60 text-rose-700 text-sm font-bold rounded-2xl shadow-sm shadow-rose-500/10 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {filteredItems.length} Pending
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by author or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-white/60 backdrop-blur-xl border-white/40 shadow-sm font-medium focus-visible:ring-rose-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="h-12 pl-11 pr-4 w-full rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none shadow-sm"
              >
                <option value="all">All Content Types</option>
                <option value="review">Reviews</option>
                <option value="profile">Profile</option>
                <option value="service">Service Text</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filteredItems.map((item, idx) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm flex flex-col overflow-hidden hover:border-white/60 transition-all hover:shadow-md hover:shadow-slate-200/50"
                >
                  <div className="p-6 border-b border-white/40 bg-white/40">
                    <div className="flex justify-between items-center mb-4">
                      {getTypeBadge(item.type)}
                      <span className="text-xs font-bold text-slate-400 bg-white/60 px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm font-bold text-rose-700 bg-rose-50/80 p-3 rounded-2xl border border-rose-200/60 shadow-sm shadow-rose-500/5">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Reason: {item.reason || (item as any).reportReason}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 bg-white/20">
                    <div className="mb-6">
                      <p className="text-[10px] font-bold text-gray-500 font-medium mb-1.5 flex items-center gap-1.5">Author</p>
                      <p className="font-bold text-gray-900 bg-white/60 inline-flex px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">{(item as any).authorName || item.reportedBy}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 font-medium mb-2">Flagged Content</p>
                      {item.type === "profile" ? (
                        <div className="relative aspect-video bg-white/40 rounded-2xl overflow-hidden border border-white/60 shadow-sm group cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.content} alt="Flagged content" className="w-full h-full object-cover blur-xl group-hover:blur-none transition-all duration-500 scale-105 group-hover:scale-100" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity bg-white/10">
                            <span className="bg-slate-900/80 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md shadow-lg">
                              <EyeOff className="w-4 h-4" /> Hover to reveal
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/50 p-5 rounded-2xl text-sm font-medium text-slate-700 border border-white/60 relative shadow-sm">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-300 to-slate-200 rounded-l-2xl"></div>
                          <p className="pl-3 leading-relaxed">"{item.content}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 border-t border-white/40 bg-white/40 flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-2xl h-12 border-white/60 font-bold hover:bg-emerald-50 hover:text-emerald-700 bg-white/50 shadow-sm text-slate-700"
                      onClick={() => openActionModal(item, "dismiss")}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Dismiss
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1 rounded-2xl h-12 bg-rose-600 hover:bg-rose-700 font-bold shadow-sm shadow-rose-500/20"
                      onClick={() => openActionModal(item, "remove")}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm"
          >
            <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-200 rotate-3 shadow-sm shadow-emerald-500/5">
              <Check className="h-10 w-10 text-emerald-600 -rotate-3" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Queue is empty</h3>
            <p className="text-gray-500 font-medium mt-3 max-w-sm mx-auto text-lg leading-relaxed">
              Great job! There is no pending content requiring your moderation right now.
            </p>
          </motion.div>
        )}

        {/* Action Modal */}
        <Dialog open={isActionModalOpen} onOpenChange={(open) => !open && setIsActionModalOpen(false)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl">
            <div className="p-8 border-b border-white/40 bg-white/40">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 tracking-tight">
                  {actionType === "remove" ? (
                    <><div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center"><AlertTriangle className="text-rose-600 w-5 h-5" /></div> Remove Content</>
                  ) : (
                    <><div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="text-emerald-600 w-5 h-5" /></div> Dismiss Report</>
                  )}
                </DialogTitle>
                <DialogDescription className="text-gray-500 mt-4 font-medium text-base leading-relaxed">
                  {actionType === "remove" 
                    ? "This will delete the content from the platform and notify the user of a community guidelines violation."
                    : "This will clear the report. The content will remain visible on the platform."}
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-8 bg-white/20">
              <p className="text-[10px] font-bold text-gray-500 font-medium mb-3">Provide a reason (Optional)</p>
              <Textarea 
                placeholder={actionType === "remove" ? "E.g., Violates hate speech policy..." : "E.g., Content is acceptable..."}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
                className="rounded-2xl border-white/60 bg-white/50 focus:bg-white shadow-sm focus-visible:ring-rose-500 font-medium p-4 resize-none"
              />
              {actionType === "remove" && (
                <p className="text-xs font-medium text-gray-500 mt-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-200 shadow-sm leading-relaxed">
                  This note will be included in the automated email sent to <span className="font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">{selectedItem?.authorName}</span>.
                </p>
              )}
            </div>
            
            <div className="p-6 border-t border-white/40 bg-white/40 flex gap-4">
              <Button variant="outline" className="flex-1 rounded-2xl h-12 border-white/60 bg-white/50 font-bold shadow-sm" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
              <Button 
                className={`flex-1 rounded-2xl h-12 font-bold text-white shadow-sm ${actionType === "remove" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"}`}
                onClick={handleAction}
              >
                Confirm {actionType === "remove" ? "Removal" : "Dismissal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
