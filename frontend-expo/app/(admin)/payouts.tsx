import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Alert, Platform, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSidebarStore } from "@/store/sidebarStore";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";
import { useTranslation } from "react-i18next";

const T = Theme.colors;

type PayoutStatus = "pending" | "completed" | "rejected";

export default function AdminPayoutsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PayoutStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"company" | "staff" | "all">("all");

  const fetchPayouts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get("/api/admin/payouts");
      // Backend returns { success: true, data: [...], meta: {} }
      // TransformInterceptor passes it through as-is (sees success: true)
      const data = res.data?.data ?? [];
      const formatted = data.map((p: any) => ({
        ...p,
        companyName: p.company?.name,
        staffName: p.staff?.user?.fullName,
        email: p.company?.owner?.email || p.staff?.user?.email || "",
        bankDetails: p.payoutType === 'company'
          ? (p.company?.paymentMethods?.find((m: any) => m.isDefault) || p.company?.paymentMethods?.[0])
          : (p.staff?.paymentMethods?.find((m: any) => m.isDefault) || p.staff?.paymentMethods?.[0])
      }));
      setPayouts(formatted);
    } catch (err) {
      console.error("Error fetching payouts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleProcess = (id: string) => {
    Alert.alert("Process Payout", "Are you sure you want to mark this payout as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Process",
        onPress: async () => {
          setProcessingId(id);
          try {
            await api.post(`/api/admin/payouts/${id}/approve`);
            Alert.alert("Success", "Payout marked as completed.");
            setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "completed" } : p));
          } catch {
            Alert.alert("Error", "Failed to process payout.");
          } finally {
            setProcessingId(null);
          }
        }
      }
    ]);
  };

  const filteredPayouts = payouts.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (typeFilter !== "all" && p.payoutType !== typeFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return T.warning;
      case "completed": return T.success;
      case "rejected": return T.error;
      default: return T.text3;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[s.typeBadge, { backgroundColor: item.payoutType === "company" ? T.blue + "15" : T.accentMid + "15" }]}>
            <Text style={[s.typeBadgeText, { color: item.payoutType === "company" ? T.blue : T.accentMid }]}>
              {item.payoutType === "company" ? "Company" : "Staff"}
            </Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + "15" }]}>
            <Text style={[s.statusBadgeText, { color: getStatusColor(item.status) }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={s.amount}>${Number(item.amount || 0).toFixed(2)}</Text>
      </View>

      <View style={s.cardBody}>
        <Text style={s.recipientName}>
          {item.payoutType === "company" ? item.companyName : item.staffName}
        </Text>
        <Text style={s.recipientEmail}>{item.email}</Text>
        <Text style={s.dateText}>
          Requested: {item.requestedAt ? new Date(item.requestedAt).toLocaleDateString() : "—"}
        </Text>

        {item.bankDetails ? (
          <View style={s.bankBox}>
            <MaterialCommunityIcons name="bank" size={16} color={T.text2} />
            <View>
              <Text style={s.bankName}>{item.bankDetails.type}</Text>
              <Text style={s.bankText}>{item.bankDetails.accountName} • {item.bankDetails.accountNumber}</Text>
            </View>
          </View>
        ) : (
          <Text style={s.methodText}>Via {item.method}</Text>
        )}
      </View>

      {item.status === "pending" && (
        <View style={s.cardFooter}>
          <TouchableOpacity
            style={[s.processBtn, processingId === item.id && { opacity: 0.7 }]}
            onPress={() => handleProcess(item.id)}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.processBtnText}>Process Payout</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity 
              accessibilityRole="button"
              accessibilityLabel={t('common.openMenu')}
              onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payouts</Text>
        </View>
      </View>

      <View style={s.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
          {["all", "pending", "completed"].map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, filter === f && s.filterChipActive]}
              onPress={() => setFilter(f as any)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={s.filterDivider} />
          {["all", "company", "staff"].map(t => (
            <TouchableOpacity
              key={t}
              style={[s.filterChip, typeFilter === t && s.filterChipActive]}
              onPress={() => setTypeFilter(t as any)}
            >
              <Text style={[s.filterText, typeFilter === t && s.filterTextActive]}>
                {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.centerBox}><ActivityIndicator size="large" color={T.accent} /></View>
      ) : (
        hasError ? (
          <ErrorState onRetry={() => fetchPayouts()} />
        ) : (
        <FlatList
          data={filteredPayouts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPayouts(true)} tintColor={T.accent} />}
          ListEmptyComponent={
            <View style={s.centerBox}>
              <MaterialCommunityIcons name="bank-transfer-out" size={48} color={T.text3} />
              <Text style={s.emptyText}>No payouts found matching your filters.</Text>
            </View>
          }
        />
      ))}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },

  filtersContainer: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  filtersScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: "center" },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  filterText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  filterTextActive: { color: "#fff" },
  filterDivider: { width: 1, height: 20, backgroundColor: T.border, marginHorizontal: 4 },

  listContent: { padding: 16, gap: 12, paddingBottom: 60 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { marginTop: 12, color: T.text3, fontWeight: "500", fontSize: 14 },

  card: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  amount: { fontSize: 20, fontWeight: "700", color: T.text1 },

  cardBody: { gap: 4, marginBottom: 16 },
  recipientName: { fontSize: 16, fontWeight: "700", color: T.text1 },
  recipientEmail: { fontSize: 13, color: T.text2, marginBottom: 4 },
  dateText: { fontSize: 12, color: T.text3 },
  methodText: { fontSize: 12, color: T.text3, textTransform: "capitalize" },

  bankBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, padding: 8, backgroundColor: T.bg, borderRadius: 8 },
  bankName: { fontSize: 13, fontWeight: "600", color: T.text1 },
  bankText: { fontSize: 12, color: T.text2 },

  cardFooter: { borderTopWidth: 1, borderTopColor: T.border, paddingTop: 16 },
  processBtn: { backgroundColor: T.accent, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  processBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
