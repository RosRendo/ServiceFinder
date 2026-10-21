import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';

export default function HistoryScreen() {
  const router = useRouter();
  const T = {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text1: '#0F172A',
    text2: '#475569',
    text3: '#94A3B8',
    accent: '#0F172A',
    success: '#059669',
    border: '#E2E8F0',
  };
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/bookings/my-assignments?status=completed');
        const data = res.data?.bookings || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        const sorted = data.sort((a: any, b: any) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
        setJobs(sorted);
      } catch (err) {
        console.warn("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderJob = ({ item }: { item: any }) => {
    const d = new Date(item.bookingDate);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    return (
      <TouchableOpacity 
        style={s.card} 
        activeOpacity={0.7}
        onPress={() => router.push(`/(staff)/job/${item.id}`)}
      >
        <View style={s.cardHeader}>
          <View>
            <Text style={s.serviceName}>{item.service?.name || "Service"}</Text>
            <Text style={s.dateTime}>{dateStr} • {timeStr}</Text>
          </View>
          <Text style={s.price}>+${Number(item.staffEarnings || 0).toFixed(2)}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.metaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={T.text2} />
          <Text style={s.address} numberOfLines={1}>{item.serviceAddress}</Text>
        </View>
        <View style={s.metaRow}>
          <MaterialCommunityIcons name="account-outline" size={16} color={T.text2} />
          <Text style={s.address}>{item.customer?.fullName || "Customer"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.title}>Job History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJob}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={T.border} />
              <Text style={s.emptyTitle}>No Jobs Yet</Text>
              <Text style={s.emptySub}>Your completed jobs will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 16, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  listContent: { padding: 20, paddingBottom: 120 },
  
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    padding: 18, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 6, 
    elevation: 1 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  dateTime: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '800', color: '#059669' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  address: { fontSize: 14, color: '#475569', fontWeight: '500', flex: 1 },
  
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' }
});
