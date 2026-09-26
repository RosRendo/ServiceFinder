import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNotificationStore, AppNotification, NotificationType } from "@/store/notificationStore";
import { Theme } from "@/constants/theme";
import { EmptyNotificationsSvg } from "@/components/svg";
const FlashList = ShopifyFlashList as any;

const T = Theme.colors;

const SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 3 },
});

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  new_booking:       { icon: "calendar-plus",           color: "#1d4ed8", bg: "#dbeafe" },
  booking_confirmed: { icon: "calendar-check",          color: "#059669", bg: "#d1fae5" },
  booking_cancelled: { icon: "calendar-remove",         color: "#dc2626", bg: "#fee2e2" },
  payment_received:  { icon: "cash-check",              color: "#059669", bg: "#d1fae5" },
  new_message:       { icon: "message-text",            color: "#7c3aed", bg: "#ede9fe" },
  job_assigned:      { icon: "briefcase-arrow-left-right", color: "#d97706", bg: "#fef3c7" },
  job_completed:     { icon: "briefcase-check",         color: "#059669", bg: "#d1fae5" },
  dispute_update:    { icon: "scale-balance",           color: "#dc2626", bg: "#fee2e2" },
  payout_processed:  { icon: "bank-transfer",           color: "#059669", bg: "#d1fae5" },
  company_verified:  { icon: "shield-check",            color: "#1d4ed8", bg: "#dbeafe" },
  review_received:   { icon: "star",                    color: "#d97706", bg: "#fef3c7" },
  support_reply:     { icon: "ticket-confirmation",     color: "#6b7280", bg: "#f3f4f6" },
  system:            { icon: "bell",                    color: "#6b7280", bg: "#f3f4f6" },
};

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
    connected,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handlePressItem = useCallback((item: AppNotification) => {
    if (!item.read) {
      markRead(item.id);
    }
    if (item.link) {
      // Map e.g. /bookings/79 -> /(customer)/booking/79
      const bookingMatch = item.link.match(/\/bookings\/(\d+)/);
      if (bookingMatch) {
        router.push(`/(customer)/booking/${bookingMatch[1]}` as any);
      } else {
        try {
          router.push(item.link as any);
        } catch {}
      }
    }
  }, [markRead, router]);

  const handleLongPressItem = useCallback((item: AppNotification) => {
    Alert.alert("Delete Notification", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNotification(item.id) },
    ]);
  }, [deleteNotification]);

  const renderItem = ({ item }: { item: AppNotification }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handlePressItem(item)}
        onLongPress={() => handleLongPressItem(item)}
        style={[s.itemRow, !item.read && s.itemUnread]}
      >
        {/* Avatar/Icon */}
        <View style={s.itemIconWrap}>
          <View style={[s.iconBox, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
          </View>
          {!item.read && <View style={s.unreadDot} />}
        </View>

        {/* Content */}
        <View style={s.itemContent}>
          <View style={s.itemHeader}>
            <Text style={[s.itemTitle, !item.read && s.itemTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={s.itemTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={s.itemBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={s.backBtn} 
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
        </TouchableOpacity>

        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={[s.liveIndicator, connected ? s.liveIndicatorActive : s.liveIndicatorOff]}>
            <View style={[s.liveDot, connected ? s.liveDotActive : s.liveDotOff]} />
            <Text style={[s.liveText, connected ? s.liveTextActive : s.liveTextOff]}>
              {connected ? "LIVE" : "SYNCED"}
            </Text>
          </View>
        </View>

        <View style={s.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity 
              onPress={markAllRead} 
              style={s.actionBtn} 
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <MaterialCommunityIcons name="check-all" size={22} color={T.accent} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity 
              onPress={clearAll} 
              style={s.actionBtn} 
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Clear all notifications"
            >
              <MaterialCommunityIcons name="delete-sweep-outline" size={22} color={T.text3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Unread count banner */}
      {unreadCount > 0 && (
        <TouchableOpacity onPress={markAllRead} style={[s.unreadBanner, SHADOW]} activeOpacity={0.9}>
          <View style={s.unreadBadge}>
            <Text style={s.unreadBadgeText}>{unreadCount}</Text>
          </View>
          <Text style={s.unreadBannerText}>
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </Text>
          <Text style={s.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      )}

      {/* List */}
      {loading && notifications.length === 0 ? (
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <FlashList
          data={notifications}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchNotifications}
              tintColor={T.accent}
              colors={[T.accent]}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={{ marginBottom: 20 }}>
                <EmptyNotificationsSvg size={105} />
              </View>
              <Text style={s.emptyTitle}>All caught up!</Text>
              <Text style={s.emptyDesc}>
                You have no notifications right now. New events will appear here in real-time.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  // Live indicator
  liveIndicator: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  liveIndicatorActive: { backgroundColor: "#d1fae5" },
  liveIndicatorOff: { backgroundColor: "#f3f4f6" },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveDotActive: { backgroundColor: "#059669" },
  liveDotOff: { backgroundColor: "#9ca3af" },
  liveText: { fontSize: 10, fontWeight: "700" },
  liveTextActive: { color: "#065f46" },
  liveTextOff: { color: "#6b7280" },

  // Unread banner
  unreadBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: T.surface, marginHorizontal: 16, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
  },
  unreadBadge: {
    backgroundColor: T.accent, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  unreadBannerText: { flex: 1, fontSize: 13, color: T.text2, fontWeight: "500" },
  markAllText: { fontSize: 13, color: T.accent, fontWeight: "700" },

  // List
  listContent: { paddingVertical: 8 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 60 },

  // Item row
  itemRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  itemUnread: { backgroundColor: "#F0F7FF" },
  itemIconWrap: { position: "relative" },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  unreadDot: {
    position: "absolute", top: -2, right: -2,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: T.accent, borderWidth: 1.5, borderColor: "#fff",
  },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: T.text1, flex: 1, marginRight: 8 },
  itemTitleUnread: { fontWeight: "800", color: T.text1 },
  itemTime: { fontSize: 11, color: T.text3, fontWeight: "500" },
  itemBody: { fontSize: 13, color: T.text2, lineHeight: 18 },

  // Empty state
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: T.text3, textAlign: "center", lineHeight: 20 },
});
