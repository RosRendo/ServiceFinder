/**
 * Admin System Messages / Communications — Enterprise Operations Cockpit
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSidebarStore } from "@/store/sidebarStore";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";
import { useTranslation } from "react-i18next";

const T = Theme.colors;

export default function Messages() {
  const router = useRouter();
  const { t } = useTranslation();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/conversations');
      const resData = response.data?.data?.data || response.data?.data || response.data || [];
      setConversations(Array.isArray(resData) ? resData : []);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setHasError(true);
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
    if (!dateString) return "";
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
          <TouchableOpacity 
            accessibilityRole="button"
            accessibilityLabel={t('common.openMenu')}
            onPress={() => openSidebar(true)}
            style={s.menuBtn}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Communications</Text>
        </View>
        <View style={s.headerRightBadge}>
          <Text style={s.headerBadgeText}>{conversations.length} Active</Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchConversations()} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0F172A"
            />
          }
        >
          {conversations.length > 0 ? (
            <View style={s.listWrapper}>
              {conversations.map((conv, idx) => {
                const isLast = idx === conversations.length - 1;
                const otherUserName = conv.otherUser?.fullName || `Conversation #${conv.id}`;
                const initial = otherUserName.charAt(0).toUpperCase();

                return (
                  <TouchableOpacity 
                    key={conv.id} 
                    style={[s.msgItem, isLast && { borderBottomWidth: 0 }]} 
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(admin)/messages/${conv.id}?otherName=${encodeURIComponent(otherUserName)}` as any)}
                  >
                    <View style={s.avatarBox}>
                      <Text style={s.avatarText}>{initial}</Text>
                    </View>
                    <View style={s.msgInfo}>
                      <View style={s.msgHeader}>
                        <Text style={s.msgTitle} numberOfLines={1}>{otherUserName}</Text>
                        <Text style={s.msgDate}>{formatDate(conv.updatedAt)}</Text>
                      </View>
                      <View style={s.msgSubHeader}>
                        {conv.otherUser?.role && (
                          <View style={s.roleBadge}>
                            <Text style={s.roleText}>{conv.otherUser.role.replace('_', ' ').toUpperCase()}</Text>
                          </View>
                        )}
                        <Text style={s.msgDesc} numberOfLines={1}>
                          {conv.lastMessage?.content || "No message records"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="message-text-outline" size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={s.emptyText}>No Active Threads</Text>
              <Text style={s.emptySubText}>There are no recorded user communication threads at this time.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },
  headerRightBadge: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  headerBadgeText: { fontSize: 12, fontWeight: "700", color: "#0F172A" },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  scrollContent: { padding: 16, paddingBottom: 120 },
  listWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  
  msgItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  msgInfo: { flex: 1 },
  msgHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  msgTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", flex: 1, marginRight: 8 },
  msgDate: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  msgSubHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  roleBadge: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  roleText: { fontSize: 9, color: "#475569", fontWeight: "700" },
  msgDesc: { fontSize: 13, color: "#64748B", flex: 1 },

  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  emptySubText: { fontSize: 13, color: "#64748B", marginTop: 4, textAlign: "center" },
});
