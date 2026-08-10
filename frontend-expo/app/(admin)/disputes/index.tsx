/**
 * Admin Disputes List — Premium Deep Navy Redesign
 */
import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { Theme } from "@/constants/theme";
const FlashList = ShopifyFlashList as any;

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function DisputesList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("open");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          <TouchableOpacity onPress={() => router.back()} style={s.menuBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Disputes Center</Text>
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

      {/* Queue Items */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}><ActivityIndicator size="large" color={T.primary} /></View>
      ) : (
        <FlashList
          data={disputes}
          keyExtractor={(item: any) => item.id.toString()}
          estimatedItemSize={200}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDisputes(true)} tintColor={T.primary} />}
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="shield-check" size={48} color={T.primary} />
              </View>
              <Text style={s.emptyText}>All Clear</Text>
              <Text style={s.emptySubText}>No {activeTab} disputes found.</Text>
            </View>
          }
          renderItem={({ item: dispute }: any) => {
            const sStyle = getStatusStyle(dispute.status);
            return (
              <TouchableOpacity
                style={s.disputeCard}
                onPress={() => router.push(`/(admin)/disputes/${dispute.id}` as any)}
                activeOpacity={0.9}
              >
                  <View style={s.cardHeader}>
                    <View style={s.cardHeaderInfo}>
                      <Text style={s.disputeType} numberOfLines={1}>{dispute.type?.replace(/_/g, ' ')?.toUpperCase()}</Text>
                      <Text style={s.disputeId} numberOfLines={1}>
                        ID: #{dispute.id}
                      </Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
                      <MaterialCommunityIcons name={sStyle.icon as any} size={14} color={sStyle.color} style={{ marginRight: 4 }} />
                      <Text style={[s.statusText, { color: sStyle.color }]}>{dispute.status}</Text>
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <Text style={s.disputeDesc} numberOfLines={2}>{dispute.description}</Text>
                    
                    <View style={s.divider} />
                    
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="account-outline" size={16} color={T.text3} />
                      <Text style={s.infoText} numberOfLines={1}>{dispute.customer?.fullName || 'Unknown Customer'}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="office-building-outline" size={16} color={T.text3} />
                      <Text style={s.infoText} numberOfLines={1}>{dispute.company?.name || "Unknown Company"}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="currency-usd" size={16} color={T.text3} />
                      <Text style={s.infoText}>Booking Value: ${Number(dispute.booking?.totalPrice || 0).toFixed(2)}</Text>
                    </View>
                  </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  menuBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: T.text1, fontFamily: 'KantumruyPro-Bold' },
  badge: { backgroundColor: T.error + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: T.error + '30' },
  badgeText: { color: T.error, fontWeight: '800', fontSize: 14, fontFamily: 'KantumruyPro-Bold' },
  
  tabWrapper: { backgroundColor: T.surface, paddingHorizontal: 20, paddingBottom: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: T.bg, padding: 4, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: T.surface, ...CARD_SHADOW },
  tabText: { fontSize: 14, fontWeight: '600', color: T.text3, fontFamily: 'KantumruyPro-SemiBold' },
  tabTextActive: { color: T.primary, fontWeight: '700' },
  
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 100 },
  
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: T.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: '700', color: T.text1, marginBottom: 8, fontFamily: 'KantumruyPro-Bold' },
  emptySubText: { fontSize: 15, color: T.text3, textAlign: 'center' },
  
  disputeCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    ...CARD_SHADOW,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderInfo: { flex: 1, marginRight: 12 },
  disputeType: { fontSize: 16, fontWeight: '700', color: T.text1, fontFamily: 'KantumruyPro-Bold' },
  disputeId: { fontSize: 13, color: T.text3, marginTop: 2, fontFamily: 'KantumruyPro-Medium' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize', fontFamily: 'KantumruyPro-Bold' },
  
  cardBody: {},
  disputeDesc: { fontSize: 14, color: T.text2, lineHeight: 20, marginBottom: 12 },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: T.text2, marginLeft: 8, flex: 1 },
});
