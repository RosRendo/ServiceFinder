/**
 * Admin Push Broadcasts Screen — Enterprise Operations Cockpit
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { api } from "@/store/authStore";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

const AUDIENCE_MAP: Record<string, string> = {
  "All Users":  "all",
  "Companies":  "companies",
  "Customers":  "customers",
};

interface Broadcast {
  id: string;
  title: string;
  audience?: string;
  audienceType?: string;
  sentAt?: string;
  status?: string;
}

export default function BroadcastsScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"All Users" | "Companies" | "Customers">("All Users");
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get("/api/admin/broadcasts");
      const payload = res.data?.data ?? res.data;
      setHistory(Array.isArray(payload) ? payload : payload?.data ?? []);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      return Alert.alert("Error", "Please fill out both title and message.");
    }

    Alert.alert("Confirm Broadcast", `Send push notification to ${audience}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send Now",
        onPress: async () => {
          setSending(true);
          try {
            const res = await api.post("/api/admin/broadcasts", {
              title: title.trim(),
              message: message.trim(),
              audience: AUDIENCE_MAP[audience],
            });
            const created: Broadcast = res.data?.data ?? res.data;
            setHistory((prev) => [created, ...prev]);
            setTitle("");
            setMessage("");
            Alert.alert("Success", "Push notification dispatched successfully.");
          } catch (err: any) {
            Alert.alert(
              "Transmission Failed",
              err?.response?.data?.message || "Could not dispatch broadcast. Please try again."
            );
          } finally {
            setSending(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>System Broadcasts</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistory(true)}
              tintColor="#0F172A"
            />
          }
        >
          {/* Compose Form */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Dispatch Push Notice</Text>

            <Text style={s.label}>Target Audience</Text>
            <View style={s.audienceRow}>
              {(["All Users", "Companies", "Customers"] as const).map((opt) => {
                const isSelected = audience === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[s.audienceBtn, isSelected && s.audienceBtnActive]}
                    onPress={() => setAudience(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.audienceText, isSelected && s.audienceTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.label}>Subject Title</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Scheduled System Maintenance"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={s.label}>Message Content</Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Enter push broadcast message details..."
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[s.sendBtn, sending && { opacity: 0.6 }]}
              onPress={handleSend}
              activeOpacity={0.8}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
              <Text style={s.sendBtnText}>{sending ? "Dispatching…" : "Dispatch Broadcast"}</Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          <Text style={s.historySectionTitle}>Broadcast History</Text>

          {loading ? (
            <ActivityIndicator color="#0F172A" style={{ marginTop: 24 }} />
          ) : hasError ? (
            <ErrorState onRetry={() => fetchHistory()} />
          ) : history.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="broadcast-off" size={40} color="#94A3B8" />
              <Text style={s.emptyText}>No broadcasts logged yet</Text>
            </View>
          ) : (
            history.map((item) => (
              <View key={item.id} style={s.historyCard}>
                <View style={s.historyHeader}>
                  <Text style={s.historyTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={s.badge}>
                    <View style={s.statusDot} />
                    <Text style={s.badgeText}>{item.status || "Dispatched"}</Text>
                  </View>
                </View>
                <View style={s.historyFooter}>
                  <View style={s.historyRow}>
                    <MaterialCommunityIcons name="account-group-outline" size={15} color="#64748B" />
                    <Text style={s.historyDetail}>{item.audience || item.audienceType || "All"}</Text>
                  </View>
                  {item.sentAt && (
                    <View style={s.historyRow}>
                      <MaterialCommunityIcons name="calendar-outline" size={15} color="#64748B" />
                      <Text style={s.historyDetail}>{new Date(item.sentAt).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { marginLeft: -6, padding: 6, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },

  content: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 12 },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  textArea: { height: 90, paddingTop: 10 },

  audienceRow: { flexDirection: "row", gap: 8 },
  audienceBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  audienceBtnActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  audienceText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  audienceTextActive: { color: "#FFFFFF", fontWeight: "700" },

  sendBtn: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  sendBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  historySectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  historyTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", flex: 1, marginRight: 10, lineHeight: 18 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#059669" },
  badgeText: { color: "#334155", fontSize: 11, fontWeight: "600" },

  historyFooter: { flexDirection: "row", gap: 16 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  historyDetail: { fontSize: 12, color: "#64748B", fontWeight: "500" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
});
