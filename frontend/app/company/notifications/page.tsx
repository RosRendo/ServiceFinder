"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, MailOpen, Mail, Clock, ShieldAlert, BadgeInfo, CheckCircle2, Loader2, Search } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Types matching the Prisma Notification model
interface Notification {
  id: string;
  title: string;
  body: string;
  type: string; // "info", "alert", "success", "warning" etc
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: BadgeInfo,
  alert: ShieldAlert,
  warning: ShieldAlert,
  success: CheckCircle2,
  system: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  info: "text-blue-500 bg-blue-500/10",
  alert: "text-rose-500 bg-rose-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  success: "text-emerald-500 bg-emerald-500/10",
  system: "text-violet-500 bg-violet-500/10",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { toast } = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      const data = res.data.data || res.data;
      setNotifications(Array.isArray(data) ? data : data.notifications || []);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to load notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      // Revert if failed
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      toast({ title: "Failed to mark as read", variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.patch(`/notifications/read-all`);
      toast({ title: "All caught up!" });
    } catch (err) {
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      fetchNotifications();
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const filteredNotifications = notifications.filter((n) => 
    filter === "all" ? true : !n.isRead
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto space-y-6 flex flex-col">
        {/* Header */}
        <div className="flex items-end justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-violet-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Stay updated on your business activities.</p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg text-violet-600 hover:bg-violet-500/10 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-1.5 text-sm font-semibold rounded-full transition-all",
              filter === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-4 py-1.5 text-sm font-semibold rounded-full transition-all",
              filter === "unread" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            Unread
          </button>
        </div>

        {/* List */}
        <div className="flex-1 pb-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 border border-border">
                <Bell className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-foreground">You're all caught up!</h3>
              <p className="text-sm mt-1 max-w-[250px]">
                {filter === "unread" 
                  ? "You don't have any unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredNotifications.map((notification, idx) => {
                  const Icon = TYPE_ICONS[notification.type] || Bell;
                  const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.info;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "group relative flex items-start gap-4 p-5 rounded-2xl border transition-all",
                        notification.isRead 
                          ? "bg-background border-border" 
                          : "bg-muted/20 border-violet-500/20 shadow-sm"
                      )}
                    >
                      {!notification.isRead && (
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-12 bg-violet-500 rounded-r-full" />
                      )}

                      <div className={cn("shrink-0 w-10 h-10 rounded-full flex items-center justify-center", colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <h4 className={cn("text-base font-bold truncate", notification.isRead ? "text-foreground" : "text-foreground")}>
                            {notification.title}
                          </h4>
                          <span className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(notification.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className={cn("text-sm leading-relaxed", notification.isRead ? "text-muted-foreground" : "text-muted-foreground font-medium text-foreground/80")}>
                          {notification.body}
                        </p>
                        
                        {notification.link && (
                          <a href={notification.link} className="inline-block mt-3 text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors">
                            View Details &rarr;
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-sm"
                          >
                            <MailOpen className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                          className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
