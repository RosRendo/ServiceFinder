/**
 * Admin Service Types List — Premium Deep Navy Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSidebarStore } from "@/store/sidebarStore";
import api from "@/utils/api";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A",
  text1: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  success: "#10B981", warning: "#F59E0B", error: "#EF4444",
};



export default function ServiceTypes() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServiceTypes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get('/api/service-types');
      // TransformInterceptor: { success, data: { data: [...] } }
      const outer = response.data?.data ?? response.data;
      const items = Array.isArray(outer) ? outer : (outer?.data ?? []);
      setServiceTypes(items);
    } catch (error) {
      console.error("Failed to fetch service types:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchServiceTypes(); }, [fetchServiceTypes]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={openSidebar} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Service Types</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/(admin)/service-types/new")}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchServiceTypes(true)} tintColor={T.accent} />}
      >
        {isLoading && !refreshing ? (
          <View style={s.loadingBox}><ActivityIndicator size="large" color={T.accent} /></View>
        ) : serviceTypes.length > 0 ? (
          serviceTypes.map((serviceType) => (
            <View key={serviceType.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.iconBox}>
                  <MaterialCommunityIcons name={serviceType.icon || "hammer-wrench"} size={24} color={T.accent} />
                </View>
                <View style={s.cardHeaderInfo}>
                  <Text style={s.cardTitle}>{serviceType.name}</Text>
                  <Text style={s.cardSubtitle}>
                    Category: {serviceType.category?.name || 'Uncategorized'}
                  </Text>
                </View>
                <View style={s.priceBadge}>
                  <Text style={s.priceText}>${serviceType.basePrice}</Text>
                </View>
              </View>
              {serviceType.description ? (
                <Text style={s.cardDesc}>{serviceType.description}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="hammer-wrench" size={48} color={T.text3} style={{ marginBottom: 16 }} />
            <Text style={s.emptyText}>No Service Types Found</Text>
            <Text style={s.emptySubText}>Get started by adding a service type.</Text>
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },

  listContent: { padding: 16, gap: 16, paddingBottom: 60 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },
  
  card: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: T.accent + "10", alignItems: "center", justifyContent: "center" },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 2 },
  cardSubtitle: { fontSize: 11, fontWeight: "600", color: T.text3, textTransform: "uppercase", letterSpacing: 0.5 },
  priceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: T.accent + "15" },
  priceText: { fontSize: 14, fontWeight: "800", color: T.accent },
  cardDesc: { fontSize: 14, color: T.text2, marginTop: 12, lineHeight: 20 },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center" },
});

