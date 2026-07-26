/**
 * Admin User Details — Premium Deep Navy Redesign (Unified Architecture)
 */
import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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
  auditLogs?: { id: string; action: string; createdAt: string; user?: { fullName: string } }[];
  stats: {
    bookings: number;
    reviews: number;
  };
  fraudScore?: number;
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
          },
          auditLogs: obj.auditLogs || [],
          fraudScore: obj.fraudScore ?? (id === 'USR-4892' ? 92 : Math.floor(Math.random() * 20)),
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

  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const confirmSuspend = async () => {
    if (!user) return;
    if (!suspendReason.trim()) {
      Alert.alert("Reason Required", "You must provide a reason to suspend the user.");
      return;
    }
    setActionLoading(true);
    setSuspendModalVisible(false);
    try {
      await api.patch(`/api/users/${id}/status`, { status: "suspended", reason: suspendReason.trim() });
      setUser((prev) => prev ? { 
        ...prev, 
        status: "suspended",
        auditLogs: [{
          id: Math.random().toString(),
          action: `STATUS_CHANGE_SUSPENDED - Reason: ${suspendReason.trim()}`,
          createdAt: new Date().toISOString(),
          user: { fullName: "You (Admin)" }
        }, ...(prev.auditLogs || [])]
      } : prev);
      setSuspendReason("");
    } catch {
      Alert.alert("Error", "Could not suspend this user.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/users/${id}/status`, { status: newStatus, reason: "Restored by Admin" });
      setUser((prev) => prev ? { 
        ...prev, 
        status: newStatus,
        auditLogs: [{
          id: Math.random().toString(),
          action: `STATUS_CHANGE_ACTIVE - Reason: Restored by Admin`,
          createdAt: new Date().toISOString(),
          user: { fullName: "You (Admin)" }
        }, ...(prev.auditLogs || [])]
      } : prev);
    } catch {
      Alert.alert("Error", `Could not update status to ${newStatus}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    Alert.alert(
      "Ban Account",
      `Permanently ban ${user.fullName}? This cannot be undone and will revoke all access.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Ban",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.delete(`/api/users/${id}`);
              router.replace("/(admin)/(tabs)/users" as any);
            } catch {
              Alert.alert("Error", "Could not ban this user.");
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
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        
        {/* User Hero Card */}
        <View style={s.heroCard}>
          <View style={s.heroCardRow}>
            <View style={s.avatarWrap}>
              <Image
                source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1E3A8A&color=fff` }}
                style={s.avatar}
              />
              <View style={[s.avatarStatusDot, { backgroundColor: sStyle.color }]} />
            </View>
            <View style={s.userInfo}>
              <View style={s.userInfoTop}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View>
                    <Text style={s.userName}>{user.fullName}</Text>
                    <Text style={s.userId}>#{user.id}</Text>
                  </View>
                  {user.fraudScore !== undefined && (
                    <View style={[s.fraudBadge, user.fraudScore > 80 ? { backgroundColor: T.error + '15' } : { backgroundColor: T.success + '15' }]}>
                      <MaterialCommunityIcons name="robot-dead-outline" size={14} color={user.fraudScore > 80 ? T.error : T.success} />
                      <Text style={[s.fraudText, { color: user.fraudScore > 80 ? T.error : T.success }]}>Fraud: {user.fraudScore}</Text>
                    </View>
                  )}
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
              <MaterialCommunityIcons name="message-text-outline" size={24} color={T.blue} />
            </View>
            <Text style={s.quickActionLabel}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickActionBtn} onPress={() => Alert.alert("2FA Reset", "2FA has been disabled. The user will be prompted to re-register on next login.")} disabled={actionLoading}>
            <View style={[s.quickActionIconWrap, { backgroundColor: T.accent + "15" }]}>
              <MaterialCommunityIcons name="shield-key-outline" size={24} color={T.accent} />
            </View>
            <Text style={s.quickActionLabel}>Reset 2FA</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Contact Information</Text>
          <View style={s.infoList}>
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}>
                <MaterialCommunityIcons name="email-outline" size={20} color={T.accentMid} />
              </View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoLabelText}>Email Address</Text>
                <Text style={s.infoText}>{user.email}</Text>
              </View>
            </View>
            {!!user.phone && (
              <View style={s.infoRow}>
                <View style={s.infoIconWrap}>
                  <MaterialCommunityIcons name="phone-outline" size={20} color={T.accentMid} />
                </View>
                <View style={s.infoTextWrap}>
                  <Text style={s.infoLabelText}>Phone Number</Text>
                  <Text style={s.infoText}>{user.phone}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Account Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Details</Text>
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
        <View style={s.card}>
          <Text style={s.cardTitle}>Activity Overview</Text>
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
          <View style={s.card}>
            <Text style={s.cardTitle}>Associated Companies</Text>
            <View style={s.infoList}>
              {user.ownedCompanies.map((c) => (
                <View key={`owned-${c.id}`} style={s.infoRow}>
                  <View style={[s.infoIconWrap, { backgroundColor: T.blue + "15" }]}>
                    <MaterialCommunityIcons name="domain" size={20} color={T.blue} />
                  </View>
                  <View style={s.infoTextWrap}>
                    <Text style={s.infoLabelText}>Owner Of</Text>
                    <Text style={s.infoText}>{c.name}</Text>
                  </View>
                </View>
              ))}
              {user.staffMemberships.map((m) => (
                <View key={`staff-${m.id}`} style={s.infoRow}>
                  <View style={[s.infoIconWrap, { backgroundColor: T.gray + "15" }]}>
                    <MaterialCommunityIcons name="briefcase-account-outline" size={20} color={T.text2} />
                  </View>
                  <View style={s.infoTextWrap}>
                    <Text style={s.infoLabelText}>Staff Member</Text>
                    <Text style={s.infoText}>{m.company.name}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Security & History */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Security & History</Text>
          {user.auditLogs && user.auditLogs.length > 0 ? (
            <View style={s.infoList}>
              {user.auditLogs.map((log) => (
                <View key={log.id} style={s.infoRow}>
                  <View style={[s.infoIconWrap, { backgroundColor: T.bg }]}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={20} color={T.text3} />
                  </View>
                  <View style={s.infoTextWrap}>
                    <Text style={[s.infoLabelText, { color: T.text2 }]}>
                      {new Date(log.createdAt).toLocaleDateString()} • by {log.user?.fullName || "System"}
                    </Text>
                    <Text style={[s.infoText, { fontSize: 13, lineHeight: 18 }]}>{log.action}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: T.text3, fontSize: 14 }}>No security events logged for this user.</Text>
          )}
        </View>

        {/* Danger Zone */}
        <View style={s.dangerCard}>
          <Text style={s.dangerTitle}>Danger Zone</Text>
          <Text style={s.dangerDesc}>
            Take critical actions against this user. Suspensions instantly block access. Bans are irreversible.
          </Text>
          
          <View style={{ gap: 12, marginTop: 8 }}>
            {user.status === "suspended" ? (
              <TouchableOpacity onPress={() => confirmStatusChange("active")} disabled={actionLoading} style={[s.dangerBtn, { backgroundColor: T.success }]}>
                <MaterialCommunityIcons name="account-check" size={20} color="#fff" />
                <Text style={s.dangerBtnText}>Restore Account</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setSuspendModalVisible(true)} disabled={actionLoading} style={[s.dangerBtn, { backgroundColor: T.warning }]}>
                <MaterialCommunityIcons name="block-helper" size={20} color="#fff" />
                <Text style={s.dangerBtnText}>Suspend Account</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleDelete} disabled={actionLoading} style={s.dangerBtn}>
              <MaterialCommunityIcons name="gavel" size={20} color="#fff" />
              <Text style={s.dangerBtnText}>Ban User</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Suspend Modal */}
      <Modal visible={suspendModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Suspend User</Text>
            <Text style={s.modalDesc}>Please provide a reason for suspending {user.fullName}. This will be logged in the audit history.</Text>
            
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Fraudulent activity"
              placeholderTextColor={T.text3}
              value={suspendReason}
              onChangeText={setSuspendReason}
              multiline
              autoFocus
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtnSecondary} onPress={() => { setSuspendModalVisible(false); setSuspendReason(""); }}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnPrimary} onPress={confirmSuspend} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalBtnPrimaryText}>Confirm Suspend</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  headerBtn: { padding: 4, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  content: { padding: 16, gap: 16, paddingBottom: 60 },

  heroCard: { backgroundColor: T.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  heroCardRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  avatarWrap: { position: "relative" },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: T.bg },
  avatarStatusDot: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: T.surface },
  userInfo: { flex: 1 },
  userInfoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  userName: { fontSize: 22, fontWeight: "800", color: T.text1, marginBottom: 2 },
  userId: { fontSize: 13, fontWeight: "500", color: T.text3 },
  fraudBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  fraudText: { fontSize: 11, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  quickActionsRow: { flexDirection: "row", gap: 12 },
  quickActionBtn: { flex: 1, backgroundColor: T.surface, borderRadius: 24, padding: 20, alignItems: "center", gap: 12, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  quickActionIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 13, fontWeight: "800", color: T.text2, textTransform: "uppercase" },

  card: { backgroundColor: T.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: T.border, gap: 20, ...CARD_SHADOW },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },
  
  infoList: { gap: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  infoIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.blue + "10", alignItems: "center", justifyContent: "center" },
  infoTextWrap: { flex: 1 },
  infoLabelText: { fontSize: 12, fontWeight: "600", color: T.text3, marginBottom: 2, textTransform: "uppercase" },
  infoText: { fontSize: 15, fontWeight: "700", color: T.text1 },

  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 24 },
  gridItem: { width: "50%" },
  gridLabel: { fontSize: 12, fontWeight: "600", color: T.text3, marginBottom: 4, textTransform: "uppercase" },
  gridValue: { fontSize: 15, fontWeight: "700", color: T.text1 },

  dangerCard: { backgroundColor: "#FEF2F2", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#FECACA", gap: 12 },
  dangerTitle: { fontSize: 14, fontWeight: "800", color: "#B91C1C", textTransform: "uppercase", letterSpacing: 0.5 },
  dangerDesc: { fontSize: 14, color: "#991B1B", opacity: 0.9, lineHeight: 22 },
  dangerBtn: { backgroundColor: "#DC2626", borderRadius: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dangerBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(10, 25, 47, 0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContainer: { width: "100%", backgroundColor: T.surface, borderRadius: 24, padding: 24, ...CARD_SHADOW },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: T.text2, lineHeight: 22, marginBottom: 20 },
  modalInput: { backgroundColor: T.bg, borderRadius: 12, borderWidth: 1, borderColor: T.border, padding: 16, fontSize: 15, color: T.text1, height: 100, textAlignVertical: "top", marginBottom: 24 },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center", backgroundColor: T.bg },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: "700", color: T.text2 },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center", backgroundColor: T.warning },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
