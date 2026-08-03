/**
 * Admin Settings — Premium Deep Navy Redesign
 */
import React, { useState, useEffect } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, Switch,
  StyleSheet, Platform, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSidebarStore } from "@/store/sidebarStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/utils/api";
import MfaSetupModal from "@/components/admin/MfaSetupModal";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = Theme.colors;



export default function Settings() {
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.setAdminOpen);
  const { logout } = useAuthStore();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/settings');
        const data = response.data || {};
        if (data.darkMode !== undefined) setDarkMode(data.darkMode);
        
        // Fetch User Preferences
        const prefsRes = await api.get('/api/users/me/preferences');
        const prefsData = prefsRes.data?.data || prefsRes.data;
        if (prefsData.pushNotificationsEnabled !== undefined) setNotifications(prefsData.pushNotificationsEnabled);
        if (prefsData.emailNotificationsEnabled !== undefined) setEmailAlerts(prefsData.emailNotificationsEnabled);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: boolean) => {
    try {
      if (key === 'notifications') {
        setNotifications(value);
        await api.patch('/api/users/me/preferences', { pushNotificationsEnabled: value });
        return;
      }
      if (key === 'emailAlerts') {
        setEmailAlerts(value);
        await api.patch('/api/users/me/preferences', { emailNotificationsEnabled: value });
        return;
      }
      
      switch (key) {
        case 'twoFactor':
          if (value) {
            setMfaModalVisible(true);
            return; // Don't call API yet, handled by modal
          } else {
            setTwoFactor(false);
          }
          break;
        case 'darkMode': setDarkMode(value); break;
      }
      if (key !== 'twoFactor') {
        await api.put('/api/settings', { [key]: value });
      }
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      switch (key) {
        case 'notifications': setNotifications(!value); break;
        case 'emailAlerts': setEmailAlerts(!value); break;
        case 'twoFactor': setTwoFactor(!value); break;
        case 'darkMode': setDarkMode(!value); break;
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(t('adminSettings.logOutTitle'), t('adminSettings.logOutConfirm'), [
      { text: t('adminSettings.cancel'), style: "cancel" },
      {
        text: t('adminSettings.logOutBtn'),
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const sections = [
    {
      title: t('adminSettings.accountSecurity'),
      icon: "shield-account",
      items: [
        { label: t('adminSettings.profileSettings'), subtitle: t('adminSettings.profileDesc'), icon: "account-edit", action: () => router.push("/(admin)/settings/profile" as any) },
        { label: t('adminSettings.changePassword'), subtitle: t('adminSettings.passwordDesc'), icon: "lock-reset", action: () => router.push("/(admin)/settings/password" as any) },
        { label: t('adminSettings.twoFactor'), subtitle: t('adminSettings.twoFactorDesc'), toggle: true, value: twoFactor, setValue: (v: boolean) => updateSetting('twoFactor', v) },
      ],
    },
    {
      title: t('adminSettings.notificationsTitle'),
      icon: "bell-outline",
      items: [
        { label: t('adminSettings.pushNotifications'), subtitle: t('adminSettings.pushDesc'), toggle: true, value: notifications, setValue: (v: boolean) => updateSetting('notifications', v) },
        { label: t('adminSettings.emailAlerts'), subtitle: t('adminSettings.emailDesc'), toggle: true, value: emailAlerts, setValue: (v: boolean) => updateSetting('emailAlerts', v) },
      ],
    },

    {
      title: t('adminSettings.platformSetup'),
      icon: "tune-variant",
      items: [
        { label: t('adminSettings.manageUsers'), subtitle: t('adminSettings.usersDesc'), icon: "account-multiple-check", action: () => router.push("/(admin)/(tabs)/users" as any) },
        { label: t('adminSettings.serviceCategories'), subtitle: t('adminSettings.categoriesDesc'), icon: "list-box-outline", action: () => router.push("/(admin)/categories" as any) },
      ],
    },
    {
      title: "Marketing & Communication",
      icon: "bullhorn-outline",
      items: [
        { label: "Push Broadcasts", subtitle: "Send platform-wide alerts", icon: "radio-tower", action: () => router.push("/(admin)/broadcasts" as any) },
        { label: "Promo Codes", subtitle: "Manage global discounts", icon: "ticket-percent-outline", action: () => router.push("/(admin)/promotions" as any) },
      ],
    },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => openSidebar(true)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('adminSettings.title')}</Text>
        </View>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((sec, sIdx) => (
          <View key={sIdx} style={s.section}>
            <View style={s.sectionHeader}>
              <MaterialCommunityIcons name={sec.icon as any} size={20} color={T.accent} />
              <Text style={s.sectionTitle}>{sec.title}</Text>
            </View>

            <View style={s.card}>
              {sec.items.map((item: any, iIdx) => {
                const isLast = iIdx === sec.items.length - 1;
                return (
                  <TouchableOpacity
                    key={iIdx}
                    style={[s.row, !isLast && s.rowBorder]}
                    onPress={() => {
                      if (item.action) item.action();
                      else if (item.route) router.push(item.route as any);
                    }}
                    disabled={item.toggle}
                    activeOpacity={0.7}
                  >
                    <View style={s.rowLeft}>
                      {item.icon && (
                        <View style={s.iconWrap}>
                          <MaterialCommunityIcons name={item.icon as any} size={22} color={T.text2} />
                        </View>
                      )}
                      <View style={s.rowText}>
                        <Text style={s.rowTitle}>{item.label}</Text>
                        <Text style={s.rowSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    
                    {item.toggle ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.setValue}
                        trackColor={{ false: T.border, true: T.success }}
                        thumbColor="#fff"
                      />
                    ) : (
                      <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={[s.section, { marginTop: 12 }]}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="alert-octagon-outline" size={20} color={T.error} />
            <Text style={[s.sectionTitle, { color: T.error }]}>{t('adminSettings.dangerZone')}</Text>
          </View>
          <View style={[s.card, { borderColor: T.error + "40" }]}>
            <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={handleLogout}>
              <View style={s.rowLeft}>
                <View style={[s.iconWrap, { backgroundColor: T.error + "10" }]}>
                  <MaterialCommunityIcons name="logout" size={22} color={T.error} />
                </View>
                <View style={s.rowText}>
                  <Text style={[s.rowTitle, { color: T.error }]}>{t('adminSettings.logoutOption')}</Text>
                  <Text style={s.rowSubtitle}>{t('adminSettings.logoutDesc')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <MfaSetupModal
        visible={mfaModalVisible}
        onClose={() => setMfaModalVisible(false)}
        onSuccess={() => {
          setMfaModalVisible(false);
          setTwoFactor(true);
          Alert.alert(t('adminSettings.success'), t('adminSettings.twoFactorEnabled'));
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { marginLeft: -8, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },

  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 24 },

  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: T.text1 },

  card: { backgroundColor: T.surface, borderRadius: 20, borderWidth: 1, borderColor: T.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: T.surface },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "700", color: T.text1, marginBottom: 2 },
  rowSubtitle: { fontSize: 13, color: T.text3, fontWeight: "500" },
});

