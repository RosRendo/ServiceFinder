import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNotificationStore, AppNotification } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";

const FlashList = ShopifyFlashList as any;

const CATEGORIES = [
  { key: "all",      label: "All" },
  { key: "dispatch", label: "⚡ Dispatch" },
  { key: "crew",     label: "👷 Crew" },
  { key: "money",    label: "💰 Money" },
  { key: "chat",     label: "💬 Messages" },
];

const TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string; badge: string; category: string }
> = {
  new_booking: {
    icon: "calendar-alert",
    color: "#EF4444",
    bg: "#FEF2F2",
    badge: "URGENT DISPATCH",
    category: "dispatch",
  },
  job_assigned: {
    icon: "truck-fast-outline",
    color: "#0284C7",
    bg: "#E0F2FE",
    badge: "CREW DISPATCH",
    category: "dispatch",
  },
  booking_confirmed: {
    icon: "calendar-check",
    color: "#059669",
    bg: "#ECFDF5",
    badge: "CONFIRMED",
    category: "dispatch",
  },
  booking_cancelled: {
    icon: "calendar-remove",
    color: "#DC2626",
    bg: "#FEF2F2",
    badge: "CANCELLED",
    category: "dispatch",
  },
  job_completed: {
    icon: "check-decagram",
    color: "#059669",
    bg: "#ECFDF5",
    badge: "JOB COMPLETED",
    category: "crew",
  },
  company_verified: {
    icon: "shield-check",
    color: "#0284C7",
    bg: "#E0F2FE",
    badge: "VERIFIED",
    category: "crew",
  },
  payment_received: {
    icon: "cash-check",
    color: "#059669",
    bg: "#ECFDF5",
    badge: "ESCROW RECEIVED",
    category: "money",
  },
  payout_processed: {
    icon: "bank-transfer-out",
    color: "#0A192F",
    bg: "#F1F5F9",
    badge: "PAYOUT CLEARED",
    category: "money",
  },
  dispute_update: {
    icon: "scale-balance",
    color: "#D97706",
    bg: "#FEF3C7",
    badge: "DISPUTE REVIEW",
    category: "money",
  },
  new_message: {
    icon: "message-text-outline",
    color: "#7C3AED",
    bg: "#EDE9FE",
    badge: "MESSAGE",
    category: "chat",
  },
  support_reply: {
    icon: "ticket-confirmation-outline",
    color: "#475569",
    bg: "#F1F5F9",
    badge: "SUPPORT",
    category: "chat",
  },
  review_received: {
    icon: "star",
    color: "#F59E0B",
    bg: "#FEF3C7",
    badge: "FEEDBACK",
    category: "chat",
  },
  system: {
    icon: "bell-outline",
    color: "#64748B",
    bg: "#F8FAFC",
    badge: "SYSTEM",
    category: "all",
  },
};

function formatTimeAgo(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState("all");

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

  const handleRouteNotification = useCallback(
    (item: AppNotification) => {
      if (!item.read) {
        markRead(item.id);
      }

      const role = user?.role || "customer";
      const bookingId =
        item.data?.bookingId ||
        (item.link?.match(/\/bookings?\/(\d+)/)?.[1] ?? null);

      if (bookingId) {
        if (role === "company") {
          router.push(`/(company)/booking/${bookingId}` as any);
        } else if (role === "staff") {
          router.push(`/(staff)/(tabs)/today` as any);
        } else {
          router.push(`/(customer)/booking/${bookingId}` as any);
        }
        return;
      }

      if (item.type === "new_message" || item.type === "support_reply") {
        if (role === "company") {
          router.push(`/(company)/(tabs)/messages` as any);
        } else if (role === "customer") {
          router.push(`/(customer)/(tabs)/messages` as any);
        }
        return;
      }

      if (item.type === "payment_received" || item.type === "payout_processed") {
        if (role === "company") {
          router.push(`/(company)/(tabs)/finance` as any);
        } else if (role === "staff") {
          router.push(`/(staff)/(tabs)/money` as any);
        }
        return;
      }

      if (item.link) {
        try {
          router.push(item.link as any);
        } catch {
          // ignore
        }
      }
    },
    [markRead, router, user?.role]
  );

  const handleLongPress = useCallback(
    (item: AppNotification) => {
      Alert.alert("Notification Options", item.title, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteNotification(item.id),
        },
      ]);
    },
    [deleteNotification]
  );

  const filteredList = notifications.filter((item) => {
    if (activeCategory === "all") return true;
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
    return cfg.category === activeCategory;
  });

  const renderItem = ({ item }: { item: AppNotification }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
    const isUnread = !item.read;

    let actionLabel = "Review Details";
    if (item.type === "new_booking") actionLabel = "Triage & Assign →";
    else if (item.type === "payment_received" || item.type === "payout_processed") actionLabel = "View Ledger →";
    else if (item.type === "new_message") actionLabel = "Reply Message →";

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => handleRouteNotification(item)}
        onLongPress={() => handleLongPress(item)}
        style={[styles.card, isUnread && styles.cardUnread]}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeftWrap}>
            <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
              <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
            </View>
            <View style={[styles.badgePill, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.badge}</Text>
            </View>
          </View>

          <View style={styles.timeWrap}>
            {isUnread && <View style={styles.unreadDot} />}
            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {/* Title & Body Content */}
        <View style={styles.contentWrap}>
          <Text style={[styles.titleText, isUnread && styles.titleTextBold]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.bodyText} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        {/* 1-Tap Action Pill */}
        <View style={styles.cardFooter}>
          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>{actionLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {/* Executive Clean Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#0A192F" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notification Hub</Text>
            <View style={styles.statusRow}>
              <View style={[styles.liveDot, { backgroundColor: connected ? "#10B981" : "#94A3B8" }]} />
              <Text style={styles.statusText}>{connected ? "Real-time stream" : "Synced"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllRead}
              style={styles.textActionBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="check-all" size={16} color="#0284C7" />
              <Text style={styles.textActionLabel}>Read All</Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Clear Notifications", "Remove all notifications?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear All", style: "destructive", onPress: clearAll },
                ]);
              }}
              style={styles.iconActionBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Category Tabs */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveCategory(cat.key)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notification Stream */}
      {loading && notifications.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0A192F" />
        </View>
      ) : (
        <FlashList
          data={filteredList}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          estimatedItemSize={120}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchNotifications}
              tintColor="#0A192F"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCircle}>
                <MaterialCommunityIcons name="bell-check-outline" size={32} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up</Text>
              <Text style={styles.emptySub}>
                No notifications in this category. New events appear in real-time.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0A192F",
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  textActionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#0A192F",
    borderColor: "#0A192F",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContainer: {
    padding: 14,
    paddingBottom: 40,
    gap: 10,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A192F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  cardUnread: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderLeftWidth: 4,
    borderLeftColor: "#0A192F",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeftWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  timeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
  },
  contentWrap: {
    gap: 2,
  },
  titleText: {
    fontSize: 13,
    color: "#1E293B",
  },
  titleTextBold: {
    fontWeight: "800",
    color: "#0F172A",
  },
  bodyText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 2,
  },
  actionBtn: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0A192F",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
