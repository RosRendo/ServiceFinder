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

const HERO_CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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
    user?.fullName || "User"
  )}&backgroundColor=0A192F&textColor=ffffff`;

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
      Alert.alert("Success", "Profile updated successfully.");
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
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.accent} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
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
                <MaterialCommunityIcons name="camera-plus-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

        {/* Email Address */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Email Address</Text>
          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="email-outline" size={20} color={T.text2} />
            <TextInput
              style={s.input}
              placeholder="name@example.com"
              placeholderTextColor={T.text3}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Full Name */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Full Name</Text>
          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="account-outline" size={20} color={T.text2} />
            <TextInput
              style={s.input}
              placeholder="John Doe"
              placeholderTextColor={T.text3}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Phone Number */}
        <View style={[s.fieldGroup, { marginBottom: 40 }]}>
          <Text style={s.fieldLabel}>Phone Number</Text>
          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={T.text2} />
            <TextInput
              style={s.input}
              placeholder="+1 234 567 8900"
              placeholderTextColor={T.text3}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting}
          style={[s.saveBtn, isSubmitting && s.saveBtnDisabled]}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.saveBtnText}>Save Changes</Text>
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
                  <MaterialCommunityIcons name="close" size={24} color={T.text2} />
                </TouchableOpacity>
              </View>

              <View style={[s.infoBox, { backgroundColor: T.successBg, marginTop: 16, marginBottom: 24 }]}>
                <Text style={[s.infoText, { color: T.successText }]}>
                  {pendingContact?.type === "email" 
                    ? `We've sent a 6-digit verification code to ${pendingContact?.value}.`
                    : `We've sent a 6-digit OTP to ${pendingContact?.value}.`}
                </Text>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>
                  {pendingContact?.type === "email" ? "Verification Code" : "OTP"}
                </Text>
                <View style={s.inputWrap}>
                  <MaterialCommunityIcons name="key-variant" size={20} color={T.text2} />
                  <TextInput
                    style={s.input}
                    placeholder={pendingContact?.type === "email" ? "Enter 6-digit code" : "Enter 6-digit OTP"}
                    placeholderTextColor={T.text3}
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
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.saveBtnText}>Verify and Save</Text>
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
  root: { flex: 1, backgroundColor: T.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },

  avatarContainer: { alignItems: "center", marginBottom: 32 },
  avatarWrapper: { position: "relative" },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: T.border },
  avatarEditBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: T.accent,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: T.surface,
    zIndex: 10,
  },

  fieldGroup: { marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: T.text2, marginBottom: 8 },
  
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: T.inputBg, borderWidth: 1, borderColor: T.border,
    borderRadius: 14, paddingHorizontal: 16, height: 56,
  },
  inputWrapDisabled: { backgroundColor: T.inputBgDisabled, borderColor: T.inputBgDisabled },
  
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: T.text1, height: "100%" },
  inputTextDisabled: { marginLeft: 12, fontSize: 16, color: T.text2 },

  saveBtn: {
    backgroundColor: T.accent, borderRadius: 16, height: 56,
    alignItems: "center", justifyContent: "center", ...CARD_SHADOW,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { width: "100%", backgroundColor: T.surface, borderRadius: 24, padding: 24, ...CARD_SHADOW },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.text1 },
  modalCloseBtn: { padding: 4 },
  
  infoBox: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" },
  infoText: { fontSize: 13, fontWeight: "600", lineHeight: 20 },
});
