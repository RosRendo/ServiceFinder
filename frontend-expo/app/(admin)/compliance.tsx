/**
 * Admin Legal Compliance & Credential Verification — Enterprise Clean Business Redesign
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Linking, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import ErrorState from "@/components/common/ErrorState";

type ComplianceStatus = "pending_review" | "approved" | "rejected" | "expired";

interface ComplianceDocument {
  id: string;
  companyId: string;
  companyName: string;
  documentType: "insurance" | "license" | "id_verification" | "background_check";
  documentUrl: string;
  status: ComplianceStatus;
  submittedAt: string;
  expiresAt?: string;
  notes?: string;
}

export default function ComplianceUI() {
  const router = useRouter();
  const [docs, setDocs] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ComplianceStatus>("pending_review");

  const fetchDocs = async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get(`/api/admin/compliance`, { params: { status: filter } });
      const data = res.data?.data || res.data || [];
      setDocs(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch {
      setDocs([]);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [filter]);

  const updateStatus = async (id: string, newStatus: ComplianceStatus) => {
    try {
      await api.patch(`/api/admin/compliance/${id}`, { status: newStatus });
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "insurance": return "Commercial Liability Insurance";
      case "license": return "Trade & Business License";
      case "id_verification": return "Director ID Verification";
      case "background_check": return "Criminal Background Audit";
      default: return "Verification Document";
    }
  };

  const renderDoc = ({ item }: { item: ComplianceDocument }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardTextWrap}>
          <Text style={s.docType}>{getTypeLabel(item.documentType)}</Text>
          <Text style={s.companyName}>{item.companyName}</Text>
          <Text style={s.submittedText}>
            Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "—"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => Linking.openURL(item.documentUrl).catch(() => {})}
          style={s.fileBtn}
          accessibilityRole="button"
          accessibilityLabel="Open File"
        >
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {item.status === "pending_review" && (
        <View style={s.actionRow}>
          <TouchableOpacity
            onPress={() => updateStatus(item.id, "rejected")}
            style={s.rejectBtn}
          >
            <Text style={s.rejectText}>Reject Document</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateStatus(item.id, "approved")}
            style={s.approveBtn}
          >
            <Text style={s.approveText}>Approve & Verify</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Legal & Compliance Audits</Text>
            <Text style={s.headerSubtitle}>Provider Licenses, Insurance & Credentials</Text>
          </View>
        </View>
      </View>

      {/* Segmented Filter Tabs */}
      <View style={s.filterRow}>
        {(["pending_review", "approved", "expired"] as ComplianceStatus[]).map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            style={[
              s.filterBtn,
              filter === status ? s.filterBtnActive : s.filterBtnInactive
            ]}
          >
            <Text style={[
              s.filterText,
              filter === status ? s.filterTextActive : s.filterTextInactive
            ]}>
              {status.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={s.loadingText}>Fetching compliance dossiers…</Text>
        </View>
      ) : hasError ? (
        <ErrorState onRetry={() => fetchDocs()} />
      ) : (
        <FlatList
          data={docs}
          keyExtractor={item => item.id}
          renderItem={renderDoc}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDocs(true)}
              tintColor="#0F172A"
            />
          }
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="file-check-outline" size={48} color="#94A3B8" />
              <Text style={s.emptyTitle}>Zero Pending Documents</Text>
              <Text style={s.emptyDesc}>
                No documents found in {filter.replace('_', ' ')} status.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", fontWeight: "500", marginTop: 1 },

  filterRow: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#0F172A",
  },
  filterBtnInactive: {
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
  },
  filterText: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.3,
  },
  filterTextActive: { color: "#FFFFFF" },
  filterTextInactive: { color: "#64748B" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80, gap: 12 },
  loadingText: { fontSize: 13, color: "#64748B" },
  listContent: { padding: 16, paddingBottom: 120, gap: 12 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTextWrap: { flex: 1, marginRight: 12 },
  docType: {
    fontSize: 11, fontWeight: "700", color: "#64748B",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
  },
  companyName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  submittedText: { fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: "500" },

  fileBtn: {
    width: 38, height: 38, backgroundColor: "#F8FAFC", borderRadius: 10,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0",
  },

  actionRow: {
    flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: "#E2E8F0",
    paddingTop: 12, marginTop: 8,
  },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  rejectText: { color: "#DC2626", fontWeight: "700", fontSize: 12 },
  approveBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#0F172A", alignItems: "center",
  },
  approveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 12 },
  emptyDesc: { fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 6, lineHeight: 18 },
});
