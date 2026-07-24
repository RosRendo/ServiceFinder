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
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;



type ActionType = "all" | "login" | "create" | "update" | "delete" | "approve";

const ACTION_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  login:   { icon: "login",            color: T.blue,    bg: T.blue + "15" },
  create:  { icon: "plus-circle",      color: T.success, bg: T.success + "15" },
  update:  { icon: "pencil-circle",    color: T.warning, bg: T.warning + "15" },
  delete:  { icon: "delete-circle",    color: T.error,   bg: T.error + "15" },
  approve: { icon: "check-circle",     color: T.purple,  bg: T.purple + "15" },
  default: { icon: "shield-check",     color: T.gray,    bg: T.gray + "15" },
};

const FILTER_TABS: { id: ActionType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "login", label: "Login" },
  { id: "create", label: "Create" },
  { id: "update", label: "Update" },
  { id: "delete", label: "Delete" },
  { id: "approve", label: "Approve" },
];


export default function AuditLogs() {
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActionType>("all");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      const response = await api.get("/api/audit-logs");
      const data = response.data?.data ?? [];
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    let result = logs;
    if (activeFilter !== "all") result = result.filter(l => l.action === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.user?.fullName?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.entityType?.toLowerCase().includes(q) ||
        l.entityId?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [logs, activeFilter, search]);

  const renderLog = ({ item }: { item: any }) => {
    const cfg = ACTION_CONFIG[item.action] ?? ACTION_CONFIG.default;
    return (
      <View style={s.card}>
        <View style={s.cardTopRow}>
          <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
          </View>
          <View style={s.cardInfo}>
            <View style={s.cardHeaderRow}>
              <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[s.badgeText, { color: cfg.color }]}>{item.action}</Text>
              </View>
              <Text style={s.timeText}>
                {new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
            <Text style={s.userName}>{item.user?.fullName ?? "System"}</Text>
            <Text style={s.userEmail}>{item.user?.email}</Text>
          </View>
        </View>
        <View style={s.cardFooterRow}>
          <Text style={s.footerText}>
            <Text style={s.footerTextBold}>{item.entityType}</Text> #{item.entityId}
          </Text>
          <Text style={s.footerText}>IP: {item.ipAddress ?? "Unknown"}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Audit Logs</Text>
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
      )}
    </SafeAreaView>
  );
}


const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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
  eventCountText: { fontSize: 13, color: T.text3, fontWeight: "600" },

  searchContainer: { 
    flexDirection: "row", alignItems: "center", backgroundColor: T.surface, 
    marginHorizontal: 16, marginTop: 16, marginBottom: 12, paddingHorizontal: 16, 
    height: 48, borderRadius: 24, borderWidth: 1, borderColor: T.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: T.text1 },
  clearBtn: { padding: 4 },

  tabsContainer: { paddingBottom: 8 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabPillActive: { backgroundColor: T.accent, borderColor: T.accent },
  tabPillInactive: { backgroundColor: T.surface, borderColor: T.border },
  tabPillText: { fontSize: 13, fontWeight: "700" },
  tabPillTextActive: { color: "#fff" },
  tabPillTextInactive: { color: T.text2 },

  listContent: { padding: 16, paddingBottom: 60, gap: 12 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border , ...CARD_SHADOW },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start" },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  timeText: { fontSize: 11, color: T.text3 },
  userName: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 2 },
  userEmail: { fontSize: 13, color: T.text3 },

  cardFooterRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border },
  footerText: { fontSize: 12, color: T.text2 },
  footerTextBold: { fontWeight: "700", color: T.text1 },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center" },
});

