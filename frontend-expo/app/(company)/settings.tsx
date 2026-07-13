/**
 * Business Settings — Premium Deep Navy Redesign & KYC
 */
import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#EBEBEB",
  accent: "#0A192F",
  accentMid: "#1E3A8A",
  accentLight: "#F7F7F7",
  text1: "#111827",
  text2: "#717171",
  text3: "#B0B0B0",
  success: "#00A699",
  warning: "#FFB800",
  error: "#E31C5F",
};

const SHADOW = {};

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Basic Info
  const [companyId, setCompanyId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  
  // Contact
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Legal & Location
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [verificationDocumentUrl, setVerificationDocumentUrl] = useState("");

  const loadCompany = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/companies/my-company");
      const data = res.data?.data ?? res.data;
      if (data) {
        setCompanyId(data.id || "");
        setName(data.name || "");
        setDescription(data.description || "");
        setEstablishedYear(data.establishedYear ? String(data.establishedYear) : "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setRegistrationNumber(data.registrationNumber || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setVerificationDocumentUrl(data.verificationDocumentUrl || "");
      }
    } catch (error) {
      console.error("Failed to load company profile", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCompany();
    }, [loadCompany])
  );

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      await api.put(`/api/companies/${companyId}`, {
        name,
        description,
        establishedYear: establishedYear ? parseInt(establishedYear, 10) : null,
        email,
        phone,
        registrationNumber,
        address,
        city,
        verificationDocumentUrl
      });
      Alert.alert("Success", "Company profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      Alert.alert("Error", "Could not update company profile.");
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, multiline = false, keyboardType = "default" }: any) => (
    <View style={s.inputContainer}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={T.text3}
        multiline={multiline}
        keyboardType={keyboardType as any}
        textAlignVertical={multiline ? "top" : "auto"}
      />
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Business Settings</Text>
        </View>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCompany(true)} tintColor={T.accent} />}
        >
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={T.accent} />
            </View>
          ) : (
            <>
              {/* Profile Image Area */}
              <View style={s.profileHeader}>
                <View style={s.logoContainer}>
                  <MaterialCommunityIcons name="domain" size={48} color={T.accent} />
                  <View style={s.editBadge}>
                    <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
                  </View>
                </View>
                <Text style={s.changeLogoText}>Change Logo</Text>
              </View>

              {/* Basic Info Section */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <MaterialCommunityIcons name="information-outline" size={20} color={T.accentMid} />
                  <Text style={s.sectionTitle}>Basic Information</Text>
                </View>
                <InputField label="Company Name" value={name} onChange={setName} placeholder="Enter company name" />
                <InputField label="Description" value={description} onChange={setDescription} placeholder="Briefly describe your services..." multiline />
                <InputField label="Established Year" value={establishedYear} onChange={setEstablishedYear} placeholder="e.g. 2018" keyboardType="numeric" />
              </View>

              {/* Contact Details Section */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <MaterialCommunityIcons name="card-account-phone-outline" size={20} color={T.accentMid} />
                  <Text style={s.sectionTitle}>Contact Details</Text>
                </View>
                <InputField label="Business Email" value={email} onChange={setEmail} placeholder="contact@company.com" keyboardType="email-address" />
                <InputField label="Phone Number" value={phone} onChange={setPhone} placeholder="+1 234 567 8900" keyboardType="phone-pad" />
              </View>

              {/* Legal & Location Section */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={T.accentMid} />
                  <Text style={s.sectionTitle}>Legal & Location</Text>
                </View>
                <InputField label="Registration Number (SSM/EIN)" value={registrationNumber} onChange={setRegistrationNumber} placeholder="e.g. 1234567-X" />
                <InputField label="Business Address" value={address} onChange={setAddress} placeholder="Street, Building" />
                <InputField label="City" value={city} onChange={setCity} placeholder="e.g. Kuala Lumpur" />
              </View>

              {/* Verification Section */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color={T.accentMid} />
                  <Text style={s.sectionTitle}>Verification</Text>
                </View>
                <InputField label="Document URL (PDF)" value={verificationDocumentUrl} onChange={setVerificationDocumentUrl} placeholder="https://example.com/doc.pdf" keyboardType="url" />
                <Text style={s.helperText}>Provide a link to your business license or ID for admin verification.</Text>
              </View>

            </>
          )}
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
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  saveBtn: { backgroundColor: T.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  scrollContent: { padding: 20, paddingBottom: 60, gap: 24 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },

  profileHeader: { alignItems: "center", marginTop: 10, marginBottom: 10 },
  logoContainer: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: T.accentLight,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
    },
  editBadge: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: T.accentMid, width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff"
  },
  changeLogoText: { fontSize: 14, fontWeight: "700", color: T.accentMid },

  section: { backgroundColor: T.surface, padding: 20, borderRadius: 16,  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },

  inputContainer: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: T.text2 },
  input: {
    backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: T.text1, fontWeight: "500"
  },
  textArea: { minHeight: 100, paddingTop: 14 },
  helperText: { fontSize: 12, color: T.text3, marginTop: -4, lineHeight: 18 }
});
