/**
 * Admin Support Tickets — Premium Deep Navy Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, StyleSheet, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A",
  text1: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  success: "#10B981", warning: "#F59E0B", error: "#EF4444",
  blue: "#3B82F6", gray: "#6B7280", purple: "#7C3AED",
};



type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: T.blue,    bg: T.blue + "15" },
  in_progress: { label: "In Progress", color: T.warning, bg: T.warning + "15" },
  resolved:    { label: "Resolved",    color: T.success, bg: T.success + "15" },
  closed:      { label: "Closed",      color: T.gray,    bg: T.gray + "15" },
};

const PRIORITY_CONFIG: Record<TicketPriority, { color: string; icon: string }> = {
  low:    { color: T.gray,    icon: "arrow-down-circle" },
  medium: { color: T.warning, icon: "minus-circle" },
  high:   { color: T.error,   icon: "arrow-up-circle" },
  urgent: { color: T.purple,  icon: "alert-circle" },
};

const TABS: { id: TicketStatus | "all"; label: string }[] = [
  { id: "open",        label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved" },
  { id: "all",         label: "All" },
];

export default function AdminSupportTicketsScreen() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [activeTab, setActiveTab] = useState<TicketStatus | "all">("open");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const res = await api.get("/api/support/tickets", { params });
      const raw = res.data?.data ?? res.data;
      setTickets(Array.isArray(raw) ? raw : raw?.tickets ?? []);
    } catch (e) {
      console.error("Failed to fetch support tickets", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTickets();
  }, [activeTab]);

  const handleAssign = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      await api.patch(`/api/support/tickets/${ticketId}`, { status: "in_progress" });
      await fetchTickets();
    } catch {
      Alert.alert("Error", "Failed to assign ticket.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await api.post(`/api/support/tickets/${ticketId}/reply`, { message: replyText.trim() });
      setReplyText("");
      setExpandedId(null);
      Alert.alert("Reply Sent", "Your reply has been sent to the user.");
      await fetchTickets();
    } catch {
      Alert.alert("Error", "Failed to send reply.");
    } finally {
      setReplying(false);
    }
  };

  const handleClose = (ticketId: string) => {
    Alert.alert("Close Ticket", "Mark this ticket as resolved and close it?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close Ticket",
        onPress: async () => {
          setActionLoading(ticketId);
          try {
            await api.patch(`/api/support/tickets/${ticketId}`, { status: "resolved" });
            await fetchTickets();
          } catch {
            Alert.alert("Error", "Failed to close ticket.");
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const renderTicket = ({ item }: { item: any }) => {
    const sCfg = STATUS_CONFIG[item.status as TicketStatus] ?? STATUS_CONFIG.open;
    const pCfg = PRIORITY_CONFIG[item.priority as TicketPriority] ?? PRIORITY_CONFIG.medium;
    const isExpanded = expandedId === item.id;
    const isActioning = actionLoading === item.id;

    return (
      <View style={s.card}>
        <TouchableOpacity
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          style={s.cardHeader}
          activeOpacity={0.7}
        >
          <View style={s.cardHeaderRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={s.cardTitle} numberOfLines={2}>
                {item.subject ?? item.title ?? "Support Request"}
              </Text>
              <Text style={s.cardSubtitle}>
                {item.user?.fullName ?? item.submittedBy ?? "User"} · {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View style={[s.badge, { backgroundColor: sCfg.bg }]}>
                <Text style={[s.badgeText, { color: sCfg.color }]}>{sCfg.label}</Text>
              </View>
              <View style={s.priorityRow}>
                <MaterialCommunityIcons name={pCfg.icon as any} size={12} color={pCfg.color} />
                <Text style={[s.priorityText, { color: pCfg.color }]}>{item.priority ?? "medium"}</Text>
              </View>
            </View>
          </View>

          {item.message && (
            <Text style={s.messageText} numberOfLines={isExpanded ? undefined : 2}>
              {item.message}
            </Text>
          )}

          <View style={s.toggleRow}>
            <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={T.text3} />
            <Text style={s.toggleText}>{isExpanded ? "Collapse" : "View & Reply"}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.replyArea}>
            <TextInput
              style={s.replyInput}
              placeholder="Type your reply to the user..."
              placeholderTextColor={T.text3}
              multiline
              value={replyText}
              onChangeText={setReplyText}
            />
            <View style={s.replyActions}>
              <TouchableOpacity
                onPress={() => handleReply(item.id)}
                disabled={replying || !replyText.trim()}
                style={[s.replyBtn, { backgroundColor: replyText.trim() ? T.accent : T.border }]}
              >
                {replying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[s.replyBtnText, { color: replyText.trim() ? "#fff" : T.text3 }]}>Send Reply</Text>
                )}
              </TouchableOpacity>
              {item.status !== "resolved" && (
                <TouchableOpacity
                  onPress={() => handleClose(item.id)}
                  style={s.closeBtn}
                >
                  <Text style={s.closeBtnText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {!isExpanded && item.status === "open" && (
          <View style={s.cardActions}>
            <TouchableOpacity
              onPress={() => handleAssign(item.id)}
              disabled={isActioning}
              style={s.actionBtn}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color={T.accent} />
              ) : (
                <Text style={s.actionBtnText}>Assign to Me</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={openSidebar} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Support Tickets</Text>
        </View>
        {openCount > 0 && (
          <View style={s.openCountBadge}>
            <Text style={s.openCountText}>{openCount}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
          >
            <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTickets(); }} tintColor={T.accent} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={48} color={T.text3} style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>No tickets found</Text>
              <Text style={s.emptySubText}>All support tickets are accounted for</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  openCountBadge: { backgroundColor: T.blue, borderRadius: 12, minWidth: 24, height: 24, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  openCountText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  tabsRow: { flexDirection: "row", backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: T.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: T.text2 },
  tabTextActive: { color: T.accent, fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 60, gap: 16 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: { backgroundColor: T.surface, borderRadius: 20,  },
  cardHeader: { padding: 16 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: T.text3, fontWeight: "500" },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  priorityText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },

  messageText: { fontSize: 14, color: T.text2, lineHeight: 20 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12 },
  toggleText: { fontSize: 11, fontWeight: "600", color: T.text3 },

  replyArea: { backgroundColor: T.bg, padding: 16, borderTopWidth: 1, borderTopColor: T.border },
  replyInput: { 
    backgroundColor: T.surface, borderRadius: 12, borderWidth: 1, borderColor: T.border,
    padding: 12, fontSize: 14, color: T.text1, minHeight: 80, textAlignVertical: "top", marginBottom: 12 
  },
  replyActions: { flexDirection: "row", gap: 12 },
  replyBtn: { flex: 1, borderRadius: 12, height: 44, alignItems: "center", justifyContent: "center" },
  replyBtnText: { fontSize: 13, fontWeight: "800" },
  closeBtn: { paddingHorizontal: 16, height: 44, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center", backgroundColor: T.surface },
  closeBtnText: { fontSize: 13, fontWeight: "700", color: T.text2 },

  cardActions: { borderTopWidth: 1, borderTopColor: T.border },
  actionBtn: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  actionBtnText: { fontSize: 14, fontWeight: "800", color: T.accent },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center" },
});

