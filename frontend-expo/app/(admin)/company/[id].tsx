/**
 * Admin Company Details — Premium Deep Navy Redesign (Unified Architecture)
 */
import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function CompanyDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      case "verified": return { bg: T.success + "15", color: T.success, icon: "check-decagram" };
      case "pending": return { bg: T.warning + "15", color: T.warning, icon: "clock-alert-outline" };
      case "rejected": return { bg: T.error + "15", color: T.error, icon: "close-circle-outline" };
      default: return { bg: T.bg, color: T.text3, icon: "help-circle-outline" };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={s.centerArea} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  if (!company) return null;

  const isVerified = company.verificationStatus === 'verified';
  const isRejected = company.verificationStatus === 'rejected';
  const sStyle = getStatusStyle(company.verificationStatus);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Company Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        
        {/* Hero Card */}
        <View style={s.heroCard}>
          <View style={s.coverWrap}>
            {company.coverImageUrl ? (
              <Image source={{ uri: company.coverImageUrl }} style={s.coverImage} />
            ) : (
              <View style={s.coverPlaceholder}>
                <MaterialCommunityIcons name="image-outline" size={36} color={T.text3} />
              </View>
            )}
          </View>
          <View style={s.logoWrap}>
            {company.logoUrl ? (
              <Image source={{ uri: company.logoUrl }} style={s.logoImg} />
            ) : (
              <MaterialCommunityIcons name="domain" size={40} color={T.text3} />
            )}
          </View>

          <View style={s.heroInfo}>
            <Text style={s.companyName}>{company.name}</Text>
            <View style={s.ratingRow}>
              <MaterialCommunityIcons name="star" size={18} color={T.warning} />
              <Text style={s.ratingText}>
                {company.ratingSummary?.averageRating || "N/A"} 
                <Text style={s.reviewCountText}> ({company.ratingSummary?.totalReviews || 0} reviews)</Text>
              </Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: sStyle.bg }]}>
              <MaterialCommunityIcons name={sStyle.icon as any} size={16} color={sStyle.color} style={{ marginRight: 6 }} />
              <Text style={[s.statusText, { color: sStyle.color }]}>{company.verificationStatus}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="account-group-outline" size={24} color={T.accentMid} style={{ marginBottom: 4 }} />
            <Text style={s.statValue}>{company.staff?.length || 0}</Text>
            <Text style={s.statLabel}>Staff</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="briefcase-outline" size={24} color={T.success} style={{ marginBottom: 4 }} />
            <Text style={s.statValue}>{company.services?.length || 0}</Text>
            <Text style={s.statLabel}>Services</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={24} color={T.warning} style={{ marginBottom: 4 }} />
            <Text style={s.statValue}>{company.serviceAreas?.length || 0}</Text>
            <Text style={s.statLabel}>Areas</Text>
          </View>
        </View>

        {/* Description */}
        {company.description && (
          <View style={s.card}>
            <Text style={s.cardTitle}>About Company</Text>
            <Text style={s.descText}>{company.description}</Text>
          </View>
        )}

        {/* Owner & Contact */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Contact Details</Text>
          <View style={s.infoList}>
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}><MaterialCommunityIcons name="account-outline" size={20} color={T.accentMid} /></View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoLabelText}>Owner</Text>
                <Text style={s.infoText}>{company.owner?.fullName || 'N/A'}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}><MaterialCommunityIcons name="email-outline" size={20} color={T.accentMid} /></View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoLabelText}>Email</Text>
                <Text style={s.infoText}>{company.owner?.email || 'N/A'}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}><MaterialCommunityIcons name="phone-outline" size={20} color={T.accentMid} /></View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoLabelText}>Phone</Text>
                <Text style={s.infoText}>{company.phone || company.owner?.phone || 'N/A'}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}><MaterialCommunityIcons name="map-marker-outline" size={20} color={T.accentMid} /></View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoLabelText}>Location</Text>
                <Text style={s.infoText}>{company.address ? `${company.address}, ` : ''}{company.city || 'N/A'}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}><MaterialCommunityIcons name="identifier" size={20} color={T.accentMid} /></View>
              <View style={s.infoTextWrap}>
                <Text style={s.infoLabelText}>Registration ID</Text>
                <Text style={s.infoText}>{company.registrationNumber || 'None'}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Coverage Areas */}
        {company.serviceAreas?.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Coverage Areas</Text>
            <View style={s.tagList}>
              {company.serviceAreas.map((area: any, idx: number) => (
                <View key={idx} style={s.tag}>
                  <MaterialCommunityIcons name="map-marker-radius" size={14} color={T.blue} />
                  <Text style={s.tagText}>{area.city} ({area.coverageRadiusKm}km)</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Services Offered */}
        {company.services?.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Services Offered</Text>
            <View style={s.tagList}>
              {company.services.map((service: any) => (
                <View key={service.id} style={s.tagAlt}>
                  <Text style={s.tagTextAlt}>{service.name || service.serviceType?.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Verification Document */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Verification Document</Text>
          {company.verificationDocumentUrl ? (
            <TouchableOpacity
              style={s.docBtn}
              onPress={() => {
                Alert.alert(
                  "Verification Document",
                  `URL: ${company.verificationDocumentUrl}\n\nOpen this link in a browser to review the document.`,
                  [{ text: "OK" }]
                );
              }}
            >
              <View style={s.docBtnIconBox}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color={T.blue} />
              </View>
              <Text style={s.docBtnText}>View Document</Text>
              <MaterialCommunityIcons name="open-in-new" size={18} color={T.text3} />
            </TouchableOpacity>
          ) : (
            <View style={s.docMissing}>
              <MaterialCommunityIcons name="file-alert-outline" size={20} color={T.warning} />
              <Text style={s.docMissingText}>No verification document provided</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Footer Actions */}
      {company.verificationStatus === 'pending' && (
        <View style={s.footerActions}>
          <TouchableOpacity
            style={[s.footerBtnReject, isUpdating && { opacity: 0.5 }]}
            onPress={() => handleUpdateStatus('rejected')}
            disabled={isUpdating}
          >
            <Text style={s.footerBtnRejectText}>Reject</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[s.footerBtnApprove, isUpdating && { opacity: 0.5 }]}
            onPress={() => handleUpdateStatus('verified')}
            disabled={isUpdating}
          >
            <Text style={s.footerBtnApproveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  centerArea: { flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  headerBtn: { padding: 4, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  content: { padding: 16, gap: 16, paddingBottom: 60 },

  heroCard: { backgroundColor: T.surface, borderRadius: 24, paddingBottom: 24, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW, overflow: "hidden" },
  coverWrap: { width: "100%", height: 140, backgroundColor: T.bg },
  coverImage: { width: "100%", height: "100%" },
  coverPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: T.bg },
  logoWrap: { width: 96, height: 96, borderRadius: 28, backgroundColor: T.surface, borderWidth: 4, borderColor: T.surface, position: "absolute", top: 92, left: 24, alignItems: "center", justifyContent: "center", overflow: "hidden", ...CARD_SHADOW },
  logoImg: { width: "100%", height: "100%" },
  heroInfo: { marginTop: 60, paddingHorizontal: 24 },
  companyName: { fontSize: 24, fontWeight: "800", color: T.text1, marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  ratingText: { fontSize: 15, fontWeight: "700", color: T.text1 },
  reviewCountText: { color: T.text3, fontWeight: "500" },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: "flex-start" },
  statusText: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },

  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: T.surface, borderRadius: 24, padding: 20, alignItems: "center", borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  statValue: { fontSize: 24, fontWeight: "800", color: T.text1, marginBottom: 2 },
  statLabel: { fontSize: 12, color: T.text3, fontWeight: "600", textTransform: "uppercase" },

  card: { backgroundColor: T.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: T.border, gap: 20, ...CARD_SHADOW },
  cardTitle: { fontSize: 16, fontWeight: "800", color: T.text1 },
  descText: { fontSize: 15, color: T.text2, lineHeight: 24, fontWeight: "500" },

  infoList: { gap: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  infoIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.blue + "10", alignItems: "center", justifyContent: "center" },
  infoTextWrap: { flex: 1 },
  infoLabelText: { fontSize: 12, fontWeight: "600", color: T.text3, marginBottom: 2, textTransform: "uppercase" },
  infoText: { fontSize: 15, fontWeight: "700", color: T.text1 },

  tagList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.blue + "15", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  tagText: { fontSize: 14, fontWeight: "700", color: T.blue },
  tagAlt: { backgroundColor: T.bg, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  tagTextAlt: { fontSize: 14, fontWeight: "600", color: T.text2 },

  docBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.bg, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: T.border },
  docBtnIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.blue + "15", alignItems: "center", justifyContent: "center" },
  docBtnText: { flex: 1, fontSize: 15, fontWeight: "700", color: T.text1 },
  docMissing: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, backgroundColor: T.warning + "15", borderRadius: 16 },
  docMissingText: { fontSize: 15, color: T.warning, fontWeight: "700" },

  footerActions: { flexDirection: "row", gap: 12, padding: 16, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border },
  footerBtnReject: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", backgroundColor: T.error + "15", borderWidth: 1, borderColor: T.error + "30" },
  footerBtnRejectText: { color: T.error, fontSize: 16, fontWeight: "800" },
  footerBtnApprove: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", backgroundColor: T.accent },
  footerBtnApproveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
