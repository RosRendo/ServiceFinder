import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { PhotoCapture } from "@/components/jobs/PhotoCapture";
import api from "@/utils/api";

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
        // Persist en-route status to backend — triggers customer notification and begins location tracking window
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
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 py-3 border-b border-surface-container">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#191c1e" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-headline font-bold text-on-surface">Update Job Status</Text>
          <Text className="text-xs text-on-surface-variant">Job #{id}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Status Steps */}
        <Text className="font-headline font-bold text-on-surface mb-4">Select Current Status</Text>
        <View className="mb-6">
          {STATUS_STEPS.map((step, idx) => {
            const isSelected = step.key === currentStatus;
            const isPast = idx < currentStepIdx;
            return (
              <TouchableOpacity
                key={step.key}
                className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
                  isSelected
                    ? "bg-primary-container/40 border-primary"
                    : isPast
                    ? "bg-surface-container-lowest border-surface-container opacity-60"
                    : "bg-surface-container-lowest border-outline-variant"
                }`}
                onPress={() => {
                  setCurrentStatus(step.key);
                  if (step.key === "arrived") {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } else {
                    Haptics.selectionAsync();
                  }
                }}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                  isSelected ? "bg-primary" : isPast ? "bg-surface-container" : "bg-surface-container-high"
                }`}>
                  <MaterialCommunityIcons
                    name={step.icon as any}
                    size={20}
                    color={isSelected ? "white" : isPast ? "#74777f" : "#191c1e"}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`font-bold ${isSelected ? "text-primary" : "text-on-surface"}`}>
                    {step.label}
                  </Text>
                  <Text className="text-xs text-on-surface-variant mt-0.5">{step.description}</Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="radiobox-marked" size={20} color="#1ba9ed" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress Notes */}
        <Text className="font-headline font-bold text-on-surface mb-3">Progress Notes</Text>
        <View className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-3 mb-6">
          <TextInput
            className="text-on-surface font-body min-h-[80px]"
            placeholder="Add notes about the job progress (optional)..."
            placeholderTextColor="#c4c6cf"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Photo Upload */}
        <Text className="font-headline font-bold text-on-surface mb-3">Attach Photos</Text>
        <PhotoCapture
          jobId={id ?? ""}
          onPhotosChange={setPhotos}
          maxPhotos={6}
        />
      </ScrollView>

      {/* Submit Button */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-surface border-t border-surface-container">
        <TouchableOpacity
          className={`h-14 rounded-full items-center justify-center ${
            submitting ? "bg-primary/70" : currentStatus === "completed" ? "bg-[#16a34a]" : "bg-primary"
          }`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons
                name={currentStatus === "completed" ? "check-circle" : "update"}
                size={20}
                color="white"
              />
              <Text className="text-white font-bold text-lg">
                {currentStatus === "completed" ? "Mark as Completed" : "Update Status"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
