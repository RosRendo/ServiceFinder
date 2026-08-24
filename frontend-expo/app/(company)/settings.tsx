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
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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

  // Operations
  const [bookingMode, setBookingMode] = useState<"dispatch" | "open_pool">("dispatch");
  const [savingMode, setSavingMode] = useState(false);

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
        setBookingMode((data.bookingMode as any) || "dispatch");
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

  const handleSaveBookingMode = async (mode: "dispatch" | "open_pool") => {
    if (!companyId || savingMode) return;
    setSavingMode(true);
    const previous = bookingMode;
    setBookingMode(mode);
    try {
      await api.put(`/api/companies/${companyId}`, { bookingMode: mode });
      Alert.alert("Saved", `Booking mode set to ${mode === "dispatch" ? "Dispatch" : "Open Pool"}`);
    } catch {
      setBookingMode(previous); // Revert on error
      Alert.alert("Error", "Could not save booking mode.");
    } finally {
      setSavingMode(false);
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

              {/* Operations Section */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <MaterialCommunityIcons name="cog-outline" size={20} color={T.accentMid} />
                  <Text style={s.sectionTitle}>Operations</Text>
                </View>
                <Text style={s.modeLabel}>Booking Assignment Mode</Text>

                {/* Dispatch Mode Card */}
                <TouchableOpacity
                  style={[s.modeCard, bookingMode === "dispatch" && s.modeCardActive]}
                  onPress={() => handleSaveBookingMode("dispatch")}
                  disabled={savingMode}
                  activeOpacity={0.7}
                >
                  <View style={s.modeCardInner}>
                    <View style={[s.modeIconWrap, bookingMode === "dispatch" && s.modeIconWrapActive]}>
                      <MaterialCommunityIcons name="account-arrow-right" size={22} color={bookingMode === "dispatch" ? T.accent : T.text3} />
                    </View>
                    <View style={s.modeCardText}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={[s.modeTitle, bookingMode === "dispatch" && { color: T.accent }]}>Dispatch Mode</Text>
                        {bookingMode === "dispatch" && (
                          <View style={s.activeBadge}><Text style={s.activeBadgeText}>ACTIVE</Text></View>
                        )}
                      </View>
                      <Text style={s.modeDesc}>You manually assign each job to a specific staff member. Full control over every booking.</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Open Pool Mode Card */}
                <TouchableOpacity
                  style={[s.modeCard, bookingMode === "open_pool" && s.modeCardActive, { marginTop: 10 }]}
                  onPress={() => handleSaveBookingMode("open_pool")}
                  disabled={savingMode}
                  activeOpacity={0.7}
                >
                  <View style={s.modeCardInner}>
                    <View style={[s.modeIconWrap, bookingMode === "open_pool" && s.modeIconWrapActive]}>
                      <MaterialCommunityIcons name="account-group-outline" size={22} color={bookingMode === "open_pool" ? T.accent : T.text3} />
                    </View>
                    <View style={s.modeCardText}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={[s.modeTitle, bookingMode === "open_pool" && { color: T.accent }]}>Open Pool Mode</Text>
                        {bookingMode === "open_pool" && (
                          <View style={s.activeBadge}><Text style={s.activeBadgeText}>ACTIVE</Text></View>
                        )}
                      </View>
                      <Text style={s.modeDesc}>New bookings go into a shared pool. Staff claim and accept jobs directly from the app.</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {savingMode && <Text style={{ fontSize: 12, color: T.text3, marginTop: 8 }}>Saving mode...</Text>}
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
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

  section: { backgroundColor: T.surface, padding: 20, borderRadius: 16, gap: 12,
    ...CARD_SHADOW, borderWidth: 1, borderColor: T.border },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: T.text1 },

  inputContainer: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: T.text2 },
  input: {
    backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: T.text1, fontWeight: "500"
  },
  textArea: { minHeight: 100, paddingTop: 14 },
  helperText: { fontSize: 12, color: T.text3, marginTop: -4, lineHeight: 18 },

  // Booking Mode styles
  modeLabel: { fontSize: 13, fontWeight: "700", color: T.text2, marginBottom: 4 },
  modeCard: {
    borderWidth: 2, borderColor: T.border, borderRadius: 12,
    padding: 14, backgroundColor: T.bg,
  },
  modeCardActive: { borderColor: T.accent, backgroundColor: T.accent + "08" },
  modeCardInner: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modeIconWrap: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: T.border,
    alignItems: "center", justifyContent: "center",
  },
  modeIconWrapActive: { backgroundColor: T.accent + "20" },
  modeCardText: { flex: 1 },
  modeTitle: { fontSize: 14, fontWeight: "700", color: T.text1 },
  modeDesc: { fontSize: 12, color: T.text2, marginTop: 4, lineHeight: 18 },
  activeBadge: { backgroundColor: T.accent + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadgeText: { fontSize: 10, fontWeight: "700", color: T.accent },
});
