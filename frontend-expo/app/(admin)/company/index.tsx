import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, StyleSheet, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import ErrorState from "@/components/common/ErrorState";

interface Company {
  id: string;
  name: string;
  owner?: { fullName: string; email: string };
  verificationStatus: string;
  logoUrl?: string;
  createdAt: string;
}

export default function CompaniesScreen() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/companies?search=${search}`);
      const data = res.data?.data || res.data || [];
      setCompanies(Array.isArray(data) ? data : data.companies || []);
      setHasError(false);
    } catch (err) {
      console.error(err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "verified") return "#059669";
    if (status === "rejected") return "#DC2626";
    return "#D97706";
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Commercial Providers</Text>
            <Text style={s.headerSubtitle}>Marketplace Directory & Accounts</Text>
          </View>
        </View>
      </View>

      <View style={s.searchContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            style={s.searchInput}
            placeholder="Search providers by corporate name..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={s.loadingText}>Loading companies directory…</Text>
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchCompanies()} />
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          {companies.length > 0 ? (
            companies.map((company) => {
              const dotColor = getStatusColor(company.verificationStatus);
              return (
                <TouchableOpacity
                  key={company.id}
                  onPress={() => router.push(`/(admin)/company/${company.id}` as any)}
                  style={s.card}
                  activeOpacity={0.7}
                >
                  <View style={s.logoContainer}>
                    {company.logoUrl ? (
                      <Image source={{ uri: company.logoUrl }} style={s.logoImage} />
                    ) : (
                      <MaterialCommunityIcons name="office-building" size={22} color="#0F172A" />
                    )}
                  </View>

                  <View style={s.cardContent}>
                    <Text style={s.companyName}>{company.name}</Text>
                    <Text style={s.ownerName}>{company.owner?.fullName || "Company Owner"}</Text>
                    <View style={s.badgesContainer}>
                      <View style={s.statusBadge}>
                        <View style={[s.statusDot, { backgroundColor: dotColor }]} />
                        <Text style={s.statusText}>
                          {(company.verificationStatus || "PENDING").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="office-building" size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>No Providers Found</Text>
              <Text style={s.emptySubText}>Try adjusting your search criteria.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500", marginTop: 1 },

  searchContainer: {
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#E2E8F0", height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#0F172A" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80, gap: 12 },
  loadingText: { fontSize: 13, color: "#64748B" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 10 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  logoContainer: {
    width: 44, height: 44, backgroundColor: "#F8FAFC", borderRadius: 10,
    marginRight: 14, alignItems: "center", justifyContent: "center",
    overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0",
  },
  logoImage: { width: "100%", height: "100%" },

  cardContent: { flex: 1, marginRight: 12 },
  companyName: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  ownerName: { fontSize: 13, color: "#64748B", marginBottom: 8 },

  badgesContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700", color: "#0F172A" },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptySubText: { fontSize: 13, color: "#64748B", marginTop: 4, textAlign: "center" },
});
