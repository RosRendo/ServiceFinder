import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function NewReviewScreen() {
  const router = useRouter();
  const { bookingId, companyId, staffId } = useLocalSearchParams<{
    bookingId?: string; companyId?: string; staffId?: string;
  }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert("Rating required", "Please select a star rating."); return; }
    if (!bookingId) { Alert.alert("Error", "Booking reference is missing."); return; }
    setSubmitting(true);
    try {
      await api.post("/api/reviews", {
        bookingId,
        companyId,
        staffId: staffId ?? undefined,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert("Thank you!", "Your review has been submitted.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Could not submit review.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="close" size={24} color={T.accent} />
        </TouchableOpacity>
        <Text style={s.title}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.prompt}>How was your experience?</Text>

        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={s.starBtn}>
              <MaterialCommunityIcons
                name={star <= rating ? "star" : "star-outline"}
                size={44}
                color={star <= rating ? T.gold : "#D1D5DB"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.inputLabel}>Your comment (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="Share details about your experience..."
          placeholderTextColor={T.text3}
          multiline
          numberOfLines={5}
          value={comment}
          onChangeText={setComment}
        />

        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={submitting}
          style={[s.submitBtn, submitting && { opacity: 0.7 }]}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>Submit Review</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: T.accent },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  prompt: { textAlign: "center", fontSize: 15, color: T.text2, marginBottom: 16 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 32 },
  starBtn: { padding: 4 },
  inputLabel: { fontSize: 14, fontWeight: "800", color: T.text1, marginBottom: 8 },
  input: {
    backgroundColor: T.bg, borderRadius: 16, padding: 16, fontSize: 15, color: T.text1,
    borderWidth: 1, borderColor: T.border, minHeight: 120, textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: 32, height: 56, borderRadius: 28, backgroundColor: T.accent,
    alignItems: "center", justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
});
