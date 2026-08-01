import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, Switch, Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import DateTimePicker from "@react-native-community/datetimepicker";

const T = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#0A192F',
  primaryLight: '#1E3A8A',
  accent: '#0A192F',
  accentLight: '#F0F4F8',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
};

const SHADOW = {};

export default function AvailabilityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showPicker, setShowPicker] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [activeTimeType, setActiveTimeType] = useState<"start" | "end" | null>(null);
  const [tempTime, setTempTime] = useState(new Date());

  const openTimePicker = (index: number, type: "start" | "end") => {
    setActiveDayIndex(index);
    setActiveTimeType(type);
    
    const timeStr = schedule[index][type];
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    setTempTime(d);
    setShowPicker(true);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (selectedDate && activeDayIndex !== null && activeTimeType !== null) {
      const hours = String(selectedDate.getHours()).padStart(2, "0");
      const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
      const newTimeStr = `${hours}:${minutes}`;
      
      const newSched = [...schedule];
      newSched[activeDayIndex] = {
        ...newSched[activeDayIndex],
        [activeTimeType]: newTimeStr
      };
      setSchedule(newSched);
      if (Platform.OS === 'ios') {
        setTempTime(selectedDate);
      }
    }
  };
  
  // Weekly structure
  const [schedule, setSchedule] = useState([
    { day: "Monday", available: true, start: "09:00", end: "17:00" },
    { day: "Tuesday", available: true, start: "09:00", end: "17:00" },
    { day: "Wednesday", available: true, start: "09:00", end: "17:00" },
    { day: "Thursday", available: true, start: "09:00", end: "17:00" },
    { day: "Friday", available: true, start: "09:00", end: "17:00" },
    { day: "Saturday", available: false, start: "10:00", end: "15:00" },
    { day: "Sunday", available: false, start: "10:00", end: "15:00" },
  ]);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await api.get('/api/staff/availability');
      const data = res.data;
      const slots = data?.availability ?? data?.data?.availability ?? [];
      
      if (Array.isArray(slots) && slots.length > 0) {
        const newSched = [...schedule];
        const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        slots.forEach((slot: any) => {
          const slotDate = new Date(slot.date);
          const dayName = dayMap[slotDate.getDay()];
          const idx = newSched.findIndex(s => s.day === dayName);
          
          if (idx !== -1) {
            const startStr = slot.startTime ? slot.startTime.slice(0, 5) : "09:00";
            const endStr = slot.endTime ? slot.endTime.slice(0, 5) : "17:00";
            
            newSched[idx] = {
              day: dayName,
              available: slot.isAvailable,
              start: startStr,
              end: endStr
            };
          }
        });
        setSchedule(newSched);
      }
    } catch (error) {
      console.warn("Failed to load availability", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Generate slots for the next 4 weeks based on this schedule
      const slots = [];
      const today = new Date();
      
      for (let i = 0; i < 28; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        
        // getDay() is 0 (Sun) to 6 (Sat)
        const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = dayMap[d.getDay()];
        
        const daySettings = schedule.find(s => s.day === dayName);
        if (daySettings) {
          slots.push({
            date: d.toISOString().split("T")[0],
            startTime: daySettings.start + ":00",
            endTime: daySettings.end + ":00",
            isAvailable: daySettings.available
          });
        }
      }

      await api.put('/api/staff/availability', { slots });
      Alert.alert("Success", "Your availability has been updated for the next 4 weeks.");
    } catch (e) {
      Alert.alert("Error", "Could not save availability.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index: number) => {
    const newSched = [...schedule];
    newSched[index].available = !newSched[index].available;
    setSchedule(newSched);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Availability</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.heroCard}>
          <MaterialCommunityIcons name="calendar-clock" size={40} color="#fff" />
          <Text style={s.heroTitle}>Working Hours</Text>
          <Text style={s.heroSub}>Set your default weekly schedule. Jobs will only be assigned during these times.</Text>
        </View>

        <View style={s.card}>
          {schedule.map((item, index) => (
            <View key={item.day}>
              <View style={[s.dayRow, !item.available && { opacity: 0.5 }]}>
                <View style={s.dayInfo}>
                  <Text style={s.dayName}>{item.day}</Text>
                  {item.available ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <TouchableOpacity onPress={() => openTimePicker(index, 'start')} style={s.timeBadge}>
                        <Text style={s.timeBadgeText}>{item.start}</Text>
                      </TouchableOpacity>
                      <Text style={{ color: T.textMuted }}>to</Text>
                      <TouchableOpacity onPress={() => openTimePicker(index, 'end')} style={s.timeBadge}>
                        <Text style={s.timeBadgeText}>{item.end}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={s.dayOff}>Not Available</Text>
                  )}
                </View>
                <Switch
                  value={item.available}
                  onValueChange={() => toggleDay(index)}
                  trackColor={{ false: T.border, true: T.success }}
                  thumbColor="#fff"
                />
              </View>
              {index < schedule.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={s.saveBtn} 
          onPress={handleSave} 
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={s.saveBtnText}>Save Schedule</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent visible={showPicker} animationType="slide">
            <View style={s.modalOverlay}>
              <View style={s.modalContent}>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>Select {activeTimeType === 'start' ? 'Start' : 'End'} Time</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={s.modalDoneBtn}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )
      )}
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
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.primary },
  
  content: { padding: 20, paddingBottom: 60, gap: 20 },
  
  heroCard: {
    backgroundColor: T.primary, borderRadius: 20, padding: 24,
    alignItems: "center", borderWidth: 1, borderColor: T.border,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 12, marginBottom: 8 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 20 },

  card: {
    backgroundColor: T.surface, borderRadius: 16,
    borderWidth: 1, borderColor: T.border,
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16,
  },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 16, fontWeight: "700", color: T.text, marginBottom: 4 },
  dayTime: { fontSize: 14, fontWeight: "500", color: T.primary },
  dayOff: { fontSize: 14, fontWeight: "500", color: T.textMuted, fontStyle: "italic" },
  divider: { height: 1, backgroundColor: T.border, marginLeft: 16 },

  timeBadge: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  timeBadgeText: {
    fontSize: 14, fontWeight: '700', color: '#0A192F',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0A192F' },
  modalDoneBtn: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },

  saveBtn: {
    backgroundColor: T.primary, borderRadius: 16, height: 56,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border,
  },
  saveBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});