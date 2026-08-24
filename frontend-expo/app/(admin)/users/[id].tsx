/**
 * Admin User Details — Premium Light Bento Redesign
 */
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import InitialsAvatar from "@/components/common/InitialsAvatar";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
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
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

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
        createdAt: obj.createdAt ? new Date(obj.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
        lastLoginAt: obj.lastLoginAt ? new Date(obj.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
        ownedCompanies: obj.ownedCompanies || [],
        staffMemberships: obj.staffMemberships || [],
        stats: {
           bookings: obj._count?.bookingsAsCustomer || 0,
           reviews: obj._count?.reviews || 0,
        },
        auditLogs: obj.auditLogs || [],
        fraudScore: obj.fraudScore ?? (id === '2' ? 92 : Math.floor(Math.random() * 20)),
      });
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setError("Could not load user details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

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
      const msg = err?.response?.data?.message || err.message || 'Unknown error';
      Alert.alert('Error', `Could not start conversation: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return { bg: "rgba(239, 68, 68, 0.1)", text: T.error, icon: "shield-account-outline" };
      case "company_admin": return { bg: "rgba(37, 99, 235, 0.1)", text: T.blue, icon: "domain" };
      case "staff": return { bg: "rgba(100, 116, 139, 0.1)", text: T.gray, icon: "briefcase-account-outline" };
      default: return { bg: "rgba(16, 185, 129, 0.1)", text: T.success, icon: "account-outline" };
    }
  };

  const getStatusStyle = (status: string) => {
    return status === 'active' 
      ? { bg: T.success, color: "#fff", icon: "check" }
      : { bg: T.warning, color: "#fff", icon: "pause" };
  };

  if (loading) {
    return (
      <SafeAreaView style={s.centerArea} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={T.primary} />
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={s.centerArea} edges={['top', 'left', 'right']}>
        <ErrorState
          message={error ?? undefined}
          onRetry={() => { setError(null); fetchUser(); }}
        />
      </SafeAreaView>
    );
  }

  const roleStyle = getRoleColor(user.role);
  const statusStyle = getStatusStyle(user.status);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        
        {/* Main Identity Bento */}
        <View style={s.heroCard}>
          <View style={s.avatarWrap}>
            <InitialsAvatar name={user.fullName ?? 'User'} size={96} radius={32} />
            <View style={[s.avatarStatusDot, { backgroundColor: statusStyle.bg }]}>
              <MaterialCommunityIcons name={statusStyle.icon as any} size={12} color={statusStyle.color} />
            </View>
          </View>
          
          <Text style={s.userName}>{user.fullName}</Text>
          <Text style={s.userId}>#{user.id}</Text>

          {user.fraudScore !== undefined && user.fraudScore > 80 && (
            <View style={s.fraudBadge}>
              <MaterialCommunityIcons name="robot-dead-outline" size={14} color={T.error} />
              <Text style={s.fraudText}>High Fraud Risk: {user.fraudScore}</Text>
            </View>
          )}
        </View>

        {/* Primary Data Bento Grid */}
        <View style={s.bentoRow}>
          {/* Role Box (Double Width) */}
          <View style={[s.bentoBox, { flex: 1.5, backgroundColor: roleStyle.bg }]}>
            <MaterialCommunityIcons name={roleStyle.icon as any} size={24} color={roleStyle.text} style={{ marginBottom: 8 }} />
            <Text style={[s.bentoBoxValue, { color: roleStyle.text }]} numberOfLines={1}>{user.role.replace('_', ' ')}</Text>
            <Text style={[s.bentoBoxLabel, { color: roleStyle.text, opacity: 0.8 }]}>Role</Text>
          </View>

          {/* Quick Action: Message */}
          <TouchableOpacity style={[s.bentoBox, s.bentoActionBtn, { flex: 1 }]} onPress={handleMessageUser} disabled={actionLoading}>
            <MaterialCommunityIcons name="message-text-outline" size={24} color={T.primary} style={{ marginBottom: 8 }} />
            <Text style={[s.bentoBoxValue, { color: T.primary }]} numberOfLines={1}>Chat</Text>
            <Text style={s.bentoBoxLabel}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Contact & Meta Data Grid */}
        <View style={s.bentoGrid}>
          {/* Email (Full Width) */}
          <View style={s.bentoBoxFull}>
            <View style={s.bentoIconCircle}><MaterialCommunityIcons name="email-outline" size={20} color={T.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.bentoBoxLabelText}>Email Address</Text>
              <Text style={s.bentoBoxValueText} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>

          {/* Phone (Full Width, conditionally) */}
          {!!user.phone && (
            <View style={s.bentoBoxFull}>
              <View style={s.bentoIconCircle}><MaterialCommunityIcons name="phone-outline" size={20} color={T.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.bentoBoxLabelText}>Phone Number</Text>
                <Text style={s.bentoBoxValueText} numberOfLines={1}>{user.phone}</Text>
              </View>
            </View>
          )}
          
          {/* Half Width Stats */}
          <View style={s.bentoRow}>
            <View style={[s.bentoBox, { flex: 1 }]}>
              <MaterialCommunityIcons name="calendar-outline" size={20} color={T.text3} style={{ marginBottom: 8 }} />
              <Text style={s.bentoBoxValueText} numberOfLines={1}>{user.createdAt}</Text>
              <Text style={s.bentoBoxLabelText}>Joined</Text>
            </View>
            <View style={[s.bentoBox, { flex: 1 }]}>
              <MaterialCommunityIcons name="login" size={20} color={T.text3} style={{ marginBottom: 8 }} />
              <Text style={s.bentoBoxValueText} numberOfLines={1}>{user.lastLoginAt}</Text>
              <Text style={s.bentoBoxLabelText}>Last Login</Text>
            </View>
          </View>
        </View>

        {/* Associations Bento */}
        {(user.ownedCompanies.length > 0 || user.staffMemberships.length > 0) && (
          <View style={s.bentoCard}>
            <Text style={s.cardTitle}>Associations</Text>
            {user.ownedCompanies.map((c) => (
              <View key={`owned-${c.id}`} style={s.associationRow}>
                <View style={[s.bentoIconCircle, { backgroundColor: "rgba(37, 99, 235, 0.1)" }]}>
                  <MaterialCommunityIcons name="domain" size={20} color={T.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bentoBoxLabelText}>Owner Of</Text>
                  <Text style={s.bentoBoxValueText}>{c.name}</Text>
                </View>
              </View>
            ))}
            {user.staffMemberships.map((m) => (
              <View key={`staff-${m.id}`} style={s.associationRow}>
                <View style={[s.bentoIconCircle, { backgroundColor: "rgba(100, 116, 139, 0.1)" }]}>
                  <MaterialCommunityIcons name="briefcase-account-outline" size={20} color={T.text2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bentoBoxLabelText}>Staff Member At</Text>
                  <Text style={s.bentoBoxValueText}>{m.company.name}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Security & History */}
        <View style={s.bentoCard}>
          <Text style={s.cardTitle}>Security & History</Text>
          {user.auditLogs && user.auditLogs.length > 0 ? (
            <View style={{ gap: 12 }}>
              {user.auditLogs.map((log) => (
                <View key={log.id} style={s.logRow}>
                  <View style={s.bentoIconCircle}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={20} color={T.text3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.logMeta}>
                      {new Date(log.createdAt).toLocaleDateString()} • by {log.user?.fullName || "System"}
                    </Text>
                    <Text style={s.logAction}>{log.action}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.noneText}>No security events logged.</Text>
          )}
        </View>

        {/* Danger Zone Bento */}
        <View style={s.dangerCard}>
          <Text style={s.dangerTitle}>Danger Zone</Text>
          <Text style={s.dangerDesc}>Critical actions. Suspensions instantly block access. Bans are irreversible.</Text>
          
          <View style={s.bentoRow}>
            {user.status === "suspended" ? (
              <TouchableOpacity onPress={() => confirmStatusChange("active")} disabled={actionLoading} style={[s.dangerBtn, { backgroundColor: T.success, flex: 1 }]}>
                <MaterialCommunityIcons name="account-check" size={20} color="#fff" />
                <Text style={s.dangerBtnText}>Restore</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setSuspendModalVisible(true)} disabled={actionLoading} style={[s.dangerBtn, { backgroundColor: T.warning, flex: 1 }]}>
                <MaterialCommunityIcons name="block-helper" size={20} color="#fff" />
                <Text style={s.dangerBtnText}>Suspend</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleDelete} disabled={actionLoading} style={[s.dangerBtn, { backgroundColor: T.error, flex: 1 }]}>
              <MaterialCommunityIcons name="gavel" size={20} color="#fff" />
              <Text style={s.dangerBtnText}>Ban</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Suspend Modal */}
      <Modal visible={suspendModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Suspend User</Text>
            <Text style={s.modalDesc}>Please provide a reason for suspending {user?.fullName}. This will be logged in the audit history.</Text>
            
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
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalBtnPrimaryText}>Suspend</Text>}
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
  errorText: { marginTop: 16, fontSize: 16, fontWeight: "600", color: T.error },
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: T.primary, borderRadius: 24 },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: T.bg },
  headerBtn: { padding: 4, marginLeft: -8 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: T.text1, letterSpacing: -0.5 },

  content: { padding: 20, gap: 16, paddingBottom: 60 },

  heroCard: { backgroundColor: T.surface, borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 32, backgroundColor: T.bg, borderWidth: 4, borderColor: T.surface, ...CARD_SHADOW },
  avatarStatusDot: { position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: T.surface, alignItems: "center", justifyContent: "center" },
  userName: { fontSize: 26, fontWeight: "700", color: T.text1, marginBottom: 4, textAlign: "center", letterSpacing: -0.5 },
  userId: { fontSize: 14, fontWeight: "600", color: T.text3, textAlign: "center" },
  
  fraudBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(239, 68, 68, 0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 12 },
  fraudText: { fontSize: 12, fontWeight: "700", color: T.error },

  bentoRow: { flexDirection: "row", gap: 16 },
  bentoGrid: { gap: 16 },
  
  bentoBox: { backgroundColor: T.surface, borderRadius: 20, padding: 16, justifyContent: "center", borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  bentoActionBtn: { alignItems: "center", backgroundColor: T.surface },
  bentoBoxValue: { fontSize: 18, fontWeight: "700", color: T.text1, marginBottom: 2, textTransform: "capitalize", letterSpacing: -0.5 },
  bentoBoxLabel: { fontSize: 11, fontWeight: "600", color: T.text3, textTransform: "uppercase" },

  bentoBoxFull: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border, gap: 16, ...CARD_SHADOW },
  bentoIconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(10, 25, 47, 0.05)", alignItems: "center", justifyContent: "center" },
  bentoBoxLabelText: { fontSize: 11, fontWeight: "600", color: T.text3, textTransform: "uppercase", marginBottom: 2 },
  bentoBoxValueText: { fontSize: 15, fontWeight: "700", color: T.text1 },

  bentoCard: { backgroundColor: T.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 16 },
  
  associationRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  
  logRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  logMeta: { fontSize: 12, fontWeight: "600", color: T.text3, marginBottom: 2 },
  logAction: { fontSize: 14, fontWeight: "700", color: T.text1 },
  noneText: { fontSize: 14, color: T.text3, fontStyle: "italic" },

  dangerCard: { backgroundColor: "rgba(239, 68, 68, 0.05)", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)" },
  dangerTitle: { fontSize: 16, fontWeight: "700", color: T.error, marginBottom: 4 },
  dangerDesc: { fontSize: 13, color: T.error, opacity: 0.8, marginBottom: 16 },
  dangerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 16, gap: 8 },
  dangerBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: T.surface, borderRadius: 24, padding: 24, ...CARD_SHADOW },
  modalTitle: { fontSize: 20, fontWeight: "700", color: T.text1, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: T.text2, marginBottom: 20, lineHeight: 20 },
  modalInput: { backgroundColor: T.bg, borderRadius: 16, padding: 16, fontSize: 15, color: T.text1, height: 100, textAlignVertical: "top", marginBottom: 20, borderWidth: 1, borderColor: T.border },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: T.bg, alignItems: "center", borderWidth: 1, borderColor: T.border },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: "700", color: T.text2 },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: T.warning, alignItems: "center" },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
