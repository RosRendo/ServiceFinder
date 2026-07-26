import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, Platform, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import ConfettiCannon from "react-native-confetti-cannon";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function JobCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = params.id || "JOB-10492";

  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [customerSigned, setCustomerSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const confettiRef = useRef<ConfettiCannon>(null);

  const pickImage = async (type: 'before' | 'after') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (type === 'before') setBeforeImage(result.assets[0].uri);
      else setAfterImage(result.assets[0].uri);
    }
  };

  const isFormValid = beforeImage && afterImage && customerSigned;

  const handleSubmit = () => {
    if (!isFormValid) return;
    setSubmitting(true);
    
    // Simulate API Call for S3 Uploads and DB Status Change
    setTimeout(() => {
      setSubmitting(false);
      setShowConfetti(true);
      if (confettiRef.current) {
        confettiRef.current.start();
      }
      
      // Auto redirect after confetti
      setTimeout(() => {
        router.back();
      }, 3500);
    }, 1500);
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Proof of Work</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.infoBanner}>
          <MaterialCommunityIcons name="information" size={20} color={T.blue} />
          <Text style={s.infoText}>Upload 2 photos and secure customer sign-off to close {jobId}.</Text>
        </View>

        {/* Photo Section */}
        <Text style={s.sectionTitle}>Required Photos</Text>
        
        <View style={s.photoRow}>
          {/* Before Photo */}
          <TouchableOpacity 
            style={[s.photoSlot, beforeImage && s.photoSlotActive]} 
            onPress={() => pickImage('before')}
            activeOpacity={0.8}
          >
            {beforeImage ? (
              <>
                <Image source={{ uri: beforeImage }} style={s.photoImg} />
                <View style={s.photoOverlay}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
                  <Text style={s.photoOverlayText}>Before</Text>
                </View>
              </>
            ) : (
              <>
                <View style={s.iconCircle}>
                  <MaterialCommunityIcons name="camera-plus" size={28} color={T.accent} />
                </View>
                <Text style={s.photoLabel}>Add "Before"</Text>
              </>
            )}
          </TouchableOpacity>

          {/* After Photo */}
          <TouchableOpacity 
            style={[s.photoSlot, afterImage && s.photoSlotActive]} 
            onPress={() => pickImage('after')}
            activeOpacity={0.8}
          >
            {afterImage ? (
              <>
                <Image source={{ uri: afterImage }} style={s.photoImg} />
                <View style={s.photoOverlay}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
                  <Text style={s.photoOverlayText}>After</Text>
                </View>
              </>
            ) : (
              <>
                <View style={s.iconCircle}>
                  <MaterialCommunityIcons name="camera-plus" size={28} color={T.accent} />
                </View>
                <Text style={s.photoLabel}>Add "After"</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Notes Section */}
        <Text style={s.sectionTitle}>Job Notes (Optional)</Text>
        <View style={s.notesContainer}>
          <TextInput
            style={s.notesInput}
            placeholder="Add any context for the company admin..."
            placeholderTextColor={T.text3}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Customer Sign-off (Digital Mock) */}
        <Text style={s.sectionTitle}>Customer Sign-off</Text>
        <View style={[s.signOffContainer, customerSigned && s.signOffContainerActive]}>
          <View style={s.signOffRow}>
            <View style={s.signOffTextWrap}>
              <Text style={s.signOffTitle}>Hand device to Customer</Text>
              <Text style={s.signOffSub}>Customer confirms work is completed satisfactorily.</Text>
            </View>
            <TouchableOpacity 
              style={[s.toggleBtn, customerSigned && s.toggleBtnActive]}
              onPress={() => setCustomerSigned(!customerSigned)}
            >
              <MaterialCommunityIcons 
                name={customerSigned ? "check" : "draw"} 
                size={22} 
                color={customerSigned ? "#FFF" : T.accent} 
              />
              <Text style={[s.toggleText, customerSigned && s.toggleTextActive]}>
                {customerSigned ? "Signed" : "Sign"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.submitBtn, !isFormValid && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={s.submitBtnText}>Submit Completion</Text>
              <MaterialCommunityIcons name="check-decagram" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Confetti Animation */}
      {showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: -10, y: 0 }}
            autoStart={true}
            fadeOut={true}
            colors={[T.accent, T.success, T.warning, T.blue]}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  
  content: { padding: 20, paddingBottom: 100 },
  
  infoBanner: {
    flexDirection: "row", backgroundColor: T.blue + "15", padding: 16,
    borderRadius: 12, alignItems: "center", gap: 12, marginBottom: 24
  },
  infoText: { flex: 1, fontSize: 13, color: T.blue, fontWeight: "600", lineHeight: 20 },

  sectionTitle: { fontSize: 15, fontWeight: "800", color: T.text1, textTransform: "uppercase", marginBottom: 12 },
  
  photoRow: { flexDirection: "row", gap: 16, marginBottom: 28 },
  photoSlot: {
    flex: 1, aspectRatio: 3/4, backgroundColor: T.surface, borderRadius: 16,
    borderWidth: 2, borderColor: T.border, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", ...CARD_SHADOW
  },
  photoSlotActive: { borderStyle: "solid", borderColor: T.accent, overflow: "hidden" },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: T.accent + "15",
    alignItems: "center", justifyContent: "center", marginBottom: 12
  },
  photoLabel: { fontSize: 14, fontWeight: "700", color: T.text2 },
  photoImg: { width: "100%", height: "100%", resizeMode: "cover" },
  photoOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)", padding: 12,
    flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center"
  },
  photoOverlayText: { color: "#FFF", fontWeight: "700", fontSize: 13 },

  notesContainer: {
    backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border,
    padding: 16, marginBottom: 28, minHeight: 120, ...CARD_SHADOW
  },
  notesInput: { fontSize: 15, color: T.text1, minHeight: 80 },

  signOffContainer: {
    backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border,
    padding: 16, ...CARD_SHADOW
  },
  signOffContainerActive: { borderColor: T.success, backgroundColor: T.success + "05" },
  signOffRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  signOffTextWrap: { flex: 1, paddingRight: 16 },
  signOffTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 4 },
  signOffSub: { fontSize: 13, color: T.text3, lineHeight: 18 },
  
  toggleBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: T.accent + "15",
  },
  toggleBtnActive: { backgroundColor: T.success },
  toggleText: { fontSize: 14, fontWeight: "700", color: T.accent },
  toggleTextActive: { color: "#FFF" },

  footer: {
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border
  },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: T.accent, paddingVertical: 16, borderRadius: 16, ...CARD_SHADOW
  },
  submitBtnDisabled: { backgroundColor: T.border, shadowOpacity: 0 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
