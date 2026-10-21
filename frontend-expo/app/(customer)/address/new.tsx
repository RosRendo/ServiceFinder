import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

const LABELS = ["Home", "Office", "Other"];

export default function NewAddressScreen() {
  const router = useRouter();
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      Alert.alert("Missing Info", "Please enter a full address.");
      return;
    }
    const fullAddress = city.trim() ? `${trimmed}, ${city.trim()}` : trimmed;
    setSaving(true);
    try {
      await api.post("/api/addresses", {
        label,
        address: fullAddress,
        isDefault,
      });
      Alert.alert("Address Saved", "Your address has been added.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Could not save address.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Address</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Label Chips */}
          <Text style={s.sectionLabel}>Label</Text>
          <View style={s.chipRow}>
            {LABELS.map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLabel(l)}
                style={[s.chip, label === l && s.chipActive]}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={l === "Home" ? "home" : l === "Office" ? "office-building" : "map-marker"}
                  size={16}
                  color={label === l ? "#fff" : T.text2}
                  style={{ marginRight: 4 }}
                />
                <Text style={[s.chipText, label === l && s.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Address Input */}
          <Text style={s.sectionLabel}>Full Address</Text>
          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={T.text3} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 123 Norodom Blvd, Phnom Penh"
              placeholderTextColor={T.text3}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* City Input */}
          <Text style={s.sectionLabel}>City (optional)</Text>
          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="city-variant-outline" size={20} color={T.text3} style={s.inputIcon} />
            <TextInput
              style={[s.input, { height: 48 }]}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Phnom Penh"
              placeholderTextColor={T.text3}
            />
          </View>

          {/* Default Toggle */}
          <TouchableOpacity
            style={s.defaultRow}
            onPress={() => setIsDefault((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={s.defaultLeft}>
              <View style={[s.checkbox, isDefault && s.checkboxActive]}>
                {isDefault && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
              </View>
              <View>
                <Text style={s.defaultTitle}>Set as default address</Text>
                <Text style={s.defaultDesc}>This address will be pre-selected during checkout</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
                <Text style={s.saveBtnText}>Save Address</Text>
              </>
            )}
          </TouchableOpacity>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  content: { padding: 24, paddingBottom: 60 },

  sectionLabel: { fontSize: 12, fontWeight: "800", color: T.text3, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, marginTop: 20 },

  chipRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: T.border, backgroundColor: T.surface,
    ...CARD_SHADOW,
  },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { fontSize: 14, fontWeight: "700", color: T.text2 },
  chipTextActive: { color: "#fff" },

  inputWrap: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: T.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: T.border, ...CARD_SHADOW,
  },
  inputIcon: { marginTop: 2 },
  input: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "600", minHeight: 80 },

  defaultRow: {
    marginTop: 24,
    backgroundColor: T.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border, ...CARD_SHADOW,
  },
  defaultLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
    backgroundColor: T.bg,
  },
  checkboxActive: { backgroundColor: T.accent, borderColor: T.accent },
  defaultTitle: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 2 },
  defaultDesc: { fontSize: 12, color: T.text3, fontWeight: "500" },

  saveBtn: {
    marginTop: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: T.accent, borderRadius: 18, paddingVertical: 18,
    ...CARD_SHADOW,
  },
  saveBtnText: { fontSize: 17, fontWeight: "800", color: "#fff" },
});