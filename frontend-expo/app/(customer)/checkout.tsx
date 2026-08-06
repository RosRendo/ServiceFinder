import React, { useState, useEffect } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator,
  StyleSheet, Modal, Platform, Dimensions,
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import FadeIn from "@/components/FadeIn";
import ScaleButton from "@/components/ScaleButton";

const T = Theme.colors;
const { width } = Dimensions.get('window');

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Accept EITHER an existing bookingId OR temp params from BottomSheet
  const { bookingId, serviceId, date, time, price, companyId } = useLocalSearchParams<{ 
    bookingId?: string; 
    serviceId?: string; 
    date?: string; 
    time?: string; 
    price?: string;
    companyId?: string; 
  }>();

  const { processAbaPayment } = usePayments();
  const [abaHtml, setAbaHtml] = useState<string | null>(null);
  const [wingUrl, setWingUrl] = useState<string | null>(null);
  
  // Booking State
  const [booking, setBooking] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  
  // UI State
  const [loading, setLoading] = useState(!!bookingId || !!serviceId);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  
  const [selectedMethod, setSelectedMethod] = useState<'aba' | 'khqr' | 'wing'>('aba');
  const [khqrString, setKhqrString] = useState<string | null>(null);
  const [khqrAmount, setKhqrAmount] = useState<string>("0.00");

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

  // Poll for payment success when KHQR or Wing is active
  useEffect(() => {
    let interval: any;
    if ((khqrString || wingUrl) && booking?.id) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/api/bookings/${booking.id}`);
          const b = res.data.data.booking ?? res.data.data;
          if (b.status === "confirmed") {
            setKhqrString(null);
            setWingUrl(null);
            setShowSuccess(true);
          }
        } catch (err) {
          // Ignore polling errors
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [khqrString, wingUrl, booking?.id]);

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
        const res = await api.post("/api/bookings", {
          serviceId, 
          companyId: service?.companyId || companyId || "", 
          bookingDate: bd.toISOString().split("T")[0],
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
        const res = await api.post('/api/payments/wing/checkout', { bookingId: activeBookingId });
        if (res.data.success && res.data.webPaymentUrl) {
          setWingUrl(res.data.webPaymentUrl);
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

    // ABA PayWay
    const result = await processAbaPayment(activeBookingId as string);
    if (result?.success && result?.data) {
      const html = `
        <html>
          <body onload="document.forms[0].submit()">
            <form method="POST" action="${result.data.url}">
              <input type="hidden" name="req_time" value="${result.data.req_time}" />
              <input type="hidden" name="merchant_id" value="${result.data.merchant_id}" />
              <input type="hidden" name="tran_id" value="${result.data.tran_id}" />
              <input type="hidden" name="amount" value="${result.data.amount}" />
              <input type="hidden" name="items" value='${result.data.items}' />
              <input type="hidden" name="hash" value="${result.data.hash}" />
              <input type="hidden" name="firstname" value="${result.data.firstname}" />
              <input type="hidden" name="lastname" value="${result.data.lastname}" />
              <input type="hidden" name="email" value="${result.data.email}" />
              <input type="hidden" name="phone" value="${result.data.phone}" />
              <input type="hidden" name="return_url" value="${result.data.return_url}" />
              <input type="hidden" name="continue_success_url" value="${result.data.continue_success_url}" />
            </form>
          </body>
        </html>
      `;
      setAbaHtml(html);
      setIsProcessing(false);
    } else {
      setPayError((result as any)?.message || "Payment initiation failed");
      setIsProcessing(false);
    }
  };

  const onAbaNavStateChange = (navState: any) => {
    if (navState.url.includes("success")) {
      setAbaHtml(null);
      setShowSuccess(true);
    } else if (navState.url.includes("fail") || navState.url.includes("cancel")) {
      setAbaHtml(null);
      setPayError("Payment was cancelled or failed.");
    }
  };

  const onWingNavStateChange = (navState: any) => {
    if (navState.url.includes("wing-success") || navState.url.includes("success")) {
      setWingUrl(null);
      setShowSuccess(true);
    } else if (navState.url.includes("wing-cancel") || navState.url.includes("cancel") || navState.url.includes("fail")) {
      setWingUrl(null);
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

  // Derive display values
  const displayService = booking?.service || service;
  const displayCompany = displayService?.company;
  const displayPrice = booking?.totalPrice || price || displayService?.basePrice || "0.00";
  const displayDate = booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : (date || "Today");
  const displayTime = booking?.startTime || (time || "ASAP");
  const displayAddress = booking?.serviceAddress || (user as any)?.city || "Local Address";
  
  // Tax & Fees Math
  const subtotal = Number(displayPrice);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

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
        
        {/* MAP SUMMARY */}
        <FadeIn delay={100}>
          <View style={s.mapCard}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={s.map}
              initialRegion={{
                latitude: 11.5564, longitude: 104.9282, // Phnom Penh
                latitudeDelta: 0.02, longitudeDelta: 0.02,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker coordinate={{ latitude: 11.5564, longitude: 104.9282 }} />
            </MapView>
            <View style={s.mapOverlay}>
              <View style={s.addressRow}>
                <View style={s.iconBox}><MaterialIcons name="location-on" size={20} color="#FFF" /></View>
                <View>
                  <Text style={s.addressLabel}>Service Location</Text>
                  <Text style={s.addressText}>{displayAddress}</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeIn>

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

        {/* BILLING SUMMARY */}
        <FadeIn delay={300}>
          <View style={s.billingCard}>
            <Text style={s.billingTitle}>Billing Summary</Text>
            
            <View style={s.billRow}>
              <Text style={s.billLabel}>Subtotal</Text>
              <Text style={s.billValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={s.billRow}>
              <Text style={s.billLabel}>Platform Fee (5%)</Text>
              <Text style={s.billValue}>${tax.toFixed(2)}</Text>
            </View>
            
            <View style={s.divider} />
            
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>${total.toFixed(2)}</Text>
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
            <View style={s.methodIconBox}>
              <MaterialIcons name="credit-card" size={24} color={selectedMethod === 'aba' ? '#FFF' : T.text2} />
            </View>
            <Text style={[s.methodLabel, selectedMethod === 'aba' && s.methodLabelActive]}>ABA PayWay</Text>
            {selectedMethod === 'aba' && <MaterialIcons name="check-circle" size={24} color={T.accent} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.methodCard, selectedMethod === 'khqr' && s.methodCardActive, { marginTop: 12 }]} 
            onPress={() => setSelectedMethod('khqr')}
          >
            <View style={s.methodIconBox}>
              <MaterialIcons name="qr-code-scanner" size={24} color={selectedMethod === 'khqr' ? '#FFF' : T.text2} />
            </View>
            <Text style={[s.methodLabel, selectedMethod === 'khqr' && s.methodLabelActive]}>KHQR (Scan to Pay)</Text>
            {selectedMethod === 'khqr' && <MaterialIcons name="check-circle" size={24} color={T.accent} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.methodCard, selectedMethod === 'wing' && s.methodCardActive, { marginTop: 12 }]} 
            onPress={() => setSelectedMethod('wing')}
          >
            <View style={s.methodIconBox}>
              <MaterialIcons name="account-balance-wallet" size={24} color={selectedMethod === 'wing' ? '#FFF' : T.text2} />
            </View>
            <Text style={[s.methodLabel, selectedMethod === 'wing' && s.methodLabelActive]}>Wing KHQR</Text>
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

      {/* WING WEBVIEW */}
      <Modal visible={!!wingUrl} transparent={false} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setWingUrl(null)} style={s.backBtn}>
              <MaterialIcons name="close" size={24} color={T.text1} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Wing Bank KHQR</Text>
            <View style={{ width: 44 }} />
          </View>
          {wingUrl && (
            <WebView
              source={{ uri: wingUrl }}
              onNavigationStateChange={onWingNavStateChange}
              style={{ flex: 1 }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* KHQR MODAL */}
      <Modal visible={!!khqrString} transparent={true} animationType="fade">
        <View style={s.khqrOverlay}>
          <View style={s.khqrCard}>
            <Text style={s.khqrTitle}>Scan KHQR to Pay</Text>
            <Text style={s.khqrAmount}>${khqrAmount}</Text>
            <View style={s.qrWrapper}>
              <QRCode value={khqrString || " "} size={200} />
            </View>
            <Text style={s.khqrSub}>Open your banking app and scan to complete the payment. Waiting for confirmation...</Text>
            <ActivityIndicator size="small" color={T.accent} style={{ marginTop: 12, marginBottom: 16 }} />
            <TouchableOpacity style={s.khqrClose} onPress={() => setKhqrString(null)}>
              <Text style={s.khqrCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SuccessOverlay 
        visible={showSuccess} 
        onFinish={() => {
          setShowSuccess(false);
          router.replace("/(customer)/(tabs)/home" as any);
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
  khqrClose: { marginTop: 24, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 12, width: '100%', alignItems: 'center' },
  khqrCloseText: { fontSize: 14, fontWeight: '700', color: '#374151' }
});
