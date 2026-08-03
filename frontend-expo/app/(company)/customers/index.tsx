/**
 * Company Customer CRM Screen (Mobile)
 */
import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, Linking, Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      // Matches web endpoint
      const res = await api.get(`/api/companies/my-company/customers?${params.toString()}`);
      
      const list = res.data?.data?.customers || res.data?.customers || res.data?.data || [];
      setCustomers(list);
    } catch (error: any) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, fetchCustomers]);

  const handleCall = (phone: string) => {
    if (!phone) return Alert.alert("No Phone", "This customer has no phone number on file.");
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    if (!email) return Alert.alert("No Email", "This customer has no email on file.");
    Linking.openURL(`mailto:${email}`);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.avatarWrap}>
          <MaterialCommunityIcons name="account" size={24} color={T.accent} />
        </View>
        <View style={s.cardInfo}>
          <Text style={s.name}>{item.name || item.fullName || "Unknown Customer"}</Text>
          <Text style={s.joined}>Joined {new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
        </View>
      </View>
      
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{item.totalBookings || 0}</Text>
          <Text style={s.statLabel}>Bookings</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>${Number(item.totalSpent || 0).toFixed(2)}</Text>
          <Text style={s.statLabel}>Spent</Text>
        </View>
      </View>

      <View style={s.actionsRow}>
        <TouchableOpacity 
          style={[s.actionBtn, { backgroundColor: T.accent + "10" }]} 
          onPress={() => handleCall(item.phone)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone-outline" size={18} color={T.accent} />
          <Text style={[s.actionText, { color: T.accent }]}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[s.actionBtn, { backgroundColor: T.success + "10" }]} 
          onPress={() => handleEmail(item.email)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="email-outline" size={18} color={T.success} />
          <Text style={[s.actionText, { color: T.success }]}>Email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Client CRM</Text>
      </View>

      <View style={s.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={T.text3} style={s.searchIcon} />
        <TextInput 
          style={s.searchInput}
          placeholder="Search name, email or phone..."
          placeholderTextColor={T.text3}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={s.clearBtn}>
            <MaterialCommunityIcons name="close-circle" size={18} color={T.text3} />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(i) => i.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchCustomers(true)}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={T.text3} />
              <Text style={s.emptyTitle}>No customers found</Text>
              <Text style={s.emptySub}>Try adjusting your search</Text>
            </View>
          }
        />
      )}
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  
  searchContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.surface,
    margin: 16, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 12, height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: T.text1 },
  clearBtn: { padding: 4 },
  
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  
  card: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1, borderColor: T.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.accent + "10",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 2 },
  joined: { fontSize: 12, color: T.text3 },
  
  statsRow: {
    flexDirection: "row",
    backgroundColor: T.bg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "800", color: T.text1 },
  statLabel: { fontSize: 12, color: T.text2, marginTop: 2 },
  
  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    height: 40, borderRadius: 8, gap: 6,
  },
  actionText: { fontSize: 14, fontWeight: "700" },
  
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.text2, marginTop: 16, marginBottom: 4 },
  emptySub: { fontSize: 14, color: T.text3, textAlign: "center" },
});
