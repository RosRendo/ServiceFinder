/**
 * Company Marketing & Coupons Screen (Mobile)
 */
import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const TIPS = [
  { icon: "share-variant", title: "Share your profile", body: "Post your booking link on social media to get more visibility." },
  { icon: "star-circle", title: "Chase reviews", body: "Send a follow-up message after each job asking for a 5-star review." },
];

export default function MarketingScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [expiry, setExpiry] = useState("");

  const fetchCampaigns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/api/companies/my-company/campaigns');
      const data = res.data?.data || res.data || [];
      const mapped = data.map((c: any) => ({
        id: c.id,
        name: c.name || "Promo",
        discount: c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`,
        code: c.code,
        uses: c.uses || 0,
        maxUses: c.maxUses || null,
        expires: c.endDate ? new Date(c.endDate).toLocaleDateString() : "Never",
        status: c.isActive ? "active" : "paused",
        revenue: c.revenueGenerated || 0,
        conversions: c.conversions || 0,
      }));
      setCampaigns(mapped);
    } catch (error: any) {
      console.error("Failed to fetch campaigns", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = () => {
    if (!code.trim() || !discount.trim()) {
      return Alert.alert("Error", "Please enter a code and a discount.");
    }
    
    // Simulate creation (Backend POST does not exist yet)
    const newPromo = {
      id: Date.now().toString(),
      name: "New Promo",
      discount: discount.includes('%') ? discount : `${discount}% OFF`,
      code: code.toUpperCase(),
      uses: 0,
      maxUses: null,
      expires: expiry || "Never",
      status: "active",
      revenue: 0,
      conversions: 0,
    };

    setCampaigns([newPromo, ...campaigns]);
    setModalVisible(false);
    setCode("");
    setDiscount("");
    setExpiry("");
    Alert.alert("Success", "Coupon created successfully!");
  };

  const renderTip = ({ item }: { item: typeof TIPS[0] }) => (
    <View style={s.tipCard}>
      <View style={s.tipIconWrap}>
        <MaterialCommunityIcons name={item.icon as any} size={24} color={T.accent} />
      </View>
      <View style={s.tipTextWrap}>
        <Text style={s.tipTitle}>{item.title}</Text>
        <Text style={s.tipBody}>{item.body}</Text>
      </View>
    </View>
  );

  const renderCampaign = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.campaignName}>{item.name}</Text>
          <Text style={s.campaignCode}>{item.code}</Text>
        </View>
        <View style={[s.badge, item.status === 'active' ? s.badgeActive : s.badgePaused]}>
          <Text style={[s.badgeText, item.status === 'active' ? s.badgeTextActive : s.badgeTextPaused]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{item.discount}</Text>
          <Text style={s.statLabel}>Discount</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>{item.uses}</Text>
          <Text style={s.statLabel}>Redemptions</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statValue, { color: T.success }]}>${item.revenue}</Text>
          <Text style={s.statLabel}>Revenue</Text>
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
        <Text style={s.headerTitle}>Marketing</Text>
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
          data={campaigns}
          keyExtractor={(i) => i.id?.toString()}
          renderItem={renderCampaign}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchCampaigns(true)}
          ListHeaderComponent={
            <View style={{ marginBottom: 24 }}>
              <Text style={s.sectionTitle}>Marketing Tips</Text>
              <FlatList
                horizontal
                data={TIPS}
                renderItem={renderTip}
                keyExtractor={(item) => item.title}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
              />
              <Text style={[s.sectionTitle, { marginTop: 24 }]}>Active Coupons</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={48} color={T.text3} />
              <Text style={s.emptyTitle}>No Coupons</Text>
              <Text style={s.emptySub}>Tap the + icon to run a flash sale</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Flash Coupon</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={T.text2} />
            </TouchableOpacity>
          </View>
          
          <View style={s.modalContent}>
            <Text style={s.label}>Promo Code</Text>
            <TextInput 
              style={s.input}
              placeholder="e.g. FLASH20"
              placeholderTextColor={T.text3}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <Text style={s.label}>Discount (e.g. 20%)</Text>
            <TextInput 
              style={s.input}
              placeholder="e.g. 20"
              placeholderTextColor={T.text3}
              keyboardType="default"
              value={discount}
              onChangeText={setDiscount}
            />

            <Text style={s.label}>Expiry Date (Optional)</Text>
            <TextInput 
              style={s.input}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={T.text3}
              keyboardType="numbers-and-punctuation"
              value={expiry}
              onChangeText={setExpiry}
            />

            <TouchableOpacity style={s.submitBtn} onPress={handleCreate}>
              <Text style={s.submitBtnText}>Create Coupon</Text>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1, flex: 1 },
  addBtn: { padding: 4 },
  
  listContent: { padding: 16, paddingBottom: 40, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 8 },
  
  tipCard: {
    backgroundColor: T.surface,
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: T.border,
    width: 260, flexDirection: "row", gap: 12,
  },
  tipIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.accent + "15",
    alignItems: "center", justifyContent: "center",
  },
  tipTextWrap: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: "700", color: T.text1, marginBottom: 4 },
  tipBody: { fontSize: 13, color: T.text2, lineHeight: 18 },

  card: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1, borderColor: T.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  campaignName: { fontSize: 15, fontWeight: "700", color: T.text1 },
  campaignCode: { fontSize: 13, color: T.text2, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: T.success + "20" },
  badgePaused: { backgroundColor: T.border },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextActive: { color: T.success },
  badgeTextPaused: { color: T.text2 },
  
  statsRow: {
    flexDirection: "row",
    backgroundColor: T.bg,
    borderRadius: 8,
    padding: 12,
  },
  statBox: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: "700", color: T.text1 },
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
  modalTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
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
