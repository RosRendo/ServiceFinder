/**
 * Admin Approvals Queue — Premium Deep Navy Redesign (Unified Architecture)
 */
import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
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
      const outer = response.data?.data ?? response.data;
      const items = Array.isArray(outer) ? outer : (outer?.data ?? []);
      setCompanies(items);
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
      await api.patch(`/api/admin/companies/${companyId}/verify`, { status: 'verified' });
      fetchQueue();
    } catch (error) {
      console.error("Approve failed:", error);
    }
  }, [fetchQueue]);

  const handleReject = useCallback(async (companyId: string) => {
    try {
      await api.patch(`/api/admin/companies/${companyId}/verify`, { status: 'rejected' });
      fetchQueue();
    } catch (error) {
      console.error("Reject failed:", error);
    }
  }, [fetchQueue]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "verified": return { bg: T.success + "15", color: T.success, icon: "check-circle-outline" };
      case "pending": return { bg: T.warning + "15", color: T.warning, icon: "clock-alert-outline" };
      case "rejected": return { bg: T.error + "15", color: T.error, icon: "close-circle-outline" };
      default: return { bg: T.bg, color: T.text3, icon: "help-circle-outline" };
    }
  };

  const tabs = [
    { id: "pending", label: t('adminQueue.pending') },
    { id: "verified", label: t('adminQueue.approved') },
    { id: "rejected", label: t('adminQueue.rejected') },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('adminQueue.title')}</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{activeTab === 'pending' && !isLoading ? companies.length : '-'}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[s.tabButton, isActive && s.tabButtonActive]}
            >
              <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Queue Items */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}><ActivityIndicator size="large" color={T.accent} /></View>
      ) : (
        <FlashList
          data={companies}
          keyExtractor={(item) => item.id}
          estimatedItemSize={200}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchQueue(true)} tintColor={T.accent} />}
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color={T.text3} style={{ marginBottom: 16 } as any} />
              <Text style={s.emptyText}>{t('adminQueue.noApplications', { status: activeTab })}</Text>
            </View>
          }
          renderItem={({ item: company }) => {
            const sStyle = getStatusStyle(company.verificationStatus);
            return (
              <TouchableOpacity
                style={s.companyCard}
                onPress={() => router.push(`/(admin)/company/${company.id}` as any)}
                activeOpacity={0.8}
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
                      {company.registrationNumber || t('adminCompanies.noRegId')}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
                    <Text style={[s.statusText, { color: sStyle.color }]}>{company.verificationStatus}</Text>
                  </View>
                </View>

                {/* Cover Image (if submitted) */}
                {company.coverImageUrl && (
                  <Image source={{ uri: company.coverImageUrl }} style={s.coverImage} />
                )}

                {/* Split Body Details */}
                <View style={s.cardBody}>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>Owner</Text>
                    <Text style={s.infoValue} numberOfLines={1}>{company.owner?.fullName || t('adminQueue.unknownOwner')}</Text>
                  </View>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>Contact</Text>
                    <Text style={s.infoValue} numberOfLines={1}>{company.phone || company.email || "N/A"}</Text>
                  </View>
                  <View style={s.infoBlock}>
                    <Text style={s.infoLabel}>Date</Text>
                    <Text style={s.infoValue}>{new Date(company.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>

                {/* Verification Document Badge */}
                {company.verificationDocumentUrl && (
                  <View style={s.docBadgeRow}>
                    <MaterialCommunityIcons name="file-document-outline" size={16} color={T.accentMid} />
                    <Text style={[s.docBadgeText, { color: T.accentMid }]}>
                      {t('adminQueue.docAttached')}
                    </Text>
                  </View>
                )}
                {company.description && (
                  <Text style={s.descriptionText} numberOfLines={2}>{company.description}</Text>
                )}

                {/* Action Buttons for Pending */}
                {activeTab === 'pending' && (
                  <View style={s.actionRow}>
                    <TouchableOpacity
                      style={[s.actionBtn, s.rejectBtn]}
                      onPress={(e) => { e.stopPropagation(); handleReject(company.id); }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={T.error} />
                      <Text style={[s.actionText, { color: T.error }]}>{t('adminQueue.reject')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, s.approveBtn]}
                      onPress={(e) => { e.stopPropagation(); handleApprove(company.id); }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#fff" />
                      <Text style={[s.actionText, { color: "#fff" }]}>{t('adminQueue.approve')}</Text>
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
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  badge: { backgroundColor: T.error, minWidth: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  tabContainer: { flexDirection: "row", backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, paddingHorizontal: 16 },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabButtonActive: { borderBottomColor: T.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: T.text3 },
  tabTextActive: { color: T.accent, fontWeight: "800" },

  listContent: { padding: 16, paddingBottom: 60 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },

  companyCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  logoWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logo: { width: "100%", height: "100%" },
  cardHeaderInfo: { flex: 1 },
  companyName: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 2 },
  regNumber: { fontSize: 13, fontWeight: "500", color: T.text3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  coverImage: { width: "100%", height: 140, borderRadius: 12, marginBottom: 12, backgroundColor: T.bg },
  
  cardBody: { flexDirection: "row", backgroundColor: T.bg, borderRadius: 12, padding: 12, justifyContent: "space-between", marginBottom: 12 },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", color: T.text3, marginBottom: 4, textTransform: "uppercase" },
  infoValue: { fontSize: 13, fontWeight: "700", color: T.text1 },

  docBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.blue + "10", padding: 8, borderRadius: 8, marginBottom: 8 },
  docBadgeText: { fontSize: 12, fontWeight: "700" },
  descriptionText: { fontSize: 13, color: T.text2, fontStyle: "italic", marginTop: 4, backgroundColor: T.bg, padding: 10, borderRadius: 8 },

  actionRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  rejectBtn: { borderColor: T.error + "40", backgroundColor: T.error + "10" },
  approveBtn: { borderColor: T.success, backgroundColor: T.success },
  actionText: { fontSize: 14, fontWeight: "700" },
});
