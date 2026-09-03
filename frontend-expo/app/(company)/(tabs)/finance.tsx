import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, StyleSheet, Platform, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW: ViewStyle = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
}) || {};

export default function B2BFinanceTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, pending: 0 });
  const [payouts, setPayouts] = useState<any[]>([]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/company/payouts");
      const data = res.data?.data ?? res.data;
      setWallet({
        balance: Number(data?.availableBalance ?? 0),
        pending: Number(data?.pendingBalance ?? 0),
      });
      const rawPayouts = Array.isArray(data?.payouts) ? data.payouts : [];
      setPayouts(
        rawPayouts.map((p: any) => ({
          id: p.id,
          date: p.createdAt ? p.createdAt.split("T")[0] : "Today",
          amount: Number(p.amount ?? 0),
          status: p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "Completed",
          bank: p.bankName || p.method || "Bank Payout",
        }))
      );
    } catch (e) {
      console.error("Failed to load company finance data", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFinanceData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFinanceData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Finance</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[T.accent]} />}
      >
        
        {/* Balance Card */}
        <View style={[s.card, CARD_SHADOW, { backgroundColor: T.accent, borderColor: T.accent }]}>
          <Text style={s.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={s.balanceText}>${wallet.balance.toFixed(2)}</Text>
          
          <View style={s.divider} />
          
          <View style={s.balanceStats}>
            <View>
              <Text style={s.statLabel}>Pending Settlement</Text>
              <Text style={s.statValue}>${wallet.pending.toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push("/(company)/payments" as any)} 
              style={s.withdrawBtn}
            >
              <Text style={s.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payout Channels */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Payout Settings</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(company)/payments" as any)} style={[s.rowCard, CARD_SHADOW]}>
          <View style={s.rowIconBox}>
            <MaterialCommunityIcons name="bank-outline" size={24} color={T.accent} />
          </View>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Bank & QR Payout Details</Text>
            <Text style={s.rowSubtitle}>Manage ABA KHQR & Bank Transfers</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={T.text3} />
        </TouchableOpacity>

        {/* Payout History */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Payout History</Text>
        </View>

        <View style={s.payoutList}>
          {payouts.length === 0 ? (
            <View style={[s.payoutItem, CARD_SHADOW, { justifyContent: "center", paddingVertical: 20 }]}>
              <Text style={{ fontSize: 13, color: T.text3, fontWeight: "600" }}>No payout requests yet</Text>
            </View>
          ) : (
            payouts.map((p) => (
              <View key={p.id} style={[s.payoutItem, CARD_SHADOW]}>
                <View>
                  <Text style={s.payoutBank}>{p.bank}</Text>
                  <Text style={s.payoutDate}>{p.date}</Text>
                </View>
                <View style={s.payoutRight}>
                  <Text style={s.payoutAmount}>+${p.amount.toFixed(2)}</Text>
                  <View style={s.statusBadge}>
                    <Text style={s.statusText}>{p.status}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: T.text1 },
  
  scrollContent: { padding: 20 },
  
  card: {
    borderRadius: 24, padding: 24, marginBottom: 24,
    borderWidth: 1,
  },
  balanceLabel: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.7)", letterSpacing: 1.2 },
  balanceText: { fontSize: 36, fontWeight: "900", color: "#FFF", marginTop: 8 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 20 },
  
  balanceStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.6)" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#FFF", marginTop: 2 },
  
  withdrawBtn: { backgroundColor: "#FFF", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  withdrawBtnText: { fontSize: 12, fontWeight: "800", color: T.accent, textTransform: "uppercase" },

  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: T.text1, letterSpacing: -0.2 },

  rowCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.surface,
    borderRadius: 18, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: T.border,
  },
  rowIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, marginLeft: 14 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: T.text1 },
  rowSubtitle: { fontSize: 11, fontWeight: "600", color: T.text3, marginTop: 2 },

  payoutList: { gap: 10 },
  payoutItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: T.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: T.border,
  },
  payoutBank: { fontSize: 14, fontWeight: "700", color: T.text1 },
  payoutDate: { fontSize: 11, fontWeight: "600", color: T.text3, marginTop: 2 },
  payoutRight: { alignItems: "flex-end" },
  payoutAmount: { fontSize: 15, fontWeight: "800", color: "#10B981" },
  statusBadge: { backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 4 },
  statusText: { fontSize: 9, fontWeight: "800", color: "#047857" },
});
