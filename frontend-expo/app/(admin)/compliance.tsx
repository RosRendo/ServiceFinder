import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/common/ErrorState";

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

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
      setDocs(res.data?.data || res.data || []);
    } catch (err) {
      setDocs([]);
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
      case "insurance": return "Liability Insurance";
      case "license": return "Business License";
      case "id_verification": return "ID Verification";
      case "background_check": return "Background Check";
      default: return "Document";
    }
  };

  const renderDoc = ({ item }: { item: ComplianceDocument }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardTextWrap}>
          <Text style={s.docType}>{getTypeLabel(item.documentType)}</Text>
          <Text style={s.companyName}>{item.companyName}</Text>
          <Text style={s.submittedText}>
            Submitted: {new Date(item.submittedAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => Linking.openURL(item.documentUrl).catch(() => {})}
          style={s.fileBtn}
        >
          <MaterialCommunityIcons name="file-document-outline" size={24} color={T.primary} />
        </TouchableOpacity>
      </View>

      {item.status === "pending_review" && (
        <View style={s.actionRow}>
          <TouchableOpacity 
            onPress={() => updateStatus(item.id, "rejected")}
            style={s.rejectBtn}
          >
            <Text style={s.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => updateStatus(item.id, "approved")}
            style={s.approveBtn}
          >
            <Text style={s.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Compliance Tracker</Text>
      </View>

      {/* Filters */}
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
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        hasError ? (
          <ErrorState onRetry={() => fetchDocs()} />
        ) : (
        <FlatList
          data={docs}
          keyExtractor={item => item.id}
          renderItem={renderDoc}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDocs(true)} tintColor={T.primary} />}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="file-check-outline" size={48} color={T.text3} />
              <Text style={s.emptyTitle}>No Documents</Text>
              <Text style={s.emptyDesc}>
                There are no {filter.replace('_', ' ')} documents right now.
              </Text>
            </View>
          }
        />
      ))}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    ...CARD_SHADOW,
  },
  filterBtnActive: {
    backgroundColor: T.primary,
  },
  filterBtnInactive: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  filterText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  filterTextInactive: {
    color: T.text2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  docType: {
    fontSize: 12,
    fontWeight: "700",
    color: T.accentMid,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "700",
    color: T.text1,
  },
  submittedText: {
    fontSize: 11,
    color: T.text3,
    marginTop: 4,
    fontWeight: "600",
  },
  fileBtn: {
    width: 44,
    height: 44,
    backgroundColor: T.bg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 12,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.error,
    backgroundColor: T.errorBg,
    alignItems: "center",
  },
  rejectText: {
    color: T.error,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: T.primary,
    alignItems: "center",
    ...CARD_SHADOW,
  },
  approveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: T.text3,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});
