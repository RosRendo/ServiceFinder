import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";

export default function NewCategory() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", slug: "", description: "", icon: "shape-outline", imageUrl: "", displayOrder: "0",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (text: string) => {
    setFormData({ ...formData, name: text, slug: generateSlug(text) });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      Alert.alert("Validation Error", "Category name and URL slug are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/categories', {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        icon: formData.icon.trim() || "shape-outline",
        imageUrl: formData.imageUrl.trim(),
        displayOrder: parseInt(formData.displayOrder) || 0,
        status: 'active',
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Submission Failed", error.response?.data?.message || "Failed to create category");
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
            <Text style={s.headerTitle}>New Service Category</Text>
            <Text style={s.headerSubtitle}>Define taxonomy, slug, and display rules</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Form Card */}
          <View style={s.card}>
            <View style={s.formGroup}>
              <Text style={s.label}>Category Name</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="e.g. Electrical Services"
                  placeholderTextColor="#94A3B8"
                  value={formData.name}
                  onChangeText={handleNameChange}
                />
              </View>
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>URL Slug Identifier</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="e.g. electrical-services"
                  placeholderTextColor="#94A3B8"
                  value={formData.slug}
                  onChangeText={(text) => setFormData({ ...formData, slug: text })}
                  autoCapitalize="none"
                />
              </View>
              <Text style={s.helperText}>Unique permalink used across API routes and search filters</Text>
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Administrative Description</Text>
              <View style={[s.inputBox, s.textAreaBox]}>
                <TextInput
                  style={s.textArea}
                  placeholder="Brief operational overview of this marketplace category..."
                  placeholderTextColor="#94A3B8"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Material Community Icon</Text>
              <View style={s.inputBox}>
                <MaterialCommunityIcons name={formData.icon as any} size={18} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={s.input}
                  placeholder="e.g. flash-outline"
                  placeholderTextColor="#94A3B8"
                  value={formData.icon}
                  onChangeText={(text) => setFormData({ ...formData, icon: text })}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={s.formGroup}>
              <Text style={s.label}>Category Badge CDN URL</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="e.g. https://cdn.servicefinder.com/icons/electrical.png"
                  placeholderTextColor="#94A3B8"
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            <View style={[s.formGroup, { marginBottom: 0 }]}>
              <Text style={s.label}>Display Sort Order</Text>
              <View style={s.inputBox}>
                <TextInput
                  style={s.input}
                  placeholder="e.g. 0"
                  placeholderTextColor="#94A3B8"
                  value={formData.displayOrder}
                  onChangeText={(text) => setFormData({ ...formData, displayOrder: text.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Action */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={s.submitBtnText}>Create Category Record</Text>
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
    borderRadius: 12, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: "#E2E8F0",
  },
  input: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "500" },

  textAreaBox: { height: 96, alignItems: "flex-start", paddingVertical: 12 },
  textArea: { flex: 1, fontSize: 14, color: "#0F172A", textAlignVertical: "top" },
  helperText: { fontSize: 11, color: "#64748B", marginTop: 6 },

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
