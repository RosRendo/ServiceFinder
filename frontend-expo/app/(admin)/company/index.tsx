import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;



interface Company {
  id: string;
  name: string;
  owner: { fullName: string, email: string };
  verificationStatus: string;
  logoUrl?: string;
  createdAt: string;
}

export default function CompaniesScreen() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/companies?search=${search}`);
      setCompanies(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "verified") return { color: T.greenText, bg: T.greenBg };
    if (status === "rejected") return { color: T.redText, bg: T.redBg };
    return { color: T.yellowText, bg: T.yellowBg };
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Companies</Text>
        <View style={s.backBtn} />
      </View>

      <View style={s.searchContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={T.text3} />
          <TextInput
            style={s.searchInput}
            placeholder="Search companies..."
            placeholderTextColor={T.text3}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          {companies.map((company) => {
            const statusConfig = getStatusColor(company.verificationStatus);
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
                    <MaterialCommunityIcons name="domain" size={24} color={T.text3} />
                  )}
                </View>

                <View style={s.cardContent}>
                  <Text style={s.companyName}>{company.name}</Text>
                  <Text style={s.ownerName}>{company.owner?.fullName}</Text>
                  <View style={s.badgesContainer}>
                    <View style={[s.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Text style={[s.statusText, { color: statusConfig.color }]}>
                        {company.verificationStatus}
                      </Text>
                    </View>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, height: 56, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  
  searchContainer: {
    padding: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.bg, borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: T.border, height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: T.text1 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: T.border,
  },
  logoContainer: {
    width: 48, height: 48, backgroundColor: T.bg, borderRadius: 12,
    marginRight: 16, alignItems: "center", justifyContent: "center",
    overflow: "hidden", borderWidth: 1, borderColor: T.border,
  },
  logoImage: { width: "100%", height: "100%" },
  
  cardContent: { flex: 1, marginRight: 16 },
  companyName: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 4 },
  ownerName: { fontSize: 14, color: T.text2, marginBottom: 12 },
  
  badgesContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
});

