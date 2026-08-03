/**
 * Admin Promo Codes Screen (Mobile)
 */
import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, Alert, Switch
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function PromotionsScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      setPromos(list);
    } catch (error: any) {
      console.error("Failed to fetch promos", error);
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
        code: code.toUpperCase(),
        discountPercent: Number(discountPercent),
        maxUses: maxUses ? Number(maxUses) : undefined,
        isActive: true,
      });
      Alert.alert("Success", "Promo code created!");
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
      Alert.alert("Error", "Failed to toggle promo code");
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.codeWrap}>
          <MaterialCommunityIcons name="ticket-percent" size={20} color={T.accent} />
          <Text style={s.codeText}>{item.code}</Text>
        </View>
        <Switch 
          value={item.isActive} 
          onValueChange={() => handleToggle(item.id, item.isActive)}
          trackColor={{ false: T.border, true: T.success }}
        />
      </View>
      
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{item.discountPercent}%</Text>
          <Text style={s.statLabel}>Discount</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>{item.uses || 0} {item.maxUses ? `/ ${item.maxUses}` : ''}</Text>
          <Text style={s.statLabel}>Uses</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Global Promos</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={s.addBtn}>
          <MaterialCommunityIcons name="plus" size={24} color={T.accent} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
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
              <MaterialCommunityIcons name="ticket-outline" size={48} color={T.text3} />
              <Text style={s.emptyTitle}>No Promo Codes</Text>
              <Text style={s.emptySub}>Tap the + icon to create one</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Promo Code</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={T.text2} />
            </TouchableOpacity>
          </View>
          
          <View style={s.modalContent}>
            <Text style={s.label}>Code Name</Text>
            <TextInput 
              style={s.input}
              placeholder="e.g. SUMMER25"
              placeholderTextColor={T.text3}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <Text style={s.label}>Discount Percentage (%)</Text>
            <TextInput 
              style={s.input}
              placeholder="e.g. 15"
              placeholderTextColor={T.text3}
              keyboardType="number-pad"
              value={discountPercent}
              onChangeText={setDiscountPercent}
            />

            <Text style={s.label}>Max Uses (Optional)</Text>
            <TextInput 
              style={s.input}
              placeholder="Leave blank for unlimited"
              placeholderTextColor={T.text3}
              keyboardType="number-pad"
              value={maxUses}
              onChangeText={setMaxUses}
            />

            <TouchableOpacity style={s.submitBtn} onPress={handleCreate} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.submitBtnText}>Create Promo Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { padding: 4, marginRight: 12, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1, flex: 1 },
  addBtn: { padding: 4 },
  
  listContent: { padding: 16, paddingBottom: 40, gap: 12 },
  
  card: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1, borderColor: T.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  codeWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeText: { fontSize: 18, fontWeight: "800", color: T.text1, textTransform: "uppercase" },
  
  statsRow: {
    flexDirection: "row",
    backgroundColor: T.bg,
    borderRadius: 8,
    padding: 12,
  },
  statBox: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: "800", color: T.text1 },
  statLabel: { fontSize: 12, color: T.text2, marginTop: 2 },
  
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.text2, marginTop: 16, marginBottom: 4 },
  emptySub: { fontSize: 14, color: T.text3, textAlign: "center" },

  modalRoot: { flex: 1, backgroundColor: T.bg },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  modalContent: { padding: 20 },
  
  label: { fontSize: 13, fontWeight: "600", color: T.text2, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: T.text1,
  },
  
  submitBtn: {
    backgroundColor: T.accent,
    paddingVertical: 16, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    marginTop: 32,
  },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
