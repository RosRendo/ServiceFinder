/**
 * Admin Broadcasts Screen (Mobile) — Real API
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, RefreshControl
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
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get("/api/admin/broadcasts");
      const payload = res.data?.data ?? res.data;
      setHistory(Array.isArray(payload) ? payload : payload?.data ?? []);
    } catch {
      // silently fail — show empty list
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      return Alert.alert("Error", "Please fill out both title and message.");
    }

    Alert.alert("Send Broadcast", `Send to ${audience}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
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
            Alert.alert("Success", "Broadcast sent successfully!");
          } catch (err: any) {
            Alert.alert(
              "Failed",
              err?.response?.data?.message || "Could not send broadcast. Please try again."
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
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Push Broadcasts</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor={T.accent} />
          }
        >
          {/* Compose */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>New Broadcast</Text>

            <Text style={s.label}>Audience</Text>
            <View style={s.audienceRow}>
              {(["All Users", "Companies", "Customers"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[s.audienceBtn, audience === opt && s.audienceBtnActive]}
                  onPress={() => setAudience(opt)}
                >
                  <Text style={[s.audienceText, audience === opt && s.audienceTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Title</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Server Maintenance"
              placeholderTextColor={T.text3}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={s.label}>Message</Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Type your message here..."
              placeholderTextColor={T.text3}
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
                <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#FFF" style={{ marginRight: 8 }} />
              )}
              <Text style={s.sendBtnText}>{sending ? "Sending…" : "Send Push Notification"}</Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          <Text style={[s.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Recent Broadcasts</Text>

          {loading ? (
            <ActivityIndicator color={T.accent} style={{ marginTop: 24 }} />
          ) : history.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="broadcast-off" size={40} color={T.text3} />
              <Text style={s.emptyText}>No broadcasts sent yet.</Text>
            </View>
          ) : (
            hasError ? (
              <ErrorState onRetry={() => fetchHistory()} />
            ) : (
            history.map((item) => (
              <View key={item.id} style={s.historyCard}>
                <View style={s.historyHeader}>
                  <Text style={s.historyTitle}>{item.title}</Text>
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{item.status || "Sent"}</Text>
                  </View>
                </View>
                <View style={s.historyFooter}>
                  <View style={s.historyRow}>
                    <MaterialCommunityIcons name="account-group-outline" size={16} color={T.text2} />
                    <Text style={s.historyDetail}>{item.audience || item.audienceType || "All"}</Text>
                  </View>
                  {item.sentAt && (
                    <View style={s.historyRow}>
                      <MaterialCommunityIcons name="calendar-outline" size={16} color={T.text2} />
                      <Text style={s.historyDetail}>{new Date(item.sentAt).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ))}

        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },

  content: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1, borderColor: T.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 16 },

  label: { fontSize: 13, fontWeight: "600", color: T.text2, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: T.bg,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: T.text1,
  },
  textArea: { height: 100, paddingTop: 12 },

  audienceRow: { flexDirection: "row", gap: 8 },
  audienceBtn: {
    flex: 1, paddingVertical: 8, alignItems: "center",
    backgroundColor: T.bg, borderRadius: 8, borderWidth: 1, borderColor: T.border,
  },
  audienceBtnActive: { backgroundColor: T.accent, borderColor: T.accent },
  audienceText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  audienceTextActive: { color: "#FFF" },

  sendBtn: {
    flexDirection: "row", backgroundColor: T.accent,
    paddingVertical: 14, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    marginTop: 20,
  },
  sendBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  historyCard: {
    backgroundColor: T.surface, borderRadius: 12,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: T.border,
  },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  historyTitle: { fontSize: 15, fontWeight: "600", color: T.text1, flex: 1, marginRight: 12 },
  badge: { backgroundColor: (T.success || "#10b981") + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: T.success || "#10b981", fontSize: 11, fontWeight: "700" },

  historyFooter: { flexDirection: "row", gap: 16 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyDetail: { fontSize: 13, color: T.text2 },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: T.text3, fontWeight: "600" },
});
