/**
 * Admin Issues Tab Screen — Disputes & Mediation List
 */
import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";
const FlashList = ShopifyFlashList as any;

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function IssuesTab() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [activeTab, setActiveTab] = useState("open");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDisputes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get(`/api/disputes`);
      let data = response.data?.data ?? response.data?.disputes ?? response.data ?? [];
      if (!Array.isArray(data)) data = [];
      
      // Filter based on active tab
      data = data.filter((d: any) => {
        if (activeTab === 'open') return d.status === 'open' || d.status === 'responded';
        return d.status === activeTab;
      });
      
      setDisputes(data);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    fetchDisputes();
  }, [fetchDisputes]));

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "resolved": return { bg: "rgba(16, 185, 129, 0.1)", color: "#10B981", icon: "check-circle-outline" };
      case "open": return { bg: "rgba(239, 68, 68, 0.1)", color: "#EF4444", icon: "alert-circle-outline" };
      case "responded": return { bg: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", icon: "message-alert-outline" };
      default: return { bg: T.border, color: T.text3, icon: "help-circle-outline" };
    }
  };

  const tabs = [
    { id: "open", label: "Action Needed" },
    { id: "resolved", label: "Resolved" },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Issues & Disputes</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{activeTab === 'open' && !isLoading ? disputes.length : '-'}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabWrapper}>
        <View style={s.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[s.tabButton, isActive && s.tabButtonActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      {isLoading && !refreshing ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchDisputes()} />
      ) : (
        <View style={s.listContainer}>
          <FlashList
            data={disputes}
            estimatedItemSize={120}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDisputes(true)} colors={[T.primary]} />}
            ListEmptyComponent={() => (
              <View style={s.emptyWrap}>
                <MaterialCommunityIcons name="check-decagram-outline" size={48} color={T.text3} />
                <Text style={s.emptyTitle}>All Clear</Text>
                <Text style={s.emptyDesc}>No active disputes require mediation.</Text>
              </View>
            )}
            renderItem={({ item }: any) => {
              const status = getStatusStyle(item.status);
              return (
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/disputes/${item.id}` as any)}
                  style={[s.itemCard, CARD_SHADOW]}
                  activeOpacity={0.8}
                >
                  <View style={s.itemHeader}>
                    <Text style={s.itemCategory}>{item.type?.toUpperCase() || "DISPUTE"}</Text>
                    <View style={[s.statusTag, { backgroundColor: status.bg }]}>
                      <MaterialCommunityIcons name={status.icon as any} size={12} color={status.color} />
                      <Text style={[s.statusLabel, { color: status.color }]}>{item.status?.toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={s.itemReason} numberOfLines={2}>{item.reason}</Text>

                  <View style={s.itemFooter}>
                    <Text style={s.itemUser}>Claim By: {item.customer?.fullName || "User"}</Text>
                    <Text style={s.itemDate}>{new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: T.text1 },
  badge: { backgroundColor: T.errorBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "800", color: T.error },

  tabWrapper: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  tabContainer: { flexDirection: "row", backgroundColor: T.border, borderRadius: 16, padding: 4 },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12 },
  tabButtonActive: { backgroundColor: T.surface },
  tabText: { fontSize: 13, fontWeight: "700", color: T.text3 },
  tabTextActive: { color: T.text1 },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  
  itemCard: {
    backgroundColor: T.surface, borderRadius: 20, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: T.border,
  },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  itemCategory: { fontSize: 10, fontWeight: "900", color: T.primary, letterSpacing: 1 },
  statusTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusLabel: { fontSize: 9, fontWeight: "800" },
  
  itemReason: { fontSize: 14, fontWeight: "600", color: T.text1, lineHeight: 20, marginBottom: 12 },
  
  itemFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: T.border, paddingTop: 10 },
  itemUser: { fontSize: 11, fontWeight: "700", color: T.text2 },
  itemDate: { fontSize: 11, fontWeight: "600", color: T.text3 },

  emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginTop: 12 },
  emptyDesc: { fontSize: 12, fontWeight: "600", color: T.text3, textAlign: "center", marginTop: 4 },
});
