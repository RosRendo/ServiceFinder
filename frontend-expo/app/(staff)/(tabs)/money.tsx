import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../../../utils/api';

export default function MoneyScreen() {
  const T = { bg: '#F7F8FC', surface: '#FFFFFF', text1: '#0A192F', text2: '#475569', text3: '#94A3B8', accent: '#0A192F', success: '#00A699', border: '#E8EEF4' };

  const [perf, setPerf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today'|'weekly'>('today');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const res = await api.get('/api/staff/performance');
          if (isActive) setPerf(res.data.performance || res.data.data);
        } catch (err) {
          console.warn("Failed to load staff performance", err);
        } finally {
          if (isActive) setLoading(false);
        }
      })();
      return () => { isActive = false; };
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  const p = perf || {};
  const todayEarn = p.todayEarnings || 0;
  const weeklyEarn = p.weeklyEarnings || 0;
  const todayJobs = p.todayCompleted || 0;
  const weeklyJobs = p.weeklyCompleted || 0;
  
  const dailyTarget = 5;
  const jobsLeft = Math.max(0, dailyTarget - todayJobs);
  const dailyProgress = Math.min(100, (todayJobs / dailyTarget) * 100);

  const bonusTarget = 200;
  const bonusAway = Math.max(0, bonusTarget - weeklyEarn);
  const bonusProgress = Math.min(100, (weeklyEarn / bonusTarget) * 100);

  const avgRating = p.avgRating || 0;
  const compRate = p.completionRate || 0;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <Text style={s.headerTitle}>Motivation</Text>
        
        {/* Toggle */}
        <View style={s.toggleRow}>
          <TouchableOpacity 
            style={[s.toggleBtn, activeTab === 'today' && s.toggleActive]}
            onPress={() => setActiveTab('today')}
            activeOpacity={0.8}
          >
            <Text style={[s.toggleText, activeTab === 'today' && s.toggleTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.toggleBtn, activeTab === 'weekly' && s.toggleActive]}
            onPress={() => setActiveTab('weekly')}
            activeOpacity={0.8}
          >
            <Text style={[s.toggleText, activeTab === 'weekly' && s.toggleTextActive]}>This Week</Text>
          </TouchableOpacity>
        </View>
        
        {/* Main Earnings Card */}
        <View style={[s.heroCard, { backgroundColor: T.success }]}>
          <Text style={[s.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>
            {activeTab === 'today' ? "TODAY'S EARNINGS" : "WEEKLY EARNINGS"}
          </Text>
          <Text style={[s.statValue, { color: '#fff' }]}>
            +${activeTab === 'today' ? todayEarn.toFixed(2) : weeklyEarn.toFixed(2)}
          </Text>
          <Text style={[s.statSub, { color: 'rgba(255,255,255,0.9)' }]}>
            {activeTab === 'today' ? todayJobs : weeklyJobs} Jobs Completed
          </Text>
        </View>

        {/* Goals / Progress */}
        <Text style={s.sectionTitle}>Goals</Text>
        
        <View style={s.goalCard}>
          <View style={s.goalHeader}>
            <MaterialCommunityIcons name="flag-checkered" size={24} color={T.text1} />
            <Text style={s.goalTitle}>Daily Target ({dailyTarget} Jobs)</Text>
          </View>
          <Text style={s.goalBigText}>{jobsLeft > 0 ? `${jobsLeft} Jobs Left` : "Target Met!"}</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${dailyProgress}%`, backgroundColor: T.accent }]} />
          </View>
          <Text style={s.goalHint}>You usually finish by 4:00 PM</Text>
        </View>
        
        <View style={s.goalCard}>
          <View style={s.goalHeader}>
            <MaterialCommunityIcons name="medal" size={24} color="#F59E0B" />
            <Text style={s.goalTitle}>Weekly Silver Bonus</Text>
          </View>
          <Text style={s.goalBigText}>{bonusAway > 0 ? `$${bonusAway.toFixed(2)} Away` : "Bonus Unlocked!"}</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${bonusProgress}%`, backgroundColor: "#F59E0B" }]} />
          </View>
          <Text style={s.goalHint}>Extra $50 reward when reached!</Text>
        </View>

        {/* Performance */}
        <Text style={s.sectionTitle}>Performance</Text>
        
        <View style={s.rowCards}>
          <View style={[s.statCard, { flex: 1 }]}>
            <MaterialCommunityIcons name="star" size={28} color="#F59E0B" />
            <Text style={[s.statValue, { color: T.text1, marginTop: 8 }]}>{avgRating > 0 ? avgRating.toFixed(1) : 'New'}</Text>
            <Text style={[s.statSub, { color: T.success, fontWeight: '700' }]}>{avgRating >= 4.5 ? 'Excellent Work' : 'Good Standing'}</Text>
          </View>
          
          <View style={{ width: 16 }} />
          
          <View style={[s.statCard, { flex: 1 }]}>
            <MaterialCommunityIcons name="check-decagram" size={28} color={T.success} />
            <Text style={[s.statValue, { color: T.text1, marginTop: 8 }]}>{compRate}%</Text>
            <Text style={s.statSub}>Completion Rate</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { padding: 24, paddingBottom: 100 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#0A192F', marginBottom: 24 },
  
  rowCards: { flexDirection: 'row', width: '100%' },
  statCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.05, shadowRadius: 24 },
  statLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  statValue: { fontSize: 32, fontWeight: '800', marginTop: 8 },
  statSub: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 4 },
  
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0A192F', marginTop: 32, marginBottom: 16 },
  
  goalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.05, shadowRadius: 24, marginBottom: 16 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#475569' },
  goalBigText: { fontSize: 28, fontWeight: '800', color: '#0A192F', marginTop: 12 },
  progressBar: { width: '100%', height: 12, backgroundColor: '#F0F4F8', borderRadius: 6, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  goalHint: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginTop: 12 },
  
  toggleRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: '#F0F4F8' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  toggleTextActive: { color: '#0A192F' },
  
  heroCard: { borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.1, shadowRadius: 24, alignItems: 'center' }
});
