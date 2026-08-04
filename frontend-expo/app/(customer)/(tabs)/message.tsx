import React, { useState, useCallback , useEffect, useRef} from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, Animated, Easing
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api, useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { GuestCTA } from "@/components/common/GuestCTA";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: { id: string; fullName: string; avatar?: string } | null;
  lastMessage: { content: string; createdAt: string; isMe: boolean } | null;
  unreadCount?: number;
}

const formatTime = (iso: string, t: any) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return t('messages.yesterday');
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ─── Animated Empty State ──────────────────────────────────────
function AnimatedChatEmpty({ title, sub }: { title: string; sub: string }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={s.emptyWrap}>
      <Animated.View style={[s.emptyIcon, { transform: [{ translateY: floatAnim }] }]}>
        <MaterialCommunityIcons name="chat-outline" size={40} color={T.text3} />
      </Animated.View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { isGuest } = useAuthStore();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/conversations");
      const raw = res.data?.data?.data || res.data?.data || res.data || [];
      setConversations(Array.isArray(raw) ? raw : []);
    } catch { setConversations([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { 
    if (!isGuest) {
      load(); 
    } else {
      setLoading(false);
    }
  }, [load, isGuest]));

  if (isGuest) {
    return <GuestCTA title="Log in to chat" subtitle="Message your service providers to ask questions or discuss your bookings." icon="message-text-outline" />;
  }

  const filtered = conversations.filter(c =>
    (c.otherUser?.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{t('messages.title')}</Text>
          {totalUnread > 0 && (
            <Text style={s.headerSub}>{t(totalUnread === 1 ? 'messages.unreadMessages_one' : 'messages.unreadMessages_other', { count: totalUnread })}</Text>
          )}
        </View>
        <TouchableOpacity
          style={s.composeBtn}
          onPress={() => router.push("/(customer)/messages/new" as any)}
        >
          <MaterialCommunityIcons name="pencil-plus-outline" size={22} color={T.accent} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={s.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={20} color={T.text3} />
        <TextInput
          style={s.searchInput}
          placeholder={t('messages.searchPlaceholder')}
          placeholderTextColor={T.text3}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialCommunityIcons name="close-circle" size={18} color={T.text3} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={T.accent} />
        }
      >
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={T.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <AnimatedChatEmpty
            title={search ? t('messages.noResultsFound') : t('messages.noConversationsYet')}
            sub={search ? t('messages.noConversationsMatching', { term: search }) : t('messages.tapMessageToStart')}
          />
        ) : (
          <View style={[s.listCard, CARD_SHADOW]}>
            {filtered.map((c, index) => {
              const initials = c.otherUser?.fullName?.charAt(0)?.toUpperCase() ?? "?";
              const hasUnread = (c.unreadCount ?? 0) > 0;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() =>
                    router.push(
                      `/(customer)/messages/${c.id}?otherName=${encodeURIComponent(c.otherUser?.fullName ?? t('messages.provider'))}` as any
                    )
                  }
                  style={[s.convRow, index < filtered.length - 1 && s.convRowBorder]}
                  activeOpacity={0.75}
                >
                  {/* Avatar */}
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initials}</Text>
                    {/* Online indicator */}
                    <View style={s.onlineDot} />
                  </View>

                  {/* Content */}
                  <View style={s.convContent}>
                    <View style={s.convTopRow}>
                      <Text style={[s.convName, hasUnread && s.convNameUnread]} numberOfLines={1}>
                        {c.otherUser?.fullName ?? t('messages.unknown')}
                      </Text>
                      {c.lastMessage && (
                        <Text style={[s.convTime, hasUnread && s.convTimeUnread]}>
                          {formatTime(c.lastMessage.createdAt, t)}
                        </Text>
                      )}
                    </View>
                    <View style={s.convBottomRow}>
                      {c.lastMessage ? (
                        <Text style={[s.convPreview, hasUnread && s.convPreviewUnread]} numberOfLines={1}>
                          {c.lastMessage.isMe ? t('messages.you') : ""}{c.lastMessage.content}
                        </Text>
                      ) : (
                        <Text style={[s.convPreview, { fontStyle: "italic" }]}>{t('messages.noMessagesYet')}</Text>
                      )}
                      {hasUnread && (
                        <View style={s.unreadBadge}>
                          <Text style={s.unreadBadgeText}>{c.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  headerTitle: { fontSize: 28, fontWeight: "800", color: T.text1, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: T.text3, fontWeight: "500", marginTop: 2 },
  composeBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: T.surface,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border,
  },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 12,
    ...CARD_SHADOW,
  },
  searchInput: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  centered: { paddingTop: 80, alignItems: "center" },

  emptyWrap: { paddingTop: 60, alignItems: "center", gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.surface, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: T.border,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  emptySub: { fontSize: 14, color: T.text3, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },

  listCard: {
    backgroundColor: T.surface, borderRadius: 20,
    borderWidth: 1, borderColor: T.border, overflow: "hidden",
  },

  convRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  convRowBorder: { borderBottomWidth: 1, borderBottomColor: T.border },

  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: T.accentMid },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: T.success, borderWidth: 2, borderColor: T.surface,
  },

  convContent: { flex: 1, minWidth: 0 },
  convTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  convName: { fontSize: 15, fontWeight: "600", color: T.text1, flex: 1 },
  convNameUnread: { fontWeight: "800", color: T.accent },
  convTime: { fontSize: 12, color: T.text3, marginLeft: 8 },
  convTimeUnread: { color: T.accentMid, fontWeight: "700" },

  convBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convPreview: { fontSize: 13, color: T.text3, flex: 1 },
  convPreviewUnread: { color: T.text2, fontWeight: "600" },

  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: T.accentMid,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6, marginLeft: 8,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
});
