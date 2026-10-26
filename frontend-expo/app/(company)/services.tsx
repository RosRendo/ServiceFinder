/**
 * Company Services Catalog — Premium Executive Standard
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";
import ErrorState from "@/components/common/ErrorState";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 },
  android: { elevation: 2 },
});

export default function Services() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadServices = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const servicesRes = await api.get("/api/companies/my-company/services");
      let data = servicesRes.data;
      if (data && data.success) data = data.data;
      if (data && data.data) data = data.data;
      
      setServices(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch (error) {
      console.error("Failed to load services", error);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const toggleService = useCallback(async (service: any) => {
    if (togglingId) return;
    setTogglingId(String(service.id));
    try {
      await api.put(`/api/companies/my-company/services/${service.id}`, { isActive: !service.isActive });
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s)));
    } catch (error: any) {
      const rawMsg = error?.response?.data?.message;
      Alert.alert("Error", Array.isArray(rawMsg) ? rawMsg.join("\n") : rawMsg || "Could not update service status.");
    } finally {
      setTogglingId(null);
    }
  }, [togglingId]);

  useFocusEffect(useCallback(() => { loadServices(); }, [loadServices]));

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Executive Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Service Catalog</Text>
          <Text style={s.headerSubtitle}>{services.length} Active Offerings</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/(company)/services/new" as any)}>
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadServices(true)} tintColor="#0284C7" />}
      >
        {/* Info Banner */}
        <View style={s.infoBanner}>
          <MaterialCommunityIcons name="lightning-bolt" size={18} color="#0284C7" />
          <Text style={s.infoBannerText}>
            Services listed here are dispatched instantly to on-demand customer requests in your coverage zones.
          </Text>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={s.loadingText}>Loading catalog offerings...</Text>
          </View>
        ) : hasError ? (
          <ErrorState onRetry={() => loadServices(true)} />
        ) : services.length > 0 ? (
          <View style={s.list}>
            {services.map((service) => (
              <View
                key={service.id}
                style={[s.card, CARD_SHADOW]}
              >
                <View style={s.cardTop}>
                  <View style={s.cardIcon}>
                    <MaterialCommunityIcons name="briefcase-check" size={22} color="#0284C7" />
                  </View>
                  <View style={s.cardHeadInfo}>
                    <Text style={s.cardTitle} numberOfLines={1}>{service.name}</Text>
                    <TouchableOpacity
                      style={[s.statusPill, service.isActive === false && { backgroundColor: "#FEF3C7" }]}
                      onPress={() => toggleService(service)}
                      disabled={togglingId === String(service.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${service.isActive === false ? "Reactivate" : "Pause"} ${service.name}`}
                    >
                      <View style={[s.statusDot, service.isActive === false && { backgroundColor: "#D97706" }]} />
                      <Text style={[s.statusPillText, service.isActive === false && { color: "#B45309" }]}>
                        {togglingId === String(service.id) ? "Updating…" : service.isActive === false ? "Paused — tap to reactivate" : "Active — tap to pause"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.priceTag}>
                    ${Number(service.price || 0).toFixed(2)}
                  </Text>
                </View>

                {service.description ? (
                  <Text style={s.cardDesc} numberOfLines={2}>
                    {service.description}
                  </Text>
                ) : null}

                <View style={s.cardFooter}>
                  <View style={s.footerChip}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#64748B" />
                    <Text style={s.footerChipText}>{service.duration || 60} mins estimated</Text>
                  </View>
                  {service.category?.name ? (
                    <View style={s.footerChip}>
                      <MaterialCommunityIcons name="tag-outline" size={14} color="#64748B" />
                      <Text style={s.footerChipText}>{service.category.name}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.emptyBox}>
            <View style={s.emptyIconCircle}>
              <MaterialCommunityIcons name="briefcase-plus-outline" size={40} color="#0284C7" />
            </View>
            <Text style={s.emptyTitle}>No Services Configured</Text>
            <Text style={s.emptySubtitle}>
              You have not added any services to your dispatch catalog yet. Tap the button below to publish your first offering.
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/(company)/services/new" as any)}>
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={s.emptyBtnText}>Add Service Offering</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  addBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#0284C7",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11, fontWeight: "600", color: "#64748B", marginTop: 1 },

  scrollContent: { padding: 16, paddingBottom: 60, gap: 14 },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F0F9FF", borderWidth: 1, borderColor: "#BAE6FD",
    padding: 12, borderRadius: 14,
  },
  infoBannerText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#0369A1", lineHeight: 18 },

  loadingBox: { paddingVertical: 60, alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, fontWeight: "600", color: "#64748B" },

  list: { gap: 12 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#E0F2FE",
    alignItems: "center", justifyContent: "center",
  },
  cardHeadInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  statusPillText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  priceTag: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  cardDesc: { fontSize: 12, fontWeight: "500", color: "#64748B", marginTop: 10, lineHeight: 18 },

  cardFooter: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9",
  },
  footerChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F1F5F9", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
  },
  footerChipText: { fontSize: 11, fontWeight: "600", color: "#475569" },

  emptyBox: { paddingVertical: 60, alignItems: "center", paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#E0F2FE",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  emptySubtitle: { fontSize: 13, fontWeight: "500", color: "#64748B", textAlign: "center", marginTop: 8, lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#0284C7", paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14, marginTop: 24,
  },
  emptyBtnText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
});
