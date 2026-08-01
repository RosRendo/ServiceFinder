import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';

export default function PayoutScreen() {
  const router = useRouter();
  const T = { bg: '#F7F8FC', surface: '#FFFFFF', text1: '#0A192F', text2: '#475569', text3: '#94A3B8', accent: '#0A192F', success: '#00A699', border: '#E8EEF4' };
  
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/staff/wallet');
        setWallet(res.data);
      } catch (err) {
        console.warn("Failed to load wallet", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleWithdraw = () => {
    if (bal <= 0) {
      Alert.alert("Error", "You have no funds available to withdraw.");
      return;
    }
    Alert.alert(
      "Withdraw Funds",
      "Are you sure you want to request a payout to your registered bank account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
             try {
               await api.post('/api/staff/payouts/request', { amount: bal, method: 'bank_transfer' });
               Alert.alert("Success", "Payout request submitted. Funds will arrive in 2-3 business days.");
               // Reload wallet data
               const res = await api.get('/api/staff/wallet');
               setWallet(res.data);
             } catch (err: any) {
               Alert.alert("Failed", err.response?.data?.message || "Could not request payout.");
             }
          } 
        }
      ]
    );
  };

  const bal = wallet?.walletBalance || 0;
  const transactions = wallet?.transactions || [];

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0A192F" />
        </TouchableOpacity>
        <Text style={s.title}>Wallet & Payouts</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          
          <View style={s.balanceCard}>
            <Text style={s.balanceLabel}>Available Balance</Text>
            <Text style={s.balanceAmount}>${Number(bal).toFixed(2)}</Text>
            
            <TouchableOpacity style={s.withdrawBtn} onPress={handleWithdraw}>
              <Text style={s.withdrawBtnText}>Request Payout</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={s.sectionTitle}>Recent Transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="receipt" size={48} color={T.border} />
              <Text style={s.emptyText}>No recent transactions.</Text>
            </View>
          ) : (
            transactions.map((t: any, idx: number) => {
              const d = new Date(t.createdAt);
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const isCredit = t.type === 'CREDIT';
              
              return (
                <View key={t.id || idx} style={s.txRow}>
                  <View style={[s.txIcon, { backgroundColor: isCredit ? '#E6F6F5' : '#FEE2E2' }]}>
                    <MaterialCommunityIcons 
                      name={isCredit ? "arrow-bottom-left" : "arrow-top-right"} 
                      size={20} 
                      color={isCredit ? T.success : '#EF4444'} 
                    />
                  </View>
                  <View style={s.txInfo}>
                    <Text style={s.txDesc}>{t.description || (isCredit ? "Job Earnings" : "Payout")}</Text>
                    <Text style={s.txDate}>{dateStr}</Text>
                  </View>
                  <Text style={[s.txAmount, { color: isCredit ? T.success : '#EF4444' }]}>
                    {isCredit ? '+' : '-'}${Number(t.amount).toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
          
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0A192F' },
  content: { padding: 24, paddingBottom: 100 },
  
  balanceCard: { backgroundColor: '#0A192F', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 32, shadowColor: '#000', shadowOffset: {width:0, height:12}, shadowOpacity: 0.1, shadowRadius: 24 },
  balanceLabel: { fontSize: 14, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  balanceAmount: { fontSize: 48, fontWeight: '800', color: '#fff', marginVertical: 12 },
  withdrawBtn: { backgroundColor: '#00A699', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 100, marginTop: 16 },
  withdrawBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0A192F', marginBottom: 16 },
  
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12 },
  txIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 16 },
  txDesc: { fontSize: 16, fontWeight: '700', color: '#0A192F' },
  txDate: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: '800' },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94A3B8', marginTop: 12, fontSize: 15 }
});
