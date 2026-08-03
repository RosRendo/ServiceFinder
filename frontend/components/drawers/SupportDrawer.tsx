"use client";

import { BaseDrawer } from "./BaseDrawer";
import { MessageSquare, AlertCircle, CheckCircle, Send, User, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UISupportTicket } from "@/app/admin/support/page";
import { cn } from "@/lib/utils";

interface SupportDrawerProps {
  open: boolean;
  onClose: () => void;
  ticket: UISupportTicket | null;
  onStatusChange?: (status: "resolved" | "open") => void;
  replyMessage?: string;
  setReplyMessage?: (msg: string) => void;
  onSendReply?: () => void;
  isReplying?: boolean;
}

export function SupportDrawer({
  open,
  onClose,
  ticket,
  onStatusChange,
  replyMessage = "",
  setReplyMessage,
  onSendReply,
  isReplying = false
}: SupportDrawerProps) {
  if (!ticket) return null;

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={ticket.subject}
      subtitle={`Ticket #${ticket.id.slice(0, 8)} • Requested by ${ticket.userName}`}
      width="xl"
    >
      <div className="flex flex-col h-full bg-background relative font-sans">
        
        {/* Status Actions */}
        <div className="flex items-center justify-between p-4 bg-muted/10 border-b border-border shadow-sm shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest",
              ticket.status === 'open' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
              ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              'bg-amber-500/10 text-amber-500 border-amber-500/20'
            )}>
              {ticket.status.replace("_", " ")}
            </span>
            <span className={cn(
              "inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest",
              ticket.priority === 'high' || ticket.priority === 'urgent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
              'bg-muted/50 text-muted-foreground border-transparent'
            )}>
              {ticket.priority}
            </span>
          </div>
          <div>
            {ticket.status !== "resolved" ? (
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 text-xs font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                onClick={() => onStatusChange?.("resolved")}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Mark Resolved
              </Button>
            ) : (
              <Button 
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold text-foreground bg-background border-border hover:bg-muted/50 transition-colors"
                onClick={() => onStatusChange?.("open")}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reopen Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {ticket.messages.map((msg, idx) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.senderRole === 'admin' ? 'flex-row-reverse' : ''}`}
            >
              <div className={cn(
                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm border",
                msg.senderRole === 'admin' ? 'bg-primary text-primary-foreground border-primary/20' : 'bg-muted text-foreground border-border/50'
              )}>
                {msg.senderName.substring(0, 2).toUpperCase()}
              </div>
              <div className={`flex flex-col ${msg.senderRole === 'admin' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-sm font-bold text-foreground">{msg.senderName}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <div className={cn(
                  "p-4 text-sm font-medium shadow-sm leading-relaxed",
                  msg.senderRole === 'admin' 
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                    : 'bg-muted/30 text-foreground border border-border/50 rounded-2xl rounded-tl-sm'
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        {ticket.status !== "resolved" && (
          <div className="p-4 bg-muted/10 border-t border-border shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
            <div className="flex gap-3">
              <Textarea 
                value={replyMessage}
                onChange={(e) => setReplyMessage?.(e.target.value)}
                placeholder="Type your reply here..."
                className="min-h-[80px] resize-none bg-background border-border focus-visible:ring-primary/20 text-sm font-medium rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (onSendReply) onSendReply();
                  }
                }}
              />
              <Button 
                onClick={onSendReply}
                disabled={isReplying || !replyMessage.trim()}
                className="h-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm px-5 transition-colors"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 text-center">Press Enter to send, Shift + Enter for new line</p>
          </div>
        )}
      </div>
    </BaseDrawer>
  );
}
