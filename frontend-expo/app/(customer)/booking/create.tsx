/**
 * Simplified Create Booking Screen
 */
import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, StyleSheet, Animated, Pressable, Platform, Keyboard
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import * as SecureStore from 'expo-secure-store';
import * as Location from "expo-location";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const buildDays = () => {
  const days: { date: Date; label: string; dayName: string }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    days.push({ date: d, label: d.getDate().toString(), dayName: d.toLocaleDateString("en-US", { weekday: "short" }) });
  }
  return days;
};
const DAYS = buildDays();

export default function CreateBookingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { serviceId, companyId, price: priceParam } = useLocalSearchParams<{ serviceId?: string; companyId?: string; price?: string; }>();

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [service, setService] = useState<any>(null);
  const [isLoadingService, setIsLoadingService] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) Alert.alert(t('bookingCreate.loginRequiredTitle'), t('bookingCreate.loginRequiredMsg'), [{ text: t('bookingCreate.logIn'), onPress: () => router.replace('/(auth)/login' as any) }]);
    };
    checkToken();
  }, [t]);

  useEffect(() => {
    if (!serviceId) return;
    const load = async () => {
      setIsLoadingService(true);
      try {
        const res = await api.get(`/api/services/${serviceId}`);
        const raw = res.data;
        const d = raw?.data?.id ? raw.data : (raw?.data?.data ?? raw?.data ?? raw);
        setService(d);
      } catch (e: any) {
        console.error("[CreateBooking] load error", e?.message);
      } finally {
        setIsLoadingService(false);
      }
    };
    load();
  }, [serviceId]);

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('bookingCreate.permissionDeniedTitle'), t('bookingCreate.permissionDeniedMsg'));
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);
      const [geocode] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocode) {
        const parts = [
          geocode.streetNumber ? `${geocode.streetNumber} ${geocode.street}` : geocode.street,
          geocode.city || geocode.subregion,
          geocode.region,
          geocode.country
        ].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch (error) {
      Alert.alert(t('bookingCreate.errorTitle'), t('bookingCreate.locationFailedMsg'));
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!address.trim()) return Alert.alert(t('bookingCreate.addressRequiredTitle'), t('bookingCreate.addressRequiredMsg'));

    const effectiveCompanyId = companyId || service?.company?.id || "";
    if (!serviceId || !effectiveCompanyId) return Alert.alert(t('bookingCreate.errorTitle'), t('bookingCreate.missingInfoMsg'));
    
    const bookingDate = DAYS[selectedDayIdx].date.toISOString().split("T")[0];
    setIsSubmitting(true);
    try {
      const formattedTime = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      const res = await api.post("/api/bookings", {
        serviceId, companyId: effectiveCompanyId, bookingDate,
        startTime: formattedTime, serviceAddress: address.trim() || undefined,
        latitude, longitude,
        notes: specialInstructions.trim() || undefined,
      });

      const created = res.data?.data ?? res.data;
      const createdId = created?.id;

      if (createdId) router.push(`/checkout?bookingId=${createdId}` as any);
      else {
        Alert.alert(t('bookingCreate.bookingConfirmed'));
        router.push("/(customer)/(tabs)/profile" as any);
      }
    } catch (e: any) {
      Alert.alert(t('bookingCreate.bookingFailedTitle'), t('bookingCreate.bookingFailedMsg'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const urlPrice = priceParam ? Number(priceParam) : null;
  const total = Number(service?.basePrice ?? urlPrice ?? 0);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.appBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.appBarTitle}>{t('bookingCreate.bookService')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Service Info */}
        <View style={s.serviceCard}>
          <Text style={s.serviceTitle}>{service?.name || t('bookingCreate.serviceBooking')}</Text>
          <Text style={s.servicePrice}>${total.toFixed(2)}</Text>
        </View>

        {/* Date */}
        <Text style={s.sectionTitle}>{t('bookingCreate.selectDate')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rowScroll}>
          {DAYS.map((d, i) => (
            <TouchableOpacity key={i} onPress={() => setSelectedDayIdx(i)} style={[s.pill, selectedDayIdx === i && s.pillActive]}>
              <Text style={[s.pillLabel, selectedDayIdx === i && s.pillLabelActive]}>{d.dayName}</Text>
              <Text style={[s.pillValue, selectedDayIdx === i && s.pillValueActive]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time */}
        <Text style={s.sectionTitle}>{t('bookingCreate.selectTime')}</Text>
        {Platform.OS === 'ios' ? (
          <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="spinner"
              onChange={(e, d) => d && setSelectedTime(d)}
            />
          </View>
        ) : (
          <View>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[s.inputWrapper, { marginBottom: 16 }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={T.text3} style={s.inputIcon} />
              <Text style={[s.input, { textAlignVertical: 'center' }]}>
                {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={(e, d) => {
                  setShowTimePicker(false);
                  if (d) setSelectedTime(d);
                }}
              />
            )}
          </View>
        )}

        {/* Location */}
        <Text style={s.sectionTitle}>{t('bookingCreate.serviceAddress')}</Text>
        <View style={s.inputWrapper}>
          <MaterialCommunityIcons name="map-marker-outline" size={20} color={T.text3} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder={t('bookingCreate.addressPlaceholder')}
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={T.text3}
          />
          <TouchableOpacity onPress={handleGetLocation} style={s.locateBtn}>
            {isLocating ? <ActivityIndicator size="small" color={T.accent} /> : <MaterialCommunityIcons name="crosshairs-gps" size={20} color={T.accent} />}
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <Text style={s.sectionTitle}>{t('bookingCreate.additionalNotes')}</Text>
        <TextInput
          style={[s.input, s.inputMultiline]}
          placeholder={t('bookingCreate.notesPlaceholder')}
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline
          placeholderTextColor={T.text3}
        />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <View>
          <Text style={s.totalLabel}>{t('bookingCreate.totalPayment')}</Text>
          <Text style={s.totalAmount}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity onPress={handleSubmit} style={s.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.submitBtnText}>{t('bookingCreate.payWithKHQR')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  iconBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  appBarTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  serviceCard: { backgroundColor: T.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: T.border, marginBottom: 24 },
  serviceTitle: { fontSize: 18, fontWeight: "700", color: T.text1, marginBottom: 4 },
  servicePrice: { fontSize: 24, fontWeight: "800", color: T.accent },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: T.text1, marginBottom: 12, marginTop: 12 },
  rowScroll: { flexDirection: "row", marginBottom: 16 },
  pill: { width: 64, height: 80, borderRadius: 12, borderWidth: 1, borderColor: T.border, justifyContent: "center", alignItems: "center", marginRight: 12 },
  pillActive: { backgroundColor: T.accent, borderColor: T.accent },
  pillLabel: { fontSize: 13, color: T.text2, marginBottom: 4 },
  pillLabelActive: { color: "rgba(255,255,255,0.8)" },
  pillValue: { fontSize: 18, fontWeight: "700", color: T.text1 },
  pillValueActive: { color: "#FFFFFF" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  timeBox: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: T.border, marginRight: 12, alignItems: "center", justifyContent: "center" },
  timeBoxActive: { backgroundColor: T.accentLight, borderColor: T.accent },
  timeBoxText: { fontSize: 15, fontWeight: "600", color: T.text2 },
  timeBoxTextActive: { color: T.accent },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 12, height: 56, marginBottom: 24 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: T.text1, height: "100%" },
  locateBtn: { padding: 8 },
  inputMultiline: { height: 100, textAlignVertical: "top", paddingVertical: 12, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  totalLabel: { fontSize: 13, color: T.text2, marginBottom: 2 },
  totalAmount: { fontSize: 24, fontWeight: "800", color: T.text1 },
  submitBtn: { flexDirection: "row", backgroundColor: T.accent, paddingHorizontal: 24, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" }
});
