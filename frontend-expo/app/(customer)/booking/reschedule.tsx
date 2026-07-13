import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "@/utils/api";

const TIMES = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

function getDaysAhead(count: number) {
  const days = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function RescheduleBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const days = getDaysAhead(14);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Missing Selection", "Please select both a date and time slot.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/bookings/${id}/reschedule`, {
        newDate: selectedDate.toISOString().split("T")[0],
        newTime: selectedTime,
      });
      Alert.alert(
        "Booking Rescheduled!",
        "Your booking has been updated and the service provider has been notified.",
        [{ text: "OK", onPress: () => router.replace(`/(customer)/booking/${id}`) }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "Could not reschedule. Please try again.");
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
          <Text className="text-xl font-headline font-bold text-on-surface">Reschedule Booking</Text>
          <Text className="text-xs text-on-surface-variant">Booking #{id}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Info Banner */}
        <View className="bg-[#ffdcbc]/40 border border-[#935f00]/30 rounded-2xl p-4 mb-6 flex-row items-start">
          <MaterialCommunityIcons name="information-outline" size={20} color="#935f00" />
          <Text className="text-[#935f00] text-sm ml-2 flex-1">
            Rescheduling may be subject to availability. The service provider will be notified of the change.
          </Text>
        </View>

        {/* Date Picker */}
        <Text className="font-headline font-bold text-on-surface mb-3">Select New Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-3 pb-2">
            {days.map((day, idx) => {
              const isSelected = selectedDate?.toDateString() === day.toDateString();
              return (
                <TouchableOpacity
                  key={idx}
                  className={`items-center py-3 px-4 rounded-2xl border-2 min-w-[68px] ${
                    isSelected ? "bg-primary border-primary" : "bg-surface-container-lowest border-outline-variant"
                  }`}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text className={`text-xs font-bold uppercase ${isSelected ? "text-white" : "text-on-surface-variant"}`}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                  <Text className={`text-2xl font-bold mt-1 ${isSelected ? "text-white" : "text-on-surface"}`}>
                    {day.getDate()}
                  </Text>
                  <Text className={`text-xs ${isSelected ? "text-white/80" : "text-on-surface-variant"}`}>
                    {day.toLocaleDateString("en-US", { month: "short" })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Time Picker */}
        <Text className="font-headline font-bold text-on-surface mb-3">Select New Time</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {TIMES.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                className={`py-2.5 px-4 rounded-full border ${
                  isSelected ? "bg-primary border-primary" : "bg-surface-container-lowest border-outline-variant"
                }`}
                onPress={() => setSelectedTime(time)}
              >
                <Text className={`font-bold text-sm ${isSelected ? "text-white" : "text-on-surface"}`}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <View className="bg-primary-container/30 border border-primary/20 rounded-2xl p-4">
            <Text className="font-bold text-on-surface mb-1">New Schedule</Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="calendar-check" size={16} color="#1ba9ed" />
              <Text className="text-on-surface ml-2">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {selectedTime}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-surface border-t border-surface-container">
        <TouchableOpacity
          className={`h-14 rounded-full items-center justify-center ${
            !selectedDate || !selectedTime || submitting ? "bg-primary/50" : "bg-primary"
          }`}
          onPress={handleReschedule}
          disabled={!selectedDate || !selectedTime || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Confirm Reschedule</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
