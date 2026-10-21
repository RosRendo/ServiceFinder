/**
 * Admin Service Types Catalog — Enterprise Clean Business Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSidebarStore } from "@/store/sidebarStore";
import api from "@/utils/api";
import ErrorState from "@/components/common/ErrorState";
import { useTranslation } from "react-i18next";

export default function ServiceTypes() {
  const router = useRouter();
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServiceTypes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get('/api/service-types');
      const outer = response.data?.data ?? response.data;
      const items = Array.isArray(outer) ? outer : (outer?.data ?? []);
      setServiceTypes(items);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch service types:", error);
      setHasError(true);
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
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('common.openMenu')}
            onPress={() => openSidebar(true)}
            style={s.menuBtn}
          >
            <MaterialCommunityIcons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Service Offerings</Text>
            <Text style={s.headerSubtitle}>Standardized Catalog & Baseline Pricing</Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push("/(admin)/service-types/new")}
          accessibilityRole="button"
          accessibilityLabel="Add New Service Type"
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={s.loadingText}>Loading service catalog…</Text>
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchServiceTypes()} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchServiceTypes(true)}
              tintColor="#0F172A"
            />
          }
        >
          {serviceTypes.length > 0 ? (
            serviceTypes.map((serviceType) => (
              <View key={serviceType.id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={s.iconBox}>
                    <MaterialCommunityIcons
                      name={(serviceType.icon || "hammer-wrench") as any}
                      size={22}
                      color="#0F172A"
                    />
                  </View>
                  <View style={s.cardHeaderInfo}>
                    <Text style={s.cardTitle}>{serviceType.name}</Text>
                    <Text style={s.cardSubtitle}>
                      {serviceType.category?.name ? `CATEGORY: ${serviceType.category.name.toUpperCase()}` : 'UNCATEGORIZED'}
                    </Text>
                  </View>
                  <View style={s.priceBadge}>
                    <Text style={s.priceLabel}>BASE</Text>
                    <Text style={s.priceText}>${Number(serviceType.basePrice || 0).toFixed(2)}</Text>
                  </View>
                </View>
                {serviceType.description ? (
                  <Text style={s.cardDesc} numberOfLines={2}>{serviceType.description}</Text>
                ) : null}
                <View style={s.cardFooter}>
                  <Text style={s.idLabel}>Offering ID #{serviceType.id}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="hammer-wrench" size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>No Service Offerings Found</Text>
              <Text style={s.emptySubText}>Add standardized service types with base pricing to empower commercial partners.</Text>
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
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500", marginTop: 1 },
  addBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#0F172A",
    alignItems: "center", justifyContent: "center",
  },

  listContent: { padding: 16, gap: 12, paddingBottom: 120 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 12 },
  loadingText: { color: "#64748B", fontSize: 14, fontWeight: "500" },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  cardSubtitle: { fontSize: 11, fontWeight: "700", color: "#64748B", marginTop: 2, letterSpacing: 0.3 },
  priceBadge: {
    alignItems: "flex-end", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  priceLabel: { fontSize: 9, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  priceText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },

  cardDesc: { fontSize: 13, color: "#475569", marginTop: 12, lineHeight: 18 },

  cardFooter: {
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E2E8F0",
    flexDirection: "row", justifyContent: "flex-end",
  },
  idLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptySubText: { fontSize: 13, color: "#64748B", marginTop: 4, textAlign: "center", lineHeight: 18 },
});
