import React, { useState, useCallback, useRef, useEffect } from "react";
import { Image } from "expo-image";
import {
  Text, View, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, StyleSheet, Platform, ScrollView, Animated, Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import ErrorState from "@/components/common/ErrorState";
import InitialsAvatar from "@/components/common/InitialsAvatar";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { Theme } from "@/constants/theme";
import { MobileStatusPill } from "@/components/admin/ManagementCard";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
const FlashList = ShopifyFlashList as any;

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

const FAB_SHADOW = Platform.select({
  ios: { shadowColor: T.accentMid, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14 },
  android: { elevation: 8 },
});

// Default center (Phnom Penh, Cambodia)
const BASE_LAT = 11.5564;
const BASE_LNG = 104.9282;

const PulseDot = ({ color }: { color: string }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 2.5, duration: 1500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 0, useNativeDriver: true })
        ])
      ])
    ).start();
  }, []);

  return (
    <View style={s.pulseWrap}>
      <Animated.View style={[s.pulseRing, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[s.pulseCore, { backgroundColor: color }]} />
    </View>
  );
};

export default function Staff() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  const handleSelectStaff = (member: any) => {
    setSelectedStaff(member);
    const lat = Number(member.latitude) || BASE_LAT;
    const lng = Number(member.longitude) || BASE_LNG;
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        800
      );
    }
  };

  const filters = [
    { id: "all", label: "All Staff" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  const loadStaff = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); } else { setLoading(true); }
    try {
      const response = await api.get("/api/companies/my-company/staff");
      let data = response.data;
      if (data && data.success) data = data.data;
      if (data && data.data) data = data.data; // Pagination wrap
      setStaffList(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch (error) {
      console.error("Failed to load staff", error);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadStaff(); }, [loadStaff]));

  const filteredStaff = staffList.filter((m) => {
    const matchesSearch = (m.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                          (m.role?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeFilter === "active") return m.status === "active";
    if (activeFilter === "inactive") return m.status !== "active";
    return true;
  });

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "company_admin": return T.error;
      case "supervisor": return T.blue;
      case "worker": return T.gray;
      default: return T.success;
    }
  };

  const getStatusStyle = (status: string) => {
    return status === 'active' 
      ? { bg: T.success + "15", color: T.success }
      : { bg: T.warning + "15", color: T.warning };
  };

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top', 'left', 'right']} style={s.headerArea}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity onPress={() => setCompanyOpen(true)} style={s.menuBtn} accessibilityRole="button" accessibilityLabel="Open menu">
              <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Fleet Map</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={s.mapContainer}>
        {/* Floating Quick Detail Card Overlay on Map */}
        {selectedStaff && (
          <View style={s.selectedCard}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setSelectedStaff(null)}>
              <MaterialCommunityIcons name="close" size={18} color={T.text2} />
            </TouchableOpacity>
            <View style={s.selectedHeader}>
              {selectedStaff.user?.avatar || selectedStaff.avatar ? (
                <Image source={{ uri: selectedStaff.user?.avatar || selectedStaff.avatar }} style={s.selectedAvatar} />
              ) : (
                <InitialsAvatar name={selectedStaff.fullName || "S"} size={44} style={s.selectedAvatar} />
              )}
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={s.selectedName} numberOfLines={1}>{selectedStaff.fullName}</Text>
                  <View style={[s.statusBadge, { backgroundColor: getStatusStyle(selectedStaff.status).bg }]}>
                    <Text style={[s.statusText, { color: getStatusStyle(selectedStaff.status).color }]}>
                      {selectedStaff.status || "inactive"}
                    </Text>
                  </View>
                </View>
                <Text style={s.selectedRole}>{selectedStaff.role?.replace("_", " ") || "Staff Member"}</Text>
              </View>
            </View>

            <View style={s.selectedActions}>
              {selectedStaff.phone ? (
                <TouchableOpacity
                  style={s.actionCallBtn}
                  onPress={() => Linking.openURL(`tel:${selectedStaff.phone}`)}
                >
                  <MaterialCommunityIcons name="phone" size={16} color="#FFF" />
                  <Text style={s.actionCallText}>Call</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={s.actionDetailBtn}
                onPress={() => router.push(`/(company)/staff/${selectedStaff.id}` as any)}
              >
                <MaterialCommunityIcons name="account-details" size={16} color={T.accent} />
                <Text style={s.actionDetailText}>View Details & Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {Platform.OS !== 'web' ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: BASE_LAT,
              longitude: BASE_LNG,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
          >
            {filteredStaff.map((member) => {
              const latVal = member.latitude ?? member.user?.latitude;
              const lngVal = member.longitude ?? member.user?.longitude;
              const loc = { 
                latitude: latVal != null ? Number(latVal) : BASE_LAT, 
                longitude: lngVal != null ? Number(lngVal) : BASE_LNG 
              };
              const isAct = member.status === 'active';
              const isSel = selectedStaff?.id === member.id;
              return (
                <Marker 
                  key={member.id} 
                  coordinate={loc} 
                  title={member.fullName}
                  onPress={() => handleSelectStaff(member)}
                >
                  <View style={[s.markerContainer, isSel && { transform: [{ scale: 1.25 }] }]}>
                    {isAct && <PulseDot color={T.success} />}
                    {member.user?.avatar || member.avatar ? (
                      <Image
                        source={{ uri: member.user?.avatar || member.avatar }}
                        style={[s.markerAvatar, !isAct && s.markerAvatarInactive, isSel && { borderColor: T.accent, borderWidth: 3 }]}
                      />
                    ) : (
                      <InitialsAvatar
                        name={member.fullName || "S"}
                        size={30}
                        style={!isAct ? s.markerAvatarInactive : undefined}
                      />
                    )}
                  </View>
                </Marker>
              );
            })}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' }]}>
             <MaterialCommunityIcons name="map-marker-off" size={48} color="#94A3B8" />
             <Text style={{ marginTop: 8, color: "#64748B", fontWeight: '600' }}>Map unavailable on Web</Text>
          </View>
        )}
      </View>

      <View style={s.listContainer}>
        {/* Search & Filters */}
        <View style={s.filtersContainer}>
          <View style={s.searchBox}>
            <MaterialCommunityIcons name="magnify" size={22} color={T.text3} />
            <TextInput
              placeholder="Search fleet..."
              placeholderTextColor={T.text3}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={s.searchInput}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialCommunityIcons name="close-circle" size={20} color={T.text3} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChips}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  style={[s.filterChip, isActive && s.filterChipActive]}
                >
                  <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>{filter.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Staff List */}
        {loading && !refreshing ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={T.accent} />
          </View>
        ) : hasError && staffList.length === 0 ? (
          <ErrorState onRetry={() => { setLoading(true); loadStaff(); }} />
        ) : (
          <FlashList
            data={filteredStaff}
            keyExtractor={(item: any) => item.id?.toString()}
            estimatedItemSize={160}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStaff(true)} tintColor={T.accent} />}
            contentContainerStyle={s.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <MaterialCommunityIcons name="account-group" size={48} color={T.text3} style={{ marginBottom: 16 } as any} />
                <Text style={s.emptyText}>{searchQuery ? `No results for "${searchQuery}"` : "Your team is empty"}</Text>
                <Text style={s.emptySubText}>{searchQuery ? "Try a different name or role" : "Invite your first staff member to get started."}</Text>
              </View>
            }
            renderItem={({ item: member }: any) => {
              const sStyle = getStatusStyle(member.status);
              const isSelected = selectedStaff?.id === member.id;
              return (
                <TouchableOpacity
                  style={[s.userCard, isSelected && { borderColor: T.accent, borderWidth: 2 }]}
                  onPress={() => handleSelectStaff(member)}
                  activeOpacity={0.8}
                >
                  <View style={s.cardHeader}>
                    {member.user?.avatar || member.avatar ? (
                      <Image
                        source={{ uri: member.user?.avatar || member.avatar }}
                        style={s.avatar}
                      />
                    ) : (
                      <InitialsAvatar name={member.fullName || "S"} size={44} style={s.avatar} />
                    )}
                    <View style={s.cardHeaderInfo}>
                      <Text style={s.userName} numberOfLines={1}>{member.fullName || "Unknown"}</Text>
                      <Text style={s.userEmail} numberOfLines={1}>{member.email || "No Email"}</Text>
                    </View>
                    <MobileStatusPill status={member.status || "offline"} />
                  </View>

                  <View style={s.cardBody}>
                    <View style={s.infoBlock}>
                      <Text style={s.infoLabel}>Role</Text>
                      <View style={s.roleRow}>
                        <View style={[s.roleDot, { backgroundColor: getRoleColor(member.role) }]} />
                        <Text style={s.infoValue}>{member.role?.replace('_', ' ') || "Staff"}</Text>
                      </View>
                    </View>
                    <View style={s.infoBlock}>
                      <Text style={s.infoLabel}>Rating</Text>
                      <View style={s.roleRow}>
                        <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                        <Text style={s.infoValue}>{member.averageRating ? Number(member.averageRating).toFixed(1) : "N/A"}</Text>
                      </View>
                    </View>
                    <View style={s.infoBlock}>
                      <Text style={s.infoLabel}>Joined</Text>
                      <Text style={s.infoValue}>{member.joinedAt || member.createdAt ? new Date(member.joinedAt || member.createdAt).toLocaleDateString() : "-"}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={s.fab} 
        activeOpacity={0.9} 
        onPress={() => router.push("/(company)/staff/new" as any)}
      >
        <MaterialCommunityIcons name="account-plus" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  headerArea: { backgroundColor: T.surface, zIndex: 10, ...CARD_SHADOW },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.text1 },

  mapContainer: { flex: 0.45, backgroundColor: "#E2E8F0" },
  
  markerContainer: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  markerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#FFF" },
  markerAvatarInactive: { opacity: 0.5, borderColor: T.warning },
  
  pulseWrap: { position: "absolute", width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  pulseRing: { position: "absolute", width: 14, height: 14, borderRadius: 7 },
  pulseCore: { width: 10, height: 10, borderRadius: 5 },

  listContainer: { flex: 0.55, backgroundColor: T.bg },
  
  filtersContainer: { backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: T.bg,
    marginHorizontal: 16, marginTop: 16, paddingHorizontal: 16, borderRadius: 16, height: 48,
    borderWidth: 1, borderColor: T.border,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: T.text1, fontWeight: "500" },
  filterChips: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  filterChipText: { fontSize: 13, fontWeight: "600", color: T.text2 },
  filterChipTextActive: { color: "#fff" },

  listContent: { padding: 16, paddingBottom: 100 },
  loadingBox: { paddingVertical: 80, alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyText: { fontSize: 16, fontWeight: "700", color: T.text1 },
  emptySubText: { fontSize: 14, color: T.text3, marginTop: 4, textAlign: "center", paddingHorizontal: 32 },

  userCard: { backgroundColor: T.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: T.bg },
  cardHeaderInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700", color: T.text1, marginBottom: 2 },
  userEmail: { fontSize: 13, fontWeight: "500", color: T.text3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

  cardBody: { flexDirection: "row", backgroundColor: T.bg, borderRadius: 12, padding: 12, justifyContent: "space-between" },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", color: T.text3, marginBottom: 4, textTransform: "uppercase" },
  infoValue: { fontSize: 13, fontWeight: "700", color: T.text1, textTransform: "capitalize" },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleDot: { width: 8, height: 8, borderRadius: 4 },

  fab: {
    position: "absolute", bottom: 100, right: 24,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: T.accentMid,
    alignItems: "center", justifyContent: "center",
    ...FAB_SHADOW,
  },

  // Floating Staff Detail Card Overlay
  selectedCard: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 50,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  selectedHeader: { flexDirection: "row", alignItems: "center" },
  selectedAvatar: { width: 44, height: 44, borderRadius: 22 },
  selectedName: { fontSize: 15, fontWeight: "800", color: T.text1 },
  selectedRole: { fontSize: 12, fontWeight: "600", color: T.text2, marginTop: 2 },
  selectedActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  actionCallBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionCallText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
  actionDetailBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: T.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: T.border },
  actionDetailText: { fontSize: 12, fontWeight: "800", color: T.accent },
  closeBtn: { position: "absolute", top: 10, right: 10, padding: 4, zIndex: 10 },
});
