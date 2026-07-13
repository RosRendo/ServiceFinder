import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  gold: "#F59E0B"
};

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  company?: { name: string };
  service?: { name: string };
}

export default function MyReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      const res = await api.get("/api/reviews/me");
      const data = res.data?.data ?? res.data;
      setReviews(Array.isArray(data) ? data : []);
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const renderItem = ({ item }: { item: Review }) => {
    const targetName = item.company?.name || item.service?.name || "Service Provider";
    
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.targetName} numberOfLines={1}>{targetName}</Text>
          <Text style={s.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map(s => (
            <MaterialCommunityIcons 
              key={s} 
              name={s <= item.rating ? "star" : "star-outline"} 
              size={16} 
              color={s <= item.rating ? T.gold : "#D1D5DB"} 
            />
          ))}
        </View>
        {item.comment ? (
          <Text style={s.commentText}>{item.comment}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
        </TouchableOpacity>
        <Text style={s.title}>My Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.content}>
        {loading ? (
          <ActivityIndicator size="large" color={T.accent} style={{ marginTop: 40 }} />
        ) : reviews.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconBox}>
              <MaterialCommunityIcons name="star-outline" size={48} color={T.text3} />
            </View>
            <Text style={s.emptyTitle}>No reviews yet</Text>
            <Text style={s.emptyDesc}>You haven't reviewed any services yet. After a booking is completed, you can share your experience.</Text>
          </View>
        ) : (
          <FlashList
            data={reviews}
            keyExtractor={r => r.id}
            renderItem={renderItem}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  listContent: { padding: 24, paddingBottom: 100 },
  card: {
    backgroundColor: T.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: T.border, ...CARD_SHADOW,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  targetName: { fontSize: 16, fontWeight: "800", color: T.text1, flex: 1 },
  dateText: { fontSize: 12, color: T.text3, marginLeft: 8 },
  starsRow: { flexDirection: "row", gap: 2, marginBottom: 12 },
  commentText: { fontSize: 14, color: T.text2, lineHeight: 20 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: T.text1, marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: T.text3, textAlign: "center", lineHeight: 22 },
});
