/**
 * Admin Audit Logs — Premium Deep Navy Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, StyleSheet, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSidebarStore } from "@/store/sidebarStore";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";
import { useTranslation } from "react-i18next";

const T = Theme.colors;



type ActionType = "all" | "login" | "register" | "settings" | "security";

const FILTER_TABS: { id: ActionType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "login", label: "Login" },
  { id: "register", label: "Registered" },
  { id: "settings", label: "Settings" },
  { id: "security", label: "Security" },
];

const getActionConfig = (action: string = "") => {
  const act = action.toLowerCase();
  if (act.includes("login")) return { icon: "login", color: "#0F172A", bg: "#F1F5F9", label: "Login" };
  if (act.includes("register")) return { icon: "account-plus", color: "#0F172A", bg: "#F1F5F9", label: "Registered" };
  if (act.includes("setting")) return { icon: "cog-outline", color: "#0F172A", bg: "#F1F5F9", label: "Settings" };
  if (act.includes("delete") || act.includes("reject") || act.includes("suspend")) return { icon: "close-circle-outline", color: "#DC2626", bg: "#F8FAFC", label: "Action" };
  if (act.includes("approve") || act.includes("confirm")) return { icon: "check-circle-outline", color: "#059669", bg: "#F8FAFC", label: "Approved" };
  if (act.includes("update") || act.includes("edit")) return { icon: "pencil-outline", color: "#0F172A", bg: "#F1F5F9", label: "Update" };
  return { icon: "shield-check-outline", color: "#64748B", bg: "#F8FAFC", label: action || "Event" };
};

export default function AuditLogs() {
  const router = useRouter();
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActionType>("all");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      const response = await api.get("/api/audit-logs");
      let data: any[] = [];
      const raw = response.data;
      if (Array.isArray(raw)) {
        data = raw;
      } else if (Array.isArray(raw?.data)) {
        data = raw.data;
      } else if (Array.isArray(raw?.data?.data)) {
        data = raw.data.data;
      } else if (Array.isArray(raw?.logs)) {
        data = raw.logs;
      }
      setLogs(data);
      setHasError(false);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setHasError(true);
      setLogs([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    let result = Array.isArray(logs) ? logs : [];
    if (activeFilter !== "all") {
      result = result.filter(l => {
        const act = (l.action || "").toLowerCase();
        if (activeFilter === "login") return act.includes("login");
        if (activeFilter === "register") return act.includes("register");
        if (activeFilter === "settings") return act.includes("setting");
        if (activeFilter === "security") return act.includes("security") || act.includes("suspend") || act.includes("delete");
        return act.includes(activeFilter);
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.user?.fullName || l.actor || "").toLowerCase().includes(q) ||
        (l.user?.email || "").toLowerCase().includes(q) ||
        (l.action || "").toLowerCase().includes(q) ||
        (l.entityType || l.targetType || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q) ||
        String(l.entityId || "").toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [logs, activeFilter, search]);

  const renderLog = ({ item }: { item: any }) => {
    const cfg = getActionConfig(item.action);
    const actorName = item.actor || item.user?.fullName || "System";
    const actorEmail = item.user?.email;
    const actorRole = item.actorRole || item.user?.role || "system";

    return (
      <View style={s.card}>
        <View style={s.cardTopRow}>
          <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
          </View>
          <View style={s.cardInfo}>
            <View style={s.cardHeaderRow}>
              <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <Text style={s.timeText}>
                {new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Text style={s.userName}>{actorName}</Text>
              <View style={s.rolePill}>
                <Text style={s.rolePillText}>{actorRole}</Text>
              </View>
            </View>
            {actorEmail ? <Text style={s.userEmail}>{actorEmail}</Text> : null}
            {item.description ? <Text style={s.descText}>{item.description}</Text> : null}
          </View>
        </View>
        <View style={s.cardFooterRow}>
          <Text style={s.footerText}>
            <Text style={s.footerTextBold}>{item.entityType || item.targetType || "Target"}</Text> #{item.entityId || "N/A"}
          </Text>
          <Text style={s.footerText}>IP: {item.ipAddress || "127.0.0.1"}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity 
            accessibilityRole="button"
            accessibilityLabel="Back or Menu"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else openSidebar(true);
            }} 
            style={s.menuBtn}
          >
            <MaterialCommunityIcons name={router.canGoBack() ? "arrow-left" : "menu"} size={26} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>System Audit Trail</Text>
        </View>
        <Text style={s.eventCountText}>{filtered.length} events</Text>
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={T.text3} />
        <TextInput
          style={s.searchInput}
          placeholder="Search user, action, entity..."
          placeholderTextColor={T.text3}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={s.clearBtn}>
            <MaterialCommunityIcons name="close-circle" size={16} color={T.text3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={s.tabsContainer}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={i => i.id}
          contentContainerStyle={s.tabsContent}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.id;
            return (
              <TouchableOpacity
                style={[s.tabPill, isActive ? s.tabPillActive : s.tabPillInactive]}
                onPress={() => setActiveFilter(item.id)}
              >
                <Text style={[s.tabPillText, isActive ? s.tabPillTextActive : s.tabPillTextInactive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        hasError ? (
          <ErrorState onRetry={() => fetchLogs()} />
        ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderLog}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLogs(); }} tintColor={T.accent} />}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="clipboard-text-search-outline" size={64} color={T.text3} style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>No logs found</Text>
              <Text style={s.emptySubText}>Try adjusting your search or filter.</Text>
            </View>
          }
        />
      ))}

    </SafeAreaView>
  );
}


const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  eventCountText: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  searchContainer: { 
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", 
    marginHorizontal: 16, marginTop: 16, marginBottom: 12, paddingHorizontal: 16, 
    height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#0F172A" },
  clearBtn: { padding: 4 },

  tabsContainer: { paddingBottom: 8 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabPillActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  tabPillInactive: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" },
  tabPillText: { fontSize: 13, fontWeight: "700" },
  tabPillTextActive: { color: "#FFFFFF" },
  tabPillTextInactive: { color: "#64748B" },

  listContent: { padding: 16, paddingBottom: 120, gap: 12 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start" },
  iconBox: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0" },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, color: "#0F172A" },
  timeText: { fontSize: 11, color: "#64748B" },
  userName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  userEmail: { fontSize: 13, color: "#64748B", marginTop: 1 },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase",
  },
  descText: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
    lineHeight: 16,
  },

  cardFooterRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  footerText: { fontSize: 12, color: "#475569" },
  footerTextBold: { fontWeight: "700", color: "#0F172A" },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptySubText: { fontSize: 14, color: "#64748B", marginTop: 4, textAlign: "center" },
});

