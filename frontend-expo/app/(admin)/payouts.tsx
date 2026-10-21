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
      case "pending": return "#D97706";
      case "completed": return "#059669";
      case "rejected": return "#DC2626";
      default: return "#64748B";
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={s.typeBadge}>
            <MaterialCommunityIcons name="office-building" size={12} color="#0F172A" style={{ marginRight: 4 }} />
            <Text style={s.typeBadgeText}>Company Payout</Text>
          </View>
          <View style={s.statusBadge}>
            <View style={[s.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={s.statusBadgeText}>
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
            <MaterialCommunityIcons name="bank" size={18} color="#0F172A" />
            <View style={{ flex: 1 }}>
              <Text style={s.bankName}>{item.bankDetails.type?.toUpperCase() || "BANK"}</Text>
              <Text style={s.bankText}>{item.bankDetails.accountName} • {item.bankDetails.accountNumber}</Text>
            </View>
          </View>
        ) : (
          <View style={s.methodBox}>
            <MaterialCommunityIcons name="wallet-outline" size={16} color="#475569" />
            <Text style={s.methodText}>Method: {item.method}</Text>
          </View>
        )}

        {item.khqrImageUrl && (
          <View style={s.khqrBadge}>
            <MaterialCommunityIcons name="qrcode-scan" size={14} color="#059669" />
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
            accessibilityLabel="Back or Menu"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else openSidebar(true);
            }} 
            style={s.menuBtn}
          >
            <MaterialCommunityIcons name={router.canGoBack() ? "arrow-left" : "menu"} size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payout Disbursements</Text>
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
        <View style={s.centerBox}><ActivityIndicator size="large" color="#0F172A" /></View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchPayouts()} />
      ) : (
        <FlatList
          data={filteredPayouts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPayouts(true)} tintColor="#0F172A" />}
          ListEmptyComponent={
            <View style={s.centerBox}>
              <MaterialCommunityIcons name="bank-transfer-out" size={48} color="#94A3B8" />
              <Text style={s.emptyText}>No company payouts found.</Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  filtersContainer: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  filtersScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: "center" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  filterChipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterTextActive: { color: "#FFFFFF" },

  listContent: { padding: 16, gap: 12, paddingBottom: 120 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { marginTop: 12, color: "#64748B", fontWeight: "500", fontSize: 14 },

  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  typeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  typeBadgeText: { fontSize: 11, fontWeight: "700", color: "#0F172A" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#0F172A" },
  amount: { fontSize: 20, fontWeight: "700", color: "#0F172A" },

  cardBody: { gap: 4, marginBottom: 16 },
  recipientName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  recipientEmail: { fontSize: 13, color: "#475569", marginBottom: 2 },
  dateText: { fontSize: 12, color: "#64748B" },
  txnText: { fontSize: 12, color: "#64748B", fontWeight: "600", marginTop: 2 },
  methodBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  methodText: { fontSize: 12, color: "#475569", textTransform: "capitalize" },

  bankBox: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, padding: 10, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  bankName: { fontSize: 12, fontWeight: "700", color: "#0F172A", letterSpacing: 0.5 },
  bankText: { fontSize: 12, color: "#475569", marginTop: 2 },

  khqrBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#F8FAFC", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", alignSelf: "flex-start" },
  khqrText: { fontSize: 11, fontWeight: "600", color: "#059669" },

  cardFooter: { flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 14 },
  rejectBtn: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 11, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  rejectBtnText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
  processBtn: { flex: 2, backgroundColor: "#0F172A", borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  processBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
});
