import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CUSTOMER_LOC = { latitude: 11.5564, longitude: 104.9282 };
const PROVIDERS = [
  { id: "p1", name: "ABC Repair", distance: "1.2 km", eta: "7 min", lat: 11.5615, lng: 104.9310 },
  { id: "p2", name: "QuickFix", distance: "2.0 km", eta: "10 min", lat: 11.5510, lng: 104.9380 },
  { id: "p3", name: "Expert Services", distance: "3.1 km", eta: "12 min", lat: 11.5680, lng: 104.9180 }
];

const SERVICES = [
  { id: "cleaning", label: "Cleaning", icon: "broom", color: "#3b82f6" },
  { id: "repair", label: "Repair", icon: "hammer-wrench", color: "#f97316" },
  { id: "ac", label: "AC Repair", icon: "air-conditioner", color: "#06b6d4" },
  { id: "plumbing", label: "Plumbing", icon: "pipe-wrench", color: "#3b82f6" },
  { id: "electrical", label: "Electrical", icon: "lightning-bolt", color: "#eab308" },
  { id: "home", label: "Home Service", icon: "home-outline", color: "#10b981" },
  { id: "other", label: "Other Needs", icon: "dots-horizontal-circle-outline", color: "#6b7280" }
];

type Stage = 1 | 2 | 3;

