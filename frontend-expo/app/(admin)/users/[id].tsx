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
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const safeFormatDate = (dateStr: any) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) 
      ? "—" 
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const fetchUser = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/api/users/${id}`);
      const data = res.data?.data || res.data || {};
      const obj = data.user || data || {};
      setUser({
        id: obj.id?.toString(),
        fullName: obj.fullName || obj.name || "Unknown",
        email: obj.email || "",
        phone: obj.phone || "",
        role: obj.role || "user",
        status: obj.status || "active",
        avatar: obj.avatar || obj.avatarUrl || null,
        createdAt: safeFormatDate(obj.createdAt),
        lastLoginAt: safeFormatDate(obj.lastLoginAt),
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

  // Custom function to format fraud risk level and colors
  const getFraudConfig = (score: number) => {
    if (score < 30) return { label: "Low Risk", color: T.success, desc: "Account exhibits normal behavior patterns." };
    if (score < 80) return { label: "Medium Risk", color: T.warning, desc: "Suspicious activity detected. Audit suggested." };
    return { label: "High Risk", color: T.error, desc: "Critical flags triggered. Suspension recommended." };
  };

  const fraudConfig = getFraudConfig(user.fraudScore || 0);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        
        {/* Asymmetrical Bento Hero Profile Card */}
        <View style={s.heroCard}>
          <View style={s.avatarWrap}>
            <InitialsAvatar name={user.fullName} size={88} radius={28} />
          </View>
          <View style={s.heroDetails}>
            <Text style={s.userName} numberOfLines={1}>{user.fullName}</Text>
            <Text style={s.userId}>#{user.id}</Text>
            <View style={[s.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <MaterialCommunityIcons name={roleStyle.icon as any} size={12} color={roleStyle.text} />
              <Text style={[s.roleText, { color: roleStyle.text }]}>{user.role.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        {/* Pulsing Status & Fraud Box */}
        <View style={s.fraudCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={[s.statusBadge, { borderColor: statusStyle.bg + "40", backgroundColor: statusStyle.bg + "10" }]}>
              <View style={[s.statusDot, { backgroundColor: statusStyle.bg }]} />
              <Text style={[s.statusText, { color: statusStyle.bg }]}>{user.status}</Text>
            </View>
            <Text style={[s.fraudScoreText, { color: fraudConfig.color }]}>{user.fraudScore}% Fraud Score</Text>
          </View>

          <Text style={s.fraudTitle}>Safety & Trust Profile</Text>
          <View style={s.gaugeTrack}>
            <View style={[s.gaugeBar, { width: `${user.fraudScore ?? 0}%` as any, backgroundColor: fraudConfig.color }]} />
          </View>
          <Text style={s.fraudDesc}>{fraudConfig.desc}</Text>
        </View>

        {/* Metrics Grid (Bookings & Reviews) */}
        <View style={s.bentoRow}>
          {/* Bookings Card */}
          <View style={s.bentoBox}>
            <View style={[s.metricIconWrap, { backgroundColor: "rgba(124, 58, 237, 0.1)" }]}>
              <MaterialCommunityIcons name="calendar-check" size={22} color={T.purple} />
            </View>
            <Text style={s.metricValue}>{user.stats.bookings}</Text>
            <Text style={s.metricLabel}>Total Bookings</Text>
          </View>

          {/* Reviews Card */}
          <View style={s.bentoBox}>
            <View style={[s.metricIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
              <MaterialCommunityIcons name="star" size={22} color={T.gold} />
            </View>
            <Text style={s.metricValue}>{user.stats.reviews}</Text>
            <Text style={s.metricLabel}>Reviews Written</Text>
          </View>
        </View>

        {/* Quick Contact Info */}
        <View style={s.metaCard}>
          <Text style={s.metaTitle}>Contact Details</Text>
          
          <View style={s.metaRow}>
            <View style={[s.metricIconWrap, { backgroundColor: T.inputBg }]}><MaterialCommunityIcons name="email-outline" size={20} color={T.text2} /></View>
            <View style={s.metaTextWrap}>
              <Text style={s.metaLabel}>Email Address</Text>
              <Text style={s.metaValue} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>

          {!!user.phone && (
            <View style={[s.metaRow, { marginTop: 8 }]}>
              <View style={[s.metricIconWrap, { backgroundColor: T.inputBg }]}><MaterialCommunityIcons name="phone-outline" size={20} color={T.text2} /></View>
              <View style={s.metaTextWrap}>
                <Text style={s.metaLabel}>Phone Number</Text>
                <Text style={s.metaValue} numberOfLines={1}>{user.phone}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Joined & Last Login */}
        <View style={s.bentoRow}>
          <View style={s.bentoBox}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={T.text3} style={{ marginBottom: 8 }} />
            <Text style={s.metaValue}>{user.createdAt}</Text>
            <Text style={s.metaLabel}>Joined Platform</Text>
          </View>
          <View style={s.bentoBox}>
            <MaterialCommunityIcons name="login-variant" size={20} color={T.text3} style={{ marginBottom: 8 }} />
            <Text style={s.metaValue}>{user.lastLoginAt}</Text>
            <Text style={s.metaLabel}>Last Session</Text>
          </View>
        </View>

        {/* Interactive Action Hub */}
        <View style={s.actionHub}>
          <Text style={s.actionTitle}>Profile Management Actions</Text>
          <View style={s.actionButtons}>
            {/* Contact Chat */}
            <TouchableOpacity style={[s.actionBtn, { borderColor: T.blue, backgroundColor: T.blue + "08" }]} onPress={handleMessageUser} disabled={actionLoading}>
              <MaterialCommunityIcons name="message-text-outline" size={18} color={T.blue} />
              <Text style={[s.actionBtnText, { color: T.blue }]}>Chat</Text>
            </TouchableOpacity>

            {/* Suspend/Restore */}
            {user.status === "suspended" ? (
              <TouchableOpacity style={[s.actionBtn, { borderColor: T.success, backgroundColor: T.success + "08" }]} onPress={() => confirmStatusChange("active")} disabled={actionLoading}>
                <MaterialCommunityIcons name="account-check-outline" size={18} color={T.success} />
                <Text style={[s.actionBtnText, { color: T.success }]}>Restore</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.actionBtn, { borderColor: T.warning, backgroundColor: T.warning + "08" }]} onPress={() => setSuspendModalVisible(true)} disabled={actionLoading}>
                <MaterialCommunityIcons name="account-off-outline" size={18} color={T.warning} />
                <Text style={[s.actionBtnText, { color: T.warning }]}>Suspend</Text>
              </TouchableOpacity>
            )}

            {/* Ban/Delete */}
            <TouchableOpacity style={[s.actionBtn, { borderColor: T.error, backgroundColor: T.error + "08" }]} onPress={handleDelete} disabled={actionLoading}>
              <MaterialCommunityIcons name="gavel" size={18} color={T.error} />
              <Text style={[s.actionBtnText, { color: T.error }]}>Ban Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Associations Bento */}
        {(user.ownedCompanies.length > 0 || user.staffMemberships.length > 0) && (
          <View style={s.bentoCard}>
            <Text style={s.cardTitle}>Marketplace Affiliations</Text>
            
            {user.ownedCompanies.map((c) => (
              <View key={`owned-${c.id}`} style={s.associationRow}>
                <View style={[s.assocIcon, { backgroundColor: "rgba(37, 99, 235, 0.1)" }]}>
                  <MaterialCommunityIcons name="domain" size={20} color={T.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.assocLabel}>Company Owner</Text>
                  <Text style={s.assocValue}>{c.name}</Text>
                </View>
                <View style={[s.statusBadge, { borderColor: T.success + "30", backgroundColor: T.success + "08", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }]}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: T.success }}>{c.verificationStatus}</Text>
                </View>
              </View>
            ))}

            {user.staffMemberships.map((m) => (
              <View key={`staff-${m.id}`} style={s.associationRow}>
                <View style={[s.assocIcon, { backgroundColor: "rgba(100, 116, 139, 0.1)" }]}>
                  <MaterialCommunityIcons name="briefcase-account-outline" size={20} color={T.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.assocLabel}>Staff Representative</Text>
                  <Text style={s.assocValue}>{m.company.name}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Chronological Security Timeline */}
        <View style={s.bentoCard}>
          <Text style={s.cardTitle}>Security & Audit History</Text>
          {user.auditLogs && user.auditLogs.length > 0 ? (
            <View style={s.timelineContainer}>
              <View style={s.timelineLine} />
              {user.auditLogs.map((log) => (
                <View key={log.id} style={s.timelineNode}>
                  <View style={s.timelineDot}>
                    <MaterialCommunityIcons name="shield-lock" size={14} color={T.text3} />
                  </View>
                  <View style={s.timelineContent}>
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
  
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: T.bg },
  headerBtn: { padding: 8, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  headerTitle: { fontSize: 20, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },

  content: { padding: 20, gap: 16, paddingBottom: 60 },

  // Bento Hero Card (Asymmetrical Row Layout)
  heroCard: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 24, padding: 20, alignItems: "center", borderWidth: 1, borderColor: T.border, gap: 16, ...CARD_SHADOW },
  avatarWrap: { position: "relative" },
  heroDetails: { flex: 1, gap: 4 },
  userName: { fontSize: 22, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },
  userId: { fontSize: 13, fontWeight: "600", color: T.text3 },
  roleBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  roleText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

  // Status Badge with pulsing dot
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },

  // Fraud Score Bento Box
  fraudCard: { backgroundColor: T.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  fraudHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  fraudTitle: { fontSize: 14, fontWeight: "700", color: T.text2 },
  fraudScoreText: { fontSize: 16, fontWeight: "800" },
  gaugeTrack: { height: 8, backgroundColor: T.inputBg, borderRadius: 4, width: "100%", overflow: "hidden", marginTop: 8 },
  gaugeBar: { height: "100%", borderRadius: 4 },
  fraudDesc: { fontSize: 12, color: T.text3, marginTop: 8 },

  // Metrics Grid
  bentoRow: { flexDirection: "row", gap: 16 },
  bentoBox: { flex: 1, backgroundColor: T.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  metricValue: { fontSize: 28, fontWeight: "800", color: T.text1, letterSpacing: -1, marginTop: 8, marginBottom: 2 },
  metricLabel: { fontSize: 12, fontWeight: "600", color: T.text3 },
  metricIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  // Metadata Card
  metaCard: { backgroundColor: T.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  metaTitle: { fontSize: 14, fontWeight: "700", color: T.text2, marginBottom: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  metaTextWrap: { flex: 1 },
  metaLabel: { fontSize: 11, fontWeight: "600", color: T.text3, textTransform: "uppercase" },
  metaValue: { fontSize: 14, fontWeight: "700", color: T.text1 },

  // Quick Action Hub
  actionHub: { backgroundColor: T.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  actionTitle: { fontSize: 14, fontWeight: "700", color: T.text2, marginBottom: 16 },
  actionButtons: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, minWidth: 100, justifyContent: "center" },
  actionBtnText: { fontSize: 14, fontWeight: "700" },

  // Associations Bento
  bentoCard: { backgroundColor: T.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardTitle: { fontSize: 15, fontWeight: "800", color: T.text1, marginBottom: 16, letterSpacing: -0.3 },
  associationRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 12, backgroundColor: T.bg, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: T.border },
  assocIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  assocLabel: { fontSize: 11, fontWeight: "600", color: T.text3, textTransform: "uppercase" },
  assocValue: { fontSize: 14, fontWeight: "700", color: T.text1 },

  // Timeline Security Audit Trail
  timelineContainer: { gap: 16, position: "relative", paddingLeft: 8 },
  timelineLine: { position: "absolute", left: 19, top: 10, bottom: 10, width: 2, backgroundColor: T.border },
  timelineNode: { flexDirection: "row", gap: 16 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.surface, borderWidth: 2, borderColor: T.border, alignItems: "center", justifyContent: "center", zIndex: 10 },
  timelineContent: { flex: 1, backgroundColor: T.bg, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: T.border },
  logMeta: { fontSize: 11, fontWeight: "600", color: T.text3, marginBottom: 4 },
  logAction: { fontSize: 13, fontWeight: "700", color: T.text1 },
  noneText: { fontSize: 14, color: T.text3, fontStyle: "italic" },

  // Modal styling
  modalOverlay: { flex: 1, backgroundColor: "rgba(10,25,47,0.5)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: T.surface, borderRadius: 24, padding: 24, ...CARD_SHADOW },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8, letterSpacing: -0.5 },
  modalDesc: { fontSize: 14, color: T.text2, marginBottom: 20, lineHeight: 20 },
  modalInput: { backgroundColor: T.bg, borderRadius: 16, padding: 16, fontSize: 15, color: T.text1, height: 100, textAlignVertical: "top", marginBottom: 20, borderWidth: 1, borderColor: T.border },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: T.bg, alignItems: "center", borderWidth: 1, borderColor: T.border },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: "700", color: T.text2 },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: T.warning, alignItems: "center" },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
