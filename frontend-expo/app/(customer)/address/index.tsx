import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentLight: "#F7F7F7", accentMid: "#1E3A8A",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  error: "#E31C5F", errorBg: "#FEF2F2",
  gold: "#F59E0B", success: "#00A699", tag: "#F3F4F6",
};

const SHADOW = {};

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

function PressCard({ onPress, style, children }: { onPress: () => void; style?: any; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function AddressListScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/addresses");
      const data = res.data?.data ?? res.data;
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", "Could not load addresses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Address", "Are you sure you want to delete this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/addresses/${id}`);
            setAddresses((prev) => prev.filter((a) => a.id !== id));
          } catch {
            Alert.alert("Error", "Failed to delete address.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Address }) => {
    const isHome = item.label.toLowerCase() === "home";
    const isOffice = item.label.toLowerCase() === "office";
    const iconName = isHome ? "home" : isOffice ? "office-building" : "map-marker";

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.cardTitleRow}>
            <View style={s.iconBox}>
              <MaterialCommunityIcons name={iconName} size={20} color={T.accent} />
            </View>
            <Text style={s.cardTitle}>{item.label}</Text>
            {item.isDefault && (
              <View style={s.defaultBadge}>
                <Text style={s.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <View style={s.cardActions}>
            <TouchableOpacity onPress={() => router.push(`/(customer)/address/${item.id}` as any)} style={s.actionBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color={T.text2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.actionBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={T.error} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={s.addressText}>{item.address}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          onPress={() => router.push("/(customer)/address/new" as any)}
          style={s.addBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={24} color={T.accent} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={s.content}>
        {loading ? (
          <ActivityIndicator size="large" color={T.accent} style={{ marginTop: 40 }} />
        ) : addresses.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconBox}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={T.text3} />
            </View>
            <Text style={s.emptyTitle}>No saved addresses</Text>
            <Text style={s.emptyDesc}>
              Add your home or office address to make booking faster.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(customer)/address/new" as any)}
              style={s.btnPrimary}
              activeOpacity={0.85}
            >
              <Text style={s.btnPrimaryText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: T.accentLight },

  content: { flex: 1 },
  listContent: { padding: 24, paddingBottom: 100 },

  card: { backgroundColor: T.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: T.border, ...SHADOW },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },
  defaultBadge: { backgroundColor: T.accentLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: T.border },
  defaultBadgeText: { fontSize: 10, fontWeight: "800", color: T.accentMid, letterSpacing: 0.5 },
  
  cardActions: { flexDirection: "row", gap: 4 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: T.bg },

  addressText: { fontSize: 14, color: T.text2, lineHeight: 20, marginLeft: 44 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 1, borderColor: T.border, ...SHADOW },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: T.text3, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  btnPrimary: { backgroundColor: T.accent, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, ...SHADOW },
  btnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});