export default function InstantRequestFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedService, setSelectedService] = useState<{ id: string; label: string } | null>(null);
  const [desc, setDesc] = useState("");
  const [preferredTime, setPreferredTime] = useState<"now" | "later">("now");

  const handleBack = () => {
    if (stage === 1) {
      router.back();
    } else if (stage === 2) {
      setStage(1);
    } else if (stage === 3) {
      if (selectedService?.id === "other") {
        setStage(2);
      } else {
        setStage(1);
      }
    }
  };

  const handleSelectService = (serviceId: string, label: string) => {
    setSelectedService({ id: serviceId, label });
    if (serviceId === "other") {
      setStage(2);
    } else {
      setStage(3);
    }
  };

  const handleConfirmDetails = () => {
    if (!desc.trim()) {
      Alert.alert("Required", "Please describe what you need help with.");
      return;
    }
    setStage(3);
  };

  const handleFindProviders = async () => {
    if (!selectedService) return;
    try {
      setLoading(true);
      const finalDesc = desc.trim() || `Urgent ${selectedService.label} request`;
      const response = await api.post("/api/instant-requests", {
        serviceCategory: selectedService.label,
        description: finalDesc,
        preferredTime: "now",
        latitude: CUSTOMER_LOC.latitude,
        longitude: CUSTOMER_LOC.longitude,
      });

      const responseData = response.data?.data || response.data;
      const requestId = responseData?.request?.id;
      if (!requestId) {
        throw new Error("Invalid request registration response");
      }

      router.push({
        pathname: "/(customer)/instant-request/matching" as any,
        params: {
          serviceId: selectedService.id,
          serviceName: selectedService.label,
          desc: finalDesc,
          preferredTime: "now",
          requestId,
          lat: CUSTOMER_LOC.latitude,
          lng: CUSTOMER_LOC.longitude,
        },
      });
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const getHeaderTitle = () => {
    switch (stage) {
      case 1:
        return "Need Help Now?";
      case 2:
        return "Describe Problem";
      case 3:
        return "Confirm Booking";
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{getHeaderTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Map (Occupies background/top portion) */}
        <View style={s.mapContainer}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: CUSTOMER_LOC.latitude,
              longitude: CUSTOMER_LOC.longitude,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            }}
          >
            {/* Customer Pin */}
            <Marker coordinate={CUSTOMER_LOC}>
              <View style={s.customerMarker}>
                <MaterialCommunityIcons name="home-map-marker" size={22} color="#FFF" />
              </View>
            </Marker>

            {/* Provider Pins (Only visible in Stage 1 & 3 to show availability) */}
            {stage !== 2 &&
              PROVIDERS.map((p) => (
                <Marker
                  key={p.id}
                  coordinate={{ latitude: p.lat, longitude: p.lng }}
                  title={p.name}
                  description={`${p.distance} away • ETA: ${p.eta}`}
                >
                  <View style={s.providerMarker}>
                    <MaterialCommunityIcons name="truck-delivery" size={16} color="#FFF" />
                  </View>
                </Marker>
              ))}
          </MapView>
        </View>

        {/* Stage-Based Bottom Sheet */}
        <View style={s.bottomSheet}>
          <View style={s.dragIndicator} />

          {stage === 1 && (
            <View style={s.sheetContent}>
              <View style={s.introBox}>
                <Text style={s.sheetTitle}>What do you need help with?</Text>
                <Text style={s.sheetSubtitle}>
                  Choose an urgent service below. We will alert nearby verified pros instantly.
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.servicesScroll}
              >
                {SERVICES.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.serviceCard}
                    onPress={() => handleSelectService(item.id, item.label)}
                  >
                    <View style={[s.iconWrapper, { backgroundColor: item.color + "12" }]}>
                      <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
                    </View>
                    <Text style={s.cardLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {stage === 2 && (
            <ScrollView style={s.sheetContent} keyboardShouldPersistTaps="handled">
              <View style={s.introBox}>
                <Text style={s.sheetTitle}>Describe what you need</Text>
                <Text style={s.sheetSubtitle}>
                  Add specific details so providers can bid accurately.
                </Text>
              </View>

              <TextInput
                placeholder="Type problem details (e.g. kitchen sink leaking water rapidly, AC unit stopped cooling...)"
                placeholderTextColor="#94a3b8"
                style={s.textArea}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={desc}
                onChangeText={setDesc}
              />

              <Text style={s.label}>Preferred Timing</Text>
              <View style={s.toggleRow}>
                <TouchableOpacity
                  style={[s.toggleBtn, preferredTime === "now" && s.toggleActive]}
                  onPress={() => setPreferredTime("now")}
                >
                  <MaterialCommunityIcons
                    name="clock-fast"
                    size={18}
                    color={preferredTime === "now" ? "#FFF" : T.text2}
                  />
                  <Text style={[s.toggleText, preferredTime === "now" && s.toggleTextActive]}>
                    ASAP Assistance
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.toggleBtn, preferredTime === "later" && s.toggleActive]}
                  onPress={() => setPreferredTime("later")}
                >
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={18}
                    color={preferredTime === "later" ? "#FFF" : T.text2}
                  />
                  <Text style={[s.toggleText, preferredTime === "later" && s.toggleTextActive]}>
                    Schedule Later
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, !desc.trim() && s.disabledBtn]}
                disabled={!desc.trim()}
                onPress={handleConfirmDetails}
              >
                <Text style={s.primaryBtnText}>Confirm Location</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </ScrollView>
          )}

          {stage === 3 && (
            <View style={s.sheetContent}>
              <View style={s.introBox}>
                <Text style={s.sheetTitle}>Confirm Booking Details</Text>
                <Text style={s.sheetSubtitle}>
                  Ready to dispatch? We found {PROVIDERS.length} pros near Boeung Keng Kang.
                </Text>
              </View>

              <View style={s.summaryCard}>
                <View style={s.row}>
                  <MaterialCommunityIcons name="tag-outline" size={20} color={T.accent} />
                  <Text style={s.summaryText}>
                    Service: <Text style={{ fontWeight: "700" }}>{selectedService?.label}</Text>
                  </Text>
                </View>
                <View style={s.row}>
                  <MaterialCommunityIcons name="map-marker-outline" size={20} color={T.accent} />
                  <Text style={s.summaryText} numberOfLines={1}>
                    Location: 123 Sparkle Ave, Phnom Penh
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, loading && s.disabledBtn]}
                disabled={loading}
                onPress={handleFindProviders}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={s.primaryBtnText}>Find Available Providers</Text>
                    <MaterialCommunityIcons name="radar" size={22} color="#FFF" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF"
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text1
  },
  mapContainer: {
    flex: 1,
  },
  customerMarker: {
    backgroundColor: T.accent,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  providerMarker: {
    backgroundColor: T.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  bottomSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 10
  },
  dragIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginVertical: 12
  },
  sheetContent: {
    paddingBottom: 12
  },
  introBox: {
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: T.text1,
    marginBottom: 6
  },
  sheetSubtitle: {
    fontSize: 13,
    color: T.text2,
    lineHeight: 18
  },
  servicesScroll: {
    gap: 12,
    paddingVertical: 4
  },
  serviceCard: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
    width: 104,
    height: 114,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "750",
    color: T.text1,
    textAlign: "center"
  },
  textArea: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: T.text1,
    height: 84,
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: T.text1,
    marginBottom: 8
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6
  },
  toggleActive: {
    backgroundColor: T.accent,
    borderColor: T.accent
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: T.text2
  },
  toggleTextActive: {
    color: "#FFF"
  },
  primaryBtn: {
    backgroundColor: T.accent,
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800"
  },
  disabledBtn: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0
  },
  summaryCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 20
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  summaryText: {
    fontSize: 14,
    color: T.text1,
    fontWeight: "500"
  }
});
