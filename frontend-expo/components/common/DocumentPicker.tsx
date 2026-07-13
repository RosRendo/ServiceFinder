import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// IMPORT AFTER RUNNING: npx expo install expo-document-picker
// import * as ExpoDocumentPicker from 'expo-document-picker';

interface DocumentPickerProps {
  onDocumentSelected: (uri: string, name: string, size?: number) => void;
  label?: string;
  className?: string;
}

export function DocumentPicker({ onDocumentSelected, label = "Upload Document", className = "" }: DocumentPickerProps) {
  const [doc, setDoc] = useState<{ uri: string; name: string; size?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickDocument = async () => {
    /*
    setIsLoading(true);
    try {
      const result = await ExpoDocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const newDoc = { 
          uri: selectedAsset.uri, 
          name: selectedAsset.name,
          size: selectedAsset.size
        };
        setDoc(newDoc);
        onDocumentSelected(newDoc.uri, newDoc.name, newDoc.size);
      }
    } catch (error) {
      console.error("Error picking document:", error);
    } finally {
      setIsLoading(false);
    }
    */
  };

  const clearDocument = () => {
    setDoc(null);
    onDocumentSelected("", "");
  };

  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-sm font-bold text-on-surface-variant mb-2">{label}</Text>}
      
      {!doc ? (
        <TouchableOpacity 
          onPress={pickDocument}
          className="w-full p-4 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl flex-row items-center justify-center active:bg-surface-container"
        >
          {isLoading ? (
            <ActivityIndicator color="#002045" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#74777f" />
              <View className="ml-3">
                <Text className="text-sm font-medium text-on-surface-variant">Tap to browse documents</Text>
                <Text className="text-xs text-on-surface-variant">PDF, DOC, DOCX (Requires package)</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View className="w-full p-4 bg-primary-container/20 border border-primary-container rounded-xl flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-4">
            <MaterialCommunityIcons name="file-check" size={24} color="#002045" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-primary" numberOfLines={1}>{doc.name}</Text>
              {doc.size && (
                <Text className="text-xs text-on-surface-variant">
                  {(doc.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={clearDocument} className="p-2">
            <MaterialCommunityIcons name="close-circle" size={20} color="#74777f" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
