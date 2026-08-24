import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';
import { useAuthStore } from '@/store/authStore';

export default function PayoutScreen() {
  const router = useRouter();
  const T = { bg: '#F7F8FC', surface: '#FFFFFF', text1: '#0A192F', text2: '#475569', text3: '#94A3B8', accent: '#0A192F', success: '#00A699', border: '#E8EEF4' };
  
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const [isQrVisible, setIsQrVisible] = useState(false);
  const [khqrImage, setKhqrImage] = useState<string | null>(null);
  const [isUploadingKhqr, setIsUploadingKhqr] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/staff/wallet');
        setWallet(res.data);
        if (res.data?.khqrImageUrl) {
          setKhqrImage(res.data.khqrImageUrl);
        }
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

  const handleUploadKHQR = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingKhqr(true);
        const uri = result.assets[0].uri;
        
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'khqr.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const uploadedUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
        
        if (uploadedUrl) {
          await api.post('/api/staff/wallet/khqr', { khqrImageUrl: uploadedUrl });
          setKhqrImage(uploadedUrl);
          Alert.alert("Success", "KHQR image uploaded successfully!");
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not upload KHQR image.");
    } finally {
      setIsUploadingKhqr(false);
    }
  };

  const bal = wallet?.walletBalance || 0;
  const transactions = wallet?.transactions || [];

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
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
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' }}>
              <TouchableOpacity style={[s.withdrawBtn, { flex: 1 }]} onPress={handleWithdraw}>
                <Text style={s.withdrawBtnText}>Request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.qrBtn, { flex: 1 }]} onPress={() => setIsQrVisible(true)}>
                <MaterialCommunityIcons name="qrcode" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.qrBtnText}>My KHQR</Text>
              </TouchableOpacity>
            </View>
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

      {/* Mobile KHQR Display Modal */}
      <Modal visible={isQrVisible} transparent={true} animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <TouchableOpacity style={s.modalClose} onPress={() => setIsQrVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#0A192F" />
            </TouchableOpacity>
            
            <Text style={s.modalTitle}>My KHQR</Text>
            <Text style={s.modalSub}>Upload your KHQR for admins to process your payouts.</Text>

            <View style={s.qrBorderContainer}>
              <Text style={s.qrLabel}>Your KHQR Image</Text>
              
              {khqrImage ? (
                <Image 
                  source={{ uri: khqrImage }}
                  style={s.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[s.qrImage, { backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }]}>
                  <MaterialCommunityIcons name="qrcode-scan" size={48} color="#94A3B8" />
                  <Text style={{ marginTop: 12, color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>No KHQR Uploaded</Text>
                </View>
              )}
              
              <Text style={s.qrName}>{user?.fullName || 'Staff Member'}</Text>
              <Text style={s.qrPhone}>{user?.phone || '012345678'}</Text>
              
              <TouchableOpacity style={s.uploadBtn} onPress={handleUploadKHQR} disabled={isUploadingKhqr}>
                {isUploadingKhqr ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="upload" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={s.uploadBtnText}>{khqrImage ? 'Replace Image' : 'Upload Image'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.modalBtn} onPress={() => setIsQrVisible(false)}>
              <Text style={s.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  qrBtn: { backgroundColor: '#00A699', paddingVertical: 14, borderRadius: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  qrBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 32, padding: 32, width: '100%', alignItems: 'center', position: 'relative' },
  modalClose: { position: 'absolute', top: 20, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0A192F', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 24, paddingHorizontal: 10 },
  qrBorderContainer: { borderWidth: 4, borderColor: '#00A699', borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.05, shadowRadius: 16, width: '100%', marginBottom: 24 },
  qrLabel: { fontSize: 10, fontWeight: '900', color: '#00A699', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  qrImage: { width: 180, height: 180, borderRadius: 12 },
  qrName: { fontSize: 15, fontWeight: '800', color: '#0A192F', marginTop: 12 },
  qrPhone: { fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  uploadBtn: { backgroundColor: '#00A699', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 100, flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  uploadBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalBtn: { backgroundColor: '#0A192F', width: '100%', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

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
