import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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
      setItems(res.data?.data || res.data || []);
    } catch (err) {
      setItems([]);
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
      `Are you sure you want to ${action} this report?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          style: action === "ban" ? "destructive" : "default",
          onPress: async () => {
            try {
              await api.post(`/api/admin/moderation/${id}/action`, { action });
              setItems(prev => prev.filter(item => item.id !== id));
            } catch (err) {
              Alert.alert("Error", "Failed to apply action.");
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
            <MaterialCommunityIcons name={getTypeIcon(item.type)} size={18} color={T.error} />
          </View>
          <View>
            <Text style={s.reasonText}>{item.reason}</Text>
            <Text style={s.reportedByText}>Reported by {item.reportedBy.name}</Text>
          </View>
        </View>
        <Text style={s.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={s.detailBox}>
        <Text style={s.targetLabel}>Target: {item.targetName}</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Content Moderation</Text>
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
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        hasError ? (
          <ErrorState onRetry={() => fetchQueue()} />
        ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchQueue(true)} tintColor={T.primary} />}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="shield-check" size={48} color={T.text3} />
              <Text style={s.emptyTitle}>All Clear!</Text>
              <Text style={s.emptyDesc}>
                No {filter} moderation reports found.
              </Text>
            </View>
          }
        />
      ))}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    ...CARD_SHADOW,
  },
  filterBtnActive: {
    backgroundColor: T.primary,
  },
  filterBtnInactive: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  filterTextInactive: {
    color: T.text2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reportTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.errorBg,
    alignItems: "center",
    justifyContent: "center",
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "700",
    color: T.text1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reportedByText: {
    fontSize: 11,
    color: T.text3,
    fontWeight: "600",
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: T.text2,
    fontWeight: "600",
  },
  detailBox: {
    backgroundColor: T.bg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: T.text1,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 13,
    color: T.text2,
    fontStyle: "italic",
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 12,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    backgroundColor: T.bg,
  },
  dismissText: {
    color: T.text2,
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
  },
  resolveBtn: {
    flex: 1.2,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: T.primary,
    alignItems: "center",
    ...CARD_SHADOW,
  },
  resolveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
  },
  banBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: T.error,
    alignItems: "center",
    ...CARD_SHADOW,
  },
  banText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: T.text3,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});
