/**
 * Admin Promo Codes Screen — Enterprise Operations Cockpit
 */
import React, { useState, useEffect, useCallback } from "react";
import { 
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

export default function PromotionsScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPromos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/api/promo-codes');
      const list = res.data?.data || res.data || [];
      setPromos(Array.isArray(list) ? list : []);
      setHasError(false);
    } catch (error: any) {
      console.error("Failed to fetch promos", error);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleCreate = async () => {
    if (!code.trim() || !discountPercent.trim()) {
      return Alert.alert("Error", "Please enter a code and a discount percentage.");
    }
    
    setSubmitting(true);
    try {
      await api.post('/api/promo-codes', {
        code: code.toUpperCase().trim(),
        discountPercent: Number(discountPercent),
        maxUses: maxUses ? Number(maxUses) : undefined,
        isActive: true,
      });
      Alert.alert("Success", "Promo code created successfully.");
      setModalVisible(false);
      setCode("");
      setDiscountPercent("");
      setMaxUses("");
      fetchPromos(true);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to create promo code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    // Optimistic update
    setPromos(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
    try {
      await api.patch(`/api/promo-codes/${id}/toggle`);
    } catch (error) {
      // Revert on failure
      setPromos(prev => prev.map(p => p.id === id ? { ...p, isActive: currentStatus } : p));
      Alert.alert("Error", "Failed to toggle promo code status.");
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isActive = !!item.isActive;
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.codeWrap}>
            <View style={s.codeBadge}>
              <Text style={s.codeText}>{item.code}</Text>
            </View>
            <View style={s.statusTag}>
              <View style={[s.statusDot, { backgroundColor: isActive ? "#059669" : "#94A3B8" }]} />
              <Text style={s.statusTagText}>{isActive ? "Active" : "Disabled"}</Text>
            </View>
          </View>
          <Switch 
            value={isActive} 
            onValueChange={() => handleToggle(item.id, item.isActive)}
            trackColor={{ false: "#CBD5E1", true: "#0F172A" }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Discount Rate</Text>
            <Text style={s.statValue}>{item.discountPercent}% OFF</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statLabel}>Redemptions</Text>
            <Text style={s.statValue}>{item.uses || 0} {item.maxUses ? `/ ${item.maxUses}` : '/ ∞'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Promotional Vouchers</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)} 
          style={s.addBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={s.addBtnText}>New Code</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchPromos()} />
      ) : (
        <FlatList
          data={promos}
          keyExtractor={(i) => i.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchPromos(true)}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={44} color="#94A3B8" />
              <Text style={s.emptyTitle}>No Promo Codes</Text>
              <Text style={s.emptySub}>Create promotional discounts to drive platform campaigns.</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Issue Promo Code</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>
          
          <View style={s.modalContent}>
            <Text style={s.label}>Voucher Code</Text>
            <TextInput 
              style={s.input}
              placeholder="e.g. ENTERPRISE20"
              placeholderTextColor="#94A3B8"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <Text style={s.label}>Discount Percentage (%)</Text>
            <TextInput 
              style={s.input}
              placeholder="e.g. 15"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={discountPercent}
              onChangeText={setDiscountPercent}
            />

            <Text style={s.label}>Max Usage Cap (Optional)</Text>
            <TextInput 
              style={s.input}
              placeholder="Leave blank for unlimited"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={maxUses}
              onChangeText={setMaxUses}
            />

            <TouchableOpacity 
              style={s.submitBtn} 
              onPress={handleCreate} 
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.submitBtnText}>Publish Promotion</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  
  listContent: { padding: 16, paddingBottom: 120, gap: 12 },
  
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  codeWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeBadge: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  statusTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTagText: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    alignItems: "center",
  },
  statBox: { flex: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: "#E2E8F0", marginHorizontal: 12 },
  statLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 12, marginBottom: 4 },
  emptySub: { fontSize: 13, color: "#64748B", textAlign: "center" },

  modalRoot: { flex: 1, backgroundColor: "#F8FAFC" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  modalCloseBtn: { padding: 4 },
  modalContent: { padding: 20 },
  
  label: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.3 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  
  submitBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
