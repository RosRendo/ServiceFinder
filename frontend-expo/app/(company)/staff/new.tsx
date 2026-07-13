/**
 * Invite Staff — Premium Deep Navy Redesign
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

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", accentLight: "#F7F7F7",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  success: "#00A699",
};

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const ROLES = [
  { key: "worker",     label: "Worker",     icon: "hammer-wrench",          desc: "Field technician or cleaner" },
  { key: "supervisor", label: "Supervisor", icon: "shield-account-outline", desc: "Manages field workers" },
  { key: "manager",    label: "Manager",    icon: "briefcase-outline",      desc: "Full team oversight" },
];

export default function AddStaff() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", role: "worker",
  });

  const handleSend = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      Alert.alert("Missing Fields", "Full name and email are required.");
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

      const data = res.data;
      const tempPassword = data.defaultPassword;

      if (tempPassword) {
        Alert.alert(
          "Staff Added! 🎉",
          `${form.fullName} has been added to your team.\n\n` +
          `📧 Email: ${form.email.trim().toLowerCase()}\n` +
          `🔑 Temp Password: ${tempPassword}\n\n` +
          `A welcome email has been sent to their inbox automatically.`,
          [{ text: "Done", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Staff Linked!",
          `${form.fullName} already has an account and has been added to your team.`,
          [{ text: "Done", onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to create staff account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Invite Staff</Text>
          <TouchableOpacity onPress={handleSend} disabled={loading} style={[s.sendBtn, loading && { opacity: 0.5 }]}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.sendBtnText}>Invite</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {/* Header Text */}
          <View style={s.titleSection}>
            <Text style={s.pageTitle}>Add a Team Member</Text>
            <Text style={s.pageDesc}>They will receive login credentials via email and can immediately start accepting jobs.</Text>
          </View>

          {/* Form Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Personal Details</Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>Full Name *</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name="account-outline" size={20} color={T.text3} />
                <TextInput
                  value={form.fullName} onChangeText={(t) => setForm({ ...form, fullName: t })}
                  placeholder="e.g., Sam Green" placeholderTextColor={T.text3} style={s.input}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Email Address *</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name="email-outline" size={20} color={T.text3} />
                <TextInput
                  value={form.email} onChangeText={(t) => setForm({ ...form, email: t })}
                  placeholder="sam@example.com" placeholderTextColor={T.text3} style={s.input}
                  keyboardType="email-address" autoCapitalize="none"
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Phone Number</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={T.text3} />
                <TextInput
                  value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })}
                  placeholder="+1 (555) 000-0000" placeholderTextColor={T.text3} style={s.input}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Role Selector */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Assign Role</Text>
            <Text style={s.cardSubtitle}>Select what this staff member can access</Text>
            
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
                      <MaterialCommunityIcons name={role.icon as any} size={22} color={selected ? "#fff" : T.text3} />
                    </View>
                    <View style={s.roleInfo}>
                      <Text style={[s.roleLabel, selected && s.roleLabelSelected]}>{role.label}</Text>
                      <Text style={[s.roleDesc, selected && s.roleDescSelected]}>{role.desc}</Text>
                    </View>
                    <View style={[s.radioOuter, selected && s.radioOuterSelected]}>
                      {selected && <View style={s.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.bg, 
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.accent },
  sendBtn: { backgroundColor: T.accentMid, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  scrollContent: { padding: 24, gap: 24, paddingBottom: 60, paddingTop: 8 },

  titleSection: { gap: 8, paddingHorizontal: 4 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: T.accent },
  pageDesc: { fontSize: 14, color: T.text2, lineHeight: 22 },

  card: {
    backgroundColor: T.surface, borderRadius: 24, padding: 24,
    
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  cardSubtitle: { fontSize: 13, color: T.text3, marginTop: -16 },

  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: "700", color: T.text2, marginLeft: 4 },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: T.bg, borderRadius: 16, paddingHorizontal: 16,
    height: 54, borderWidth: 1, borderColor: T.border,
  },
  input: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },

  rolesList: { backgroundColor: T.bg, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: "hidden" },
  roleRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16, backgroundColor: T.surface },
  roleRowBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  roleRowSelected: { backgroundColor: T.accentLight },
  
  roleIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  roleIconWrapSelected: { backgroundColor: T.accentMid },
  
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 15, fontWeight: "800", color: T.text1, marginBottom: 2 },
  roleLabelSelected: { color: T.accentMid },
  roleDesc: { fontSize: 13, color: T.text3 },
  roleDescSelected: { color: T.text2 },

  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: T.text3, alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: T.accentMid },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.accentMid },
});
