import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// IMPORT AFTER RUNNING: npx expo install expo-image-picker
// import * as ExpoImagePicker from 'expo-image-picker';

interface ImagePickerProps {
  onImageSelected: (uri: string, base64?: string) => void;
  label?: string;
  initialImage?: string;
  className?: string;
}

export function ImagePicker({ onImageSelected, label = "Upload Photo", initialImage, className = "" }: ImagePickerProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    /*
    setIsLoading(true);
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setImage(selectedAsset.uri);
        onImageSelected(selectedAsset.uri, selectedAsset.base64 || undefined);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    } finally {
      setIsLoading(false);
    }
    */
  };

  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-sm font-bold text-on-surface-variant mb-2">{label}</Text>}
      
      <TouchableOpacity 
        onPress={pickImage}
        className="w-full h-40 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl items-center justify-center overflow-hidden active:bg-surface-container"
      >
        {isLoading ? (
          <ActivityIndicator color="#002045" size="large" />
        ) : image ? (
          <Image source={{ uri: image }} className="w-full h-full" contentFit="cover" />
        ) : (
          <View className="items-center justify-center p-4">
            <MaterialCommunityIcons name="cloud-upload-outline" size={36} color="#74777f" />
            <Text className="text-sm font-medium text-on-surface-variant mt-2 text-center">
              Tap to browse photos
            </Text>
            <Text className="text-xs text-on-surface-variant mt-1 text-center">
              Requires expo-image-picker
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {image && (
        <TouchableOpacity 
          onPress={() => {
            setImage(null);
            onImageSelected("");
          }}
          className="absolute top-8 right-2 bg-error rounded-full p-1"
        >
          <MaterialCommunityIcons name="close" size={16} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
