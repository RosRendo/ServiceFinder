/**
 * Coverage Areas — Interactive Map Redesign
 */
import React, { useState, useCallback, useEffect } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, Alert,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { api, useAuthStore } from "@/store/authStore";
import { Theme } from "@/constants/theme";

// react-native-maps cannot be imported normally on Web without configuration
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
}

const T = Theme.colors;

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

// Fixed theoretical service radius (in meters)
const SERVICE_RADIUS_METERS = 15000; 

function InputField({ label, icon, value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputBox}>
        <MaterialCommunityIcons name={icon} size={20} color={T.text3} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.text3}
          style={s.input}
          keyboardType={keyboardType ?? "default"}
        />
      </View>
    </View>
  );
}

export default function CoverageAreas() {
  const router = useRouter();
  const mapRef = React.useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [companyId, setCompanyId] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [coverageRadiusKm, setCoverageRadiusKm] = useState(15);
  const { user, isLoading: authLoading } = useAuthStore();

  const loadCompany = useCallback(async (isRefresh = false) => {
    if (authLoading || !user) return;
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get("/api/companies/my-company");
      let data = res.data;
      if (data && data.success) data = data.data;
      if (data) {
        setCompanyId(data.id ?? "");
        setCity(data.city ?? "");
        setAddress(data.address ?? "");
        setLatitude(data.latitude ? String(data.latitude) : "");
        setLongitude(data.longitude ? String(data.longitude) : "");
        const radius = data.serviceAreas?.[0]?.coverageRadiusKm || 15;
        setCoverageRadiusKm(Number(radius));
      }
    } catch (error) {
      console.error("Failed to load company", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authLoading, user]);

  useFocusEffect(useCallback(() => { loadCompany(); }, [loadCompany]));

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      await api.put(`/api/companies/${companyId}`, {
        city, address,
        latitude: latitude ? String(latitude) : undefined,
        longitude: longitude ? String(longitude) : undefined,
        coverageRadiusKm: Number(coverageRadiusKm),
      });
      Alert.alert("Saved!", "Coverage area updated successfully.");
    } catch {
      Alert.alert("Error", "Could not update coverage area.");
    } finally {
      setSaving(false);
    }
  };

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setLatitude(String(coords.latitude));
    setLongitude(String(coords.longitude));
  };

  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to use this feature.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(String(loc.coords.latitude));
      setLongitude(String(loc.coords.longitude));
      
      // Animate map to new location
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch current location.');
    }
  };

  // Convert string coordinates to float for the map
  const mapLat = parseFloat(latitude) || 11.5564; // Fallback to Phnom Penh
  const mapLng = parseFloat(longitude) || 104.9282;
  const hasCoordinates = latitude && longitude;

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Coverage Area</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || loading} style={[s.saveBtn, (saving || loading) && { opacity: 0.5 }]}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCompany(true)} tintColor={T.accent} />}
        >
          {loading ? (
            <View style={s.loadingBox}><ActivityIndicator size="large" color={T.accent} /></View>
          ) : (
            <>
              {/* Interactive Map Section */}
              {Platform.OS !== "web" && MapView ? (
                <View style={s.mapContainer}>
                  <MapView
                    ref={mapRef}
                    style={s.mapView}
                    initialRegion={{
                      latitude: mapLat,
                      longitude: mapLng,
                      latitudeDelta: 0.3,
                      longitudeDelta: 0.3,
                    }}
                    onPress={handleMapPress}
                  >
                    {hasCoordinates && (
                      <>
                        <Marker 
                          coordinate={{ latitude: mapLat, longitude: mapLng }} 
                          title="Headquarters" 
                          description="Your business center"
                        />
                        <Circle
                          center={{ latitude: mapLat, longitude: mapLng }}
                          radius={coverageRadiusKm * 1000}
                          fillColor="rgba(30, 58, 138, 0.15)" // T.accentMid with opacity
                          strokeColor="rgba(30, 58, 138, 0.5)"
                          strokeWidth={2}
                        />
                      </>
                    )}
                  </MapView>
                  
                  {/* Map Overlay Controls */}
                  <View style={s.mapOverlayTop}>
                    <View style={s.mapInstructionBadge}>
                      <MaterialCommunityIcons name="gesture-tap" size={16} color={T.accentMid} />
                      <Text style={s.mapInstructionText}>Tap map to set location</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={s.myLocationBtn} onPress={useCurrentLocation} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={24} color={T.accentMid} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.webFallbackCard}>
                  <MaterialCommunityIcons name="map-marker-radius-outline" size={48} color={T.text3} />
                  <Text style={s.webFallbackTitle}>Map Unavailable on Web</Text>
                  <Text style={s.webFallbackDesc}>Please use the manual coordinate inputs below.</Text>
                </View>
              )}

              {/* Form Fields */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Location Details</Text>
                <InputField
                  label="Base City *"
                  icon="city-variant-outline"
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. San Francisco"
                />
                <InputField
                  label="Office Address"
                  icon="map-marker-outline"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street address (optional)"
                />

                {/* If Map is available, hide manual lat/lng inputs unless on web */}
                {Platform.OS === "web" && (
                  <View style={s.row}>
                    <View style={{ flex: 1 }}>
                      <InputField
                        label="Latitude"
                        icon="crosshairs"
                        value={latitude}
                        onChangeText={setLatitude}
                        placeholder="37.7749"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 1 }}>
                      <InputField
                        label="Longitude"
                        icon="crosshairs"
                        value={longitude}
                        onChangeText={setLongitude}
                        placeholder="-122.4194"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Interactive Service Radius Geofencing */}
              <View style={[s.card, { marginTop: 8 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <View style={s.infoIconWrap}>
                    <MaterialCommunityIcons name="radar" size={24} color={T.accentMid} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>Dynamic Geofence Radius</Text>
                    <Text style={{ fontSize: 12, color: T.text3 }}>Set the maximum search distance from your HQ base.</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: T.bg, padding: 12, borderRadius: 16, marginBottom: 12 }}>
                  <TouchableOpacity 
                    onPress={() => setCoverageRadiusKm(prev => Math.max(5, prev - 5))}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border }}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color={T.text1} />
                  </TouchableOpacity>

                  <Text style={{ fontSize: 18, fontWeight: "700", color: T.accentMid }}>{coverageRadiusKm} km</Text>

                  <TouchableOpacity 
                    onPress={() => setCoverageRadiusKm(prev => Math.min(100, prev + 5))}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border }}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={T.text1} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 11, color: T.text3, textAlign: "center", lineHeight: 16 }}>
                  Active geofencing prevents customers living further than {coverageRadiusKm}km away from booking your team.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },
  saveBtn: { backgroundColor: T.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  scrollContent: { padding: 16, gap: 16, paddingBottom: 60 },
  loadingBox: { paddingVertical: 100, alignItems: "center" },

  mapContainer: {
    height: 320, borderRadius: 20, overflow: "hidden", 
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.surface, position: "relative"
  },
  mapView: { flex: 1 },
  mapOverlayTop: { position: "absolute", top: 16, left: 16, right: 16, alignItems: "center" },
  mapInstructionBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: T.border,
  },
  mapInstructionText: { fontSize: 13, fontWeight: "700", color: T.accentMid },
  myLocationBtn: {
    position: "absolute", bottom: 16, right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: T.surface, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: T.border,
  },

  webFallbackCard: {
    backgroundColor: T.surface, borderRadius: 20, padding: 32,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: T.border,
  },
  webFallbackTitle: { fontSize: 16, fontWeight: "700", color: T.text1 },
  webFallbackDesc: { fontSize: 13, color: T.text3, textAlign: "center" },

  card: { backgroundColor: T.surface, borderRadius: 20, padding: 20,  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 4 },
  
  infoIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: T.accentLight, alignItems: "center", justifyContent: "center" },
  infoText: { fontSize: 13, color: T.text2, lineHeight: 20, marginTop: 4 },

  row: { flexDirection: "row" },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: "700", color: T.text2, marginLeft: 2 },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: T.bg, borderRadius: 12, paddingHorizontal: 14,
    height: 50, borderWidth: 1, borderColor: T.border,
  },
  input: { flex: 1, fontSize: 15, color: T.text1, fontWeight: "500" },
});
