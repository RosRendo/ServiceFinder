import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Theme } from "@/constants/theme";
import { api } from "@/store/authStore";

const T = Theme.colors;

export default function InstantRequestConfirmation() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return;
      try {
        const res = await api.get(`/api/bookings/${bookingId}`);
        setBooking(res.data.data.booking ?? res.data.data);
      } catch (err) {
        console.error("Failed to load booking details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  const companyName = booking?.company?.name || "Service Provider";
  const serviceName = booking?.service?.name || "Service";
  const desc = booking?.customerNotes || "";
  const priceEstimate = booking?.totalPrice ? `$${parseFloat(booking.totalPrice).toFixed(2)}` : "$0.00";
  // Simulated ETA: deterministic based on ID
  const eta = booking?.id ? `${(7 + (Number(booking.id.toString()) % 8))} min` : "7 min";

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.container}>
        {/* Success Icon Animation Box */}
        <View style={s.successBox}>
          <View style={s.iconBg}>
            <MaterialCommunityIcons name="check-circle" size={54} color={T.success} />
          </View>
          <Text style={s.title}>You're all set!</Text>
          <Text style={s.subtitle}>{companyName} is confirmed</Text>
        </View>

        {/* Status Pills / Info Cards */}
        <View style={s.infoPillRow}>
          <View style={s.infoPill}>
            <MaterialCommunityIcons name="car-side" size={18} color={T.accent} />
            <Text style={s.infoPillText}>ETA {eta}</Text>
          </View>
          <View style={s.infoPill}>
            <MaterialCommunityIcons name="lock-check" size={18} color={T.success} />
            <Text style={s.infoPillText}>Payment secured: {priceEstimate}</Text>
          </View>
        </View>

        {/* Request Summary Card */}
        <View style={s.summaryCard}>
          <Text style={s.sectionHeader}>Booking Details</Text>
          <View style={s.row}>
            <Text style={s.label}>Service Type</Text>
            <Text style={s.value}>{serviceName}</Text>
          </View>
          {desc.length > 0 && (
            <View style={s.row}>
              <Text style={s.label}>Description</Text>
              <Text style={s.value} numberOfLines={2}>{desc}</Text>
            </View>
          )}
          <View style={s.row}>
            <Text style={s.label}>Arrival Time</Text>
            <Text style={s.valueAccent}>{eta}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Est. Cost</Text>
            <Text style={s.valueAccent}>{priceEstimate}</Text>
          </View>
        </View>

        {/* Tip Box */}
        <View style={s.tipCard}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={T.warning} />
          <Text style={s.tipText}>
            You can cancel this request without any fee until the provider starts driving.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Track Button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.trackBtn}
          onPress={() => {
            router.push({
              pathname: "/(customer)/instant-request/tracking" as any,
              params: { bookingId }
            });
          }}
        >
          <Text style={s.trackBtnText}>Track Provider</Text>
          <MaterialCommunityIcons name="map-marker-distance" size={22} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <Text style={s.securedSubtext}>Payment completed securely.</Text>

        <TouchableOpacity
          style={s.homeBtn}
          onPress={() => router.replace("/(customer)/(tabs)/home")}
        >
          <Text style={s.homeBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 24,
    alignItems: "center"
  },
  successBox: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20
  },
  iconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: T.success + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: T.text2,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16
  },
  infoPillRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  infoPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: T.text1
  },
  summaryCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 16,
    letterSpacing: 0.5
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12
  },
  label: {
    fontSize: 14,
    color: T.text2,
    fontWeight: "500"
  },
  value: {
    fontSize: 14,
    color: T.text1,
    fontWeight: "600",
    textAlign: "right",
    flex: 1
  },
  valueAccent: {
    fontSize: 14,
    color: T.accent,
    fontWeight: "700"
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: T.warning + "0A",
    borderWidth: 1,
    borderColor: T.warning + "1A",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    width: "100%"
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#b45309",
    fontWeight: "500",
    lineHeight: 18
  },
  footer: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    gap: 8,
    alignItems: "center"
  },
  trackBtn: {
    backgroundColor: T.accent,
    height: 52,
    width: "100%",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  trackBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700"
  },
  securedSubtext: {
    fontSize: 11,
    fontWeight: "600",
    color: T.text3,
    marginTop: 4,
    marginBottom: 4
  },
  homeBtn: {
    height: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  homeBtnText: {
    color: T.text2,
    fontSize: 14,
    fontWeight: "600"
  }
});
