import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";

export default function NewServiceType() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "", categoryId: "", description: "", icon: "hammer-wrench", basePrice: "0",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories');
        const cats = response.data?.data || response.data || [];
        setCategories(cats);
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: cats[0].id.toString() }));
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.categoryId) {
      Alert.alert("Validation Error", "Offering name and category selection are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/service-types', {
        name: formData.name.trim(),
        categoryId: parseInt(formData.categoryId),
        description: formData.description.trim(),
        icon: formData.icon.trim() || "hammer-wrench",
        basePrice: parseFloat(formData.basePrice) || 0,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Submission Failed", error.response?.data?.message || "Failed to create service type");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>New Service Offering</Text>
            <Text style={s.headerSubtitle}>Define offering type, category, and baseline rate</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Form Card */}
          <View style={s.card}>
            <View style={s.formGroup}>
              <Text style={s.label}>Offering Name</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="e.g. Standard AC Deep Chemical Wash"
                  placeholderTextColor="#94A3B8"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Assigned Parent Category</Text>
              {isLoadingCats ? (
                <View style={s.loadingInline}>
                  <ActivityIndicator size="small" color="#0F172A" />
                  <Text style={s.loadingText}>Fetching available categories…</Text>
                </View>
              ) : categories.length === 0 ? (
                <Text style={s.emptyCategoryText}>No categories found. Create a category record first.</Text>
              ) : (
                <View style={s.radioGroup}>
                  {categories.map((cat, index) => {
                    const isSelected = formData.categoryId === cat.id.toString();
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[s.radioItem, index !== categories.length - 1 && s.radioItemBorder]}
                        onPress={() => setFormData({ ...formData, categoryId: cat.id.toString() })}
                      >
                        <MaterialCommunityIcons
                          name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                          size={18}
                          color={isSelected ? "#0F172A" : "#94A3B8"}
                        />
                        <Text style={[s.radioText, isSelected && s.radioTextSelected]}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Administrative Description</Text>
              <View style={[s.inputBox, s.textAreaBox]}>
                <TextInput
                  style={s.textArea}
                  placeholder="Service scope, deliverables, and requirements..."
                  placeholderTextColor="#94A3B8"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Baseline Price (USD)</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name="currency-usd" size={18} color="#64748B" />
                <TextInput
                  style={s.input}
                  placeholder="e.g. 45.00"
                  placeholderTextColor="#94A3B8"
                  value={formData.basePrice}
                  onChangeText={(text) => setFormData({ ...formData, basePrice: text.replace(/[^0-9.]/g, '') })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[s.formGroup, { marginBottom: 0 }]}>
              <Text style={s.label}>Icon Identifier</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name={(formData.icon || "hammer-wrench") as any} size={18} color="#64748B" />
                <TextInput
                  style={s.input}
                  placeholder="e.g. hammer-wrench"
                  placeholderTextColor="#94A3B8"
                  value={formData.icon}
                  onChangeText={(text) => setFormData({ ...formData, icon: text })}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, (isSubmitting || !formData.categoryId) && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !formData.categoryId}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={s.submitBtnText}>Create Offering Record</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500", marginTop: 1 },

  content: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#E2E8F0",
  },

  formGroup: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inputBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC",
    borderRadius: 12, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: "#E2E8F0", gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "500" },

  loadingInline: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  loadingText: { fontSize: 13, color: "#64748B" },
  emptyCategoryText: { fontSize: 13, color: "#DC2626", paddingVertical: 8 },

  radioGroup: {
    backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  radioItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  radioItemBorder: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  radioText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  radioTextSelected: { color: "#0F172A", fontWeight: "700" },

  textAreaBox: { height: 100, alignItems: "flex-start", paddingVertical: 12 },
  textArea: { flex: 1, fontSize: 14, color: "#0F172A", textAlignVertical: "top" },

  footer: {
    padding: 16, backgroundColor: "#FFFFFF",
    borderTopWidth: 1, borderTopColor: "#E2E8F0",
  },
  submitBtn: {
    backgroundColor: "#0F172A", borderRadius: 12, height: 48,
    alignItems: "center", justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
