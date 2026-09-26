import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";
import { EmptyNotificationsSvg } from "@/components/svg";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  booking_confirmed:  { icon: "check-circle",          color: "#10b981", bg: "#d1fae5" },
  booking_cancelled:  { icon: "close-circle",           color: "#ef4444", bg: "#fee2e2" },
  booking_assigned:   { icon: "account-check",          color: "#2563eb", bg: "#dbeafe" },
  payment_success:    { icon: "cash-check",             color: "#10b981", bg: "#d1fae5" },
  payment_failed:     { icon: "cash-remove",            color: "#ef4444", bg: "#fee2e2" },
  message:            { icon: "message-text",           color: "#3b82f6", bg: "#dbeafe" },
  review:             { icon: "star",                   color: "#f59e0b", bg: "#fef3c7" },
  promotion:          { icon: "tag",                    color: "#8b5cf6", bg: "#ede9fe" },
  system:             { icon: "bell",                   color: "#64748b", bg: "#f1f5f9" },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.system;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get("/api/notifications");
      const data = res.data?.data ?? res.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert("Error", "Could not load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      Alert.alert("Error", "Failed to mark all as read.");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      Alert.alert("Error", "Failed to delete notification.");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item }: { item: Notification }) => {
    const cfg = getConfig(item.type);
    return (
      <Pressable
        onPress={() => { if (!item.isRead) markAsRead(item.id); }}
        style={({ pressed }) => [s.card, !item.isRead && s.cardUnread, pressed && { opacity: 0.85 }]}
      >
        {!item.isRead && <View style={s.unreadDot} />}
        <View style={[s.iconWrap, { backgroundColor: cfg.bg }]}>
          <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={s.textWrap}>
          <Text style={[s.title, !item.isRead && s.titleBold]} numberOfLines={1}>{item.title}</Text>
          <Text style={s.body} numberOfLines={2}>{item.body}</Text>
          <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Delete", "Remove this notification?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteNotification(item.id) },
            ])
          }
          style={s.deleteBtn} hitSlop={8}
        >
          <MaterialCommunityIcons name="close" size={16} color={T.text3} />
        </TouchableOpacity>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} style={s.markAllBtn} activeOpacity={0.8}>
            <Text style={s.markAllText}>Read all</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 72 }} />}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={T.accent} style={{ marginTop: 60 }} />
      ) : notifications.length === 0 ? (
        <View style={s.empty}>
          <View style={{ marginBottom: 16 }}>
            <EmptyNotificationsSvg size={105} />
          </View>
          <Text style={s.emptyTitle}>All caught up!</Text>
          <Text style={s.emptyDesc}>You have no notifications right now.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} tintColor={T.accent} />}
          ItemSeparatorComponent={() => <View style={s.sep} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  countBadge: { backgroundColor: T.accent, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  markAllText: { fontSize: 13, fontWeight: "700", color: T.accent },
  list: { paddingVertical: 8, paddingHorizontal: 16, paddingBottom: 40 },
  sep: { height: 1, backgroundColor: T.border, marginLeft: 72 },
  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    marginVertical: 4, borderWidth: 1, borderColor: T.border,
    position: "relative", ...CARD_SHADOW,
  },
  cardUnread: { borderColor: T.accent + "40" },
  unreadDot: { position: "absolute", top: 16, left: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: T.accent },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: "600", color: T.text1 },
  titleBold: { fontWeight: "800" },
  body: { fontSize: 13, color: T.text2, lineHeight: 19 },
  time: { fontSize: 11, color: T.text3, marginTop: 4, fontWeight: "600" },
  deleteBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: T.bg, flexShrink: 0 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIconBox: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: T.surface, alignItems: "center", justifyContent: "center",
    marginBottom: 24, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: T.text3, textAlign: "center", lineHeight: 22 },
});