import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;



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
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return { color: T.greenText, bg: T.greenBg };
    if (status === "suspended") return { color: T.error, bg: T.errorBg };
    return { color: T.warning, bg: T.warningBg };
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Users</Text>
        <View style={s.backBtn} />
      </View>

      <View style={s.searchContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={T.text3} />
          <TextInput
            style={s.searchInput}
            placeholder="Search users..."
            placeholderTextColor={T.text3}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        hasError ? (
          <ErrorState onRetry={() => fetchUsers()} />
        ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          {users.map((user) => {
            const statusConfig = getStatusColor(user.status);
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
                      <Text style={s.roleText}>{user.role.replace('_', ' ')}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Text style={[s.statusText, { color: statusConfig.color }]}>
                        {user.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ))}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, height: 56, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  
  searchContainer: {
    padding: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.bg, borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: T.border, height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: T.text1 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: T.border,
  },
  cardContent: { flex: 1, marginRight: 16 },
  userName: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 4 },
  userEmail: { fontSize: 14, color: T.text2, marginBottom: 12 },
  
  badgesContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: T.blueBg,
  },
  roleText: { color: T.blueText, fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
});

