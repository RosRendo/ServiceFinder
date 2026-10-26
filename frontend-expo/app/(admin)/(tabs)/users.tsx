/**
 * Admin Users List — Premium Light Bento Redesign
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Platform, ScrollView, Modal, Alert, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { useSidebarStore } from "@/store/sidebarStore";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import ErrorState from "@/components/common/ErrorState";
import InitialsAvatar from "@/components/common/InitialsAvatar";
import { Theme } from "@/constants/theme";
const FlashList = ShopifyFlashList as any;

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function Users() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Add User modal state
  const [addUserVisible, setAddUserVisible] = useState(false);
  const [addUserSaving, setAddUserSaving] = useState(false);
  const [addUserFields, setAddUserFields] = useState({ fullName: "", email: "", phone: "", password: "", role: "customer" });
  const roleChoices = ["customer", "staff", "company_admin", "admin"];

  // t() is stable per language change; filters stay declarative and translate at render time.
  const filterIds = ["all", "customer", "staff", "company_admin", "admin"] as const;

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("limit", "50");
      if (activeFilter !== "all") queryParams.append("role", activeFilter);
      if (searchQuery) queryParams.append("search", searchQuery);

      const response = await api.get(`/api/admin/users?${queryParams.toString()}`);
      // Backend returns { success: true, data: [...], meta: {} }
      const data = response.data?.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
      setHasError(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, searchQuery]);


  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(timer);
  }, [activeFilter, searchQuery, fetchUsers]);

  const handleCreateUser = async () => {
    const f = addUserFields;
    if (!f.fullName.trim() || !f.email.trim() || !f.password.trim()) {
      Alert.alert("Missing Fields", "Full name, email and password are required.");
      return;
    }
    setAddUserSaving(true);
    try {
      await api.post("/api/users", {
        fullName: f.fullName.trim(),
        email: f.email.trim(),
        phone: f.phone.trim() || undefined,
        password: f.password.trim(),
        role: f.role,
      });
      setAddUserVisible(false);
      setAddUserFields({ fullName: "", email: "", phone: "", password: "", role: "customer" });
      Alert.alert("User Created", `${f.fullName.trim()} was created with the ${f.role} role.`);
      fetchUsers();
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message;
      Alert.alert("Error", Array.isArray(rawMsg) ? rawMsg.join("\n") : rawMsg || "Could not create user.");
    } finally {
      setAddUserSaving(false);
    }
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "admin": return { dotColor: "#DC2626", label: "System Admin", icon: "shield-account-outline" };
      case "company_admin": return { dotColor: "#2563EB", label: "Company Admin", icon: "domain" };
      case "staff": return { dotColor: "#64748B", label: "Service Staff", icon: "briefcase-account-outline" };
      default: return { dotColor: "#059669", label: "Customer", icon: "account-outline" };
    }
  };

  const getStatusStyle = (status: string) => {
    return status === 'active' 
      ? { bg: "#059669", color: "#fff", icon: "check" }
      : { bg: "#D97706", color: "#fff", icon: "pause" };
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => openSidebar(true)}
            style={s.menuBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.openMenu')}
          >
            <MaterialCommunityIcons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('adminDirectory.title')}</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.addUser')}
          onPress={() => setAddUserVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search & Filters (Sticky) */}
      <View style={s.filtersContainer}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            placeholder={t('adminDirectory.searchPlaceholder')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
            autoCapitalize="none"
            accessibilityLabel={t('adminDirectory.searchPlaceholder')}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel={t('common.clearSearch')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChips}>
            {filterIds.map((id) => {
              const isActive = activeFilter === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setActiveFilter(id)}
                  style={[s.filterChip, isActive && s.filterChipActive]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={t(`adminDirectory.filter.${id}`)}
                >
                  <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>{t(`adminDirectory.filter.${id}`)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* List - Using FlashList for Performance */}
      <View style={{ flex: 1 }}>
        {isLoading && !refreshing ? (
          <View style={s.loadingBox}><ActivityIndicator size="large" color="#0F172A" /></View>
        ) : hasError && users.length === 0 ? (
          <ErrorState onRetry={() => { setIsLoading(true); fetchUsers(); }} />
        ) : (
          <FlashList
            data={users}
            keyExtractor={(item: any) => item.id.toString()}
            estimatedItemSize={180}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} tintColor="#0F172A" />}
            contentContainerStyle={s.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <View style={s.emptyIconCircle}>
                  <MaterialCommunityIcons name="account-search-outline" size={38} color="#0F172A" />
                </View>
                <Text style={s.emptyText}>{t('adminDirectory.noResults')}</Text>
                {searchQuery ? <Text style={s.emptySubText}>{t('adminDirectory.tryAdjusting')}</Text> : null}
              </View>
            }
            renderItem={({ item: user }: any) => {
              const roleConfig = getRoleConfig(user.role);
              const statusStyle = getStatusStyle(user.status);
              const displayName = user.fullName ?? user.name ?? t('adminDirectory.fallbackName');

              return (
                <TouchableOpacity
                  style={s.bentoCard}
                  onPress={() => router.push(`/(admin)/users/${user.id}` as any)}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={`${displayName}, ${user.role}, ${user.email}`}
                >
                  {/* Top Header: Identity */}
                  <View style={s.bentoHeader}>
                    <View style={s.avatarWrap}>
                      <InitialsAvatar name={displayName} size={48} radius={14} />
                      <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <MaterialCommunityIcons name={statusStyle.icon as any} size={9} color={statusStyle.color} />
                      </View>
                    </View>
                    <View style={s.identityInfo}>
                      <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
                      <Text style={s.userEmail} numberOfLines={1}>{user.email}</Text>
                    </View>
                  </View>

                  {/* Bento Grid Layout for Secondary Data */}
                  <View style={s.bentoGrid}>
                    {/* Primary Bento Box: Role */}
                    <View style={[s.bentoBox, { flex: 1.5 }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
                        <View style={[s.statusDotSmall, { backgroundColor: roleConfig.dotColor }]} />
                        <Text style={s.bentoBoxValue} numberOfLines={1}>
                          {roleConfig.label}
                        </Text>
                      </View>
                      <Text style={s.bentoBoxLabel}>{t('adminDirectory.role')}</Text>
                    </View>

                    {/* Secondary Bento Box: ID */}
                    <View style={[s.bentoBox, { flex: 1 }]}>
                      <Text style={s.bentoBoxValue} numberOfLines={1}>#{user.id}</Text>
                      <Text style={s.bentoBoxLabel}>{t('adminDirectory.userId')}</Text>
                    </View>

                    {/* Secondary Bento Box: Joined */}
                    <View style={[s.bentoBox, { flex: 1 }]}>
                      <Text style={s.bentoBoxValue} numberOfLines={1}>
                        {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                      </Text>
                      <Text style={s.bentoBoxLabel}>{t('adminDirectory.joined')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Add User Modal */}
      <Modal visible={addUserVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddUserVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F8FAFC" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" }}>
              <TouchableOpacity onPress={() => setAddUserVisible(false)}>
                <Text style={{ fontSize: 15, color: "#64748B", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#0F172A" }}>Add User</Text>
              <View style={{ width: 52 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              {[
                { key: "fullName" as const, label: "Full Name *", placeholder: "e.g. Sok Dara", autoCap: "words" as const, secure: false },
                { key: "email" as const, label: "Email *", placeholder: "name@example.com", autoCap: "none" as const, secure: false },
                { key: "password" as const, label: "Password *", placeholder: "Set an initial password", autoCap: "none" as const, secure: true },
                { key: "phone" as const, label: "Phone (optional)", placeholder: "+855…", autoCap: "none" as const, secure: false },
              ].map((field) => (
                <View key={field.key} style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>{field.label}</Text>
                  <TextInput
                    style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: "#0F172A" }}
                    value={addUserFields[field.key]}
                    onChangeText={(v) => setAddUserFields((prev) => ({ ...prev, [field.key]: v }))}
                    placeholder={field.placeholder}
                    autoCapitalize={field.autoCap}
                    secureTextEntry={field.secure}
                    keyboardType={field.key === "phone" ? "phone-pad" : field.key === "email" ? "email-address" : "default"}
                  />
                </View>
              ))}

              <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Role</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                {roleChoices.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setAddUserFields((prev) => ({ ...prev, role: r }))}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
                      borderColor: addUserFields.role === r ? "#0F172A" : "#E2E8F0",
                      backgroundColor: addUserFields.role === r ? "#0F172A" : "#FFFFFF",
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: addUserFields.role === r }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: addUserFields.role === r ? "#FFFFFF" : "#475569" }}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={{ backgroundColor: "#0F172A", borderRadius: 12, paddingVertical: 15, alignItems: "center", justifyContent: "center" }}
                onPress={handleCreateUser}
                disabled={addUserSaving}
                accessibilityRole="button"
                accessibilityLabel="Create user"
              >
                {addUserSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Create User</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -6, padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", letterSpacing: -0.3 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },

  filtersContainer: { backgroundColor: "#F8FAFC", paddingBottom: 12, zIndex: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: "#0F172A", fontWeight: "500" },

  filterChips: { paddingHorizontal: 16, gap: 6, paddingBottom: 2 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  filterChipText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  filterChipTextActive: { color: "#FFFFFF" },

  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  emptySubText: { fontSize: 13, color: "#64748B", textAlign: "center", paddingHorizontal: 32 },

  /* BENTO CARD UI */
  bentoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...CARD_SHADOW,
  },
  bentoHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },

  avatarWrap: { position: "relative" },
  statusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },

  identityInfo: { flex: 1, justifyContent: "center" },
  userName: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 2, letterSpacing: -0.2 },
  userEmail: { fontSize: 12, fontWeight: "500", color: "#64748B" },

  bentoGrid: { flexDirection: "row", gap: 8 },
  bentoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
  },
  bentoBoxValue: { fontSize: 12, fontWeight: "800", color: "#0F172A", marginBottom: 2, letterSpacing: -0.1 },
  bentoBoxLabel: { fontSize: 9, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" },
});
