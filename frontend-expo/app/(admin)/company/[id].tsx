/**
 * Admin Company Details — Premium Light Redesign
 */
import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function CompanyDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCompany = async () => {
    try {
      const response = await api.get(`/api/companies/${id}`);
      const companyData = response.data.data || response.data;
      setCompany(companyData);
    } catch (error) {
      console.error("Failed to fetch company details:", error);
      Alert.alert("Error", "Could not load company details");
      router.back();
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const handleUpdateStatus = async (status: 'verified' | 'rejected') => {
    setIsUpdating(true);
    try {
      if (status === 'verified') {
        await api.post(`/api/admin/companies/${id}/verify`);
      } else {
        await api.post(`/api/admin/companies/${id}/reject`, { reason: "Admin rejected" });
      }
      Alert.alert("Success", `Company has been ${status}`);
      router.back();
    } catch (error: any) {
      console.error("Failed to update status:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to update company status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "verified": return { bg: "rgba(16, 185, 129, 0.1)", color: "#10B981", icon: "check-circle-outline" };
      case "pending": return { bg: "rgba(245, 158, 11, 0.1)", color: "#F59E0B", icon: "clock-alert-outline" };
      case "rejected": return { bg: "rgba(239, 68, 68, 0.1)", color: "#EF4444", icon: "close-circle-outline" };
      default: return { bg: T.border, color: T.text3, icon: "help-circle-outline" };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={s.centerArea} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={T.primary} />
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={s.centerArea} edges={['top', 'left', 'right']}>
        <ErrorState onRetry={fetchCompany} />
      </SafeAreaView>
    );
  }

  if (!company) return null;

  const isPending = company.verificationStatus === 'pending';
  const sStyle = getStatusStyle(company.verificationStatus);

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.contentScroll}>
        
        {/* Cover Image & Header Nav */}
        <View style={s.coverArea}>
          {company.coverImageUrl ? (
            <Image source={{ uri: company.coverImageUrl }} style={s.coverImage} contentFit="cover" />
          ) : (
            <View style={s.coverPlaceholder} />
          )}
          <View style={s.coverOverlay} />

          <SafeAreaView edges={['top']}>
            <View style={s.headerNav}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
                <MaterialCommunityIcons name={sStyle.icon as any} size={14} color={sStyle.color} style={{ marginRight: 6 }} />
                <Text style={[s.statusText, { color: sStyle.color }]}>{company.verificationStatus}</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Floating Profile Details */}
        <View style={s.profileHeader}>
          <View style={s.logoWrap}>
            {company.logoUrl ? (
              <Image source={{ uri: company.logoUrl }} style={s.logoImg} />
            ) : (
              <MaterialCommunityIcons name="domain" size={40} color={T.text3} />
            )}
          </View>
          
          <Text style={s.companyName}>{company.name}</Text>
          <Text style={s.companyReg}>Reg: {company.registrationNumber || "N/A"}</Text>

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{company.staff?.length || 0}</Text>
              <Text style={s.statLabel}>Staff</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{company.services?.length || 0}</Text>
              <Text style={s.statLabel}>Services</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{company.serviceAreas?.length || 0}</Text>
              <Text style={s.statLabel}>Areas</Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        {company.description && (
          <View style={s.card}>
            <Text style={s.cardTitle}>About</Text>
            <Text style={s.descText}>{company.description}</Text>
          </View>
        )}

        {/* Contact Info Grid */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Contact Details</Text>
          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <View style={s.iconCircle}><MaterialCommunityIcons name="account-outline" size={20} color={T.primary} /></View>
              <View>
                <Text style={s.infoLabelText}>Owner</Text>
                <Text style={s.infoText}>{company.owner?.fullName || 'N/A'}</Text>
              </View>
            </View>
            <View style={s.infoCell}>
              <View style={s.iconCircle}><MaterialCommunityIcons name="email-outline" size={20} color={T.primary} /></View>
              <View>
                <Text style={s.infoLabelText}>Email</Text>
                <Text style={s.infoText}>{company.owner?.email || 'N/A'}</Text>
              </View>
            </View>
            <View style={s.infoCell}>
              <View style={s.iconCircle}><MaterialCommunityIcons name="phone-outline" size={20} color={T.primary} /></View>
              <View>
                <Text style={s.infoLabelText}>Phone</Text>
                <Text style={s.infoText}>{company.phone || company.owner?.phone || 'N/A'}</Text>
              </View>
            </View>
            <View style={s.infoCell}>
              <View style={s.iconCircle}><MaterialCommunityIcons name="map-marker-outline" size={20} color={T.primary} /></View>
              <View>
                <Text style={s.infoLabelText}>Location</Text>
                <Text style={s.infoText}>{company.city || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Document */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Verification Document</Text>
          {company.verificationDocumentUrl ? (
            <TouchableOpacity
              style={s.docBtn}
              onPress={() => {
                Alert.alert(
                  "Verification Document",
                  `URL: ${company.verificationDocumentUrl}\n\nOpen this link in a browser to review.`,
                  [{ text: "OK" }]
                );
              }}
              activeOpacity={0.8}
            >
              <View style={s.docIconWrap}>
                <MaterialCommunityIcons name="file-document-outline" size={24} color={T.primary} />
              </View>
              <View style={s.docTextWrap}>
                <Text style={s.docBtnTitle}>Identity Document</Text>
                <Text style={s.docBtnSub}>Tap to view uploaded file</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
            </TouchableOpacity>
          ) : (
            <Text style={s.noneText}>No documents uploaded.</Text>
          )}
        </View>

        <View style={{ height: isPending ? 120 : 40 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar for Pending */}
      {isPending && (
        <View style={s.bottomActionBar}>
          <SafeAreaView edges={['bottom']}>
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, s.rejectBtn]}
                onPress={() => handleUpdateStatus('rejected')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? <ActivityIndicator color={T.error} /> : <Text style={s.rejectText}>Reject</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[s.actionBtn, s.approveBtn]}
                onPress={() => handleUpdateStatus('verified')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.approveText}>Verify Business</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  centerArea: { flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  root: { flex: 1, backgroundColor: T.bg },
  contentScroll: { paddingBottom: 20 },

  coverArea: { width: "100%", height: 220, position: "relative" },
  coverImage: { width: "100%", height: "100%", position: "absolute" },
  coverPlaceholder: { width: "100%", height: "100%", backgroundColor: T.primary, position: "absolute" },
  coverOverlay: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.4)" },
  
  headerNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255, 255, 255, 0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.3)" },
  
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: T.surface, ...CARD_SHADOW },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  profileHeader: { marginTop: -60, paddingHorizontal: 20, alignItems: "center" },
  logoWrap: { width: 100, height: 100, borderRadius: 32, backgroundColor: T.surface, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 4, borderColor: T.bg, marginBottom: 16, ...CARD_SHADOW },
  logoImg: { width: "100%", height: "100%" },
  companyName: { fontSize: 26, fontWeight: "700", color: T.text1, marginBottom: 4, textAlign: "center", letterSpacing: -0.5 },
  companyReg: { fontSize: 14, color: T.text3, marginBottom: 20, textAlign: "center" },

  statsRow: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, width: "100%", justifyContent: "space-around", borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: T.text1, marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: "600", color: T.text3, textTransform: "uppercase" },
  statDivider: { width: 1, height: "100%", backgroundColor: T.border },

  card: { backgroundColor: T.surface, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardTitle: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 16 },
  descText: { fontSize: 15, color: T.text2, lineHeight: 24 },

  infoGrid: { gap: 16 },
  infoCell: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(10, 25, 47, 0.05)", alignItems: "center", justifyContent: "center" },
  infoLabelText: { fontSize: 12, fontWeight: "600", color: T.text3, marginBottom: 2, textTransform: "uppercase" },
  infoText: { fontSize: 15, fontWeight: "700", color: T.text1 },

  docBtn: { flexDirection: "row", alignItems: "center", backgroundColor: T.bg, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: T.border },
  docIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(10, 25, 47, 0.05)", alignItems: "center", justifyContent: "center", marginRight: 16 },
  docTextWrap: { flex: 1 },
  docBtnTitle: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 2 },
  docBtnSub: { fontSize: 13, color: T.text3 },
  noneText: { fontSize: 15, color: T.text3, fontStyle: "italic" },

  bottomActionBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 0 : 20, ...CARD_SHADOW },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  rejectBtn: { borderColor: "rgba(239, 68, 68, 0.4)", backgroundColor: "rgba(239, 68, 68, 0.1)" },
  approveBtn: { borderColor: T.primary, backgroundColor: T.primary },
  rejectText: { fontSize: 16, fontWeight: "700", color: T.error },
  approveText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
