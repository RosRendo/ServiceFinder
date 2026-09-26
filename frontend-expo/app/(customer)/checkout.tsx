import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator,
  StyleSheet, Modal, Platform, Dimensions, Linking, TextInput
} from "react-native";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api, useAuthStore } from "@/store/authStore";
import { usePayments } from "@/hooks/usePayments";
import SuccessOverlay from "@/components/SuccessOverlay";
import QRCode from "react-native-qrcode-svg";
import { Theme } from "@/constants/theme";
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { MAP_PROVIDER } from "@/utils/mapHelper";
import FadeIn from "@/components/FadeIn";
import ScaleButton from "@/components/ScaleButton";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { AbaPayWaySvg, KhqrBakongSvg, WingBankSvg, EscrowShieldSvg, PhoneScanIllustrationSvg } from "@/components/svg";

const T = Theme.colors;
const { width } = Dimensions.get('window');

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { location } = useCurrentLocation(true);
  
  // Accept EITHER an existing bookingId OR temp params from BottomSheet
  const { bookingId, serviceId, date, time, price, companyId, isInstant, companyName, serviceName } = useLocalSearchParams<{ 
    bookingId?: string; 
    serviceId?: string; 
    date?: string; 
    time?: string; 
    price?: string;
    companyId?: string; 
    isInstant?: string;
    companyName?: string;
    serviceName?: string;
  }>();

  const { processAbaPayment } = usePayments();
  // Booking State
  const [booking, setBooking] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  
  // UI State
  const [loading, setLoading] = useState(!!bookingId || !!serviceId);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  
  const [selectedMethod, setSelectedMethod] = useState<'aba' | 'khqr' | 'wing'>('aba');
  const [pollingActive, setPollingActive] = useState<boolean>(false);
  const [khqrString, setKhqrString] = useState<string | null>(null);
  const [khqrAmount, setKhqrAmount] = useState<string>("0.00");
  const [abaHtml, setAbaHtml] = useState<string | null>(null);
  const [abaDeeplink, setAbaDeeplink] = useState<string | null>(null);

  const mapViewRef = useRef<MapView>(null);
  const pickerMapRef = useRef<MapView>(null);

  // Address picker state
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [customAddress, setCustomAddress] = useState<string | null>(null);
  const [customLat, setCustomLat] = useState<number | null>(null);
  const [customLng, setCustomLng] = useState<number | null>(null);
  const [pinLat, setPinLat] = useState(location.latitude);
  const [pinLng, setPinLng] = useState(location.longitude);

  // Derive display values at top level to avoid conditional hook rules
  const displayService = booking?.service || service;
  const displayCompany = displayService?.company;
  const displayPrice = booking?.totalPrice || price || displayService?.basePrice || "0.00";
  const displayDate = booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : (date || "Today");
  const displayTime = booking?.startTime || (time || "ASAP");
  const rawAddress = booking?.serviceAddress || (user as any)?.city || null;
  const displayAddress = customAddress || rawAddress;
  const hasAddress = !!displayAddress;
  const displayLat = customLat ?? (booking?.latitude ? parseFloat(booking.latitude.toString()) : location.latitude);
  const displayLng = customLng ?? (booking?.longitude ? parseFloat(booking.longitude.toString()) : location.longitude);
  
  // Pricing: clean total without extra customer-facing fees
  const total = Number(displayPrice) || 0;

  useEffect(() => {
    if (mapViewRef.current) {
      mapViewRef.current.animateToRegion({
        latitude: displayLat,
        longitude: displayLng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);
    }
  }, [displayLat, displayLng]);

  useEffect(() => {
    async function init() {
      try {
        if (bookingId) {
          const res = await api.get(`/api/bookings/${bookingId}`);
          setBooking(res.data.data.booking ?? res.data.data);
        } else if (serviceId) {
          const res = await api.get(`/api/services/${serviceId}`);
          setService(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [bookingId, serviceId]);

  // Poll for payment success when KHQR, Wing Deeplink, or ABA Deeplink is active
  useEffect(() => {
    let interval: any;
    if ((khqrString || pollingActive) && booking?.id) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/api/bookings/${booking.id}`);
          const b = res.data.data.booking ?? res.data.data;
          if (b.status === "confirmed") {
            setKhqrString(null);
            setPollingActive(false);
            setShowSuccess(true);
          }
        } catch (err) {
          // Ignore polling errors
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [khqrString, pollingActive, booking?.id]);

  const handleCreateAndPay = async () => {
    setPayError(null);
    setIsProcessing(true);

    let activeBookingId = bookingId;

    // 1. Create temporary booking if not exists
    if (!activeBookingId) {
      if (!serviceId) {
        setPayError("Missing service details");
        setIsProcessing(false);
        return;
      }
      
      try {
        const bd = new Date();
        const localDateString = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}-${String(bd.getDate()).padStart(2, '0')}`;
        const res = await api.post("/api/bookings", {
          serviceId, 
          companyId: service?.companyId || companyId || "", 
          bookingDate: localDateString,
          startTime: time || "10:00", 
          serviceAddress: (user as any)?.city || "Local Address",
        });
        activeBookingId = res.data.data.id;
      } catch (err) {
        setPayError("Failed to create temporary booking.");
        setIsProcessing(false);
        return;
      }
    }

    // 2. Process Payment
    if (selectedMethod === 'khqr') {
      try {
        const res = await api.post('/api/payments/khqr/generate', { bookingId: activeBookingId });
        setKhqrString(res.data.qrString);
        setKhqrAmount(res.data.amount);
        // Ensure we track the active booking id for polling
        if (!bookingId) {
          setBooking({ id: activeBookingId });
        }
      } catch (err: any) {
        setPayError(err?.response?.data?.message || "Failed to generate KHQR.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (selectedMethod === 'wing') {
      try {
        const res = await api.post('/api/payments/wing/checkout', { bookingId: activeBookingId, type: 'deeplink' });
        if (res.data.success && res.data.webPaymentUrl) {
          // Trigger the deeplink directly
          Linking.openURL(res.data.webPaymentUrl).catch(() => {
            Alert.alert("Error", "Could not open Wing Bank App");
          });
          setPollingActive(true);
          if (!bookingId) {
            setBooking({ id: activeBookingId });
          }
        } else {
          setPayError(res.data.message || "Failed to initialize Wing payment.");
        }
      } catch (err: any) {
        setPayError(err?.response?.data?.message || "Failed to initiate Wing payment.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // ABA PayWay (QR / Deeplink)
    const result = await processAbaPayment(activeBookingId as string);
    if (result?.success && result?.data) {
      const abaData = result.data;
      if (abaData.success) {
        if (abaData.abapay_deeplink && Platform.OS !== 'web') {
          // Trigger mobile deeplink
          Linking.openURL(abaData.abapay_deeplink).catch(() => {
            Alert.alert("Error", "Could not open ABA Mobile App");
          });
          setPollingActive(true);
        } else if (abaData.qrString) {
          // Fallback to QR display for web/unsupported
          setKhqrString(abaData.qrString);
          setKhqrAmount(abaData.amount);
        }
        
        if (!bookingId) {
          setBooking({ id: activeBookingId });
        }
      } else {
        setPayError(abaData.message || "Failed to generate ABA QR.");
      }
    } else {
      setPayError((result as any)?.message || "Payment initiation failed");
    }
    setIsProcessing(false);
  };
  const onAbaNavStateChange = (navState: any) => {
    const baseUrl = navState.url.split('?')[0];
    if (baseUrl.endsWith("aba-success") || baseUrl.endsWith("success")) {
      setAbaHtml(null);
      setShowSuccess(true);
    } else if (baseUrl.endsWith("aba-cancel") || baseUrl.endsWith("cancel") || baseUrl.endsWith("fail")) {
      setAbaHtml(null);
      setPayError("Payment was cancelled or failed.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loadingRoot}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Review & Pay</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* MAP SUMMARY / LOCATION PICKER */}
        <FadeIn delay={100}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => {
            setPinLat(displayLat);
            setPinLng(displayLng);
            setShowAddressPicker(true);
          }}>
            <View style={s.mapCard}>
              {!hasAddress && (
                <View style={s.addressBanner}>
                  <MaterialIcons name="add-location-alt" size={18} color={T.accent} />
                  <Text style={s.addressBannerText}>Tap to set your service location</Text>
                </View>
              )}
              <MapView
                ref={mapViewRef}
                provider={MAP_PROVIDER}
                style={[s.map, !hasAddress && { opacity: 0.5 }]}
                initialRegion={{
                  latitude: displayLat, longitude: displayLng,
                  latitudeDelta: 0.015, longitudeDelta: 0.015,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pointerEvents="none"
              >
                <Marker coordinate={{ latitude: displayLat, longitude: displayLng }} />
              </MapView>
              <View style={s.mapOverlay}>
                <View style={s.addressRow}>
                  <View style={[s.iconBox, !hasAddress && { backgroundColor: T.text3 }]}>
                    <MaterialIcons name={hasAddress ? "location-on" : "add-location-alt"} size={20} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.addressLabel}>Service Location</Text>
                    <Text style={[s.addressText, !hasAddress && { color: T.text3, fontStyle: 'italic' }]} numberOfLines={1}>
                      {displayAddress ?? "Not set — tap to add"}
                    </Text>
                  </View>
                  <MaterialIcons name="edit" size={16} color={T.text3} style={{ marginLeft: 8 }} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </FadeIn>

        {/* ADDRESS PICKER MODAL */}
        <Modal visible={showAddressPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddressPicker(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border }}>
              <TouchableOpacity onPress={() => setShowAddressPicker(false)}>
                <Text style={{ fontSize: 15, color: T.text2, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 17, fontWeight: '800', color: T.text1 }}>Set Location</Text>
              <TouchableOpacity onPress={() => {
                setCustomAddress(customAddress ?? `${pinLat.toFixed(5)}, ${pinLng.toFixed(5)}`);
                setCustomLat(pinLat);
                setCustomLng(pinLng);
                setShowAddressPicker(false);
              }}>
                <Text style={{ fontSize: 15, color: T.accent, fontWeight: '800' }}>Confirm</Text>
              </TouchableOpacity>
            </View>

            {/* Map with draggable pin */}
            <View style={{ flex: 1, position: 'relative' }}>
              <MapView
                ref={pickerMapRef}
                provider={MAP_PROVIDER}
                style={StyleSheet.absoluteFillObject}
                initialRegion={{ latitude: pinLat, longitude: pinLng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                onPress={(e: MapPressEvent) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setPinLat(latitude);
                  setPinLng(longitude);
                }}
              >
                <Marker
                  coordinate={{ latitude: pinLat, longitude: pinLng }}
                  draggable
                  onDragEnd={(e) => {
                    setPinLat(e.nativeEvent.coordinate.latitude);
                    setPinLng(e.nativeEvent.coordinate.longitude);
                  }}
                />
              </MapView>

              {/* Use Current Location FAB */}
              <TouchableOpacity
                style={{
                  position: 'absolute', top: 16, right: 16,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
                  borderWidth: 1, borderColor: T.border,
                }}
                onPress={() => {
                  const gpsLat = location.latitude;
                  const gpsLng = location.longitude;
                  setPinLat(gpsLat);
                  setPinLng(gpsLng);
                  setCustomAddress(null);
                  pickerMapRef.current?.animateToRegion({
                    latitude: gpsLat,
                    longitude: gpsLng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 800);
                }}
              >
                <MaterialIcons name="my-location" size={18} color={T.accent} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.accent }}>Current Location</Text>
              </TouchableOpacity>

              {/* Hint bar */}
              <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="info-outline" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 }}>Tap the map or drag the pin to set where the service will happen.</Text>
              </View>
            </View>

            {/* Address text override */}
            <View style={{ padding: 20, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: T.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Address Label (optional)</Text>
              <TextInput
                style={{
                  backgroundColor: T.bg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: T.border,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: T.text1,
                  fontWeight: '500',
                }}
                placeholder="e.g. 123 Main St, Apt 4B"
                placeholderTextColor={T.text3}
                value={customAddress ?? ""}
                onChangeText={setCustomAddress}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={{ marginTop: 12, backgroundColor: T.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
                onPress={() => {
                  setCustomLat(pinLat);
                  setCustomLng(pinLng);
                  setShowAddressPicker(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Use This Location</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* BOOKING DETAILS */}
        <FadeIn delay={200}>
          <View style={s.detailsCard}>
            <View style={s.serviceRow}>
              <View style={s.serviceIconBox}>
                <MaterialIcons name="cleaning-services" size={24} color={T.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.serviceName}>{displayService?.name || "Service"}</Text>
                <Text style={s.companyName}>{displayCompany?.name || "Verified Provider"}</Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.dateTimeRow}>
              <View style={s.dtBox}>
                <MaterialIcons name="event" size={16} color={T.text2} />
                <Text style={s.dtText}>{displayDate}</Text>
              </View>
              <View style={s.dtBox}>
                <MaterialIcons name="schedule" size={16} color={T.text2} />
                <Text style={s.dtText}>{displayTime}</Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* PAYMENT SUMMARY */}
        <FadeIn delay={300}>
          <View style={s.billingCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={s.billingTitle}>Total Payment</Text>
                <Text style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>Price to pay</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: T.accent }}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* ESCROW BUYER PROTECTION BANNER */}
        <FadeIn delay={350}>
          <View style={{
            backgroundColor: '#F0FDF4',
            borderWidth: 1,
            borderColor: '#BBF7D0',
            borderRadius: 16,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 16,
            marginBottom: 20
          }}>
            <EscrowShieldSvg size={38} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534' }}>
                Safe Escrow Protection
              </Text>
              <Text style={{ fontSize: 11, color: '#15803D', marginTop: 2, lineHeight: 15 }}>
                Funds are held safely in escrow and only released to the provider after you confirm the job is done.
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* PAYMENT METHODS */}
        <FadeIn delay={400}>
          <Text style={s.methodTitle}>Payment Method</Text>
          
          <TouchableOpacity 
            style={[s.methodCard, selectedMethod === 'aba' && s.methodCardActive]} 
            onPress={() => setSelectedMethod('aba')}
          >
            <View style={{ marginRight: 12 }}>
              <AbaPayWaySvg width={48} height={32} />
            </View>
            <Text style={[s.methodLabel, selectedMethod === 'aba' && s.methodLabelActive]}>ABA PayWay</Text>
            {selectedMethod === 'aba' && <MaterialIcons name="check-circle" size={24} color={T.accent} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.methodCard, selectedMethod === 'khqr' && s.methodCardActive, { marginTop: 12 }]} 
            onPress={() => setSelectedMethod('khqr')}
          >
            <View style={{ marginRight: 12 }}>
              <KhqrBakongSvg width={48} height={32} />
            </View>
            <Text style={[s.methodLabel, selectedMethod === 'khqr' && s.methodLabelActive]}>KHQR (Scan to Pay)</Text>
            {selectedMethod === 'khqr' && <MaterialIcons name="check-circle" size={24} color={T.accent} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.methodCard, selectedMethod === 'wing' && s.methodCardActive, { marginTop: 12 }]} 
            onPress={() => setSelectedMethod('wing')}
          >
            <View style={{ marginRight: 12 }}>
              <WingBankSvg width={48} height={32} />
            </View>
            <Text style={[s.methodLabel, selectedMethod === 'wing' && s.methodLabelActive]}>Wing Bank</Text>
            {selectedMethod === 'wing' && <MaterialIcons name="check-circle" size={24} color={T.accent} />}
          </TouchableOpacity>
        </FadeIn>

        {payError && <Text style={s.errorText}>{payError}</Text>}
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <View style={s.fabContainer}>
        <ScaleButton onPress={handleCreateAndPay} disabled={isProcessing}>
          <View style={[s.payBtn, isProcessing && { opacity: 0.7 }]}>
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={s.payBtnText}>Pay ${total.toFixed(2)}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
          </View>
        </ScaleButton>
      </View>

      {/* ABA WEBVIEW */}
      <Modal visible={!!abaHtml} transparent={false} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setAbaHtml(null)} style={s.backBtn}>
              <MaterialIcons name="close" size={24} color={T.text1} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>ABA PayWay</Text>
            <View style={{ width: 44 }} />
          </View>
          {abaHtml && (
            <WebView
              originWhitelist={['*']}
              source={{ html: abaHtml }}
              onNavigationStateChange={onAbaNavStateChange}
              style={{ flex: 1 }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* KHQR / ABA MODAL */}
      <Modal visible={!!khqrString} transparent={true} animationType="fade">
        <View style={s.khqrOverlay}>
          <View style={s.khqrCard}>
            <Text style={s.khqrTitle}>Scan QR to Pay</Text>
            <Text style={s.khqrAmount}>${khqrAmount}</Text>
            <View style={s.qrWrapper}>
              <QRCode value={khqrString || " "} size={190} />
            </View>
            <View style={{ alignItems: 'center', marginVertical: 8 }}>
              <PhoneScanIllustrationSvg width={200} height={90} />
            </View>
            <Text style={s.khqrSub}>Scan with ABA, ACLEDA, Canadia, Wing, or any Bakong banking app.</Text>
            
            {abaDeeplink && (
              <TouchableOpacity 
                style={s.abaButton} 
                onPress={() => Linking.openURL(abaDeeplink).catch(() => Alert.alert("Error", "ABA Mobile app not found."))}
              >
                <Text style={s.abaButtonText}>Pay with ABA Mobile</Text>
              </TouchableOpacity>
            )}

            <ActivityIndicator size="small" color={T.accent} style={{ marginTop: 12, marginBottom: 16 }} />
            <TouchableOpacity style={s.khqrClose} onPress={() => { setKhqrString(null); setAbaDeeplink(null); }}>
              <Text style={s.khqrCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POLLING OVERLAY */}
      <Modal visible={pollingActive && !khqrString} transparent={true} animationType="fade">
        <View style={s.khqrOverlay}>
          <View style={s.khqrCard}>
            <ActivityIndicator size="large" color={T.accent} style={{ marginBottom: 16 }} />
            <Text style={s.khqrTitle}>Waiting for Payment</Text>
            <Text style={s.khqrSub}>Please complete the payment in your banking app. This screen will close automatically upon success.</Text>
            <TouchableOpacity style={s.khqrClose} onPress={() => setPollingActive(false)}>
              <Text style={s.khqrCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SuccessOverlay 
        visible={showSuccess} 
        onFinish={() => {
          setShowSuccess(false);
          if (isInstant === "true") {
            router.replace({
              pathname: "/(customer)/map-view" as any,
              params: { bookingId, mode: "tracking" }
            });
          } else {
            router.replace("/(customer)/(tabs)/home" as any);
          }
        }} 
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: T.text1 },
  
  mapCard: { height: 160, borderRadius: 24, overflow: 'hidden', marginBottom: 24, ...CARD_SHADOW },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: T.surface, padding: 12, borderRadius: 16, ...CARD_SHADOW },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  addressLabel: { fontSize: 11, color: T.text3, fontWeight: '600' },
  addressText: { fontSize: 14, color: T.text1, fontWeight: '700' },
  addressBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: T.accentLight, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: T.accent + '30',
  },
  addressBannerText: { fontSize: 13, fontWeight: '700', color: T.accent, flex: 1 },

  detailsCard: { backgroundColor: T.surface, borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  serviceIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: T.accentLight, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 16, fontWeight: '800', color: T.text1 },
  companyName: { fontSize: 13, color: T.text2, marginTop: 4 },
  
  divider: { height: 1, backgroundColor: T.border, marginVertical: 16 },
  
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dtBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.bg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dtText: { fontSize: 13, fontWeight: '600', color: T.text2 },

  billingCard: { backgroundColor: T.surface, borderRadius: 24, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  billingTitle: { fontSize: 16, fontWeight: '800', color: T.text1, marginBottom: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLabel: { fontSize: 14, color: T.text2 },
  billValue: { fontSize: 14, fontWeight: '600', color: T.text1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '800', color: T.text1 },
  totalValue: { fontSize: 24, fontWeight: '900', color: T.accent },

  methodTitle: { fontSize: 16, fontWeight: '800', color: T.text1, marginBottom: 16 },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  methodCardActive: { borderColor: T.accent, backgroundColor: T.accentLight },
  methodIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  methodLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: T.text2 },
  methodLabelActive: { color: T.accent, fontWeight: '700' },

  fabContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, backgroundColor: T.bg },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.accent, borderRadius: 16, padding: 20 },
  payBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  
  errorText: { color: T.error, marginTop: 16, textAlign: 'center', fontWeight: '600' },

  khqrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  khqrCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%' },
  khqrTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  khqrAmount: { fontSize: 32, fontWeight: '900', color: T.accent, marginBottom: 24 },
  qrWrapper: { padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  khqrSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 24, lineHeight: 18 },
  khqrClose: { marginTop: 16, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 12, width: '100%', alignItems: 'center' },
  khqrCloseText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  abaButton: { marginTop: 20, paddingVertical: 14, paddingHorizontal: 24, backgroundColor: '#005370', borderRadius: 12, width: '100%', alignItems: 'center' },
  abaButtonText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});
