/**
 * Admin Approvals Queue — Premium Light Redesign
 */
import React, { useState, useCallback } from "react";
import { Image } from "expo-image";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
const FlashList = ShopifyFlashList as any;

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function Queue() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("pending");
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get(`/api/admin/companies?status=${activeTab}`);
      // Backend returns { success: true, data: [...], pagination: {} }
      const data = response.data?.data ?? [];
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);


  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    fetchQueue();
  }, [fetchQueue]));

  const handleApprove = useCallback(async (companyId: string) => {
    try {
      await api.post(`/api/admin/companies/${companyId}/verify`);
      fetchQueue();
    } catch (error) {
      console.error("Approve failed:", error);
    }
  }, [fetchQueue]);

  const handleReject = useCallback(async (companyId: string) => {
    try {
      await api.post(`/api/admin/companies/${companyId}/reject`, { reason: "Admin rejected" });
      fetchQueue();
    } catch (error) {
      console.error("Reject failed:", error);
    }
  }, [fetchQueue]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "verified": return { bg: "rgba(16, 185, 129, 0.1)", color: "#10B981", icon: "check-circle-outline" };
      case "pending": return { bg: "rgba(245, 158, 11, 0.1)", color: "#F59E0B", icon: "clock-alert-outline" };
      case "rejected": return { bg: "rgba(239, 68, 68, 0.1)", color: "#EF4444", icon: "close-circle-outline" };
      default: return { bg: T.border, color: T.text3, icon: "help-circle-outline" };
    }
  };

  const tabs = [
    { id: "pending", label: "Pending" },
    { id: "verified", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Approvals</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{activeTab === 'pending' && !isLoading ? companies.length : '-'}</Text>
        </View>
      </View>

      {/* Tabs - Premium Segmented Control */}
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
          data={companies}
          keyExtractor={(item: any) => item.id}
          estimatedItemSize={250}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchQueue(true)} tintColor={T.primary} />}
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="check-decagram" size={48} color={T.primary} />
              </View>
              <Text style={s.emptyText}>All Caught Up</Text>
              <Text style={s.emptySubText}>No {activeTab} applications found.</Text>
            </View>
          }
          renderItem={({ item: company, index }: any) => {
            const sStyle = getStatusStyle(company.verificationStatus);
            return (
              <TouchableOpacity
                style={s.companyCard}
                onPress={() => router.push(`/(admin)/company/${company.id}` as any)}
                activeOpacity={0.9}
              >
                  <View style={s.cardHeader}>
                    <View style={s.logoWrap}>
                      {company.logoUrl ? (
                        <Image source={{ uri: company.logoUrl }} style={s.logo} />
                      ) : (
                        <MaterialCommunityIcons name="domain" size={24} color={T.text3} />
                      )}
                    </View>
                    <View style={s.cardHeaderInfo}>
                      <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
                      <Text style={s.regNumber} numberOfLines={1}>
                        Reg: {company.registrationNumber || 'N/A'}
                      </Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
                      <MaterialCommunityIcons name={sStyle.icon as any} size={14} color={sStyle.color} style={{ marginRight: 4 }} />
                      <Text style={[s.statusText, { color: sStyle.color }]}>{company.verificationStatus}</Text>
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="account-outline" size={16} color={T.text3} />
                      <Text style={s.infoText} numberOfLines={1}>{company.owner?.fullName || 'Unknown Owner'}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="phone-outline" size={16} color={T.text3} />
                      <Text style={s.infoText} numberOfLines={1}>{company.phone || company.email || "No Contact"}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="calendar-outline" size={16} color={T.text3} />
                      <Text style={s.infoText}>{new Date(company.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  {company.verificationDocumentUrl && (
                    <View style={s.docBadgeRow}>
                      <MaterialCommunityIcons name="file-document-outline" size={16} color={T.blue} />
                      <Text style={s.docBadgeText}>Identity Document Provided</Text>
                    </View>
                  )}

                  {activeTab === 'pending' && (
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={[s.actionBtn, s.rejectBtn]}
                        onPress={(e) => { e.stopPropagation(); handleReject(company.id); }}
                        activeOpacity={0.8}
                      >
                        <Text style={s.rejectText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, s.approveBtn]}
                        onPress={(e) => { e.stopPropagation(); handleApprove(company.id); }}
                        activeOpacity={0.8}
                      >
                        <Text style={s.approveText}>Verify Business</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: T.bg,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },
  badge: { backgroundColor: T.error, minWidth: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  tabWrapper: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: T.bg },
  tabContainer: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabButtonActive: { backgroundColor: T.primary, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tabText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  tabTextActive: { color: "#FFFFFF", fontWeight: "700" },

  listContent: { padding: 20, paddingBottom: 100 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 100 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(10, 25, 47, 0.05)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptySubText: { fontSize: 15, color: T.text2 },

  companyCard: { backgroundColor: T.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  logoWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: T.border },
  logo: { width: "100%", height: "100%" },
  cardHeaderInfo: { flex: 1 },
  companyName: { fontSize: 18, fontWeight: "800", color: T.text1, marginBottom: 4, letterSpacing: -0.3 },
  regNumber: { fontSize: 13, fontWeight: "500", color: T.text3 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignSelf: "flex-start" },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  
  cardBody: { backgroundColor: T.bg, borderRadius: 16, padding: 16, gap: 12, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoText: { fontSize: 14, fontWeight: "600", color: T.text2, flex: 1 },

  docBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(37, 99, 235, 0.05)", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(37, 99, 235, 0.1)" },
  docBadgeText: { fontSize: 13, fontWeight: "700", color: T.blue },

  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  rejectBtn: { borderColor: "rgba(239, 68, 68, 0.2)", backgroundColor: "rgba(239, 68, 68, 0.05)" },
  approveBtn: { borderColor: T.primary, backgroundColor: T.primary },
  rejectText: { fontSize: 14, fontWeight: "700", color: T.error },
  approveText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
