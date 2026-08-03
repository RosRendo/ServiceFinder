"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, ShieldAlert, Check, Trash2, Search, Filter, AlertTriangle, EyeOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAdminModeration, ModerationItem } from "@/lib/hooks/useAdminModeration";

type ModerationType = "review" | "profile" | "service";

const TYPE_BADGE: Record<string, string> = {
  review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  profile: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  service: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

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
    } catch {
      toast.error("Failed to process moderation action.");
    }
  };

  const openActionModal = (item: ModerationItem, type: "remove" | "dismiss") => {
    setSelectedItem(item);
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const filteredItems = items.filter((item) => {
    const authorName = (item as any).authorName || item.reportedBy;
    const reportReason = item.reason || (item as any).reportReason || "";
    const matchesSearch = authorName.toLowerCase().includes(searchQuery.toLowerCase()) || reportReason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType && item.status === "pending";
  });

  return (
    <div className="h-full flex flex-col p-6 font-sans overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Content Moderation</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Review flagged content to maintain community standards.</p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border bg-rose-500/10 text-rose-600 border-rose-500/20 self-start sm:self-auto">
          <ShieldAlert className="w-4 h-4" /> {filteredItems.length} Pending
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by author or reason..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-lg bg-background border-border font-medium" />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
            className="h-10 pl-9 pr-4 w-full rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
            <option value="all">All Types</option>
            <option value="review">Reviews</option>
            <option value="profile">Profile</option>
            <option value="service">Service Text</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filteredItems.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                className="bg-background border border-border rounded-xl flex flex-col overflow-hidden shadow-sm hover:border-border/80 transition-colors"
              >
                <div className="p-5 border-b border-border">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${TYPE_BADGE[item.type] || "bg-muted text-muted-foreground border-border"}`}>
                      {item.type}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm font-semibold text-rose-600 bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{item.reason || (item as any).reportReason}</span>
                  </div>
                </div>

                <div className="p-5 flex-1">
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Author</p>
                    <p className="font-bold text-foreground inline-flex px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-sm">
                      {(item as any).authorName || item.reportedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Flagged Content</p>
                    {item.type === "profile" ? (
                      <div className="relative aspect-video bg-muted/30 rounded-xl overflow-hidden border border-border group cursor-pointer">
                        <img src={item.content} alt="Flagged content" className="w-full h-full object-cover blur-xl group-hover:blur-none transition-all duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                          <span className="bg-background/90 text-foreground text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 border border-border">
                            <EyeOff className="w-3.5 h-3.5" /> Hover to reveal
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/30 p-4 rounded-lg text-sm font-medium text-foreground/80 border border-border relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-muted-foreground/30 rounded-r" />
                        <p className="pl-3 leading-relaxed">"{item.content}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-border flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-lg h-10 border-border font-bold text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                    onClick={() => openActionModal(item, "dismiss")}>
                    <Check className="w-4 h-4 mr-2" /> Dismiss
                  </Button>
                  <Button className="flex-1 rounded-lg h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    onClick={() => openActionModal(item, "remove")}>
                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center py-20 bg-background border border-dashed border-border rounded-xl"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">Queue is clear</h3>
          <p className="text-muted-foreground font-medium mt-2 text-sm max-w-xs text-center">No pending content requiring your moderation right now.</p>
        </motion.div>
      )}

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={(open) => !open && setIsActionModalOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden border-border bg-background shadow-2xl">
          <div className="p-6 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg font-bold text-foreground">
                {actionType === "remove" ? (
                  <><div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20"><AlertTriangle className="text-rose-600 w-4 h-4" /></div> Remove Content</>
                ) : (
                  <><div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><Check className="text-emerald-600 w-4 h-4" /></div> Dismiss Report</>
                )}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2 font-medium">
                {actionType === "remove"
                  ? "This will delete the content from the platform and notify the user."
                  : "This will clear the report. The content will remain visible."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Reason (Optional)</label>
            <Textarea placeholder={actionType === "remove" ? "E.g., Violates hate speech policy..." : "E.g., Content is acceptable..."}
              value={actionReason} onChange={(e) => setActionReason(e.target.value)} rows={3}
              className="rounded-lg border-border bg-background font-medium resize-none" />
          </div>
          <div className="p-5 border-t border-border flex gap-3">
            <Button variant="outline" className="flex-1 rounded-lg h-10 border-border font-bold" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAction}
              className={`flex-1 rounded-lg h-10 font-bold text-white ${actionType === "remove" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
              Confirm {actionType === "remove" ? "Removal" : "Dismissal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
