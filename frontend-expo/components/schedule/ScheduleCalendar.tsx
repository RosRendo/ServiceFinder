import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { AvailabilitySlot } from "@/hooks/useStaffAvailability";

interface ScheduleCalendarProps {
  slots: AvailabilitySlot[];
  onDateSelect: (dateString: string) => void;
  isLoading: boolean;
}

export function ScheduleCalendar({ slots, onDateSelect, isLoading }: ScheduleCalendarProps) {
  const [selected, setSelected] = useState<string>("");

  // Convert API slots to react-native-calendars markedDates format
  const markedDates = slots.reduce((acc, slot) => {
    if (slot.specificDate) {
      acc[slot.specificDate] = {
        marked: true,
        dotColor: slot.isAvailable ? "#4CAF50" : "#F44336",
      };
    }
    return acc;
  }, {} as any);

  if (selected) {
    markedDates[selected] = {
      ...markedDates[selected],
      selected: true,
      selectedColor: "#002045",
    };
  }

  return (
    <View className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container shadow-sm">
      {isLoading && (
        <View className="absolute z-10 w-full h-full bg-white/50 items-center justify-center">
          <ActivityIndicator size="large" color="#002045" />
        </View>
      )}

      <Calendar
        onDayPress={(day: any) => {
          setSelected(day.dateString);
          onDateSelect(day.dateString);
        }}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#002045',
          arrowColor: '#002045',
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
        }}
      />
    </View>
  );
}
