/**
 * Admin Company Verification & Directory — Quiet Luxury System
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Image } from "expo-image";
import { 
  ScrollView, Text, View, TouchableOpacity, TextInput, 
  ActivityIndicator, StyleSheet, Platform, Alert, Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";
import { MobileStatusPill } from "@/components/admin/ManagementCard";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;
const { width } = Dimensions.get("window");
const COLUMN_WIDTH = width * 0.85;

const COLUMNS = [
  { id: "pending", label: "Pending Review", icon: "clock-outline" },
  { id: "reviewing", label: "Under Review", icon: "file-document-outline" },
  { id: "verified", label: "Verified Active", icon: "check-circle-outline" },
  { id: "rejected", label: "Rejected / Inactive", icon: "close-circle-outline" },
];

export default function CompaniesKanban() {
  const router = useRouter();
  const setAdminOpen = useSidebarStore((s) => s.setAdminOpen);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCompanies = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get(`/api/admin/companies?limit=100`);
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
        await api.post(`/api/admin/companies/${companyId}/reject`, { reason: "Admin rejected provider credentials" });
      } else {
        await api.patch(`/api/admin/companies/${companyId}`, { verificationStatus: newStatus });
      }
      
      setCompanies(prev => prev.map(c => 
        c.id === companyId ? { ...c, verificationStatus: newStatus } : c
      ));
    } catch (error: any) {
      Alert.alert("Action Failed", error.response?.data?.message || "Failed to update company verification status.");
      fetchCompanies();
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    const lowerQ = searchQuery.toLowerCase();
    return companies.filter(c => 
      c.name?.toLowerCase().includes(lowerQ) || 
      c.owner?.fullName?.toLowerCase().includes(lowerQ) ||
      c.city?.toLowerCase().includes(lowerQ)
    );
  }, [companies, searchQuery]);

  const getColumnData = (status: string) => {
    return filteredCompanies.filter(c => 
      c.verificationStatus === status || 
      (status === "pending" && !COLUMNS.map(col => col.id).includes(c.verificationStatus))
    );
  };

  const renderCard = (company: any) => {
    const isActioning = actionLoadingId === company.id;
    return (
      <TouchableOpacity
        key={company.id}
        style={s.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/(admin)/company/${company.id}` as any)}
      >
        <View style={s.cardHeader}>
          <View style={s.logoWrap}>
            {company.logoUrl ? (
              <Image source={{ uri: company.logoUrl }} style={s.logo} />
            ) : (
              <MaterialCommunityIcons name="domain" size={20} color={T.mgmtTextSecondary || T.text3} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.nameRow}>
              <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
              <MobileStatusPill status={company.verificationStatus || "neutral"} />
            </View>
            <Text style={s.companyOwner} numberOfLines={1}>Owner: {company.owner?.fullName || "Unclaimed"}</Text>
          </View>
        </View>

        <View style={s.cardStats}>
          <View style={s.statBox}>
            <MaterialCommunityIcons name="briefcase-outline" size={13} color={T.mgmtTextSecondary || T.text3} />
            <Text style={s.statText}>{company._count?.services || 0} Services</Text>
          </View>
          <View style={s.statBox}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={T.mgmtTextSecondary || T.text3} />
            <Text style={s.statText}>{company.city || "Remote"}</Text>
          </View>
        </View>

        <View style={s.cardActions}>
          {isActioning ? (
            <View style={{ paddingVertical: 8, alignItems: "center", width: "100%" }}>
              <ActivityIndicator size="small" color={T.text1} />
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
                  <TouchableOpacity style={s.btnGhost} onPress={() => handleUpdateStatus(company.id, "rejected")}>
                    <Text style={s.btnGhostText}>Reject</Text>
                  </TouchableOpacity>
                  <View style={{ width: 8 }} />
                  <TouchableOpacity style={s.btnPrimary} onPress={() => handleUpdateStatus(company.id, "verified")}>
                    <Text style={s.btnPrimaryText}>Approve</Text>
                  </TouchableOpacity>
                </>
              )}
              {(company.verificationStatus === "verified" || company.verificationStatus === "rejected") && (
                <TouchableOpacity style={s.btnGhostFull} onPress={() => handleUpdateStatus(company.id, "reviewing")}>
                  <Text style={s.btnGhostText}>Re-open Review</Text>
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
            <MaterialCommunityIcons name="menu" size={24} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Verification Queue</Text>
        </View>
      </View>

      {/* Global Search */}
      <View style={s.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color={T.mgmtTextSecondary || T.text3} />
        <TextInput
          placeholder="Search by company, owner, or city..."
          placeholderTextColor={T.mgmtTextSecondary || T.text3}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={s.searchInput}
          autoCapitalize="none"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialCommunityIcons name="close-circle" size={16} color={T.text3} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Kanban Board */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="small" color={T.text1} />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchCompanies()} />
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          snapToInterval={COLUMN_WIDTH + 12}
          decelerationRate="fast"
          contentContainerStyle={s.kanbanBoard}
        >
          {COLUMNS.map((col) => {
            const colData = getColumnData(col.id);
            return (
              <View key={col.id} style={s.columnWrap}>
                <View style={s.columnHeader}>
                  <View style={s.colTitleRow}>
                    <MaterialCommunityIcons name={col.icon as any} size={16} color={T.mgmtTextSecondary || T.text2} />
                    <Text style={s.colTitle}>{col.label}</Text>
                  </View>
                  <View style={s.colCountBadge}>
                    <Text style={s.colCountText}>{colData.length}</Text>
                  </View>
                </View>

                <ScrollView style={s.columnScroll} contentContainerStyle={s.columnContent}>
                  {colData.map(renderCard)}
                  {colData.length === 0 && (
                    <View style={s.emptyCol}>
                      <Text style={s.emptyColText}>No companies in queue</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.mgmtBg || T.bg },
  
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.mgmtSurface || T.surface,
    borderBottomWidth: 1, borderBottomColor: T.mgmtBorder || T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: T.text1 },

  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.mgmtSurface || T.surface,
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, borderRadius: 8, height: 40,
    borderWidth: 1, borderColor: T.mgmtBorder || T.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: T.text1 },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  kanbanBoard: { padding: 16, gap: 12, paddingBottom: 32 },
  
  columnWrap: { 
    width: COLUMN_WIDTH, 
    backgroundColor: T.mgmtSurface || T.surface, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: T.mgmtBorder || T.border,
    overflow: "hidden",
    maxHeight: "100%",
  },
  columnHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.mgmtBorder || T.border,
    backgroundColor: T.mgmtSurface || T.surface,
  },
  colTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  colTitle: { fontSize: 13, fontWeight: "600", color: T.text1 },
  colCountBadge: { 
    backgroundColor: T.mgmtBg || T.bg, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: T.mgmtBorder || T.border 
  },
  colCountText: { fontSize: 11, fontWeight: "600", color: T.text2 },

  columnScroll: { flex: 1 },
  columnContent: { padding: 10, gap: 10, paddingBottom: 20 },

  emptyCol: { paddingVertical: 32, alignItems: "center", justifyContent: "center" },
  emptyColText: { fontSize: 12, color: T.mgmtTextSecondary || T.text3 },

  card: { 
    backgroundColor: T.mgmtBg || T.bg, 
    borderRadius: 8, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: T.mgmtBorder || T.border 
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  logoWrap: { 
    width: 38, 
    height: 38, 
    borderRadius: 8, 
    backgroundColor: T.mgmtSurface || T.surface, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 1, 
    borderColor: T.mgmtBorder || T.border 
  },
  logo: { width: "100%", height: "100%", borderRadius: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 2 },
  companyName: { fontSize: 14, fontWeight: "600", color: T.text1, flex: 1 },
  companyOwner: { fontSize: 11, color: T.mgmtTextSecondary || T.text3 },
  
  cardStats: { 
    flexDirection: "row", 
    gap: 16, 
    marginBottom: 10, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: T.mgmtBorder || T.border 
  },
  statBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 11, color: T.text2, fontWeight: "500" },

  cardActions: { flexDirection: "row", alignItems: "center" },
  btnPrimary: { 
    flex: 1, 
    backgroundColor: T.text1, 
    paddingVertical: 8, 
    borderRadius: 6, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  btnPrimaryText: { color: T.bg, fontSize: 12, fontWeight: "600" },
  btnGhost: { 
    flex: 1, 
    paddingVertical: 8, 
    borderRadius: 6, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 1, 
    borderColor: T.mgmtBorder || T.border 
  },
  btnGhostFull: { 
    width: "100%", 
    paddingVertical: 8, 
    borderRadius: 6, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 1, 
    borderColor: T.mgmtBorder || T.border 
  },
  btnGhostText: { color: T.text1, fontSize: 12, fontWeight: "600" },
});
