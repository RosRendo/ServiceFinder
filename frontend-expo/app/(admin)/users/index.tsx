import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import ErrorState from "@/components/common/ErrorState";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/users?search=${search}`);
      const responseData = res.data?.data ?? res.data;
      setUsers(responseData.data || responseData.users || []);
    } catch (err) {
      console.error(err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDotColor = (status: string) => {
    if (status === "active") return "#059669";
    if (status === "suspended") return "#DC2626";
    return "#D97706";
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Accounts</Text>
        <View style={s.backBtnPlaceholder} />
      </View>

      <View style={s.searchContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            style={s.searchInput}
            placeholder="Search accounts by name or email..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchUsers()} />
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          {users.map((user) => {
            const dotColor = getStatusDotColor(user.status);
            return (
              <TouchableOpacity
                key={user.id}
                onPress={() => router.push(`/(admin)/users/${user.id}` as any)}
                style={s.card}
                activeOpacity={0.7}
              >
                <View style={s.cardContent}>
                  <Text style={s.userName}>{user.fullName}</Text>
                  <Text style={s.userEmail}>{user.email}</Text>
                  <View style={s.badgesContainer}>
                    <View style={s.roleBadge}>
                      <Text style={s.roleText}>{user.role.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                    <View style={s.statusBadge}>
                      <View style={[s.statusDot, { backgroundColor: dotColor }]} />
                      <Text style={s.statusText}>{user.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  backBtnPlaceholder: { width: 36 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  searchContainer: {
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#E2E8F0", height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#0F172A" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 10 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  cardContent: { flex: 1, marginRight: 16 },
  userName: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  userEmail: { fontSize: 13, color: "#64748B", marginBottom: 10 },

  badgesContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0",
  },
  roleText: { color: "#0F172A", fontSize: 10, fontWeight: "700" },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700", color: "#0F172A" },
});
