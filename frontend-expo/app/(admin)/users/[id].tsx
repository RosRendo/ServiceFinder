import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A",
  text1: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  success: "#10B981", warning: "#F59E0B", error: "#EF4444",
  blue: "#3B82F6", gray: "#6B7280",
};



interface UserDetailData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  createdAt?: string;
  lastLoginAt?: string;
  ownedCompanies: { id: string; name: string; verificationStatus: string }[];
  staffMemberships: { id: string; company: { id: string; name: string } }[];
  stats: {
    bookings: number;
    reviews: number;
  };
}

export default function UserDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/api/users/${id}`);
        const data = res.data?.data || res.data;
        const obj = data.user || data;
        setUser({
          id: obj.id?.toString(),
          fullName: obj.fullName || obj.name || "Unknown",
          email: obj.email || "",
          phone: obj.phone || "",
          role: obj.role || "user",
          status: obj.status || "active",
          avatar: obj.avatar || obj.avatarUrl || null,
          createdAt: obj.createdAt
            ? new Date(obj.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })
            : "—",
          lastLoginAt: obj.lastLoginAt
            ? new Date(obj.lastLoginAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })
            : "—",
          ownedCompanies: obj.ownedCompanies || [],
          staffMemberships: obj.staffMemberships || [],
          stats: {
             bookings: obj._count?.bookingsAsCustomer || 0,
             reviews: obj._count?.reviews || 0,
          }
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Could not load user details.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSuspend = async () => {
    if (!user) return;
    Alert.alert(
      "Suspend User",
      `Are you sure you want to suspend ${user.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.patch(`/api/users/${id}/status`, { status: "suspended" });
              setUser((prev) => prev ? { ...prev, status: "suspended" } : prev);
            } catch {
              Alert.alert("Error", "Could not suspend this user.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!user) return;
    Alert.alert(
      "Delete Account",
      `Permanently delete ${user.fullName}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.delete(`/api/users/${id}`);
              router.replace("/(admin)/(tabs)/users" as any);
            } catch {
              Alert.alert("Error", "Could not delete this user.");
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMessageUser = async () => {
    if (!user) return;
    try {
      setActionLoading(true);
      const res = await api.post('/api/conversations', { targetUserId: String(user.id) });
      const resData = res.data?.data || res.data;
      const convId = resData.data?.id || resData.id || resData.data?.data?.id;
      if (convId) {
        router.push(`/(admin)/messages/${convId}?otherName=${encodeURIComponent(user.fullName)}` as any);
      } else {
        Alert.alert('Error', 'Could not start conversation: No ID returned.');
      }
    } catch (err: any) {
      console.error("Failed to start conversation", err?.response?.data || err);
      const msg = err?.response?.data?.message || err.message || 'Unknown error';
      Alert.alert('Error', `Could not start conversation: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const roleLabel = (role: string) =>
    role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const getStatusStyle = (status: string) => {
    return status === 'active' 
      ? { bg: T.success + "15", color: T.success }
      : { bg: T.error + "15", color: T.error };
  };

  if (loading) {
    return (
      <SafeAreaView style={s.centerArea} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={s.loadingText}>Loading user…</Text>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={s.centerArea} edges={['top', 'left', 'right']}>
        <MaterialCommunityIcons name="account-alert" size={48} color={T.error} />
        <Text style={s.errorText}>{error || "User not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const sStyle = getStatusStyle(user.status);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        
        {/* User Header Card */}
        <View style={s.userCard}>
          <View style={s.userCardRow}>
            <View style={s.avatarWrap}>
              <Image
                source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1E3A8A&color=fff` }}
                style={s.avatar}
              />
              <View style={[s.avatarStatusDot, { backgroundColor: sStyle.color }]} />
            </View>
            <View style={s.userInfo}>
              <View style={s.userInfoTop}>
                <View>
                  <Text style={s.userName}>{user.fullName}</Text>
                  <Text style={s.userId}>#{user.id}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
                  <Text style={[s.statusText, { color: sStyle.color }]}>{user.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.quickActionsRow}>
          <TouchableOpacity style={s.quickActionBtn} onPress={handleMessageUser} disabled={actionLoading}>
            <View style={[s.quickActionIconWrap, { backgroundColor: T.blue + "15" }]}>
              <MaterialCommunityIcons name="email" size={20} color={T.blue} />
            </View>
            <Text style={s.quickActionLabel}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.quickActionBtn} onPress={handleSuspend} disabled={actionLoading}>
            <View style={[s.quickActionIconWrap, { backgroundColor: T.warning + "15" }]}>
              <MaterialCommunityIcons name="block-helper" size={20} color={T.warning} />
            </View>
            <Text style={[s.quickActionLabel, { color: T.warning }]}>Suspend</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Contact Information</Text>
          <View style={s.infoList}>
            <View style={s.infoRow}>
              <View style={s.infoIconBox}>
                <MaterialCommunityIcons name="email-outline" size={20} color={T.text2} />
              </View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoLabel}>Email Address</Text>
                <Text style={s.infoValue}>{user.email}</Text>
              </View>
            </View>
            {!!user.phone && (
              <View style={s.infoRow}>
                <View style={s.infoIconBox}>
                  <MaterialCommunityIcons name="phone-outline" size={20} color={T.text2} />
                </View>
                <View style={s.infoTextWrap}>
                  <Text style={s.infoLabel}>Phone Number</Text>
                  <Text style={s.infoValue}>{user.phone}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Account Details */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Account Details</Text>
          <View style={s.grid}>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Role</Text>
              <Text style={s.gridValue}>{roleLabel(user.role)}</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Join Date</Text>
              <Text style={s.gridValue}>{user.createdAt}</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Last Login</Text>
              <Text style={s.gridValue}>{user.lastLoginAt}</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Status</Text>
              <Text style={[s.gridValue, { color: sStyle.color, textTransform: "capitalize" }]}>{user.status}</Text>
            </View>
          </View>
        </View>

        {/* Activity Stats */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Activity Overview</Text>
          <View style={s.grid}>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Total Bookings</Text>
              <Text style={s.gridValue}>{user.stats.bookings}</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Reviews Left</Text>
              <Text style={s.gridValue}>{user.stats.reviews}</Text>
            </View>
          </View>
        </View>

        {/* Companies & Staff */}
        {(user.ownedCompanies.length > 0 || user.staffMemberships.length > 0) && (
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Associated Companies</Text>
            <View style={s.infoList}>
              {user.ownedCompanies.map((c) => (
                <View key={`owned-${c.id}`} style={s.infoRow}>
                  <View style={s.infoIconBox}>
                    <MaterialCommunityIcons name="domain" size={20} color={T.blue} />
                  </View>
                  <View style={s.infoTextWrap}>
                    <Text style={s.infoLabel}>Owner Of</Text>
                    <Text style={s.infoValue}>{c.name}</Text>
                  </View>
                </View>
              ))}
              {user.staffMemberships.map((m) => (
                <View key={`staff-${m.id}`} style={s.infoRow}>
                  <View style={s.infoIconBox}>
                    <MaterialCommunityIcons name="briefcase-account-outline" size={20} color={T.text2} />
                  </View>
                  <View style={s.infoTextWrap}>
                    <Text style={s.infoLabel}>Staff Member</Text>
                    <Text style={s.infoValue}>{m.company.name}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Danger Zone */}
        <View style={s.dangerCard}>
          <Text style={s.dangerTitle}>Danger Zone</Text>
          <Text style={s.dangerDesc}>
            Permanently delete this user and all associated data. This action is irreversible.
          </Text>
          <TouchableOpacity onPress={handleDelete} disabled={actionLoading} style={s.dangerBtn}>
            <MaterialCommunityIcons name="delete-forever" size={20} color="#fff" />
            <Text style={s.dangerBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  centerArea: { flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: T.text3, fontWeight: "500" },
  errorText: { marginTop: 16, fontSize: 16, fontWeight: "600", color: T.error },
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: T.accent, borderRadius: 24 },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  headerBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  content: { padding: 16, gap: 16, paddingBottom: 60 },

  userCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border },
  userCardRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  avatarWrap: { position: "relative" },
  avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: T.bg },
  avatarStatusDot: { position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: T.surface },
  userInfo: { flex: 1 },
  userInfoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  userName: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 2 },
  userId: { fontSize: 13, fontWeight: "500", color: T.text3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  quickActionsRow: { flexDirection: "row", gap: 12 },
  quickActionBtn: { flex: 1, backgroundColor: T.surface, borderRadius: 16, padding: 16, alignItems: "center", gap: 8, borderWidth: 1, borderColor: T.border },
  quickActionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 12, fontWeight: "700", color: T.text2, textTransform: "uppercase" },

  sectionCard: { backgroundColor: T.surface, borderRadius: 20, padding: 20,  },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: T.text3, textTransform: "uppercase", letterSpacing: 0.5 },
  infoList: { gap: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", color: T.text3, marginBottom: 2, textTransform: "uppercase" },
  infoValue: { fontSize: 14, fontWeight: "600", color: T.text1 },

  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 24 },
  gridItem: { width: "50%" },
  gridLabel: { fontSize: 11, fontWeight: "600", color: T.text3, marginBottom: 4, textTransform: "uppercase" },
  gridValue: { fontSize: 14, fontWeight: "700", color: T.text1 },

  dangerCard: { backgroundColor: T.error + "10", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: T.error + "30", gap: 12 },
  dangerTitle: { fontSize: 12, fontWeight: "800", color: T.error, textTransform: "uppercase", letterSpacing: 0.5 },
  dangerDesc: { fontSize: 13, color: T.error, opacity: 0.8, lineHeight: 20 },
  dangerBtn: { backgroundColor: T.error, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  dangerBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

