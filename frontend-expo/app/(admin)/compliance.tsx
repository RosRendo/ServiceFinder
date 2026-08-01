import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";

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
    <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 border border-surface-container shadow-sm mx-4">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-bold text-primary uppercase tracking-wider mb-1">
            {getTypeLabel(item.documentType)}
          </Text>
          <Text className="text-lg font-bold text-on-surface font-headline">{item.companyName}</Text>
          <Text className="text-[10px] text-on-surface-variant mt-1">
            Submitted: {new Date(item.submittedAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => Linking.openURL(item.documentUrl).catch(() => {})}
          className="w-12 h-12 bg-surface-container rounded-xl items-center justify-center"
        >
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#002045" />
        </TouchableOpacity>
      </View>

      {item.status === "pending_review" && (
        <View className="flex-row gap-3 border-t border-surface-container pt-4 mt-2">
          <TouchableOpacity 
            onPress={() => updateStatus(item.id, "rejected")}
            className="flex-1 py-3 rounded-xl border border-error items-center bg-error-container/20"
          >
            <Text className="text-error font-bold text-xs uppercase tracking-widest">Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => updateStatus(item.id, "approved")}
            className="flex-1 py-3 rounded-xl bg-primary items-center shadow-sm"
          >
            <Text className="text-white font-bold text-xs uppercase tracking-widest">Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-surface-container">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 active:scale-95">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#002045" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-primary ml-2 flex-1 font-headline">Compliance Tracker</Text>
      </View>

      {/* Filters */}
      <View className="flex-row px-4 py-3 gap-2">
        {(["pending_review", "approved", "expired"] as ComplianceStatus[]).map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            className={`flex-1 py-2 rounded-full items-center ${
              filter === status ? "bg-[#002045]" : "bg-surface-container"
            }`}
          >
            <Text className={`text-[10px] font-bold uppercase tracking-widest ${
              filter === status ? "text-white" : "text-on-surface-variant"
            }`}>
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#002045" />
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={item => item.id}
          renderItem={renderDoc}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDocs(true)} />}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <MaterialCommunityIcons name="file-check-outline" size={48} color="#9CA3AF" />
              <Text className="text-on-surface font-bold text-lg mt-4 text-center">No Documents</Text>
              <Text className="text-on-surface-variant text-sm text-center mt-2">
                There are no {filter.replace('_', ' ')} documents right now.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
