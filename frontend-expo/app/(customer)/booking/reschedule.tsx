import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Reschedule Booking</Text>
          <Text style={s.headerSubtitle}>Booking #{id}</Text>
        </View>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
        {/* Info Banner */}
        <View style={s.infoBanner}>
          <MaterialCommunityIcons name="information-outline" size={20} color={T.gold} />
          <Text style={s.infoBannerText}>
            Rescheduling may be subject to availability. The service provider will be notified of the change.
          </Text>
        </View>

        {/* Date Picker */}
        <Text style={s.sectionTitle}>Select New Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dateListScroll}>
          <View style={s.dateListContent}>
            {days.map((day, idx) => {
              const isSelected = selectedDate?.toDateString() === day.toDateString();
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    s.dateCard,
                    isSelected ? s.dateCardActive : s.dateCardInactive
                  ]}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={[
                    s.weekdayText,
                    isSelected ? s.weekdayTextActive : s.weekdayTextInactive
                  ]}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                  <Text style={[
                    s.dayNumText,
                    isSelected ? s.dayNumTextActive : s.dayNumTextInactive
                  ]}>
                    {day.getDate()}
                  </Text>
                  <Text style={[
                    s.monthText,
                    isSelected ? s.monthTextActive : s.monthTextInactive
                  ]}>
                    {day.toLocaleDateString("en-US", { month: "short" })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Time Picker */}
        <Text style={s.sectionTitle}>Select New Time</Text>
        <View style={s.timeGrid}>
          {TIMES.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                style={[
                  s.timeChip,
                  isSelected ? s.timeChipActive : s.timeChipInactive
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  s.timeText,
                  isSelected ? s.timeTextActive : s.timeTextInactive
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>New Schedule</Text>
            <View style={s.summaryDetails}>
              <MaterialCommunityIcons name="calendar-check" size={16} color="#1ba9ed" />
              <Text style={s.summaryText}>
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {selectedTime}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Confirm Button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[
            s.confirmBtn,
            (!selectedDate || !selectedTime || submitting) ? s.confirmBtnDisabled : s.confirmBtnActive
          ]}
          onPress={handleReschedule}
          disabled={!selectedDate || !selectedTime || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={s.confirmBtnText}>Confirm Reschedule</Text>
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
  infoBanner: {
    backgroundColor: T.warningBg,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoBannerText: {
    color: T.gold,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontWeight: "600",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 12,
  },
  dateListScroll: {
    marginBottom: 24,
  },
  dateListContent: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 4,
  },
  dateCard: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 72,
    ...CARD_SHADOW,
  },
  dateCardActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  dateCardInactive: {
    backgroundColor: T.surface,
    borderColor: T.border,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  weekdayTextActive: {
    color: "white",
  },
  weekdayTextInactive: {
    color: T.text2,
  },
  dayNumText: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  dayNumTextActive: {
    color: "white",
  },
  dayNumTextInactive: {
    color: T.text1,
  },
  monthText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  monthTextActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  monthTextInactive: {
    color: T.text3,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  timeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    ...CARD_SHADOW,
  },
  timeChipActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  timeChipInactive: {
    backgroundColor: T.surface,
    borderColor: T.border,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  timeTextActive: {
    color: "white",
  },
  timeTextInactive: {
    color: T.text1,
  },
  summaryCard: {
    backgroundColor: T.accentLight,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    fontWeight: "800",
    color: T.primary,
    marginBottom: 8,
  },
  summaryDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryText: {
    color: T.text1,
    marginLeft: 8,
    fontWeight: "700",
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
  confirmBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  confirmBtnActive: {
    backgroundColor: T.primary,
  },
  confirmBtnDisabled: {
    backgroundColor: T.border,
    opacity: 0.6,
  },
  confirmBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
});
