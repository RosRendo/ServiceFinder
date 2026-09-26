import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

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
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add New Category</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Form */}
          <View style={s.formGroup}>
            <Text style={s.label}>Category Name</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                placeholder="e.g. Electrical Services"
                placeholderTextColor={T.mgmtTextSecondary || T.text3}
                value={formData.name}
                onChangeText={handleNameChange}
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>URL Slug</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                placeholder="e.g. electrical-services"
                placeholderTextColor={T.mgmtTextSecondary || T.text3}
                value={formData.slug}
                onChangeText={(text) => setFormData({ ...formData, slug: text })}
                autoCapitalize="none"
              />
            </View>
            <Text style={s.helperText}>Unique identifier used in routes and search filters</Text>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Description</Text>
            <View style={[s.inputBox, s.textAreaBox]}>
              <TextInput
                style={s.textArea}
                placeholder="Brief administrative description of this service tier..."
                placeholderTextColor={T.mgmtTextSecondary || T.text3}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Material Design Icon</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name={formData.icon as any} size={16} color={T.mgmtTextSecondary || T.text3} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                placeholder="e.g. flash-outline"
                placeholderTextColor={T.mgmtTextSecondary || T.text3}
                value={formData.icon}
                onChangeText={(text) => setFormData({ ...formData, icon: text })}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Category Image URL</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                placeholder="e.g. https://cdn.example.com/icons/electrical.png"
                placeholderTextColor={T.mgmtTextSecondary || T.text3}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Display Sort Order</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                placeholder="e.g. 0"
                placeholderTextColor={T.mgmtTextSecondary || T.text3}
                value={formData.displayOrder}
                onChangeText={(text) => setFormData({ ...formData, displayOrder: text.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
              />
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
            <ActivityIndicator size="small" color={T.bg} />
          ) : (
            <Text style={s.submitBtnText}>Create Category</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.mgmtBg || T.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.mgmtSurface || T.surface,
    borderBottomWidth: 1, borderBottomColor: T.mgmtBorder || T.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: T.text1 },
  
  content: { padding: 16, paddingBottom: 32 },
  
  formGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: "600", color: T.mgmtTextSecondary || T.text2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  inputBox: { 
    flexDirection: "row", alignItems: "center", backgroundColor: T.mgmtSurface || T.surface, 
    borderRadius: 8, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: T.mgmtBorder || T.border, 
  },
  input: { flex: 1, fontSize: 13, color: T.text1, fontWeight: "500" },
  
  textAreaBox: { height: 88, alignItems: "flex-start", paddingVertical: 10 },
  textArea: { flex: 1, fontSize: 13, color: T.text1, textAlignVertical: "top" },
  helperText: { fontSize: 11, color: T.mgmtTextSecondary || T.text3, marginTop: 4 },
  
  footer: { padding: 16, backgroundColor: T.mgmtSurface || T.surface, borderTopWidth: 1, borderTopColor: T.mgmtBorder || T.border },
  submitBtn: { backgroundColor: T.text1, borderRadius: 8, height: 44, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 13, fontWeight: "600", color: T.bg },
});
