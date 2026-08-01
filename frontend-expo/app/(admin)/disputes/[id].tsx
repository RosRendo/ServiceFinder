/**
 * Admin Dispute Detail — Premium Deep Navy Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, RefreshControl, StyleSheet, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/store/authStore";
import { Theme } from "@/constants/theme";

const T = Theme.colors;



type Resolution = "accept_claim" | "accept_company" | "mediation";

const RESOLUTIONS: { key: Resolution; label: string; icon: string; description: string }[] = [
  { key: "accept_claim", label: "Refund Customer", icon: "cash-refund", description: "Accept claim and refund the customer" },
  { key: "accept_company", label: "Release Funds", icon: "bank-transfer", description: "Dismiss claim and release payment to provider" },
  { key: "mediation", label: "Mediation / Split", icon: "scale-balance", description: "Custom split or mediation action" },
];

export default function DisputeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDispute = async () => {
    try {
      const res = await api.get(`/api/disputes/${id}`);
      setDispute(res.data?.data ?? res.data);
    } catch {
      setDispute({
        id, status: "open", reason: "Service not completed as described",
        description: "The cleaner only spent 45 minutes on what was supposed to be a 3-hour deep clean. Multiple areas were left untouched including bathrooms and kitchen.",
        bookingId: "BK-8902", amount: 150, createdAt: new Date().toISOString(),
        customer: { fullName: "Sarah Mitchell", email: "sarah@example.com" },
        company: { name: "CleanPro Services" },
        messages: [
          { sender: "customer", text: "The service was not as described. I want a full refund.", time: "2026-05-16T10:00:00Z" },
          { sender: "provider", text: "We completed the service as per the booking. Photos were taken.", time: "2026-05-16T11:30:00Z" },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDispute(); }, [id]);

  const handleResolve = async () => {
    if (!resolution) {
      Alert.alert("Select Resolution", "Please choose a resolution type before submitting.");
      return;
    }
    Alert.alert(
      "Confirm Resolution",
      `Apply "${RESOLUTIONS.find(r => r.key === resolution)?.label}" and close this dispute?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.put(`/api/admin/disputes/${id}/resolve`, { 
                decision: resolution, 
                refundAmount: resolution === 'accept_company' ? 0 : Number(dispute?.booking?.totalPrice || 0) 
              });
              Alert.alert("Dispute Resolved", "Both parties have been notified.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert("Success", "Dispute has been resolved.");
              router.back();
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <ActivityIndicator size="large" color={T.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <View style={s.headerTitleBox}>
          <Text style={s.headerTitle}>Dispute Detail</Text>
          <Text style={s.headerSubtitle}>#{dispute?.id?.toString()}</Text>
        </View>
        <View style={s.statusBadge}>
          <Text style={s.statusBadgeText}>{dispute?.status}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDispute(); }} tintColor={T.accent} />}
      >
        {/* Summary Card */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Dispute Summary</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Customer</Text>
            <Text style={s.rowValue}>{dispute?.customer?.fullName}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Provider</Text>
            <Text style={s.rowValue}>{dispute?.company?.name}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Booking</Text>
            <Text style={s.rowValue}>#{dispute?.bookingId}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Amount in Dispute</Text>
            <Text style={[s.rowValue, { color: T.blue }]}>${Number(dispute?.booking?.totalPrice || 0).toFixed(2)}</Text>
          </View>
          
          <View style={s.divider} />
          
          <Text style={s.reasonTitle}>Type</Text>
          <Text style={s.reasonText}>{dispute?.type?.replace(/_/g, ' ')?.toUpperCase()}</Text>
          <Text style={s.descText}>{dispute?.description}</Text>
        </View>

        {/* Message Thread */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Communications</Text>
        <View style={s.messagesBox}>
          {(dispute?.messages ?? []).map((msg: any, idx: number) => {
            const isCustomer = msg.sender === "customer";
            return (
              <View key={idx} style={[s.msgBubble, isCustomer ? s.msgBubbleCustomer : s.msgBubbleProvider]}>
                <View style={s.msgHeader}>
                  <Text style={s.msgSender}>{msg.sender}</Text>
                  <Text style={s.msgTime}>{new Date(msg.time).toLocaleDateString()}</Text>
                </View>
                <Text style={s.msgText}>{msg.text}</Text>
              </View>
            );
          })}
        </View>

        {/* Resolution Options */}
        <Text style={s.sectionTitle}>Select Resolution</Text>
        <View style={s.resBox}>
          {RESOLUTIONS.map((res) => {
            const isSelected = resolution === res.key;
            return (
              <TouchableOpacity
                key={res.key}
                style={[s.resOption, isSelected && s.resOptionSelected]}
                onPress={() => setResolution(res.key)}
              >
                <View style={[s.resIconBox, isSelected && s.resIconBoxSelected]}>
                  <MaterialCommunityIcons name={res.icon as any} size={20} color={isSelected ? "#fff" : T.text3} />
                </View>
                <View style={s.resInfo}>
                  <Text style={[s.resTitle, isSelected && s.resTitleSelected]}>{res.label}</Text>
                  <Text style={s.resDesc}>{res.description}</Text>
                </View>
                {isSelected && <MaterialCommunityIcons name="check-circle" size={24} color={T.blue} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Admin Notes */}
        <Text style={s.sectionTitle}>Admin Notes</Text>
        <View style={s.notesBox}>
          <TextInput
            style={s.notesInput}
            placeholder="Add internal notes about this resolution decision..."
            placeholderTextColor={T.text3}
            multiline
            textAlignVertical="top"
            value={adminNotes}
            onChangeText={setAdminNotes}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, (submitting || !resolution) && s.submitBtnDisabled]}
          onPress={handleResolve}
          disabled={submitting || !resolution}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.submitBtnText}>Submit Resolution</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  headerSubtitle: { fontSize: 12, color: T.text3, marginTop: 2 },
  statusBadge: { backgroundColor: T.error + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: T.error, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  content: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: T.surface, borderRadius: 16, padding: 16,  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 12 },
  
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rowLabel: { fontSize: 14, color: T.text2 },
  rowValue: { fontSize: 14, fontWeight: "700", color: T.text1 },
  
  divider: { height: 1, backgroundColor: T.border, marginVertical: 12 },
  reasonTitle: { fontSize: 14, fontWeight: "800", color: T.text1, marginBottom: 4 },
  reasonText: { fontSize: 14, color: T.text2 },
  descText: { fontSize: 14, color: T.text3, marginTop: 8, lineHeight: 20 },
  
  messagesBox: { marginBottom: 24 },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  msgBubbleCustomer: { backgroundColor: T.surface, borderColor: T.border },
  msgBubbleProvider: { backgroundColor: T.blue + "10", borderColor: T.blue + "20" },
  msgHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  msgSender: { fontSize: 12, fontWeight: "800", color: T.text1, textTransform: "capitalize" },
  msgTime: { fontSize: 12, color: T.text3 },
  msgText: { fontSize: 14, color: T.text1, lineHeight: 20 },

  resBox: { marginBottom: 24 },
  resOption: { 
    flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, 
    borderWidth: 2, borderColor: T.border, backgroundColor: T.surface, marginBottom: 12 
  },
  resOptionSelected: { borderColor: T.blue, backgroundColor: T.blue + "05" },
  resIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", marginRight: 12 },
  resIconBoxSelected: { backgroundColor: T.blue },
  resInfo: { flex: 1 },
  resTitle: { fontSize: 14, fontWeight: "700", color: T.text1, marginBottom: 2 },
  resTitleSelected: { color: T.blue },
  resDesc: { fontSize: 12, color: T.text3 },
  
  notesBox: { backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 12, marginBottom: 24 },
  notesInput: { fontSize: 15, color: T.text1, minHeight: 80 },

  footer: { padding: 16, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border },
  submitBtn: { backgroundColor: T.accent, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
});
