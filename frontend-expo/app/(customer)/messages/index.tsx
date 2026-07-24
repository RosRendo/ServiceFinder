import React, { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: { id: string; fullName: string; avatar?: string } | null;
  lastMessage: { content: string; createdAt: string; isMe: boolean } | null;
}

export default function MessagesInboxScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/conversations");
      const data = res.data?.data ?? res.data ?? [];
      const convs = Array.isArray(data) ? data : [];
      
      // Deduplicate conversations so each user only appears once (keeps the latest one)
      const uniqueConvsMap = new Map();
      convs.forEach(c => {
        const otherId = c.otherUser?.id;
        if (!otherId) return;
        
        // If we haven't seen this user, or this conversation is newer, save it
        if (!uniqueConvsMap.has(otherId)) {
          uniqueConvsMap.set(otherId, c);
        } else {
          const existing = uniqueConvsMap.get(otherId);
          if (new Date(c.updatedAt) > new Date(existing.updatedAt)) {
            uniqueConvsMap.set(otherId, c);
          }
        }
      });
      
      const uniqueConvs = Array.from(uniqueConvsMap.values());
      
      setConversations(uniqueConvs);
    } catch (err) { 
      setConversations([]); 
    }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
        </TouchableOpacity>
        <Text style={s.title}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={s.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.accent} />}
      >
        {loading ? (
          <View style={s.centerBox}><ActivityIndicator size="large" color={T.accent} /></View>
        ) : conversations.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconBox}>
              <MaterialCommunityIcons name="message-outline" size={48} color={T.text3} />
            </View>
            <Text style={s.emptyTitle}>No messages yet</Text>
            <Text style={s.emptyDesc}>Start a conversation from any company profile by tapping "Message".</Text>
          </View>
        ) : (
          conversations.map(c => (
            <TouchableOpacity 
              key={c.id}
              onPress={() => router.push(`/(customer)/messages/${c.id}?otherName=${encodeURIComponent(c.otherUser?.fullName ?? "Unknown")}` as any)}
              style={s.chatRow}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={s.avatarWrap}>
                {c.otherUser?.avatar ? (
                  <Image source={{ uri: c.otherUser.avatar }} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarInitial}>{c.otherUser?.fullName?.charAt(0) ?? "?"}</Text>
                )}
              </View>
              {/* Info */}
              <View style={s.chatInfo}>
                <View style={s.chatInfoTop}>
                  <Text style={s.chatName} numberOfLines={1}>
                    {c.otherUser?.fullName ?? "Unknown"}
                  </Text>
                  {c.lastMessage && (
                    <Text style={s.chatTime}>{formatTime(c.lastMessage.createdAt)}</Text>
                  )}
                </View>
                {c.lastMessage ? (
                  <Text style={s.chatMsg} numberOfLines={1}>
                    {c.lastMessage.isMe ? "You: " : ""}{c.lastMessage.content}
                  </Text>
                ) : (
                  <Text style={[s.chatMsg, { fontStyle: "italic", color: T.text3 }]}>No messages yet</Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={T.text3} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: T.text1 },
  content: { flex: 1 },
  centerBox: { paddingVertical: 80, alignItems: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 80 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 1, borderColor: T.border },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: T.text3, textAlign: "center", lineHeight: 22 },
  
  chatRow: {
    flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border, gap: 16
  },
  avatarWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: T.accentLight,
    alignItems: "center", justifyContent: "center", overflow: "hidden"
  },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarInitial: { fontSize: 20, fontWeight: "900", color: T.accent },
  chatInfo: { flex: 1, justifyContent: "center" },
  chatInfoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: "700", color: T.text1, flex: 1 },
  chatTime: { fontSize: 12, color: T.text3, marginLeft: 8 },
  chatMsg: { fontSize: 14, color: T.text2 },
});
