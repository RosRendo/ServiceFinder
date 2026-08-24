import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { PhotoCapture } from "@/components/jobs/PhotoCapture";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

type JobStatus = "en_route" | "arrived" | "working" | "completed";

const STATUS_STEPS: { key: JobStatus; label: string; icon: string; description: string }[] = [
  { key: "en_route", label: "En Route", icon: "car", description: "You're on your way to the customer" },
  { key: "arrived", label: "Arrived", icon: "map-marker-check", description: "You've arrived at the location" },
  { key: "working", label: "Working", icon: "tools", description: "Job is in progress" },
  { key: "completed", label: "Completed", icon: "check-circle", description: "Job has been finished" },
];

export default function UpdateStatusScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentStatus, setCurrentStatus] = useState<JobStatus>("en_route");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (currentStatus === "en_route") {
        await api.patch(`/api/bookings/${id}/en-route`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "En Route 🚗",
          "The customer has been notified that you are on your way.",
          [{ text: "Got it", onPress: () => router.back() }]
        );
        return;
      }

      if (currentStatus === "arrived") {
        await api.patch(`/api/bookings/${id}/arrive`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Status Updated", "Status changed to Arrived");
        router.back();
        return;
      }

      if (currentStatus === "working") {
        await api.patch(`/api/bookings/${id}/start`);
        Alert.alert("Status Updated", "Status changed to Working (In Progress)");
        router.back();
        return;
      }

      if (currentStatus === "completed") {
        let proofOfWorkPhotoUrl = "";
        if (photos.length > 0) {
          const formData = new FormData();
          formData.append('file', {
            uri: photos[0].uri,
            name: `proof_${id}.jpg`,
            type: 'image/jpeg'
          } as any);

          const uploadRes = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          proofOfWorkPhotoUrl = uploadRes.data.url;
        }

        await api.patch(`/api/bookings/${id}/complete`, {
          proofOfWorkPhoto: proofOfWorkPhotoUrl || undefined,
          notes,
        });

        Alert.alert(
          "Job Completed! 🎉",
          "Great work! The customer has been notified.",
          [{ text: "Done", onPress: () => router.replace("/(staff)/(tabs)/today") }]
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      Alert.alert("Error", `Failed to update status: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Update Job Status</Text>
          <Text style={s.headerSubtitle}>Job #{id}</Text>
        </View>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
        {/* Status Steps */}
        <Text style={s.sectionTitle}>Select Current Status</Text>
        <View style={s.stepsContainer}>
          {STATUS_STEPS.map((step, idx) => {
            const isSelected = step.key === currentStatus;
            const isPast = idx < currentStepIdx;
            return (
              <TouchableOpacity
                key={step.key}
                style={[
                  s.stepCard,
                  isSelected ? s.stepCardSelected : isPast ? s.stepCardPast : s.stepCardUpcoming
                ]}
                onPress={() => {
                  setCurrentStatus(step.key);
                  if (step.key === "arrived") {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } else {
                    Haptics.selectionAsync();
                  }
                }}
              >
                <View style={[
                  s.stepIconBox,
                  isSelected ? s.stepIconBoxSelected : isPast ? s.stepIconBoxPast : s.stepIconBoxUpcoming
                ]}>
                  <MaterialCommunityIcons
                    name={step.icon as any}
                    size={20}
                    color={isSelected ? "white" : isPast ? T.text2 : T.primary}
                  />
                </View>
                <View style={s.stepTextWrap}>
                  <Text style={[
                    s.stepLabel,
                    isSelected ? s.stepLabelSelected : s.stepLabelDefault
                  ]}>
                    {step.label}
                  </Text>
                  <Text style={s.stepDesc}>{step.description}</Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="radiobox-marked" size={20} color="#1ba9ed" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress Notes */}
        <Text style={s.sectionTitle}>Progress Notes</Text>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="Add notes about the job progress (optional)..."
            placeholderTextColor={T.text3}
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Photo Upload */}
        <Text style={s.sectionTitle}>Attach Photos</Text>
        <PhotoCapture
          jobId={id ?? ""}
          onPhotosChange={setPhotos}
          maxPhotos={6}
        />
      </ScrollView>

      {/* Submit Button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[
            s.submitBtn,
            currentStatus === "completed" ? s.submitBtnComplete : s.submitBtnDefault,
            submitting && { opacity: 0.7 }
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={s.submitBtnRow}>
              <MaterialCommunityIcons
                name={currentStatus === "completed" ? "check-circle" : "update"}
                size={20}
                color="white"
              />
              <Text style={s.submitBtnText}>
                {currentStatus === "completed" ? "Mark as Completed" : "Update Status"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: T.text3,
    fontWeight: "600",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 12,
    marginTop: 8,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  stepCardSelected: {
    backgroundColor: T.accentLight,
    borderColor: T.primary,
  },
  stepCardPast: {
    backgroundColor: T.surface,
    borderColor: T.border,
    opacity: 0.6,
  },
  stepCardUpcoming: {
    backgroundColor: T.surface,
    borderColor: T.border,
  },
  stepIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  stepIconBoxSelected: {
    backgroundColor: T.primary,
  },
  stepIconBoxPast: {
    backgroundColor: T.bg,
  },
  stepIconBoxUpcoming: {
    backgroundColor: T.bg,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepLabel: {
    fontWeight: "800",
    fontSize: 14,
  },
  stepLabelSelected: {
    color: T.primary,
  },
  stepLabelDefault: {
    color: T.text1,
  },
  stepDesc: {
    fontSize: 12,
    color: T.text2,
    marginTop: 2,
  },
  inputWrap: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.border,
    padding: 12,
    marginBottom: 24,
    ...CARD_SHADOW,
  },
  input: {
    fontSize: 14,
    color: T.text1,
    minHeight: 80,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 16,
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  submitBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  submitBtnDefault: {
    backgroundColor: T.primary,
  },
  submitBtnComplete: {
    backgroundColor: T.success,
  },
  submitBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
});
