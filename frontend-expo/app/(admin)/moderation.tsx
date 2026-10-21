/**
 * Admin Content Moderation Queue — Enterprise Clean Business Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import ErrorState from "@/components/common/ErrorState";

type ModerationStatus = "pending" | "resolved" | "dismissed";
type ModerationType = "review" | "profile" | "message" | "other";

interface FlaggedItem {
  id: string;
  type: ModerationType;
  reportedBy: { id: string; name: string };
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  status: ModerationStatus;
  createdAt: string;
}

export default function ModerationQueue() {
  const router = useRouter();
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ModerationStatus>("pending");

  const fetchQueue = async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get(`/api/admin/moderation`, { params: { status: filter } });
      const data = res.data?.data || res.data || [];
      setItems(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch {
      setItems([]);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const handleAction = (id: string, action: "resolve" | "dismiss" | "ban") => {
    Alert.alert(
      `Confirm Action`,
      `Are you sure you want to ${action === "resolve" ? "remove this content" : action === "ban" ? "permanently ban this user" : "dismiss this report"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: action === "ban" ? "destructive" : "default",
          onPress: async () => {
            try {
              await api.post(`/api/admin/moderation/${id}/action`, { action });
              setItems(prev => prev.filter(item => item.id !== id));
            } catch {
              Alert.alert("Error", "Failed to apply moderation action.");
            }
          }
        }
      ]
    );
  };

  const getTypeIcon = (type: ModerationType) => {
    switch (type) {
      case "review": return "star-off";
      case "profile": return "account-alert";
      case "message": return "message-alert";
      default: return "flag";
    }
  };

  const renderItem = ({ item }: { item: FlaggedItem }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.reportTypeRow}>
          <View style={s.typeIconBox}>
            <MaterialCommunityIcons name={getTypeIcon(item.type) as any} size={16} color="#0F172A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.reasonText}>{item.reason}</Text>
            <Text style={s.reportedByText}>Filed by {item.reportedBy?.name || "Anonymous User"}</Text>
          </View>
        </View>
        <Text style={s.dateText}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
        </Text>
      </View>

      <View style={s.detailBox}>
        <Text style={s.targetLabel}>Target Entity: {item.targetName || "General Profile"}</Text>
        <Text style={s.detailsText}>"{item.details}"</Text>
      </View>

      {item.status === "pending" && (
        <View style={s.actionRow}>
          <TouchableOpacity
            onPress={() => handleAction(item.id, "dismiss")}
            style={s.dismissBtn}
          >
            <Text style={s.dismissText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAction(item.id, "resolve")}
            style={s.resolveBtn}
          >
            <Text style={s.resolveText}>Remove Content</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAction(item.id, "ban")}
            style={s.banBtn}
          >
            <Text style={s.banText}>Ban User</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Content Moderation</Text>
            <Text style={s.headerSubtitle}>Flagged Reviews, Profiles & Infractions</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.filterRow}>
        {(["pending", "resolved", "dismissed"] as ModerationStatus[]).map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            style={[
              s.filterBtn,
              filter === status ? s.filterBtnActive : s.filterBtnInactive
            ]}
          >
            <Text style={[
              s.filterText,
              filter === status ? s.filterTextActive : s.filterTextInactive
            ]}>
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={s.loadingText}>Fetching moderation queue…</Text>
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchQueue()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchQueue(true)}
              tintColor="#0F172A"
            />
          }
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="shield-check-outline" size={48} color="#94A3B8" />
              <Text style={s.emptyTitle}>Queue All Clear</Text>
              <Text style={s.emptyDesc}>
                No {filter} moderation reports requiring administrative triage.
              </Text>
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500", marginTop: 1 },

  filterRow: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#0F172A",
  },
  filterBtnInactive: {
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
  },
  filterText: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.3,
  },
  filterTextActive: { color: "#FFFFFF" },
  filterTextInactive: { color: "#64748B" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80, gap: 12 },
  loadingText: { fontSize: 13, color: "#64748B" },
  listContent: { padding: 16, paddingBottom: 120, gap: 12 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 10,
  },
  reportTypeRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 },
  typeIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  reasonText: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  reportedByText: { fontSize: 11, color: "#64748B", marginTop: 1 },
  dateText: { fontSize: 11, color: "#64748B", fontWeight: "500" },

  detailBox: {
    backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 12,
  },
  targetLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: 4 },
  detailsText: { fontSize: 13, color: "#0F172A", fontStyle: "italic", lineHeight: 18 },

  actionRow: {
    flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  dismissBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8,
    borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  dismissText: { color: "#64748B", fontWeight: "700", fontSize: 11 },
  resolveBtn: {
    flex: 1.2, paddingVertical: 9, borderRadius: 8,
    backgroundColor: "#0F172A", alignItems: "center",
  },
  resolveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 11 },
  banBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8,
    borderWidth: 1, borderColor: "#FCA5A5", backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  banText: { color: "#DC2626", fontWeight: "700", fontSize: 11 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 12 },
  emptyDesc: { fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 6, lineHeight: 18 },
});
