/**
 * Company Services — Premium Redesign
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
};

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function Services() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      // 1. Fetch the user's company
      const companyRes = await api.get("/api/companies/my-company");
      const companyId = companyRes.data?.data?.id ?? companyRes.data?.id;

      if (!companyId) {
        setServices([]);
        return;
      }

      // 2. Fetch the company's services
      const servicesRes = await api.get(`/api/services/company/${companyId}`);
      // NestJS interceptor wraps in data, and pagination might wrap in data again
      let data = servicesRes.data;
      if (data && data.success) data = data.data;
      if (data && data.data) data = data.data; // Handle paginated response { data: [...] }
      
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load services", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadServices(); }, [loadServices]));

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Services</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/(company)/services/new" as any)}>
          <MaterialCommunityIcons name="plus" size={24} color={T.text1} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadServices(true)} tintColor={T.accent} />}
      >
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Your Offerings</Text>
          <Text style={s.sectionCount}>{services.length} active</Text>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={T.accent} />
          </View>
        ) : services.length > 0 ? (
          <View style={s.list}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={s.card}
                activeOpacity={0.8}
              >
                <View style={s.cardIcon}>
                  <MaterialCommunityIcons name="briefcase-outline" size={22} color={T.accentMid} />
                </View>
                <View style={s.cardContent}>
                  <Text style={s.cardTitle} numberOfLines={1}>{service.name}</Text>
                  <Text style={s.cardDesc} numberOfLines={2}>
                    {service.description || "No description provided."}
                  </Text>
                  <View style={s.cardFooter}>
                    <View style={s.footerItem}>
                      <MaterialCommunityIcons name="currency-usd" size={16} color={T.accent} />
                      <Text style={s.priceText}>{service.price}</Text>
                    </View>
                    <View style={s.footerItem}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={T.text3} />
                      <Text style={s.durationText}>{service.duration} mins</Text>
                    </View>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={T.text3} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="briefcase-variant-outline" size={56} color={T.text3} />
            <Text style={s.emptyTitle}>No Services Yet</Text>
            <Text style={s.emptySubtitle}>You haven't added any services to your profile. Tap the plus icon to add one.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  addBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginRight: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  scrollContent: { padding: 24, paddingBottom: 60 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  sectionCount: { fontSize: 13, fontWeight: "600", color: T.text3 },
  loadingBox: { paddingVertical: 60, alignItems: "center" },

  list: { gap: 12 },
  card: {
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border,
    flexDirection: "row", alignItems: "center", gap: 16,
    ...CARD_SHADOW },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: T.accentLight,
    alignItems: "center", justifyContent: "center",
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: T.text1, marginBottom: 4 },
  cardDesc: { fontSize: 12, fontWeight: "500", color: T.text3, marginBottom: 12, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 16 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  priceText: { fontSize: 14, fontWeight: "800", color: T.accent },
  durationText: { fontSize: 12, fontWeight: "600", color: T.text2 },

  emptyBox: { paddingVertical: 80, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text1, marginTop: 8 },
  emptySubtitle: { fontSize: 14, fontWeight: "500", color: T.text3, textAlign: "center", paddingHorizontal: 20 },
});
