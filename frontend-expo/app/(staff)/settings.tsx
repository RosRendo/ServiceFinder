import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/store/authStore';

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A", text1: "#111827", text2: "#717171", text3: "#B0B0B0"
};

export default function StaffSettings() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(true);

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

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.content}>
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

        <Text style={s.sectionTitle}>PREFERENCES</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} activeOpacity={0.7}>
            <Text style={s.rowText}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={T.text3} />
          </TouchableOpacity>
        </View>
      </View>
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
