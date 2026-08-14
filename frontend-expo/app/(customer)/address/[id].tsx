/**
 * Edit/Create Address Screen — Premium Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator,
  Alert, Switch, ScrollView, StyleSheet, Keyboard, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { MAP_PROVIDER } from "@/utils/mapHelper";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function AddressFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = id && id !== "new";

  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    const fetchAddress = async () => {
      try {
        const res = await api.get(`/api/addresses/${id}`);
        const data = res.data?.data ?? res.data;
        setLabel(data.label);
        setAddress(data.address);
        setIsDefault(data.isDefault);
        if (data.latitude && data.longitude) {
          setLatitude(Number(data.latitude));
          setLongitude(Number(data.longitude));
        }
      } catch (e) {
        Alert.alert("Error", "Could not load address details.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [id, isEditing]);

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location services in your device settings to use this feature.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng
      });
      if (geocode) {
        // e.g. "123 Main St, Springfield, IL, USA"
        const parts = [
          geocode.streetNumber ? `${geocode.streetNumber} ${geocode.street}` : geocode.street,
          geocode.city || geocode.subregion,
          geocode.region,
          geocode.country
        ].filter(Boolean);
        setAddress(parts.join(', '));
      } else {
        Alert.alert('Location Error', 'Could not determine the address for this location.');
      }
    } catch (err) {
      console.error("[Location Error]", err);
      Alert.alert('Error', 'Failed to fetch location. Please enter manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!label.trim() || !address.trim()) {
      return setError("Label and Address are required.");
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = { 
        label: label.trim(), 
        address: address.trim(), 
        isDefault,
        latitude,
        longitude
      };
      if (isEditing) {
        await api.patch(`/api/addresses/${id}`, payload);
      } else {
        await api.post("/api/addresses", payload);
      }
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to save address.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.title}>{isEditing ? "Edit Address" : "Add Address"}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.content}>
          {/* Error Banner */}
          {!!error && (
            <View style={s.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={T.error} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* Label */}
          <View style={s.fieldGroup}>
            <Text style={s.inputLabel}>ADDRESS LABEL</Text>
            <View style={[s.inputWrapper, focusedInput === "label" && s.inputWrapperFocused]}>
              <MaterialCommunityIcons name="tag-outline" size={22} color={focusedInput === "label" ? T.accent : T.text3} />
              <TextInput
                style={s.input}
                placeholder="e.g. Home, Office"
                placeholderTextColor={T.text3}
                value={label}
                onChangeText={(t) => { setLabel(t); setError(""); }}
                onFocus={() => setFocusedInput("label")}
                onBlur={() => setFocusedInput(null)}
                maxLength={50}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Address */}
          <View style={s.fieldGroup}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={[s.inputLabel, { marginBottom: 0 }]}>FULL ADDRESS</Text>
              <TouchableOpacity onPress={handleGetLocation} disabled={isLocating} style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}>
                {isLocating ? <ActivityIndicator size={14} color={T.accent} /> : <MaterialCommunityIcons name="crosshairs-gps" size={16} color={T.accent} />}
                <Text style={{ fontSize: 10, fontWeight: "800", color: T.accent, letterSpacing: 0.5 }}>USE CURRENT LOCATION</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.inputWrapper, { height: 100, alignItems: "flex-start", paddingTop: 16 }, focusedInput === "address" && s.inputWrapperFocused]}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color={focusedInput === "address" ? T.accent : T.text3} />
              <TextInput
                style={[s.input, { height: 70, textAlignVertical: "top" }]}
                placeholder="123 Main St, Apt 4B, City, Country"
                placeholderTextColor={T.text3}
                value={address}
                onChangeText={(t) => { setAddress(t); setError(""); }}
                onFocus={() => setFocusedInput("address")}
                onBlur={() => setFocusedInput(null)}
                multiline
              />
            </View>
          </View>

          {/* Map Preview */}
          {latitude && longitude && (
            <View style={s.mapContainer}>
              <Text style={s.inputLabel}>EXACT LOCATION</Text>
              <View style={s.mapWrapper}>
                <MapView
                  provider={MAP_PROVIDER}
                  style={s.map}
                  initialRegion={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  region={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  onPress={(e) => {
                    setLatitude(e.nativeEvent.coordinate.latitude);
                    setLongitude(e.nativeEvent.coordinate.longitude);
                  }}
                >
                  <Marker
                    coordinate={{ latitude, longitude }}
                    draggable
                    onDragEnd={(e) => {
                      setLatitude(e.nativeEvent.coordinate.latitude);
                      setLongitude(e.nativeEvent.coordinate.longitude);
                    }}
                  />
                </MapView>
                <View style={s.mapOverlay}>
                  <Text style={s.mapHelpText}>Drag pin or tap map to adjust</Text>
                </View>
              </View>
            </View>
          )}

          {/* Default Toggle */}
          <View style={s.toggleCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleTitle}>Set as Default</Text>
              <Text style={s.toggleDesc}>Use this address automatically for bookings</Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: T.border, true: T.accent }}
              thumbColor="#fff"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btnPrimary, submitting && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnPrimaryText}>Save Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flexGrow: 1, paddingBottom: 40 },
  
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: T.text1 },

  content: { padding: 24 },

  errorBox: { backgroundColor: T.errorBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  errorText: { color: T.error, fontWeight: "600", fontSize: 13, flex: 1 },

  fieldGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: T.text2, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: T.border, gap: 12 },
  inputWrapperFocused: { borderColor: T.accent, backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 16, color: T.text1, fontWeight: "500" },

  toggleCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: T.border,
    marginBottom: 32,
  },
  toggleTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 4 },
  toggleDesc: { fontSize: 13, color: T.text2, fontWeight: "500" },

  btnPrimary: { width: "100%", backgroundColor: T.accent, borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  btnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  mapContainer: { marginBottom: 24 },
  mapWrapper: { height: 200, borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: T.border, position: "relative" },
  map: { width: "100%", height: "100%" },
  mapOverlay: { position: "absolute", bottom: 8, left: 0, right: 0, alignItems: "center" },
  mapHelpText: { backgroundColor: "rgba(10, 25, 47, 0.8)", color: "#fff", fontSize: 11, fontWeight: "800", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: "hidden" },
});
