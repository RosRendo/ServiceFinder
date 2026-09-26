import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Alert, Platform, ScrollView, Image
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

  const fetchPayouts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get("/api/admin/payouts");
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.payouts)
        ? raw.payouts
        : Array.isArray(raw?.data?.payouts)
        ? raw.data.payouts
        : [];

      const formatted = list.map((p: any) => ({
        id: String(p.id),
        amount: Number(p.amount || 0),
        status: p.status || "pending",
        requestedAt: p.requestedAt,
        processedAt: p.processedAt,
        transactionId: p.transactionId,
        method: p.method || "Bank Transfer",
        companyName: p.company?.name || "Company",
        ownerName: p.company?.owner?.fullName || "Company Owner",
        email: p.company?.owner?.email || "",
        phone: p.company?.owner?.phone || "",
        khqrImageUrl: p.company?.khqrImageUrl || p.khqrImageUrl || null,
        bankDetails: p.company?.paymentMethods?.find((m: any) => m.isDefault) || p.company?.paymentMethods?.[0] || null,
      }));
      setPayouts(formatted);
      setHasError(false);
    } catch (err) {
      console.error("Error fetching payouts:", err);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleProcess = (id: string) => {
    Alert.alert("Disburse Payout", "Are you sure you want to approve and mark this company payout as disbursed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm Disburse",
        onPress: async () => {
          setProcessingId(id);
          try {
            await api.post(`/api/admin/payouts/${id}/approve`);
            Alert.alert("Success", "Company payout successfully marked as completed.");
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

  const handleReject = (id: string) => {
    Alert.alert("Reject Payout", "Are you sure you want to reject this payout and refund the amount back to the company available balance?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject & Refund",
        style: "destructive",
        onPress: async () => {
          setProcessingId(id);
          try {
            await api.post(`/api/admin/payouts/${id}/reject`, { reason: "Admin rejected" });
            Alert.alert("Success", "Payout rejected. Balance refunded to company.");
            setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" } : p));
          } catch {
            Alert.alert("Error", "Failed to reject payout.");
          } finally {
            setProcessingId(null);
          }
        }
      }
    ]);
  };

  const filteredPayouts = payouts.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
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
          <View style={[s.typeBadge, { backgroundColor: T.blue + "15" }]}>
            <MaterialCommunityIcons name="office-building" size={12} color={T.blue} style={{ marginRight: 4 }} />
            <Text style={[s.typeBadgeText, { color: T.blue }]}>Company Payout</Text>
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
        <Text style={s.recipientName}>{item.companyName}</Text>
        <Text style={s.recipientEmail}>Owner: {item.ownerName} {item.email ? `• ${item.email}` : ""}</Text>
        <Text style={s.dateText}>
          Requested: {item.requestedAt ? new Date(item.requestedAt).toLocaleDateString() : "—"}
        </Text>

        {item.transactionId && (
          <Text style={s.txnText}>Txn ID: {item.transactionId}</Text>
        )}

        {item.bankDetails ? (
          <View style={s.bankBox}>
            <MaterialCommunityIcons name="bank" size={18} color={T.accentMid} />
            <View style={{ flex: 1 }}>
              <Text style={s.bankName}>{item.bankDetails.type?.toUpperCase() || "BANK"}</Text>
              <Text style={s.bankText}>{item.bankDetails.accountName} • {item.bankDetails.accountNumber}</Text>
            </View>
          </View>
        ) : (
          <View style={s.methodBox}>
            <MaterialCommunityIcons name="wallet-outline" size={16} color={T.text2} />
            <Text style={s.methodText}>Method: {item.method}</Text>
          </View>
        )}

        {item.khqrImageUrl && (
          <View style={s.khqrBadge}>
            <MaterialCommunityIcons name="qrcode-scan" size={14} color={T.success} />
            <Text style={s.khqrText}>KHQR Code Available</Text>
          </View>
        )}
      </View>

      {item.status === "pending" && (
        <View style={s.cardFooter}>
          <TouchableOpacity
            style={[s.rejectBtn, processingId === item.id && { opacity: 0.7 }]}
            onPress={() => handleReject(item.id)}
            disabled={processingId === item.id}
          >
            <Text style={s.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.processBtn, processingId === item.id && { opacity: 0.7 }]}
            onPress={() => handleProcess(item.id)}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.processBtnText}>Disburse Payout</Text>
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
          <Text style={s.headerTitle}>Company Payouts</Text>
        </View>
      </View>

      <View style={s.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
          {["all", "pending", "completed", "rejected"].map(f => (
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
              <Text style={s.emptyText}>No company payouts found.</Text>
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
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  filterText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  filterTextActive: { color: "#fff" },

  listContent: { padding: 16, gap: 12, paddingBottom: 60 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { marginTop: 12, color: T.text3, fontWeight: "500", fontSize: 14 },

  card: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  typeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  amount: { fontSize: 20, fontWeight: "700", color: T.text1 },

  cardBody: { gap: 4, marginBottom: 16 },
  recipientName: { fontSize: 16, fontWeight: "700", color: T.text1 },
  recipientEmail: { fontSize: 13, color: T.text2, marginBottom: 2 },
  dateText: { fontSize: 12, color: T.text3 },
  txnText: { fontSize: 12, color: T.accentMid, fontWeight: "600", marginTop: 2 },
  methodBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  methodText: { fontSize: 12, color: T.text2, textTransform: "capitalize" },

  bankBox: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, padding: 10, backgroundColor: T.bg, borderRadius: 10, borderWidth: 1, borderColor: T.border },
  bankName: { fontSize: 12, fontWeight: "700", color: T.text1, letterSpacing: 0.5 },
  bankText: { fontSize: 12, color: T.text2, marginTop: 2 },

  khqrBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: T.success + "15", borderRadius: 8, alignSelf: "flex-start" },
  khqrText: { fontSize: 11, fontWeight: "600", color: T.success },

  cardFooter: { flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: T.border, paddingTop: 14 },
  rejectBtn: { flex: 1, backgroundColor: T.error + "15", borderRadius: 12, paddingVertical: 11, alignItems: "center", borderWidth: 1, borderColor: T.error + "30" },
  rejectBtnText: { color: T.error, fontWeight: "700", fontSize: 13 },
  processBtn: { flex: 2, backgroundColor: T.accent, borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  processBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
