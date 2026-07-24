/**
 * Checkout / Confirm to Pay Screen
 * Fixes:
 *  - Styled inline error card (no bare Alert) with retry CTA
 *  - WebView in fullScreen Modal to prevent back-nav during payment
 *  - Migrated to Theme constants
 */
import React, { useState, useEffect } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, Alert, ActivityIndicator,
  StyleSheet, Modal, Platform,
} from "react-native";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { usePayments } from "@/hooks/usePayments";
import SuccessOverlay from "@/components/SuccessOverlay";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/currency";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function CheckoutScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();

  const { processAbaPayment } = usePayments();
  const [abaHtml, setAbaHtml] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(!!bookingId);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      try {
        const res = await api.get(`/api/bookings/${bookingId}`);
        const d = res.data;
        const extracted = d?.data?.booking ?? d?.data ?? d;
        setBooking(extracted);
      } catch { }
      finally { setLoading(false); }
    })();
  }, [bookingId]);

  const handlePay = async () => {
    if (!bookingId) {
      setPayError("No booking found. Please go back and try again.");
      return;
    }
    setPayError(null);
    setIsProcessing(true);

    const result = await processAbaPayment(bookingId);
    if (result?.success && result?.data) {
      const d = result.data;
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, sans-serif; background: #0A192F; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .loader { border: 4px solid rgba(255,255,255,0.1); border-left-color: #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body onload="document.forms[0].submit()">
            <div style="text-align: center;">
              <div class="loader"></div>
              <h2>Generating KHQR...</h2>
            </div>
            <form action="${d.url}" method="POST" style="display: none;">
              ${Object.keys(d.body).map(k => `<input type="hidden" name="${k}" value="${d.body[k]}" />`).join("")}
            </form>
          </body>
        </html>
      `;
      setAbaHtml(html);
    } else {
      // Show styled inline error card instead of bare Alert
      setPayError(result?.error || "Failed to initialize payment gateway. Please try again.");
    }
    setIsProcessing(false);
  };

  const total = booking?.service?.basePrice != null ? Number(booking.service.basePrice) : 0;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>KHQR Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.container}>

          {/* ── PAYMENT ERROR CARD ─────────────────────────────── */}
          {payError && (
            <View style={s.errorCard}>
              <View style={s.errorIconWrap}>
                <MaterialCommunityIcons name="alert-circle-outline" size={22} color={T.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.errorTitle}>Payment Failed</Text>
                <Text style={s.errorMessage}>{payError}</Text>
              </View>
              <TouchableOpacity onPress={() => setPayError(null)} style={s.errorDismiss}>
                <MaterialCommunityIcons name="close" size={18} color={T.error} />
              </TouchableOpacity>
            </View>
          )}

          {/* Order Summary */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('checkout.orderSummary')}</Text>
            <View style={s.summaryCard}>
              <View style={s.summaryTopRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.summaryServiceName}>{booking?.service?.name ?? t('checkout.serviceBooking')}</Text>
                  <Text style={s.summaryServiceSub}>{booking?.company?.name ?? ""}</Text>
                </View>
                <Text style={s.summaryPriceMassive}>{formatCurrency(total, i18n.language)}</Text>
              </View>

              <View style={s.summaryDivider} />

              <View style={s.summaryRow}>
                <Text style={s.summaryRowLabel}>{t('checkout.serviceBase')}</Text>
                <Text style={s.summaryRowValue}>{formatCurrency(total, i18n.language)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('booking.paymentMethod')}</Text>
            <View style={s.payCardActive}>
              <View style={s.payIconBoxActive}>
                <MaterialCommunityIcons name="qrcode-scan" size={24} color="#fff" />
              </View>
              <View style={s.payInfo}>
                <Text style={s.payTitleActive}>{t('checkout.khqrBakong')}</Text>
                <Text style={s.payDesc}>{t('checkout.universalQr')}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Footer */}
      {!loading && (
        <View style={s.stickyFooter}>
          <TouchableOpacity onPress={handlePay} style={s.footerBtnNext} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : (
              <Text style={s.footerBtnNextText}>{t('checkout.generateKhqr')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── FULLSCREEN WEBVIEW MODAL — prevents back navigation during payment ── */}
      <Modal
        visible={!!abaHtml}
        animationType="slide"
        transparent={false}
        presentationStyle="fullScreen"
        onRequestClose={() => {
          Alert.alert(
            "Cancel Payment?",
            "Your payment is in progress. Are you sure you want to cancel?",
            [
              { text: "Stay", style: "cancel" },
              { text: "Cancel Payment", style: "destructive", onPress: () => setAbaHtml(null) },
            ]
          );
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Cancel Payment?",
                  "Your payment is in progress. Are you sure you want to cancel?",
                  [
                    { text: "Stay", style: "cancel" },
                    { text: "Cancel Payment", style: "destructive", onPress: () => setAbaHtml(null) },
                  ]
                );
              }}
              style={s.backBtn}
            >
              <MaterialCommunityIcons name="close" size={28} color={T.text1} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>{t('checkout.scanToPay')}</Text>
            <View style={{ width: 40 }} />
          </View>
          {abaHtml && (
            <WebView
              source={{ html: abaHtml }}
              style={{ flex: 1 }}
              originWhitelist={['*']}
              onNavigationStateChange={(navState) => {
                if (navState.url.includes('/payment/aba-success')) {
                  setAbaHtml(null);
                  setShowSuccess(true);
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      <SuccessOverlay
        visible={showSuccess}
        onFinish={() => {
          setShowSuccess(false);
          router.replace(`/(customer)/booking/confirmation?bookingId=${bookingId}` as any);
        }}
        message={t('checkout.paymentSuccessful')}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { flexGrow: 1, padding: 24, paddingBottom: 120 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },

  // ── Error Card ──────────────────────────────────────────────
  errorCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: T.errorBg, borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: T.error + "30",
  },
  errorIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: T.error + "15",
    alignItems: "center", justifyContent: "center",
  },
  errorTitle: { fontSize: 14, fontWeight: "800", color: T.error, marginBottom: 4 },
  errorMessage: { fontSize: 13, fontWeight: "500", color: "#991B1B", lineHeight: 18 },
  errorDismiss: { padding: 4, marginTop: -2 },

  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 14, fontWeight: "800", color: T.text3,
    letterSpacing: 1, marginBottom: 12, textTransform: "uppercase",
  },
  summaryCard: { backgroundColor: T.accent, borderRadius: 24, padding: 24 },
  summaryTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  summaryServiceName: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 6 },
  summaryServiceSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  summaryPriceMassive: { fontSize: 28, fontWeight: "800", color: "#fff" },
  summaryDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 20 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  summaryRowLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  summaryRowValue: { fontSize: 14, fontWeight: "700", color: "#fff" },

  payCardActive: {
    flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16,
    borderWidth: 2, borderColor: T.accent, backgroundColor: T.accentLight, gap: 12,
  },
  payIconBoxActive: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: T.accent,
    alignItems: "center", justifyContent: "center",
  },
  payInfo: { flex: 1 },
  payTitleActive: { fontSize: 15, fontWeight: "800", color: T.accent, marginBottom: 4 },
  payDesc: { fontSize: 12, color: T.text2, fontWeight: "500" },

  stickyFooter: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1, borderTopColor: T.border,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } }, android: { elevation: 8 } }),
  },
  footerBtnNext: {
    backgroundColor: T.accent, borderRadius: 16,
    paddingVertical: 18, alignItems: "center", justifyContent: "center",
  },
  footerBtnNextText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
});
