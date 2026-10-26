import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert, StyleSheet, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "@/utils/api";

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
  error: "#E31C5F", success: "#00A699", warning: "#FFB800",
  blueBg: "#F7F7F7", blueText: "#1D4ED8",
  greenBg: "#DCFCE7", greenText: "#15803D",
  yellowBg: "#FEF3C7", yellowText: "#D97706",
  redBg: "#FEE2E2", redText: "#DC2626",
};

const SHADOW = {};

type LeaveType = "vacation" | "sick" | "personal";
type StatusType = "pending" | "approved" | "rejected";

interface TimeOffRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: StatusType;
  reason: string;
}

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: "Pending",  color: T.yellowText, bg: T.yellowBg, icon: "clock-outline" },
  approved: { label: "Blocked",   color: T.textMuted,   bg: "#F1F5F9",  icon: "block-helper" },
  rejected: { label: "Rejected", color: T.redText,    bg: T.redBg,    icon: "close-circle-outline" },
};

export default function TimeOffScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());
  const [isStartDateSelected, setIsStartDateSelected] = useState(false);
  const [isEndDateSelected, setIsEndDateSelected] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    fetchTimeOff();
  }, []);

  const fetchTimeOff = async () => {
    try {
      const res = await api.get('/api/staff/availability');
      const slots = res.data?.availability || [];
      const offSlots = slots.filter((s: any) => s.isAvailable === false);
      
      const mapped: TimeOffRequest[] = offSlots.map((s: any) => ({
        id: s.id.toString(),
        type: "vacation" as LeaveType,
        startDate: s.date.split("T")[0],
        endDate: s.date.split("T")[0],
        status: "approved" as StatusType,
        reason: "Availability blocked",
      }));
      setRequests(mapped);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRequest = async () => {
    if (!isStartDateSelected || !isEndDateSelected) {
      Alert.alert("Missing Fields", "Please select both dates for the block.");
      return;
    }
    setSubmitting(true);
    try {
      const start = new Date(startDateObj);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateObj);
      end.setHours(0, 0, 0, 0);
      
      if (start > end) {
        Alert.alert("Invalid Dates", "End date must be after start date.");
        setSubmitting(false);
        return;
      }

      const slotsToCreate = [];
      let current = new Date(start);
      while (current <= end) {
        const isoDate = current.toISOString().split("T")[0];
        slotsToCreate.push({
          date: isoDate,
          startTime: `${isoDate}T00:00:00.000Z`,
          endTime: `${isoDate}T23:59:59.000Z`,
          isAvailable: false
        });
        current.setDate(current.getDate() + 1);
      }

      await api.put('/api/staff/availability', { slots: slotsToCreate });
      
      setShowForm(false);
      setStartDateObj(new Date()); setEndDateObj(new Date());
      setIsStartDateSelected(false); setIsEndDateSelected(false);
      Alert.alert("Time Off Recorded", "Your time off has been successfully blocked out.");
      fetchTimeOff();
    } catch {
      Alert.alert("Error", "Could not submit request.");
    } finally {
      setSubmitting(false);
    }
  };



  const renderRequest = (item: TimeOffRequest) => {
    const cfg = STATUS_CONFIG[item.status];
    return (
      <View key={item.id} style={s.requestCard}>
        <View style={s.requestHeader}>
            <View style={s.requestTitleWrap}>
              <View style={s.requestIconBox}>
                <MaterialCommunityIcons 
                  name="calendar-remove" 
                  size={20} 
                  color={T.accent} 
                />
              </View>
              <View>
                <Text style={s.requestType}>Availability Block</Text>
                <Text style={s.requestDates}>{item.startDate} to {item.endDate}</Text>
              </View>
            </View>
          <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        
        <Text style={s.headerTitle}>Time Off</Text>

        <TouchableOpacity
          style={[s.toggleBtn, showForm && s.toggleBtnActive]}
          onPress={() => setShowForm(!showForm)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name={showForm ? "close" : "plus"} size={16} color={showForm ? T.text : "#fff"} />
          <Text style={[s.toggleBtnText, showForm && s.toggleBtnTextActive]}>{showForm ? "Cancel" : "Request"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Honest policy note */}
        {!showForm && (
          <View style={s.balancesRow}>
            <View style={[s.balanceCard, { flex: 1 }]}>
              <View style={s.balanceHeader}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#64748B" />
                <Text style={s.balanceLabel}>How this works</Text>
              </View>
              <Text style={{ fontSize: 13, color: "#475569", lineHeight: 19 }}>
                Company leave policies aren&apos;t configured yet. Requests here block your availability calendar — no leave balance is tracked.
              </Text>
            </View>
          </View>
        )}

        {/* Request Form */}
        {showForm && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Block Availability</Text>

            <View style={s.datesRow}>
              <View style={s.dateCol}>
                <Text style={s.fieldLabel}>Start Date</Text>
                <TouchableOpacity 
                  style={s.dateInput} 
                  onPress={() => setShowStartDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="calendar" size={20} color={T.primary} />
                  <Text style={[s.dateInputText, !isStartDateSelected ? {color: T.textMuted} : {}]}>
                    {!isStartDateSelected ? "Select Date" : formatDate(startDateObj)}
                  </Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDateObj}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setStartDateObj(selectedDate);
                        setIsStartDateSelected(true);
                      }
                    }}
                  />
                )}
              </View>
              <View style={s.dateCol}>
                <Text style={s.fieldLabel}>End Date</Text>
                <TouchableOpacity 
                  style={s.dateInput} 
                  onPress={() => setShowEndDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="calendar" size={20} color={T.primary} />
                  <Text style={[s.dateInputText, !isEndDateSelected ? {color: T.textMuted} : {}]}>
                    {!isEndDateSelected ? "Select Date" : formatDate(endDateObj)}
                  </Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDateObj}
                    mode="date"
                    display="default"
                    minimumDate={startDateObj}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setEndDateObj(selectedDate);
                        setIsEndDateSelected(true);
                      }
                    }}
                  />
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[s.submitBtn, submitting && s.submitBtnDisabled]}
              onPress={handleRequest}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialCommunityIcons name="send" size={18} color="#fff" />
                  <Text style={s.submitBtnText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.historyTitle}>History</Text>
        <View style={s.historyList}>
          {requests.map(req => renderRequest(req))}
        </View>
      </ScrollView>
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: T.primary, marginLeft: 4 },
  toggleBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: T.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  toggleBtnActive: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  toggleBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  toggleBtnTextActive: { color: T.text },

  scrollContent: { padding: 16, paddingBottom: 120 },

  // Balances
  balancesRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  balanceCard: { 
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, 
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1
  },
  balanceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  balanceLabel: { fontSize: 11, fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },
  balanceValue: { fontSize: 24, fontWeight: "900", color: "#0F172A" },
  balanceValueSub: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },

  // Form
  formCard: { backgroundColor: T.surface, borderRadius: 16, padding: 20,  },
  formTitle: { fontSize: 18, fontWeight: "800", color: T.text, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "800", color: T.textMuted, marginBottom: 8, textTransform: "uppercase" },
  
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface },
  typeBtnSelected: { backgroundColor: T.primary, borderColor: T.primary },
  typeBtnText: { fontSize: 14, fontWeight: "700", color: T.textMuted, textTransform: "capitalize" },
  typeBtnTextSelected: { color: "#fff" },

  datesRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  dateCol: { flex: 1 },
  dateInput: { 
    height: 48, backgroundColor: T.bg, borderRadius: 12, paddingHorizontal: 14, 
    borderWidth: 1, borderColor: T.border, flexDirection: "row", alignItems: "center", gap: 8 
  },
  dateInputText: { fontSize: 15, color: T.text, fontWeight: "500" },
  input: { height: 48, backgroundColor: T.bg, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: T.border, fontSize: 15, color: T.text },
  
  reasonRow: { marginBottom: 24 },
  inputArea: { height: 100, paddingTop: 14, textAlignVertical: "top" },

  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: T.primary, height: 50, borderRadius: 25 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // History
  historyTitle: { fontSize: 18, fontWeight: "800", color: T.text, marginBottom: 12 },
  historyList: { gap: 12 },
  
  requestCard: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  requestTitleWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  requestIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  requestType: { fontSize: 15, fontWeight: "700", color: T.text, textTransform: "capitalize" },
  requestDates: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  requestReason: { fontSize: 14, color: T.textMuted, fontStyle: "italic", marginTop: 4 },
});