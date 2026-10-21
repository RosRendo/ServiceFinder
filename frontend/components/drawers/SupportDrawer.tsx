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
  isReplying = false,
}: SupportDrawerProps) {
  if (!ticket) return null;

  const ticketIdDisplay = (ticket.id?.toString() || "").slice(0, 8);
  const requesterName = ticket.userName || "Client";

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={ticket.subject || "Support Inquiry"}
      subtitle={`Ticket #${ticketIdDisplay} • From ${requesterName}`}
      badge={
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
              ticket.status === "open"
                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                : ticket.status === "resolved"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
            )}
          >
            {(ticket.status || "open").replace("_", " ")}
          </span>
          <span
            className={cn(
              "inline-flex px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider",
              ticket.priority === "high" || ticket.priority === "urgent"
                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {ticket.priority || "normal"}
          </span>
        </div>
      }
      headerActions={
        ticket.status !== "resolved" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
            onClick={() => onStatusChange?.("resolved")}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Mark Resolved
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold text-foreground border-border hover:bg-muted"
            onClick={() => onStatusChange?.("open")}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reopen Ticket
          </Button>
        )
      }
      width="xl"
    >
      <div className="flex flex-col h-full bg-background font-sans">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(ticket.messages || []).map((msg, idx) => {
            const senderName = msg.senderName || (msg.senderRole === "admin" ? "Support Admin" : "User");
            const senderInitials = senderName.slice(0, 2).toUpperCase();

            return (
              <div
                key={msg.id || idx}
                className={cn("flex gap-3.5", msg.senderRole === "admin" ? "flex-row-reverse" : "")}
              >
                <div
                  className={cn(
                    "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border",
                    msg.senderRole === "admin"
                      ? "bg-primary text-primary-foreground border-primary/20"
                      : "bg-muted text-foreground border-border"
                  )}
                >
                  {senderInitials}
                </div>
                <div className={cn("flex flex-col max-w-[85%]", msg.senderRole === "admin" ? "items-end" : "items-start")}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-foreground">{senderName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "p-3.5 text-xs font-medium leading-relaxed rounded-2xl",
                      msg.senderRole === "admin"
                        ? "bg-primary text-primary-foreground rounded-tr-sm shadow-xs"
                        : "bg-card text-foreground border border-border rounded-tl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Composer */}
        {ticket.status !== "resolved" && (
          <div className="p-4 bg-card/60 backdrop-blur-md border-t border-border shrink-0 sticky bottom-0 z-10">
            <div className="flex gap-2.5">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage?.(e.target.value)}
                placeholder="Type your official response..."
                className="min-h-[75px] resize-none bg-background border-border text-xs rounded-xl"
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
                className="h-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 font-bold text-xs"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Press Enter to dispatch response · Shift + Enter for newline
            </p>
          </div>
        )}
      </div>
    </BaseDrawer>
  );
}

export default SupportDrawer;
