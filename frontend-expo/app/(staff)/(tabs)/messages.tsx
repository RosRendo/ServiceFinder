import React, { useState, useCallback, useRef, useEffect } from "react";
import { Image } from "expo-image";
import { ScrollView, Text, View, TouchableOpacity, TextInput, RefreshControl, StyleSheet, Platform, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

function SkeletonBone({ width, height, radius = 8 }: { width: any; height: number; radius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: '#CBD5E1', opacity }} />;
}

function AnimatedChatEmpty() {
  const bounce = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -10, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY: bounce }, { scale }], marginBottom: 8 }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.border }}>
        <MaterialCommunityIcons name="message-text-outline" size={44} color={T.primary} />
      </View>
    </Animated.View>
  );
}

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

export default function StaffMessagesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const setStaffOpen = useSidebarStore((s) => s.setStaffOpen);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/conversations");
      const raw = res.data?.data?.data || res.data?.data || res.data || [];
      const convs = Array.isArray(raw) ? raw : [];
      
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

  const filteredConversations = conversations.filter((conv) =>
    (conv.otherUser?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => setStaffOpen(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={26} color={T.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Messages</Text>
        </View>
        <TouchableOpacity style={s.iconBtn}>
          <MaterialCommunityIcons name="pencil-plus-outline" size={22} color={T.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[T.primary]} />}
        contentContainerStyle={s.scrollContent}
      >
        {/* Search */}
        <View style={s.searchContainer}>
          <View style={s.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={T.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor={T.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={s.skeletonBox}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={[s.chatCard, { gap: 12 }]}>
                <SkeletonBone width={56} height={56} radius={16} />
                <View style={{ flex: 1, gap: 8 }}>
                  <SkeletonBone width="55%" height={13} />
                  <SkeletonBone width="80%" height={11} />
                </View>
              </View>
            ))}
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={s.emptyBox}>
            <AnimatedChatEmpty />
            <Text style={s.emptyTitle}>{searchQuery ? `No results for "${searchQuery}"` : 'No conversations yet'}</Text>
            <Text style={s.emptyDesc}>{searchQuery ? 'Try a different name' : 'Your booking conversations will appear here'}</Text>
          </View>
        ) : (
          <View style={s.listContainer}>
            {filteredConversations.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => router.push(`/(staff)/messages/${c.id}?otherName=${encodeURIComponent(c.otherUser?.fullName ?? "Customer")}` as any)}
                style={s.chatCard}
                activeOpacity={0.85}
              >
                <View style={s.avatarWrapper}>
                  {c.otherUser?.avatar ? (
                    <Image source={{ uri: c.otherUser.avatar }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                      <Text style={s.avatarFallbackText}>
                        {c.otherUser?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                      </Text>
                    </View>
                  )}
                  <View style={s.onlineBadge} />
                </View>

                <View style={s.chatInfo}>
                  <View style={s.chatHeaderRow}>
                    <Text style={s.chatName} numberOfLines={1}>{c.otherUser?.fullName ?? "Unknown"}</Text>
                    {c.lastMessage && (
                      <Text style={s.chatTime}>{formatTime(c.lastMessage.createdAt)}</Text>
                    )}
                  </View>

                  {c.lastMessage ? (
                    <Text style={s.chatPreview} numberOfLines={1}>
                      {c.lastMessage.isMe ? "You: " : ""}{c.lastMessage.content}
                    </Text>
                  ) : (
                    <Text style={[s.chatPreview, { fontStyle: 'italic' }]}>No messages yet</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: T.text, letterSpacing: -0.5 },
  menuBtn: { padding: 4, marginLeft: -4 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },

  scrollContent: { paddingBottom: 40 },
  
  searchContainer: { paddingHorizontal: 24, paddingVertical: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: T.surface, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: T.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: T.text },

  centerBox: { paddingVertical: 60, alignItems: "center" },
  
  emptyBox: { paddingVertical: 60, alignItems: "center", paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: T.border },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: T.textMuted, textAlign: "center" },

  listContainer: { paddingHorizontal: 24, gap: 8 },
  skeletonBox: { paddingHorizontal: 24, gap: 8 },
  chatCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: T.surface, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18,
    borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  avatarWrapper: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: T.primaryLight, alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontSize: 22, fontWeight: "800", color: T.primary },
  onlineBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7, backgroundColor: T.success,
    borderWidth: 2, borderColor: T.surface,
  },

  chatInfo: { flex: 1 },
  chatHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: "700", color: T.primary, flex: 1, marginRight: 8 },
  chatTime: { fontSize: 11, fontWeight: "600", color: T.textMuted, textTransform: "uppercase" },
  chatPreview: { fontSize: 14, color: T.textMuted },
});
