/**
 * Admin Company Directory & Management — Quiet Luxury Standard
 * Ergonomic vertical FlashList with segmented category/status tabs.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const FlashList = ShopifyFlashList as any;
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "reviewing", label: "Reviewing" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
];

export default function CompaniesDirectory() {
  const router = useRouter();
  const setAdminOpen = useSidebarStore((s) => s.setAdminOpen);

  const [activeTab, setActiveTab] = useState("all");
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
        await api.post(`/api/admin/companies/${companyId}/reject`, {
          reason: "Admin rejected provider credentials",
        });
      } else {
        await api.patch(`/api/admin/companies/${companyId}`, { verificationStatus: newStatus });
      }

      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, verificationStatus: newStatus } : c))
      );
    } catch (error: any) {
      Alert.alert(
        "Action Failed",
        error.response?.data?.message || "Failed to update company verification status."
      );
      fetchCompanies();
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    let result = companies;
    if (activeTab !== "all") {
      result = result.filter((c) => {
        if (activeTab === "pending") {
          return c.verificationStatus === "pending" || !c.verificationStatus;
        }
        return c.verificationStatus === activeTab;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.owner?.fullName?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.registrationNumber?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [companies, activeTab, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return { dotColor: "#059669", label: "VERIFIED" };
      case "reviewing":
        return { dotColor: "#2563EB", label: "REVIEWING" };
      case "rejected":
        return { dotColor: "#DC2626", label: "REJECTED" };
      case "pending":
      default:
        return { dotColor: "#D97706", label: "PENDING" };
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => setAdminOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Marketplace Directory</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{filteredCompanies.length}</Text>
        </View>
      </View>

      {/* Global Search Bar */}
      <View style={s.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
        <TextInput
          placeholder="Search by company, owner, or city..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={s.searchInput}
          autoCapitalize="none"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Segmented Filter Control */}
      <View style={s.tabWrapper}>
        <View style={s.tabContainer}>
          {STATUS_TABS.map((tab) => {
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

      {/* Vertical Company List */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchCompanies()} />
      ) : (
        <FlashList
          data={filteredCompanies}
          keyExtractor={(item: any) => item.id}
          estimatedItemSize={160}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchCompanies(true)} tintColor="#0F172A" />
          }
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="office-building" size={38} color="#0F172A" />
              </View>
              <Text style={s.emptyText}>No Businesses Found</Text>
              <Text style={s.emptySubText}>Try adjusting your search query or switching status filters.</Text>
            </View>
          }
          renderItem={({ item: company }: any) => {
            const badge = getStatusBadge(company.verificationStatus);
            const isActioning = actionLoadingId === company.id;

            return (
              <TouchableOpacity
                style={[s.card, CARD_SHADOW]}
                onPress={() => router.push(`/(admin)/company/${company.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={s.cardTop}>
                  <View style={s.logoWrap}>
                    {company.logoUrl ? (
                      <Image source={{ uri: company.logoUrl }} style={s.logo} contentFit="cover" />
                    ) : (
                      <MaterialCommunityIcons name="domain" size={24} color="#64748B" />
                    )}
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={s.companyName} numberOfLines={1}>
                      {company.name}
                    </Text>
                    <Text style={s.regText} numberOfLines={1}>
                      {company.registrationNumber ? `REG: ${company.registrationNumber}` : "Pending Registration"}
                    </Text>
                  </View>
                  <View style={s.statusPill}>
                    <View style={[s.statusDot, { backgroundColor: badge.dotColor }]} />
                    <Text style={s.statusPillText}>{badge.label}</Text>
                  </View>
                </View>

                {/* Details Row */}
                <View style={s.cardDetails}>
                  <View style={s.detailCol}>
                    <Text style={s.detailLabel}>OWNER / PRINCIPAL</Text>
                    <Text style={s.detailVal} numberOfLines={1}>
                      {company.owner?.fullName || "Not Specified"}
                    </Text>
                  </View>
                  <View style={s.detailDivider} />
                  <View style={s.detailCol}>
                    <Text style={s.detailLabel}>CITY</Text>
                    <Text style={s.detailVal} numberOfLines={1}>
                      {company.city || "National"}
                    </Text>
                  </View>
                  <View style={s.detailDivider} />
                  <View style={s.detailCol}>
                    <Text style={s.detailLabel}>SERVICES</Text>
                    <Text style={s.detailVal}>{company.services?.length ?? "0"}</Text>
                  </View>
                </View>

                {/* Footer Link */}
                <View style={s.cardFooter}>
                  <Text style={s.appliedDate}>
                    Joined {new Date(company.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                  <View style={s.inspectLink}>
                    <Text style={s.inspectLinkText}>Audit Record</Text>
                    <MaterialCommunityIcons name="chevron-right" size={14} color="#0F172A" />
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
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  badge: {
    backgroundColor: "#0A192F",
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#0F172A" },

  tabWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 3,
  },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9 },
  tabButtonActive: {
    backgroundColor: "#0A192F",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FFFFFF" },

  // paddingBottom: 120 guarantees content does not hide behind the floating tab bar
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(10, 25, 47, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyText: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  emptySubText: { fontSize: 13, color: "#64748B", textAlign: "center", paddingHorizontal: 32 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  logo: { width: "100%", height: "100%" },
  cardInfo: { flex: 1 },
  companyName: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  regText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: "800", color: "#334155", letterSpacing: 0.3 },

  cardDetails: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", marginBottom: 2 },
  detailVal: { fontSize: 12, fontWeight: "700", color: "#334155" },
  detailDivider: { width: 1, backgroundColor: "#E2E8F0", marginHorizontal: 8 },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  appliedDate: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
  inspectLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  inspectLinkText: { fontSize: 12, fontWeight: "700", color: "#0A192F" },
});
