import React, { useState, useEffect } from "react";
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
        const cats = response.data.data || response.data || [];
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
    if (!formData.name || !formData.categoryId) {
      Alert.alert("Error", "Name and Category are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/service-types', {
        name: formData.name,
        categoryId: parseInt(formData.categoryId),
        description: formData.description,
        icon: formData.icon,
        basePrice: parseFloat(formData.basePrice) || 0,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to create service type");
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
        <Text style={s.headerTitle}>Add New Service Type</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Form */}
          <View style={s.formGroup}>
            <Text style={s.label}>Service Type Name</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name="format-title" size={20} color={T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. Deep Cleaning"
                placeholderTextColor={T.text3}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Parent Category</Text>
            {isLoadingCats ? (
              <ActivityIndicator size="small" color={T.accent} style={{ alignSelf: 'flex-start', paddingVertical: 16 }} />
            ) : categories.length === 0 ? (
              <Text style={s.errorText}>No categories found. Create a category first.</Text>
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
                        size={20} 
                        color={isSelected ? T.blue : T.text3} 
                      />
                      <Text style={[s.radioText, isSelected && s.radioTextSelected]}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Description</Text>
            <View style={[s.inputBox, s.textAreaBox]}>
              <TextInput
                style={s.textArea}
                placeholder="Brief description of this service type..."
                placeholderTextColor={T.text3}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Base Price (Optional)</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name="currency-usd" size={20} color={T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. 50.00"
                placeholderTextColor={T.text3}
                value={formData.basePrice}
                onChangeText={(text) => setFormData({ ...formData, basePrice: text.replace(/[^0-9.]/g, '') })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Material Design Icon</Text>
            <View style={s.inputBox}>
              <MaterialCommunityIcons name={formData.icon as any} size={20} color={T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. hammer-wrench"
                placeholderTextColor={T.text3}
                value={formData.icon}
                onChangeText={(text) => setFormData({ ...formData, icon: text })}
                autoCapitalize="none"
              />
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.submitBtnText}>Create Service Type</Text>
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  
  content: { padding: 24, paddingBottom: 40 },
  
  formGroup: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "800", color: T.text2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  inputBox: { 
    flexDirection: "row", alignItems: "center", backgroundColor: T.surface, 
    borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: T.border, 
  },
  input: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500", marginLeft: 12 },
  
  textAreaBox: { height: 120, alignItems: "flex-start", paddingVertical: 16 },
  textArea: { flex: 1, fontSize: 16, color: T.text1, textAlignVertical: "top" },
  
  radioGroup: { backgroundColor: T.surface, borderRadius: 16,  },
  radioItem: { flexDirection: "row", alignItems: "center", padding: 16 },
  radioItemBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  radioText: { marginLeft: 12, fontSize: 16, color: T.text1, fontWeight: "500" },
  radioTextSelected: { color: T.blue, fontWeight: "600" },

  errorText: { color: T.error, fontSize: 14, marginTop: 8 },
  
  footer: { padding: 24, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border },
  submitBtn: { backgroundColor: T.accent, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
});

