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
    if (!formData.name || !formData.slug) {
      Alert.alert("Error", "Name and slug are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/categories', {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        icon: formData.icon,
        imageUrl: formData.imageUrl,
        displayOrder: parseInt(formData.displayOrder) || 0,
        status: 'active',
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add New Category</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Form */}
          <View style={s.formGroup}>
            <Text style={s.label}>Category Name</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name="format-title" size={20} color={T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. Home Cleaning"
                placeholderTextColor={T.text3}
                value={formData.name}
                onChangeText={handleNameChange}
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>URL Slug</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name="link-variant" size={20} color={T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. home-cleaning"
                placeholderTextColor={T.text3}
                value={formData.slug}
                onChangeText={(text) => setFormData({ ...formData, slug: text })}
                autoCapitalize="none"
              />
            </View>
            <Text style={s.helperText}>Unique identifier used in URLs</Text>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Description</Text>
            <View style={[s.inputBox, s.textAreaBox]}>
              <TextInput
                style={s.textArea}
                placeholder="Brief description of this category..."
                placeholderTextColor={T.text3}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Material Design Icon</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name={formData.icon as any} size={20} color={T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. shape-outline"
                placeholderTextColor={T.text3}
                value={formData.icon}
                onChangeText={(text) => setFormData({ ...formData, icon: text })}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Category Image URL</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name="image-outline" size={20} color={T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. https://example.com/image.png"
                placeholderTextColor={T.text3}
                value={formData.imageUrl}
                onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Display Order</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name="sort" size={20} color={T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. 0"
                placeholderTextColor={T.text3}
                value={formData.displayOrder}
                onChangeText={(text) => setFormData({ ...formData, displayOrder: text.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.submitBtnText}>Create Category</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  
  content: { padding: 24, paddingBottom: 40 },
  
  formGroup: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "700", color: T.text2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  inputBox: { 
    flexDirection: "row", alignItems: "center", backgroundColor: T.surface, 
    borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: T.border, 
  },
  input: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500", marginLeft: 12 },
  
  textAreaBox: { height: 120, alignItems: "flex-start", paddingVertical: 16 },
  textArea: { flex: 1, fontSize: 16, color: T.text1, textAlignVertical: "top" },
  helperText: { fontSize: 12, color: T.text3, marginTop: 6, marginLeft: 4 },
  
  footer: { padding: 24, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border },
  submitBtn: { backgroundColor: T.accent, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
});
