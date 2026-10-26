import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../utils/api';

export default function MeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [alerting, setAlerting] = useState(false);
  const companyId = (user as any)?.staffProfile?.companyId || (user as any)?.companyId;
  const T = {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text1: '#0F172A',
    text2: '#475569',
    text3: '#94A3B8',
    accent: '#0F172A',
    success: '#059669',
    border: '#E2E8F0',
    danger: '#DC2626',
    chevron: '#94A3B8',
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Dossier Card */}
        <View style={s.profileHeader}>
          <Image 
            source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Staff')}&background=0F172A&color=fff&size=150` }} 
            style={s.avatar}
          />
          <View style={s.profileInfo}>
            <Text style={s.name}>{user?.fullName || "Staff Member"}</Text>
            <Text style={s.role}>{user?.staffProfile?.role ? (user.staffProfile.role.charAt(0).toUpperCase() + user.staffProfile.role.slice(1)) : 'Field Technician'}</Text>
          </View>
        </View>

        {/* Section: Schedule */}
        <Text style={s.sectionTitle}>Schedule</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/availability')}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color={T.text2} />
            <Text style={s.rowText}>My Availability</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/timeoff')}>
            <MaterialCommunityIcons name="calendar-remove" size={22} color={T.text2} />
            <Text style={s.rowText}>Request Time Off</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Section: Activity */}
        <Text style={s.sectionTitle}>Activity & Performance</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/history')}>
            <MaterialCommunityIcons name="history" size={22} color={T.text2} />
            <Text style={s.rowText}>Job History</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/(tabs)/money' as any)}>
            <MaterialCommunityIcons name="cash-multiple" size={22} color={T.text2} />
            <Text style={s.rowText}>Earnings & Revenue</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/performance')}>
            <MaterialCommunityIcons name="chart-line" size={22} color={T.text2} />
            <Text style={s.rowText}>My Performance</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Section: Support */}
        <Text style={s.sectionTitle}>Support</Text>
        <View style={s.card}>
          <TouchableOpacity 
            style={s.rowItem} 
            onPress={() => {
              if (companyId) {
                router.push({ pathname: '/(staff)/messages/new', params: { companyId: String(companyId) } } as any);
              } else {
                Alert.alert(
                  "Contact Dispatch",
                  "No linked company found on your profile yet. Ask your company admin for a profile update, or create a support ticket from Report Emergency below.",
                  [{ text: "OK", style: "cancel" }]
                );
              }
            }}
          >
            <MaterialCommunityIcons name="headphones" size={22} color={T.text2} />
            <Text style={s.rowText}>Contact Dispatch</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity 
            style={s.rowItem}
            onPress={() => {
              Alert.alert(
                "Report Emergency",
                "Call emergency services or send an urgent alert to your dispatch desk?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Call Emergency 911", 
                    style: "destructive", 
                    onPress: () => { Linking.openURL('tel:911').catch(() => Alert.alert("Error", "Could not open the dialer.")); } 
                  },
                  { 
                    text: alerting ? "Sending…" : "Alert Dispatcher", 
                    onPress: async () => {
                      setAlerting(true);
                      try {
                        await api.post('/api/support/tickets', {
                          subject: `EMERGENCY ALERT — ${user?.name || 'staff'}`,
                          message: `Emergency alert raised from the staff app. Please check on the staff member immediately.`,
                        });
                        Alert.alert("Alert Sent", "An emergency ticket was created. Dispatch will follow up. Stay safe.");
                      } catch (e: any) {
                        const msg = e?.response?.data?.message ?? "Could not reach the server.";
                        Alert.alert("Not Sent", Array.isArray(msg) ? msg.join(", ") : msg);
                      } finally {
                        setAlerting(false);
                      }
                    }
                  }
                ]
              );
            }}
          >
            <MaterialCommunityIcons name="shield-alert-outline" size={22} color={T.danger} />
            <Text style={[s.rowText, { color: T.danger }]}>Report Emergency</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Account */}
        <Text style={s.sectionTitle}>Account & Settings</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/edit-profile')}>
            <MaterialCommunityIcons name="account-edit-outline" size={22} color={T.text2} />
            <Text style={s.rowText}>Edit Profile</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/change-password')}>
            <MaterialCommunityIcons name="lock-reset" size={22} color={T.text2} />
            <Text style={s.rowText}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/settings')}>
            <MaterialCommunityIcons name="cog-outline" size={22} color={T.text2} />
            <Text style={s.rowText}>Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={T.chevron} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem} onPress={async () => { await logout(); router.replace('/(public)/login' as any); }}>
            <MaterialCommunityIcons name="logout" size={22} color={T.danger} />
            <Text style={[s.rowText, { color: T.danger }]}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 120 },
  
  profileHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 18, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 8,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9' },
  profileInfo: { marginLeft: 16, flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  role: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2 },
  
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    padding: 4, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 6,
    elevation: 1,
  },
  rowItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 48, marginRight: 14 }
});
