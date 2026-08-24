/**
 * Add New Service — Premium Redesign
 */
import React, { useState, useEffect } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function AddService() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", basePrice: "", durationMin: "", description: "", serviceTypeId: "",
  });
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const res = await api.get('/api/service-types');
        let types = res.data;
        if (types && types.success) types = types.data;
        if (types && types.data) types = types.data; // Pagination wrap
        
        const typesArray = Array.isArray(types) ? types : [];
        setServiceTypes(typesArray);
        
        if (typesArray.length > 0) {
          setForm(prev => ({ ...prev, serviceTypeId: typesArray[0].id.toString() }));
        }
      } catch (error) {
        console.error("Failed to fetch service types", error);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    fetchServiceTypes();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.basePrice || !form.durationMin || !form.serviceTypeId) {
      Alert.alert("Missing Fields", "Name, Price, Duration, and Service Type are required.");
      return;
    }
    setLoading(true);
    try {
      const companyRes = await api.get("/api/companies/my-company");
      let compData = companyRes.data;
      if (compData && compData.success) compData = compData.data;
      const companyId = compData?.id;

      if (!companyId) throw new Error("Could not find company context");

      await api.post("/api/services", {
        companyId: companyId,
        serviceTypeId: form.serviceTypeId,
        name: form.name,
        description: form.description,
        basePrice: parseFloat(form.basePrice),
        durationMin: parseInt(form.durationMin, 10),
        isActive: true
      });

      Alert.alert("Success", "Service added successfully!", [
        { text: "Awesome", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Could not create service. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Add Service</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading || !form.serviceTypeId} style={[s.saveBtn, (loading || !form.serviceTypeId) && s.saveBtnDisabled]}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {/* Service Name */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Service Name *</Text>
            <View style={s.inputBox}>
              <TextInput
                value={form.name} onChangeText={(text) => setForm({ ...form, name: text })}
                placeholder="e.g., Deep House Cleaning" placeholderTextColor={T.text3} style={s.input}
              />
            </View>
          </View>

          {/* Service Type */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Category Type *</Text>
            {isLoadingTypes ? (
              <ActivityIndicator size="small" color={T.accent} style={{ alignSelf: 'flex-start' }} />
            ) : serviceTypes.length === 0 ? (
              <Text style={{ color: T.text3, fontSize: 13 }}>No categories available.</Text>
            ) : (
              <View style={s.radioContainer}>
                {serviceTypes.map((type, i) => {
                  const isSelected = form.serviceTypeId === type.id.toString();
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[s.radioRow, i !== serviceTypes.length - 1 && s.borderBottom]}
                      onPress={() => setForm({ ...form, serviceTypeId: type.id.toString() })}
                    >
                      <MaterialCommunityIcons 
                        name={isSelected ? "radiobox-marked" : "radiobox-blank"} 
                        size={22} color={isSelected ? T.accentMid : T.text3} 
                      />
                      <Text style={s.radioText}>{type.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Price & Duration */}
          <View style={s.rowGroup}>
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>Price ($) *</Text>
              <View style={s.inputBox}>
                <TextInput
                  value={form.basePrice} onChangeText={(text) => setForm({ ...form, basePrice: text })}
                  placeholder="0.00" placeholderTextColor={T.text3} style={s.input} keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>Duration (mins) *</Text>
              <View style={s.inputBox}>
                <TextInput
                  value={form.durationMin} onChangeText={(text) => setForm({ ...form, durationMin: text })}
                  placeholder="120" placeholderTextColor={T.text3} style={s.input} keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Description</Text>
            <View style={[s.inputBox, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                value={form.description} onChangeText={(text) => setForm({ ...form, description: text })}
                placeholder="Describe what is included..." placeholderTextColor={T.text3} 
                style={[s.input, { height: '100%', textAlignVertical: 'top' }]} multiline
              />
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
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  saveBtn: { backgroundColor: T.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnDisabled: { backgroundColor: T.text3 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  scrollContent: { padding: 24, gap: 24, paddingBottom: 60 },
  
  inputGroup: { gap: 8 },
  rowGroup: { flexDirection: "row", gap: 16 },
  label: { fontSize: 13, fontWeight: "700", color: T.text2, marginLeft: 2 },
  
  inputBox: { 
    backgroundColor: T.surface, borderRadius: 14, 
  },
  input: { fontSize: 15, color: T.text1, fontWeight: "500" },

  radioContainer: {
    backgroundColor: T.surface, borderRadius: 14, 
  },
  radioRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: T.border },
  radioText: { fontSize: 15, color: T.text1, fontWeight: "500" },
});
