import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useAuthStore, api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUri, setAvatarUri] = useState(user?.avatar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingContact, setPendingContact] = useState<{type: 'email' | 'phone', value: string} | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    user?.fullName || "Admin"
  )}&backgroundColor=0F172A&textColor=ffffff`;

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick image");
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    const emailChanged = email.trim() !== (user?.email || "");
    const phoneChanged = phone.trim() !== (user?.phone || "");

    if (emailChanged && phoneChanged) {
      Alert.alert("Notice", "Please update your email and phone number one at a time so we can verify them properly.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload new avatar if changed and it's a local file
      let finalAvatarUrl = user?.avatar;
      if (avatarUri && avatarUri !== user?.avatar && !avatarUri.startsWith("http")) {
        const formData = new FormData();
        const filename = avatarUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
          uri: avatarUri,
          name: filename,
          type,
        } as any);

        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        finalAvatarUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
      }

      // 2. Update basic info (name, avatar) without contact info to avoid bypass
      const updatePayload: any = {
        fullName: fullName.trim(),
        avatar: finalAvatarUrl,
      };

      const res = await api.put(`/api/users/${user?.id}`, updatePayload);
      const updatedUser = res.data?.data ?? res.data;

      if (user) {
        setUser({
          ...user,
          fullName: updatedUser.fullName,
          name: updatedUser.fullName,
          avatar: updatedUser.avatar,
        });
      }

      // 3. Handle contact verification if changed
      if (emailChanged || phoneChanged) {
        const contactType = emailChanged ? 'email' : 'phone';
        const contactValue = emailChanged ? email.trim() : phone.trim();
        
        await api.post('/api/users/request-contact-update', {
          type: contactType,
          value: contactValue
        });

        setPendingContact({ type: contactType, value: contactValue });
        setShowOtpModal(true);
        setIsSubmitting(false);
        return; // wait for modal
      }

      Alert.alert("Success", "Profile updated successfully.");
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Could not update profile. Please try again.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit code.");
      return;
    }

    if (!pendingContact) return;

    setIsVerifying(true);
    try {
      const res = await api.post('/api/users/verify-contact-update', {
        type: pendingContact.type,
        value: pendingContact.value,
        code: otpCode
      });

      const updatedUser = res.data?.user;

      if (user && updatedUser) {
        setUser({
          ...user,
          email: updatedUser.email,
          phone: updatedUser.phone,
        });
      }

      setShowOtpModal(false);
      setPendingContact(null);
      setOtpCode("");
      Alert.alert("Success", "Profile verified and updated successfully.");
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Invalid or expired code.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Administrator Dossier</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Avatar Section */}
          <View style={s.avatarContainer}>
            <View style={s.avatarWrapper}>
              <Image 
                source={{ uri: avatarUri || defaultAvatar }} 
                style={s.avatarImage} 
              />
              <TouchableOpacity 
                style={s.avatarEditBtn} 
                onPress={handlePickImage} 
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={s.avatarHint}>Corporate Administrator Profile</Text>
          </View>

          {/* Form Card */}
          <View style={s.card}>
            {/* Full Name */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Full Legal Name</Text>
              <View style={s.inputWrap}>
                <MaterialCommunityIcons name="account-outline" size={18} color="#64748B" />
                <TextInput
                  style={s.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Official Email Address</Text>
              <View style={s.inputWrap}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#64748B" />
                <TextInput
                  style={s.input}
                  placeholder="name@company.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={[s.fieldGroup, { marginBottom: 8 }]}>
              <Text style={s.fieldLabel}>Direct Contact Phone</Text>
              <View style={s.inputWrap}>
                <MaterialCommunityIcons name="phone-outline" size={18} color="#64748B" />
                <TextInput
                  style={s.input}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            style={[s.saveBtn, isSubmitting && s.saveBtnDisabled]}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.saveBtnText}>Save Profile Updates</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Verification Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: '100%', alignItems: 'center' }}>
            <View style={s.modalContent}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Verification Required</Text>
                <TouchableOpacity onPress={() => setShowOtpModal(false)} style={s.modalCloseBtn}>
                  <MaterialCommunityIcons name="close" size={22} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={s.infoBox}>
                <Text style={s.infoText}>
                  {pendingContact?.type === "email" 
                    ? `We've sent a 6-digit verification code to ${pendingContact?.value}.`
                    : `We've sent a 6-digit OTP to ${pendingContact?.value}.`}
                </Text>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>
                  {pendingContact?.type === "email" ? "Verification Code" : "OTP Code"}
                </Text>
                <View style={s.inputWrap}>
                  <MaterialCommunityIcons name="key-variant" size={18} color="#64748B" />
                  <TextInput
                    style={s.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#94A3B8"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={isVerifying || otpCode.length !== 6}
                style={[s.saveBtn, { width: '100%', marginTop: 8 }, (isVerifying || otpCode.length !== 6) && s.saveBtnDisabled]}
                activeOpacity={0.85}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.saveBtnText}>Verify and Commit</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },

  avatarContainer: { alignItems: "center", marginVertical: 20 },
  avatarWrapper: { position: "relative" },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: "#E2E8F0" },
  avatarEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarHint: { fontSize: 12, color: "#64748B", marginTop: 8, fontWeight: "500" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 16,
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: "#0F172A", height: "100%" },

  saveBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  modalCloseBtn: { padding: 4 },
  
  infoBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  infoText: { fontSize: 13, color: "#475569", lineHeight: 18, fontWeight: "500" },
});
