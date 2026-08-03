/**
 * Admin Broadcasts Screen (Mobile)
 */
import React, { useState } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, KeyboardAvoidingView, Platform, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const MOCK_BROADCASTS = [
  { id: 1, title: "System Maintenance Notice", audience: "All Users", date: "2026-08-01", status: "Sent" },
  { id: 2, title: "New Feature: Instant Payouts", audience: "Companies", date: "2026-07-28", status: "Sent" },
];

export default function BroadcastsScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"All Users" | "Companies" | "Customers">("All Users");
  const [history, setHistory] = useState(MOCK_BROADCASTS);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      return Alert.alert("Error", "Please fill out both title and message.");
    }
    
    Alert.alert("Send Broadcast", `Send to ${audience}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Send", 
        onPress: () => {
          setHistory([{ id: Date.now(), title, audience, date: new Date().toISOString().split('T')[0], status: "Sent" }, ...history]);
          setTitle("");
          setMessage("");
          Alert.alert("Success", "Broadcast sent successfully!");
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Push Broadcasts</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          
          <View style={s.card}>
            <Text style={s.sectionTitle}>New Broadcast</Text>
            
            <Text style={s.label}>Audience</Text>
            <View style={s.audienceRow}>
              {(["All Users", "Companies", "Customers"] as const).map(opt => (
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

            <TouchableOpacity style={s.sendBtn} onPress={handleSend} activeOpacity={0.8}>
              <MaterialCommunityIcons name="send" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={s.sendBtnText}>Send Push Notification</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Recent Broadcasts</Text>
          {history.map(item => (
            <View key={item.id} style={s.historyCard}>
              <View style={s.historyHeader}>
                <Text style={s.historyTitle}>{item.title}</Text>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{item.status}</Text>
                </View>
              </View>
              <View style={s.historyFooter}>
                <View style={s.historyRow}>
                  <MaterialCommunityIcons name="account-group-outline" size={16} color={T.text2} />
                  <Text style={s.historyDetail}>{item.audience}</Text>
                </View>
                <View style={s.historyRow}>
                  <MaterialCommunityIcons name="calendar-outline" size={16} color={T.text2} />
                  <Text style={s.historyDetail}>{item.date}</Text>
                </View>
              </View>
            </View>
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  
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
  badge: { backgroundColor: T.success + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: T.success, fontSize: 11, fontWeight: "700" },
  
  historyFooter: { flexDirection: "row", gap: 16 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyDetail: { fontSize: 13, color: T.text2 },
});
