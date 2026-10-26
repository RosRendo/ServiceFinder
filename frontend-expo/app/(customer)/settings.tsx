import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore, api } from '@/store/authStore';
import MfaSetupModal from '@/components/admin/MfaSetupModal';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Theme } from "@/constants/theme";

const T = Theme.colors;

export default function CustomerSettings() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [mfaModalVisible, setMfaModalVisible] = React.useState(false);
  const { deleteAccount, user } = useAuthStore();

  React.useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await api.get('/api/users/me/preferences');
        const data = res.data?.data || res.data;
        if (data.pushNotificationsEnabled !== undefined) setPushEnabled(data.pushNotificationsEnabled);
        if (data.emailNotificationsEnabled !== undefined) setEmailEnabled(data.emailNotificationsEnabled);
      } catch (e) {
        console.error("Failed to load preferences", e);
      }
    };
    fetchPrefs();
  }, []);

  const handleTogglePush = async (val: boolean) => {
    setPushEnabled(val);
    try {
      await api.patch('/api/users/me/preferences', { pushNotificationsEnabled: val });
    } catch (e) {
      setPushEnabled(!val);
    }
  };

  const handleToggleEmail = async (val: boolean) => {
    setEmailEnabled(val);
    try {
      await api.patch('/api/users/me/preferences', { emailNotificationsEnabled: val });
    } catch (e) {
      setEmailEnabled(!val);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteAccount();
              // Auth layout handles redirect automatically when user becomes null
            } catch (e) {
              Alert.alert("Error", "Failed to delete account. Please try again later.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 40 }}>

        <LanguageSwitcher />

        <Text style={s.sectionTitle}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowText}>Push Notifications</Text>
            <Switch value={pushEnabled} onValueChange={handleTogglePush} trackColor={{ true: T.accentMid }} />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowText}>Email Updates</Text>
            <Switch value={emailEnabled} onValueChange={handleToggleEmail} trackColor={{ true: T.accentMid }} />
          </View>
        </View>

        <Text style={s.sectionTitle}>PRIVACY & SECURITY</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => router.push("/(customer)/change-password" as any)}>
            <Text style={s.rowText}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => setMfaModalVisible(true)}>
            <View>
              <Text style={s.rowText}>Two-Factor Auth</Text>
              <Text style={{ color: T.text3, fontSize: 12, marginTop: 2 }}>Enhance account security</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => router.push("/legal/privacy" as any)}>
            <Text style={s.rowText}>Privacy Policy</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>DANGER ZONE</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={handleDeleteAccount}>
            <Text style={[s.rowText, { color: T.error }]}>Delete Account</Text>
            <MaterialCommunityIcons name="delete-outline" size={24} color={T.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <MfaSetupModal
        visible={mfaModalVisible}
        onClose={() => setMfaModalVisible(false)}
        onSuccess={() => {
          setMfaModalVisible(false);
          Alert.alert("Success", "Two-Factor Authentication is now enabled.");
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: T.text3, marginTop: 24, marginBottom: 8, marginLeft: 8 },
  card: { backgroundColor: T.surface, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: T.border },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  rowText: { fontSize: 15, fontWeight: "600", color: T.text1 },
  divider: { height: 1, backgroundColor: T.border, marginLeft: 16 },
});
