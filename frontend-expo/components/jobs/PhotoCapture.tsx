import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface Photo {
  uri: string;
  type: "before" | "after" | "general";
  uploading?: boolean;
}

interface PhotoCaptureProps {
  jobId: string;
  onPhotosChange?: (photos: Photo[]) => void;
  maxPhotos?: number;
}

export function PhotoCapture({ jobId, onPhotosChange, maxPhotos = 10 }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoType, setPhotoType] = useState<"before" | "after" | "general">("general");

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to take job photos.");
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert("Limit Reached", `You can only upload ${maxPhotos} photos per job.`);
      return;
    }
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      addPhoto(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert("Limit Reached", `You can only upload ${maxPhotos} photos per job.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Gallery access is needed to select photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: maxPhotos - photos.length,
    });

    if (!result.canceled) {
      result.assets.forEach((asset) => addPhoto(asset.uri));
    }
  };

  const addPhoto = (uri: string) => {
    const newPhoto: Photo = { uri, type: photoType, uploading: true };
    const updated = [...photos, newPhoto];
    setPhotos(updated);
    onPhotosChange?.(updated);

    // Simulate upload — replace with real API call
    setTimeout(() => {
      setPhotos((prev) =>
        prev.map((p) => (p.uri === uri ? { ...p, uploading: false } : p))
      );
    }, 1500);
  };

  const removePhoto = (uri: string) => {
    Alert.alert("Remove Photo", "Are you sure you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const updated = photos.filter((p) => p.uri !== uri);
          setPhotos(updated);
          onPhotosChange?.(updated);
        },
      },
    ]);
  };

  return (
    <View>
      {/* Type selector */}
      <View className="flex-row gap-2 mb-4">
        {(["before", "after", "general"] as const).map((type) => (
          <TouchableOpacity
            key={type}
            className={`flex-1 py-2 rounded-full border items-center ${
              photoType === type ? "bg-primary border-primary" : "bg-transparent border-outline-variant"
            }`}
            onPress={() => setPhotoType(type)}
          >
            <Text className={`text-sm font-bold capitalize ${photoType === type ? "text-white" : "text-on-surface-variant"}`}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity
          className="flex-1 h-12 bg-primary rounded-2xl flex-row items-center justify-center gap-2"
          onPress={takePhoto}
        >
          <MaterialCommunityIcons name="camera" size={20} color="white" />
          <Text className="text-white font-bold">Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-12 bg-surface-container rounded-2xl flex-row items-center justify-center gap-2 border border-outline-variant"
          onPress={pickFromGallery}
        >
          <MaterialCommunityIcons name="image-multiple" size={20} color="#191c1e" />
          <Text className="text-on-surface font-bold">Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Photo grid */}
      {photos.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {photos.map((photo, idx) => (
            <View key={idx} className="relative w-[31%] aspect-square rounded-xl overflow-hidden bg-surface-container">
              <Image source={{ uri: photo.uri }} className="w-full h-full" contentFit="cover" />
              
              {/* Type badge */}
              <View className="absolute top-1 left-1 bg-black/60 px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold capitalize">{photo.type}</Text>
              </View>

              {/* Upload indicator */}
              {photo.uploading ? (
                <View className="absolute inset-0 bg-black/50 items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : (
                <TouchableOpacity
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                  onPress={() => removePhoto(photo.uri)}
                >
                  <MaterialCommunityIcons name="close" size={12} color="white" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add more placeholder */}
          {photos.length < maxPhotos && (
            <TouchableOpacity
              className="w-[31%] aspect-square rounded-xl border-2 border-dashed border-outline-variant items-center justify-center"
              onPress={takePhoto}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#74777f" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text className="text-xs text-on-surface-variant mt-3 text-center">
        {photos.length}/{maxPhotos} photos · Tap photo to remove
      </Text>
    </View>
  );
}
