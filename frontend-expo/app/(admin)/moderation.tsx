import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";

type ModerationStatus = "pending" | "resolved" | "dismissed";
type ModerationType = "review" | "profile" | "message" | "other";

interface FlaggedItem {
  id: string;
  type: ModerationType;
  reportedBy: { id: string; name: string };
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  status: ModerationStatus;
  createdAt: string;
}

export default function ModerationQueue() {
  const router = useRouter();
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ModerationStatus>("pending");

  const fetchQueue = async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const res = await api.get(`/api/admin/moderation`, { params: { status: filter } });
      setItems(res.data?.data || res.data || []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const handleAction = (id: string, action: "resolve" | "dismiss" | "ban") => {
    Alert.alert(
      `Confirm Action`,
      `Are you sure you want to ${action} this report?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          style: action === "ban" ? "destructive" : "default",
          onPress: async () => {
            try {
              await api.post(`/api/admin/moderation/${id}/action`, { action });
              setItems(prev => prev.filter(item => item.id !== id));
            } catch (err) {
              Alert.alert("Error", "Failed to apply action.");
            }
          }
        }
      ]
    );
  };


  const getTypeIcon = (type: ModerationType) => {
    switch (type) {
      case "review": return "star-off";
      case "profile": return "account-alert";
      case "message": return "message-alert";
      default: return "flag";
    }
  };

  const renderItem = ({ item }: { item: FlaggedItem }) => (
    <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 border border-surface-container shadow-sm mx-4">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-error-container items-center justify-center">
            <MaterialCommunityIcons name={getTypeIcon(item.type)} size={16} color="#93000a" />
          </View>
          <View>
            <Text className="text-sm font-bold text-on-surface uppercase tracking-wider">{item.reason}</Text>
            <Text className="text-[10px] text-on-surface-variant">Reported by {item.reportedBy.name}</Text>
          </View>
        </View>
        <Text className="text-xs text-on-surface-variant font-medium">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View className="bg-surface-container-low p-3 rounded-xl mb-4">
        <Text className="text-xs font-bold text-on-surface mb-1">Target: {item.targetName}</Text>
        <Text className="text-sm text-on-surface-variant italic">"{item.details}"</Text>
      </View>

      {item.status === "pending" && (
        <View className="flex-row gap-2 border-t border-surface-container pt-3">
          <TouchableOpacity 
            onPress={() => handleAction(item.id, "dismiss")}
            className="flex-1 py-2 rounded-lg border border-outline-variant items-center"
          >
            <Text className="text-on-surface-variant font-bold text-xs">Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleAction(item.id, "resolve")}
            className="flex-1 py-2 rounded-lg bg-primary items-center"
          >
            <Text className="text-white font-bold text-xs">Remove Content</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleAction(item.id, "ban")}
            className="flex-1 py-2 rounded-lg bg-error items-center"
          >
            <Text className="text-white font-bold text-xs">Ban User</Text>
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
        <Text className="text-lg font-bold text-primary ml-2 flex-1 font-headline">Content Moderation</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 py-3 gap-2">
        {(["pending", "resolved", "dismissed"] as ModerationStatus[]).map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            className={`flex-1 py-2 rounded-full items-center ${
              filter === status ? "bg-[#002045]" : "bg-surface-container"
            }`}
          >
            <Text className={`text-xs font-bold capitalize ${
              filter === status ? "text-white" : "text-on-surface-variant"
            }`}>
              {status}
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
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchQueue(true)} />}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <MaterialCommunityIcons name="shield-check" size={48} color="#9CA3AF" />
              <Text className="text-on-surface font-bold text-lg mt-4 text-center">All Clear!</Text>
              <Text className="text-on-surface-variant text-sm text-center mt-2">
                No {filter} moderation reports found.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
