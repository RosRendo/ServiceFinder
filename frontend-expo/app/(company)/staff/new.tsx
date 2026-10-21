/**
 * Invite Staff — Quiet Executive Monochromatic Standard (Linear / Apple Pro)
 */
import React, { useState } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
  android: { elevation: 1 },
});

const ROLES = [
  { key: "worker",     label: "Field Technician",  icon: "tools",                  desc: "Receives on-demand job dispatches, fulfills work orders, and collects customer cash." },
  { key: "supervisor", label: "Field Supervisor",  icon: "shield-account-outline", desc: "Supervises technicians in the field, monitors live SLA timers, and coordinates reassignments." },
  { key: "manager",    label: "Operations Manager", icon: "briefcase-outline",      desc: "Full operational oversight including fleet radar, service catalog, and financial payouts." },
];

export default function AddStaff() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", role: "worker",
  });

  const handleSend = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      Alert.alert("Required Fields", "Please provide the technician's full name and email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/companies/staff", {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
      });

      const data = res.data?.data ?? res.data;
      const tempPassword = data?.defaultPassword;

      if (tempPassword) {
        Alert.alert(
          "Team Member Added",
          `${form.fullName.trim()} has been registered.\n\n` +
          `Email: ${form.email.trim().toLowerCase()}\n` +
          `Temporary Password: ${tempPassword}\n\n` +
          `A welcome notification with setup instructions has been sent to their inbox.`,
          [{ text: "Done", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Staff Linked",
          `${form.fullName.trim()} has been linked to your fleet roster.`,
          [{ text: "Done", onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert("Registration Failed", error?.response?.data?.message || "Could not create team member account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Quiet Top Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Invite Team Member</Text>
            <Text style={s.headerSubtitle}>Fleet Onboarding</Text>
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            style={[s.sendBtn, loading && { opacity: 0.5 }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={s.sendBtnText}>Invite</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {/* Subtle Info Banner */}
          <View style={s.infoBanner}>
            <MaterialCommunityIcons name="information-outline" size={18} color="#475569" />
            <Text style={s.infoBannerText}>
              Invited technicians will receive temporary login credentials to access the mobile app and begin accepting dispatches.
            </Text>
          </View>

          {/* Form Card: Personal Details */}
          <View style={[s.card, CARD_SHADOW]}>
            <Text style={s.cardTitle}>Personal Information</Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>FULL NAME *</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name="account-outline" size={18} color="#94A3B8" />
                <TextInput
                  value={form.fullName}
                  onChangeText={(t) => setForm({ ...form, fullName: t })}
                  placeholder="e.g. Sokha Meng"
                  placeholderTextColor="#94A3B8"
                  style={s.input}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>WORK EMAIL ADDRESS *</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#94A3B8" />
                <TextInput
                  value={form.email}
                  onChangeText={(t) => setForm({ ...form, email: t })}
                  placeholder="sokha@servicefinder.com"
                  placeholderTextColor="#94A3B8"
                  style={s.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>MOBILE PHONE NUMBER</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name="phone-outline" size={18} color="#94A3B8" />
                <TextInput
                  value={form.phone}
                  onChangeText={(t) => setForm({ ...form, phone: t })}
                  placeholder="+855 12 345 678"
                  placeholderTextColor="#94A3B8"
                  style={s.input}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Role Selection Card */}
          <View style={[s.card, CARD_SHADOW]}>
            <Text style={s.cardTitle}>Fleet Role Assignment</Text>
            <Text style={s.cardSubtitle}>Defines job dispatch eligibility and permission scope</Text>
            
            <View style={s.rolesList}>
              {ROLES.map((role, idx) => {
                const selected = form.role === role.key;
                const isLast = idx === ROLES.length - 1;
                return (
                  <TouchableOpacity
                    key={role.key}
                    style={[s.roleRow, !isLast && s.roleRowBorder, selected && s.roleRowSelected]}
                    onPress={() => setForm({ ...form, role: role.key })}
                    activeOpacity={0.7}
                  >
                    <View style={[s.roleIconWrap, selected && s.roleIconWrapSelected]}>
                      <MaterialCommunityIcons
                        name={role.icon as any}
                        size={20}
                        color={selected ? "#FFFFFF" : "#64748B"}
                      />
                    </View>
                    <View style={s.roleInfo}>
                      <Text style={[s.roleLabel, selected && s.roleLabelSelected]}>{role.label}</Text>
                      <Text style={s.roleDesc}>{role.desc}</Text>
                    </View>
                    <View style={[s.radioOuter, selected && s.radioOuterSelected]}>
                      {selected && <View style={s.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bottom Direct CTA */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            style={[s.bottomButton, loading && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="send-outline" size={18} color="#FFFFFF" />
                <Text style={s.bottomButtonText}>Send Team Invite</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, fontWeight: "500", color: "#64748B", marginTop: 1 },
  sendBtn: {
    backgroundColor: "#0F172A", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
  },
  sendBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 12 },

  scrollContent: { padding: 16, gap: 14, paddingBottom: 60 },

  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0",
    padding: 12, borderRadius: 12,
  },
  infoBannerText: { flex: 1, fontSize: 12, fontWeight: "500", color: "#475569", lineHeight: 17 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0", gap: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", letterSpacing: -0.1 },
  cardSubtitle: { fontSize: 11, fontWeight: "400", color: "#64748B", marginTop: -8, marginBottom: 2 },

  inputGroup: { gap: 6 },
  label: { fontSize: 10, fontWeight: "700", color: "#64748B", letterSpacing: 0.5 },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 14,
    height: 48, borderWidth: 1, borderColor: "#E2E8F0",
  },
  input: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "500" },

  rolesList: {
    borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden",
  },
  roleRow: {
    flexDirection: "row", alignItems: "center", padding: 14, gap: 12, backgroundColor: "#FFFFFF",
  },
  roleRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  roleRowSelected: { backgroundColor: "#F8FAFC" },
  
  roleIconWrap: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  roleIconWrapSelected: { backgroundColor: "#0F172A" },
  
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  roleLabelSelected: { color: "#0F172A" },
  roleDesc: { fontSize: 11, color: "#64748B", lineHeight: 16 },

  radioOuter: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: "#CBD5E1",
    alignItems: "center", justifyContent: "center",
  },
  radioOuterSelected: { borderColor: "#0F172A" },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0F172A" },

  bottomButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#0F172A", paddingVertical: 14, borderRadius: 12, marginTop: 4,
  },
  bottomButtonText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
});
