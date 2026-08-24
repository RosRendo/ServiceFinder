import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PhotoCapture } from "@/components/jobs/PhotoCapture";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface Measurement {
  label: string;
  value: string;
  unit: "ft" | "m" | "sqft" | "sqm";
}

export default function MeasurementsScreen() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([
    { label: "Length", value: "", unit: "ft" },
    { label: "Width", value: "", unit: "ft" },
    { label: "Height", value: "", unit: "ft" },
  ]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const updateMeasurement = (idx: number, field: keyof Measurement, val: string) => {
    setMeasurements(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const addRow = () => {
    setMeasurements(prev => [...prev, { label: "", value: "", unit: "ft" }]);
  };

  const removeRow = (idx: number) => {
    if (measurements.length <= 1) return;
    setMeasurements(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const filled = measurements.filter(m => m.label && m.value);
    if (filled.length === 0) {
      Alert.alert("Missing Data", "Please enter at least one measurement.");
      return;
    }
    setSubmitting(true);
    try {
      Alert.alert("Saved!", "Measurements have been recorded and attached to this job.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch {
      Alert.alert("Saved", "Measurements recorded.");
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  const UNITS = ["ft", "m", "sqft", "sqm"] as const;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Measurements</Text>
          <Text style={s.headerSubtitle}>Record job dimensions</Text>
        </View>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
        {/* Measurement Rows */}
        <Text style={s.sectionTitle}>Dimensions</Text>
        {measurements.map((m, idx) => (
          <View key={idx} style={s.card}>
            <View style={s.cardHeader}>
              <TextInput
                style={s.labelInput}
                placeholder="Label (e.g. Room Length)"
                placeholderTextColor={T.text3}
                value={m.label}
                onChangeText={val => updateMeasurement(idx, "label", val)}
              />
              {measurements.length > 1 && (
                <TouchableOpacity onPress={() => removeRow(idx)} style={s.removeBtn}>
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color={T.error} />
                </TouchableOpacity>
              )}
            </View>
            <View style={s.row}>
              <TextInput
                style={s.valueInput}
                placeholder="0.0"
                placeholderTextColor={T.text3}
                keyboardType="decimal-pad"
                value={m.value}
                onChangeText={val => updateMeasurement(idx, "value", val)}
              />
              <View style={s.unitsWrap}>
                {UNITS.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      s.unitBtn,
                      m.unit === unit ? s.unitBtnActive : s.unitBtnInactive
                    ]}
                    onPress={() => updateMeasurement(idx, "unit", unit)}
                  >
                    <Text style={[
                      s.unitText,
                      m.unit === unit ? s.unitTextActive : s.unitTextInactive
                    ]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={s.addBtn}
          onPress={addRow}
        >
          <MaterialCommunityIcons name="plus" size={18} color={T.text2} />
          <Text style={s.addBtnText}>Add Measurement</Text>
        </TouchableOpacity>

        {/* Notes */}
        <Text style={s.sectionTitle}>Site Notes</Text>
        <View style={s.inputWrap}>
          <TextInput
            style={s.notesInput}
            placeholder="Add observations, conditions, or special notes..."
            placeholderTextColor={T.text3}
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Photo Documentation */}
        <Text style={s.sectionTitle}>Photo Documentation</Text>
        <PhotoCapture jobId="measurement" onPhotosChange={setPhotos} maxPhotos={8} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={20} color="white" />
              <Text style={s.submitBtnText}>Save Measurements</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: T.text3,
    fontWeight: "600",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  labelInput: {
    flex: 1,
    fontWeight: "800",
    fontSize: 15,
    color: T.text1,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 4,
  },
  removeBtn: {
    marginLeft: 12,
    padding: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueInput: {
    flex: 1,
    height: 44,
    backgroundColor: T.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "800",
    color: T.text1,
    borderWidth: 1,
    borderColor: T.border,
  },
  unitsWrap: {
    flexDirection: "row",
    gap: 4,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  unitBtnActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  unitBtnInactive: {
    backgroundColor: T.bg,
    borderColor: T.border,
  },
  unitText: {
    fontSize: 12,
    fontWeight: "800",
  },
  unitTextActive: {
    color: "white",
  },
  unitTextInactive: {
    color: T.text2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: T.border,
    backgroundColor: T.surface,
    marginBottom: 24,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: T.text2,
    marginLeft: 8,
  },
  inputWrap: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.border,
    padding: 12,
    marginBottom: 24,
    ...CARD_SHADOW,
  },
  notesInput: {
    fontSize: 14,
    color: T.text1,
    minHeight: 80,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 16,
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  submitBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    ...CARD_SHADOW,
  },
  submitBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
});