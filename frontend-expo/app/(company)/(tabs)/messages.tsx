/**
 * Company Messages — Premium Redesign
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: { id: string; fullName: string; avatar?: string } | null;
  lastMessage: { content: string; createdAt: string; isMe: boolean } | null;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
  const colors = ["#1E3A8A", "#0A192F", "#065F46", "#7C3AED", "#B45309"];
  const idx = name.length % colors.length;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[idx], alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.3, fontWeight: "800", color: "#fff" }}>{initials}</Text>
    </View>
  );
}

export default function Messages() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  const load = useCallback(async (refresh = false) => {
    if (refresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/conversations");
      const rawData = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      const convs = Array.isArray(rawData) ? rawData : [];
      
      const uniqueConvsMap = new Map();
      convs.forEach(c => {
        const otherId = c.otherUser?.id;
        if (!otherId) return;
        
        if (!uniqueConvsMap.has(otherId)) {
          uniqueConvsMap.set(otherId, c);
        } else {
          const existing = uniqueConvsMap.get(otherId);
          if (new Date(c.updatedAt) > new Date(existing.updatedAt)) {
            uniqueConvsMap.set(otherId, c);
          }
        }
      });
      
      setConversations(Array.from(uniqueConvsMap.values()));
    } catch { setConversations([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = conversations.filter((c) =>
    c.otherUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.accent} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Messages</Text>
          <TouchableOpacity style={s.iconBtn}>
            <MaterialCommunityIcons name="pencil-plus-outline" size={24} color={T.accent} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <View style={s.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={T.text3} />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor={T.text3}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={s.searchInput}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.accent} />}
        >
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={T.accent} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.emptyBox}>
              <View style={s.emptyIconWrap}>
                <MaterialCommunityIcons name="message-outline" size={40} color={T.text3} />
              </View>
              <Text style={s.emptyTitle}>No conversations yet</Text>
              <Text style={s.emptySubtitle}>Messages from customers will appear here</Text>
            </View>
          ) : (
            <View style={s.listWrap}>
              {filtered.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  onPress={() => router.push(`/(company)/messages/${conv.id}?otherName=${encodeURIComponent(conv.otherUser?.fullName ?? "User")}` as any)}
                  style={s.convRow}
                  activeOpacity={0.85}
                >
                  <View style={s.avatarWrap}>
                    <Avatar name={conv.otherUser?.fullName ?? "?"} size={52} />
                    <View style={s.onlineDot} />
                  </View>

                  <View style={s.convBody}>
                    <View style={s.convTopRow}>
                      <Text style={s.convName} numberOfLines={1}>
                        {conv.otherUser?.fullName ?? "Unknown"}
                      </Text>
                      {conv.lastMessage && (
                        <Text style={s.convTime}>{formatTime(conv.lastMessage.createdAt)}</Text>
                      )}
                    </View>
                    {conv.lastMessage ? (
                      <Text style={s.convPreview} numberOfLines={1}>
                        {conv.lastMessage.isMe ? "You: " : ""}{conv.lastMessage.content}
                      </Text>
                    ) : (
                      <Text style={[s.convPreview, { fontStyle: "italic" }]}>No messages yet</Text>
                    )}
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={20} color={T.text3} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  menuBtn: { padding: 8, marginLeft: -8 },
  iconBtn: { padding: 8, marginRight: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.accent },

  searchWrap: { paddingHorizontal: 24, paddingVertical: 14, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: T.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: T.border },
  searchInput: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },

  loadingBox: { paddingVertical: 80, alignItems: "center" },
  emptyBox: { paddingVertical: 80, alignItems: "center", gap: 12 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  emptySubtitle: { fontSize: 14, fontWeight: "500", color: T.text3, textAlign: "center", paddingHorizontal: 40 },

  listWrap: { paddingHorizontal: 24, paddingTop: 16, gap: 4 },
  convRow: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: T.border,
  },
  avatarWrap: { position: "relative" },
  onlineDot: { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: T.success, borderWidth: 2, borderColor: T.surface },

  convBody: { flex: 1 },
  convTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  convName: { fontSize: 15, fontWeight: "800", color: T.text1, flex: 1 },
  convTime: { fontSize: 12, fontWeight: "500", color: T.text3 },
  convPreview: { fontSize: 13, fontWeight: "500", color: T.text2 },
});
