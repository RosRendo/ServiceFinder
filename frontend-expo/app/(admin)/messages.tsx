/**
 * Admin System Messages — Premium Deep Navy Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSidebarStore } from "@/store/sidebarStore";
import { useRouter } from "expo-router";
import api from "@/utils/api";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A",
  text1: "#111827", text2: "#4B5563", text3: "#9CA3AF",
  success: "#10B981", warning: "#F59E0B", error: "#EF4444",
  blue: "#3B82F6", gray: "#6B7280",
};

export default function Messages() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/conversations');
      const resData = response.data?.data?.data || response.data?.data || response.data || [];
      setConversations(Array.isArray(resData) ? resData : []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString();
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={openSidebar} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>System Messages</Text>
        </View>
        <TouchableOpacity style={s.searchBtn}>
          <MaterialCommunityIcons name="magnify" size={20} color={T.text1} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}
        >
          {conversations.length > 0 ? (
            <View style={s.listContent}>
              {conversations.map((conv) =>                  <TouchableOpacity 
                    key={conv.id} 
                    style={s.msgItem} 
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(admin)/messages/${conv.id}?otherName=${encodeURIComponent(conv.otherUser?.fullName || 'Conversation')}` as any)}
                  >
                    <View style={s.avatarBox}>
                      <MaterialCommunityIcons name="account" size={24} color={T.accent} />
                    </View>
                    <View style={s.msgInfo}>
                      <View style={s.msgHeader}>
                        <Text style={s.msgTitle}>{conv.otherUser?.fullName || `Conversation #${conv.id}`}</Text>
                        <Text style={s.msgDate}>{formatDate(conv.updatedAt)}</Text>
                      </View>
                      <View style={s.msgSubHeader}>
                        {conv.otherUser?.role && (
                          <View style={s.roleBadge}>
                            <Text style={s.roleText}>{conv.otherUser.role.replace('_', ' ').toUpperCase()}</Text>
                          </View>
                        )}
                        <Text style={s.msgDesc} numberOfLines={1}>
                          {conv.lastMessage?.content || "No messages yet"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="message-text-outline" size={48} color={T.text3} style={{ marginBottom: 16 }} />
              <Text style={s.emptyText}>No Messages Found</Text>
              <Text style={s.emptySubText}>You do not have any active conversations in the system yet.</Text>
            </View>
          )}
        </ScrollView>
      )}
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  searchBtn: { padding: 10, backgroundColor: T.bg, borderRadius: 20 },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  listContent: { paddingBottom: 60, backgroundColor: T.surface },
  
  msgItem: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  avatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: T.accent + "10", alignItems: "center", justifyContent: "center", marginRight: 16 },
  msgInfo: { flex: 1 },
  msgHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  msgTitle: { fontSize: 16, fontWeight: "700", color: T.text1 },
  msgDate: { fontSize: 12, color: T.text3, fontWeight: "500" },
  msgSubHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  roleBadge: { backgroundColor: T.accent + "15", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 10, color: T.accent, fontWeight: "700" },
  msgDesc: { fontSize: 14, color: T.text2, flex: 1 },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center" },
});
