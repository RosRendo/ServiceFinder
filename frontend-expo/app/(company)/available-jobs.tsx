/**
 * Available Jobs Screen — Open Pool Mode (Staff)
 * Staff members see unassigned bookings from their company and can claim them.
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter , useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function AvailableJobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch pending/unassigned bookings for staff's company
      const res = await api.get("/api/bookings?status=pending");
      const data = res.data?.data || res.data;
      const bookings = data?.bookings || data || [];
      // Filter only unassigned ones
      const unassigned = bookings.filter((b: any) => !b.assignedStaffId);
      setJobs(unassigned);
    } catch (error: any) {
      console.error("Failed to fetch available jobs", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  const handleClaim = async (bookingId: string) => {
    Alert.alert(
      "Claim Job?",
      "This job will be assigned to you and confirmed with the customer.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Claim It",
          onPress: async () => {
            setClaiming(bookingId);
            try {
              await api.patch(`/api/bookings/${bookingId}/claim`);
              Alert.alert("Success! 🎉", "Job claimed! It will now appear in your assignments.");
              setJobs(prev => prev.filter(j => j.id?.toString() !== bookingId));
            } catch (error: any) {
              const msg = error.response?.data?.message || "Failed to claim job";
              Alert.alert("Error", msg);
            } finally {
              setClaiming(null);
            }
          }
        }
      ]
    );
  };

  const renderJob = ({ item }: { item: any }) => {
    const date = item.bookingDate
      ? new Date(item.bookingDate).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
      : "N/A";

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.serviceWrap}>
            <MaterialCommunityIcons name="briefcase-outline" size={20} color={T.accent} />
            <Text style={s.serviceName}>{item.service?.name || "Service"}</Text>
          </View>
          <View style={s.priceBadge}>
            <Text style={s.priceText}>${Number(item.totalPrice || 0).toFixed(0)}</Text>
          </View>
        </View>

        <View style={s.detailsRow}>
          <View style={s.detailItem}>
            <MaterialCommunityIcons name="calendar-outline" size={15} color={T.text2} />
            <Text style={s.detailText}>{date}</Text>
          </View>
          <View style={s.detailItem}>
            <MaterialCommunityIcons name="clock-outline" size={15} color={T.text2} />
            <Text style={s.detailText}>{item.startTime ? String(item.startTime).slice(0, 5) : "N/A"}</Text>
          </View>
          <View style={s.detailItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={15} color={T.text2} />
            <Text style={s.detailText} numberOfLines={1}>{item.serviceAddress || "No address"}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[s.claimBtn, claiming === item.id?.toString() && s.claimBtnDisabled]}
          onPress={() => handleClaim(item.id?.toString())}
          disabled={!!claiming}
          activeOpacity={0.8}
        >
          {claiming === item.id?.toString() ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="hand-pointing-right" size={18} color="#FFF" />
              <Text style={s.claimBtnText}>Claim This Job</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Available Jobs</Text>
          <Text style={s.headerSub}>Open Pool — Claim a job to accept it</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={i => i.id?.toString()}
          renderItem={renderJob}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchJobs(true)}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="briefcase-check-outline" size={56} color={T.text3} />
              <Text style={s.emptyTitle}>No Jobs Available</Text>
              <Text style={s.emptySub}>All bookings have been assigned. Pull down to refresh.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  headerSub: { fontSize: 12, color: T.text2, marginTop: 1 },

  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  listContent: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: T.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: T.border,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serviceWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  serviceName: { fontSize: 15, fontWeight: "700", color: T.text1 },
  priceBadge: { backgroundColor: T.success + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  priceText: { fontSize: 14, fontWeight: "700", color: T.success },

  detailsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 13, color: T.text2 },

  claimBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: T.accent, paddingVertical: 12, borderRadius: 10, gap: 8,
  },
  claimBtnDisabled: { opacity: 0.6 },
  claimBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  emptyBox: { paddingTop: 80, alignItems: "center", paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.text2, marginTop: 16, marginBottom: 6 },
  emptySub: { fontSize: 14, color: T.text3, textAlign: "center", lineHeight: 20 },
});
