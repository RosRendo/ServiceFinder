import React, { useState } from "react";
import {
  ScrollView, Text, View, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  error: "#E31C5F", errorBg: "#FEF2F2", errorBorder: "#FCA5A5",
};

const SHADOW = {};

const CANCELLATION_REASONS = [
  "Schedule conflict",
  "Found a better price elsewhere",
  "Service provider requested cancellation",
  "Booked by mistake",
  "Other",
];

export default function CancelBookingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert("Reason required", "Please select a reason for cancellation.");
      return;
    }
    if (!bookingId) {
      Alert.alert("Error", "Invalid booking reference.");
      return;
    }

    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        { text: "No, Keep Booking", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const fullReason =
                selectedReason === "Other"
                  ? comments.trim() || "Other"
                  : `${selectedReason}${comments ? ` - ${comments}` : ""}`;
              await api.patch(`/api/bookings/${bookingId}/cancel`, { reason: fullReason });
              Alert.alert("Booking Cancelled", "Your booking has been cancelled successfully.", [
                { text: "OK", onPress: () => router.push("/(customer)/(tabs)/home") },
              ]);
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.message || "Could not cancel the booking.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cancel Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Warning Hero */}
        <View style={s.heroBox}>
          <View style={s.heroIcon}>
            <MaterialCommunityIcons name="cancel" size={36} color={T.error} />
          </View>
          <Text style={s.heroTitle}>Are you sure?</Text>
          <Text style={s.heroSub}>
            Please let us know why you're cancelling so we can improve our service.
          </Text>
        </View>

        {/* Reasons */}
        <Text style={s.sectionLabel}>Reason for cancellation</Text>
        <View style={s.reasonsList}>
          {CANCELLATION_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                onPress={() => setSelectedReason(reason)}
                style={[s.reasonRow, isSelected && s.reasonRowSelected]}
                activeOpacity={0.8}
              >
                <Text style={[s.reasonText, isSelected && s.reasonTextSelected]}>{reason}</Text>
                <View style={[s.radio, isSelected && s.radioSelected]}>
                  {isSelected && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Comments */}
        <Text style={s.sectionLabel}>Additional Comments (Optional)</Text>
        <TextInput
          style={s.textArea}
          placeholder="Tell us more about your cancellation..."
          placeholderTextColor={T.text3}
          multiline
          numberOfLines={4}
          value={comments}
          onChangeText={setComments}
        />
      </ScrollView>

      {/* Footer */}
      <View style={[s.footer, SHADOW]}>
        <TouchableOpacity onPress={() => router.back()} style={s.keepBtn} activeOpacity={0.85}>
          <Text style={s.keepBtnText}>Keep Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCancel}
          disabled={isSubmitting || !selectedReason}
          style={[s.cancelBtn, (isSubmitting || !selectedReason) && { opacity: 0.6 }]}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.cancelBtnText}>Cancel Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: T.text1 },

  scroll: { padding: 24, paddingBottom: 140 },

  heroBox: { alignItems: "center", marginBottom: 32 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: T.errorBg,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
    borderWidth: 1, borderColor: T.errorBorder,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: T.text1, marginBottom: 8 },
  heroSub: { fontSize: 14, color: T.text2, textAlign: "center", lineHeight: 20, maxWidth: 280 },

  sectionLabel: {
    fontSize: 11, fontWeight: "800", color: T.text3,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginTop: 4,
  },

  reasonsList: { gap: 10, marginBottom: 28 },
  reasonRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderRadius: 14, borderWidth: 2, borderColor: T.border,
    backgroundColor: T.surface,
  },
  reasonRowSelected: { borderColor: T.error, backgroundColor: T.errorBg },
  reasonText: { fontSize: 15, fontWeight: "600", color: T.text2 },
  reasonTextSelected: { color: T.error, fontWeight: "700" },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
  },
  radioSelected: { backgroundColor: T.error, borderColor: T.error },

  textArea: {
    backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border,
    borderRadius: 14, padding: 16, minHeight: 100,
    fontSize: 15, color: T.text1, textAlignVertical: "top",
  },

  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border,
    flexDirection: "row", gap: 12,
    paddingHorizontal: 16, paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
  },
  keepBtn: {
    flex: 1, borderWidth: 1.5, borderColor: T.border, borderRadius: 14,
    paddingVertical: 14, alignItems: "center", backgroundColor: T.surface,
  },
  keepBtnText: { fontSize: 15, fontWeight: "700", color: T.text1 },
  cancelBtn: {
    flex: 1, backgroundColor: T.error, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
