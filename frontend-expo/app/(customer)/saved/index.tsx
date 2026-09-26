import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import {  ScrollView, Text, View, TouchableOpacity, RefreshControl, StyleSheet, Alert , Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import FadeIn from "@/components/FadeIn";
import ScaleButton from "@/components/ScaleButton";
import { Theme } from "@/constants/theme";
import { EmptySavedSvg } from "@/components/svg";

type Tab = "service" | "company";

interface SavedEntry {
  id: string;
  itemType: Tab;
  itemId: string;
  item: {
    id: string; name: string; description?: string;
    basePrice?: number; durationMin?: number; image?: string; category?: string;
    logoUrl?: string; city?: string; rating?: number; reviewCount?: number; verified?: boolean;
    company?: { id: string; name: string; rating: number; city?: string };
    services?: { id: string; name: string }[];
  };
}

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (Clean iOS)
// ─────────────────────────────────────────────────────────────
const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function SavedScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("service");
  const [items, setItems] = useState<SavedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/saved-items", { params: { type: tab, limit: 50 } });
      const data = res.data?.items ?? res.data?.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const unsave = (entry: SavedEntry) => {
    Alert.alert("Remove Item", `Remove "${entry.item.name}" from saved?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/api/saved-items", {
              data: { itemType: entry.itemType, itemId: entry.itemId },
            });
            setItems(p => p.filter(i => i.id !== entry.id));
          } catch { Alert.alert("Error", "Could not remove item."); }
        },
      },
    ]);
  };

  const nav = (e: SavedEntry) =>
    e.itemType === "company"
      ? router.push(`/(customer)/company/${e.itemId}` as any)
      : router.push(`/(customer)/service/${e.itemId}` as any);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── APP BAR ───────────────────────────────────────────── */}
      <View style={s.appBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.appBarTitle}>Saved</Text>
        <View style={s.iconBtn} />
      </View>

      {/* ── TABS ──────────────────────────────────────────────── */}
      <View style={s.tabsWrapper}>
        <View style={s.tabsBg}>
          {(["service", "company"] as Tab[]).map(t => (
            <TouchableOpacity 
              key={t} 
              onPress={() => setTab(t)}
              style={[s.tabItem, tab === t && s.tabActive]}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === "service" ? "Services" : "Providers"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── LIST ──────────────────────────────────────────────── */}
      <ScrollView 
        style={s.list} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[T.accent]} tintColor={T.accent} />}
      >
        {loading ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>Loading...</Text>
          </View>
        ) : items.length === 0 ? (
          <FadeIn delay={100}>
            <View style={s.emptyState}>
              <View style={{ marginBottom: 16 }}>
                <EmptySavedSvg size={105} />
              </View>
              <Text style={s.emptyTitle}>Nothing saved yet</Text>
              <Text style={s.emptyBody}>
                Tap the heart on any {tab === "service" ? "service" : "provider"} to save it here for later.
              </Text>
              <ScaleButton onPress={() => router.push("/(customer)/(tabs)/explore" as any)}>
                <View style={s.exploreBtn}>
                  <Text style={s.exploreBtnText}>Explore</Text>
                </View>
              </ScaleButton>
            </View>
          </FadeIn>
        ) : (
          <View style={s.itemsContainer}>
            {items.map((entry, i) => (
              <FadeIn key={entry.id} delay={i * 80}>
                <ScaleButton onPress={() => nav(entry)}>
                  {entry.itemType === "service" ? (
                    <View style={s.serviceCard}>
                      <View style={s.serviceImageWrap}>
                        {entry.item.image ? (
                          <Image source={{ uri: entry.item.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                        ) : (
                          <MaterialIcons name="home-repair-service" size={32} color={T.text3} />
                        )}
                        {/* Heart button */}
                        <TouchableOpacity style={s.heartBtn} onPress={() => unsave(entry)}>
                          <MaterialCommunityIcons name="heart" size={18} color={T.error} />
                        </TouchableOpacity>
                      </View>
                      <View style={s.serviceBody}>
                        <Text style={s.serviceName} numberOfLines={1}>{entry.item.name}</Text>
                        {entry.item.company && (
                          <Text style={s.serviceProvider} numberOfLines={1}>{entry.item.company.name}</Text>
                        )}
                        <View style={s.serviceMetaRow}>
                          <View style={s.metaChip}>
                            <MaterialIcons name="star" size={12} color={T.gold} />
                            <Text style={s.metaChipText}>
                              {(entry.item.company?.rating ?? 0) > 0 ? (entry.item.company!.rating).toFixed(1) : "New"}
                            </Text>
                          </View>
                          {entry.item.durationMin && (
                            <View style={s.metaChip}>
                              <MaterialIcons name="schedule" size={12} color={T.text2} />
                              <Text style={s.metaChipText}>{entry.item.durationMin} min</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }} />
                          {entry.item.basePrice != null && (
                            <Text style={s.servicePrice}>${entry.item.basePrice.toFixed(2)}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={s.companyCard}>
                      <View style={s.companyLogoWrap}>
                        {entry.item.logoUrl ? (
                          <Image source={{ uri: entry.item.logoUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                        ) : (
                          <Text style={s.companyInitial}>{entry.item.name.charAt(0)}</Text>
                        )}
                      </View>
                      <View style={s.companyBody}>
                        <View style={s.companyHeaderRow}>
                          <Text style={s.companyName} numberOfLines={1}>{entry.item.name}</Text>
                          <TouchableOpacity onPress={() => unsave(entry)} style={{ padding: 4 }}>
                            <MaterialCommunityIcons name="heart" size={20} color={T.error} />
                          </TouchableOpacity>
                        </View>
                        {entry.item.city && <Text style={s.companyCity}>{entry.item.city}</Text>}
                        <View style={s.companyMetaRow}>
                          <View style={s.metaChip}>
                            <MaterialIcons name="star" size={12} color={T.gold} />
                            <Text style={s.metaChipText}>
                              {(entry.item.rating ?? 0) > 0 ? (entry.item.rating!).toFixed(1) : "New"}
                            </Text>
                          </View>
                          {(entry.item.reviewCount ?? 0) > 0 && (
                            <Text style={s.reviewCountText}>({entry.item.reviewCount} reviews)</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </ScaleButton>
              </FadeIn>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  
  appBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, height: 56, borderBottomWidth: 1, borderBottomColor: T.border },
  appBarTitle: { fontSize: 18, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  tabsWrapper: { paddingHorizontal: 24, paddingVertical: 16 },
  tabsBg: { flexDirection: "row", backgroundColor: T.accentLight, borderRadius: 12, padding: 4 },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: T.accent },
  tabText: { fontSize: 14, fontWeight: "700", color: T.text2 },
  tabTextActive: { color: "#FFFFFF" },

  list: { flex: 1, paddingHorizontal: 24 },
  itemsContainer: { gap: 16 },

  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: T.text3, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  emptyText: { color: T.text3, fontSize: 14, marginTop: 40 },
  
  exploreBtn: { backgroundColor: T.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 },
  exploreBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  // Service Card
  serviceCard: { backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: "hidden", ...CARD_SHADOW },
  serviceImageWrap: { width: "100%", height: 140, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  heartBtn: { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  serviceBody: { padding: 16 },
  serviceName: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 4 },
  serviceProvider: { fontSize: 12, color: T.text3, marginBottom: 12 },
  serviceMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: T.tag, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  metaChipText: { fontSize: 11, fontWeight: "700", color: T.text1 },
  servicePrice: { fontSize: 16, fontWeight: "800", color: T.accent },

  // Company Card
  companyCard: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, gap: 16, ...CARD_SHADOW },
  companyLogoWrap: { width: 64, height: 64, borderRadius: 12, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  companyInitial: { fontSize: 24, fontWeight: "800", color: T.text3 },
  companyBody: { flex: 1, justifyContent: "center" },
  companyHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  companyName: { fontSize: 16, fontWeight: "800", color: T.text1, flex: 1 },
  companyCity: { fontSize: 13, color: T.text3, marginTop: 2, marginBottom: 6 },
  companyMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewCountText: { fontSize: 12, color: T.text3 }
});