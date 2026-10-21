/**
 * Admin Categories Catalog — Enterprise Clean Business Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSidebarStore } from "@/store/sidebarStore";
import api from "@/utils/api";
import ErrorState from "@/components/common/ErrorState";
import { useTranslation } from "react-i18next";

export default function Categories() {
  const router = useRouter();
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get('/api/categories?all=true');
      const outer = response.data?.data ?? response.data;
      const items = Array.isArray(outer) ? outer : (outer?.data ?? []);
      setCategories(items);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

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
            <Text style={s.headerTitle}>Service Categories</Text>
            <Text style={s.headerSubtitle}>Marketplace Taxonomy & Classification</Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push("/(admin)/categories/new")}
          accessibilityRole="button"
          accessibilityLabel="Add New Category"
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={s.loadingText}>Loading categories taxonomy…</Text>
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchCategories()} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchCategories(true)}
              tintColor="#0F172A"
            />
          }
        >
          {categories.length > 0 ? (
            categories.map((category) => {
              const isActive = (category.status || "active").toLowerCase() === "active";
              return (
                <View key={category.id} style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={s.iconBox}>
                      {category.imageUrl ? (
                        <Image source={{ uri: category.imageUrl }} style={s.categoryImg} resizeMode="contain" />
                      ) : (
                        <MaterialCommunityIcons
                          name={(category.icon || "shape-outline") as any}
                          size={22}
                          color="#0F172A"
                        />
                      )}
                    </View>
                    <View style={s.cardHeaderInfo}>
                      <Text style={s.cardTitle}>{category.name}</Text>
                      <Text style={s.cardSubtitle}>/{category.slug}</Text>
                    </View>
                    <View style={s.statusBadge}>
                      <View style={[s.statusDot, { backgroundColor: isActive ? "#059669" : "#D97706" }]} />
                      <Text style={s.statusText}>{isActive ? "ACTIVE" : "INACTIVE"}</Text>
                    </View>
                  </View>
                  {category.description ? (
                    <Text style={s.cardDesc} numberOfLines={2}>{category.description}</Text>
                  ) : null}
                  <View style={s.cardFooter}>
                    <Text style={s.orderLabel}>Display Sequence: #{category.displayOrder ?? 0}</Text>
                    <Text style={s.idLabel}>ID #{category.id}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="shape-outline" size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>No Categories Configured</Text>
              <Text style={s.emptySubText}>Add marketplace categories to organize corporate service offerings.</Text>
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
  categoryImg: { width: 24, height: 24 },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  cardSubtitle: { fontSize: 12, fontWeight: "600", color: "#64748B", marginTop: 1 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700", color: "#0F172A" },

  cardDesc: { fontSize: 13, color: "#475569", marginTop: 12, lineHeight: 18 },

  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E2E8F0",
  },
  orderLabel: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  idLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptySubText: { fontSize: 13, color: "#64748B", marginTop: 4, textAlign: "center", lineHeight: 18 },
});
