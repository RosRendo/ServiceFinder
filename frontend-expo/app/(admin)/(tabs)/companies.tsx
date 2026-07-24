/**
 * Admin Companies List — Premium Deep Navy Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import { Theme } from "@/constants/theme";

const T = Theme.colors;



export default function Companies() {
  const router = useRouter();
  const setAdminOpen = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { id: "all", label: t('adminCompanies.allCompanies') },
    { id: "verified", label: t('adminCompanies.verified') },
    { id: "pending", label: t('adminCompanies.pending') },
    { id: "rejected", label: t('adminCompanies.rejected') },
  ];

  const fetchCompanies = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const queryParams = new URLSearchParams();
      if (activeFilter !== "all") queryParams.append("status", activeFilter);
      if (searchQuery) queryParams.append("search", searchQuery);

      const response = await api.get(`/api/companies?${queryParams.toString()}`);
      const responseData = response.data.data || response.data;
      setCompanies(responseData.companies || []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => fetchCompanies(), 400);
    return () => clearTimeout(timer);
  }, [activeFilter, searchQuery, fetchCompanies]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "verified": return { bg: T.success + "15", color: T.success, icon: "check-decagram" };
      case "pending": return { bg: T.warning + "15", color: T.warning, icon: "clock-alert-outline" };
      case "rejected": return { bg: T.error + "15", color: T.error, icon: "close-circle-outline" };
      default: return { bg: T.bg, color: T.text3, icon: "help-circle-outline" };
    }
  };

  const handleQuickAction = async (companyId: string, action: 'verify' | 'reject') => {
    try {
      if (action === 'verify') {
        await api.post(`/api/admin/companies/${companyId}/verify`);
      } else {
        await api.post(`/api/admin/companies/${companyId}/reject`, { reason: "Rejected by admin" });
      }
      fetchCompanies();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Action failed");
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity 
            onPress={() => setAdminOpen(true)} 
            style={s.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('adminCompanies.title')}</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={s.filtersContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={T.text3} />
          <TextInput
            placeholder={t('adminCompanies.searchPlaceholder')}
            placeholderTextColor={T.text3}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={T.text3} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChips}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={[s.filterChip, isActive && s.filterChipActive]}
              >
                <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>{filter.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}><ActivityIndicator size="large" color={T.accent} /></View>
      ) : (
        <FlashList
          data={companies}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCompanies(true)} tintColor={T.accent} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="office-building" size={48} color={T.text3} style={{ marginBottom: 16 } as any} />
              <Text style={s.emptyText}>{t('adminCompanies.noCompanies')}</Text>
              {searchQuery ? <Text style={s.emptySubText}>{t('adminCompanies.adjustSearch')}</Text> : null}
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
                      <MaterialCommunityIcons name="domain" size={28} color={T.text3} />
                    )}
                  </View>
                  <View style={s.cardHeaderInfo}>
                    <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
                    <Text style={s.regNumber} numberOfLines={1}>
                      {company.registrationNumber || t('adminCompanies.noRegId')}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
                    <MaterialCommunityIcons name={sStyle.icon as any} size={14} color={sStyle.color} style={{ marginRight: 4 }} />
                    <Text style={[s.statusText, { color: sStyle.color }]}>{company.verificationStatus}</Text>
                  </View>
                </View>

                <View style={s.cardBody}>
                  <View style={[s.infoBlock, { flex: 1.5 }]}>
                    <Text style={s.infoLabel}>{t('adminCompanies.owner')}</Text>
                    <Text style={s.infoValue} numberOfLines={1}>{company.owner?.fullName || t('adminCompanies.na')}</Text>
                  </View>
                  <View style={[s.infoBlock, { flex: 0.8 }]}>
                    <Text style={s.infoLabel}>{t('adminCompanies.services')}</Text>
                    <Text style={s.infoValue}>{company._count?.services || 0}</Text>
                  </View>
                  <View style={[s.infoBlock, { flex: 1 }]}>
                    <Text style={s.infoLabel}>{t('adminCompanies.city')}</Text>
                    <Text style={s.infoValue} numberOfLines={1}>{company.city || t('adminCompanies.na')}</Text>
                  </View>
                </View>

                {/* Quick Actions for Pending Companies */}
                {company.verificationStatus === 'pending' && (
                  <View style={s.quickActions}>
                    <TouchableOpacity
                      style={s.quickBtnReject}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        Alert.alert(
                          t('adminCompanies.rejectCompany'),
                          t('adminCompanies.rejectConfirm', { name: company.name }),
                          [
                            { text: t('adminCompanies.cancel'), style: "cancel" },
                            { text: t('adminCompanies.reject'), style: "destructive", onPress: () => handleQuickAction(company.id, 'reject') }
                          ]
                        );
                      }}
                    >
                      <MaterialCommunityIcons name="close" size={14} color="#EF4444" />
                      <Text style={s.quickBtnRejectText}>{t('adminCompanies.reject')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.quickBtnApprove}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        Alert.alert(
                          t('adminCompanies.approveCompany'),
                          t('adminCompanies.approveConfirm', { name: company.name }),
                          [
                            { text: t('adminCompanies.cancel'), style: "cancel" },
                            { text: t('adminCompanies.approve'), onPress: () => handleQuickAction(company.id, 'verify') }
                          ]
                        );
                      }}
                    >
                      <MaterialCommunityIcons name="check" size={14} color="#10B981" />
                      <Text style={s.quickBtnApproveText}>{t('adminCompanies.approve')}</Text>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },

  filtersContainer: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.bg,
    marginHorizontal: 16, marginTop: 16, paddingHorizontal: 16, borderRadius: 16, height: 48,
    borderWidth: 1, borderColor: T.border,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: T.text1, fontWeight: "500" },
  filterChips: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  filterChipText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  filterChipTextActive: { color: "#fff" },

  listContent: { padding: 16, gap: 16, paddingBottom: 60 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center", paddingHorizontal: 32 },

  companyCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border , ...CARD_SHADOW },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  logoWrap: { width: 52, height: 52, borderRadius: 12, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logo: { width: "100%", height: "100%" },
  cardHeaderInfo: { flex: 1 },
  companyName: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 2 },
  regNumber: { fontSize: 13, fontWeight: "500", color: T.text3 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  cardBody: { flexDirection: "row", backgroundColor: T.bg, borderRadius: 12, padding: 12, gap: 8 },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", color: T.text3, marginBottom: 4, textTransform: "uppercase" },
  infoValue: { fontSize: 14, fontWeight: "700", color: T.text1 },

  quickActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  quickBtnReject: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(239,68,68,0.06)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  quickBtnRejectText: { fontSize: 12, fontWeight: "700", color: T.error },
  quickBtnApprove: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(16,185,129,0.06)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" },
  quickBtnApproveText: { fontSize: 12, fontWeight: "700", color: T.success },
});

