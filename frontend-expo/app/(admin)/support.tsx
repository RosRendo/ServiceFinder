/**
 * Admin Support Tickets — Enterprise Operations Cockpit
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";
import { useTranslation } from "react-i18next";

const T = Theme.colors;

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

const STATUS_CONFIG: Record<TicketStatus, { label: string; dotColor: string }> = {
  open:        { label: "Open",        dotColor: "#D97706" }, // Amber
  in_progress: { label: "In Progress", dotColor: "#334155" }, // Slate
  resolved:    { label: "Resolved",    dotColor: "#059669" }, // Emerald
  closed:      { label: "Closed",      dotColor: "#94A3B8" }, // Muted Slate
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; dotColor: string }> = {
  low:    { label: "Low",    dotColor: "#94A3B8" },
  medium: { label: "Medium", dotColor: "#64748B" },
  high:   { label: "High",   dotColor: "#D97706" },
  urgent: { label: "Urgent", dotColor: "#DC2626" },
};

const TABS: { id: TicketStatus | "all"; label: string }[] = [
  { id: "open",        label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved" },
  { id: "all",         label: "All" },
];

export default function AdminSupportTicketsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [activeTab, setActiveTab] = useState<TicketStatus | "all">("open");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const res = await api.get("/api/support/tickets", { params });
      const data = res.data?.data ?? [];
      setTickets(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch (e) {
      console.error("Failed to fetch support tickets", e);
      setHasError(true);
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

            <View style={s.metaRight}>
              <View style={s.statusBadge}>
                <View style={[s.statusDot, { backgroundColor: sCfg.dotColor }]} />
                <Text style={s.statusText}>{sCfg.label}</Text>
              </View>
              <View style={s.priorityBadge}>
                <View style={[s.priorityDot, { backgroundColor: pCfg.dotColor }]} />
                <Text style={s.priorityText}>{pCfg.label}</Text>
              </View>
            </View>
          </View>

          {item.description && (
            <Text style={s.messageText} numberOfLines={isExpanded ? undefined : 2}>
              {item.description}
            </Text>
          )}

          <View style={s.toggleRow}>
            <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
            <Text style={s.toggleText}>{isExpanded ? "Collapse Details" : "View & Reply"}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.replyArea}>
            <TextInput
              style={s.replyInput}
              placeholder="Type corporate resolution message..."
              placeholderTextColor="#94A3B8"
              multiline
              value={replyText}
              onChangeText={setReplyText}
            />
            <View style={s.replyActions}>
              <TouchableOpacity
                onPress={() => handleReply(item.id)}
                disabled={replying || !replyText.trim()}
                style={[s.replyBtn, { backgroundColor: replyText.trim() ? "#0F172A" : "#E2E8F0" }]}
                activeOpacity={0.8}
              >
                {replying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[s.replyBtnText, { color: replyText.trim() ? "#FFFFFF" : "#94A3B8" }]}>Send Response</Text>
                )}
              </TouchableOpacity>
              {item.status !== "resolved" && (
                <TouchableOpacity
                  onPress={() => handleClose(item.id)}
                  style={s.closeBtn}
                  activeOpacity={0.8}
                >
                  <Text style={s.closeBtnText}>Resolve</Text>
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
              activeOpacity={0.7}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Text style={s.actionBtnText}>Assign Ticket to Me</Text>
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
          <TouchableOpacity 
            accessibilityRole="button"
            accessibilityLabel={t("common.openMenu")}
            onPress={() => openSidebar(true)}
            style={s.menuBtn}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Support Inquiries</Text>
        </View>
        {openCount > 0 && (
          <View style={s.openCountBadge}>
            <Text style={s.openCountText}>{openCount} Open</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[s.tab, isActive && s.tabActive]}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, isActive && s.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchTickets()} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderTicket}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTickets(); }}
              tintColor="#0F172A"
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="ticket-outline" size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={s.emptyText}>No Support Tickets</Text>
              <Text style={s.emptySubText}>There are no inquiries matching the selected filter.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },
  openCountBadge: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  openCountText: { color: "#0F172A", fontSize: 12, fontWeight: "700" },

  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 12,
    gap: 6,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 120, gap: 12 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardHeader: { padding: 16 },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 3, lineHeight: 20 },
  cardSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500" },

  metaRight: { alignItems: "flex-end", gap: 4 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600", color: "#334155" },

  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#F8FAFC",
  },
  priorityDot: { width: 5, height: 5, borderRadius: 2.5 },
  priorityText: { fontSize: 10, fontWeight: "600", color: "#64748B" },

  messageText: { fontSize: 13, color: "#475569", lineHeight: 19, marginTop: 4 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  toggleText: { fontSize: 12, fontWeight: "600", color: "#64748B" },

  replyArea: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  replyInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  replyActions: { flexDirection: "row", gap: 10 },
  replyBtn: {
    flex: 1,
    borderRadius: 8,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  replyBtnText: { fontSize: 13, fontWeight: "700" },
  closeBtn: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  closeBtnText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },

  cardActions: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  actionBtn: { paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  emptySubText: { fontSize: 13, color: "#64748B", marginTop: 4, textAlign: "center" },
});
