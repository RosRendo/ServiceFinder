import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';

export default function MeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const T = { bg: '#F7F8FC', surface: '#FFFFFF', text1: '#0A192F', text2: '#475569', text3: '#94A3B8', accent: '#0A192F', success: '#00A699', border: '#E8EEF4', danger: '#EF4444' };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={s.profileHeader}>
          <Image 
            source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=11' }} 
            style={s.avatar}
          />
          <View style={s.profileInfo}>
            <Text style={s.name}>{user?.fullName || "Staff Member"}</Text>
            <Text style={s.role}>{user?.staffProfile?.role ? (user.staffProfile.role.charAt(0).toUpperCase() + user.staffProfile.role.slice(1)) : 'Worker'}</Text>
          </View>
        </View>

        {/* Section: Activity */}
        <Text style={s.sectionTitle}>Activity</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/history')}>
            <MaterialCommunityIcons name="history" size={24} color={T.text2} />
            <Text style={s.rowText}>Job History</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={T.border} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/payout')}>
            <MaterialCommunityIcons name="wallet-outline" size={24} color={T.text2} />
            <Text style={s.rowText}>Wallet & Payouts</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={T.border} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Removed Equipment Mockup */}

        {/* Section: Support */}
        <Text style={s.sectionTitle}>Support</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.rowItem}>
            <MaterialCommunityIcons name="headphones" size={24} color={T.text2} />
            <Text style={s.rowText}>Contact Dispatch</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={T.border} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem}>
            <MaterialCommunityIcons name="shield-alert-outline" size={24} color={T.danger} />
            <Text style={[s.rowText, { color: T.danger }]}>Report Emergency</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Account */}
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.rowItem} onPress={() => router.push('/(staff)/edit-profile')}>
            <MaterialCommunityIcons name="account-edit-outline" size={24} color={T.text2} />
            <Text style={s.rowText}>Edit Profile</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={T.border} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.rowItem} onPress={async () => { await logout(); router.replace('/login'); }}>
            <MaterialCommunityIcons name="logout" size={24} color={T.danger} />
            <Text style={[s.rowText, { color: T.danger }]}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { padding: 24, paddingBottom: 100 },
  
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8EEF4' },
  profileInfo: { marginLeft: 16 },
  name: { fontSize: 24, fontWeight: '800', color: '#0A192F' },
  role: { fontSize: 16, color: '#475569', marginTop: 4 },
  
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 24 },
  
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.05, shadowRadius: 24 },
  rowItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowText: { fontSize: 16, fontWeight: '600', color: '#0A192F' },
  divider: { height: 1, backgroundColor: '#E8EEF4', marginLeft: 52, marginRight: 16 }
});
