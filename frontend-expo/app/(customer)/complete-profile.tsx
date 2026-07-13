import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore, api } from "@/store/authStore";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  error: "#E31C5F", errorBg: "#FEF2F2",
};

export default function CompleteProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    Keyboard.dismiss();
    const cleanName = fullName.trim();
    if (!cleanName) {
      return setError("Please enter your full name");
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await api.patch(`/api/users/${user?.id}`, {
        fullName: cleanName,
        email: email.trim() || undefined,
      });

      // Update local state
      const updatedUser = res.data?.user || res.data?.data?.user || res.data;
      useAuthStore.setState({ user: { ...user, ...updatedUser } });
      
      // Navigate to Home
      router.replace("/(customer)/(tabs)/home");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Complete Your Profile</Text>
          <Text style={s.subtitle}>
            Welcome to the app! Please enter your details so we know what to call you.
          </Text>
        </View>

        {!!error && (
          <View style={s.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={T.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <View style={s.fieldGroup}>
          <Text style={s.inputLabel}>FULL NAME</Text>
          <View style={s.inputWrapper}>
            <MaterialCommunityIcons name="account-outline" size={22} color={T.text3} />
            <TextInput
              style={s.input}
              placeholder="John Doe"
              placeholderTextColor={T.text3}
              value={fullName}
              onChangeText={(t) => { setFullName(t); setError(""); }}
              autoFocus
            />
          </View>
        </View>

        <View style={s.fieldGroup}>
          <Text style={s.inputLabel}>EMAIL (OPTIONAL)</Text>
          <View style={s.inputWrapper}>
            <MaterialCommunityIcons name="email-outline" size={22} color={T.text3} />
            <TextInput
              style={s.input}
              placeholder="name@example.com"
              placeholderTextColor={T.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              onSubmitEditing={handleSave}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[s.btnPrimary, isLoading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnPrimaryText}>Save & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center", paddingBottom: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "800", color: T.text1, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, color: T.text2, fontWeight: "500", lineHeight: 22 },

  errorBox: { backgroundColor: T.errorBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  errorText: { color: T.error, fontWeight: "600", fontSize: 13, flex: 1 },

  fieldGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: T.text2, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: T.border, gap: 12 },
  input: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500" },

  btnPrimary: { width: "100%", backgroundColor: T.accent, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
});
