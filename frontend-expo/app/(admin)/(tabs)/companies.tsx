/**
 * Admin Company Kanban Board — Premium Deep Navy Redesign
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Image } from "expo-image";
import { 
  ScrollView, Text, View, TouchableOpacity, TextInput, 
  ActivityIndicator, RefreshControl, StyleSheet, Platform, 
  Alert, Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;
const { width } = Dimensions.get("window");
const COLUMN_WIDTH = width * 0.85;

const COLUMNS = [
  { id: "pending", label: "Pending Setup", icon: "clock-alert-outline", color: T.warning, bg: T.warning + "15" },
  { id: "reviewing", label: "Under Review", icon: "magnify-scan", color: T.blue, bg: T.blue + "15" },
  { id: "verified", label: "Verified Active", icon: "check-decagram", color: T.success, bg: T.success + "15" },
  { id: "rejected", label: "Rejected", icon: "close-circle-outline", color: T.error, bg: T.error + "15" },
];

export default function CompaniesKanban() {
  const router = useRouter();
  const setAdminOpen = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCompanies = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Use admin endpoint to fetch ALL companies including non-verified
      const response = await api.get(`/api/admin/companies?limit=100`);
      // Backend returns { success: true, data: [...], pagination: {} }
      const data = response.data?.data ?? [];
      setCompanies(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchCompanies();
  }, [fetchCompanies]);

  const handleUpdateStatus = async (companyId: string, newStatus: string) => {
    setActionLoadingId(companyId);
    try {
      if (newStatus === "verified") {
        await api.post(`/api/admin/companies/${companyId}/verify`);
      } else if (newStatus === "rejected") {
        await api.post(`/api/admin/companies/${companyId}/reject`, { reason: "Admin moved to rejected" });
      } else {
        // Fallback for custom statuses like 'reviewing' if API supports it via patch
        await api.patch(`/api/admin/companies/${companyId}`, { verificationStatus: newStatus });
      }
      
      // Optimistic update
      setCompanies(prev => prev.map(c => 
        c.id === companyId ? { ...c, verificationStatus: newStatus } : c
      ));
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to move company.");
      fetchCompanies(); // Revert on failure
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    const lowerQ = searchQuery.toLowerCase();
    return companies.filter(c => 
      c.name?.toLowerCase().includes(lowerQ) || 
      c.owner?.fullName?.toLowerCase().includes(lowerQ)
    );
  }, [companies, searchQuery]);

  // Group into columns
  const getColumnData = (status: string) => {
    // If a company has a status not explicitly defined, we might push it to pending.
    return filteredCompanies.filter(c => 
      c.verificationStatus === status || 
      (status === "pending" && !COLUMNS.map(col=>col.id).includes(c.verificationStatus))
    );
  };

  const renderCard = (company: any) => {
    const isActioning = actionLoadingId === company.id;
    return (
      <TouchableOpacity
        key={company.id}
        style={s.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/(admin)/company/${company.id}` as any)}
      >
        <View style={s.cardHeader}>
          <View style={s.logoWrap}>
            {company.logoUrl ? (
              <Image source={{ uri: company.logoUrl }} style={s.logo} />
            ) : (
              <MaterialCommunityIcons name="domain" size={24} color={T.text3} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
            <Text style={s.companyOwner} numberOfLines={1}>Owner: {company.owner?.fullName || 'N/A'}</Text>
          </View>
        </View>

        <View style={s.cardStats}>
          <View style={s.statBox}>
            <MaterialCommunityIcons name="briefcase-outline" size={12} color={T.text3} />
            <Text style={s.statText}>{company._count?.services || 0} Svcs</Text>
          </View>
          <View style={s.statBox}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color={T.text3} />
            <Text style={s.statText}>{company.city || "No City"}</Text>
          </View>
        </View>

        {/* Quick Actions based on status */}
        <View style={s.cardActions}>
          {isActioning ? (
            <View style={{ paddingVertical: 8, alignItems: "center", width: "100%" }}>
              <ActivityIndicator size="small" color={T.accent} />
            </View>
          ) : (
            <>
              {company.verificationStatus === "pending" && (
                <TouchableOpacity style={s.btnPrimary} onPress={() => handleUpdateStatus(company.id, "reviewing")}>
                  <Text style={s.btnPrimaryText}>Start Review</Text>
                </TouchableOpacity>
              )}
              {company.verificationStatus === "reviewing" && (
                <>
                  <TouchableOpacity style={[s.btnGhost, { flex: 1, borderColor: T.error }]} onPress={() => handleUpdateStatus(company.id, "rejected")}>
                    <Text style={[s.btnGhostText, { color: T.error }]}>Reject</Text>
                  </TouchableOpacity>
                  <View style={{ width: 8 }} />
                  <TouchableOpacity style={[s.btnPrimary, { flex: 1, backgroundColor: T.success }]} onPress={() => handleUpdateStatus(company.id, "verified")}>
                    <Text style={[s.btnPrimaryText, { color: "#fff" }]}>Approve</Text>
                  </TouchableOpacity>
                </>
              )}
              {(company.verificationStatus === "verified" || company.verificationStatus === "rejected") && (
                <TouchableOpacity style={[s.btnGhost, { width: "100%" }]} onPress={() => handleUpdateStatus(company.id, "reviewing")}>
                  <Text style={s.btnGhostText}>Move to Review</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => setAdminOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Verification Kanban</Text>
        </View>
        <TouchableOpacity style={s.searchIconBtn}>
          <MaterialCommunityIcons name="magnify" size={24} color={T.text1} />
        </TouchableOpacity>
      </View>

      {/* Global Search */}
      <View style={s.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={20} color={T.text3} />
        <TextInput
          placeholder="Search companies by name or owner..."
          placeholderTextColor={T.text3}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={s.searchInput}
          autoCapitalize="none"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialCommunityIcons name="close-circle" size={18} color={T.text3} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Kanban Board (Horizontal) */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}><ActivityIndicator size="large" color={T.accent} /></View>
      ) : (
        hasError ? (
          <ErrorState onRetry={() => fetchCompanies()} />
        ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          snapToInterval={COLUMN_WIDTH + 16}
          decelerationRate="fast"
          contentContainerStyle={s.kanbanBoard}
        >
          {COLUMNS.map((col) => {
            const colData = getColumnData(col.id);
            return (
              <View key={col.id} style={s.columnWrap}>
                <View style={s.columnHeader}>
                  <View style={s.colTitleRow}>
                    <View style={[s.colIconBox, { backgroundColor: col.bg }]}>
                      <MaterialCommunityIcons name={col.icon as any} size={16} color={col.color} />
                    </View>
                    <Text style={s.colTitle}>{col.label}</Text>
                  </View>
                  <View style={s.colCountBadge}>
                    <Text style={s.colCountText}>{colData.length}</Text>
                  </View>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={s.columnContent}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCompanies(true)} tintColor={T.accent} />}
                >
                  {colData.map(renderCard)}
                  {colData.length === 0 && (
                    <View style={s.emptyCol}>
                      <MaterialCommunityIcons name="inbox-outline" size={32} color={T.text3} />
                      <Text style={s.emptyColText}>No companies here</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      ))}
    </SafeAreaView>
  );
}

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  searchIconBtn: { padding: 4 },

  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.surface,
    marginHorizontal: 16, marginTop: 16, paddingHorizontal: 16, borderRadius: 16, height: 48,
    borderWidth: 1, borderColor: T.border,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: T.text1, fontWeight: "500" },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  kanbanBoard: { padding: 16, gap: 16, paddingBottom: 40 },
  
  columnWrap: { 
    width: COLUMN_WIDTH, 
    backgroundColor: T.surface, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: T.border,
    overflow: "hidden",
    maxHeight: "100%",
  },
  columnHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  colTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  colIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  colTitle: { fontSize: 15, fontWeight: "700", color: T.text1 },
  colCountBadge: { backgroundColor: T.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  colCountText: { fontSize: 12, fontWeight: "700", color: T.text2 },

  columnContent: { padding: 12, gap: 12, paddingBottom: 24 },

  emptyCol: { paddingVertical: 40, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyColText: { fontSize: 13, fontWeight: "600", color: T.text3 },

  card: { backgroundColor: T.bg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  logoWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },
  logo: { width: "100%", height: "100%", borderRadius: 12 },
  companyName: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 2 },
  companyOwner: { fontSize: 12, fontWeight: "500", color: T.text3 },
  
  cardStats: { flexDirection: "row", gap: 16, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  statBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: T.text2, fontWeight: "600" },

  cardActions: { flexDirection: "row", alignItems: "center" },
  btnPrimary: { flex: 1, backgroundColor: T.accent, paddingVertical: 10, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  btnGhost: { paddingVertical: 10, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },
  btnGhostText: { color: T.text2, fontSize: 13, fontWeight: "700" },
});
