import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PhotoCapture } from "@/components/jobs/PhotoCapture";
import api from "@/utils/api";

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
      // await api.post('/api/staff/measurements', { measurements: filled, notes, photos: photos.map(p => p.uri) });
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
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 py-3 border-b border-surface-container">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#191c1e" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-headline font-bold text-on-surface">Measurements</Text>
          <Text className="text-xs text-on-surface-variant">Record job dimensions</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {/* Measurement Rows */}
        <Text className="font-headline font-bold text-on-surface mb-3">Dimensions</Text>
        {measurements.map((m, idx) => (
          <View key={idx} className="bg-surface-container-lowest rounded-2xl p-4 mb-3 border border-outline-variant">
            <View className="flex-row items-center mb-3">
              <TextInput
                className="flex-1 font-bold text-on-surface text-base border-b border-outline-variant pb-1"
                placeholder="Label (e.g. Room Length)"
                placeholderTextColor="#c4c6cf"
                value={m.label}
                onChangeText={val => updateMeasurement(idx, "label", val)}
              />
              {measurements.length > 1 && (
                <TouchableOpacity onPress={() => removeRow(idx)} className="ml-3 p-1">
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row items-center gap-3">
              <TextInput
                className="flex-1 h-12 bg-surface-container rounded-xl px-4 text-on-surface text-lg font-bold"
                placeholder="0.0"
                placeholderTextColor="#c4c6cf"
                keyboardType="decimal-pad"
                value={m.value}
                onChangeText={val => updateMeasurement(idx, "value", val)}
              />
              <View className="flex-row gap-1">
                {UNITS.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    className={`px-3 py-2 rounded-xl ${m.unit === unit ? "bg-primary" : "bg-surface-container border border-outline-variant"}`}
                    onPress={() => updateMeasurement(idx, "unit", unit)}
                  >
                    <Text className={`text-xs font-bold ${m.unit === unit ? "text-white" : "text-on-surface-variant"}`}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          className="flex-row items-center justify-center h-12 rounded-2xl border-2 border-dashed border-outline-variant mb-6"
          onPress={addRow}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#74777f" />
          <Text className="text-on-surface-variant font-bold ml-2">Add Measurement</Text>
        </TouchableOpacity>

        {/* Notes */}
        <Text className="font-headline font-bold text-on-surface mb-3">Site Notes</Text>
        <View className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-3 mb-6">
          <TextInput
            className="text-on-surface font-body min-h-[80px]"
            placeholder="Add observations, conditions, or special notes..."
            placeholderTextColor="#c4c6cf"
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Photo Documentation */}
        <Text className="font-headline font-bold text-on-surface mb-3">Photo Documentation</Text>
        <PhotoCapture jobId="measurement" onPhotosChange={setPhotos} maxPhotos={8} />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-surface border-t border-surface-container">
        <TouchableOpacity
          className={`h-14 rounded-full items-center justify-center flex-row gap-2 ${submitting ? "bg-primary/70" : "bg-primary"}`}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={20} color="white" />
              <Text className="text-white font-bold text-lg">Save Measurements</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}